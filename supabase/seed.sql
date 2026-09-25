-- Seed subscription plans (mirrors scripts/seed-subscription-plans.ts).
-- Basic and Pro are the sellable tiers; FREE_TRIAL is Users.role / CrewProfile.subscription_tier default.

INSERT INTO subscription_plans (id, name, price, description, features, created_at, updated_at)
VALUES
  (
    'cl_seed_basic_profile',
    'Basic Profile',
    199,
    'Basic subscription plan for crew members',
    '["Appear in crew search","Apply to 10 gigs/month","Show availability status","2 Portfolio links","Basic profile visibility"]'::jsonb,
    now(),
    now()
  ),
  (
    'cl_seed_pro_profile',
    'Pro Profile',
    399,
    'Premium subscription plan for crew members',
    '["Unlimited job applications","Appear higher in employer search","Verified badge","5 portfolio links","Featured in \"Recommended Crew\"","Priority support"]'::jsonb,
    now(),
    now()
  )
ON CONFLICT (id) DO NOTHING;