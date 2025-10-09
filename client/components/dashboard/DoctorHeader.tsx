import React from 'react';
import BadgeRank from '@/components/ui/BadgeRank';
import { getUser } from '@/lib/auth';

export default function DoctorHeader({ user }: { user?: any }) {
  const u = user ?? getUser();
  const rank = (u?.rank as any) ?? 'doctor';

  return (
    <div className="rounded-2xl border bg-white p-4 flex items-center gap-4">
      <div className="h-16 w-16 rounded-full bg-muted overflow-hidden flex items-center justify-center text-xl font-bold">{u?.avatar ? <img src={u.avatar} alt={u.name} className="h-full w-full object-cover" /> : (u?.name?.[0] ?? 'D')}</div>
      <div className="flex-1">
        <div className="text-lg font-semibold">{u?.name ?? 'Amiy Doctor'}</div>
        <div className="text-sm text-muted-foreground">{u?.clinic ?? ''}</div>
      </div>
      <div>
        <BadgeRank variant={rank === 'senior_expert' ? 'senior_expert' : rank === 'gold_mentor' ? 'gold_mentor' : rank === 'platinum_leader' ? 'platinum_leader' : 'doctor'} />
      </div>
    </div>
  );
}
