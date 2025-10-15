import { getAccessToken } from './supabase';

export async function apiFetch(path: string, opts: RequestInit = {}) {
  const token = await getAccessToken();
  const headers = new Headers({ 'Content-Type': 'application/json' });
  if (opts.headers) {
    const h = opts.headers as Record<string, string>;
    Object.entries(h).forEach(([k, v]) => headers.set(k, v));
  }
  if (token) headers.set('Authorization', `Bearer ${token}`);
  let res: Response;
  try {
    res = await fetch(`/api${path}`, { ...opts, headers, credentials: 'same-origin' });
  } catch (err: any) {
    // network or CORS error
    throw new Error(`Network request failed: ${err?.message ?? String(err)}`);
  }

  if (!res.ok) {
    let message = '';
    try {
      const clone = res.clone();
      const ct = clone.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        const json = await clone.json();
        if (json) {
          if (json.error) {
            message = typeof json.error === 'string' ? json.error : JSON.stringify(json.error);
          } else if (json.message) {
            message = typeof json.message === 'string' ? json.message : JSON.stringify(json.message);
          } else {
            message = JSON.stringify(json);
          }
        } else {
          message = '';
        }
      } else {
        message = await clone.text();
      }
    } catch {
      // Fallback if body is already consumed or unreadable
      message = res.statusText || `HTTP ${res.status}`;
    }
    throw new Error(message || res.statusText || `HTTP ${res.status}`);
  }
  return res.json();
}

export const AdminAPI = {
  createSuperAdmin: (payload: any) => apiFetch('/admin/create-super-admin', { method: 'POST', body: JSON.stringify(payload) }),
  listUsers: () => apiFetch('/admin/users'),
  setRole: (id: string, role: string) => apiFetch(`/admin/users/${id}/role`, { method: 'POST', body: JSON.stringify({ role }) }),
  approveAvatar: (id: string) => apiFetch(`/admin/users/${id}/approve-avatar`, { method: 'POST' }),
  deleteUser: (id: string) => fetch(`/api/admin/users/${id}`, { method: 'DELETE' }),
  metrics: () => apiFetch('/admin/metrics'),
  approveReview: (id: string) => apiFetch(`/admin/reviews/${encodeURIComponent(id)}/approve`, { method: 'POST' }),
};

export const ReviewsAPI = {
  list: (limit = 10, before?: string) => apiFetch(`/reviews?limit=${limit}${before ? `&before=${encodeURIComponent(before)}` : ''}`),
  create: (payload: any) => apiFetch('/reviews', { method: 'POST', body: JSON.stringify(payload) }),
};

export const DoctorsAPI = {
  apply: (payload: any) => apiFetch('/doctors/apply', { method: 'POST', body: JSON.stringify(payload) }),
  myApplication: () => apiFetch('/doctors/me/application'),
  adminListApplications: () => apiFetch('/doctors/admin/applications'),
  adminApproveApplication: (id: string) => apiFetch(`/doctors/admin/applications/${encodeURIComponent(id)}/approve`, { method: 'POST' }),
  adminRejectApplication: (id: string) => apiFetch(`/doctors/admin/applications/${encodeURIComponent(id)}/reject`, { method: 'POST' }),
  invite: (payload: { phone: string; name?: string; city?: string }) => apiFetch('/doctors/invite', { method: 'POST', body: JSON.stringify(payload) }) as Promise<{ token: string; joinPath: string; joinUrl: string; expiresAt: string }>,
  acceptInvite: (payload: { token: string; otp?: string; phone?: string }) => apiFetch('/doctors/accept-invite', { method: 'POST', body: JSON.stringify(payload) }) as Promise<{ success: true; referralLink: string; bonus: number; locked: boolean }>,
};

export const LeaderboardAPI = {
  categories: () => apiFetch('/leaderboard/categories'),
  get: (category = 'most_level1', week?: string) => apiFetch(`/leaderboard?category=${encodeURIComponent(category)}${week ? `&week=${encodeURIComponent(week)}` : ''}`),
};

