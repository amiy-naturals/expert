# Amiy Experts Platform - Complete Documentation

## 📋 Project Overview

**Amiy Experts** is a professional network platform that enables Ayurveda doctors to:
- Prescribe and earn commissions on product sales
- Build and mentor a network of other doctors
- Earn loyalty points and redeem them
- Receive tiered referral commissions from a 3-level network
- Get ranked based on performance metrics
- Manage subscriptions and recurring orders

**Tech Stack**: React 18, Express, Supabase (PostgreSQL), TypeScript, TailwindCSS, Razorpay (Payments), Shopify (Products)

---

## 🗂️ FILE STRUCTURE & RESPONSIBILITIES

### **CLIENT (Frontend - React SPA)**

#### Pages (`client/pages/`)
| File | Purpose |
|------|---------|
| `Index.tsx` | Landing page showcasing platform benefits, revenue streams, tiers, and CTAs |
| `Join.tsx` | Doctor signup flow with steps and benefits |
| `JoinExpress.tsx` | Quick onboarding for invited doctors via token |
| `Login.tsx` | Authentication page |
| `AuthCallback.tsx` | Handles Supabase auth redirects after login |
| `Shop.tsx` | Browse and purchase products |
| `Buy.tsx` | Single product purchase page |
| `Compensation.tsx` | Details about earning plans and compensation structure |
| `Army.tsx` | Amiy Army subscription program page |
| `Events.tsx` | Upcoming events and webinars |
| `Leaderboard.tsx` | Displays top performers in various categories |
| `NotFound.tsx` | 404 error page |

#### Dashboard Pages (`client/pages/dashboard/`)
**Protected routes - require authentication + onboarding**
| File | Purpose |
|------|---------|
| `Overview.tsx` | Dashboard home showing stats, recent orders, points |
| `Profile.tsx` | Edit personal info, avatar, clinic details |
| `Team.tsx` | View referred network members across 3 levels |
| `Orders.tsx` | Purchase history and order tracking |
| `Resources.tsx` | Educational materials and compliance docs |
| `Referrals.tsx` | Referral link sharing and earned commissions |
| `Rank.tsx` | Current rank, progress to next tier |
| `Points.tsx` | Loyalty points balance and transaction history |

#### Expert Pages (`client/pages/expert/`)
**Onboarding flow for new doctor experts**
| File | Purpose |
|------|---------|
| `Layout.tsx` | Wrapper for multi-step onboarding |
| `Cart.tsx` | Select products for starter kit |
| `Subscription.tsx` | Set up recurring delivery schedule |
| `Account.tsx` | Complete profile (name, phone, username) |
| `Review.tsx` | Confirm details before payment |

#### Admin Pages (`client/pages/admin/`)
**Admin-only protected routes**
| File | Purpose |
|------|---------|
| `AdminLayout.tsx` | Admin sidebar navigation |
| `Dashboard.tsx` | Admin metrics (user count, earnings) |
| `Users.tsx` | List all users, change roles, remove users |
| `Applications.tsx` | Review doctor verification applications |
| `Reviews.tsx` | Approve/reject user reviews |
| `Settings.tsx` | Global settings (loyalty rates, referral rates) |

#### Components (`client/components/`)
| Directory | Purpose |
|-----------|---------|
| `ui/` | Radix UI + TailwindCSS component library (buttons, cards, forms, etc.) |
| `site/` | Layout, auth guards, navigation |
| `dashboard/` | Dashboard widgets (stats, leaderboard, cards) |
| `shared/` | Avatar uploader, badges, file upload |
| `Reviews/` | Review list display |

#### Libraries (`client/lib/`)
| File | Purpose |
|------|---------|
| `supabase.ts` | Supabase client initialization with auth state sync |
| `api.ts` | Typed API client methods for all endpoints (AdminAPI, DoctorsAPI, etc.) |
| `auth.ts` | Local user state management (localStorage-based) |
| `utils.ts` | Utility functions (cn for classname merging, etc.) |

---

### **SERVER (Backend - Express)**

#### Routes (`server/routes/`)
| File | Endpoints | Purpose |
|------|-----------|---------|
| `admin.ts` | POST `/create-super-admin`, GET/POST `/users`, `/metrics`, `/settings`, `/role`, `/approve-avatar`, POST `/reviews/:id/approve`, DELETE `/users/:id` | Admin panel operations |
| `auth.ts` | GET/POST `/callback` | OAuth callback handlers for Supabase |
| `checkout.ts` | POST `/create`, `/verify` | Payment processing via Razorpay, Shopify order creation |
| `orders.ts` | GET `/` | List user's orders (protected) |
| `doctors.ts` | POST `/invite`, `/accept-invite`, `/apply`, `/admin/applications/:id/approve`, `/admin/applications/:id/reject`, GET `/me/application`, `/admin/applications` | Doctor onboarding & verification |
| `reviews.ts` | POST `/`, GET `/` | Create and list approved reviews |
| `referrals.ts` | GET `/network`, `/summary` | View referral network and earned commissions |
| `loyalty.ts` | GET `/config`, `/me` | Loyalty points balance and transactions |
| `rank.ts` | GET `/me`, `/:userId` | Doctor rank and progress metrics |
| `products.ts` | GET `/`, `/:handle` | List and get Shopify products |
| `images.ts` | POST `/upload-url`, `/`, GET `/signed-url` | Image upload to Supabase storage |
| `expert.ts` | POST `/onboard`, GET `/me`, debug endpoints | Expert doctor onboarding flow |
| `leaderboard.ts` | GET `/categories`, `/` | Weekly leaderboard snapshots |
| `webhooks.ts` | POST `/shopify` | Shopify webhook handler for order attribution |
| `enroll.ts` | (not yet shown) | Likely handles Amiy Army enrollment |
| `demo.ts` | GET `/demo` | Simple test endpoint |

