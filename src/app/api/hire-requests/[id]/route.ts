import { after } from 'next/server'
import { z } from 'zod'
import { applicationRepo, hireRequestRepo, notificationRepo } from '@/lib/repo'
import { ApiError } from '@/lib/api/errors'
import { handle } from '@/lib/api/handler'
import { parseBody } from '@/lib/api/body'
import { requireAuth } from '@/lib/api/auth'
import { createHireResponseEmail, sendEmail } from '@/lib/email'
import { respondHireRequestSchema } from '@/lib/hire/schema'

// PUT /api/hire-requests/[id]
//   crew (the invited member): ACCEPTED | DECLINED
//   producer (who sent it):    CANCELLED
export const PUT = handle(async (request, context) => {
  const { session, requester } = await requireAuth()
  const params = (await context.params) ?? {}
  const id = z.string().regex(/^[A-Za-z0-9_-]{1,64}$/).safeParse(String(params.id ?? ''))
  if (!id.success) throw new ApiError(404, 'Hire request not found', 'NOT_FOUND')
  const { status } = await parseBody(request, respondHireRequestSchema)

  const hire = await hireRequestRepo.findById(id.data)
  if (!hire) throw new ApiError(404, 'Hire request not found', 'NOT_FOUND')

  const isCrewOwner = session.user.role === 'CREW' && hire.crew?.userId === session.user.id
  const isProducerOwner = session.user.role === 'EMPLOYER' && hire.employer?.userId === session.user.id
  if (!isCrewOwner && !isProducerOwner) throw new ApiError(404, 'Hire request not found', 'NOT_FOUND')

  if (isCrewOwner && status === 'CANCELLED') throw new ApiError(403, 'Only the producer can cancel a request', 'FORBIDDEN')
  if (isProducerOwner && status !== 'CANCELLED') throw new ApiError(403, 'Only the crew member can accept or decline', 'FORBIDDEN')

  const updated = await hireRequestRepo.respond(hire.id, status)
  if (!updated) throw new ApiError(409, 'This request has already been answered', 'ALREADY_ANSWERED')

  // Accepting confirms the booking: the crew member's application for the project becomes HIRED
  // (created if they never applied), so dashboards, credits and reviews all see one source of truth.
  if (status === 'ACCEPTED') {
    const existingApp = await applicationRepo.findUniqueByProjectAndCrew(hire.projectId, hire.crewId)
    if (existingApp) {
      await applicationRepo.update(existingApp.id, { status: 'HIRED' }, requester)
    } else {
      const app = await applicationRepo.create({ projectId: hire.projectId, crewId: hire.crewId, answers: [], crewNotes: null }, requester)
      await applicationRepo.update(app.id, { status: 'HIRED' }, requester)
    }
  }

  // Tell the producer the answer (crew action only).
  if (isCrewOwner && hire.employer?.userId) {
    const crewName = hire.crew?.user?.name || 'The crew member'
    const projectName = hire.project?.projectName || 'your project'
    const producerName = hire.employer.user?.name || hire.employer.companyName || 'there'
    const accepted = status === 'ACCEPTED'
    try {
      await notificationRepo.create({
        userId: hire.employer.userId,
        type: 'HIRE_RESPONSE',
        title: accepted ? 'Hire request accepted' : 'Hire request declined',
        message: `${crewName} ${accepted ? 'accepted' : 'declined'} your hire request for ${projectName}.`,
        data: { hireRequestId: hire.id, projectId: hire.projectId, status },
      }, requester)
    } catch (error) {
      console.error('Hire response notification failed:', error)
    }
    if (hire.employer.user?.email) {
      const to = hire.employer.user.email
      after(async () => {
        try {
          const { subject, html } = createHireResponseEmail(producerName, crewName, projectName, accepted)
          await sendEmail({ to, subject, html })
        } catch (error) {
          console.error('Hire response email failed:', error)
        }
      })
    }
  }

  return { request: { id: updated.id, status: updated.status } }
})

