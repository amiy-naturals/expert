-- ============================================================================
-- AMIY EXPERTS PLATFORM - COMPLETE DATABASE SCHEMA
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. USERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
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
  license_verified BOOLEAN DEFAULT FALSE,
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
  max_total_spent NUMERIC DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_rank ON users(rank);
CREATE INDEX IF NOT EXISTS idx_users_referred_by ON users(referred_by);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- ============================================================================
-- 2. ORDERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS orders (
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

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_user_id_status_created_at ON orders(user_id, status, created_at);

-- ============================================================================
-- 3. POINTS TRANSACTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS points_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  delta NUMERIC NOT NULL,
  reason VARCHAR(100),
  order_id UUID REFERENCES orders(id),
  balance_after NUMERIC,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_points_transactions_user_id ON points_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_points_transactions_reason ON points_transactions(reason);
CREATE INDEX IF NOT EXISTS idx_points_transactions_created_at ON points_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_points_user_id_created_at ON points_transactions(user_id, created_at);

-- ============================================================================
-- 4. REFERRALS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS referrals (
  referrer_id UUID NOT NULL REFERENCES users(id),
  referred_id UUID UNIQUE NOT NULL REFERENCES users(id),
  type VARCHAR(50),
  milestone_awarded BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (referrer_id, referred_id)
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_type ON referrals(type);

-- ============================================================================
-- 5. REFERRAL CAPTURES TABLE (for external leads)
-- ============================================================================
CREATE TABLE IF NOT EXISTS referral_captures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID NOT NULL REFERENCES users(id),
  email VARCHAR(255),
  phone VARCHAR(20),
  email_normalized VARCHAR(255),
  phone_e164 VARCHAR(20),
  source VARCHAR(50) DEFAULT 'referral_link',
  matched_to_user_id UUID REFERENCES users(id),
  matched_to_external_customer_id UUID,
  status VARCHAR(50) DEFAULT 'pending',
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_referral_captures_doctor_id ON referral_captures(doctor_id);
CREATE INDEX IF NOT EXISTS idx_referral_captures_email_normalized ON referral_captures(email_normalized);
CREATE INDEX IF NOT EXISTS idx_referral_captures_phone_e164 ON referral_captures(phone_e164);
CREATE INDEX IF NOT EXISTS idx_referral_captures_matched_to_user_id ON referral_captures(matched_to_user_id);
CREATE INDEX IF NOT EXISTS idx_referral_captures_status ON referral_captures(status);
CREATE INDEX IF NOT EXISTS idx_referral_captures_created_at ON referral_captures(created_at);

-- ============================================================================
-- 6. RANK HISTORY TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS rank_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  old_rank VARCHAR(50),
  new_rank VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rank_history_user_id ON rank_history(user_id);

-- ============================================================================
-- 7. REVIEWS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS reviews (
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

CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_approved ON reviews(approved);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at);
CREATE INDEX IF NOT EXISTS idx_reviews_target_user_id ON reviews(target_user_id);

-- ============================================================================
-- 8. IMAGES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  key VARCHAR(255) NOT NULL,
  bucket VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_images_user_id ON images(user_id);

-- ============================================================================
-- 9. DOCTOR INVITES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS doctor_invites (
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

CREATE INDEX IF NOT EXISTS idx_doctor_invites_token ON doctor_invites(token);
CREATE INDEX IF NOT EXISTS idx_doctor_invites_inviter_id ON doctor_invites(inviter_id);

-- ============================================================================
-- 10. DOCTOR APPLICATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS doctor_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  license_number VARCHAR(255),
  license_url TEXT,
  photo_url TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_doctor_applications_user_id ON doctor_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_doctor_applications_status ON doctor_applications(status);

-- ============================================================================
-- 11. SUBSCRIPTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS subscriptions (
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

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- ============================================================================
-- 12. EXPERT ONBOARDINGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS expert_onboardings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  cart JSONB,
  subscription JSONB,
  account JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_expert_onboardings_user_id ON expert_onboardings(user_id);

-- ============================================================================
-- 13. ORDER ATTRIBUTIONS TABLE (for Shopify external customers)
-- ============================================================================
CREATE TABLE IF NOT EXISTS order_attributions (
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

CREATE INDEX IF NOT EXISTS idx_order_attributions_shopify_order_id ON order_attributions(shopify_order_id);
CREATE INDEX IF NOT EXISTS idx_order_attributions_level1_doctor_id ON order_attributions(level1_doctor_id);
CREATE INDEX IF NOT EXISTS idx_order_attributions_paid ON order_attributions(paid);

-- ============================================================================
-- 14. EXTERNAL CUSTOMERS TABLE (Shopify store customers)
-- ============================================================================
CREATE TABLE IF NOT EXISTS external_customers (
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

CREATE INDEX IF NOT EXISTS idx_external_customers_shopify_customer_id ON external_customers(shopify_customer_id);
CREATE INDEX IF NOT EXISTS idx_external_customers_email_norm ON external_customers(email_norm);
CREATE INDEX IF NOT EXISTS idx_external_customers_phone_e164 ON external_customers(phone_e164);
CREATE INDEX IF NOT EXISTS idx_external_customers_referred_by_doctor_id ON external_customers(referred_by_doctor_id);

-- ============================================================================
-- 15. LEADERBOARD SNAPSHOTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS leaderboard_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  category VARCHAR(100),
  value NUMERIC,
  rank INTEGER,
  week_start DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, category, week_start)
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_snapshots_category_week ON leaderboard_snapshots(category, week_start);
CREATE INDEX IF NOT EXISTS idx_leaderboard_snapshots_user_id ON leaderboard_snapshots(user_id);

-- ============================================================================
-- 16. SETTINGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS settings (
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

DROP TRIGGER IF EXISTS trigger_update_user_timestamp ON users;
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

DROP TRIGGER IF EXISTS trigger_update_order_timestamp ON orders;
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
CREATE POLICY IF NOT EXISTS users_read_own ON users
FOR SELECT
USING (auth.uid() = id);

-- Policy: Users can update their own row
CREATE POLICY IF NOT EXISTS users_update_own ON users
FOR UPDATE
USING (auth.uid() = id);

-- Policy: Public read for profiles
CREATE POLICY IF NOT EXISTS users_read_public ON users
FOR SELECT
USING (true);

-- Policy: Users can read their own points
CREATE POLICY IF NOT EXISTS points_read_own ON points_transactions
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can read their own orders
CREATE POLICY IF NOT EXISTS orders_read_own ON orders
FOR SELECT
USING (auth.uid() = user_id);