#### Libraries (`server/lib/`)
| File | Purpose |
|------|---------|
| `env.ts` | Environment variable parsing and config schema validation |
| `supabase.ts` | Supabase server client (service role) |
| `loyalty.ts` | Points calculation, earning, redeeming, milestone rewards |
| `orders.ts` | Order CRUD operations (create, update, list) |
| `referrals.ts` | Referral record management, chain traversal |
| `rank.ts` | Rank computation based on stats (doctor → senior_expert → gold_mentor → platinum_leader) |
| `shopify.ts` | Shopify API calls (products, orders), HMAC verification |
| `attribution.ts` | Doctor chain resolution from referral codes, order attribution |
| `contacts.ts` | Email/phone normalization (lowercase email, E.164 phone format) |
| `razorpay.ts` | Razorpay instance, payment signature verification |

#### Middleware (`server/middleware/`)
| File | Purpose |
|------|---------|
| `auth.ts` | Extracts JWT from Authorization header, validates with Supabase, creates user row if missing, attached `authUser` and `userRow` to request |

#### Main Server File
| File | Purpose |
|------|---------|
| `server/index.ts` | Express app setup, CORS, raw body for Shopify webhooks, route registration |

---

### **SHARED CODE**

| File | Purpose |
|------|---------|
| `shared/api.ts` | Shared TypeScript interfaces (e.g., DemoResponse) |

---

## 🗄️ DATABASE SCHEMA (Supabase PostgreSQL)

Run this **complete SQL** in your Supabase SQL editor to create all tables and functions:

