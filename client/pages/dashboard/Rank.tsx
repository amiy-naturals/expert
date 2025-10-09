import { useQuery } from '@tanstack/react-query';
import { RankAPI } from '@/lib/api';

export default function RankPage() {
  const { data, isLoading, isError, error } = useQuery({ queryKey: ['rank','me'], queryFn: () => RankAPI.me() });
  const rank = (data as any)?.rank as string | undefined;
  const stats = (data as any)?.stats as any | undefined;
  const progress = (data as any)?.progress as { by: { label: string; value: number; target: number; pct: number }[]; overallPct: number } | undefined;

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Rank & Milestones</h1>
      <p className="mt-2 text-sm text-muted-foreground">Your current rank and live progress based on Supabase data.</p>

      <div className="mt-6 rounded-2xl border bg-white p-6">
        <div className="text-xs font-semibold text-muted-foreground">Current Rank</div>
        <div className="mt-2 text-2xl font-extrabold text-primary">{rank?.replaceAll('_',' ') ?? '—'}</div>
        {isLoading && <p className="mt-1 text-sm text-muted-foreground">Loading…</p>}
        {isError && <p className="mt-1 text-sm text-red-600">{(error as Error)?.message || 'Failed to load rank'}</p>}
      </div>

      {progress && (
        <div className="mt-6 rounded-2xl border bg-white p-6">
          <div className="text-sm font-semibold">Overall Progress — {progress.overallPct}%</div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary" style={{ width: `${progress.overallPct}%` }} />
          </div>
          <div className="mt-4 grid gap-3">
            {progress.by.map((p) => (
              <div key={p.label}>
                <div className="flex items-center justify-between text-sm">
                  <span>{p.label}</span>
                  <span className="text-muted-foreground">{p.value} / {p.target}</span>
                </div>
                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-primary" style={{ width: `${p.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats && (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <StatCard label="Monthly Sales (₹)" value={Number(stats.monthlySales || 0).toLocaleString()} />
          <StatCard label="Total Sales (₹)" value={Number(stats.totalSales || 0).toLocaleString()} />
          <StatCard label="Patients" value={String(stats.patients || 0)} />
          <StatCard label="Doctor Referrals" value={String(stats.doctorReferrals || 0)} />
          <StatCard label="Active Doctors" value={String(stats.activeDoctors || 0)} />
        </div>
      )}
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
