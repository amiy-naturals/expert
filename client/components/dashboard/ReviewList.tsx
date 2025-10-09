import React from 'react';

export default function ReviewList({ reviews }: { reviews: any[] }) {
  if (!reviews || reviews.length === 0) return <div className="text-sm text-muted-foreground">No reviews yet.</div>;
  return (
    <div className="space-y-3">
      {reviews.map((r) => (
        <div key={r.id} className="rounded border p-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">{r.title || '—'}</div>
              <div className="text-xs text-muted-foreground">by {r.users?.name || 'Anonymous'}</div>
            </div>
            <div className="text-sm">{new Date(r.created_at).toLocaleDateString()}</div>
          </div>
          <div className="mt-2 text-sm">{r.body}</div>
        </div>
      ))}
    </div>
  );
}
