import { getServerSupabase } from "./supabase";

export type RankKey =
  | "doctor"
  | "senior_expert"
  | "gold_mentor"
  | "platinum_leader";

export type DoctorStats = {
  patients: number; // unique patients with at least 1 paid order referred by this doctor
  doctorReferrals: number; // total referred doctors
  activeDoctors: number; // verified referred doctors who are active
  totalSales: number; // total lifetime sales in INR
  monthlySales: number; // last 30 days sales in INR
};

export const RANK_ORDER: RankKey[] = [
  "doctor",
  "senior_expert",
  "gold_mentor",
  "platinum_leader",
];

export function compareRanks(a: RankKey, b: RankKey) {
  return RANK_ORDER.indexOf(a) - RANK_ORDER.indexOf(b);
}

export function computeRank(stats: DoctorStats): RankKey {
  // Platinum Leader: 50 active doctors + ₹5,00,000 sales (lifetime)
  if (stats.activeDoctors >= 50 && stats.totalSales >= 500_000) return "platinum_leader";
  // Gold Mentor: 5 active doctors + ₹1,00,000 sales (lifetime)
  if (stats.activeDoctors >= 5 && stats.totalSales >= 100_000) return "gold_mentor";
  // Senior Expert: 50 patients + 20 doctor referrals
  if (stats.patients >= 50 && stats.doctorReferrals >= 20) return "senior_expert";
  // Amiy Doctor: onboarding completed (default)
  return "doctor";
}

export async function getDoctorStats(userId: string): Promise<DoctorStats> {
  const supabase = getServerSupabase();

  // Sales totals
  const [{ data: lifetimeAgg, error: lifeErr }, { data: monthAgg, error: monthErr }] = await Promise.all([
    supabase
      .from("orders")
      .select("amount, status")
      .eq("user_id", userId),
    supabase
      .from("orders")
      .select("amount, status, created_at")
      .eq("user_id", userId)
      .gte("created_at", new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()),
  ]);
  if (lifeErr) throw lifeErr;
  if (monthErr) throw monthErr;
  const lifetimePaid = (lifetimeAgg ?? []).filter((o: any) => o.status === "paid");
  const monthPaid = (monthAgg ?? []).filter((o: any) => o.status === "paid");
  const totalSales = lifetimePaid.reduce((s: number, r: any) => s + Number(r.amount || 0), 0);
  const monthlySales = monthPaid.reduce((s: number, r: any) => s + Number(r.amount || 0), 0);

  // Doctor referrals (type='doctor')
  const { data: doctorRefs, error: refErr } = await supabase
    .from("referrals")
    .select("referred_id, type")
    .eq("referrer_id", userId)
    .eq("type", "doctor");
  if (refErr) throw refErr;
  const doctorReferralIds = (doctorRefs ?? []).map((r: any) => r.referred_id as string).filter(Boolean);
  const doctorReferrals = doctorReferralIds.length;

  // Active doctors: count referred doctors with is_doctor_verified = true; optionally consider those who made a paid order in last 60 days
  let activeDoctors = 0;
  if (doctorReferralIds.length) {
    const [{ data: users, error: usersErr }, { data: recentOrders, error: roErr }] = await Promise.all([
      supabase.from("users").select("id, is_doctor_verified").in("id", doctorReferralIds),
      supabase
        .from("orders")
        .select("user_id, status, created_at")
        .in("user_id", doctorReferralIds)
        .gte("created_at", new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString()),
    ]);
    if (usersErr) throw usersErr;
    if (roErr) throw roErr;
    const activeSet = new Set<string>();
    const verifiedIds = new Set((users ?? []).filter((u: any) => !!u.is_doctor_verified).map((u: any) => u.id as string));
    (recentOrders ?? []).forEach((o: any) => {
      if (o.status === "paid" && verifiedIds.has(o.user_id)) activeSet.add(o.user_id);
    });
    // Fallback: if no recent order data, count verified as active
    activeDoctors = activeSet.size || verifiedIds.size;
  }

  // Patients: unique customers referred by this doctor (type='customer') with at least 1 paid order
  const { data: custRefs, error: custErr } = await supabase
    .from("referrals")
    .select("referred_id, type")
    .eq("referrer_id", userId)
    .eq("type", "customer");
  if (custErr) throw custErr;
  const customerIds = (custRefs ?? []).map((r: any) => r.referred_id as string).filter(Boolean);
  let patients = 0;
  if (customerIds.length) {
    const { data: custOrders, error: coErr } = await supabase
      .from("orders")
      .select("user_id, status")
      .in("user_id", customerIds);
    if (coErr) throw coErr;
    const paidCustomers = new Set((custOrders ?? []).filter((o: any) => o.status === "paid").map((o: any) => o.user_id as string));
    patients = paidCustomers.size;
  }

  return { patients, doctorReferrals, activeDoctors, totalSales, monthlySales };
}

export async function maybeUpdateRank(userId: string) {
  const supabase = getServerSupabase();
  const [{ data: currentUser, error: uErr }, stats] = await Promise.all([
    supabase.from("users").select("id, rank").eq("id", userId).maybeSingle(),
    getDoctorStats(userId),
  ]);
  if (uErr) throw uErr;
  const currentRank = ((currentUser?.rank as RankKey | null) ?? "doctor");
  const newRank = computeRank(stats);
  if (compareRanks(newRank, currentRank) > 0) {
    const { error: upErr } = await supabase.from("users").update({ rank: newRank }).eq("id", userId);
    if (upErr) throw upErr;
    await supabase.from("rank_history").insert({ user_id: userId, old_rank: currentRank, new_rank: newRank });
  }
  return { currentRank, newRank, stats };
}
