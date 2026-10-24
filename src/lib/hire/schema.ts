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

export const MAX_HIRE_ALL = 20

// HIRE ALL from the bucket list: one project, one message ("{name}" becomes each person's first name).
export const hireAllSchema = z.object({
  projectId: id,
  crewIds: z.array(id).min(1, 'Pick at least one crew member').max(MAX_HIRE_ALL, `You can hire up to ${MAX_HIRE_ALL} people at once`),
  role: z.preprocess((v) => (v === '' ? undefined : v), z.string().trim().max(100).optional()),
  message: z.string().trim().min(1, 'Please write a message').max(MAX_HIRE_MESSAGE, `Message must be ${MAX_HIRE_MESSAGE} characters or fewer`),
})

export function personalise(message: string, fullName: string | null | undefined): string {
  const first = (fullName || '').trim().split(/\s+/)[0] || 'there'
  return message.replace(/\{name\}/gi, first)
}
