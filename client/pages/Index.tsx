import { Link } from "react-router-dom";
import ReviewsSection from '@/components/Reviews/Reviews';
import JoinCTA from '@/components/site/JoinCTA';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { apiFetch, ExpertAPI, CheckoutAPI, ProductsAPI } from '@/lib/api';
import { openRazorpay } from '@/lib/razorpay';
import { useState } from 'react';

export default function Index() {
  return (
    <div className="bg-background text-foreground">
      <Hero />
      <CoreConcept />
      <RevenueStreams />
      <Compensation />
      <Tiers />
      <Unilevel />
      <Implementation />
      <Compliance />
      <Success />
      <Journey />
      <ReviewsSection />
      <DebugSection />
      <CTA />
    </div>
  );
}

function SectionTitle({
  kicker,
  title,
  subtitle,
}: {
  kicker?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      {kicker && (
        <div className="text-xs tracking-widest uppercase text-accent font-semibold">
          {kicker}
        </div>
      )}
      <h2 className="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight">
        {title}
      </h2>
      {subtitle && <p className="mt-3 text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

function CoreConcept() {
  return (
    <section className="container mx-auto py-20">
      <SectionTitle
        kicker="Core Concept"
        title="Doctor-led education, ethical prescriptions, and growth"
        subtitle="Empower Ayurveda doctors to prescribe, educate, and build a professional network as Amiy Experts."
      />
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {[{
          title: 'Prescribe Amiy Products',
          desc: 'Recommend Amiy Naturals in consultations and earn commissions via unique codes.',
        }, {
          title: 'Educate on Vijaya & Ayurveda',
          desc: 'Host webinars and share compliant patient education — earn speaker bonuses.',
        }, {
          title: 'Build Your Network',
          desc: 'Refer and mentor doctors. Earn bonuses and tiered team commissions.',
        }].map((c) => (
          <div key={c.title} className="rounded-2xl border p-6 bg-white">
            <h3 className="text-lg font-semibold">{c.title}</h3>
            <p className="mt-2 text-muted-foreground text-sm">{c.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function RevenueStreams() {
  return (
    <section className="relative">
      <div aria-hidden className="absolute inset-0 -z-10 bg-background" />
      <div className="container mx-auto py-20">
        <SectionTitle
          kicker="Revenue Streams"
          title="Multiple, ethical ways to earn"
        />
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[{
            title: 'Consultation-based Prescriptions',
            points: ['10–20% commission on sales via doctor code', 'Track earnings in your Doctor App', 'MRP shopping remains available on site'],
          }, {
            title: 'Patient Subscriptions (Amiy Army)',
            points: ['10% ongoing discounts + new customer coupon', 'Free follow-ups and personalized health charts', 'Recurring income for enrolled patients'],
          }, {
            title: 'Doctor Recruitment & Team',
            points: ['One-time 1000 pts per onboarding (5 pts = ₹1)', 'Tiered team commissions on monthly sales', 'Level-based growth (L1, L2, L3)'],
          }].map((card) => (
            <div key={card.title} className="rounded-2xl border bg-white p-6">
              <h3 className="text-lg font-semibold">{card.title}</h3>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground list-disc pl-5">
                {card.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DebugSection() {
  const [lastResult, setLastResult] = useState<Record<string, any>>({});

  async function call(path: string, opts: RequestInit = {}, useApiFetch = true) {
    const key = `${opts.method ?? 'GET'} ${path}`;
    setLastResult((s) => ({ ...s, [key]: { status: 'pending' } }));
    try {
      let res: any;
      if (useApiFetch) {
        // apiFetch expects paths without the /api prefix
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

  // helper to prompt for an id param
  function promptId(msg = 'Enter id') {
    const id = window.prompt(msg);
    if (!id) throw new Error('Cancelled');
    return id;
  }

  // sample payloads
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
    { label: 'GET /api/referrals/summary (client expects this)', page: 'referrals', action: () => call('/referrals/summary') },

    { label: 'GET /api/leaderboard/categories', page: 'leaderboard', action: () => call('/leaderboard/categories') },
    { label: 'GET /api/leaderboard (category)', page: 'leaderboard', action: async () => { const cat = window.prompt('category', 'most_level1') || 'most_level1'; const week = window.prompt('week (YYYY-MM-DD)', '') || ''; await call(`/leaderboard?category=${encodeURIComponent(cat)}${week ? `&week=${encodeURIComponent(week)}` : ''}`); } },

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

    // netlify functions (serverless)
    { label: '/.netlify/functions/evaluate-ranks', page: 'cron', action: () => call('/.netlify/functions/evaluate-ranks', {}, false) },
    { label: '/.netlify/functions/evaluate-referrals', page: 'cron', action: () => call('/.netlify/functions/evaluate-referrals', {}, false) },
    { label: '/.netlify/functions/subscription-renew', page: 'cron', action: () => call('/.netlify/functions/subscription-renew', {}, false) },
    { label: '/.netlify/functions/sync-loyalty', page: 'cron', action: () => call('/.netlify/functions/sync-loyalty', {}, false) },
    { label: '/.netlify/functions/update-leaderboard', page: 'cron', action: () => call('/.netlify/functions/update-leaderboard', {}, false) },

    // New: Express join + enroll + webhooks
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
    { label: 'POST /api/webhooks/shopify (requires HMAC)', page: 'webhooks', sample: { id: 12345, email: 'p@example.com', created_at: new Date().toISOString(), currency: 'INR', total_price: '100.00', customer: { email: 'p@example.com' }, financial_status: 'paid' }, action: async () => {
        const json = window.prompt('JSON body', JSON.stringify({ id: 12345, email: 'p@example.com', created_at: new Date().toISOString(), currency: 'INR', total_price: '100.00', customer: { email: 'p@example.com' }, financial_status: 'paid' })) || '{}';
        const hmac = window.prompt('X-Shopify-Hmac-Sha256 (leave blank to expect 401)','') || '';
        await call('/webhooks/shopify', { method: 'POST', body: json, headers: hmac ? { 'X-Shopify-Hmac-Sha256': hmac, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' } }, false);
      } },
  ];

  return (
    <section className="container mx-auto py-12">
      <SectionTitle kicker="Debug" title="API Debug Panel" subtitle="Click an endpoint to call it (watch network tab). Prompts will appear for required ids." />
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
    </section>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-background"
      />
      <div className="container mx-auto py-20 md:py-28">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border bg-white/70 px-3 py-1 text-xs font-semibold text-foreground/80 shadow-sm backdrop-blur">
              Ayurveda-first • Vijaya compliant • Ethical
            </div>
            <h1 className="mt-5 text-4xl md:text-5xl font-extrabold leading-tight tracking-tight">
              Amiy Experts — Doctor Affiliate & Referral Network
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Earn 10–20% on prescriptions, build a doctor network, and lead
              educational care — all while upholding medical ethics.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {/* Join CTA routes to login/expert/dashboard based on auth status */}
              <JoinCTA>Join as Amiy Expert</JoinCTA>
              <Link
                to="/army"
                className="inline-flex items-center justify-center rounded-md border px-6 py-3 text-sm font-medium hover:bg-muted"
              >
                Explore Amiy Army
              </Link>
              <Link
                to="/shop"
                className="inline-flex items-center justify-center rounded-md border px-6 py-3 text-sm font-medium hover:bg-muted"
              >
                Shop at MRP
              </Link>
            </div>
            <dl className="mt-10 grid grid-cols-2 gap-6 text-sm">
              <div className="rounded-lg border bg-white/60 p-4 backdrop-blur">
                <dt className="font-semibold">Prescription Commission</dt>
                <dd className="text-muted-foreground">
                  10–20% per sale via your code
                </dd>
              </div>
              <div className="rounded-lg border bg-white/60 p-4 backdrop-blur">
                <dt className="font-semibold">Team Bonuses</dt>
                <dd className="text-muted-foreground">
                  Up to 5% on downline sales
                </dd>
              </div>
            </dl>
          </div>
          <div className="relative">
            <div className="absolute -inset-6 rounded-3xl bg-gradient-to-br from-primary/20 to-accent/30 blur-2xl" />
            <div className="relative rounded-3xl border bg-white p-6 shadow-2xl">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="rounded-xl border p-4">
                  <div className="text-xs font-semibold text-muted-foreground">
                    Direct Sales
                  </div>
                  <div className="mt-2 text-2xl font-bold">20%</div>
                  <p className="text-muted-foreground">
                    on product prescriptions
                  </p>
                </div>
                <div className="rounded-xl border p-4">
                  <div className="text-xs font-semibold text-muted-foreground">
                    Enroll Patients
                  </div>
                  <div className="mt-2 text-2xl font-bold">Bonus</div>
                  <p className="text-muted-foreground">
                    for Care Club sign-ups
                  </p>
                </div>
                <div className="rounded-xl border p-4">
                  <div className="text-xs font-semibold text-muted-foreground">
                    Refer Doctors
                  </div>
                  <div className="mt-2 text-2xl font-bold">1000</div>
                  <p className="text-muted-foreground">points per onboarding</p>
                </div>
                <div className="rounded-xl border p-4">
                  <div className="text-xs font-semibold text-muted-foreground">
                    Team Sales
                  </div>
                  <div className="mt-2 text-2xl font-bold">2–5%</div>
                  <p className="text-muted-foreground">
                    based on monthly volume
                  </p>
                </div>
              </div>
              <div className="mt-6 rounded-xl bg-secondary px-5 py-4 text-secondary-foreground">
                <p className="text-sm font-semibold">Compliance First</p>
                <p className="text-xs/5 opacity-90">
                  No hard selling. Consult-first care, Vijaya regulations
                  respected.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Compensation() {
  return (
    <section className="container mx-auto py-20">
      <SectionTitle
        kicker="Compensation Plan"
        title="Commissions, bonuses, and lifestyle rewards"
      />
      <div className="mt-10 grid gap-6 md:grid-cols-4">
        {[
          {
            label: "Consultation Commission",
            value: "10–20%",
            desc: "on product sales via your code",
          },
          {
            label: "Team Sales Bonus",
            value: "2–5%",
            desc: "on downline monthly sales",
          },
          {
            label: "Recruitment Bonus",
            value: "1000 pts",
            desc: "per successfully onboarded doctor",
          },
          {
            label: "Lifestyle Bonuses",
            value: "Trips & Gifts",
            desc: "for top performers",
          },
        ].map((i) => (
          <div
            key={i.label}
            className="rounded-2xl border bg-white p-6 text-center"
          >
            <div className="text-xs font-semibold text-muted-foreground">
              {i.label}
            </div>
            <div className="mt-2 text-3xl font-extrabold text-primary">
              {i.value}
            </div>
            <div className="mt-1 text-sm text-muted-foreground">{i.desc}</div>
          </div>
        ))}
      </div>
      <div className="mt-8 rounded-xl border bg-amber-50 p-5 text-amber-900">
        <p className="text-sm font-semibold">Bottle-based tiers</p>
        <p className="text-sm">
          ≥ 200 bottles/month: 5% team bonus • up to 100: 2–3% monthly
        </p>
      </div>
    </section>
  );
}

function Tiers() {
  return (
    <section className="relative">
      <div aria-hidden className="absolute inset-0 -z-10 bg-background" />
      <div className="container mx-auto py-20">
        <SectionTitle kicker="Ranks" title="Grow from Expert to Leader" />
        <div className="mt-10 grid gap-6 md:grid-cols-4">
          {[
            {
              level: "Amiy Doctor",
              req: "Onboarding completed",
              reward: "Basic commissions & patient bonuses",
            },
            {
              level: "Senior Expert",
              req: "50 patient enrollments + 20 doctor referrals",
              reward: "Higher commissions + exclusive events",
            },
            {
              level: "Gold Mentor",
              req: "5 active doctors + ₹1,00,000 monthly sales",
              reward: "Extra team bonus + brand recognition",
            },
            {
              level: "Platinum Leader",
              req: "50 active doctors + ₹5,00,000 monthly sales",
              reward: "Luxury trips + research sponsorships",
            },
          ].map((t) => (
            <div key={t.level} className="rounded-2xl border bg-white p-6">
              <div className="text-xs font-semibold text-muted-foreground">
                {t.level}
              </div>
              <div className="mt-2 font-semibold">Criteria</div>
              <p className="text-sm text-muted-foreground">{t.req}</p>
              <div className="mt-3 font-semibold">Rewards</div>
              <p className="text-sm text-muted-foreground">{t.reward}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Unilevel() {
  return (
    <section className="container mx-auto py-20">
      <SectionTitle kicker="Team Structure" title="Unilevel Commissions" />
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {[
          {
            level: "Level 1",
            value: "2.5%",
            desc: "on monthly sales of directly referred doctors",
          },
          {
            level: "Level 2",
            value: "1.5%",
            desc: "on monthly sales of your Level 1’s recruits",
          },
          {
            level: "Level 3",
            value: "1%",
            desc: "on monthly sales of Level 2 recruits",
          },
        ].map((l) => (
          <div
            key={l.level}
            className="rounded-2xl border bg-white p-6 text-center"
          >
            <div className="text-xs font-semibold text-muted-foreground">
              {l.level}
            </div>
            <div className="mt-2 text-3xl font-extrabold text-primary">
              {l.value}
            </div>
            <div className="mt-1 text-sm text-muted-foreground">{l.desc}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Implementation() {
  return (
    <section className="relative">
      <div aria-hidden className="absolute inset-0 -z-10 bg-background" />
      <div className="container mx-auto py-20">
        <SectionTitle
          kicker="Implementation"
          title="Onboarding, training, tools"
        />
        <ol className="mt-10 grid gap-6 md:grid-cols-3 list-decimal pl-5">
          {[
            {
              title: "Doctor Onboarding",
              desc: "Online sign-up portal with BAMS/MD verification, training, and starter kits.",
            },
            {
              title: "Training & Certification",
              desc: "Certified Amiy Expert course: Vijaya regulations, Bio-Neuro Modulation, clinical protocols.",
            },
            {
              title: "Marketing Tools",
              desc: "Doctor Dashboard/App, QR-linked prescription pad, social media creatives, and education kits.",
            },
            {
              title: "Social Selling",
              desc: "Share success stories, host live sessions, collaborate with Amiy on social.",
            },
            {
              title: "Events & Community",
              desc: "Monthly Zoom meets and annual Doctors Summit for recognition and awards.",
            },
            {
              title: "Corporate Partnerships",
              desc: "Introduce Amiy to clinics and companies; run wellness workshops.",
            },
          ].map((step) => (
            <li key={step.title} className="rounded-2xl border bg-white p-6">
              <h3 className="font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{step.desc}</p>
            </li>
          ))}
        </ol>
        <div className="mt-8 rounded-xl border bg-emerald-50 p-5 text-emerald-900">
          <p className="text-sm font-semibold">Bonus rule</p>
          <p className="text-sm">
            Level 1 expert earns ₹1000 bonus when their referred expert sells at
            least 3 bottles.
          </p>
        </div>
      </div>
    </section>
  );
}

function Compliance() {
  return (
    <section className="container mx-auto py-20">
      <SectionTitle kicker="Compliance" title="Ethical safeguards" />
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {[
          "Consult-first, no aggressive selling",
          "Transparent income disclosure",
          "Health outcomes over recruitment",
        ].map((t) => (
          <div key={t} className="rounded-2xl border bg-white p-6">
            <p className="text-sm font-medium">{t}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Success() {
  return (
    <section className="relative">
      <div aria-hidden className="absolute inset-0 -z-10 bg-background" />
      <div className="container mx-auto py-20">
        <SectionTitle
          kicker="Success Factors"
          title="Recurring income, scalable growth, brand loyalty"
        />
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Recurring Income",
              desc: "VIP subscriptions and repeat purchase agreements drive stability.",
            },
            {
              title: "Scalable Growth",
              desc: "A doctor-first network where experts recruit and mentor experts.",
            },
            {
              title: "Brand Loyalty",
              desc: "Patients stay with their prescribing doctor and with Amiy.",
            },
          ].map((c) => (
            <div key={c.title} className="rounded-2xl border bg-white p-6">
              <h3 className="text-lg font-semibold">{c.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Journey() {
  return (
    <section className="container mx-auto py-20">
      <SectionTitle
        kicker="Customer Journey"
        title="From website visit to Expert dashboard"
      />
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border bg-white p-6">
          <h3 className="font-semibold">1) Home Website</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Shop at MRP or join Amiy Army for member benefits and referral
            rewards.
          </p>
          <div className="mt-4 rounded-lg bg-muted p-4 text-sm">
            Clear CTA: “Join as Amiy Army to Save & Earn” across homepage and
            product pages.
          </div>
        </div>
        <div className="rounded-2xl border bg-white p-6">
          <h3 className="font-semibold">2) Join as Amiy Expert</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Dedicated portal/app for expert sign-ups and earnings. Tiered offers
            prompt higher-value carts.
          </p>
        </div>
        <div className="rounded-2xl border bg-white p-6">
          <h3 className="font-semibold">3) Amiy Army Subscription</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Opt into RPA for auto-refill benefits: 10% OFF, loyalty rewards,
            early access.
          </p>
        </div>
        <div className="rounded-2xl border bg-white p-6">
          <h3 className="font-semibold">4) Activation & Dashboard</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            See earnings, team performance, orders, learning resources, top
            performers, and ranks.
          </p>
        </div>
        <div className="rounded-2xl border bg-white p-6">
          <h3 className="font-semibold">5) Referral Rewards</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Share links to onboard VIP customers or new Experts and grow your
            rank.
          </p>
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="relative overflow-hidden">
      <div aria-hidden className="absolute inset-0 -z-10 bg-background" />
      <div className="container mx-auto py-16">
        <div className="mx-auto max-w-4xl rounded-3xl border bg-white/80 p-8 text-center shadow-xl backdrop-blur">
          <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Become a Certified Amiy Expert
          </h3>
          <p className="mt-3 text-muted-foreground">
            Complete training on Vijaya regulations, Bio‑Neuro Modulation, and
            clinical protocols to earn credibility and income.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/join"
              className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90"
            >
              Start Onboarding
            </Link>
            <Link
              to="/compensation"
              className="inline-flex items-center justify-center rounded-md border px-6 py-3 text-sm font-medium hover:bg-muted"
            >
              View Plan
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
