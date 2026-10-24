import { after } from 'next/server'
import { crewProfileRepo, employerProfileRepo, notificationRepo } from '@/lib/repo'
import { ApiError } from '@/lib/api/errors'
import { handle } from '@/lib/api/handler'
import { parseBody } from '@/lib/api/body'
import { requireRole } from '@/lib/api/auth'
import { rateLimitMiddleware, RATE_LIMITS } from '@/lib/rateLimiter'
import { createDirectMessageEmail, sendEmail } from '@/lib/email'
import { directMessageSchema } from '@/lib/messages/schema'

// POST /api/messages: a producer sends one message to a crew member. The crew member gets
// a notification and an email whose Reply-To is the producer, so the conversation continues
// by email. The crew member's address is never returned to the producer.
export async function POST(request: Request) {
  const handler = handle(async () => {
    const { session, requester } = await requireRole('EMPLOYER')
    const limited = await rateLimitMiddleware(request as import('next/server').NextRequest, 'direct-message', { userId: session.user.id, policy: RATE_LIMITS.directMessage })
    if (limited) return limited

    const input = await parseBody(request, directMessageSchema)
    const crew = await crewProfileRepo.findByIdWithUser(input.crewId)
    if (!crew || !crew.user) throw new ApiError(404, 'Crew member not found', 'NOT_FOUND')
    if (crew.userId === session.user.id) throw new ApiError(400, 'You cannot message yourself', 'INVALID')

    const employer = await employerProfileRepo.findByUserId(session.user.id, requester)
    const producerName = employer?.companyName || session.user.name || 'A producer'

    try {
      await notificationRepo.create({
        userId: crew.userId,
        type: 'MESSAGE_RECEIVED',
        title: `Message from ${producerName}`,
        message: input.message.length > 140 ? `${input.message.slice(0, 137)}...` : input.message,
        data: { fromUserId: session.user.id },
      }, requester)
    } catch (error) {
      console.error('Message notification failed:', error)
    }

    const to = crew.user.email
    const replyTo = session.user.email
    const crewName = crew.user.name || 'there'
    if (to) {
      after(async () => {
        try {
          const { subject, html } = createDirectMessageEmail(crewName, producerName, input.message)
          await sendEmail({ to, subject, html, replyTo: replyTo || undefined })
        } catch (error) {
          console.error('Direct message email failed:', error)
        }
      })
    }
    return Response.json({ sent: true }, { status: 201 })
  })
  return handler(request, {})
}
