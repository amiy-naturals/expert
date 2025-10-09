import { Router } from 'express';
import { getServerSupabase } from '../lib/supabase';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth';
import { awardDoctorReferralBonus } from '../lib/loyalty';

const router = Router();

// Submit doctor application
router.post('/apply', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { license_number, license_url, photo_url } = req.body || {};
    if (!license_number || !license_url || !photo_url) {
      return res.status(400).json({ error: 'license_number, license_url, photo_url required' });
    }
    const supabase = getServerSupabase();
    const uid = req.authUser.id;

    // upsert user flags
    await supabase.from('users').update({ is_doctor_pending: true, license_number, license_url, photo_url }).eq('id', uid);

    const { data, error } = await supabase
      .from('doctor_applications')
      .insert({ user_id: uid, license_number, license_url, photo_url, status: 'pending' })
      .select('*')
      .maybeSingle();
    if (error) return res.status(500).json({ error });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// Get my application
router.get('/me/application', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from('doctor_applications')
      .select('*')
      .eq('user_id', req.authUser.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error && error.code !== 'PGRST116') return res.status(500).json({ error });
    res.json(data ?? null);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// Admin: list applications
router.get('/admin/applications', async (_req, res) => {
  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from('doctor_applications')
      .select('*, users!doctor_applications_user_id_fkey(name, email)')
      .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// Admin: approve application
router.post('/admin/applications/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const supabase = getServerSupabase();
    const { data: app, error: appErr } = await supabase
      .from('doctor_applications')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (appErr) return res.status(500).json({ error: appErr });
    if (!app) return res.status(404).json({ error: 'not found' });

    const uid = app.user_id as string;

    const { error: uErr } = await supabase
      .from('users')
      .update({ is_doctor_pending: false, is_doctor_verified: true, rank: 'doctor' })
      .eq('id', uid);
    if (uErr) return res.status(500).json({ error: uErr });

    // Try server-side function for additional side effects (badge assignments etc.)
    try {
      await supabase.rpc('promote_to_doctor', { p_user_id: uid });
    } catch {}

    const { error: upErr } = await supabase
      .from('doctor_applications')
      .update({ status: 'approved', reviewed_at: new Date().toISOString() })
      .eq('id', id);
    if (upErr) return res.status(500).json({ error: upErr });

    // Award referrer doctor bonus if applicable
    await awardDoctorReferralBonus(uid);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// Admin: reject application
router.post('/admin/applications/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const supabase = getServerSupabase();
    const { data: app, error: appErr } = await supabase
      .from('doctor_applications')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (appErr) return res.status(500).json({ error: appErr });
    if (!app) return res.status(404).json({ error: 'not found' });

    const uid = app.user_id as string;

    await supabase.from('users').update({ is_doctor_pending: false }).eq('id', uid);
    await supabase.from('doctor_applications').update({ status: 'rejected', reviewed_at: new Date().toISOString() }).eq('id', id);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
