export default function Dashboard() {
  const stats = [
    { label: "Earnings (this month)", value: "₹24,500" },
    { label: "Team Sales", value: "₹3,20,000" },
    { label: "Patients Enrolled", value: "58" },
    { label: "Active Doctors", value: "12" },
  ];

  const items = [
    { title: "Order History", desc: "Recent orders and repeat schedule" },
    { title: "Learning Resources", desc: "Vijaya regs, protocols, training" },
    { title: "Top Performers", desc: "Leaderboard of this month" },
    { title: "Rank & Milestones", desc: "Progress toward next rank" },
  ];

  return (
    <div className="container mx-auto py-16">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Expert Dashboard
          </h1>
          <p className="mt-2 text-muted-foreground">
            Demo preview with illustrative data.
          </p>
        </div>
        <button className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow hover:opacity-90">
          Share Referral Link
        </button>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border bg-white p-6">
            <div className="text-xs font-semibold text-muted-foreground">
              {s.label}
            </div>
            <div className="mt-2 text-2xl font-extrabold">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {items.map((i) => (
          <div key={i.title} className="rounded-2xl border bg-white p-6">
            <div className="font-semibold">{i.title}</div>
            <p className="mt-2 text-sm text-muted-foreground">{i.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
