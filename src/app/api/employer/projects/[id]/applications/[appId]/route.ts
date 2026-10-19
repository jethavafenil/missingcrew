import { z } from 'zod'
import {
  applicationRepo,
  employerProfileRepo,
  notificationRepo,
  projectRepo,
} from '@/lib/repo'
import { ApiError } from '@/lib/api/errors'
import { handle } from '@/lib/api/handler'
import { parseBody } from '@/lib/api/body'
import { requireRole } from '@/lib/api/auth'
import { createShortlistEmail, sendEmail } from '@/lib/email'

// PUT /api/employer/projects/[id]/applications/[appId]
// The project's employer moves an applicant between PENDING / SHORTLISTED /
// REJECTED. (HIRED is reserved for the hire flow.) Shortlisting notifies the
// crew member in-app and by email.
const bodySchema = z.object({
  status: z.enum(['PENDING', 'SHORTLISTED', 'REJECTED']),
})

export const PUT = handle(async (request, context) => {
  const { session, requester } = await requireRole('EMPLOYER')
  const params = (await context.params) ?? {}
  const projectId = String(params.id ?? '')
  const appId = String(params.appId ?? '')
  const { status } = await parseBody(request, bodySchema)

  // Ownership: the project must belong to this employer, and the application
  // must belong to that project. Both failures look like "not found".
  const employerProfile = await employerProfileRepo.findByUserId(session.user.id, requester)
  const project = employerProfile
    ? await projectRepo.findByIdAndEmployerId(projectId, employerProfile.id)
    : null
  if (!employerProfile || !project) throw new ApiError(404, 'Project not found', 'NOT_FOUND')

  const application = await applicationRepo.findById(appId)
  if (!application || application.projectId !== project.id) {
    throw new ApiError(404, 'Application not found', 'NOT_FOUND')
  }
  if (application.status === 'HIRED') {
    throw new ApiError(409, 'This applicant has already been hired', 'ALREADY_HIRED')
  }

  const previousStatus = application.status
  const updated = await applicationRepo.update(application.id, { status }, requester)
  if (!updated) throw new ApiError(404, 'Application not found', 'NOT_FOUND')

  // Notify only on the transition into SHORTLISTED (never on repeat clicks).
  if (status === 'SHORTLISTED' && previousStatus !== 'SHORTLISTED') {
    const crewUser = application.crew?.user
    const employerName = employerProfile.companyName || session.user.name || 'A producer'
    if (crewUser?.id) {
      try {
        await notificationRepo.create({
          userId: crewUser.id,
          type: 'APPLICATION_STATUS_CHANGED',
          title: "You've been shortlisted!",
          message: `${employerName} shortlisted you for ${project.projectName}.`,
          data: { applicationId: application.id, projectId: project.id, status: 'SHORTLISTED' },
        }, requester)
      } catch (error) {
        console.error('Shortlist notification failed:', error)
      }
      if (crewUser.email) {
        try {
          const { subject, html } = createShortlistEmail(crewUser.name || 'there', employerName, project.projectName)
          await sendEmail({ to: crewUser.email, subject, html })
        } catch (error) {
          console.error('Shortlist email failed:', error)
        }
      }
    }
  }

  return { application: { id: updated.id, status: updated.status } }
})
