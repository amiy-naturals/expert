import { Router } from "express";
import { z, ZodError } from "zod";
import { getRazorpay, verifyPaymentSignature } from "../lib/razorpay";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth";
import { createOrderRecord, updateOrderRecord } from "../lib/orders";
import { createShopifyOrder, type ShopifyOrderPayload } from "../lib/shopify";
import { awardOrderPoints, calculateMaxRedeemablePoints } from "../lib/loyalty";
import { getConfig } from "../lib/env";
import { getServerSupabase } from "../lib/supabase";

const router = Router();
const config = getConfig();

const lineItemSchema = z.object({
  variantId: z.number(),
  quantity: z.number().int().min(1),
  price: z.number().nonnegative().optional(),
});

const createOrderSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().default("INR"),
  lineItems: z.array(lineItemSchema),
  notes: z.record(z.string()).optional(),
  subscriptionId: z.string().uuid().optional(),
  metadata: z.record(z.any()).optional(),
  redeemedPoints: z.number().nonnegative().optional(),
});

router.post(
  "/create",
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const parsed = createOrderSchema.parse(req.body);
      const razorpay = getRazorpay();
      const receipt = `order_${Date.now()}`;

      // Compute server-side subtotal from line items if prices provided; fallback to provided amount
      const subtotal = parsed.lineItems.reduce((sum, li) => sum + (li.price ?? 0) * li.quantity, 0) || parsed.amount;
      // 15% discount for logged-in users
      const discountPct = 15;
      const discountAmount = Math.round((subtotal * discountPct) / 100);
      const afterDiscount = Math.max(0, subtotal - discountAmount);

      // Cap redeemed points using policy and current balance
      const supabase = getServerSupabase();
      const { data: userRow } = await supabase
        .from("users")
        .select("points_balance")
        .eq("id", req.authUser.id)
        .maybeSingle();
      const balance = Number(userRow?.points_balance ?? 0);
      const maxRedeem = calculateMaxRedeemablePoints({ balance, orderValue: afterDiscount });
      const redeemedPoints = Math.max(0, Math.min(Number(parsed.redeemedPoints ?? 0), maxRedeem));

      const payable = Math.max(0, afterDiscount - redeemedPoints);

      const order = await razorpay.orders.create({
        amount: Math.round(payable * 100),
        currency: parsed.currency,
        receipt,
        notes: parsed.notes,
      });

      const orderRecord = await createOrderRecord({
        userId: req.authUser.id,
        amount: payable,
        currency: parsed.currency,
        type: parsed.subscriptionId ? "subscription" : "one_time",
        status: "pending",
        razorpayOrderId: order.id,
        subscriptionId: parsed.subscriptionId ?? null,
        metadata: {
          lineItems: parsed.lineItems,
          notes: parsed.notes ?? null,
          clientMetadata: parsed.metadata ?? null,
          subtotal,
          discountPct,
          discountAmount,
          redeemedPoints,
        },
      });

      res.json({
        orderId: orderRecord.id,
        razorpayOrderId: order.id,
        amount: order.amount,
        currency: order.currency,
        razorpayKey: config.razorpay.keyId,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      res.status(400).json({ error: message });
    }
  },
);

const verifySchema = z.object({
  orderId: z.string().uuid(),
  razorpayOrderId: z.string(),
  razorpayPaymentId: z.string(),
  razorpaySignature: z.string(),
  shippingAddress: z.record(z.any()).optional(),
  billingAddress: z.record(z.any()).optional(),
  customer: z
    .object({
      email: z.string().email().optional(),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      phone: z.string().optional(),
    })
    .optional(),
  note: z.string().optional(),
  redeemedPoints: z.number().nonnegative().optional(),
});

router.post(
  "/verify",
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      // Debug logging: capture headers, content-type and raw body to diagnose missing fields issues
      try {
        console.log('[checkout/verify] content-type:', req.get('content-type'));
        // Stringify headers for clearer logs
        try {
          console.log('[checkout/verify] headers:', JSON.stringify(req.headers));
        } catch (e) {
          console.log('[checkout/verify] headers (raw):', req.headers);
        }
        // Body may be buffer/string/object depending on middleware; handle safely
        try {
          if (Buffer.isBuffer(req.body)) {
            console.log('[checkout/verify] body (buffer):', req.body.toString('utf8'));
          } else if (typeof req.body === 'string') {
            console.log('[checkout/verify] body (string):', req.body);
          } else {
            console.log('[checkout/verify] body (object):', JSON.stringify(req.body));
          }
        } catch (e) {
          console.log('[checkout/verify] failed to stringify body:', e);
        }
      } catch (e) {
        console.log('[checkout/verify] logging error:', e);
      }

      // Normalize body: express.json() may not parse if wrong content-type; support Buffer/string
      let body: unknown = req.body;
      if (Buffer.isBuffer(body)) {
        try { body = JSON.parse(body.toString('utf8')); } catch {}
      } else if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch {}
      }

      const parsed = verifySchema.parse(body);
      const isValid = verifyPaymentSignature({
        orderId: parsed.razorpayOrderId,
        paymentId: parsed.razorpayPaymentId,
        signature: parsed.razorpaySignature,
      });
      if (!isValid) return res.status(400).json({ error: "Invalid signature" });

      const orderRecord = await updateOrderRecord({
        orderId: parsed.orderId,
        status: "paid",
        razorpayPaymentId: parsed.razorpayPaymentId,
      });

      const metadata = (orderRecord.metadata ?? {}) as {
        lineItems?: { variantId: number; quantity: number; price?: number }[];
        notes?: Record<string, string> | null;
      };

      if (!metadata.lineItems || metadata.lineItems.length === 0) {
        return res.status(400).json({ error: "Order metadata missing line items" });
      }

      const payload: ShopifyOrderPayload = {
        line_items:
          metadata.lineItems?.map((item) => ({
            variant_id: item.variantId,
            quantity: item.quantity,
            price: item.price ? item.price.toFixed(2) : undefined,
          })) ?? [],
        financial_status: "paid",
        send_receipt: true,
        email: parsed.customer?.email ?? req.authUser.email ?? undefined,
        customer: {
          email: parsed.customer?.email ?? req.authUser.email ?? undefined,
          first_name: parsed.customer?.firstName ?? undefined,
          last_name: parsed.customer?.lastName ?? undefined,
          phone: parsed.customer?.phone ?? undefined,
        },
        billing_address: parsed.billingAddress,
        shipping_address: parsed.shippingAddress,
        note: parsed.note ?? undefined,
        tags: "Amiy Experts",
        source_name: "Amiy Experts",
        channel: "Amiy Experts",
      };

      const order = await createShopifyOrder(payload);

      await updateOrderRecord({
        orderId: parsed.orderId,
        shopifyOrderId: String(order.id),
        metadataPatch: {
          ...orderRecord.metadata,
          shopify: order,
        },
      });

      await awardOrderPoints({
        userId: req.authUser.id,
        orderId: parsed.orderId,
        orderTotal: orderRecord.amount,
        redeemedPoints: parsed.redeemedPoints ?? 0,
        context: orderRecord.type === "subscription" ? "subscription" : "one_time",
      });

      res.json({ success: true, shopifyOrderId: order.id, shopifyOrderName: order.name });
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({ error: 'Validation failed', issues: err.issues });
      }
      let message = 'Unknown error';
      if (err instanceof Error) {
        message = err.message;
      } else if (err && typeof err === 'object') {
        try {
          message = JSON.stringify(err);
        } catch {
          message = String(err);
        }
      } else {
        message = String(err);
      }
      res.status(400).json({ error: message });
    }
  },
);

export default router;
