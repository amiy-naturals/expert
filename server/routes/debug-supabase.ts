import { Router } from "express";
import { getServerSupabase } from "../lib/supabase";

const router = Router();

// Publicly accessible only on server side; call from an admin-only UI or curl internally
router.get("/status", async (req, res) => {
  try {
    const supabase = getServerSupabase();
    // Check current user and basic privileges
    const [{ rows: current }, { rows: privs }] = await Promise.all([
      // current_user and session_user
      supabase.rpc('pg_stat_get_backend_pid').catch(() => ({ rows: [] })),
      // Use raw SQL to inspect privileges (safe when run by service role)
      supabase.from('pg_catalog.pg_roles').select('rolname').limit(1).catch(() => ({ data: null })) as any,
    ] as any);

    // Try simple selects to verify access
    let referralsOk = true;
    let usersOk = true;
    let ordersOk = true;
    try {
      await supabase.from('referrals').select('referrer_id').limit(1);
    } catch (e) {
      referralsOk = false;
    }
    try {
      await supabase.from('users').select('id').limit(1);
    } catch (e) {
      usersOk = false;
    }
    try {
      await supabase.from('order_attributions').select('level1_doctor_id').limit(1);
    } catch (e) {
      ordersOk = false;
    }

    res.json({ ok: true, checks: { referrals: referralsOk, users: usersOk, order_attributions: ordersOk } });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('debug-supabase error', err);
    res.status(500).json({ error: String(err?.message ?? err) });
  }
});

export default router;
