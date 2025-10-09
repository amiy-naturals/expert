import React, { useEffect, useState } from 'react';
import { LeaderboardAPI } from '@/lib/api';
import BadgeRank from '@/components/ui/BadgeRank';

export default function LeaderboardPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [cat, setCat] = useState<string>('most_level1');
  const [entries, setEntries] = useState<any[]>([]);

  useEffect(() => {
    LeaderboardAPI.categories()
      .then((d) => setCategories(d))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    LeaderboardAPI.get(cat)
      .then((d) => setEntries(d.entries ?? []))
      .catch(() => setEntries([]));
  }, [cat]);

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Community Leaderboard</h1>
      <p className="mt-2 text-sm text-muted-foreground">Top performers this week.</p>

      <div className="mt-6 flex gap-2">
        {categories.map((c) => (
          <button key={c.key} className={`rounded-md px-3 py-2 text-sm ${c.key === cat ? 'bg-primary text-primary-foreground' : 'border hover:bg-muted'}`} onClick={() => setCat(c.key)}>
            {c.label}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {entries.length === 0 && <div className="rounded border p-4">Leaderboard is empty for this week.</div>}
        {entries.map((e: any, i: number) => (
          <div key={e.user_id} className="rounded border p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-muted overflow-hidden flex items-center justify-center">{e.users?.name?.[0] ?? 'D'}</div>
              <div>
                <div className="font-semibold">{e.users?.name ?? 'Unknown'}</div>
                <div className="text-xs text-muted-foreground">{e.users?.clinic_city ?? ''}</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm">{e.value}</div>
              <BadgeRank variant={(e.users?.rank as any) ?? 'doctor'} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
