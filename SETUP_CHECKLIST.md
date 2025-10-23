# Amiy Experts Platform - Setup & Configuration Checklist

## ✅ NEWLY CREATED FILES

### 1. Database Schema
- **`supabase/schema.sql`** - Complete PostgreSQL schema for all tables, indexes, functions, and RLS policies
  - 16 tables (users, orders, referrals, referral_captures, points_transactions, etc.)
  - Stored functions for stats, rank calculation, points redemption
  - Triggers for timestamp updates
  - RLS policies for security
  - Default settings data

### 2. Referral Capture System
- **`client/components/site/ReferralCapturePopup.tsx`** - Popup modal for capturing leads from referral links
  - Shows 1.5 seconds after page load
  - Requests email OR phone (at least one required)
  - Posts to `/api/referral-capture` endpoint
  - Handles success/error states with toast notifications
  
- **`server/routes/referral-capture.ts`** - Backend endpoint for referral lead capture
  - Validates referral code format (AM-{identifier})
  - Looks up doctor by email prefix or username
  - Normalizes and saves contact information
  - Checks Shopify for existing customer profile
  - Links to existing users if matched
  - Returns customer profile if found

### 3. Integration Updates
- **`server/index.ts`** - Added referral-capture route registration
- **`client/pages/Index.tsx`** - Integrated ReferralCapturePopup component

---

## 📋 REQUIRED SETUP STEPS

### Step 1: Initialize Supabase Database

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **SQL Editor** section
4. Create a new query
5. Copy entire content of `supabase/schema.sql`
6. Paste into the SQL editor and execute
7. Verify all tables are created

**What gets created:**
- 16 database tables
- Indexes for performance
- Stored functions for calculations
- Row-Level Security (RLS) policies
- Default settings

### Step 2: Configure Supabase Storage

1. Go to **Storage** section in Supabase
2. Create a new bucket named `user-uploads`
3. Set the bucket to **Private**
4. Configure upload file size limit (recommend 50MB)

**Note:** This bucket is used for avatar images and license PDFs

### Step 3: Verify Environment Variables

Check `.env` file or Netlify dashboard has all required variables:

```bash
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
SUPABASE_JWT_SECRET=...

# Shopify
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
SHOPIFY_ADMIN_ACCESS_TOKEN=shpat_...
SHOPIFY_API_VERSION=2024-10

# Razorpay
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_CURRENCY=INR

# Configuration
LOYALTY_POINT_PER_RUPEE=0.2
LOYALTY_MAX_REDEMPTION_PCT=0.5
REFERRAL_LEVEL1_RATE=0.025
REFERRAL_LEVEL2_RATE=0.015
REFERRAL_LEVEL3_RATE=0.01
POINTS_PER_REFERRAL_DOCTOR=1000
POINTS_PER_REFERRAL_CUSTOMER=1000
```

### Step 4: Shopify Webhook Configuration

1. Go to Shopify Admin → **Settings** → **Apps and integrations** → **Webhooks**
2. Create webhook with these topics:
   - `orders/created`
   - `orders/updated`
   - `orders/paid`
3. Webhook URL: `https://your-domain.com/api/webhooks/shopify`
4. Webhook secret (optional but recommended): `SHOPIFY_WEBHOOK_SECRET`

### Step 5: Create First Super Admin (Manual Setup)

Until the UI is ready, create the first super admin via Supabase:

1. Go to Supabase SQL Editor
2. Run this query:

```sql
INSERT INTO users (id, email, name, role, avatar_approved)
VALUES (
  gen_random_uuid(),
  'admin@amiyexperts.com',
  'Super Admin',
  'super_admin',
  true
)
ON CONFLICT DO NOTHING;
```

Replace email with your admin email.

### Step 6: Test Referral Capture Flow

1. **Get referral code:**
   - Create a test doctor account
   - Note their referral code (AM-{email_prefix})

2. **Test popup:**
   - Visit home page with referral link: `/?ref=AM-TEST`
   - Popup should appear after 1.5 seconds
   - Enter email/phone and submit

3. **Verify in database:**
   ```sql
   SELECT * FROM referral_captures 
   ORDER BY created_at DESC 
   LIMIT 1;
   ```

---

## 🔍 VERIFICATION CHECKLIST

After setup, verify these items:

### Database
- [ ] All 16 tables created
- [ ] Indexes present on frequently queried fields
- [ ] Triggers working (check updated_at timestamps)
- [ ] RLS policies enabled
- [ ] Default settings inserted

