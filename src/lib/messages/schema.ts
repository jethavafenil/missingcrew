import { z } from 'zod'

// Ids are TEXT (legacy cuids + uuids).
const id = z.string().regex(/^[A-Za-z0-9_-]{1,64}$/, 'Invalid id')

export const MAX_DIRECT_MESSAGE = 1000

export const directMessageSchema = z.object({
  crewId: id,
  message: z.string().trim().min(1, 'Please write a message').max(MAX_DIRECT_MESSAGE, `Message must be ${MAX_DIRECT_MESSAGE} characters or fewer`),
})
