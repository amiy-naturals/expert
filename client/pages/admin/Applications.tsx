import React, { useEffect, useState } from 'react';
import { DoctorsAPI } from '@/lib/api';

export default function AdminApplications() {
  const [apps, setApps] = useState<any[]>([]);

  useEffect(() => {
    DoctorsAPI.adminListApplications()
      .then((d) => setApps(d))
      .catch(() => setApps([]));
  }, []);

  async function approve(id: string) {
    if (!confirm('Approve this application?')) return;
    await DoctorsAPI.adminApproveApplication(id);
    setApps((s) => s.filter((a) => a.id !== id));
    alert('Approved');
  }

  async function reject(id: string) {
    if (!confirm('Reject this application?')) return;
    await DoctorsAPI.adminRejectApplication(id);
    setApps((s) => s.filter((a) => a.id !== id));
    alert('Rejected');
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-extrabold">Doctor Applications</h1>
      <div className="mt-4 space-y-3">
        {apps.map((a) => (
          <div key={a.id} className="rounded border p-4 flex items-center justify-between">
            <div>
              <div className="font-semibold">{a.users?.name || 'Unknown'}</div>
              <div className="text-xs text-muted-foreground">Submitted {new Date(a.created_at).toLocaleDateString()}</div>
            </div>
            <div className="flex items-center gap-2">
              <button className="rounded-md bg-green-600 px-3 py-1 text-sm text-white" onClick={() => approve(a.id)}>Approve</button>
              <button className="rounded-md border px-3 py-1 text-sm" onClick={() => reject(a.id)}>Reject</button>
            </div>
          </div>
        ))}
        {apps.length === 0 && <div className="rounded border p-4">No pending applications.</div>}
      </div>
    </div>
  );
}
