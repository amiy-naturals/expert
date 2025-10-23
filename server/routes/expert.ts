import { Router } from "express";
import { z, ZodError } from "zod";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth";
import { getServerSupabase } from "../lib/supabase";
import { getProduct } from "../lib/shopify";
import { getRazorpay } from "../lib/razorpay";
import { getConfig } from "../lib/env";
import { createOrderRecord } from "../lib/orders";

const router = Router();
const config = getConfig();

const OnboardSchema = z.object({
  cart: z.array(z.object({ productId: z.string(), qty: z.number().int().min(1) })).min(1),
  subscription: z.object({ nextDate: z.string(), frequency: z.enum(["monthly", "alternate"]) }),
  account: z
    .object({
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      birthday: z.string().optional(),
      gender: z.string().optional(),
      username: z.string().optional(),
      agreeTerms: z.boolean().optional(),
    })
    .partial()
    .optional(),
});

type OnboardPayload = z.infer<typeof OnboardSchema>;

function getDiscountPct(amount: number) {
  if (amount >= 3000) return 25;
  if (amount >= 2000) return 20;
  if (amount >= 1000) return 15;
  return 0;
}

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object") {
    const anyErr = err as any;
    if (typeof anyErr.message === "string") return anyErr.message;
    if (typeof anyErr.error === "string") return anyErr.error;
    try {
      return JSON.stringify(anyErr);
    } catch {}
  }
  return String(err);
}

// Shared helpers used by main and debug endpoints
async function validateAndParse(body: any): Promise<{ parsed: OnboardPayload; diffDays: number }> {
  let data: any = body;
  try {
    if (Buffer.isBuffer(body)) {
      data = JSON.parse(body.toString('utf8'));
    } else if (typeof body === 'string') {
      data = JSON.parse(body);
    }
  } catch {
    // If parsing fails, fall back to original body
  }

  const parsed = OnboardSchema.parse(data) as OnboardPayload;
  const today = new Date();
  const next = new Date(parsed.subscription.nextDate + "T00:00:00Z");
  const diffDays = Math.round((+next - +today) / (1000 * 60 * 60 * 24));
  if (diffDays < 2 || diffDays > 60) {
    const err: any = new Error("nextDate must be 2-60 days in future");
    err.status = 400;
    throw err;
  }
  return { parsed, diffDays };
}

async function insertOnboardingSnapshot(uid: string, payload: any) {
  const supabase = getServerSupabase();
  const { error } = await supabase.from("expert_onboardings").insert({
    user_id: uid,
    cart: payload.cart,
    subscription: payload.subscription,
    account: payload.account ?? {},
  });
  if (error) throw error;
  return { ok: true } as const;
}

async function buildLineItems(cart: { productId: string; qty: number }[]) {
  let subtotal = 0;
  const lineItems: { variantId: number; quantity: number; price: number }[] = [];
  for (const line of cart) {
    const productId = Number(line.productId);
    const product = await getProduct(productId);
    if (!product || !product.variants?.[0]) throw new Error(`Product ${line.productId} not found`);
    const variant = product.variants[0];
    const price = Number(variant.price);
    lineItems.push({ variantId: Number(variant.id), quantity: line.qty, price });
    subtotal += price * line.qty;
  }
  const discountPct = getDiscountPct(subtotal);
  const discountAmt = Math.round((subtotal * discountPct) / 100);
  const total = Math.max(0, subtotal - discountAmt);
  return { lineItems, subtotal, discountPct, discountAmt, total };
}

async function createSubscriptionsFor(uid: string, subscription: { nextDate: string; frequency: "monthly" | "alternate" }, lineItems: { variantId: number; quantity: number }[]) {
  const supabase = getServerSupabase();
  for (const li of lineItems) {
    const { error } = await supabase.from("subscriptions").insert({
      user_id: uid,
      product_variant_id: String(li.variantId),
      quantity: li.quantity,
      frequency: subscription.frequency,
      next_order_date: subscription.nextDate,
      status: "active",
    });
    if (error) throw error;
  }
  return { ok: true } as const;
}

async function createRazorpayAndOrder(uid: string, amount: number, lineItems: { variantId: number; quantity: number; price: number }[]) {
  const razorpay = getRazorpay();
  const receipt = `expert_${Date.now()}`;
  const order = await razorpay.orders.create({ amount: Math.round(amount * 100), currency: config.razorpay.currency, receipt });
  const orderRecord = await createOrderRecord({
    userId: uid,
    amount,
    currency: config.razorpay.currency,
    type: "one_time",
    status: "pending",
    razorpayOrderId: order.id,
    subscriptionId: null,
    metadata: { lineItems, expert: true },
  });
  return { order, orderRecord };
}

