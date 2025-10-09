import { getConfig } from "./env";

export type ShopifyImage = {
  id: number;
  src: string;
  alt?: string | null;
};

export type ShopifyVariant = {
  id: number;
  title: string;
  price: string;
  compare_at_price?: string | null;
  sku?: string | null;
  inventory_quantity?: number;
  requires_shipping?: boolean;
};

export type ShopifyProduct = {
  id: number;
  title: string;
  handle: string;
  body_html?: string;
  status: string;
  vendor?: string;
  product_type?: string;
  tags?: string[];
  images: ShopifyImage[];
  variants: ShopifyVariant[];
  created_at: string;
  updated_at: string;
};

export type ShopifyOrderLineItem = {
  variant_id: number;
  quantity: number;
  price?: string;
};

export type ShopifyOrderPayload = {
  send_receipt?: boolean;
  send_fulfillment_receipt?: boolean;
  customer?: {
    email?: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
  };
  email?: string;
  billing_address?: Record<string, unknown>;
  shipping_address?: Record<string, unknown>;
  financial_status?:
    | "pending"
    | "authorized"
    | "paid"
    | "partially_paid"
    | "refunded"
    | "voided";
  line_items: ShopifyOrderLineItem[];
  tags?: string;
  note?: string;
  source_name?: string;
  channel?: string;
};

function getBase() {
  const config = getConfig();
  return {
    base: `https://${config.shopify.domain}/admin/api/${config.shopify.apiVersion}`,
    token: config.shopify.adminToken,
  };
}

async function shopifyRequest<T>(path: string, init?: RequestInit): Promise<{ data: T; headers: Headers }> {
  const { base, token } = getBase();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch(`${base}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": token,
        ...init?.headers,
      },
      signal: controller.signal,
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Shopify ${res.status} ${res.statusText}: ${text}`);
    }
    return { data: (await res.json()) as T, headers: res.headers };
  } finally {
    clearTimeout(timeout);
  }
}

export async function listProducts(options: {
  limit?: number;
  pageInfo?: string;
  collectionId?: number;
  status?: "active" | "draft" | "archived";
} = {}): Promise<{ products: ShopifyProduct[]; nextPageInfo?: string; prevPageInfo?: string }>
{
  const params = new URLSearchParams();
  params.set("limit", String(Math.min(options.limit ?? 50, 250)));
  if (options.collectionId) params.set("collection_id", String(options.collectionId));
  if (options.status) params.set("status", options.status);
  if (options.pageInfo) params.set("page_info", options.pageInfo);

  type Response = {
    products: ShopifyProduct[];
  };

  const { data, headers } = await shopifyRequest<Response>(
    `/products.json?${params.toString()}`,
  );
  const linkHeader = headers.get("link") ?? "";
  const { next, previous } = parseLinkHeader(linkHeader);
  return {
    products: data.products ?? [],
    nextPageInfo: next?.page_info,
    prevPageInfo: previous?.page_info,
  };
}

function parseLinkHeader(value: string) {
  if (!value) return {} as { next?: { page_info: string }; previous?: { page_info: string } };
  const parts = value.split(",");
  const result: { [k: string]: { page_info: string } } = {};
  for (const part of parts) {
    const match = part.match(/<[^>]*page_info=([^&>]+)[^>]*>; rel="(next|previous)"/);
    if (match) {
      const [, pageInfo, rel] = match;
      result[rel] = { page_info: pageInfo };
    }
  }
  return result as { next?: { page_info: string }; previous?: { page_info: string } };
}

export async function getProductByHandle(handle: string): Promise<ShopifyProduct | null> {
  type Response = { products: ShopifyProduct[] };
  const { data } = await shopifyRequest<Response>(
    `/products.json?handle=${encodeURIComponent(handle)}`,
  );
  return data.products?.[0] ?? null;
}

export async function getProduct(productId: number): Promise<ShopifyProduct | null> {
  type Response = { product: ShopifyProduct };
  const { data } = await shopifyRequest<Response>(`/products/${productId}.json`);
  return data.product ?? null;
}

export async function createShopifyOrder(payload: ShopifyOrderPayload) {
  type Response = { order: { id: number; name: string; order_number: number } };
  const { data } = await shopifyRequest<Response>("/orders.json", {
    method: "POST",
    body: JSON.stringify({ order: payload }),
  });
  return data.order;
}
