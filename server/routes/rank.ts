import { Router } from 'express';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth';
import { computeRank, getDoctorStats, RANK_ORDER, type RankKey } from '../lib/rank';

const router = Router();

router.get('/me', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const uid = req.authUser.id;
    const stats = await getDoctorStats(uid);
    const current = computeRank(stats);
    const progress = progressToward(current, stats);
    res.json({ rank: current, stats, progress });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.get('/:userId', async (req, res) => {
  try {
    const uid = req.params.userId;
    const stats = await getDoctorStats(uid);
    const current = computeRank(stats);
    const progress = progressToward(current, stats);
    res.json({ rank: current, stats, progress });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

function progressToward(current: RankKey, s: Awaited<ReturnType<typeof getDoctorStats>>) {
  const order = RANK_ORDER;
  const idx = order.indexOf(current);
  const next = order[idx + 1] as RankKey | undefined;
  if (!next) return undefined;
  if (next === 'senior_expert') {
    const a = clampPct(s.patients, 50);
    const b = clampPct(s.doctorReferrals, 20);
    return bundle([
      { label: 'Patients served', value: s.patients, target: 50, pct: a },
      { label: 'Doctor referrals', value: s.doctorReferrals, target: 20, pct: b },
    ]);
  }
  if (next === 'gold_mentor') {
    const a = clampPct(s.activeDoctors, 5);
    const b = clampPct(s.totalSales, 100000);
    return bundle([
      { label: 'Active doctors', value: s.activeDoctors, target: 5, pct: a },
      { label: 'Total sales (₹)', value: s.totalSales, target: 100000, pct: b },
    ]);
  }
  if (next === 'platinum_leader') {
    const a = clampPct(s.activeDoctors, 50);
    const b = clampPct(s.totalSales, 500000);
    return bundle([
      { label: 'Active doctors', value: s.activeDoctors, target: 50, pct: a },
      { label: 'Total sales (₹)', value: s.totalSales, target: 500000, pct: b },
    ]);
  }
  return undefined;
}

function clampPct(value: number, target: number) {
  return Math.max(0, Math.min(100, Math.round((value / target) * 100)));
}

function bundle(items: { label: string; value: number; target: number; pct: number }[]) {
  const overall = Math.round(items.reduce((a, b) => a + b.pct, 0) / items.length);
  return { by: items, overallPct: overall };
}

export default router;