router.post("/onboard", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { parsed } = await validateAndParse(req.body);

    const uid = req.authUser.id;

    await insertOnboardingSnapshot(uid, parsed);

    const { lineItems, total } = await buildLineItems(parsed.cart as { productId: string; qty: number }[]).then(({ lineItems, total }) => ({ lineItems, total }));

    await createSubscriptionsFor(uid, parsed.subscription as { nextDate: string; frequency: "monthly" | "alternate" }, lineItems.map(li => ({ variantId: li.variantId, quantity: li.quantity })));

    const { order, orderRecord } = await createRazorpayAndOrder(uid, total, lineItems);

    res.json({
      orderId: orderRecord.id,
      razorpayOrderId: order.id,
      amount: order.amount,
      currency: order.currency,
      razorpayKey: config.razorpay.keyId,
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ error: err.issues?.[0]?.message || "Invalid request" });
    }
    const message = errorMessage(err);
    res.status(400).json({ error: message });
  }
});

// Debug endpoints to run each step independently
router.post('/debug/validate', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { parsed, diffDays } = await validateAndParse(req.body);
    res.json({ ok: true, diffDays, payload: parsed, receivedBody: req.body });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ error: 'Validation failed', issues: err.issues, receivedBody: req.body });
    }
    const message = errorMessage(err);
    const status = (err as any)?.status ?? 400;
    res.status(status).json({ error: message, receivedBody: req.body });
  }
});

router.post('/debug/onboarding', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { parsed } = await validateAndParse(req.body);
    const uid = req.authUser.id;
    await insertOnboardingSnapshot(uid, parsed);
    res.json({ ok: true });
  } catch (err) {
    if (err instanceof ZodError) return res.status(400).json({ error: err.issues?.[0]?.message || 'Invalid request' });
    const message = errorMessage(err);
    res.status(400).json({ error: message });
  }
});

router.post('/debug/build', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { parsed } = await validateAndParse(req.body);
    const { lineItems, subtotal, discountPct, discountAmt, total } = await buildLineItems(parsed.cart as { productId: string; qty: number }[]);
    res.json({ lineItems, subtotal, discountPct, discountAmt, total });
  } catch (err) {
    if (err instanceof ZodError) return res.status(400).json({ error: err.issues?.[0]?.message || 'Invalid request' });
    const message = errorMessage(err);
    res.status(400).json({ error: message });
  }
});

router.post('/debug/subscriptions', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { parsed } = await validateAndParse(req.body);
    const { lineItems } = await buildLineItems(parsed.cart as { productId: string; qty: number }[]);
    const uid = req.authUser.id;
    await createSubscriptionsFor(uid, parsed.subscription as { nextDate: string; frequency: "monthly" | "alternate" }, lineItems.map(li => ({ variantId: li.variantId, quantity: li.quantity })));
    res.json({ ok: true, count: lineItems.length });
  } catch (err) {
    if (err instanceof ZodError) return res.status(400).json({ error: err.issues?.[0]?.message || 'Invalid request' });
    const message = errorMessage(err);
    res.status(400).json({ error: message });
  }
});

router.post('/debug/order', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { parsed } = await validateAndParse(req.body);
    const { lineItems, total } = await buildLineItems(parsed.cart as { productId: string; qty: number }[]);
    const uid = req.authUser.id;
    const { order, orderRecord } = await createRazorpayAndOrder(uid, total, lineItems);
    res.json({
      orderId: orderRecord.id,
      razorpayOrderId: order.id,
      amount: order.amount,
      currency: order.currency,
      razorpayKey: config.razorpay.keyId,
      lineItems,
      total,
    });
  } catch (err) {
    if (err instanceof ZodError) return res.status(400).json({ error: err.issues?.[0]?.message || 'Invalid request' });
    const message = errorMessage(err);
    res.status(400).json({ error: message });
  }
});

router.get('/me', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const supabase = getServerSupabase();
    const uid = req.authUser.id;
    const { data: subs, error: subsErr } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', uid)
      .limit(1);
    if (subsErr) throw subsErr;
    const { data: onboardings, error: onboardErr } = await supabase
      .from('expert_onboardings')
      .select('id')
      .eq('user_id', uid)
      .limit(1);
    if (onboardErr) throw onboardErr;
    const onboarded = (Array.isArray(subs) && subs.length > 0) || (Array.isArray(onboardings) && onboardings.length > 0);
    res.json({ onboarded, subscriptions: subs?.length ?? 0, onboardings: onboardings?.length ?? 0 });
  } catch (err) {
    const message = errorMessage(err);
    res.status(400).json({ error: message });
  }
});

export default router;