```sql
-- ============================================================================
-- AMIY EXPERTS PLATFORM - COMPLETE DATABASE SCHEMA
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. USERS TABLE
-- ============================================================================
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  name VARCHAR(255),
  username VARCHAR(255),
  clinic_name VARCHAR(255),
  clinic_city VARCHAR(255),
  bio TEXT,
  phone VARCHAR(20),
  birthday DATE,
  gender VARCHAR(20),
  avatar_url TEXT,
  avatar_approved BOOLEAN DEFAULT FALSE,
  license_number VARCHAR(255),
  license_url TEXT,
  photo_url TEXT,
  role VARCHAR(50) DEFAULT 'user',
  rank VARCHAR(50) DEFAULT 'doctor',
  is_doctor_provisional BOOLEAN DEFAULT FALSE,
  is_doctor_verified BOOLEAN DEFAULT FALSE,
  is_doctor_pending BOOLEAN DEFAULT FALSE,
  referred_by UUID REFERENCES users(id),
  points_balance NUMERIC DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_rank ON users(rank);
CREATE INDEX idx_users_referred_by ON users(referred_by);

-- ============================================================================
-- 2. ORDERS TABLE
-- ============================================================================
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  amount NUMERIC NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  type VARCHAR(50) DEFAULT 'one_time',
  status VARCHAR(50) DEFAULT 'pending',
  razorpay_order_id VARCHAR(255) UNIQUE,
  razorpay_payment_id VARCHAR(255) UNIQUE,
  shopify_order_id VARCHAR(255) UNIQUE,
  subscription_id UUID,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);

-- ============================================================================
-- 3. POINTS TRANSACTIONS TABLE
-- ============================================================================
CREATE TABLE points_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  delta NUMERIC NOT NULL,
  reason VARCHAR(100),
  order_id UUID REFERENCES orders(id),
  balance_after NUMERIC,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_points_transactions_user_id ON points_transactions(user_id);
CREATE INDEX idx_points_transactions_reason ON points_transactions(reason);
CREATE INDEX idx_points_transactions_created_at ON points_transactions(created_at);

-- ============================================================================
-- 4. REFERRALS TABLE
-- ============================================================================
CREATE TABLE referrals (
  referrer_id UUID NOT NULL REFERENCES users(id),
  referred_id UUID UNIQUE NOT NULL REFERENCES users(id),
  type VARCHAR(50),
  milestone_awarded BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (referrer_id, referred_id)
);

CREATE INDEX idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX idx_referrals_referred_id ON referrals(referred_id);
CREATE INDEX idx_referrals_type ON referrals(type);

-- ============================================================================
-- 5. RANK HISTORY TABLE
-- ============================================================================
CREATE TABLE rank_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  old_rank VARCHAR(50),
  new_rank VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_rank_history_user_id ON rank_history(user_id);

-- ============================================================================
-- 6. REVIEWS TABLE
-- ============================================================================
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  rating NUMERIC NOT NULL,
  title TEXT,
  body TEXT,
  review_type VARCHAR(50),
  target_user_id UUID REFERENCES users(id),
  approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_approved ON reviews(approved);
CREATE INDEX idx_reviews_created_at ON reviews(created_at);
CREATE INDEX idx_reviews_target_user_id ON reviews(target_user_id);

-- ============================================================================
-- 7. IMAGES TABLE
-- ============================================================================
CREATE TABLE images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  key VARCHAR(255) NOT NULL,
  bucket VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_images_user_id ON images(user_id);

-- ============================================================================
-- 8. DOCTOR INVITES TABLE
-- ============================================================================
CREATE TABLE doctor_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  name VARCHAR(255),
  city VARCHAR(255),
  inviter_id UUID REFERENCES users(id),
  expires_at TIMESTAMP,
  accepted_at TIMESTAMP,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_doctor_invites_token ON doctor_invites(token);
CREATE INDEX idx_doctor_invites_inviter_id ON doctor_invites(inviter_id);

-- ============================================================================
-- 9. DOCTOR APPLICATIONS TABLE
-- ============================================================================
CREATE TABLE doctor_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  license_number VARCHAR(255),
  license_url TEXT,
  photo_url TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_doctor_applications_user_id ON doctor_applications(user_id);
CREATE INDEX idx_doctor_applications_status ON doctor_applications(status);

-- ============================================================================
-- 10. SUBSCRIPTIONS TABLE
-- ============================================================================
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  product_variant_id VARCHAR(255),
  quantity INTEGER DEFAULT 1,
  frequency VARCHAR(50),
  next_order_date DATE,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- ============================================================================
-- 11. EXPERT ONBOARDINGS TABLE
-- ============================================================================
CREATE TABLE expert_onboardings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  cart JSONB,
  subscription JSONB,
  account JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_expert_onboardings_user_id ON expert_onboardings(user_id);

-- ============================================================================
-- 12. ORDER ATTRIBUTIONS TABLE (for Shopify external customers)
-- ============================================================================
CREATE TABLE order_attributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shopify_order_id BIGINT UNIQUE,
  origin VARCHAR(50) DEFAULT 'shopify',
  customer_external_id UUID,
  customer_user_id UUID REFERENCES users(id),
  level1_doctor_id UUID REFERENCES users(id),
  level2_doctor_id UUID REFERENCES users(id),
  level3_doctor_id UUID REFERENCES users(id),
  currency VARCHAR(10) DEFAULT 'INR',
  subtotal NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0,
  paid BOOLEAN DEFAULT FALSE,
  paid_at TIMESTAMP,
  points_l1 NUMERIC DEFAULT 0,
  points_l2 NUMERIC DEFAULT 0,
  points_l3 NUMERIC DEFAULT 0,
  points_customer NUMERIC DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_order_attributions_shopify_order_id ON order_attributions(shopify_order_id);
CREATE INDEX idx_order_attributions_level1_doctor_id ON order_attributions(level1_doctor_id);
CREATE INDEX idx_order_attributions_paid ON order_attributions(paid);

-- ============================================================================
-- 13. EXTERNAL CUSTOMERS TABLE (Shopify store customers)
-- ============================================================================
CREATE TABLE external_customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shopify_customer_id BIGINT UNIQUE,
  email VARCHAR(255),
  phone VARCHAR(20),
  email_norm VARCHAR(255) UNIQUE,
  phone_e164 VARCHAR(20),
  referred_by_doctor_id UUID REFERENCES users(id),
  pending_points NUMERIC DEFAULT 0,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_external_customers_shopify_customer_id ON external_customers(shopify_customer_id);
CREATE INDEX idx_external_customers_email_norm ON external_customers(email_norm);
CREATE INDEX idx_external_customers_phone_e164 ON external_customers(phone_e164);
CREATE INDEX idx_external_customers_referred_by_doctor_id ON external_customers(referred_by_doctor_id);

-- ============================================================================
-- 14. LEADERBOARD SNAPSHOTS TABLE
-- ============================================================================
CREATE TABLE leaderboard_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  category VARCHAR(100),
  value NUMERIC,
  rank INTEGER,
  week_start DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, category, week_start)
);

CREATE INDEX idx_leaderboard_snapshots_category_week ON leaderboard_snapshots(category, week_start);
CREATE INDEX idx_leaderboard_snapshots_user_id ON leaderboard_snapshots(user_id);

-- ============================================================================
-- 15. SETTINGS TABLE
-- ============================================================================
CREATE TABLE settings (
  id VARCHAR(50) PRIMARY KEY,
  loyalty_point_per_rupee NUMERIC DEFAULT 0.2,
  loyalty_max_redemption_pct NUMERIC DEFAULT 0.5,
  referral_level1_rate NUMERIC DEFAULT 0.025,
  referral_level2_rate NUMERIC DEFAULT 0.015,
  referral_level3_rate NUMERIC DEFAULT 0.01,
  doctor_commission_min NUMERIC DEFAULT 0.1,
  doctor_commission_max NUMERIC DEFAULT 0.2,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- STORED FUNCTIONS / PROCEDURES
-- ============================================================================

-- Function to promote user to doctor and assign badges
CREATE OR REPLACE FUNCTION promote_to_doctor(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE users
  SET is_doctor_verified = true, is_doctor_pending = false, rank = 'doctor'
  WHERE id = p_user_id;
END;
$$;

-- Function to calculate referral network stats
CREATE OR REPLACE FUNCTION get_referral_stats(p_user_id UUID)
RETURNS TABLE(
  level1_count BIGINT,
  level2_count BIGINT,
  level3_count BIGINT,
  total_referred BIGINT
)
LANGUAGE plpgsql
AS $$
DECLARE
  l1_ids UUID[];
  l2_ids UUID[];
BEGIN
  -- Get all level 1 referrals
  SELECT ARRAY_AGG(referred_id) INTO l1_ids
  FROM referrals
  WHERE referrer_id = p_user_id;
  
  -- Get all level 2 referrals
  SELECT ARRAY_AGG(referred_id) INTO l2_ids
  FROM referrals
  WHERE referrer_id = ANY(l1_ids);
  
  RETURN QUERY
  SELECT
    COALESCE(ARRAY_LENGTH(l1_ids, 1), 0)::BIGINT,
    COALESCE(ARRAY_LENGTH(l2_ids, 1), 0)::BIGINT,
    0::BIGINT,
    COALESCE(ARRAY_LENGTH(l1_ids, 1), 0) + COALESCE(ARRAY_LENGTH(l2_ids, 1), 0)
  ;
END;
$$;

-- Function to calculate available redeemable points
CREATE OR REPLACE FUNCTION calculate_redeemable_points(p_user_id UUID, p_order_value NUMERIC)
RETURNS NUMERIC
LANGUAGE plpgsql
AS $$
DECLARE
  v_balance NUMERIC;
  v_max_by_policy NUMERIC;
  v_loyalty_point_per_rupee NUMERIC;
  v_loyalty_max_redemption_pct NUMERIC;
BEGIN
  -- Get config from settings
  SELECT loyalty_point_per_rupee, loyalty_max_redemption_pct
  INTO v_loyalty_point_per_rupee, v_loyalty_max_redemption_pct
  FROM settings WHERE id = 'global';
  
  -- Default values if not found
  v_loyalty_point_per_rupee := COALESCE(v_loyalty_point_per_rupee, 0.2);
  v_loyalty_max_redemption_pct := COALESCE(v_loyalty_max_redemption_pct, 0.5);
  
  -- Get user balance
  SELECT points_balance INTO v_balance FROM users WHERE id = p_user_id;
  v_balance := COALESCE(v_balance, 0);
  
  -- Calculate max by policy
  v_max_by_policy := FLOOR(p_order_value * v_loyalty_max_redemption_pct);
  
  -- Return min of balance and policy
  RETURN GREATEST(0, LEAST(v_balance, v_max_by_policy));
END;
$$;

-- Trigger to update user.updated_at on modification
CREATE OR REPLACE FUNCTION update_user_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_user_timestamp
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_user_timestamp();

-- Trigger to update order.updated_at on modification
CREATE OR REPLACE FUNCTION update_order_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_order_timestamp
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION update_order_timestamp();

-- ============================================================================
-- DEFAULT DATA
-- ============================================================================

-- Insert global settings (can be updated via API)
INSERT INTO settings (id, loyalty_point_per_rupee, loyalty_max_redemption_pct, referral_level1_rate, referral_level2_rate, referral_level3_rate)
VALUES ('global', 0.2, 0.5, 0.025, 0.015, 0.01)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on sensitive tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own row
CREATE POLICY "users_read_own" ON users
FOR SELECT
USING (auth.uid() = id);

-- Policy: Users can update their own row
CREATE POLICY "users_update_own" ON users
FOR UPDATE
USING (auth.uid() = id);

-- Policy: Public read for profiles
CREATE POLICY "users_read_public" ON users
FOR SELECT
USING (true);

-- Policy: Users can read their own points
CREATE POLICY "points_read_own" ON points_transactions
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can read their own orders
CREATE POLICY "orders_read_own" ON orders
FOR SELECT
USING (auth.uid() = user_id);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_orders_user_id_status_created_at ON orders(user_id, status, created_at);
CREATE INDEX idx_points_user_id_created_at ON points_transactions(user_id, created_at);
CREATE INDEX idx_referrals_referred_id_created_at ON referrals(referred_id, created_at);
```

