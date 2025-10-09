declare global {
  interface Window {
    Razorpay?: any;
  }
}

export type RazorpayOpenOptions = {
  key: string;
  amount: number; // in paise
  currency: string;
  name?: string;
  description?: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
};

export function openRazorpay(options: RazorpayOpenOptions & {
  onSuccess: (payload: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => void;
  onDismiss?: () => void;
}) {
  if (!window.Razorpay) throw new Error('Razorpay script not loaded');
  const rzp = new window.Razorpay({
    key: options.key,
    amount: options.amount,
    currency: options.currency,
    name: options.name,
    description: options.description,
    order_id: options.order_id,
    prefill: options.prefill,
    notes: options.notes,
    handler: (resp: any) => {
      options.onSuccess({
        razorpay_payment_id: resp.razorpay_payment_id,
        razorpay_order_id: resp.razorpay_order_id,
        razorpay_signature: resp.razorpay_signature,
      });
    },
    modal: {
      ondismiss: () => options.onDismiss?.(),
    },
  });
  rzp.open();
}
