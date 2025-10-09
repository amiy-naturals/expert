import { Link } from "react-router-dom";

export default function Army() {
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
              Amiy Army — VIP Membership
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Join the community program for discounted prices, free follow-ups,
              personalized health charts, and loyalty rewards.
            </p>
            <div className="mt-8 flex justify-center gap-3">
              <Link
                to="/join"
                className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90"
              >
                Become an Amiy Expert
              </Link>
              <a
                href="#rpa"
                className="inline-flex items-center justify-center rounded-md border px-6 py-3 text-sm font-medium hover:bg-muted"
              >
                Activate RPA
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl md:text-3xl font-bold">Member Benefits</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              "10% OFF on all future purchases",
              "New customer coupon of 10–15%",
              "Discounted bundle pricing",
              "Free consultations and follow-ups",
              "Personalized Ayurvedic health charts",
              "Early access to innovations",
              "Loyalty rewards and free gifts",
              "Referral bonuses via Amiy Army structure",
            ].map((b) => (
              <div key={b} className="rounded-2xl border bg-white p-5 text-sm">
                {b}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="rpa" className="relative">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-b from-amber-50 to-transparent"
        />
        <div className="container mx-auto py-16">
          <div className="mx-auto max-w-4xl rounded-2xl border bg-white p-6">
            <h3 className="text-xl font-semibold">
              Repeat Purchase Agreement (RPA)
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Opt-in for monthly or bi‑monthly auto‑refill to keep your regimen
              on track. Enjoy continuous 10% OFF, loyalty points, and exclusive
              bonuses.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow hover:opacity-90">
                Activate RPA
              </button>
              <Link
                to="/shop"
                className="inline-flex items-center justify-center rounded-md border px-6 py-3 text-sm font-medium hover:bg-muted"
              >
                Browse Products
              </Link>
            </div>
          </div>
          <p className="mt-6 text-xs text-muted-foreground">
            Note: Membership can be free; optional one‑time or annual fee can be
            considered later.
          </p>
        </div>
      </section>
    </div>
  );
}