---

## �� EXTERNAL INTEGRATIONS & SETUP

### **1. Supabase (Database & Authentication)**
- **Purpose**: PostgreSQL database, user authentication, storage
- **Setup**:
  - Create Supabase project
  - Configure social login (Google, GitHub, etc.)
  - Run SQL schema above
  - Create storage bucket: `user-uploads`
  - Configure RLS policies

### **2. Shopify Store**
- **Purpose**: Product catalog and storefront
- **Setup**:
  - Create Shopify store at https://www.shopify.com
  - Get store domain, admin access token
  - Set `SHOPIFY_STORE_DOMAIN` and `SHOPIFY_ADMIN_ACCESS_TOKEN`
  - **Webhook Configuration** (see below)
  - Enable GraphQL Admin API access

### **3. Razorpay (Payment Processing)**
- **Purpose**: Payment gateway for India (INR currency)
- **Setup**:
  - Create Razorpay account at https://razorpay.com
  - Get Key ID and Key Secret
  - Set environment variables: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`
  - **For production**: Configure Razorpay webhook (see below)

### **4. Netlify (Optional - Deployment)**
- **Purpose**: Hosting and serverless functions
- **Setup**:
  - Connect repo to Netlify
  - Deploy functions from `netlify/functions/`
  - Configure env vars in Netlify dashboard

---

## 🔗 WEBHOOK SETUP

### **Shopify Order Webhook**
**Endpoint**: `POST /api/webhooks/shopify`

**Steps to Configure**:
1. Go to Shopify Admin > Settings > Apps and integrations > Webhooks
2. Create webhook with topics:
   - `orders/create`
   - `orders/updated`
   - `orders/paid`
3. URL: `https://your-domain.com/api/webhooks/shopify`
4. Configure webhook secret (optional but recommended): `SHOPIFY_WEBHOOK_SECRET`

