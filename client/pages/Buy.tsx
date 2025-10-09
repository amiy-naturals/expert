import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ProductsAPI, CheckoutAPI } from '@/lib/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { openRazorpay } from '@/lib/razorpay';
import { toast } from 'sonner';

export default function Buy() {
  const { handle } = useParams();
  const qc = useQueryClient();
  const { data: product, isLoading: loadingProduct, error: productErr } = useQuery({
    queryKey: ['product', handle],
    queryFn: () => ProductsAPI.byHandle(handle!)
  });
  const { data: cfg } = useQuery({ queryKey: ['loyalty','config'], queryFn: () => fetch('/api/loyalty/config').then(r => r.json()) });
  const { data: me } = useQuery({ queryKey: ['loyalty','me'], queryFn: () => fetch('/api/loyalty/me').then(r => r.json()) });

  const variant = product?.variants?.[0];
  const price = variant?.price ?? product?.defaultPrice ?? 0;
  const discounted = Math.round(price * 0.85);
  const balance = Number(me?.balance ?? 0);
  const maxPolicy = Math.floor(discounted * Number(cfg?.maxRedemptionPct ?? 0));
  const maxRedeem = Math.max(0, Math.min(balance, maxPolicy));

  const [redeem, setRedeem] = useState(0);
  useEffect(() => { setRedeem(Math.min(redeem, maxRedeem)); }, [maxRedeem]);

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

  async function pay() {
    try {
      if (!product || !variant) throw new Error('Product not ready');
      await ensureRazorpayScript();
      const amountAfter = Math.max(0, discounted - redeem);
      const order = await CheckoutAPI.create({
        amount: amountAfter,
        lineItems: [{ variantId: variant.id, quantity: 1, price }],
        metadata: { productHandle: product.handle },
        redeemedPoints: redeem,
      });
      openRazorpay({
        key: order.razorpayKey,
        amount: order.amount,
        currency: order.currency,
        name: 'Amiy Naturals',
        description: product.title,
        order_id: order.razorpayOrderId,
        prefill: {},
        onSuccess: async ({ razorpay_payment_id, razorpay_order_id, razorpay_signature }) => {
          await CheckoutAPI.verify({
            orderId: order.orderId,
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            razorpaySignature: razorpay_signature,
            redeemedPoints: redeem,
          });
          toast.success('Payment successful');
          qc.invalidateQueries({ queryKey: ['loyalty','me'] });
        },
      });
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  if (loadingProduct) return <div className="container mx-auto py-16">Loading…</div>;
  if (productErr || !product) return <div className="container mx-auto py-16 text-sm text-red-600">Failed to load product</div>;

  return (
    <div className="container mx-auto py-16">
      <div className="mx-auto max-w-xl rounded-2xl border bg-white p-6">
        <h1 className="text-2xl font-extrabold">Buy {product.title}</h1>
        <div className="mt-4 text-sm text-muted-foreground">Price: ₹{price.toLocaleString()}</div>
        <div className="mt-4">
          <label className="text-sm font-medium">Use Points (max {maxRedeem} pts)</label>
          <input type="range" min={0} max={maxRedeem} value={redeem} onChange={(e) => setRedeem(Number(e.target.value))} className="mt-2 w-full" />
          <div className="mt-1 text-xs text-muted-foreground">15% member discount applied · Redeeming: {redeem} pts · Payable: ₹{Math.max(0, discounted - redeem).toLocaleString()}</div>
        </div>
        <button onClick={pay} className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow hover:opacity-90">Pay with Razorpay</button>
      </div>
    </div>
  );
}
