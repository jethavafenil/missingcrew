import { z } from 'zod'

// Ids are TEXT (legacy cuids + uuids).
const id = z.string().regex(/^[A-Za-z0-9_-]{1,64}$/, 'Invalid id')

export const MAX_HIRE_MESSAGE = 1000

export const createHireRequestSchema = z.object({
  crewId: id,
  projectId: id,
  role: z.preprocess((v) => (v === '' ? undefined : v), z.string().trim().max(100).optional()),
  message: z.string().trim().min(1, 'Please write a message').max(MAX_HIRE_MESSAGE, `Message must be ${MAX_HIRE_MESSAGE} characters or fewer`),
})

export const respondHireRequestSchema = z.object({
  status: z.enum(['ACCEPTED', 'DECLINED', 'CANCELLED']),
})