**What it does**:
- Captures customer orders from external Shopify store
- Matches customer by email/phone to referred doctor
- Awards points to referring doctor (3-level chain)
- Creates order attribution records
- Updates order notes with attribution chain

### **Razorpay Webhook** (Optional)
**Purpose**: Verify payments server-side
**Setup**: Similar to Shopify - provide webhook URL in Razorpay dashboard

---

## 📊 FUNCTION & API MAPPING

### **Authentication Functions**

#### `server/middleware/auth.ts :: requireAuth`
```typescript
// TASK: Middleware that:
// 1. Extracts JWT from Authorization header
// 2. Validates token with Supabase
// 3. Creates user row if doesn't exist
// 4. Attaches authUser (Supabase User) and userRow (DB User) to request
// 5. Returns 401 if token missing/invalid

// Usage: app.post('/protected', requireAuth, handler)
```

### **User Management Functions**

#### `server/routes/admin.ts`
```typescript
// POST /api/admin/create-super-admin { email, name }
// TASK: Create a super admin user (server-only, no auth required for first super-admin)
// Returns: Created user object

// GET /api/admin/users
// TASK: List all users with full details (requires admin role)
// Returns: Array of all user records

// POST /api/admin/users/:id/role { role: 'user'|'admin'|'super_admin' }
// TASK: Change user role (super_admin only)
// Returns: Updated user

// POST /api/admin/users/:id/approve-avatar
// TASK: Approve user's avatar image
// Returns: Updated user with avatar_approved=true

// DELETE /api/admin/users/:id
// TASK: Remove user from system
// Returns: {success: true}

// GET /api/admin/metrics
// TASK: Get system metrics (user count, total earnings from paid orders)
// Returns: {usersCount: number, earnings: number}

// GET /api/admin/settings
// TASK: Get global settings (loyalty rates, referral rates, etc.)
// Returns: Settings object

// POST /api/admin/settings { loyalty_point_per_rupee, ... }
// TASK: Update global settings
// Returns: Updated settings
```

### **Doctor Onboarding Functions**

#### `server/routes/doctors.ts`
```typescript
// POST /api/doctors/invite { phone, name?, city? }
// TASK: Admin creates an invite for external doctor
// Returns: {token, joinPath, joinUrl, expiresAt}

// POST /api/doctors/accept-invite { token, otp?, phone? }
// TASK: Doctor accepts invite via token (public endpoint)
// TASK: Creates referral link, awards locked onboarding bonus
// Returns: {success, referralLink, bonus, locked}

// POST /api/doctors/apply { license_number, license_url, photo_url }
// TASK: Submit doctor application for verification (protected)
// Returns: Application object

// GET /api/doctors/me/application (protected)
// TASK: Get logged-in doctor's application status
// Returns: Latest application or null

// GET /api/doctors/admin/applications
// TASK: List all pending/approved doctor applications (admin)
// Returns: Array of applications with joined user details

// POST /api/doctors/admin/applications/:id/approve
// TASK: Approve application, set is_doctor_verified=true, unlock points
// Returns: {success: true}

// POST /api/doctors/admin/applications/:id/reject
// TASK: Reject application
// Returns: {success: true}
```

### **Payment & Checkout Functions**

#### `server/routes/checkout.ts`
```typescript
// POST /api/checkout/create (protected)
// TASK: Create Razorpay order
// INPUT: {amount, currency, lineItems, redeemedPoints?}
// TASK: Calculate subtotal, apply 15% logged-in discount, cap redeemed points
// TASK: Create DB order record with pending status
// Returns: {orderId, razorpayOrderId, amount, currency, razorpayKey}

// POST /api/checkout/verify (protected)
// TASK: Verify Razorpay payment signature
// TASK: Update order to paid status
// TASK: Create Shopify order with line items
// TASK: Award loyalty points to buyer and referrers (3-level)
// TASK: Update rank if criteria met
// Returns: {success, shopifyOrderId, shopifyOrderName}
```

### **Loyalty Points Functions**

#### `server/lib/loyalty.ts`
```typescript
// recordPointsTransaction(userId, delta, reason, orderId?, metadata?)
// TASK: Record a points transaction
// TASK: Update user.points_balance
// TASK: Create points_transactions entry
// Returns: New balance

// recordLockedPointsTransaction(userId, delta, reason, ...)
// TASK: Same as above but points are "locked" (not usable)
// TASK: Mark in metadata locked=true
// Returns: Balance (unchanged)

// calculateEarnedPoints(amountInRupees)
// TASK: Calculate points earned from order
// FORMULA: amount * loyaltyPointPerRupee
// Returns: Floor of points

// calculateMaxRedeemablePoints(balance, orderValue)
// TASK: Calculate max points user can redeem
// FORMULA: min(balance, floor(orderValue * maxRedemptionPct))
// Returns: Redeemable amount

// awardOrderPoints(userId, orderId, orderTotal, redeemedPoints?, context?)
// TASK: Award points to buyer and all 3-level referrers
// TASK: Award referral bonuses at configured rates
// TASK: Track locked points for provisional doctors
// TASK: Trigger rank update
// Returns: Transaction results

// awardDoctorReferralBonus(newDoctorId)
// TASK: Award bonus points when doctor completes verification
// TASK: Check if milestone already awarded
// Returns: Transaction result
```

