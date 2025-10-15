import { getServerSupabase } from "./supabase";
import { getReferralChain } from "./referrals";
import { normalizeEmail, normalizePhoneE164 } from "./contacts";

export async function resolveDoctorByReferralCode(code: string): Promise<string | null> {
  const supabase = getServerSupabase();
  const raw = (code || "").trim();
  if (!raw) return null;
  const c = raw.replace(/^AM-?/i, "").trim();
  // If UUID, trust as user id
  if (/^[0-9a-fA-F-]{32,36}$/.test(c)) return c;
  // Try match by email local-part
  const emailLocal = c.toLowerCase();
  const { data, error } = await supabase
    .from("users")
    .select("id, email, created_at")
    .ilike("email", `${emailLocal}@%`);
  if (error) return null;
  if (!data || data.length === 0) return null;
  if (data.length === 1) return data[0].id as string;
  // pick most recently created
  const sorted = [...data].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return sorted[0]?.id ?? null;
}

export async function resolveDoctorChain(l1DoctorId: string) {
  const chain = await getReferralChain(l1DoctorId, 2);
  const l2 = chain.find((n) => n.level === 1)?.userId || null;
  const l3 = chain.find((n) => n.level === 2)?.userId || null;
  return { l1: l1DoctorId, l2, l3 } as { l1: string | null; l2: string | null; l3: string | null };
}

export function isPostJoin(orderCreatedAt: string | number | Date, joinedAt?: string | null) {
  if (!joinedAt) return false;
  const o = new Date(orderCreatedAt).getTime();
  const j = new Date(joinedAt).getTime();
  return o >= j;
}

export function pickOrderContact(order: any) {
  const email = normalizeEmail(order?.email || order?.customer?.email);
  const phone = normalizePhoneE164(order?.customer?.phone || order?.shipping_address?.phone || order?.billing_address?.phone);
  return { email, phone };
}
