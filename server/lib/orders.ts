import { randomUUID } from "node:crypto";
import { getServerSupabase } from "./supabase";
import { getConfig } from "./env";

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

export async function updateUserMaxTotalSpent(userId: string, orderAmount: number) {
  const supabase = getServerSupabase();

  // Get current max_total_spent
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("max_total_spent")
    .eq("id", userId)
    .maybeSingle();

  if (userError) throw userError;

  const currentMax = Number(userData?.max_total_spent ?? 0);
  const newMax = Math.max(currentMax, orderAmount);

  // Update max_total_spent if new order is higher
  if (newMax > currentMax) {
    const { error: updateError } = await supabase
      .from("users")
      .update({ max_total_spent: newMax })
      .eq("id", userId);

    if (updateError) throw updateError;
  }

  return newMax;
}

export async function listOrdersForUser(userId: string) {
  const supabase = getServerSupabase();

  // Get user email
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("email")
    .eq("id", userId)
    .maybeSingle();

  if (userError) throw userError;
  if (!userData?.email) return [] as OrderRecord[];

  // Get local orders
  const { data: localOrders, error: ordersError } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (ordersError) throw ordersError;

  // Get Shopify orders for this user's email
  let shopifyOrders: any[] = [];
  try {
    const config = getConfig();

    // First, search for customers with this email
    const customerSearchParams = new URLSearchParams({ query: `email:${userData.email}` });
    const customerResponse = await fetch(
      `https://${config.shopify.domain}/admin/api/${config.shopify.apiVersion}/customers/search.json?${customerSearchParams}`,
      {
        headers: {
          'X-Shopify-Access-Token': config.shopify.adminToken,
        },
      }
    );

    if (customerResponse.ok) {
      const customerData = await customerResponse.json() as { customers: any[] };
      const customers = customerData.customers ?? [];

      // For each customer found, get their orders
      for (const customer of customers) {
        const ordersResponse = await fetch(
          `https://${config.shopify.domain}/admin/api/${config.shopify.apiVersion}/customers/${customer.id}/orders.json?limit=250&status=any`,
          {
            headers: {
              'X-Shopify-Access-Token': config.shopify.adminToken,
            },
          }
        );

        if (ordersResponse.ok) {
          const ordersData = await ordersResponse.json() as { orders: any[] };
          shopifyOrders = shopifyOrders.concat(ordersData.orders ?? []);
        }
      }
    }
  } catch (err) {
    console.error('Error fetching Shopify orders:', err);
    // Continue without Shopify orders if fetch fails
  }

  // Convert Shopify orders to match our OrderRecord format
  const formattedShopifyOrders = shopifyOrders.map((order) => ({
    id: `shopify_${order.id}`,
    user_id: userId,
    amount: Number(order.total_price || 0),
    currency: order.currency || 'INR',
    type: 'one_time' as OrderType,
    status: order.financial_status === 'paid' ? 'paid' : 'pending' as OrderStatus,
    razorpay_order_id: null,
    razorpay_payment_id: null,
    shopify_order_id: String(order.id),
    subscription_id: null,
    metadata: {
      lineItems: order.line_items?.map((li: any) => ({
        title: li.title,
        quantity: li.quantity,
        price: Number(li.price),
      })) ?? [],
      shopifyOrderName: order.name,
      shopifyCreatedAt: order.created_at,
    },
    created_at: order.created_at,
  })) as OrderRecord[];

  // Combine and sort by created_at descending
  const allOrders = [...(localOrders ?? []), ...formattedShopifyOrders];
  allOrders.sort((a, b) => {
    const aDate = new Date(a.created_at || 0).getTime();
    const bDate = new Date(b.created_at || 0).getTime();
    return bDate - aDate;
  });

  return allOrders;
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
