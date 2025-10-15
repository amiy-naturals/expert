# Amiy Experts – Integration Guide

This document summarizes the codebase, lists APIs (with Debug Panel coverage), and provides a one-shot SQL migration to provision required tables/columns.

## Project map (what does what)

- server/index.ts – Express app, mounts all API routers, configures raw body for Shopify webhooks.
- server/lib/env.ts – Env parsing and typed config (Supabase, Shopify, Razorpay, Loyalty, Referrals, Site).
- server/lib/supabase.ts – Supabase service-role client factory.
- server/middleware/auth.ts – Supabase JWT auth middleware, ensures users row exists.
- server/lib/loyalty.ts – Points math, transactions, referral awards, locked-points support for provisional doctors.
- server/lib/referrals.ts – Referral graph helpers (chain traversal, records, summary).
- server/lib/orders.ts – Orders CRUD helpers.
- server/lib/rank.ts – Rank metrics and updates.
- server/lib/shopify.ts – Shopify Admin API, webhook HMAC verification, order note updates.
- server/lib/contacts.ts – Normalize email and phone to canonical forms.
- server/lib/attribution.ts – Resolve doctor from referral_code, build L1–L3 chain, post-join checks, contact extraction.
- server/routes/*.ts
  - admin.ts – Admin utilities (users, settings, metrics).
  - auth.ts – Auth callback utilities.
  - checkout.ts – Razorpay + Shopify checkout and verification.
  - images.ts – Signed uploads.
  - orders.ts – Orders listing.
  - loyalty.ts – Loyalty config and me.
  - referrals.ts – Network graph + summary (now aggregates spend since join).
  - leaderboard.ts – Leaderboard data.
  - doctors.ts – Doctor application + new invite/accept flows; unlocks locked points on approval.
  - enroll.ts – New public POST /api/enroll (referral_code + contact) capturing external customers.
  - webhooks.ts – New POST /api/webhooks/shopify for orders/create and orders/paid; idempotent attribution and rewards.
- client/App.tsx – SPA routes (Dashboard, Admin, Join, new JoinExpress).
- client/pages/JoinExpress.tsx – Express join OTP flow → success page (referral link, QR, locked bonus, checklist).
- client/pages/dashboard/Overview.tsx – Adds setup checklist widget.
- client/pages/Index.tsx – Marketing + Debug Panel (now includes new APIs for invite, accept, enroll, webhooks).
- client/lib/api.ts – Typed client wrappers for backend APIs (includes DoctorsAPI.invite/acceptInvite).
- client/lib/supabase.ts – Browser Supabase client.

## API endpoints (testable via Debug Panel)

- POST /api/doctors/invite – create an invite (admin).
- POST /api/doctors/accept-invite – redeem invite (session or phone+otp).
- POST /api/enroll – capture referral for email/phone without login.
- POST /api/webhooks/shopify – Shopify webhook (orders/create, orders/paid); requires X-Shopify-Hmac-Sha256.
- GET /api/referrals/network – L1–L3 graph with spend/points since join.
- GET /api/referrals/summary – counts per level + total.
- Existing: /api/products, /api/checkout/*, /api/loyalty/*, /api/rank/*, /api/admin/* …

Open Home → Debug section to call endpoints interactively.

## One-shot SQL migration

Warning: This will DROP and recreate key tables. Review before running in production.

```sql
-- prerequisites
create extension if not exists pgcrypto;

-- Optional: clean existing (DANGEROUS)
drop table if exists public.order_attributions cascade;
drop table if exists public.external_customers cascade;
drop table if exists public.doctor_invites cascade;
-- Columns on users
alter table public.users add column if not exists is_doctor_provisional boolean default true;
alter table public.users add column if not exists is_doctor_verified boolean default false;
alter table public.users add column if not exists pending_payout numeric default 0;

-- doctor_invites
create table if not exists public.doctor_invites (
  id uuid primary key default gen_random_uuid(),
  token text unique not null,
  phone text,
  name text,
  city text,
  inviter_id uuid references public.users(id) on delete set null,
  expires_at timestamptz,
  accepted_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_doctor_invites_token on public.doctor_invites(token);

-- external_customers
create table if not exists public.external_customers (
  id uuid primary key default gen_random_uuid(),
  email text,
  phone text,
  email_norm text generated always as (lower(email)) stored,
  phone_e164 text,
  shopify_customer_id bigint,
  referred_by_doctor_id uuid references public.users(id) on delete set null,
  joined_at timestamptz not null default now(),
  source text check (source in ('link','manual','import')) default 'link',
  pending_points numeric default 0,
  last_seen_order_at timestamptz,
  created_at timestamptz default now()
);
create index if not exists idx_external_customers_email_norm on public.external_customers(email_norm);
create index if not exists idx_external_customers_phone_e164 on public.external_customers(phone_e164);
create index if not exists idx_external_customers_referred_by on public.external_customers(referred_by_doctor_id);

-- order_attributions
create table if not exists public.order_attributions (
  id uuid primary key default gen_random_uuid(),
  shopify_order_id bigint unique,
  origin text check (origin in ('shopify','experts')) not null,
  customer_external_id uuid references public.external_customers(id),
  customer_user_id uuid references public.users(id),
  level1_doctor_id uuid references public.users(id),
  level2_doctor_id uuid references public.users(id),
  level3_doctor_id uuid references public.users(id),
  currency text,
  subtotal numeric,
  total numeric,
  created_at timestamptz not null,
  paid boolean default false,
  paid_at timestamptz,
  points_l1 numeric default 0,
  points_l2 numeric default 0,
  points_l3 numeric default 0,
  points_customer numeric default 0,
  computed_at timestamptz default now()
);
create index if not exists idx_order_attributions_l1 on public.order_attributions(level1_doctor_id);
create index if not exists idx_order_attributions_l2 on public.order_attributions(level2_doctor_id);
create index if not exists idx_order_attributions_l3 on public.order_attributions(level3_doctor_id);
create index if not exists idx_order_attributions_paid on public.order_attributions(paid);

-- optional email queue (fire-and-forget)
create table if not exists public.email_queue (
  id uuid primary key default gen_random_uuid(),
  recipient text not null,
  subject text not null,
  body text,
  data jsonb,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

-- helper: promote_to_doctor(uid) for admin approval side-effects
create or replace function public.promote_to_doctor(p_user_id uuid)
returns void language plpgsql as $$
begin
  update public.users
    set is_doctor_provisional = false,
        is_doctor_verified = true,
        role = coalesce(role, 'user')
  where id = p_user_id;
  -- unlock strategy handled in API; keep function minimal
end;$$;
```

Notes
- RLS: the backend uses service role; if you enable RLS, add policies for your roles accordingly.
- Ensure points_transactions and referrals tables exist (already part of app schema).

## Shopify webhooks (cannot be created via SQL)

Set SHOPIFY_WEBHOOK_SECRET in your environment, then register webhooks to your deployed URL:

```bash
# Replace <store>, <token>, <url>
BASE="https://<store>.myshopify.com/admin/api/2024-10"
HDR="X-Shopify-Access-Token: <token>"
create() { curl -sS -X POST "$BASE/webhooks.json" -H "Content-Type: application/json" -H "$HDR" \
  -d "{\"webhook\":{\"topic\":\"orders/create\",\"address\":\"<url>/api/webhooks/shopify\",\"format\":\"json\"}}"; }
create_paid() { curl -sS -X POST "$BASE/webhooks.json" -H "Content-Type: application/json" -H "$HDR" \
  -d "{\"webhook\":{\"topic\":\"orders/paid\",\"address\":\"<url>/api/webhooks/shopify\",\"format\":\"json\"}}"; }
create; create_paid;
```

## Setup checklist

- Add envs: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SHOPIFY_STORE_DOMAIN, SHOPIFY_ADMIN_ACCESS_TOKEN, SHOPIFY_WEBHOOK_SECRET, RAZORPAY_*.
- Run the SQL migration on your Postgres (Supabase) project.
- Deploy and set Shopify webhooks to https://<your-domain>/api/webhooks/shopify.
- Use Debug Panel on Home to validate endpoints.
