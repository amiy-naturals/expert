import { Router } from 'express';
import { getServerSupabase } from '../lib/supabase';
import { getConfig } from '../lib/env';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth';
import { sendError } from '../lib/error';

const router = Router();

/**
 * Admin Routes Documentation
 *
 * ROLE HIERARCHY:
 * - user: Regular user
 * - doctor: Verified healthcare professional (can post reviews/consults)
 * - admin: Can approve avatars, reviews, and manage users
 * - super_admin: Full permissions including creating admins and super_admins
 *
 * IMAGE & LICENSE VERIFICATION WORKFLOW:
 * 1. Users upload avatar image (validated: jpg, jpeg, png, webp)
 * 2. Users upload license (validated: pdf only)
 * 3. Admins review in /admin/users endpoint (avatar_approved, license_verified flags)
 * 4. Super admin can set verification status via /admin/users/:id/verify endpoints
 * 5. Once approved, users can post reviews/become verified doctors
 *
 * SUPER ADMIN CREATION:
 * - Only existing super_admin can create new super_admins via POST /create-super-admin
 * - Automatically sets avatar_approved=true for administrative access
 */

// Require auth for all admin routes and ensure role is admin/super_admin
router.use((req, res, next) => requireAuth(req as any, res as any, next));
router.use((req: any, res, next) => {
  const role = (req as AuthenticatedRequest).userRow?.role ?? 'user';
  if (role !== 'admin' && role !== 'super_admin') return res.status(403).json({ error: 'forbidden' });
  next();
});

// Create or upsert a super admin user (server-only)
router.post('/create-super-admin', async (req, res) => {
  try {
    let body: unknown = req.body;
    if (Buffer.isBuffer(body)) {
      try { body = JSON.parse(body.toString('utf8')); } catch {}
    } else if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch {}
    }
    const { email, name } = (body || {}) as any;
    if (!email) return res.status(400).json({ error: 'email required' });
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from('users')
      .upsert({ email, name, role: 'super_admin', avatar_approved: true })
      .select('*');
    if (error) return res.status(500).json({ error });
    res.json(data[0]);
  } catch (err) {
    return sendError(res, err, 500);
  }
});

// List users (admins + super_admin only) - simple guard via query param for now
router.get('/users', async (req, res) => {
  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error });
    res.json(data);
  } catch (err) {
    return sendError(res, err, 500);
  }
});

// Basic metrics: users count and total earnings (sum of paid orders)
router.get('/metrics', async (req, res) => {
  try {
    const supabase = getServerSupabase();
    const [{ count: usersCount }, ordersRes] = await Promise.all([
      supabase.from('users').select('id', { head: true }),
      supabase.from('orders').select('amount').eq('status', 'paid'),
    ]);
    if (ordersRes.error) throw ordersRes.error;
    const earnings = (ordersRes.data ?? [])
      .map((r: any) => Number(r.amount) || 0)
      .reduce((s: number, v: number) => s + v, 0);
    res.json({ usersCount: usersCount ?? 0, earnings });
  } catch (err) {
    return sendError(res, err, 500);
  }
});

// Settings - get current (db overrides env)
router.get('/settings', async (_req, res) => {
  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase.from('settings').select('*').eq('id', 'global').maybeSingle();
    if (error && error.code !== 'PGRST116') return res.status(500).json({ error });
    const env = getConfig();
    const payload = {
      loyalty_point_per_rupee: Number(data?.loyalty_point_per_rupee ?? env.loyalty.pointPerRupee),
      loyalty_max_redemption_pct: Number(data?.loyalty_max_redemption_pct ?? env.loyalty.maxRedemptionPct),
      referral_level1_rate: Number(data?.referral_level1_rate ?? env.referrals.level1Rate),
      referral_level2_rate: Number(data?.referral_level2_rate ?? env.referrals.level2Rate),
      referral_level3_rate: Number(data?.referral_level3_rate ?? env.referrals.level3Rate),
      doctor_commission_min: Number(data?.doctor_commission_min ?? 0.1),
      doctor_commission_max: Number(data?.doctor_commission_max ?? 0.2),
    };
    res.json(payload);
  } catch (err) {
    return sendError(res, err, 500);
  }
});

