import { randomUUID } from "node:crypto";
import { getServerSupabase } from "./supabase";

export type OrderType = "one_time" | "subscription";
export type OrderStatus = "pending" | "paid" | "failed" | "cancelled";

export type OrderRecord = {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: OrderStatus;
  type: OrderType;
  razorpay_order_id?: string | null;
  razorpay_payment_id?: string | null;
  shopify_order_id?: string | null;
  subscription_id?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at?: string;
};

type CreateOrderArgs = {
  userId: string;
  amount: number;
  currency: string;
  type: OrderType;
  status?: OrderStatus;
  razorpayOrderId?: string;
  subscriptionId?: string | null;
  metadata?: Record<string, unknown> | null;
};

export async function createOrderRecord({
  userId,
  amount,
  currency,
  type,
  status = "pending",
  razorpayOrderId,
  subscriptionId = null,
  metadata,
}: CreateOrderArgs) {
  const supabase = getServerSupabase();
  const newId = randomUUID();
  const { data, error } = await supabase
    .from("orders")
    .insert({
      id: newId,
      user_id: userId,
      amount,
      currency,
      type,
      status,
      razorpay_order_id: razorpayOrderId ?? null,
      subscription_id: subscriptionId,
      metadata: metadata ?? null,
    })
    .select()
    .maybeSingle();
  if (error) throw error;
  return data as OrderRecord;
}

type UpdateOrderArgs = {
  orderId: string;
  status?: OrderStatus;
  razorpayPaymentId?: string;
  shopifyOrderId?: string;
  metadataPatch?: Record<string, unknown> | null;
};

export async function updateOrderRecord({
  orderId,
  status,
  razorpayPaymentId,
  shopifyOrderId,
  metadataPatch,
}: UpdateOrderArgs) {
  const supabase = getServerSupabase();
  const patch: Record<string, unknown> = {};
  if (status) patch.status = status;
  if (razorpayPaymentId) patch.razorpay_payment_id = razorpayPaymentId;
  if (shopifyOrderId) patch.shopify_order_id = shopifyOrderId;
  if (metadataPatch) patch.metadata = metadataPatch;
  const { data, error } = await supabase
    .from("orders")
    .update(patch)
    .eq("id", orderId)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data as OrderRecord;
}

export async function listOrdersForUser(userId: string) {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as OrderRecord[];
}

export async function countPaidOrders(userId: string) {
  const supabase = getServerSupabase();
  const { count, error } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "paid");
  if (error) throw error;
  return count ?? 0;
}
