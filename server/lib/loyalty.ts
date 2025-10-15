import { getConfig } from "./env";
import { getServerSupabase } from "./supabase";
import {
  getReferralChain,
  getReferralRecordByReferred,
  markReferralMilestoneAwarded,
} from "./referrals";
import { maybeUpdateRank } from "./rank";

import type { ReferralRecord } from "./referrals";

export type PointsReason =
  | "order_purchase"
  | "order_redeem"
  | "referral_level_1"
  | "referral_level_2"
  | "referral_level_3"
  | "referral_customer_milestone"
  | "referral_doctor_bonus"
  | "subscription_renewal"
  | "onboarding_bonus"
  | "admin_adjustment";

type RecordPointsArgs = {
  userId: string;
  delta: number;
  reason: PointsReason;
  orderId?: string | null;
  metadata?: Record<string, unknown> | null;
};

export async function recordPointsTransaction({
  userId,
  delta,
  reason,
  orderId,
  metadata,
}: RecordPointsArgs) {
  const supabase = getServerSupabase();

  const { data: userRow, error: userErr } = await supabase
    .from("users")
    .select("points_balance")
    .eq("id", userId)
    .maybeSingle();
  if (userErr) throw userErr;
  const currentBalance = Number(userRow?.points_balance ?? 0);
  const nextBalance = currentBalance + delta;

  const { error: updateErr } = await supabase
    .from("users")
    .update({ points_balance: nextBalance })
    .eq("id", userId);
  if (updateErr) throw updateErr;

  const { error: insertErr } = await supabase.from("points_transactions").insert({
    user_id: userId,
    delta,
    reason,
    order_id: orderId ?? null,
    balance_after: nextBalance,
    metadata: metadata ?? null,
  });
  if (insertErr) throw insertErr;
  return nextBalance;
}

export async function recordLockedPointsTransaction({
  userId,
  delta,
  reason,
  orderId,
  metadata,
}: RecordPointsArgs) {
  const supabase = getServerSupabase();
  const { data: userRow, error: userErr } = await supabase
    .from("users")
    .select("points_balance")
    .eq("id", userId)
    .maybeSingle();
  if (userErr) throw userErr;
  const currentBalance = Number(userRow?.points_balance ?? 0);
  const balanceAfter = currentBalance; // do not change balance until unlocked
  const fullMeta = { ...(metadata ?? {}), locked: true } as Record<string, unknown>;
  const { error: insertErr } = await supabase.from("points_transactions").insert({
    user_id: userId,
    delta,
    reason,
    order_id: orderId ?? null,
    balance_after: balanceAfter,
    metadata: fullMeta,
  });
  if (insertErr) throw insertErr;
  return balanceAfter;
}

export function calculateEarnedPoints(amountInRupees: number) {
  const config = getConfig();
  const raw = amountInRupees * config.loyalty.pointPerRupee;
  return Math.max(0, Math.floor(raw));
}

export function calculateMaxRedeemablePoints({
  balance,
  orderValue,
}: {
  balance: number;
  orderValue: number;
}) {
  const config = getConfig();
  const maxByPolicy = Math.floor(orderValue * config.loyalty.maxRedemptionPct);
  return Math.max(0, Math.min(balance, maxByPolicy));
}

type AwardOrderArgs = {
  userId: string;
  orderId: string;
  orderTotal: number;
  redeemedPoints?: number;
  context?: "subscription" | "one_time";
};

export async function awardOrderPoints({
  userId,
  orderId,
  orderTotal,
  redeemedPoints = 0,
  context = "one_time",
}: AwardOrderArgs) {
  const config = getConfig();
  const basePoints = calculateEarnedPoints(orderTotal);
  if (basePoints > 0) {
    await recordPointsTransaction({
      userId,
      delta: basePoints,
      reason: context === "subscription" ? "subscription_renewal" : "order_purchase",
      orderId,
      metadata: { orderTotal, context },
    });
  }
  if (redeemedPoints > 0) {
    await recordPointsTransaction({
      userId,
      delta: -redeemedPoints,
      reason: "order_redeem",
      orderId,
      metadata: { orderTotal },
    });
  }

  const chain = await getReferralChain(userId, 3);
  const levelRates = [
    config.referrals.level1Rate,
    config.referrals.level2Rate,
    config.referrals.level3Rate,
  ];
  await Promise.all(
    chain.map(async ({ userId: referrerId, level }) => {
      const pct = levelRates[level - 1] ?? 0;
      if (!pct) return;
      const pts = Math.floor(orderTotal * pct);
      if (pts <= 0) return;
      const supabase = getServerSupabase();
      let provisional = false;
      try {
        const { data: row } = await supabase
          .from("users")
          .select("is_doctor_provisional")
          .eq("id", referrerId)
          .maybeSingle();
        provisional = Boolean((row as any)?.is_doctor_provisional);
      } catch {}
      const reason: PointsReason =
        level === 1
          ? "referral_level_1"
          : level === 2
            ? "referral_level_2"
            : "referral_level_3";
      const meta = { buyerId: userId, level, pct } as Record<string, unknown>;
      if (provisional) {
        await recordLockedPointsTransaction({
          userId: referrerId,
          delta: pts,
          reason,
          orderId,
          metadata: meta,
        });
      } else {
        await recordPointsTransaction({
          userId: referrerId,
          delta: pts,
          reason,
          orderId,
          metadata: meta,
        });
      }
      await maybeUpdateRank(referrerId);
    }),
  );

  // update rank for buyer
  await maybeUpdateRank(userId);

  await maybeAwardCustomerMilestone(userId);
}

async function maybeAwardCustomerMilestone(buyerId: string) {
  const config = getConfig();
  const referral = (await getReferralRecordByReferred(buyerId)) as
    | ReferralRecord
    | null;
  if (!referral || referral.type !== "customer" || referral.milestone_awarded) return;

  const supabase = getServerSupabase();
  const { count, error } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("user_id", buyerId)
    .eq("status", "paid");
  if (error) throw error;
  if ((count ?? 0) < 3) return;

  await recordPointsTransaction({
    userId: referral.referrer_id,
    delta: config.referrals.customerReferralBonus,
    reason: "referral_customer_milestone",
    metadata: { referredUserId: buyerId },
  });
  await markReferralMilestoneAwarded(referral.referrer_id, buyerId);
  await maybeUpdateRank(referral.referrer_id);
}

export async function awardDoctorReferralBonus(newDoctorId: string) {
  const config = getConfig();
  const referral = (await getReferralRecordByReferred(newDoctorId)) as
    | ReferralRecord
    | null;
  if (!referral || referral.type !== "doctor" || referral.milestone_awarded) return;
  await recordPointsTransaction({
    userId: referral.referrer_id,
    delta: config.referrals.doctorReferralBonus,
    reason: "referral_doctor_bonus",
    metadata: { referredUserId: newDoctorId },
  });
  await markReferralMilestoneAwarded(referral.referrer_id, newDoctorId);
  await maybeUpdateRank(referral.referrer_id);
}
