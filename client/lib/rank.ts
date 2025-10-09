export type Stats = {
  monthlySales: number; // in INR
  bottlesSold: number; // monthly bottles
  patientEnrollments: number;
  doctorReferrals: number;
  activeDoctors: number; // active in team
};

export type RankKey =
  | "AMIY_DOCTOR"
  | "SENIOR_EXPERT"
  | "GOLD_MENTOR"
  | "PLATINUM_LEADER";

export type RankDef = {
  key: RankKey;
  name: string;
  criteria: (s: Stats) => boolean;
  describe: string;
};

export const RANKS: RankDef[] = [
  {
    key: "AMIY_DOCTOR",
    name: "Amiy Doctor",
    criteria: () => true,
    describe: "Onboarding completed.",
  },
  {
    key: "SENIOR_EXPERT",
    name: "Senior Expert",
    criteria: (s) => s.patientEnrollments >= 50 && s.doctorReferrals >= 20,
    describe: "≥ 50 patient enrollments and ≥ 20 doctor referrals.",
  },
  {
    key: "GOLD_MENTOR",
    name: "Gold Mentor",
    criteria: (s) => s.activeDoctors >= 5 && s.monthlySales >= 100000,
    describe: "��� 5 active doctors and ≥ ₹1,00,000 monthly sales.",
  },
  {
    key: "PLATINUM_LEADER",
    name: "Platinum Leader",
    criteria: (s) => s.activeDoctors >= 50 && s.monthlySales >= 500000,
    describe: "≥ 50 active doctors and ≥ ₹5,00,000 monthly sales.",
  },
];

const KEY = "amiy_stats";

export function getStats(): Stats {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Stats;
  } catch {}
  // defaults for demo
  return {
    monthlySales: 24500,
    bottlesSold: 62,
    patientEnrollments: 58,
    doctorReferrals: 12,
    activeDoctors: 3,
  };
}

export function setStats(s: Stats) {
  localStorage.setItem(KEY, JSON.stringify(s));
}

export function computeRank(s: Stats) {
  // highest rank that matches criteria
  const achieved = RANKS.filter((r) => r.criteria(s));
  const current = achieved[achieved.length - 1] ?? RANKS[0];
  const currentIndex = RANKS.findIndex((r) => r.key === current.key);
  const next = RANKS[currentIndex + 1] as RankDef | undefined;
  const progress = progressToward(next, s);
  return { current, next, progress };
}

export type Progress = {
  by: { label: string; value: number; target: number; pct: number }[];
  overallPct: number;
};

export function progressToward(
  next: RankDef | undefined,
  s: Stats,
): Progress | undefined {
  if (!next) return undefined;
  if (next.key === "SENIOR_EXPERT") {
    const a = clampPct(s.patientEnrollments, 50);
    const b = clampPct(s.doctorReferrals, 20);
    return bundle([
      {
        label: "Patient enrollments",
        value: s.patientEnrollments,
        target: 50,
        pct: a,
      },
      {
        label: "Doctor referrals",
        value: s.doctorReferrals,
        target: 20,
        pct: b,
      },
    ]);
  }
  if (next.key === "GOLD_MENTOR") {
    const a = clampPct(s.activeDoctors, 5);
    const b = clampPct(s.monthlySales, 100000);
    return bundle([
      { label: "Active doctors", value: s.activeDoctors, target: 5, pct: a },
      {
        label: "Monthly sales (₹)",
        value: s.monthlySales,
        target: 100000,
        pct: b,
      },
    ]);
  }
  if (next.key === "PLATINUM_LEADER") {
    const a = clampPct(s.activeDoctors, 50);
    const b = clampPct(s.monthlySales, 500000);
    return bundle([
      { label: "Active doctors", value: s.activeDoctors, target: 50, pct: a },
      {
        label: "Monthly sales (₹)",
        value: s.monthlySales,
        target: 500000,
        pct: b,
      },
    ]);
  }
  return undefined;
}

function clampPct(value: number, target: number) {
  return Math.max(0, Math.min(100, Math.round((value / target) * 100)));
}

function bundle(
  items: { label: string; value: number; target: number; pct: number }[],
): Progress {
  const overall = Math.round(
    items.reduce((a, b) => a + b.pct, 0) / items.length,
  );
  return { by: items, overallPct: overall };
}