export const RankAPI = {
  me: () => apiFetch('/rank/me'),
  byUser: (id: string) => apiFetch(`/rank/${encodeURIComponent(id)}`),
};

export const ImagesAPI = {
  requestUploadUrl: (filename: string) => apiFetch('/images/upload-url', { method: 'POST', body: JSON.stringify({ filename }) }),
  register: (payload: any) => apiFetch('/images', { method: 'POST', body: JSON.stringify(payload) }),
  getSignedUrl: (key: string, bucket?: string) => apiFetch(`/images/signed-url?key=${encodeURIComponent(key)}${bucket ? `&bucket=${encodeURIComponent(bucket)}` : ''}`),
};

export const CheckoutAPI = {
  create: (payload: { amount: number; currency?: string; lineItems: { variantId: number; quantity: number; price?: number }[]; notes?: Record<string, string>; subscriptionId?: string; metadata?: Record<string, unknown>; redeemedPoints?: number }) =>
    apiFetch('/checkout/create', { method: 'POST', body: JSON.stringify(payload) }) as Promise<{ orderId: string; razorpayOrderId: string; amount: number; currency: string; razorpayKey: string }>,
  verify: (payload: { orderId: string; razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string; customer?: { email?: string; firstName?: string; lastName?: string; phone?: string }; billingAddress?: Record<string, unknown>; shippingAddress?: Record<string, unknown>; note?: string; redeemedPoints?: number }) =>
    apiFetch('/checkout/verify', { method: 'POST', body: JSON.stringify(payload) }) as Promise<{ success: true; shopifyOrderId: string; shopifyOrderName: string }>,
};

export type ProductVariant = {
  id: number;
  title: string;
  price: number;
  compareAtPrice: number | null;
  sku: string | null;
  inventoryQuantity: number | null;
  requiresShipping: boolean;
};

export type Product = {
  id: number;
  handle: string;
  title: string;
  descriptionHtml?: string;
  status: string;
  vendor?: string;
  productType?: string;
  tags?: string[];
  images: { id: number; src: string; alt: string | null }[];
  variants: ProductVariant[];
  defaultPrice?: number;
  compareAtPrice?: number;
};

export const ProductsAPI = {
  list: (params?: { limit?: number; pageInfo?: string; collectionId?: number; status?: 'active' | 'draft' | 'archived' }) => {
    const qs = new URLSearchParams();
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.pageInfo) qs.set('pageInfo', params.pageInfo);
    if (params?.collectionId) qs.set('collectionId', String(params.collectionId));
    if (params?.status) qs.set('status', params.status);
    const q = qs.toString();
    return apiFetch(`/products${q ? `?${q}` : ''}`) as Promise<{ products: Product[]; nextPageInfo?: string; prevPageInfo?: string }>;
  },
  byHandle: (handle: string) => apiFetch(`/products/${encodeURIComponent(handle)}`) as Promise<Product>,
};

export const ExpertAPI = {
  onboard: async (payload: {
    cart: { productId: string; qty: number }[];
    subscription: { nextDate: string; frequency: 'monthly' | 'alternate' };
    account: { firstName?: string; lastName?: string; email?: string; phone?: string; birthday?: string; gender?: string; username?: string; agreeTerms?: boolean };
  }) => {
    const token = await getAccessToken();
    if (!token) throw new Error('Missing Authorization token: please sign in before continuing');
    return apiFetch('/expert/onboard', { method: 'POST', body: JSON.stringify(payload) }) as Promise<{ orderId: string; razorpayOrderId: string; amount: number; currency: string; razorpayKey: string }>;
  },
  me: async () => {
    const token = await getAccessToken();
    if (!token) throw new Error('Missing Authorization token');
    return apiFetch('/expert/me') as Promise<{ onboarded: boolean; subscriptions: number; onboardings: number }>;
  },
};
