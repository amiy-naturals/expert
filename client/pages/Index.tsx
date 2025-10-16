import { Link } from "react-router-dom";
import ReviewsSection from '@/components/Reviews/Reviews';
import JoinCTA from '@/components/site/JoinCTA';
import { toast } from 'sonner';
import { openRazorpay } from '@/lib/razorpay';

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
