-- =============================================================================
-- FixMyBuddy Supabase PostgreSQL Schema
-- Covers:
--  1. Authentication, Password Hashing (scrypt), Sessions, OTP & Reset Tokens
--  2. Role-Based Accounts (customer, mechanic, admin) & Emergency Contacts
--  3. Provider / Mechanic Profiles, Capabilities, Availability & Credentials
--  4. Customer Garage (Vehicles) & Maintenance Reminders
--  5. Repair Shops (for Towing Destinations) & Cancellation Policies
--  6. Quotes / Estimates (Visit Estimates, Repair Quotes & Extra Work Revisions)
--  7. Bookings, Active Service Progress, Arrival/Handover PINs & Sharing
--  8. Booking Messages (Mechanic Chat & Towing Chat), Reviews, Warranties
--  9. Customer & Mechanic Notifications (Updates), Support Chat & Disputes
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- -----------------------------------------------------------------------------
-- 1. USERS & AUTHENTICATION
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'mechanic', 'admin')),
  name TEXT NOT NULL CHECK (char_length(trim(name)) >= 2),
  email TEXT UNIQUE NOT NULL,
  phone TEXT UNIQUE,
  phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
  password_hash TEXT NOT NULL,
  accepted_terms BOOLEAN NOT NULL DEFAULT FALSE,
  accepted_terms_at TIMESTAMPTZ,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relationship TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (lower(email));
CREATE INDEX IF NOT EXISTS idx_users_phone ON users (phone);
CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);

-- Sessions store a SHA-256 hash of the opaque session token (never the raw token)
CREATE TABLE IF NOT EXISTS auth_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('customer', 'mechanic', 'admin')),
  ip_address TEXT,
  user_agent TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_token_hash ON auth_sessions (token_hash);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id ON auth_sessions (user_id);

-- Phone OTP challenges (code is stored hashed)
CREATE TABLE IF NOT EXISTS phone_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  flow TEXT NOT NULL DEFAULT 'login' CHECK (flow IN ('login', 'signup', 'mechanic')),
  code_hash TEXT NOT NULL,
  pending_signup JSONB,
  attempts INT NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  resend_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_phone_challenges_phone ON phone_challenges (phone);

