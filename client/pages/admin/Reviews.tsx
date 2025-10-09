import React, { useEffect, useState } from 'react';
import { AdminAPI } from '@/lib/api';

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    // There is no dedicated admin reviews list endpoint; reuse admin users-> reviews or fetch all reviews and filter
    fetch('/api/reviews')
      .then((r) => r.json())
      .then((d) => setReviews(d))
      .catch(() => setReviews([]));
  }, []);

  async function approve(id: string) {
    await AdminAPI.approveReview(id);
    setReviews((s) => s.filter((r) => r.id !== id));
    alert('Approved');
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-extrabold">Moderate Reviews</h1>
      <div className="mt-4 space-y-3">
        {reviews.map((r) => (
          <div key={r.id} className="rounded border p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">{r.title || '—'}</div>
                <div className="text-xs text-muted-foreground">by {r.users?.name || 'Anonymous'}</div>
              </div>
              <div className="flex items-center gap-2">
                <button className="rounded-md bg-green-600 px-3 py-1 text-sm text-white" onClick={() => approve(r.id)}>Approve</button>
              </div>
            </div>
            <div className="mt-2 text-sm">{r.body}</div>
          </div>
        ))}
        {reviews.length === 0 && <div className="rounded border p-4">No reviews to moderate.</div>}
      </div>
    </div>
  );
}
