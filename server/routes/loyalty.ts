import { Router } from "express";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth";
import { getConfig } from "../lib/env";
import { getServerSupabase } from "../lib/supabase";
import { sendError } from '../lib/error';

const router = Router();

router.get("/config", (_req, res) => {
  const cfg = getConfig();
  res.json({
    pointPerRupee: cfg.loyalty.pointPerRupee,
    maxRedemptionPct: cfg.loyalty.maxRedemptionPct,
    referralRates: {
      level1: cfg.referrals.level1Rate,
      level2: cfg.referrals.level2Rate,
      level3: cfg.referrals.level3Rate,
    },
  });
});

router.get("/me", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const supabase = getServerSupabase();
    const [{ data: userRow, error: userErr }, { data: txs, error: txErr }] = await Promise.all([
      supabase.from("users").select("points_balance").eq("id", req.authUser.id).maybeSingle(),
      supabase
        .from("points_transactions")
        .select("id, delta, reason, order_id, balance_after, created_at")
        .eq("user_id", req.authUser.id)
        .order("created_at", { ascending: false })
        .limit(100),
    ]);
    if (userErr) throw userErr;
    if (txErr) throw txErr;
    res.json({ balance: Number(userRow?.points_balance ?? 0), transactions: txs ?? [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

export default router;
