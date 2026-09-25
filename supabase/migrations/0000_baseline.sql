-- RECORDED BASELINE — current production schema captured from prisma/schema.prisma
-- (the canonical shape; the live DB was built with `prisma db push`, so this is
--  the exact table/enum/index layout minus any drift — verify with
--  `supabase db pull` / `supabase db diff` once SUPABASE_DB_URL is available).
--
-- This migration is the recorded baseline for the rewrite, NOT something to
-- blindly re-run on top of an existing live DB (tables already exist there).
-- Apply to fresh/disposable databases only. Additive, non-destructive.

-- ############ ENUMS ############

CREATE TYPE "UserRole" AS ENUM ('CREW', 'EMPLOYER', 'ADMIN');
CREATE TYPE "SubscriptionTier" AS ENUM ('FREE_TRIAL', 'BASIC', 'PRO');
CREATE TYPE "ProjectStatus" AS ENUM ('OPEN', 'CLOSED', 'FILLED');
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'SHORTLISTED', 'REJECTED', 'HIRED');
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'CANCELED', 'PAST_DUE', 'UNPAID');
CREATE TYPE "NotificationType" AS ENUM ('APPLICATION_RECEIVED', 'APPLICATION_STATUS_CHANGED', 'PROJECT_POSTED', 'SUBSCRIPTION_EXPIRING', 'MESSAGE_RECEIVED', 'CONNECTION_REQUEST', 'CONNECTION_ACCEPTED');
CREATE TYPE "ConnectionStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- ############ USERS (NextAuth-style app identity) ############

CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "session_token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "email_verified" TIMESTAMP(3),
    "image" TEXT,
    "phone" TEXT,
    "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "role" "UserRole" NOT NULL DEFAULT 'CREW',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "password" TEXT,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- ############ CREW / EMPLOYER PROFILES ############

CREATE TABLE "crew_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "photo" TEXT,
    "city" TEXT,
    "budget_range_min" INTEGER,
    "budget_range_max" INTEGER,
    "budgetFlexible" BOOLEAN NOT NULL DEFAULT false,
    "primary_roles" JSONB NOT NULL,
    "years_experience" TEXT,
    "location" TEXT,
    "available_to_travel" BOOLEAN NOT NULL DEFAULT false,
    "availability" BOOLEAN NOT NULL DEFAULT true,
    "availability_start" TIMESTAMP(3),
    "availability_end" TIMESTAMP(3),
    "project_types" JSONB NOT NULL,
    "daily_budget_min" INTEGER,
    "daily_budget_max" INTEGER,
    "languages" JSONB NOT NULL,
    "imdb_link" TEXT,
    "portfolio_links" JSONB NOT NULL,
    "past_projects" JSONB,
    "referred_by" TEXT,
    "contact_whatsapp" TEXT,
    "terms_agreed" BOOLEAN NOT NULL DEFAULT false,
    "subscription_tier" "SubscriptionTier" NOT NULL DEFAULT 'FREE_TRIAL',
    "trial_ends" TIMESTAMP(3),
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "crew_profiles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "employer_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "company_name" TEXT,
    "company_website" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "employer_profiles_pkey" PRIMARY KEY ("id")
);

-- ############ PROJECTS / APPLICATIONS ############

CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "employer_id" TEXT NOT NULL,
    "project_name" TEXT NOT NULL,
    "project_type" TEXT NOT NULL,
    "roles_needed" JSONB NOT NULL,
    "shoot_start_date" TIMESTAMP(3) NOT NULL,
    "shoot_end_date" TIMESTAMP(3) NOT NULL,
    "location" TEXT NOT NULL,
    "budget_per_role" JSONB,
    "description" TEXT NOT NULL,
    "questions" JSONB NOT NULL,
    "contact_preference" JSONB NOT NULL,
    "status" "ProjectStatus" NOT NULL DEFAULT 'OPEN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "applications" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "crew_id" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "applied_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "employer_notes" TEXT,
    "crew_notes" TEXT,
    "answers" JSONB NOT NULL,
    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- ############ SUBSCRIPTIONS (Razorpay + Stripe) ############

CREATE TABLE "subscription_plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "features" JSONB NOT NULL,
    "stripe_price_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "razorpay_subscription_id" TEXT,
    "razorpay_payment_id" TEXT,
    "stripe_customer_id" TEXT,
    "stripe_subscription_id" TEXT,
    "stripe_price_id" TEXT,
    "current_period_start" TIMESTAMP(3) NOT NULL,
    "current_period_end" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- ############ NOTIFICATIONS / VERIFICATION ############

CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "verification_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "verification_tokens_pkey" PRIMARY KEY ("id")
);

-- ############ WISHLIST / CONNECTIONS ############

CREATE TABLE "wishlists" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "crew_id" TEXT,
    "project_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "wishlists_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "connections" (
    "id" TEXT NOT NULL,
    "requester_id" TEXT NOT NULL,
    "receiver_id" TEXT NOT NULL,
    "status" "ConnectionStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "connections_pkey" PRIMARY KEY ("id")
);

