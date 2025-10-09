export type Product = {
  id: string;
  name: string;
  price: number; // in rupees
  image?: string;
};

// Mutable in-memory catalog populated at runtime from Shopify via /api/products
let CATALOG: Product[] = [];
export function getCatalog(): Product[] {
  return CATALOG;
}
export function setCatalog(list: Product[]) {
  CATALOG = Array.isArray(list) ? list : [];
}

export const DISCOUNT_THRESHOLDS = [
  { at: 1000, pct: 15 },
  { at: 2000, pct: 20 },
  { at: 3000, pct: 25 },
] as const;

export function getDiscountPct(amount: number): number {
  let pct = 0;
  for (const t of DISCOUNT_THRESHOLDS) {
    if (amount >= t.at) pct = t.pct;
  }
  return pct;
}

export type CartItem = { productId: string; qty: number };

export function calcCart(items: CartItem[]) {
  const lines = items
    .map((it) => {
      const p = CATALOG.find((c) => c.id === it.productId);
      if (!p) return null;
      return { ...p, qty: it.qty, lineTotal: p.price * it.qty };
    })
    .filter(Boolean) as (Product & { qty: number; lineTotal: number })[];
  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  const discountPct = getDiscountPct(subtotal);
  const discountAmount = Math.round((subtotal * discountPct) / 100);
  const total = Math.max(0, subtotal - discountAmount);
  return { lines, subtotal, discountPct, discountAmount, total };
}

export type Subscription = {
  nextDate?: string; // yyyy-mm-dd
  frequency: "monthly" | "alternate";
};

export type Account = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  birthday?: string; // yyyy-mm-dd
  gender?: string;
  username?: string;
  password?: string;
  agreeTerms?: boolean;
  optInEmail?: boolean;
  allowMpManage?: boolean;
};

export type ExpertState = {
  cart: CartItem[];
  subscription: Subscription;
  account: Account;
};

export const DEFAULT_STATE: ExpertState = {
  cart: [],
  subscription: { frequency: "monthly" },
  account: {},
};

const KEY = "amiy_expert_state_v1";

export function loadState(): ExpertState {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ExpertState) : { ...DEFAULT_STATE };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export function saveState(state: ExpertState) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(state));
  } catch {}
}
