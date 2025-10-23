import { Router } from 'express';
import { getServerSupabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { sendError } from '../lib/error';

const router = Router();

// Request a signed upload URL (server generates key and signed URL)
router.post('/upload-url', async (req, res) => {
  try {
    let body: unknown = req.body;
    if (Buffer.isBuffer(body)) {
      try { body = JSON.parse(body.toString('utf8')); } catch {}
    } else if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch {}
    }
    const { filename } = (body || {}) as any;
    if (!filename) return res.status(400).json({ error: 'filename required' });
    const supabase = getServerSupabase();
    const bucket = process.env.SUPABASE_BUCKET || 'user-uploads';
    const key = `${uuidv4()}-${filename}`;
    // create signed url (valid for 1 hour)
    const { data, error } = await supabase.storage.from(bucket).createSignedUploadUrl(key, 60 * 60);
    if (error) return res.status(500).json({ error });
    res.json({ uploadUrl: data.signedUrl, key, bucket });
  } catch (err) {
    return sendError(res, err, 500);
  }
});

// After upload, store metadata
router.post('/', async (req, res) => {
  try {
    let body: unknown = req.body;
    if (Buffer.isBuffer(body)) {
      try { body = JSON.parse(body.toString('utf8')); } catch {}
    } else if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch {}
    }
    const { user_id, key, bucket } = (body || {}) as any;
    if (!user_id || !key || !bucket) return res.status(400).json({ error: 'user_id, key, bucket required' });
    const supabase = getServerSupabase();
    const { data, error } = await supabase.from('images').insert([{ user_id, key, bucket }]).select('*');
    if (error) {
      // If DB permissions/RLS prevent inserting (eg. code 42501), don't fail the upload flow —
      // return a minimal fallback so uploads continue to work while DB perms are fixed.
      if (error.code === '42501' || (error?.message && String(error.message).toLowerCase().includes('permission denied'))) {
        // Log server-side for operator debugging, but respond success to caller with a warning
        // eslint-disable-next-line no-console
        console.warn('images insert permission denied, returning fallback response', { user_id, key, bucket, dbError: error });
        return res.json({ user_id, key, bucket, id: null, warning: 'db_insert_permission_denied' });
      }
      return res.status(500).json({ error });
    }
    res.json(data[0]);
  } catch (err) {
    return sendError(res, err, 500);
  }
});

// Obtain a signed URL to view an object (server-side)
router.get('/signed-url', async (req, res) => {
  try {
    const { key, bucket } = req.query as { key?: string; bucket?: string };
    if (!key) return res.status(400).json({ error: 'key required' });
    const supabase = getServerSupabase();
    const bucketName = bucket || process.env.SUPABASE_BUCKET || 'user-uploads';
    const { data, error } = await supabase.storage.from(bucketName).createSignedUrl(String(key), 60 * 60);
    if (error) return res.status(500).json({ error });
    res.json(data);
  } catch (err) {
    return sendError(res, err, 500);
  }
});

// Proxy an image through the server to avoid client-side JWT signed-url verification issues
router.get('/proxy', async (req, res) => {
  try {
    const { key, bucket } = req.query as { key?: string; bucket?: string };
    if (!key) return res.status(400).json({ error: 'key required' });
    const supabase = getServerSupabase();
    const bucketName = bucket || process.env.SUPABASE_BUCKET || 'user-uploads';

    const { data, error } = await supabase.storage.from(bucketName).download(String(key));

    // If file not found or error, return default avatar SVG as fallback
    if (error || !data) {
      const fs = await import('fs');
      const path = await import('path');
      try {
        const defaultAvatarPath = path.join(process.cwd(), 'public', 'default-avatar.svg');
        const defaultAvatarBuffer = fs.readFileSync(defaultAvatarPath);
        res.setHeader('Content-Type', 'image/svg+xml');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        return res.send(defaultAvatarBuffer);
      } catch (svgErr) {
        // If default avatar not found, return a simple placeholder response
        res.setHeader('Content-Type', 'image/svg+xml');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        return res.send('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="#e5e7eb" width="100" height="100"/><text x="50" y="50" text-anchor="middle" dy=".3em" fill="#9ca3af" font-size="14">Image</text></svg>');
      }
    }

    // Try to obtain bytes from different returned types
    let buffer: Buffer | null = null;
    try {
      if (typeof (data as any).arrayBuffer === 'function') {
        const ab = await (data as any).arrayBuffer();
        buffer = Buffer.from(ab);
      } else if (typeof (data as any).toBuffer === 'function') {
        buffer = (data as any).toBuffer();
      } else {
        // Node stream / async iterable
        const chunks: Buffer[] = [];
        for await (const chunk of (data as any)) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        buffer = Buffer.concat(chunks);
      }
    } catch (e) {
      // If we can't read the object, return default avatar
      const fs = await import('fs');
      const path = await import('path');
      try {
        const defaultAvatarPath = path.join(process.cwd(), 'public', 'default-avatar.svg');
        const defaultAvatarBuffer = fs.readFileSync(defaultAvatarPath);
        res.setHeader('Content-Type', 'image/svg+xml');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        return res.send(defaultAvatarBuffer);
      } catch {
        res.setHeader('Content-Type', 'image/svg+xml');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        return res.send('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="#e5e7eb" width="100" height="100"/><text x="50" y="50" text-anchor="middle" dy=".3em" fill="#9ca3af" font-size="14">Image</text></svg>');
      }
    }

    // Simple content-type inference from file extension
    const ext = String(key).split('.').pop()?.toLowerCase();
    const mimeMap: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      svg: 'image/svg+xml',
      avif: 'image/avif',
    };
    const contentType = mimeMap[ext ?? ''] || 'application/octet-stream';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(buffer);
  } catch (err) {
    return sendError(res, err, 500);
  }
});

export default router;