-- Password reset tokens (token stored hashed)
CREATE TABLE IF NOT EXISTS password_resets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 2. MECHANIC / PROVIDER PROFILES & CANCELLATION POLICIES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cancellation_policies (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mechanic_profiles (
  id TEXT PRIMARY KEY,
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  online BOOLEAN NOT NULL DEFAULT FALSE,
  rating NUMERIC(3, 2) NOT NULL DEFAULT 5.00,
  reviews_count INT NOT NULL DEFAULT 0,
  jobs_completed INT NOT NULL DEFAULT 0,
  service_radius_km INT NOT NULL DEFAULT 15 CHECK (service_radius_km BETWEEN 1 AND 50),
  working_hours TEXT NOT NULL DEFAULT 'Mon–Sat · 8 AM–6 PM',
  flatbed_capability TEXT,
  specialties TEXT[] NOT NULL DEFAULT ARRAY['Battery', 'Flat tire', 'Not starting'],
  credentials TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  base_visit_fee NUMERIC(10, 2) NOT NULL DEFAULT 300.00,
  diagnosis_fee NUMERIC(10, 2) NOT NULL DEFAULT 150.00,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  position_updated_at TIMESTAMPTZ,
  payment_qr_url TEXT,
  payee_name TEXT,
  payout_destination TEXT DEFAULT 'GCash',
  cancellation_policy_id TEXT REFERENCES cancellation_policies(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mechanic_profiles_online ON mechanic_profiles (online, verified);

-- -----------------------------------------------------------------------------
-- 3. CUSTOMER VEHICLES & MAINTENANCE REMINDERS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('car', 'motorcycle')),
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INT NOT NULL CHECK (year BETWEEN 1900 AND 2100),
  color TEXT NOT NULL,
  plate TEXT NOT NULL DEFAULT '',
  normalized_plate TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vehicles_user_id ON vehicles (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_vehicles_unique_plate_per_user
  ON vehicles (user_id, normalized_plate)
  WHERE normalized_plate <> '';

CREATE TABLE IF NOT EXISTS maintenance_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  due_date DATE,
  target_mileage NUMERIC(10, 1),
  current_mileage NUMERIC(10, 1),
  notes TEXT DEFAULT '',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON maintenance_reminders (user_id);

-- -----------------------------------------------------------------------------
-- 4. REPAIR SHOPS & QUOTES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS repair_shops (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  vehicle_types TEXT[] NOT NULL DEFAULT ARRAY['car', 'motorcycle'],
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quotes (
  id TEXT NOT NULL,
  version INT NOT NULL DEFAULT 1,
  provider_id TEXT NOT NULL REFERENCES mechanic_profiles(id) ON DELETE CASCADE,
  booking_id TEXT,
  kind TEXT NOT NULL DEFAULT 'visit' CHECK (kind IN ('visit', 'repair', 'revision', 'decline_payable')),
  currency TEXT NOT NULL DEFAULT 'PHP',
  items JSONB NOT NULL DEFAULT '[]'::JSONB,
  total NUMERIC(10, 2) NOT NULL CHECK (total >= 0),
  base_quote_id TEXT,
  base_quote_version INT,
  towing_route JSONB,
  warranty_summary TEXT,
  reason_for_extra_work TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id, version)
);

-- -----------------------------------------------------------------------------
-- 5. BOOKINGS, TIMELINE, MESSAGES, REVIEWS & WARRANTIES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  reference TEXT UNIQUE NOT NULL,
  version INT NOT NULL DEFAULT 1,
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider_id TEXT REFERENCES mechanic_profiles(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  vehicle_label TEXT NOT NULL,
  service_type TEXT NOT NULL CHECK (service_type IN ('mechanic', 'towing')),
  issue_type TEXT NOT NULL,
  notes TEXT DEFAULT '',
  landmark TEXT DEFAULT '',
  pickup_address TEXT NOT NULL,
  pickup_lat DOUBLE PRECISION,
  pickup_lng DOUBLE PRECISION,
  destination_address TEXT,
  destination_shop JSONB,
  towing_condition JSONB,
  towing_route JSONB,
  status TEXT NOT NULL DEFAULT 'requested' CHECK (
    status IN ('requested', 'pending', 'confirmed', 'accepted', 'scheduled', 'en_route', 'arrived', 'in_progress', 'completed', 'cancelled', 'rejected')
  ),
  scheduled_at TIMESTAMPTZ,
  dispatched_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  estimate_id TEXT,
  estimate_version INT,
  quoted_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  paid_amount NUMERIC(10, 2),
  cancellation_policy_id TEXT REFERENCES cancellation_policies(id),
  payment_method TEXT NOT NULL DEFAULT 'provider_qr',
  payment_status TEXT NOT NULL DEFAULT 'unverified' CHECK (
    payment_status IN ('unverified', 'pending_verification', 'verified')
  ),
  payment_reference TEXT,
  receipt_available BOOLEAN NOT NULL DEFAULT FALSE,
  receipt_number TEXT,
  repairs_approved BOOLEAN NOT NULL DEFAULT FALSE,
  repair_approval_status TEXT CHECK (
    repair_approval_status IN ('awaiting_customer', 'approved', 'rejected')
  ),
  revision_status TEXT CHECK (
    revision_status IN ('awaiting_customer', 'approved', 'rejected')
  ),
  initial_estimate JSONB,
  repair_estimate JSONB,
  approved_quote JSONB,
  pending_revision JSONB,
  decline_payable_estimate JSONB,
  inspection_status TEXT,
  sharing_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  arrival_pin_hash TEXT,
  arrival_pin_plain TEXT,
  arrival_pin_expires_at TIMESTAMPTZ,
  arrival_verified_at TIMESTAMPTZ,
  handover_pin_hash TEXT,
  handover_pin_plain TEXT,
  handover_pin_expires_at TIMESTAMPTZ,
  mechanic_state JSONB NOT NULL DEFAULT '{}'::JSONB,
  towing_state JSONB NOT NULL DEFAULT '{}'::JSONB,
  warranties JSONB NOT NULL DEFAULT '[]'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON bookings (customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_provider_id ON bookings (provider_id, created_at DESC);

CREATE TABLE IF NOT EXISTS booking_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('mechanic', 'towing')),
  sender TEXT NOT NULL CHECK (sender IN ('customer', 'provider')),
  body TEXT NOT NULL CHECK (char_length(trim(body)) BETWEEN 1 AND 2000),
  client_id TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (booking_id, channel, client_id)
);

CREATE INDEX IF NOT EXISTS idx_booking_messages_booking ON booking_messages (booking_id, channel, created_at ASC);

CREATE TABLE IF NOT EXISTS booking_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id TEXT UNIQUE NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider_id TEXT REFERENCES mechanic_profiles(id) ON DELETE SET NULL,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body TEXT NOT NULL DEFAULT '' CHECK (char_length(body) <= 2000),
  version INT NOT NULL DEFAULT 1,
  client_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 6. NOTIFICATIONS, SUPPORT CHAT & DISPUTES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  booking_id TEXT REFERENCES bookings(id) ON DELETE SET NULL,
  type TEXT NOT NULL DEFAULT 'general',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender TEXT NOT NULL CHECK (sender IN ('customer', 'support')),
  body TEXT NOT NULL CHECK (char_length(trim(body)) BETWEEN 1 AND 2000),
  client_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, client_id)
);

CREATE INDEX IF NOT EXISTS idx_support_messages_user_id ON support_messages (user_id, created_at ASC);

CREATE TABLE IF NOT EXISTS disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  booking_id TEXT REFERENCES bookings(id) ON DELETE SET NULL,
  reason TEXT NOT NULL DEFAULT 'service',
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  amount_in_question NUMERIC(10, 2),
  currency TEXT NOT NULL DEFAULT 'PHP',
  status TEXT NOT NULL DEFAULT 'submitted',
  client_id TEXT NOT NULL,
  evidence JSONB NOT NULL DEFAULT '[]'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, client_id)
);

CREATE INDEX IF NOT EXISTS idx_disputes_user_id ON disputes (user_id, updated_at DESC);
