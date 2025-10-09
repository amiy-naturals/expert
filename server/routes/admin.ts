import { Router } from 'express';
import { getServerSupabase } from '../lib/supabase';
import { getConfig } from '../lib/env';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth';

const router = Router();

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
    const { email, name } = req.body;
    if (!email) return res.status(400).json({ error: 'email required' });
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from('users')
      .upsert({ email, name, role: 'super_admin', avatar_approved: true })
      .select('*');
    if (error) return res.status(500).json({ error });
    res.json(data[0]);
  } catch (err) {
    res.status(500).json({ error: String(err) });
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
    res.status(500).json({ error: String(err) });
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
    res.status(500).json({ error: String(err) });
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
    res.status(500).json({ error: String(err) });
  }
});

// Update settings (admin/super_admin)
router.post('/settings', async (req, res) => {
  try {
    const supabase = getServerSupabase();
    const patch: Record<string, number> = {};
    const keys = [
      'loyalty_point_per_rupee','loyalty_max_redemption_pct',
      'referral_level1_rate','referral_level2_rate','referral_level3_rate',
      'doctor_commission_min','doctor_commission_max',
    ] as const;
    keys.forEach((k) => {
      const v = req.body?.[k];
      if (typeof v === 'number' && !Number.isNaN(v)) (patch as any)[k] = v;
    });
    const { data, error } = await supabase.from('settings').upsert({ id: 'global', ...patch }).select('*').maybeSingle();
    if (error) return res.status(500).json({ error });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// Change role (only super_admin should call)
router.post('/users/:id/role', async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    if (!['user', 'admin', 'super_admin'].includes(role)) return res.status(400).json({ error: 'invalid role' });
    const supabase = getServerSupabase();
    const { data, error } = await supabase.from('users').update({ role }).eq('id', id).select('*');
    if (error) return res.status(500).json({ error });
    res.json(data[0]);
  } catch (err) {
    res.status(500).json({ error: String(err) });
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
    res.status(500).json({ error: String(err) });
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
    res.status(500).json({ error: String(err) });
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
    res.status(500).json({ error: String(err) });
  }
});

export default router;