### **Referral Network Functions**

#### `server/lib/referrals.ts`
```typescript
// ensureReferralRecord(referrerId, referredId, type)
// TASK: Create or upsert referral record
// type: 'customer' or 'doctor'

// getReferralChain(userId, depth)
// TASK: Traverse user's referrer chain (upward)
// Returns: Array of {userId, level} up to specified depth

// getReferralNetworkSummary(userId)
// TASK: Count all referrals at each level
// Returns: {level1, level2, level3}

// listDirectReferrals(userId)
// TASK: Get all direct referrals with their details
// Returns: Array of referral records with user data

// markReferralMilestoneAwarded(referrerId, referredId)
// TASK: Mark milestone as awarded (prevent duplicate bonuses)
```

#### `server/routes/referrals.ts`
```typescript
// GET /api/referrals/network (protected)
// TASK: Get detailed referral network for logged-in user
// TASK: Fetch all 3 levels, calculate orders/points for each
// TASK: Calculate contribution to current doctor
// Returns: {level1[], level2[], level3[], summary}

// GET /api/referrals/summary (protected)
// TASK: Quick summary of referral counts
// Returns: {level1, level2, level3, total}
```

### **Ranking Functions**

#### `server/lib/rank.ts`
```typescript
// getDoctorStats(userId)
// TASK: Calculate all stats for rank computation
// Returns: {patients, doctorReferrals, activeDoctors, totalSales, monthlySales}

// computeRank(stats)
// TASK: Determine rank from stats
// Logic:
//   - platinum_leader: 50+ active doctors AND 500k+ sales
//   - gold_mentor: 5+ active doctors AND 100k+ sales
//   - senior_expert: 50+ patients AND 20+ doctor referrals
//   - doctor: default
// Returns: RankKey

// maybeUpdateRank(userId)
// TASK: Recalculate rank, update if improved
// TASK: Create rank_history entry
// Returns: {currentRank, newRank, stats}
```

#### `server/routes/rank.ts`
```typescript
// GET /api/rank/me (protected)
// TASK: Get logged-in user's rank and progress

// GET /api/rank/:userId
// TASK: Get any user's rank (public)
// Returns: {rank, stats, progress}
```

### **Review Management Functions**

#### `server/routes/reviews.ts`
```typescript
// POST /api/reviews { user_id, rating, title, body, review_type?, target_user_id? }
// TASK: Create a review (requires avatar_approved)
// TASK: Prevent self-reviews on doctors
// Returns: Created review

// GET /api/reviews?limit=10&before=<date>&type=doctor&target=<user_id>
// TASK: List approved reviews (paginated)
// Returns: Array of reviews with user details
```

### **Image Upload Functions**

#### `server/routes/images.ts`
```typescript
// POST /api/images/upload-url { filename }
// TASK: Generate signed upload URL for Supabase storage
// TASK: Return key for use in metadata
// Returns: {uploadUrl, key, bucket}

// POST /api/images { user_id, key, bucket }
// TASK: Register uploaded image in DB
// Returns: Image record

// GET /api/images/signed-url?key=...
// TASK: Get signed download URL for viewing
// Returns: {signedUrl}
```

### **Product Functions**

#### `server/routes/products.ts`
```typescript
// GET /api/products?limit=50&pageInfo=...&collectionId=...&status=active
// TASK: Fetch products from Shopify API
// TASK: Cache results for 60 seconds
// Returns: {products[], nextPageInfo?, prevPageInfo?}

// GET /api/products/:handle
// TASK: Get single product by handle
// Returns: Product object
```

### **Expert Onboarding Functions**

#### `server/routes/expert.ts`
```typescript
// POST /api/expert/onboard (protected)
// INPUT: {cart: [{productId, qty}], subscription: {nextDate, frequency}, account: {...}}
// TASK: Validate input (nextDate 2-60 days future)
// TASK: Store onboarding snapshot
// TASK: Build line items from Shopify products
// TASK: Calculate discount (25% for 3k+, 20% for 2k+, etc.)
// TASK: Create subscriptions for recurring orders
// TASK: Create Razorpay order
// Returns: {orderId, razorpayOrderId, amount, currency, razorpayKey}

// POST /api/expert/debug/validate
// POST /api/expert/debug/onboarding
// POST /api/expert/debug/build
// POST /api/expert/debug/subscriptions
// POST /api/expert/debug/order
// TASK: Debug endpoints for testing each step

// GET /api/expert/me (protected)
// TASK: Check if user is onboarded
// Returns: {onboarded, subscriptions, onboardings}
```

### **Leaderboard Functions**

