import React, { useEffect, useState } from 'react';
import { ReviewsAPI } from '@/lib/api';
import { getUser } from '@/lib/auth';

export default function DoctorReviews({ targetUserId }: { targetUserId: string }) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    ReviewsAPI.list(10)
      .then((d: any[]) => setReviews(d.filter((r: any) => r.target_user_id === targetUserId)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [targetUserId]);

  async function submit() {
    const u = getUser();
    if (!u) return alert('Please sign in');
    if (!u.avatar_approved) return alert('You need an approved profile image to post reviews');
    const rating = Number(prompt('Rating 1-5'));
    const title = prompt('Title') || '';
    const body = prompt('Your review') || '';
    try {
      await ReviewsAPI.create({ user_id: u.id, rating, title, body, review_type: 'doctor', target_user_id: targetUserId });
      alert('Thanks! Your review was submitted and is pending approval.');
    } catch (err) {
      alert(String(err));
    }
  }

  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Reviews</h3>
        <button className="rounded border px-3 py-1 text-sm" onClick={submit}>Leave a review</button>
      </div>
      <div className="mt-4">
        {loading ? <div>Loading...</div> : reviews.length === 0 ? <div className="text-sm text-muted-foreground">No reviews yet.</div> : (
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
        )}
      </div>
    </div>
  );
}
