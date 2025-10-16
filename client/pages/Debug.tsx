import { apiFetch, ExpertAPI, CheckoutAPI, ProductsAPI } from '@/lib/api';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function Debug() {
  const [lastResult, setLastResult] = useState<Record<string, any>>({});

  async function call(path: string, opts: RequestInit = {}, useApiFetch = true) {
    const key = `${opts.method ?? 'GET'} ${path}`;
    setLastResult((s) => ({ ...s, [key]: { status: 'pending' } }));
    try {
      let res: any;
      if (useApiFetch) {
        const p = path.startsWith('/') ? path : `/${path}`;
        res = await apiFetch(p, opts);
      } else {
        const r = await fetch(path.startsWith('/') ? path : `/${path}`, opts);
        const contentType = r.headers.get('content-type') || '';
        let body: any = null;
        if (contentType.includes('application/json')) body = await r.json();
        else body = await r.text();
        if (!r.ok) throw new Error(JSON.stringify({ status: r.status, body }));
        res = body;
      }
      setLastResult((s) => ({ ...s, [key]: { status: 'ok', data: res } }));
      console.log('API DEBUG', key, res);
    } catch (err: any) {
      setLastResult((s) => ({ ...s, [key]: { status: 'error', error: String(err) } }));
      console.error('API DEBUG ERROR', key, err);
    }
  }

  function promptId(msg = 'Enter id') {
    const id = window.prompt(msg);
    if (!id) throw new Error('Cancelled');
    return id;
  }

  const sampleOnboard = {
    cart: [{ productId: '1', qty: 1 }],
    subscription: { nextDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString().slice(0, 10), frequency: 'monthly' },
    account: { email: 'tester@example.com' },
  };

  const endpoints: { label: string; page: string; action: () => Promise<void>; sample?: any }[] = [
    { label: '/api/ping', page: 'general', action: () => call('/ping') },
    { label: '/api/demo', page: 'general', action: () => call('/demo') },

    { label: 'GET /api/admin/users', page: 'admin', action: () => call('/admin/users') },
    { label: 'GET /api/admin/metrics', page: 'admin', action: () => call('/admin/metrics') },
    { label: 'GET /api/admin/settings', page: 'admin/settings', action: () => call('/admin/settings') },
    { label: 'POST /api/admin/settings', page: 'admin/settings', sample: { loyalty_point_per_rupee: 5 }, action: () => call('/admin/settings', { method: 'POST', body: JSON.stringify({ loyalty_point_per_rupee: 5 }) }) },
    { label: 'POST /api/admin/create-super-admin', page: 'admin', sample: { email: 'super@example.com', name: 'Super' }, action: () => call('/admin/create-super-admin', { method: 'POST', body: JSON.stringify({ email: 'super@example.com', name: 'Super' }) }) },
    { label: 'POST /api/admin/users/:id/role', page: 'admin', action: async () => { const id = promptId('admin user id'); const role = window.prompt('role (user|admin|super_admin)', 'admin') || 'admin'; await call(`/admin/users/${encodeURIComponent(id)}/role`, { method: 'POST', body: JSON.stringify({ role }) }); } },
    { label: 'POST /api/admin/users/:id/approve-avatar', page: 'admin', action: async () => { const id = promptId('user id'); await call(`/admin/users/${encodeURIComponent(id)}/approve-avatar`, { method: 'POST' }); } },
    { label: 'POST /api/admin/reviews/:id/approve', page: 'admin/reviews', action: async () => { const id = promptId('review id'); await call(`/admin/reviews/${encodeURIComponent(id)}/approve`, { method: 'POST' }); } },
    { label: 'DELETE /api/admin/users/:id', page: 'admin', action: async () => { const id = promptId('user id'); await call(`/admin/users/${encodeURIComponent(id)}`, { method: 'DELETE' }); } },

    { label: 'GET /api/reviews', page: 'reviews', action: () => call('/reviews') },
    { label: 'POST /api/reviews', page: 'reviews', sample: { user_id: 'user-id', rating: 5, title: 'Test', body: 'Test review' }, action: async () => { const user_id = window.prompt('user_id', 'user-id') || 'user-id'; await call('/reviews', { method: 'POST', body: JSON.stringify({ user_id, rating: 5, title: 'Test', body: 'Test review' }) }); } },

    { label: 'POST /api/images/upload-url', page: 'images', sample: { filename: 'test.jpg' }, action: () => call('/images/upload-url', { method: 'POST', body: JSON.stringify({ filename: 'test.jpg' }) }) },
    { label: 'POST /api/images', page: 'images', sample: { user_id: 'user-id', key: 'key', bucket: 'user-uploads' }, action: async () => { const user_id = window.prompt('user_id', 'user-id') || 'user-id'; const key = window.prompt('key', 'some-key.jpg') || 'some-key.jpg'; await call('/images', { method: 'POST', body: JSON.stringify({ user_id, key, bucket: 'user-uploads' }) }); } },
    { label: 'GET /api/images/signed-url', page: 'images', action: async () => { const key = window.prompt('key', 'some-key.jpg') || 'some-key.jpg'; await call(`/images/signed-url?key=${encodeURIComponent(key)}`); } },

    { label: 'GET /api/products', page: 'shop', action: () => call('/products') },
    { label: 'GET /api/products/:handle', page: 'product', action: async () => { const handle = window.prompt('product handle', '1') || '1'; await call(`/products/${encodeURIComponent(handle)}`); } },

    { label: 'POST /api/checkout/create', page: 'checkout', sample: { amount: 100, lineItems: [{ variantId: 1, quantity: 1 }] }, action: () => call('/checkout/create', { method: 'POST', body: JSON.stringify({ amount: 100, currency: 'INR', lineItems: [{ variantId: 1, quantity: 1 }] }) }) },
    { label: 'POST /api/checkout/verify', page: 'checkout', action: async () => {
        const orderId = window.prompt('orderId (uuid)') || '';
        const razorpayOrderId = window.prompt('razorpayOrderId') || '';
        const razorpayPaymentId = window.prompt('razorpayPaymentId') || '';
        const razorpaySignature = window.prompt('razorpaySignature') || '';
        await call('/checkout/verify', { method: 'POST', body: JSON.stringify({ orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature }) });
      } },

    { label: 'GET /api/orders', page: 'orders', action: () => call('/orders') },

    { label: 'GET /api/loyalty/config', page: 'buy', action: () => call('/loyalty/config') },
    { label: 'GET /api/loyalty/me', page: 'buy', action: () => call('/loyalty/me') },

    { label: 'GET /api/referrals/network', page: 'referrals', action: () => call('/referrals/network') },
    { label: 'GET /api/referrals/summary', page: 'referrals', action: () => call('/referrals/summary') },

    { label: 'GET /api/leaderboard/categories', page: 'leaderboard', action: () => call('/leaderboard/categories') },
    { label: 'GET /api/leaderboard', page: 'leaderboard', action: async () => { const cat = window.prompt('category', 'most_level1') || 'most_level1'; const week = window.prompt('week (YYYY-MM-DD)', '') || ''; await call(`/leaderboard?category=${encodeURIComponent(cat)}${week ? `&week=${encodeURIComponent(week)}` : ''}`); } },

    { label: 'POST /api/doctors/apply', page: 'doctors', sample: { license_number: 'L123', license_url: 'https://example.com/license.jpg', photo_url: 'https://example.com/photo.jpg' }, action: async () => { const license_number = window.prompt('license_number', 'L123') || 'L123'; const license_url = window.prompt('license_url', 'https://example.com/license.jpg') || 'https://example.com/license.jpg'; const photo_url = window.prompt('photo_url', 'https://example.com/photo.jpg') || 'https://example.com/photo.jpg'; await call('/doctors/apply', { method: 'POST', body: JSON.stringify({ license_number, license_url, photo_url }) }); } },
    { label: 'GET /api/doctors/me/application', page: 'doctors', action: () => call('/doctors/me/application') },
    { label: 'GET /api/doctors/admin/applications', page: 'admin/applications', action: () => call('/doctors/admin/applications') },
    { label: 'POST /api/doctors/admin/applications/:id/approve', page: 'admin/applications', action: async () => { const id = promptId('application id'); await call(`/doctors/admin/applications/${encodeURIComponent(id)}/approve`, { method: 'POST' }); } },
    { label: 'POST /api/doctors/admin/applications/:id/reject', page: 'admin/applications', action: async () => { const id = promptId('application id'); await call(`/doctors/admin/applications/${encodeURIComponent(id)}/reject`, { method: 'POST' }); } },

    { label: 'GET /api/rank/me', page: 'rank', action: () => call('/rank/me') },
    { label: 'GET /api/rank/:userId', page: 'rank', action: async () => { const id = promptId('user id'); await call(`/rank/${encodeURIComponent(id)}`); } },

    { label: 'POST /api/expert/onboard', page: 'expert', sample: sampleOnboard, action: () => call('/expert/onboard', { method: 'POST', body: JSON.stringify(sampleOnboard) }) },
    { label: 'GET /api/expert/me', page: 'expert', action: () => call('/expert/me') },
    { label: 'POST /api/expert/debug/validate', page: 'expert/debug', sample: sampleOnboard, action: () => call('/expert/debug/validate', { method: 'POST', body: JSON.stringify(sampleOnboard) }) },
    { label: 'POST /api/expert/debug/onboarding', page: 'expert/debug', sample: sampleOnboard, action: () => call('/expert/debug/onboarding', { method: 'POST', body: JSON.stringify(sampleOnboard) }) },
    { label: 'POST /api/expert/debug/build', page: 'expert/debug', sample: sampleOnboard, action: () => call('/expert/debug/build', { method: 'POST', body: JSON.stringify(sampleOnboard) }) },
    { label: 'POST /api/expert/debug/subscriptions', page: 'expert/debug', sample: sampleOnboard, action: () => call('/expert/debug/subscriptions', { method: 'POST', body: JSON.stringify(sampleOnboard) }) },
    { label: 'POST /api/expert/debug/order', page: 'expert/debug', sample: sampleOnboard, action: () => call('/expert/debug/order', { method: 'POST', body: JSON.stringify(sampleOnboard) }) },

    { label: 'GET /api/auth/callback (open)', page: 'auth', action: async () => { const token = window.prompt('access_token','test-token') || 'test-token'; const redirect = '/'; const url = `/api/auth/callback?access_token=${encodeURIComponent(token)}&redirect=${encodeURIComponent(redirect)}`; window.open(url, '_blank'); } },

    { label: '/.netlify/functions/evaluate-ranks', page: 'cron', action: () => call('/.netlify/functions/evaluate-ranks', {}, false) },
    { label: '/.netlify/functions/evaluate-referrals', page: 'cron', action: () => call('/.netlify/functions/evaluate-referrals', {}, false) },
    { label: '/.netlify/functions/subscription-renew', page: 'cron', action: () => call('/.netlify/functions/subscription-renew', {}, false) },
    { label: '/.netlify/functions/sync-loyalty', page: 'cron', action: () => call('/.netlify/functions/sync-loyalty', {}, false) },
    { label: '/.netlify/functions/update-leaderboard', page: 'cron', action: () => call('/.netlify/functions/update-leaderboard', {}, false) },

    { label: 'POST /api/doctors/invite', page: 'doctors', sample: { phone: '+919999999999', name: 'Dr A', city: 'Delhi' }, action: async () => {
        const phone = window.prompt('phone (+E164)','+919999999999') || '+919999999999';
        const name = window.prompt('name','Dr A') || undefined;
        const city = window.prompt('city','Delhi') || undefined;
        await call('/doctors/invite', { method: 'POST', body: JSON.stringify({ phone, name, city }) });
      } },
    { label: 'POST /api/doctors/accept-invite', page: 'doctors', sample: { token: 'abc', otp: '123456', phone: '+919999999999' }, action: async () => {
        const token = window.prompt('invite token','') || '';
        const useSession = window.confirm('Use current session? (OK=yes / Cancel=OTP)');
        if (useSession) {
          await call('/doctors/accept-invite', { method: 'POST', body: JSON.stringify({ token }) });
        } else {
          const phone = window.prompt('phone (+E164)','+919999999999') || '+919999999999';
          const otp = window.prompt('otp','123456') || '123456';
          await call('/doctors/accept-invite', { method: 'POST', body: JSON.stringify({ token, phone, otp }) });
        }
      } },
    { label: 'POST /api/enroll', page: 'enroll', sample: { referral_code: 'AM-EXPERT', email: 'p@example.com' }, action: async () => {
        const referral_code = window.prompt('referral_code','AM-EXPERT') || 'AM-EXPERT';
        const email = window.prompt('email (leave blank to use phone)','p@example.com') || '';
        let body: any = { referral_code };
        if (email) body.email = email; else { const phone = window.prompt('phone (+E164)','+919999999999') || '+919999999999'; body.phone = phone; }
        await call('/enroll', { method: 'POST', body: JSON.stringify(body) });
      } },
    { label: 'POST /api/webhooks/shopify', page: 'webhooks', sample: { id: 12345, email: 'p@example.com', created_at: new Date().toISOString(), currency: 'INR', total_price: '100.00', customer: { email: 'p@example.com' }, financial_status: 'paid' }, action: async () => {
        const json = window.prompt('JSON body', JSON.stringify({ id: 12345, email: 'p@example.com', created_at: new Date().toISOString(), currency: 'INR', total_price: '100.00', customer: { email: 'p@example.com' }, financial_status: 'paid' })) || '{}';
        const hmac = window.prompt('X-Shopify-Hmac-Sha256 (leave blank to expect 401)','') || '';
        await call('/webhooks/shopify', { method: 'POST', body: json, headers: hmac ? { 'X-Shopify-Hmac-Sha256': hmac, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' } }, false);
      } },
  ];

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="mx-auto max-w-3xl text-center mb-8">
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
          API Debug Panel
        </h2>
        <p className="mt-3 text-muted-foreground">Click an endpoint to call it (watch network tab). Prompts will appear for required IDs.</p>
      </div>
      <div className="mt-6 grid gap-4">
        {endpoints.map((e) => (
          <div key={e.label} className="rounded-lg border bg-white p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-medium">{e.label}</div>
                <div className="mt-1 text-xs text-muted-foreground">Page: {e.page}</div>
                {e.sample && (
                  <pre className="mt-2 max-w-xl overflow-auto text-xs bg-muted p-2">{JSON.stringify(e.sample, null, 2)}</pre>
                )}
              </div>
              <div className="flex flex-col items-end">
                <Button onClick={() => e.action()} className="mb-2">Call</Button>
                <div className="text-xs text-muted-foreground">{(lastResult[`${'GET'} ${e.label.replace(/^\w+\s+/, '')}`]) ? '' : ''}</div>
              </div>
            </div>
            <div className="mt-3">
              <div className="text-xs font-semibold">Last result:</div>
              <pre className="mt-1 max-w-full overflow-auto text-xs bg-slate-50 p-2">{JSON.stringify(lastResult[`${(e.label.split(' ')[0])} ${e.label.replace(/^\w+\s+/, '')}`], null, 2)}</pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