#### `server/routes/leaderboard.ts`
```typescript
// GET /api/leaderboard/categories
// TASK: List all leaderboard categories
// Returns: Array of {key, label}

// GET /api/leaderboard?category=most_level1&week=2024-10-07
// TASK: Get weekly leaderboard snapshot
// Returns: {week_start, category, entries[]}
```

### **Webhook Functions**

#### `server/routes/webhooks.ts :: /shopify`
```typescript
// POST /api/webhooks/shopify
// TASK: Receive Shopify order webhooks (orders/create, /updated, /paid)
// TASK: Verify HMAC signature
// TASK: Match customer to external_customers by email/phone
// TASK: Resolve doctor referral chain from customer.referred_by_doctor_id
// TASK: Calculate points for each level + customer
// TASK: Create/update order_attributions record
// TASK: Award points to doctors (locked if provisional)
// TASK: Award points to customer (if user exists)
// TASK: Update Shopify order note with attribution chain
// Returns: {ok: true}
```

---

## 🧪 TESTING & DEBUGGING GUIDE

### **Testing APIs via Network Tab**

#### **1. Authentication (Login)**
**Steps**:
1. Go to `/login` page
2. Sign in via Supabase (Google/GitHub/etc.)
3. Open DevTools > Network tab
4. Look for requests to `supabase.co` endpoints
5. Copy access token from response headers or localStorage
6. For subsequent calls: Add header `Authorization: Bearer <token>`

**What to look for**:
- `auth/v1/token`: Login request/response
- Auth state stored in localStorage key `supabase.auth.v2`

---

#### **2. Create Order**
**Endpoint**: `POST /api/checkout/create`
**Protected**: Yes (requires auth)
**Body**:
```json
{
  "amount": 1000,
  "currency": "INR",
  "lineItems": [{"variantId": 123, "quantity": 1, "price": 1000}],
  "redeemedPoints": 0
}
```
**Network Tab Check**:
- Request: See payload in Network > Request tab
- Response: Should return `{orderId, razorpayOrderId, amount, currency, razorpayKey}`
- Status: 200 OK

**Debug Console**:
```javascript
// Check order created in DB
const { data } = await supabase.from('orders').select('*').eq('id', orderId);
console.log(data);
```

---

#### **3. Verify Payment**
**Endpoint**: `POST /api/checkout/verify`
**Protected**: Yes
**Body**:
```json
{
  "orderId": "uuid-from-create",
  "razorpayOrderId": "order_...",
  "razorpayPaymentId": "pay_...",
  "razorpaySignature": "sig...",
  "customer": {"email": "user@example.com"}
}
```
**Network Tab Check**:
- Request payload should include valid signature
- Response: `{success: true, shopifyOrderId, shopifyOrderName}`
- Check order status changed to "paid" in DB

**Debug Console**:
```javascript
// Verify order status
const { data } = await supabase.from('orders').select('*').eq('id', orderId);
console.log('Order status:', data[0].status); // Should be 'paid'

// Check points awarded
const { data: points } = await supabase.from('points_transactions').select('*').eq('user_id', userId);
console.log('Points transactions:', points);
```

---

#### **4. Doctor Application**
**Endpoint**: `POST /api/doctors/apply`
**Protected**: Yes
**Body**:
```json
{
  "license_number": "AYUR123456",
  "license_url": "https://...",
  "photo_url": "https://..."
}
```
**Network Tab Check**:
- Status: 200 OK
- Response: Application object with status="pending"

**Debug Console**:
```javascript
// Check application
const { data } = await supabase.from('doctor_applications')
  .select('*')
  .eq('user_id', userId)
  .single();
console.log('Application:', data);
```

---

#### **5. Get Referral Network**
**Endpoint**: `GET /api/referrals/network`
**Protected**: Yes
**Network Tab Check**:
- Response: Complex structure with level1, level2, level3 arrays
- Each entry has: id, name, email, orders, points, level, commissionPct

**Debug Console**:
```javascript
// Verify network fetched
const response = await fetch('/api/referrals/network', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const data = await response.json();
console.log('Level 1:', data.level1);
console.log('Level 2:', data.level2);
console.log('Level 3:', data.level3);
```

---

#### **6. Get User Rank**
**Endpoint**: `GET /api/rank/me`
**Protected**: Yes
**Network Tab Check**:
- Response: `{rank: 'doctor'|'senior_expert'|'gold_mentor'|'platinum_leader', stats: {...}, progress: {...}}`

**Debug Console**:
```javascript
const response = await fetch('/api/rank/me', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const { rank, stats } = await response.json();
console.log('Rank:', rank);
console.log('Patients:', stats.patients);
console.log('Active doctors:', stats.activeDoctors);
console.log('Total sales:', stats.totalSales);
```

---

#### **7. Admin: List Users**
**Endpoint**: `GET /api/admin/users`
**Protected**: Yes (admin role required)
**Network Tab Check**:
- Response: Array of all users
- Status: 403 if not admin

**Debug Console**:
```javascript
// List all users
const response = await fetch('/api/admin/users', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const users = await response.json();
console.log('Users:', users);
```

---

#### **8. Admin: Get Settings**
**Endpoint**: `GET /api/admin/settings`
**Network Tab Check**:
- Response: Settings object with all rates

