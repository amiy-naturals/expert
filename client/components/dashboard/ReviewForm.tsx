import React from 'react';
import { ReviewsAPI } from '@/lib/api';
import { getUser } from '@/lib/auth';

export default function ReviewForm({ targetUserId }: { targetUserId: string }) {
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
    <div>
      <button className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground" onClick={submit}>Leave a review</button>
    </div>
  );
}
