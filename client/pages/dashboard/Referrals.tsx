import { getUser, referralCodeFor } from "@/lib/auth";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export default function Referrals() {
  const user = getUser();
  const code = user ? referralCodeFor(user) : "AM-EXPERT";
  const link = `${window.location.origin}/?ref=${code}`;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["referrals","network"],
    queryFn: () => apiFetch("/referrals/network"),
  });
  const level1 = (data as any)?.level1 ?? [];
  const level2 = (data as any)?.level2 ?? [];
  const level3 = (data as any)?.level3 ?? [];
  const summary = (data as any)?.summary ?? { totalNetworkSales: 0, totalReferralPoints: 0 };

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Referrals</h1>
      <p className="mt-2 text-sm text-muted-foreground">Share your code and link to earn commissions and grow your team.</p>
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border bg-white p-6">
          <div className="text-xs font-semibold text-muted-foreground">Your Code</div>
          <div className="mt-2 text-2xl font-extrabold">{code}</div>
          <button className="mt-4 inline-flex items-center justify-center rounded-md border px-3 py-2 text-sm hover:bg-muted" onClick={() => { navigator.clipboard.writeText(code); (async () => (await import('sonner')).toast.success('Copied code'))(); }}>
            Copy Code
          </button>
        </div>
        <div className="rounded-2xl border bg-white p-6">
          <div className="text-xs font-semibold text-muted-foreground">Referral Link</div>
          <div className="mt-2 break-all text-sm">{link}</div>
          <button className="mt-4 inline-flex items-center justify-center rounded-md border px-3 py-2 text-sm hover:bg-muted" onClick={() => { navigator.clipboard.writeText(link); (async () => (await import('sonner')).toast.success('Copied link'))(); }}>
            Copy Link
          </button>
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <StatCard label="Total Network Sales" value={`₹${Number(summary.totalNetworkSales).toLocaleString()}`} />
        <StatCard label="Total Points from Referrals" value={`${Number(summary.totalReferralPoints).toLocaleString()} pts`} />
        <StatCard label="Team Size" value={`${level1.length + level2.length + level3.length}`} />
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        <LevelTable title="Level 1 (2.5%)" rows={level1} />
        <LevelTable title="Level 2 (1.5%)" rows={level2} />
        <LevelTable title="Level 3 (1%)" rows={level3} />
      </div>

      {isLoading && <div className="mt-4 text-sm text-muted-foreground">Loading network…</div>}
      {isError && <div className="mt-4 text-sm text-red-600">{(error as Error)?.message || "Failed to load referrals"}</div>}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-white p-6">
      <div className="text-xs font-semibold text-muted-foreground">{label}</div>
      <div className="mt-2 text-2xl font-extrabold">{value}</div>
    </div>
  );
}

function LevelTable({ title, rows }: { title: string; rows: any[] }) {
  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="px-2 py-1 text-sm font-semibold">{title}</div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-muted-foreground">
              <th className="p-2">Name</th>
              <th className="p-2">Email</th>
              <th className="p-2">Purchases</th>
              <th className="p-2">Points</th>
              <th className="p-2">Commission %</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={5} className="p-3 text-xs text-muted-foreground">No referrals</td></tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-2">{r.name || "—"}</td>
                <td className="p-2">{r.email || "—"}</td>
                <td className="p-2">{r.orders ?? 0}</td>
                <td className="p-2">{r.points ?? 0}</td>
                <td className="p-2">{Math.round((r.commissionPct ?? 0) * 1000) / 10}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
