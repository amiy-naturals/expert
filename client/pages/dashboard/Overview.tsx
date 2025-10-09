import { useQuery } from '@tanstack/react-query';
import { RankAPI, apiFetch } from '@/lib/api';

export default function Overview() {
  const { data: rankData } = useQuery({ queryKey: ["rank","me"], queryFn: () => RankAPI.me() as any });
  const { data: network } = useQuery({ queryKey: ["referrals","network"], queryFn: () => apiFetch('/referrals/network') as any });
  const monthly = Number(rankData?.stats?.monthlySales ?? 0);
  const patients = Number(rankData?.stats?.patients ?? 0);
  const activeDocs = Number(rankData?.stats?.activeDoctors ?? 0);
  const teamSales = Number(network?.summary?.totalNetworkSales ?? 0);
  const stats = [
    { label: "Earnings (this month)", value: `₹${monthly.toLocaleString()}` },
    { label: "Team Sales", value: `₹${teamSales.toLocaleString()}` },
    { label: "Patients Enrolled", value: String(patients) },
    { label: "Active Doctors", value: String(activeDocs) },
  ];
  const items = [
    {
      title: "Order History",
      desc: "Recent orders and repeat schedule",
      to: "/dashboard/orders",
    },
    {
      title: "Learning Resources",
      desc: "Vijaya regs, protocols, training",
      to: "/dashboard/resources",
    },
    {
      title: "Top Performers",
      desc: "Leaderboard of this month",
      to: "/dashboard/team",
    },
    {
      title: "Rank & Milestones",
      desc: "Progress toward next rank",
      to: "/dashboard/rank",
    },
  ];
  return (
    <div className="py-2">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Expert Dashboard
          </h1>
          <p className="mt-2 text-muted-foreground">Your performance snapshot, live from Supabase.</p>
        </div>
        <a
          href="/dashboard/referrals"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow hover:opacity-90"
        >
          Share Referral Link
        </a>
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
          <a
            key={i.title}
            href={i.to}
            className="rounded-2xl border bg-white p-6 transition hover:shadow-md"
          >
            <div className="font-semibold">{i.title}</div>
            <p className="mt-2 text-sm text-muted-foreground">{i.desc}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
