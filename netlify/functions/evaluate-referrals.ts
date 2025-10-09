import type { Handler } from "@netlify/functions";
import { getServerSupabase } from "../../server/lib/supabase";
import { getReferralChain, markReferralMilestoneAwarded } from "../../server/lib/referrals";
import { recordPointsTransaction } from "../../server/lib/loyalty";

export const config = { schedule: "@daily" };

export const handler: Handler = async () => {
  try {
    const supabase = getServerSupabase();
    // Find customer referrals that haven't been awarded yet
    const { data: refs, error } = await supabase
      .from("referrals")
      .select("referrer_id, referred_id, type, milestone_awarded")
      .eq("type", "customer");
    if (error) throw error;

    const THRESHOLD = 3000; // ₹
    const L1_BONUS = 1000;
    const L2_BONUS = 500;
    const L3_BONUS = 250;

    for (const row of refs ?? []) {
      const referredId = row.referred_id as string | null;
      if (!referredId) continue;

      // Sum paid orders for the referred user
      const { data: orders, error: oErr } = await supabase
        .from("orders")
        .select("amount, status")
        .eq("user_id", referredId)
        .eq("status", "paid");
      if (oErr) throw oErr;
      const total = (orders ?? []).reduce((s, o: any) => s + Number(o.amount ?? 0), 0);
      if (total <= THRESHOLD) continue;

      // Credit bonus up the chain once
      const chain = await getReferralChain(referredId, 3);
      for (const node of chain) {
        const delta = node.level === 1 ? L1_BONUS : node.level === 2 ? L2_BONUS : node.level === 3 ? L3_BONUS : 0;
        if (!delta) continue;
        await recordPointsTransaction({
          userId: node.userId,
          delta,
          reason: (node.level === 1 ? "referral_level_1" : node.level === 2 ? "referral_level_2" : "referral_level_3") as any,
          metadata: { referredUserId: referredId, milestone: `total>₹${THRESHOLD}` },
        });
      }

      // Mark the direct L1 referral as awarded to avoid duplicate awards
      await markReferralMilestoneAwarded(row.referrer_id as string, referredId);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, processed: refs?.length ?? 0 }),
    };
  } catch (err) {
    return { statusCode: 500, body: (err as Error).message };
  }
};
