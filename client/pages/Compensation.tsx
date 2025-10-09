export default function Compensation() {
  const incomes = [
    {
      label: "Consultation Commission",
      value: "10–20%",
      desc: "on sales via your code",
    },
    {
      label: "Patient Discount",
      value: "10% + 10–15% coupon",
      desc: "for new customers",
    },
    {
      label: "Team Sales Bonus",
      value: "2–5%",
      desc: "based on monthly volume",
    },
    {
      label: "Recruitment Bonus",
      value: "1000 pts",
      desc: "5 pts = ₹1, one‑time per doctor",
    },
    {
      label: "Rank Rewards",
      value: "Cash / Gifts / Trips",
      desc: "on milestones",
    },
    {
      label: "Lifestyle Bonuses",
      value: "Retreats & Conferences",
      desc: "for top performers",
    },
  ];

  const levels = [
    {
      level: "Level 1",
      value: "2.5%",
      desc: "on sales of directly referred doctors",
    },
    { level: "Level 2", value: "1.5%", desc: "on sales of Level 1 recruits" },
    { level: "Level 3", value: "1%", desc: "on sales of Level 2 recruits" },
  ];

  const ranks = [
    {
      name: "Amiy Doctor",
      req: "Onboarding completed",
      reward: "Basic commission & patient bonuses",
    },
    {
      name: "Senior Expert",
      req: "50 patients + 20 doctor referrals",
      reward: "Higher commission + exclusive events",
    },
    {
      name: "Gold Mentor",
      req: "5 active doctors + ₹1,00,000 sales",
      reward: "Extra team bonus + features",
    },
    {
      name: "Platinum Leader",
      req: "50 active doctors + ₹5,00,000 sales",
      reward: "Luxury trips + research sponsorships",
    },
  ];

  return (
    <div className="bg-background text-foreground">
      <section className="container mx-auto py-16 md:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
            Amiy Expert Compensation Plan
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Commissions, bonuses, and recognition designed to reward ethical
            practice and team growth.
          </p>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3 lg:grid-cols-3">
          {incomes.map((i) => (
            <div
              key={i.label}
              className="rounded-2xl border bg-white p-6 text-center"
            >
              <div className="text-xs font-semibold text-muted-foreground">
                {i.label}
              </div>
              <div className="mt-2 text-2xl font-extrabold text-primary">
                {i.value}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">{i.desc}</div>
            </div>
          ))}
        </div>
        <div className="mt-8 rounded-xl border bg-amber-50 p-5 text-amber-900">
          <p className="text-sm">
            Bottle tiers: ≥ 200 bottles → 5% team bonus; up to 100 → 2–3%
            monthly.
          </p>
        </div>
      </section>

      <section className="relative">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-b from-emerald-50 to-transparent"
        />
        <div className="container mx-auto py-16">
          <h2 className="text-2xl md:text-3xl font-bold text-center">
            Unilevel Commission Structure
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {levels.map((l) => (
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
                <div className="mt-1 text-sm text-muted-foreground">
                  {l.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto py-16">
        <h2 className="text-2xl md:text-3xl font-bold text-center">
          Rank Advancement
        </h2>
        <div className="mt-10 grid gap-6 md:grid-cols-4">
          {ranks.map((r) => (
            <div key={r.name} className="rounded-2xl border bg-white p-6">
              <div className="text-xs font-semibold text-muted-foreground">
                {r.name}
              </div>
              <div className="mt-2 font-semibold">Criteria</div>
              <p className="text-sm text-muted-foreground">{r.req}</p>
              <div className="mt-3 font-semibold">Rewards</div>
              <p className="text-sm text-muted-foreground">{r.reward}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
