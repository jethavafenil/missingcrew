import 'server-only'
import { z } from 'zod'
import { publicEnv } from '@/lib/public-env'

const optionalString = z.preprocess(
  (value) => value === '' ? undefined : value,
  z.string().optional(),
)

const optionalUrl = z.preprocess(
  (value) => value === '' ? undefined : value,
  z.string().url().optional(),
)

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: optionalUrl,
  DIRECT_DATABASE_URL: optionalUrl,
  DATABASE_SSL_REJECT_UNAUTHORIZED: z.enum(['true', 'false']).default('true'),
  DATABASE_CONNECTION_LIMIT: z.coerce.number().int().positive().default(1),
  DATABASE_POOL_TIMEOUT: z.coerce.number().int().positive().default(10),
  PRISMA_DEBUG: z.enum(['true', 'false']).default('false'),
  EMAIL_HOST: optionalString,
  EMAIL_PORT: z.coerce.number().int().positive().default(587),
  EMAIL_SECURE: z.enum(['true', 'false']).default('false'),
  EMAIL_USER: optionalString,
  EMAIL_PASSWORD: optionalString,
  EMAIL_FROM: optionalString,
  CONTACT_EMAIL: optionalString,
  SUPPORT_EMAIL: optionalString,
  PUSHER_APP_ID: optionalString,
  PUSHER_SECRET: optionalString,
  REDIS_URL: optionalUrl,
  RAZORPAY_KEY_ID: optionalString,
  RAZORPAY_KEY_SECRET: optionalString,
  RAZORPAY_WEBHOOK_SECRET: optionalString,
  PAYMENT_PROVIDER: z.enum(['stripe', 'razorpay']).default('stripe'),
  STRIPE_SECRET_KEY: optionalString,
  STRIPE_WEBHOOK_SECRET: optionalString,
  TWILIO_ACCOUNT_SID: optionalString,
  TWILIO_AUTH_TOKEN: optionalString,
  TWILIO_FROM_NUMBER: optionalString,
  MOCK_SMS: z.enum(['0', '1', 'false', 'true']).default('false'),
  MOCK_SMS_MASTER_CODE: optionalString,
  ADMIN_CREATION_SECRET: optionalString,
  SUPABASE_URL: optionalUrl,
  SUPABASE_ANON_KEY: optionalString,
  SUPABASE_SERVICE_ROLE_KEY: optionalString,
  SUPABASE_DB_URL: optionalUrl,
}).superRefine((value, context) => {
  if (value.NODE_ENV !== 'production') return

  // All data access goes through Supabase (REST via service/anon keys) —
  // no direct DATABASE_URL connection exists anymore.
  for (const name of [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
  ] as const) {
    if (!value[name]) {
      context.addIssue({
        code: 'custom',
        path: [name],
        message: `${name} is required in production`,
      })
    }
  }
})

const parsed = serverEnvSchema.safeParse({
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL,
  DIRECT_DATABASE_URL: process.env.DIRECT_DATABASE_URL,
  DATABASE_SSL_REJECT_UNAUTHORIZED: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED,
  DATABASE_CONNECTION_LIMIT: process.env.DATABASE_CONNECTION_LIMIT,
  DATABASE_POOL_TIMEOUT: process.env.DATABASE_POOL_TIMEOUT,
  PRISMA_DEBUG: process.env.PRISMA_DEBUG,
  EMAIL_HOST: process.env.EMAIL_HOST,
  EMAIL_PORT: process.env.EMAIL_PORT,
  EMAIL_SECURE: process.env.EMAIL_SECURE,
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD,
  EMAIL_FROM: process.env.EMAIL_FROM,
  CONTACT_EMAIL: process.env.CONTACT_EMAIL,
  SUPPORT_EMAIL: process.env.SUPPORT_EMAIL,
  PUSHER_APP_ID: process.env.PUSHER_APP_ID,
  PUSHER_SECRET: process.env.PUSHER_SECRET,
  REDIS_URL: process.env.REDIS_URL,
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET,
  PAYMENT_PROVIDER: process.env.PAYMENT_PROVIDER,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
  TWILIO_FROM_NUMBER: process.env.TWILIO_FROM_NUMBER,
  MOCK_SMS: process.env.MOCK_SMS,
  MOCK_SMS_MASTER_CODE: process.env.MOCK_SMS_MASTER_CODE,
  ADMIN_CREATION_SECRET: process.env.ADMIN_CREATION_SECRET,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_DB_URL: process.env.SUPABASE_DB_URL,
})

if (!parsed.success) {
  throw new Error(`Invalid server environment:\n${z.prettifyError(parsed.error)}`)
}

export const env = {
  ...parsed.data,
  ...publicEnv,
}

export function requireEnv(value: string | undefined, name: string): string {
  if (!value) throw new Error(`${name} is required for this operation`)
  return value
}
