import { Link } from "react-router-dom";

import JoinCTA from '@/components/site/JoinCTA';

export default function Join() {
  const steps = [
    {
      title: "Create your account",
      desc: "Register on the Amiy Naturals Doctor Network portal.",
    },
    {
      title: "Verify credentials",
      desc: "Upload BAMS/MD Ayurveda certificate and ID for verification.",
    },
    {
      title: "Complete training",
      desc: "Short modules on Vijaya regulations, Bio‑Neuro Modulation, and clinical protocols.",
    },
    {
      title: "Get your starter kit",
      desc: "Product samples and marketing material to begin ethical consultations.",
    },
  ];

  return (
    <div className="bg-background text-foreground">
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/10 via-emerald-100 to-amber-50"
        />
        <div className="container mx-auto py-16 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
              Become a Certified Amiy Expert
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Educate, prescribe ethically, and grow your professional network
              with recurring income streams.
            </p>
            <div className="mt-8 flex justify-center gap-3">
              <JoinCTA>Start Onboarding</JoinCTA>
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

      <section className="container mx-auto py-16">
        <h2 className="text-2xl md:text-3xl font-bold">Onboarding Process</h2>
        <ol className="mt-8 grid gap-6 md:grid-cols-2 list-decimal pl-5">
          {steps.map((s) => (
            <li key={s.title} className="rounded-2xl border bg-white p-6">
              <h3 className="font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
            </li>
          ))}
        </ol>
        <div className="mt-8 rounded-xl border bg-emerald-50 p-5 text-emerald-900">
          <p className="text-sm font-semibold">Referral rule</p>
          <p className="text-sm">
            Referrer earns ₹1000 bonus after your first 3 bottles sold.
          </p>
        </div>
      </section>

      <section className="relative">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent to-emerald-50"
        />
        <div className="container mx-auto py-16">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border bg-white p-6">
              <div className="text-xs font-semibold text-muted-foreground">
                Eligibility
              </div>
              <p className="mt-2 text-sm">
                BAMS, MD Ayurveda, or qualified wellness consultant.
              </p>
            </div>
            <div className="rounded-2xl border bg-white p-6">
              <div className="text-xs font-semibold text-muted-foreground">
                Compliance
              </div>
              <p className="mt-2 text-sm">
                Consult-first care, no aggressive selling, and transparent
                income disclosure.
              </p>
            </div>
            <div className="rounded-2xl border bg-white p-6">
              <div className="text-xs font-semibold text-muted-foreground">
                Tools
              </div>
              <p className="mt-2 text-sm">
                Doctor dashboard/app, QR prescription pad, and patient education
                kits.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
