import React from 'react';
import BadgeRank from '@/components/ui/BadgeRank';

export default function BadgeShowcase({ badges }: { badges?: string[] }) {
  const items = badges ?? ['doctor'];
  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="font-semibold">Badges</div>
      <div className="mt-3 flex gap-3 flex-wrap">
        {items.map((b) => (
          <BadgeRank key={b} variant={b as any} />
        ))}
      </div>
    </div>
  );
}
