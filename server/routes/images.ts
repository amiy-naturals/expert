import { Router } from 'express';
import { getServerSupabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

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
    res.status(500).json({ error: String(err) });
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
    if (error) return res.status(500).json({ error });
    res.json(data[0]);
  } catch (err) {
    res.status(500).json({ error: String(err) });
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
    res.status(500).json({ error: String(err) });
  }
});

export default router;
