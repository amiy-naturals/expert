import type { Handler } from "@netlify/functions";
import { getServerSupabase } from "../../server/lib/supabase";
import { maybeUpdateRank } from "../../server/lib/rank";

export const config = { schedule: "0 2 * * 0" };

export const handler: Handler = async () => {
  try {
    const supabase = getServerSupabase();
    const { data: doctors, error } = await supabase
      .from("users")
      .select("id")
      .eq("is_doctor_verified", true);
    if (error) throw error;

    for (const row of doctors ?? []) {
      await maybeUpdateRank(row.id as string);
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true, count: doctors?.length ?? 0 }) };
  } catch (err) {
    return { statusCode: 500, body: (err as Error).message };
  }
};
