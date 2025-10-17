import { Router } from 'express';
import { randomBytes } from 'crypto';
import { getServerSupabase } from '../lib/supabase';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth';
import { awardDoctorReferralBonus, recordLockedPointsTransaction, recordPointsTransaction } from '../lib/loyalty';
import { ensureReferralRecord } from '../lib/referrals';
import { getConfig } from '../lib/env';
import { sendError } from '../lib/error';

const router = Router();

function shortToken(bytes = 6) {
  return randomBytes(bytes).toString('base64url');
}

function getBaseUrl(req: any) {
  const cfg = getConfig();
  if (cfg.site.baseUrl) return cfg.site.baseUrl;
  const proto = (req.headers['x-forwarded-proto'] as string) || (req.protocol ?? 'http');
  const host = (req.headers['x-forwarded-host'] as string) || req.headers.host || 'localhost:8080';
  return `${proto}://${host}`;
}

// Create provisional invite (admin only)
router.post('/invite', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const role = req.userRow?.role ?? 'user';
    if (role !== 'admin' && role !== 'super_admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const { phone, name, city } = req.body || {};
    if (!phone) return res.status(400).json({ error: 'phone required' });
    const token = shortToken();
    const supabase = getServerSupabase();
    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    const { error } = await supabase.from('doctor_invites').insert({
      token,
      phone,
      name: name ?? null,
      city: city ?? null,
      inviter_id: req.authUser.id,
      expires_at: expiresAt,
      metadata: {},
    });
    if (error) return res.status(500).json({ error });
    const base = getBaseUrl(req);
    const joinPath = `/join/express?token=${encodeURIComponent(token)}`;
    const joinUrl = `${base}${joinPath}`;
    res.json({ token, joinPath, joinUrl, expiresAt });
  } catch (err) {
    return sendError(res, err, 500);
  }
});

// Accept invite (public: requires OTP-authenticated user or inline phone+otp)
router.post('/accept-invite', async (req, res) => {
  try {
    const { token, otp, phone } = req.body || {};
    if (!token) return res.status(400).json({ error: 'token required' });
    const supabase = getServerSupabase();

    const { data: invite, error: invErr } = await supabase
      .from('doctor_invites')
      .select('*')
      .eq('token', token)
      .maybeSingle();
    if (invErr) return res.status(500).json({ error: invErr });
    if (!invite) return res.status(404).json({ error: 'invalid token' });
    if (invite.accepted_at) return res.status(400).json({ error: 'invite already accepted' });
    if (invite.expires_at && new Date(invite.expires_at).getTime() < Date.now()) {
      return res.status(400).json({ error: 'invite expired' });
    }

    // Resolve user: prefer Authorization header
    let userId: string | null = null;
    const authz = (req.headers.authorization as string | undefined) || '';
    if (authz.startsWith('Bearer ')) {
      const jwt = authz.substring('Bearer '.length);
      const userRes = await supabase.auth.getUser(jwt);
      if (userRes.data?.user) userId = userRes.data.user.id;
    }
    if (!userId && otp && phone) {
      try {
        const ver = await supabase.auth.verifyOtp({ type: 'sms', phone, token: String(otp) });
        if (ver.data?.user) userId = ver.data.user.id;
      } catch (e) {
        return res.status(401).json({ error: 'invalid otp' });
      }
    }
    if (!userId) return res.status(401).json({ error: 'authentication required (otp or token)' });

    // Ensure user row exists and set provisional flags
    let { data: userRow, error: userErr } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (userErr) return res.status(500).json({ error: userErr });
    if (!userRow) {
      const insert = await supabase
        .from('users')
        .insert({ id: userId, role: 'user' })
        .select('*')
        .maybeSingle();
      if (insert.error) return res.status(500).json({ error: insert.error });
      userRow = insert.data;
    }

    // Attach referrer if not already set
    try {
      if (!userRow.referred_by && invite.inviter_id) {
        await supabase.from('users').update({ referred_by: invite.inviter_id }).eq('id', userId);
      }
    } catch {}

    // Mark provisional flags
    try {
      await supabase.from('users').update({ is_doctor_provisional: true, is_doctor_verified: false }).eq('id', userId);
    } catch {}

    // Create referral record (doctor type)
    try {
      if (invite.inviter_id) await ensureReferralRecord({ referrerId: invite.inviter_id, referredId: userId, type: 'doctor' });
    } catch {}

    // Mark invite as accepted
    await supabase
      .from('doctor_invites')
      .update({ accepted_at: new Date().toISOString() })
      .eq('token', token);

    // Credit locked onboarding bonus
    const cfg = getConfig();
    const bonus = cfg.referrals.doctorReferralBonus;
    try {
      await recordLockedPointsTransaction({ userId, delta: bonus, reason: 'onboarding_bonus', metadata: { source: 'express_join', invite_token: token }, orderId: undefined });
    } catch {}

    const base = getBaseUrl(req);
    const myRef = userId; // fallback; you may replace with a dedicated referral code if available
    const referralLink = `${base}/?ref=${encodeURIComponent(myRef)}`;
    res.json({ success: true, referralLink, bonus, locked: true });
  } catch (err) {
    return sendError(res, err, 500);
  }
});

// Submit doctor application
router.post('/apply', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    // Normalize body (handle raw buffer or string bodies)
    let requestBody: any = req.body;
    if (Buffer.isBuffer(requestBody)) {
      try { requestBody = JSON.parse(requestBody.toString('utf8')); } catch {}
    } else if (typeof requestBody === 'string') {
      try { requestBody = JSON.parse(requestBody); } catch {}
    }
    const { license_number, license_url, photo_url } = requestBody || {};
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
    return sendError(res, err, 500);
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
    return sendError(res, err, 500);
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
    return sendError(res, err, 500);
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

    // Unlock any locked points by adding an adjustment equal to the total locked amount
    try {
      const locked = await supabase
        .from('points_transactions')
        .select('delta')
        .eq('user_id', uid)
        .eq('metadata->>locked', 'true');
      if (!locked.error) {
        const totalLocked = (locked.data ?? []).reduce((s: number, r: any) => s + Number(r.delta ?? 0), 0);
        if (totalLocked > 0) {
          await recordPointsTransaction({ userId: uid, delta: totalLocked, reason: 'admin_adjustment', metadata: { unlocked_from_locked: true }, orderId: undefined });
        }
      }
    } catch {}

    // Award referrer doctor bonus if applicable
    await awardDoctorReferralBonus(uid);

    res.json({ success: true });
  } catch (err) {
    return sendError(res, err, 500);
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
    return sendError(res, err, 500);
  }
});

export default router;
