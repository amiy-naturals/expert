import type { Handler } from "@netlify/functions";
import { getServerSupabase } from "../../server/lib/supabase";

function getCurrentWeekStart() {
  const d = new Date();
  const day = d.getUTCDay();
  const diff = (day + 6) % 7; // make Monday=0
  d.setUTCDate(d.getUTCDate() - diff);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

export const config = { schedule: "0 3 * * 0" };

export const handler: Handler = async () => {
  try {
    const supabase = getServerSupabase();
    const week = getCurrentWeekStart();

    // Compute simple score based on points balance and paid order count
    const { data: users, error } = await supabase
      .from("users")
      .select("id, name, points_balance")
      .eq("is_doctor_verified", true);
    if (error) throw error;

    const scores: { user_id: string; score: number }[] = [];
    for (const u of users ?? []) {
      const uid = u.id as string;
      const { count } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("user_id", uid)
        .eq("status", "paid");
      const score = Number(u.points_balance ?? 0) + Number(count ?? 0) * 50;
      scores.push({ user_id: uid, score });
    }

    scores.sort((a, b) => b.score - a.score);
    const top10 = scores.slice(0, 10);

    await supabase.from("leaderboard_snapshots").upsert({
      week,
      category: "overall",
      top10,
      created_at: new Date().toISOString(),
    }, { onConflict: "week,category" as any });

    return { statusCode: 200, body: JSON.stringify({ ok: true, week, count: top10.length }) };
  } catch (err) {
    return { statusCode: 500, body: (err as Error).message };
  }
};
