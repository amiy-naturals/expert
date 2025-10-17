import { Router } from 'express';
import { getServerSupabase } from '../lib/supabase';
import { sendError } from '../lib/error';

const router = Router();

export type LeaderboardCategory =
  | 'most_level1'
  | 'most_level2'
  | 'most_level3'
  | 'most_income'
  | 'most_points'
  | 'most_spent'
  | 'fastest_rank_up';

export const CATEGORIES: { key: LeaderboardCategory; label: string }[] = [
  { key: 'most_level1', label: 'Most Level-1 Members' },
  { key: 'most_level2', label: 'Most Level-2 Members' },
  { key: 'most_level3', label: 'Most Level-3 Members' },
  { key: 'most_income', label: 'Most Income' },
  { key: 'most_points', label: 'Most Points Earned' },
  { key: 'most_spent', label: 'Most Spent' },
  { key: 'fastest_rank_up', label: 'Fastest Rank-Up' },
];

router.get('/categories', (_req, res) => {
  res.json(CATEGORIES);
});

// GET /api/leaderboard?category=most_level1&week=2024-10-07
router.get('/', async (req, res) => {
  try {
    const category = (req.query.category as LeaderboardCategory | undefined) ?? 'most_level1';
    const weekStart = (req.query.week as string | undefined) ?? getCurrentWeekStart();
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from('leaderboard_snapshots')
      .select('user_id, value, rank, users!leaderboard_snapshots_user_id_fkey(name, clinic_city, rank)')
      .eq('category', category)
      .eq('week_start', weekStart)
      .order('rank', { ascending: true })
      .limit(10);
    if (error) return res.status(500).json({ error });
    res.json({ week_start: weekStart, category, entries: data ?? [] });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

function getCurrentWeekStart() {
  const now = new Date();
  const day = now.getUTCDay(); // 0=Sun
  const diff = (day + 6) % 7; // Monday as start
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - diff));
  return start.toISOString().substring(0, 10);
}

export default router;
