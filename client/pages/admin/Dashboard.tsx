import { useEffect, useState } from 'react';
import { AdminAPI } from '@/lib/api';

export default function AdminDashboard() {
  const [usersCount, setUsersCount] = useState<number | null>(null);
  const [earnings, setEarnings] = useState<number | null>(null);

  useEffect(() => {
    AdminAPI.metrics()
      .then((m: any) => {
        setUsersCount(m.usersCount ?? 0);
        setEarnings(Number(m.earnings) || 0);
      })
      .catch(() => {
        AdminAPI.listUsers().then((d: any[]) => setUsersCount(d.length)).catch(() => setUsersCount(0));
      });
  }, []);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-semibold">Super Admin Dashboard</h1>
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="rounded border p-4">Users: {usersCount ?? '—'}</div>
        <div className="rounded border p-4">Earnings: {earnings !== null ? `₹${earnings.toLocaleString()}` : '—'}</div>
        <div className="rounded border p-4">Recent Reviews: (see reviews page)</div>
      </div>
    </div>
  );
}
