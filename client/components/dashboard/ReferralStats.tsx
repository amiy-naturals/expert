import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function ReferralStats({ userId }: { userId?: string }) {
  const [stats, setStats] = useState<any>(null);
  useEffect(() => {
    if (!userId) return;
    apiFetch('/referrals/summary')
      .then((d) => setStats(d))
      .catch(() => setStats(null));
  }, [userId]);

  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="font-semibold">Referral Network</div>
      <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
        <div className="text-center">
          <div className="font-bold">{stats?.level1 ?? '—'}</div>
          <div className="text-muted-foreground">Level 1</div>
        </div>
        <div className="text-center">
          <div className="font-bold">{stats?.level2 ?? '—'}</div>
          <div className="text-muted-foreground">Level 2</div>
        </div>
        <div className="text-center">
          <div className="font-bold">{stats?.level3 ?? '—'}</div>
          <div className="text-muted-foreground">Level 3</div>
        </div>
      </div>
    </div>
  );
}
