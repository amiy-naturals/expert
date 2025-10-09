import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function CommissionPanel({ userId }: { userId?: string }) {
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    if (!userId) return;
    apiFetch('/admin/metrics')
      .then((d) => setData(d))
      .catch(() => setData(null));
  }, [userId]);

  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="font-semibold">Earnings</div>
      <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
        <div>
          <div className="font-bold">{data ? `₹${(data.earnings ?? 0).toLocaleString()}` : '—'}</div>
          <div className="text-muted-foreground">Lifetime</div>
        </div>
        <div>
          <div className="font-bold">{data ? data.usersCount : '—'}</div>
          <div className="text-muted-foreground">Users</div>
        </div>
        <div>
          <div className="font-bold">—</div>
          <div className="text-muted-foreground">Withdrawable</div>
        </div>
      </div>
    </div>
  );
}