### Application
- [ ] Environment variables configured
- [ ] Dev server starts: `npm run dev`
- [ ] No database connection errors
- [ ] Referral popup appears on `/?ref=AM-TEST`
- [ ] Referral capture POST request succeeds
- [ ] Toast notifications display correctly

### Shopify Integration
- [ ] Admin API token valid
- [ ] Customer search working
- [ ] Order API accessible
- [ ] Webhook configured

### Supabase Storage
- [ ] `user-uploads` bucket created
- [ ] Bucket is private
- [ ] Upload size limit configured

---

## 📊 DATABASE TABLES OVERVIEW

| Table | Purpose | Rows |
|-------|---------|------|
| `users` | Doctor and user profiles | Central entity |
| `orders` | Purchase orders | Order tracking |
| `points_transactions` | Points earn/burn log | Ledger |
| `referrals` | Doctor-to-doctor network | Upline tracking |
| `referral_captures` | External lead captures | Marketing |
| `external_customers` | Shopify-only customers | Attribution |
| `order_attributions` | Multi-level commissions | Points allocation |
| `doctor_applications` | Verification submissions | Approval workflow |
| `reviews` | Doctor reviews | Social proof |
| `leaderboard_snapshots` | Weekly rankings | Analytics |
| `rank_history` | Rank progression | Audit trail |
| `subscriptions` | Recurring orders | Billing |
| `expert_onboardings` | Onboarding snapshots | Audit |
| `images` | Avatar/license storage | File metadata |
| `doctor_invites` | Invite tokens | Growth |
| `settings` | Global configuration | Admin panel |

---

## 🚀 NEXT STEPS AFTER SETUP

1. **Test user flows:**
   - Doctor referral link with capture popup
   - User signup and onboarding
   - Product purchase and points award
   - Doctor application and verification
   - Admin approval workflows

2. **Load test data:**
   - Create test doctors
   - Create test customers
   - Create test orders to verify Shopify sync

3. **Monitor logs:**
   - Check server console for errors
   - Verify Shopify webhook deliveries
   - Check Razorpay payment logs

4. **Deploy to production:**
   - Connect to Netlify
   - Set environment variables in Netlify dashboard
   - Deploy and test in production environment

---

## 🆘 TROUBLESHOOTING

### Referral popup doesn't appear
- [ ] Check `ref` parameter in URL: `/?ref=AM-CODE`
- [ ] Check if user is logged in (popup only shows for anonymous)
- [ ] Check console for JavaScript errors
- [ ] Check network request to `/api/referral-capture` 

### Referral capture fails
- [ ] Verify referral code exists (check users table)
- [ ] Check email/phone normalization working
- [ ] Check Shopify API credentials
- [ ] Check RLS policies on tables

### Shopify webhook not receiving
- [ ] Verify webhook URL is publicly accessible
- [ ] Check Shopify webhook delivery logs
- [ ] Verify HMAC signature verification
- [ ] Check server logs for webhook processing

### Database errors
- [ ] Verify all tables created: `\dt` in Supabase SQL editor
- [ ] Check RLS policies: `SELECT * FROM pg_policies;`
- [ ] Verify service role key has permissions
- [ ] Check for table conflicts with existing data

---

## 📚 RELATED DOCUMENTATION

- **ADMIN_GUIDE.md** - Complete admin panel documentation
- **FEATURES_OVERVIEW.md** - Complete feature list
- **IMPLEMENTATION_SUMMARY.md** - Implementation details
- **README.md** - Project overview

---

## 💡 IMPORTANT NOTES

1. **Database migration:** The schema.sql file creates all tables. If tables already exist, the `IF NOT EXISTS` clauses will skip creation.

2. **RLS policies:** All RLS policies are created but may need adjustment based on your Supabase auth setup.

3. **Webhook security:** Always set `SHOPIFY_WEBHOOK_SECRET` and verify HMAC in production.

4. **Referral code format:** Uses doctor's email prefix (AM-{prefix}). Update `referralCodeFor` function in `client/lib/auth.ts` if you want different format.

5. **Phone normalization:** Defaults to India (+91) format. Update `normalizePhoneE164` in `server/lib/contacts.ts` for other countries.

---

## 📞 SUPPORT

If you encounter issues:

1. Check the relevant `.ts` or `.tsx` file
2. Review console/server logs
3. Check Supabase dashboard for data
4. Verify all environment variables are set
5. Test individual API endpoints with curl/Postman

---

**Last Updated:** 2024-12-19
**Status:** ✅ Complete - All critical files created
