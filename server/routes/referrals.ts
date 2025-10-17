import { Router } from "express";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth";
import { getServerSupabase } from "../lib/supabase";
import { getReferralNetworkSummary } from "../lib/referrals";
import { sendError } from '../lib/error';

const router = Router();

router.get("/network", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const supabase = getServerSupabase();
    const userId = req.authUser.id;

    const level1 = await supabase
      .from("referrals")
      .select("referred:users(id, name, email, role)")
      .eq("referrer_id", userId);
    if (level1.error) throw level1.error;
    const level1Ids = (level1.data ?? []).map((r: any) => r.referred?.id).filter(Boolean);

    const level2 = level1Ids.length
      ? await supabase
          .from("referrals")
          .select("referred:users(id, name, email, role)")
          .in("referrer_id", level1Ids)
      : { data: [], error: null } as const;
    if (level2.error) throw level2.error;
    const level2Ids = (level2.data ?? []).map((r: any) => r.referred?.id).filter(Boolean);

    const level3 = level2Ids.length
      ? await supabase
          .from("referrals")
          .select("referred:users(id, name, email, role)")
          .in("referrer_id", level2Ids)
      : { data: [], error: null } as const;
    if (level3.error) throw level3.error;

    async function enrich(ids: string[]) {
      if (!ids.length) return {} as Record<string, { orders: number; points: number }>;
      const [ordersRes, pointsRes] = await Promise.all([
        supabase.from("orders").select("user_id, amount, status").in("user_id", ids),
        supabase.from("points_transactions").select("user_id, delta").in("user_id", ids),
      ]);
      if (ordersRes.error) throw ordersRes.error;
      if (pointsRes.error) throw pointsRes.error;
      const map: Record<string, { orders: number; points: number }> = {};
      (ordersRes.data ?? []).forEach((r: any) => {
        if (r.status !== "paid") return;
        const id = r.user_id as string;
        const prev = map[id] || { orders: 0, points: 0 };
        map[id] = { ...prev, orders: prev.orders + 1 };
      });
      (pointsRes.data ?? []).forEach((r: any) => {
        const id = r.user_id as string;
        const prev = map[id] || { orders: 0, points: 0 };
        map[id] = { ...prev, points: prev.points + Number(r.delta ?? 0) };
      });
      return map;
    }

    const e1 = await enrich(level1Ids);
    const e2 = await enrich(level2Ids);
    const e3 = await enrich(level3Ids);

    // Aggregate spend from external customers since join via order_attributions
    const allLevelIds = [...level1Ids, ...level2Ids, ...level3Ids].filter(Boolean);
    const spendMap: Record<string, { orders_after_join: number; amount_after_join: number }> = {};
    if (allLevelIds.length) {
      const atts = await supabase
        .from("order_attributions")
        .select("level1_doctor_id,total,paid")
        .in("level1_doctor_id", allLevelIds)
        .eq("paid", true);
      if (atts.error) throw atts.error;
      (atts.data ?? []).forEach((row: any) => {
        const id = row.level1_doctor_id as string;
        const prev = spendMap[id] || { orders_after_join: 0, amount_after_join: 0 };
        spendMap[id] = { orders_after_join: prev.orders_after_join + 1, amount_after_join: prev.amount_after_join + Number(row.total || 0) };
      });
    }

    // Points contributed to current doctor by each node
    const contribL1: Record<string, number> = {};
    if (level1Ids.length) {
      const rows = await supabase
        .from("order_attributions")
        .select("level1_doctor_id,level2_doctor_id,points_l2,paid")
        .in("level1_doctor_id", level1Ids)
        .eq("level2_doctor_id", userId)
        .eq("paid", true);
      if (rows.error) throw rows.error;
      (rows.data ?? []).forEach((r: any) => {
        const id = r.level1_doctor_id as string;
        contribL1[id] = (contribL1[id] || 0) + Number(r.points_l2 || 0);
      });
    }
    const contribL2: Record<string, number> = {};
    if (level2Ids.length) {
      const rows = await supabase
        .from("order_attributions")
        .select("level2_doctor_id,level3_doctor_id,points_l3,paid")
        .in("level2_doctor_id", level2Ids)
        .eq("level3_doctor_id", userId)
        .eq("paid", true);
      if (rows.error) throw rows.error;
      (rows.data ?? []).forEach((r: any) => {
        const id = r.level2_doctor_id as string;
        contribL2[id] = (contribL2[id] || 0) + Number(r.points_l3 || 0);
      });
    }

    const level1Rows = (level1.data ?? []).map((r: any) => ({
      id: r.referred?.id,
      name: r.referred?.name,
      email: r.referred?.email,
      role: r.referred?.role,
      orders: e1[r.referred?.id]?.orders ?? 0,
      points: e1[r.referred?.id]?.points ?? 0,
      level: 1,
      commissionPct: 0.025,
      orders_after_join: spendMap[r.referred?.id || ""]?.orders_after_join || 0,
      amount_after_join: spendMap[r.referred?.id || ""]?.amount_after_join || 0,
      points_contributed_to_doctor: contribL1[r.referred?.id || ""] || 0,
    }));
    const level2Rows = (level2.data ?? []).map((r: any) => ({
      id: r.referred?.id,
      name: r.referred?.name,
      email: r.referred?.email,
      role: r.referred?.role,
      orders: e2[r.referred?.id]?.orders ?? 0,
      points: e2[r.referred?.id]?.points ?? 0,
      level: 2,
      commissionPct: 0.015,
      orders_after_join: spendMap[r.referred?.id || ""]?.orders_after_join || 0,
      amount_after_join: spendMap[r.referred?.id || ""]?.amount_after_join || 0,
      points_contributed_to_doctor: contribL2[r.referred?.id || ""] || 0,
    }));
    const level3Rows = (level3.data ?? []).map((r: any) => ({
      id: r.referred?.id,
      name: r.referred?.name,
      email: r.referred?.email,
      role: r.referred?.role,
      orders: e3[r.referred?.id]?.orders ?? 0,
      points: e3[r.referred?.id]?.points ?? 0,
      level: 3,
      commissionPct: 0.01,
      orders_after_join: spendMap[r.referred?.id || ""]?.orders_after_join || 0,
      amount_after_join: spendMap[r.referred?.id || ""]?.amount_after_join || 0,
      points_contributed_to_doctor: 0,
    }));

    const totalSales = Object.values(spendMap).reduce((s, v) => s + v.amount_after_join, 0);
    const totalReferralPoints = [...level1Rows, ...level2Rows, ...level3Rows].reduce((s, r) => s + (r.points || 0), 0);

    res.json({
      level1: level1Rows,
      level2: level2Rows,
      level3: level3Rows,
      summary: { totalNetworkSales: totalSales, totalReferralPoints },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

router.get("/summary", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const summary = await getReferralNetworkSummary(req.authUser.id);
    const total = (summary.level1 ?? 0) + (summary.level2 ?? 0) + (summary.level3 ?? 0);
    res.json({ level1: summary.level1, level2: summary.level2, level3: summary.level3, total });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

export default router;
