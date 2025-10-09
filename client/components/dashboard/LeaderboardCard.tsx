import React from 'react';
import BadgeRank from '@/components/ui/BadgeRank';

export default function LeaderboardCard({ position, doctor, metric }: { position: number; doctor: any; metric: string }) {
  return (
    <div className="rounded border p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="text-xl font-bold">#{position}</div>
        <div>
          <div className="font-semibold">{doctor?.name ?? 'Unknown'}</div>
          <div className="text-xs text-muted-foreground">{doctor?.clinic_city ?? ''}</div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-sm font-semibold">{metric}</div>
        <BadgeRank variant={(doctor?.rank as any) ?? 'doctor'} />
      </div>
    </div>
  );
}
