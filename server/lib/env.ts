import { z } from "zod";

import { z } from "zod";

const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SHOPIFY_STORE_DOMAIN: z.string().min(1),
  SHOPIFY_ADMIN_ACCESS_TOKEN: z.string().min(1),
  SHOPIFY_STOREFRONT_ACCESS_TOKEN: z.string().optional(),
  SHOPIFY_API_VERSION: z
    .string()
    .min(1)
    .default("2024-10"),
  RAZORPAY_KEY_ID: z.string().min(1),
  RAZORPAY_KEY_SECRET: z.string().min(1),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
  RAZORPAY_CURRENCY: z.string().min(1).default("INR"),
  LOYALTY_POINT_PER_RUPEE: z
    .string()
    .default("0.2"),
  LOYALTY_MAX_REDEMPTION_PCT: z
    .string()
    .default("0.5"),
  REFERRAL_LEVEL1_RATE: z.string().default("0.025"),
  REFERRAL_LEVEL2_RATE: z.string().default("0.015"),
  REFERRAL_LEVEL3_RATE: z.string().default("0.01"),
  POINTS_PER_REFERRAL_DOCTOR: z.string().default("1000"),
  POINTS_PER_REFERRAL_CUSTOMER: z.string().default("1000"),
  SITE_BASE_URL: z.string().optional(),
});

export type AppConfig = {
  supabaseUrl: string;
  supabaseServiceKey: string;
  shopify: {
    domain: string;
    adminToken: string;
    storefrontToken?: string;
    apiVersion: string;
  };
  razorpay: {
    keyId: string;
    keySecret: string;
    currency: string;
    webhookSecret?: string;
  };
  loyalty: {
    pointPerRupee: number;
    maxRedemptionPct: number;
  };
  referrals: {
    level1Rate: number;
    level2Rate: number;
    level3Rate: number;
    doctorReferralBonus: number;
    customerReferralBonus: number;
  };
  site: {
    baseUrl?: string;
  };
};

let cached: AppConfig | null = null;

export function getConfig(): AppConfig {
  if (cached) return cached;

  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    // In development allow missing envs and use sensible defaults so the dev server doesn't crash.
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.warn(
        "Warning: some environment variables are missing or invalid. Using development defaults where appropriate.",
      );

      const env = process.env as Record<string, string | undefined>;

      cached = {
        supabaseUrl: env.VITE_SUPABASE_URL ?? "http://localhost:54321",
        supabaseServiceKey: env.SUPABASE_SERVICE_ROLE_KEY ?? "dev-service-role-key",
        shopify: {
          domain: env.SHOPIFY_STORE_DOMAIN ?? "",
          adminToken: env.SHOPIFY_ADMIN_ACCESS_TOKEN ?? "",
          storefrontToken: env.SHOPIFY_STOREFRONT_ACCESS_TOKEN,
          apiVersion: env.SHOPIFY_API_VERSION ?? "2024-10",
        },
        razorpay: {
          keyId: env.RAZORPAY_KEY_ID ?? "",
          keySecret: env.RAZORPAY_KEY_SECRET ?? "",
          webhookSecret: env.RAZORPAY_WEBHOOK_SECRET,
          currency: env.RAZORPAY_CURRENCY ?? "INR",
        },
        loyalty: {
          pointPerRupee: Number(env.LOYALTY_POINT_PER_RUPEE ?? "0.2"),
          maxRedemptionPct: Number(env.LOYALTY_MAX_REDEMPTION_PCT ?? "0.5"),
        },
        referrals: {
          level1Rate: Number(env.REFERRAL_LEVEL1_RATE ?? "0.025"),
          level2Rate: Number(env.REFERRAL_LEVEL2_RATE ?? "0.015"),
          level3Rate: Number(env.REFERRAL_LEVEL3_RATE ?? "0.01"),
          doctorReferralBonus: Number(env.POINTS_PER_REFERRAL_DOCTOR ?? "1000"),
          customerReferralBonus: Number(env.POINTS_PER_REFERRAL_CUSTOMER ?? "1000"),
        },
        site: {
          baseUrl: env.SITE_BASE_URL,
        },
      };

      return cached;
    }

    throw new Error(
      `Missing required environment variables: ${parsed.error.errors
        .map((err) => err.path.join("."))
        .join(", ")}`,
    );
  }

  const env = parsed.data;

  cached = {
    supabaseUrl: env.VITE_SUPABASE_URL,
    supabaseServiceKey: env.SUPABASE_SERVICE_ROLE_KEY,
    shopify: {
      domain: env.SHOPIFY_STORE_DOMAIN,
      adminToken: env.SHOPIFY_ADMIN_ACCESS_TOKEN,
      storefrontToken: env.SHOPIFY_STOREFRONT_ACCESS_TOKEN,
      apiVersion: env.SHOPIFY_API_VERSION,
    },
    razorpay: {
      keyId: env.RAZORPAY_KEY_ID,
      keySecret: env.RAZORPAY_KEY_SECRET,
      webhookSecret: env.RAZORPAY_WEBHOOK_SECRET,
      currency: env.RAZORPAY_CURRENCY,
    },
    loyalty: {
      pointPerRupee: Number(env.LOYALTY_POINT_PER_RUPEE),
      maxRedemptionPct: Number(env.LOYALTY_MAX_REDEMPTION_PCT),
    },
    referrals: {
      level1Rate: Number(env.REFERRAL_LEVEL1_RATE),
      level2Rate: Number(env.REFERRAL_LEVEL2_RATE),
      level3Rate: Number(env.REFERRAL_LEVEL3_RATE),
      doctorReferralBonus: Number(env.POINTS_PER_REFERRAL_DOCTOR),
      customerReferralBonus: Number(env.POINTS_PER_REFERRAL_CUSTOMER),
    },
    site: {
      baseUrl: env.SITE_BASE_URL,
    },
  };

  return cached;
}
