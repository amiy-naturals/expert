import express from "express";
import { verifyWebhookHmac, updateOrderNote, updateCustomerMetafield } from "../lib/shopify";
import { getServerSupabase } from "../lib/supabase";
import { pickOrderContact, resolveDoctorChain, isPostJoin } from "../lib/attribution";
import { recordLockedPointsTransaction, recordPointsTransaction } from "../lib/loyalty";
import { getConfig } from "../lib/env";
import { sendError } from '../lib/error';
import { updateUserMaxTotalSpent } from "../lib/orders";

const router = express.Router();

// Ensure raw body for this route (also added in server/index.ts)
router.post("/shopify", (req, res, next) => next());

router.post("/shopify", async (req, res) => {
  try {
    const rawBody = (req as any).body as Buffer | string;
    const hmac = req.get("X-Shopify-Hmac-Sha256") || req.get("x-shopify-hmac-sha256");
    if (!verifyWebhookHmac(rawBody, hmac)) return res.status(401).json({ error: "invalid hmac" });

    const topic = (req.get("X-Shopify-Topic") || req.get("x-shopify-topic") || "").toLowerCase();
    const body = typeof rawBody === "string" || Buffer.isBuffer(rawBody) ? JSON.parse(rawBody.toString()) : req.body;

    if (topic.includes("orders/create") || topic.includes("orders/updated") || topic.includes("orders/paid")) {
      const supabase = getServerSupabase();
      const order = body?.order || body; // webhook payload may be order root
      const shopify_order_id = Number(order?.id ?? order?.order_id ?? 0);
      if (!shopify_order_id) return res.json({ ok: true });

      const { email, phone } = pickOrderContact(order);
      const created_at = order?.created_at || new Date().toISOString();
      const total = Number(order?.total_price || order?.current_total_price || 0);
      const subtotal = Number(order?.subtotal_price || 0);
      const currency = String(order?.currency || "INR");

      let { data: attribution, error: aErr } = await supabase
        .from("order_attributions")
        .select("*")
        .eq("shopify_order_id", shopify_order_id)
        .maybeSingle();
      if (aErr) throw aErr;

      if (!attribution) {
        // Compute attribution
        let external: any = null;
        if (email) {
          const { data } = await supabase.from("external_customers").select("*").eq("email_norm", email).maybeSingle();
          external = data ?? null;
        }
        if (!external && phone) {
          const { data } = await supabase.from("external_customers").select("*").eq("phone_e164", phone).maybeSingle();
          external = data ?? null;
        }

        let l1: string | null = null, l2: string | null = null, l3: string | null = null;
        let postJoin = false;
        if (external?.referred_by_doctor_id) {
          const chain = await resolveDoctorChain(external.referred_by_doctor_id as string);
          l1 = chain.l1; l2 = chain.l2; l3 = chain.l3;
          postJoin = isPostJoin(created_at, external.joined_at);
        }

        const cfg = getConfig();
        const levelRates = [cfg.referrals.level1Rate, cfg.referrals.level2Rate, cfg.referrals.level3Rate];
        const pts_l1 = postJoin && l1 ? Math.floor(total * levelRates[0]) : 0;
        const pts_l2 = postJoin && l2 ? Math.floor(total * levelRates[1]) : 0;
        const pts_l3 = postJoin && l3 ? Math.floor(total * levelRates[2]) : 0;
        const cust_pts = postJoin ? Math.floor(total * cfg.loyalty.pointPerRupee) : 0;

        const insert = await supabase.from("order_attributions").upsert({
          shopify_order_id,
          origin: "shopify",
          customer_external_id: external?.id ?? null,
          customer_user_id: null,
          level1_doctor_id: l1,
          level2_doctor_id: l2,
          level3_doctor_id: l3,
          currency,
          subtotal,
          total,
          created_at,
          paid: false,
          points_l1: pts_l1,
          points_l2: pts_l2,
          points_l3: pts_l3,
          points_customer: cust_pts,
        }, { onConflict: "shopify_order_id" }).select("*").maybeSingle();
        if (insert.error) throw insert.error;
        attribution = insert.data;

        // If we have Shopify customer id and no external record, store it for later matching
        const shopifyCustomerId = order?.customer?.id ? Number(order.customer.id) : null;
        if (!external && shopifyCustomerId) {
          await supabase.from("external_customers").upsert({
            shopify_customer_id: shopifyCustomerId,
            email: order?.email || order?.customer?.email || null,
            phone: order?.customer?.phone || null,
            email_norm: (order?.email || order?.customer?.email || "").toLowerCase(),
          }, { onConflict: "shopify_customer_id" });
        }
      }

      const isPaid = String(order?.financial_status || order?.financial_status_current || "").toLowerCase() === "paid";
      if (topic.includes("orders/paid") || (topic.includes("orders/updated") && isPaid)) {
        if (attribution?.paid) return res.json({ ok: true });
        const cfg = getConfig();
        // Award doctors
        const awards: Array<Promise<any>> = [];
        async function awardTo(doctorId: string | null, delta: number, level: 1 | 2 | 3) {
          if (!doctorId || !delta) return;
          // Check provisional
          const { data: u } = await getServerSupabase().from("users").select("is_doctor_provisional").eq("id", doctorId).maybeSingle();
          const meta = { shopify_order_id, level } as any;
          if (u?.is_doctor_provisional) awards.push(recordLockedPointsTransaction({ userId: doctorId, delta, reason: level === 1 ? "referral_level_1" : level === 2 ? "referral_level_2" : "referral_level_3", metadata: meta, orderId: undefined }));
          else awards.push(recordPointsTransaction({ userId: doctorId, delta, reason: level === 1 ? "referral_level_1" : level === 2 ? "referral_level_2" : "referral_level_3", metadata: meta, orderId: undefined }));
        }
        await awardTo(attribution.level1_doctor_id, Number(attribution.points_l1 || 0), 1);
        await awardTo(attribution.level2_doctor_id, Number(attribution.points_l2 || 0), 2);
        await awardTo(attribution.level3_doctor_id, Number(attribution.points_l3 || 0), 3);

        // Customer points: if user exists, credit; else accumulate pending on external
        const custPts = Number(attribution.points_customer || 0);
        if (custPts > 0) {
          let userId: string | null = null;
          if (email) {
            const { data } = await getServerSupabase().from("users").select("id").eq("email", email).maybeSingle();
            userId = data?.id ?? null;
          }
          if (!userId && phone) {
            const { data } = await getServerSupabase().from("users").select("id").eq("phone", phone).maybeSingle();
            userId = data?.id ?? null;
          }
          if (userId) {
            await recordPointsTransaction({ userId, delta: custPts, reason: "order_purchase", metadata: { shopify_order_id }, orderId: undefined });
            // Update max_total_spent for internal user
            try {
              await updateUserMaxTotalSpent(userId, total);
            } catch (err) {
              console.error('Failed to update max_total_spent for user:', err);
            }
          } else if (attribution.customer_external_id) {
            await getServerSupabase().from("external_customers").update({ pending_points: (custPts) }).eq("id", attribution.customer_external_id);
          }
        }

        // Mark paid
        await getServerSupabase().from("order_attributions").update({ paid: true, paid_at: new Date().toISOString() }).eq("shopify_order_id", shopify_order_id);

        // Update order note
        try {
          const names: Record<string, string> = {};
          async function nameOf(id: string | null) {
            if (!id) return "—";
            if (names[id]) return names[id];
            const { data } = await getServerSupabase().from("users").select("name").eq("id", id).maybeSingle();
            const n = data?.name || "Doctor";
            names[id] = n;
            return n;
          }
          const l1 = await nameOf(attribution.level1_doctor_id);
          const l2 = await nameOf(attribution.level2_doctor_id);
          const l3 = await nameOf(attribution.level3_doctor_id);
          const customerName = order?.customer?.first_name || order?.customer?.last_name ? `${order?.customer?.first_name || ""} ${order?.customer?.last_name || ""}`.trim() : (order?.customer?.email || "Customer");
          const line1 = `${l1} (L1) > ${l2} (L2) > ${l3} (L3) > ${customerName}`;
          const line2 = `+${Number(attribution.points_l1 || 0)} pts    +${Number(attribution.points_l2 || 0)} pts    +${Number(attribution.points_l3 || 0)} pts    +${Number(attribution.points_customer || 0)} pts`;
          const note = `${line1}\n${line2}`;
          const note_attributes = [
            { name: "amiy_experts_l1_id", value: String(attribution.level1_doctor_id || "") },
            { name: "amiy_experts_l2_id", value: String(attribution.level2_doctor_id || "") },
            { name: "amiy_experts_l3_id", value: String(attribution.level3_doctor_id || "") },
            { name: "amiy_experts_customer_email", value: String(email || "") },
            { name: "amiy_experts_points_l1", value: Number(attribution.points_l1 || 0) },
            { name: "amiy_experts_points_l2", value: Number(attribution.points_l2 || 0) },
            { name: "amiy_experts_points_l3", value: Number(attribution.points_l3 || 0) },
            { name: "amiy_experts_points_customer", value: Number(attribution.points_customer || 0) },
          ];
          await updateOrderNote(shopify_order_id, note, note_attributes as any);
        } catch {}
      }

      return res.json({ ok: true });
    }

    res.json({ ok: true });
  } catch (err) {
    return sendError(res, err, 500);
  }
});

export default router;
