import type { Handler } from "@netlify/functions";
import { getServerSupabase } from "../../server/lib/supabase";
import { createShopifyOrder } from "../../server/lib/shopify";
import { awardOrderPoints } from "../../server/lib/loyalty";

function addMonths(dateStr: string, months: number) {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString().slice(0, 10);
}

export const config = { schedule: "0 0 1 * *" };

export const handler: Handler = async () => {
  const supabase = getServerSupabase();
  const today = new Date().toISOString().slice(0, 10);

  const { data: due, error } = await supabase
    .from("subscriptions")
    .select("id, user_id, product_variant_id, quantity, frequency, next_order_date, status")
    .lte("next_order_date", today)
    .eq("status", "active");
  if (error) throw error;

  for (const sub of due ?? []) {
    try {
      const payload = {
        line_items: [
          {
            variant_id: Number(sub.product_variant_id),
            quantity: Number(sub.quantity ?? 1),
          },
        ],
        financial_status: "paid",
        send_receipt: true,
        note: `Subscription ${sub.id} renewal`,
        tags: "subscription",
      } as const;

      const order = await createShopifyOrder(payload);

      const nextDate = sub.frequency === "alternate" ? addMonths(sub.next_order_date, 2) : addMonths(sub.next_order_date, 1);

      await supabase
        .from("subscriptions")
        .update({ next_order_date: nextDate })
        .eq("id", sub.id);

      await supabase
        .from("orders")
        .insert({
          user_id: sub.user_id,
          amount: null,
          currency: "INR",
          status: "paid",
          type: "subscription",
          shopify_order_id: String(order.id),
          subscription_id: sub.id,
          metadata: { cron: true },
        });

      await awardOrderPoints({
        userId: sub.user_id,
        orderId: order.id.toString(),
        orderTotal: 0,
        context: "subscription",
      });
    } catch (err) {
      console.error("Subscription renewal failed", sub.id, err);
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ processed: (due ?? []).length }),
  };
};
