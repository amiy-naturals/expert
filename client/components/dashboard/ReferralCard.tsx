import React from 'react';
import { getUser } from '@/lib/auth';

export default function ReferralCard({ user }: { user?: any }) {
  const u = user ?? getUser();
  const verified = Boolean(u?.is_doctor_verified);
  const code = u ? (u.email?.split('@')[0] ?? u.id) : 'anon';
  const link = `${window.location.origin}/ref/${encodeURIComponent(code)}`;

  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold">Referral Link</div>
          <div className="text-sm text-muted-foreground">Share to invite patients and doctors</div>
        </div>
        <div>
          <button disabled={!verified} title={!verified ? 'Activate by completing doctor verification.' : ''} className={`rounded-md px-3 py-2 text-sm ${verified ? 'bg-primary text-primary-foreground' : 'border text-muted-foreground'}`} onClick={() => { if (verified) { navigator.clipboard?.writeText(link); alert('Referral link copied'); } }}>
            {verified ? 'Copy Link' : 'Inactive'}
          </button>
        </div>
      </div>
      {verified && (
        <div className="mt-3 text-sm break-all text-primary">{link}</div>
      )}
    </div>
  );
}
