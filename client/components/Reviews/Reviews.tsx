import { useEffect, useState } from 'react';
import { ReviewsAPI } from '@/lib/api';
import { getUser } from '@/lib/auth';

export default function ReviewsSection() {
  const [latest, setLatest] = useState<any[]>([]);
  const [more, setMore] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    ReviewsAPI.list(10)
      .then((d: any[]) => setLatest(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function loadMore() {
    const last = more.length ? more[more.length - 1].created_at : latest[latest.length - 1]?.created_at;
    ReviewsAPI.list(10, last)
      .then((d: any[]) => setMore((m) => [...m, ...d]))
      .catch(() => {});
  }

  function canLeaveReview() {
    const u = getUser();
    return Boolean(u && u.avatar_approved);
  }

  async function leaveReview() {
    const u = getUser();
    if (!u) return alert('Please sign in');
    if (!u.avatar_approved) return alert('You must have an approved profile image to post reviews');
    const rating = Number(prompt('Rating 1-5'));
    const title = prompt('Title') || '';
    const body = prompt('Your review') || '';
    try {
      await ReviewsAPI.create({ user_id: u.id, rating, title, body });
      alert('Thanks! Your review was submitted.');
    } catch (err) {
      alert(String(err));
    }
  }

  return (
    <section className="container mx-auto py-12">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Customer Reviews</h2>
        <div>
          <button
            className="rounded border px-4 py-2 text-sm"
            onClick={leaveReview}
          >
            Leave a review
          </button>
        </div>
      </div>

      <div className="mt-6">
        {loading ? (
          <div>Loading reviews...</div>
        ) : (
          <div className="overflow-hidden">
            <div className="flex gap-4 overflow-x-auto py-2">
              {latest.map((r) => (
                <div key={r.id} className="min-w-[220px] md:min-w-[260px] flex-shrink-0 border p-4">
                  <div className="font-semibold">{r.title || '—'}</div>
                  <div className="text-xs text-muted-foreground">by {r.users?.name || 'Anonymous'}</div>
                  <div className="mt-2 text-sm">{r.body}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-6">
        <button className="rounded border px-4 py-2 text-sm" onClick={loadMore}>
          View more reviews
        </button>
      </div>

      {more.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold">More reviews</h3>
          <div className="mt-3 space-y-3">
            {more.map((r) => (
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
        </div>
      )}
    </section>
  );
}
