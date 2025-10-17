import { useState } from "react";
import { useExpertCtx } from "./context";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ExpertAPI, CheckoutAPI } from "@/lib/api";
import { openRazorpay } from "@/lib/razorpay";
import { toast } from "sonner";

export default function ReviewStep() {
  const { cart, subscription, account, totals, reset } = useExpertCtx();
  const [loading, setLoading] = useState(false);

  async function ensureRazorpayScript() {
    if ((window as any).Razorpay) return;
    await new Promise<void>((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://checkout.razorpay.com/v1/checkout.js';
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('Failed to load Razorpay'));
      document.body.appendChild(s);
    });
  }

  async function submit() {
    try {
      setLoading(true);
      if (!subscription.nextDate) throw new Error('Schedule your next order date');
      await ensureRazorpayScript();
      const order = await ExpertAPI.onboard({ cart, subscription: { nextDate: subscription.nextDate, frequency: subscription.frequency }, account });
      openRazorpay({
        key: order.razorpayKey,
        amount: order.amount,
        currency: order.currency,
        name: 'Amiy Naturals',
        description: 'Amiy Expert Starter Order',
        order_id: order.razorpayOrderId,
        onSuccess: async ({ razorpay_payment_id, razorpay_order_id, razorpay_signature }) => {
          await CheckoutAPI.verify({
            orderId: order.orderId,
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            razorpaySignature: razorpay_signature,
          });
          toast.success('Onboarding complete');
          reset();
          window.location.href = '/dashboard';
        },
      });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto pb-16">
      <div className="mx-auto max-w-3xl rounded-lg border p-6">
        <h2 className="text-xl font-semibold">Review & Submit</h2>
        <div className="mt-4 space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span>Items</span>
            <span>{cart.reduce((s, i) => s + i.qty, 0)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Subtotal</span>
            <span>₹{totals.subtotal}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Discount</span>
            <span>{totals.discountPct}% (−₹{totals.discountAmount})</span>
          </div>
          <div className="flex items-center justify-between font-semibold">
            <span>Total</span>
            <span>₹{totals.total}</span>
          </div>
          <div className="pt-2 text-xs text-muted-foreground">
            Next Order: {subscription.nextDate || "—"} · Frequency: {subscription.frequency}
          </div>
        </div>
        <div className="mt-6 flex items-center justify-between">
          <Button asChild variant="outline">
            <Link to="/expert/account">Back</Link>
          </Button>
          <Button onClick={submit} loading={loading} disabled={loading}>Submit</Button>
        </div>
      </div>
    </div>
  );
}
