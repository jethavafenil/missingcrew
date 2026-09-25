import { z } from 'zod'

const optionalString = z.preprocess(
  (value) => value === '' ? undefined : value,
  z.string().optional(),
)

const publicEnvSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: optionalString,
  NEXT_PUBLIC_LOCATIONIQ_API_KEY: optionalString,
  NEXT_PUBLIC_PUSHER_CLUSTER: optionalString,
  NEXT_PUBLIC_PUSHER_KEY: optionalString,
  NEXT_PUBLIC_SITE_URL: optionalString,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: optionalString,
  NEXT_PUBLIC_SUPABASE_URL: optionalString,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: optionalString,
})

// Public variables must remain explicit property reads so Next.js can inline
// only NEXT_PUBLIC_* values into browser bundles.
export const publicEnv = publicEnvSchema.parse({
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  NEXT_PUBLIC_LOCATIONIQ_API_KEY: process.env.NEXT_PUBLIC_LOCATIONIQ_API_KEY,
  NEXT_PUBLIC_PUSHER_CLUSTER: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
  NEXT_PUBLIC_PUSHER_KEY: process.env.NEXT_PUBLIC_PUSHER_KEY,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
})
