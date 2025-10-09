import React, { useEffect, useState } from 'react';
import { RankAPI } from '@/lib/api';

export default function RankProgress() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    RankAPI.me()
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading rank...</div>;
  if (!data) return <div>No rank data</div>;

  const progress = data.progress;

  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold text-muted-foreground">Current Rank</div>
          <div className="mt-1 text-2xl font-extrabold text-primary">{String(data.rank)}</div>
        </div>
      </div>

      {progress && (
        <div className="mt-4">
          <div className="text-sm font-semibold">Overall Progress — {progress.overallPct}%</div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary" style={{ width: `${progress.overallPct}%` }} />
          </div>
          <div className="mt-4 grid gap-3">
            {progress.by.map((p: any) => (
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
    </div>
  );
}