-- ############ FOREIGN KEYS ############

ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "crew_profiles" ADD CONSTRAINT "crew_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "employer_profiles" ADD CONSTRAINT "employer_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "projects" ADD CONSTRAINT "projects_employer_id_fkey" FOREIGN KEY ("employer_id") REFERENCES "employer_profiles" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "applications" ADD CONSTRAINT "applications_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "applications" ADD CONSTRAINT "applications_crew_id_fkey" FOREIGN KEY ("crew_id") REFERENCES "crew_profiles" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "subscription_plans" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "verification_tokens" ADD CONSTRAINT "verification_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "wishlists" ADD CONSTRAINT "wishlists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "wishlists" ADD CONSTRAINT "wishlists_crew_id_fkey" FOREIGN KEY ("crew_id") REFERENCES "crew_profiles" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "wishlists" ADD CONSTRAINT "wishlists_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "connections" ADD CONSTRAINT "connections_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "connections" ADD CONSTRAINT "connections_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ############ UNIQUE CONSTRAINTS / INDEXES ############

CREATE UNIQUE INDEX "users_email_key" ON "users" ("email");
CREATE INDEX "users_email_idx" ON "users" ("email");
CREATE INDEX "users_role_idx" ON "users" ("role");

CREATE UNIQUE INDEX "accounts_provider_provider_account_id_key" ON "accounts" ("provider", "provider_account_id");
CREATE INDEX "accounts_user_id_idx" ON "accounts" ("user_id");
CREATE INDEX "accounts_provider_idx" ON "accounts" ("provider");

CREATE UNIQUE INDEX "sessions_session_token_key" ON "sessions" ("session_token");
CREATE INDEX "sessions_user_id_idx" ON "sessions" ("user_id");
CREATE INDEX "sessions_expires_idx" ON "sessions" ("expires");

CREATE UNIQUE INDEX "crew_profiles_userId_key" ON "crew_profiles" ("userId");
CREATE UNIQUE INDEX "employer_profiles_userId_key" ON "employer_profiles" ("userId");

CREATE INDEX "projects_employer_id_idx" ON "projects" ("employer_id");
CREATE INDEX "projects_status_idx" ON "projects" ("status");
CREATE INDEX "projects_shoot_start_date_idx" ON "projects" ("shoot_start_date");
CREATE INDEX "projects_shoot_end_date_idx" ON "projects" ("shoot_end_date");
CREATE INDEX "projects_location_idx" ON "projects" ("location");

CREATE UNIQUE INDEX "applications_project_id_crew_id_key" ON "applications" ("project_id", "crew_id");
CREATE INDEX "applications_project_id_idx" ON "applications" ("project_id");
CREATE INDEX "applications_crew_id_idx" ON "applications" ("crew_id");
CREATE INDEX "applications_status_idx" ON "applications" ("status");
CREATE INDEX "applications_applied_at_idx" ON "applications" ("applied_at");

CREATE UNIQUE INDEX "subscriptions_userId_key" ON "subscriptions" ("userId");
CREATE INDEX "subscriptions_plan_id_idx" ON "subscriptions" ("plan_id");

CREATE INDEX "notifications_user_id_idx" ON "notifications" ("user_id");
CREATE INDEX "notifications_type_idx" ON "notifications" ("type");
CREATE INDEX "notifications_read_idx" ON "notifications" ("read");
CREATE INDEX "notifications_created_at_idx" ON "notifications" ("created_at");

CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens" ("token");
CREATE INDEX "verification_tokens_user_id_idx" ON "verification_tokens" ("user_id");
CREATE INDEX "verification_tokens_expires_idx" ON "verification_tokens" ("expires");

CREATE UNIQUE INDEX "wishlists_user_id_crew_id_key" ON "wishlists" ("user_id", "crew_id");
CREATE UNIQUE INDEX "wishlists_user_id_project_id_key" ON "wishlists" ("user_id", "project_id");
CREATE INDEX "wishlists_user_id_idx" ON "wishlists" ("user_id");
CREATE INDEX "wishlists_crew_id_idx" ON "wishlists" ("crew_id");
CREATE INDEX "wishlists_project_id_idx" ON "wishlists" ("project_id");
CREATE INDEX "wishlists_created_at_idx" ON "wishlists" ("created_at");

CREATE UNIQUE INDEX "connections_requester_id_receiver_id_key" ON "connections" ("requester_id", "receiver_id");
CREATE INDEX "connections_requester_id_idx" ON "connections" ("requester_id");
CREATE INDEX "connections_receiver_id_idx" ON "connections" ("receiver_id");
CREATE INDEX "connections_status_idx" ON "connections" ("status");
CREATE INDEX "connections_created_at_idx" ON "connections" ("created_at");