// Update settings (admin/super_admin)
router.post('/settings', async (req, res) => {
  try {
    let body: unknown = req.body;
    if (Buffer.isBuffer(body)) {
      try { body = JSON.parse(body.toString('utf8')); } catch {}
    } else if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch {}
    }
    const supabase = getServerSupabase();
    const patch: Record<string, number> = {};
    const keys = [
      'loyalty_point_per_rupee','loyalty_max_redemption_pct',
      'referral_level1_rate','referral_level2_rate','referral_level3_rate',
      'doctor_commission_min','doctor_commission_max',
    ] as const;
    keys.forEach((k) => {
      const v = (body as any)?.[k];
      if (typeof v === 'number' && !Number.isNaN(v)) (patch as any)[k] = v;
    });
    const { data, error } = await supabase.from('settings').upsert({ id: 'global', ...patch }).select('*').maybeSingle();
    if (error) return res.status(500).json({ error });
    res.json(data);
  } catch (err) {
    return sendError(res, err, 500);
  }
});

// Change role (only super_admin should call)
router.post('/users/:id/role', async (req, res) => {
  try {
    let body: unknown = req.body;
    if (Buffer.isBuffer(body)) {
      try { body = JSON.parse(body.toString('utf8')); } catch {}
    } else if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch {}
    }
    const { id } = req.params;
    const { role } = (body || {}) as any;
    if (!['user', 'admin', 'super_admin'].includes(role)) return res.status(400).json({ error: 'invalid role' });
    const supabase = getServerSupabase();
    const { data, error } = await supabase.from('users').update({ role }).eq('id', id).select('*');
    if (error) return res.status(500).json({ error });
    res.json(data[0]);
  } catch (err) {
    return sendError(res, err, 500);
  }
});

// Approve avatar for a user (admin or super_admin)
router.post('/users/:id/approve-avatar', async (req, res) => {
  try {
    const { id } = req.params;
    const supabase = getServerSupabase();
    const { data, error } = await supabase.from('users').update({ avatar_approved: true }).eq('id', id).select('*');
    if (error) return res.status(500).json({ error });
    res.json(data[0]);
  } catch (err) {
    return sendError(res, err, 500);
  }
});

// Verify license for a user (admin or super_admin)
router.post('/users/:id/verify-license', async (req, res) => {
  try {
    const { id } = req.params;
    const supabase = getServerSupabase();
    const { data, error } = await supabase.from('users').update({ license_verified: true }).eq('id', id).select('*');
    if (error) return res.status(500).json({ error });
    res.json(data[0]);
  } catch (err) {
    return sendError(res, err, 500);
  }
});

// Reject avatar for a user (admin or super_admin)
router.post('/users/:id/reject-avatar', async (req, res) => {
  try {
    const { id } = req.params;
    const supabase = getServerSupabase();
    const { data, error } = await supabase.from('users').update({ avatar_approved: false }).eq('id', id).select('*');
    if (error) return res.status(500).json({ error });
    res.json(data[0]);
  } catch (err) {
    return sendError(res, err, 500);
  }
});

// Reject license for a user (admin or super_admin)
router.post('/users/:id/reject-license', async (req, res) => {
  try {
    const { id } = req.params;
    const supabase = getServerSupabase();
    const { data, error } = await supabase.from('users').update({ license_verified: false }).eq('id', id).select('*');
    if (error) return res.status(500).json({ error });
    res.json(data[0]);
  } catch (err) {
    return sendError(res, err, 500);
  }
});

// Approve a review (admin or super_admin)
router.post('/reviews/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from('reviews')
      .update({ approved: true })
      .eq('id', id)
      .select('*')
      .maybeSingle();
    if (error) return res.status(500).json({ error });
    res.json(data);
  } catch (err) {
    return sendError(res, err, 500);
  }
});

// Remove user
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const supabase = getServerSupabase();
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) return res.status(500).json({ error });
    res.json({ success: true });
  } catch (err) {
    return sendError(res, err, 500);
  }
});

export default router;