**Debug Console**:
```javascript
const response = await fetch('/api/admin/settings');
const settings = await response.json();
console.log('Loyalty point per rupee:', settings.loyalty_point_per_rupee);
console.log('Referral L1 rate:', settings.referral_level1_rate);
```

---

### **Testing Functions via Console Logs**

#### **1. Login/Auth State**
**File**: `client/App.tsx`
**Console Output**:
```
Signed in: user@example.com
Session restored: user@example.com
```

---

#### **2. Order Processing**
**File**: `server/routes/checkout.ts`
**Console Output**:
```
[checkout/verify] content-type: application/json
[checkout/verify] headers: {...}
[checkout/verify] body (object): {...}
```
**Check**: Look for `content-type` and `body` logs to verify payload

---

#### **3. Points Award**
**File**: `server/lib/loyalty.ts`
**What to Log Manually**:
```typescript
// Add to awardOrderPoints function:
console.log('Base points:', basePoints);
console.log('Referral chain:', chain);
console.log('Level rates:', levelRates);
```

---

#### **4. Rank Computation**
**File**: `server/lib/rank.ts`
**What to Log**:
```typescript
// Add to getDoctorStats:
console.log('Doctor stats:', { patients, doctorReferrals, activeDoctors, totalSales });

// Add to maybeUpdateRank:
console.log('Current rank:', currentRank);
console.log('New rank:', newRank);
```

---

#### **5. Shopify Webhook**
**File**: `server/routes/webhooks.ts`
**Check Logs**:
```
webhook received: orders/paid
shopify_order_id: 123456
matched external customer: true/false
doctor chain: l1=..., l2=..., l3=...
points awarded to l1: 100
```
**Manual Log**:
```typescript
console.log('Shopify webhook topic:', topic);
console.log('Order ID:', shopify_order_id);
console.log('Attribution:', { l1, l2, l3 });
```

---

#### **6. Referral Network Fetch**
**File**: `server/routes/referrals.ts`
**Check for**:
```typescript
console.log('Level 1 IDs:', level1Ids);
console.log('Level 2 IDs:', level2Ids);
console.log('Enrichment map:', e1, e2);
```

---

### **Database Verification (Supabase SQL Editor)**

#### **Check Order Status**
```sql
SELECT id, user_id, amount, status, created_at
FROM orders
WHERE user_id = 'user-uuid'
ORDER BY created_at DESC
LIMIT 10;
```

---

#### **Check Points Awarded**
```sql
SELECT user_id, delta, reason, balance_after, created_at
FROM points_transactions
WHERE user_id = 'user-uuid'
ORDER BY created_at DESC
LIMIT 20;
```

---

#### **Check Referral Network**
```sql
SELECT r.referrer_id, r.referred_id, r.type, u.name, u.rank
FROM referrals r
JOIN users u ON u.id = r.referred_id
WHERE r.referrer_id = 'doctor-uuid'
ORDER BY r.created_at;
```

---

#### **Check Doctor Applications**
```sql
SELECT da.id, da.user_id, u.name, da.status, da.created_at
FROM doctor_applications da
JOIN users u ON u.id = da.user_id
WHERE da.status = 'pending'
ORDER BY da.created_at;
```

---

#### **Check Order Attributions**
```sql
SELECT shopify_order_id, level1_doctor_id, level2_doctor_id, level3_doctor_id,
       points_l1, points_l2, points_l3, points_customer, paid
FROM order_attributions
WHERE paid = true
ORDER BY created_at DESC
LIMIT 10;
```

---

## 📝 QUICK REFERENCE

### **Key Concepts**

| Concept | Definition |
|---------|-----------|
| **Doctor** | Ayurveda practitioner who joins platform to earn commissions |
| **Expert** | Doctor who completes onboarding and becomes active |
| **Loyalty Points** | Earned from purchases, redeemable for discounts |
| **Referral Commission** | Points earned when referred user makes purchase (3-level: L1=2.5%, L2=1.5%, L3=1%) |
| **Rank** | Doctor badge based on performance (doctor → senior_expert → gold_mentor → platinum_leader) |
| **Locked Points** | Points awarded to provisional doctors, unlocked after verification |
| **Order Attribution** | Tracking external Shopify customer to doctor referral chain |

### **Default Configuration**

```
Loyalty Points: 0.2 points per rupee
Max Redemption: 50% of order value
Referral L1: 2.5% of customer purchase
Referral L2: 1.5% of customer purchase
Referral L3: 1.0% of customer purchase
Doctor Onboarding Bonus: 1000 locked points
Customer Referral Milestone: 1000 points (after 3 purchases)
```

---

## 🚀 DEPLOYMENT CHECKLIST

- [ ] Database: Run SQL schema in Supabase
- [ ] Environment Variables: Set all required env vars
- [ ] Shopify: Configure webhook for orders
- [ ] Supabase: Configure RLS policies
- [ ] Supabase: Create storage bucket `user-uploads`
- [ ] Build: Run `npm run build`
- [ ] Test: Run `npm test`
- [ ] Deploy: Push to Netlify or chosen host

---

## 📞 SUPPORT

For questions on:
- **Database**: Check `schema` section above
- **APIs**: See `FUNCTION & API MAPPING` section
- **Testing**: See `TESTING & DEBUGGING GUIDE` section
- **External services**: See `EXTERNAL INTEGRATIONS` section
