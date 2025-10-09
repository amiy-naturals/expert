import { Router } from 'express';
import { getServerSupabase } from '../lib/supabase';

const router = Router();

// Create a review (user must have avatar_approved)
// Body: { user_id, rating, title, body, review_type?: 'product'|'doctor', target_user_id?: string }
router.post('/', async (req, res) => {
  try {
    const { user_id, rating, title, body, review_type, target_user_id } = req.body;
    if (!user_id || !rating) return res.status(400).json({ error: 'user_id and rating required' });
    const supabase = getServerSupabase();
    // verify avatar approved
    const { data: users, error: userErr } = await supabase.from('users').select('avatar_approved').eq('id', user_id).single();
    if (userErr) return res.status(500).json({ error: userErr });
    if (!users || !users.avatar_approved) return res.status(403).json({ error: 'avatar not approved' });

    // prevent self-reviews when doctor target specified
    if (target_user_id && target_user_id === user_id) return res.status(400).json({ error: 'cannot review yourself' });

    const payload: any = { user_id, rating, title: title ?? null, body: body ?? null, approved: false };
    if (review_type) payload.review_type = review_type;
    if (target_user_id) payload.target_user_id = target_user_id;

    const { data, error } = await supabase.from('reviews').insert([payload]).select('*');
    if (error) return res.status(500).json({ error });
    res.json(data[0]);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// List reviews with pagination
// GET /api/reviews?limit=10&before=<iso date>&type=doctor|product&target=<user_id>
router.get('/', async (req, res) => {
  try {
    const limit = Number(req.query.limit || 10);
    const before = req.query.before as string | undefined;
    const type = (req.query.type as string | undefined) ?? undefined;
    const target = (req.query.target as string | undefined) ?? undefined;
    const supabase = getServerSupabase();
    let q = supabase
      .from('reviews')
      .select('*, users!reviews_user_id_fkey(name, avatar_url)')
      .eq('approved', true)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (before) q = q.lt('created_at', before);
    if (type) q = q.eq('review_type', type);
    if (target) q = q.eq('target_user_id', target);
    const { data, error } = await q;
    if (error) return res.status(500).json({ error });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
