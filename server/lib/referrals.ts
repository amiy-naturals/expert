import { getServerSupabase } from "./supabase";

export type ReferralType = "customer" | "doctor";

export type ReferralRecord = {
  referrer_id: string;
  referred_id?: string;
  type: ReferralType;
  milestone_awarded: boolean;
};

export type ReferralChainNode = {
  userId: string;
  level: number;
};

export async function ensureReferralRecord(params: {
  referrerId: string;
  referredId: string;
  type: ReferralType;
}): Promise<void> {
  const supabase = getServerSupabase();
  await supabase
    .from("referrals")
    .upsert(
      {
        referrer_id: params.referrerId,
        referred_id: params.referredId,
        type: params.type,
      },
      { onConflict: "referred_id" },
    );
}

export async function markReferralMilestoneAwarded(
  referrerId: string,
  referredId: string,
) {
  const supabase = getServerSupabase();
  await supabase
    .from("referrals")
    .update({ milestone_awarded: true })
    .match({ referrer_id: referrerId, referred_id: referredId });
}

export async function getReferralRecordByReferred(
  referredId: string,
): Promise<ReferralRecord | null> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("referrals")
    .select("referrer_id, referred_id, type, milestone_awarded")
    .eq("referred_id", referredId)
    .maybeSingle();
  if (error) throw error;
  return (data as ReferralRecord | null) ?? null;
}

export async function getReferralChain(
  userId: string,
  depth = 3,
): Promise<ReferralChainNode[]> {
  const supabase = getServerSupabase();
  const chain: ReferralChainNode[] = [];
  let current = userId;
  for (let level = 1; level <= depth; level += 1) {
    const { data, error } = await supabase
      .from("users")
      .select("referred_by")
      .eq("id", current)
      .maybeSingle();
    if (error) throw error;
    const next = data?.referred_by as string | null | undefined;
    if (!next) break;
    chain.push({ userId: next, level });
    current = next;
  }
  return chain;
}

export async function getReferralNetworkSummary(userId: string) {
  const supabase = getServerSupabase();
  const direct = await supabase
    .from("referrals")
    .select("referred_id")
    .eq("referrer_id", userId);
  if (direct.error) throw direct.error;
  const level1Ids = (direct.data ?? []).map((row) => row.referred_id as string);
  const level2 = level1Ids.length
    ? await supabase
        .from("referrals")
        .select("referred_id")
        .in("referrer_id", level1Ids)
    : { data: [], error: null };
  if (level2.error) throw level2.error;
  const level2Ids = (level2.data ?? []).map((row) => row.referred_id as string);
  const level3 = level2Ids.length
    ? await supabase
        .from("referrals")
        .select("referred_id")
        .in("referrer_id", level2Ids)
    : { data: [], error: null };
  if (level3.error) throw level3.error;
  return {
    level1: level1Ids.length,
    level2: (level2.data ?? []).length,
    level3: (level3.data ?? []).length,
  };
}

export async function listDirectReferrals(userId: string) {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("referrals")
    .select(
      "referred:users(id, name, email, role, created_at), type, milestone_awarded, created_at",
    )
    .eq("referrer_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
