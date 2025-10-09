import type { Handler } from "@netlify/functions";
import { getServerSupabase } from "../../server/lib/supabase";
import { calculateEarnedPoints, recordPointsTransaction } from "../../server/lib/loyalty";

export const config = { schedule: "@daily" };

export const handler: Handler = async () => {
  try {
    const supabase = getServerSupabase();

    // Get all paid orders and check loyalty_history to avoid duplicates
    const { data: orders, error } = await supabase
      .from("orders")
      .select("id, user_id, amount, status")
      .eq("status", "paid");
    if (error) throw error;

    for (const order of orders ?? []) {
      const orderId = order.id as string;
      const userId = order.user_id as string;
      const { count, error: hErr } = await supabase
        .from("loyalty_history")
        .select("order_id", { count: "exact", head: true })
        .eq("order_id", orderId);
      if (hErr) throw hErr;
      if ((count ?? 0) > 0) continue;

      const pts = calculateEarnedPoints(Number(order.amount ?? 0));
      if (pts > 0) {
        await recordPointsTransaction({ userId, delta: pts, reason: "order_purchase", orderId });
      }
      await supabase.from("loyalty_history").insert({ user_id: userId, order_id: orderId, points: pts });
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true, processed: orders?.length ?? 0 }) };
  } catch (err) {
    return { statusCode: 500, body: (err as Error).message };
  }
};
