import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

export default function Team() {
  const { data, isLoading, isError, error } = useQuery({ queryKey: ['referrals','network'], queryFn: () => apiFetch('/referrals/network') });
  const level1 = (data as any)?.level1 ?? [];
  const level2 = (data as any)?.level2 ?? [];
  const level3 = (data as any)?.level3 ?? [];
  const levels = [
    { level: 'Level 1', percent: '2.5%', doctors: level1.filter((r: any) => r.role === 'doctor').length },
    { level: 'Level 2', percent: '1.5%', doctors: level2.filter((r: any) => r.role === 'doctor').length },
    { level: 'Level 3', percent: '1%', doctors: level3.filter((r: any) => r.role === 'doctor').length },
  ];
  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
        Your Team
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">Track your downline from Supabase referrals graph.</p>
      {isLoading && <div className="mt-2 text-sm text-muted-foreground">Loading…</div>}
      {isError && <div className="mt-2 text-sm text-red-600">{(error as Error)?.message || 'Failed to load team'}</div>}
      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {levels.map((l) => (
          <div
            key={l.level}
            className="rounded-2xl border bg-white p-6 text-center"
          >
            <div className="text-xs font-semibold text-muted-foreground">
              {l.level}
            </div>
            <div className="mt-2 text-3xl font-extrabold text-primary">
              {l.percent}
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              Active doctors: {l.doctors}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
