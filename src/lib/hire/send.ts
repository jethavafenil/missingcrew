import 'server-only'
import { after } from 'next/server'
import {
  crewProfileRepo,
  hireRequestRepo,
  notificationRepo,
  type EmployerProfileRow,
  type ProjectRow,
  type Requester,
} from '@/lib/repo'
import { ApiError } from '@/lib/api/errors'
import { createHireRequestEmail, sendEmail } from '@/lib/email'
import { personalise } from '@/lib/hire/schema'

interface SendInput {
  employer: EmployerProfileRow
  project: ProjectRow
  producerUserId: string
  producerName: string
  requester: Requester
  crewId: string
  role?: string
  message: string
}

// Creates (or re-opens a cancelled) hire request, notifies the crew member in-app and,
// after the response, by email. Throws ApiError for every "cannot hire" case so callers
// can show or collect the reason. Shared by the single and the HIRE ALL endpoints.
export async function sendHireRequest(input: SendInput) {
  const { employer, project, requester } = input
  const crew = await crewProfileRepo.findByIdWithUser(input.crewId)
  if (!crew) throw new ApiError(404, 'Crew member not found', 'NOT_FOUND')
  if (crew.userId === input.producerUserId) throw new ApiError(400, 'You cannot hire yourself', 'INVALID')

  // "{name}" in the message becomes this person's first name (HIRE ALL sends one text to many)
  const message = personalise(input.message, crew.user?.name)

  const existing = await hireRequestRepo.findByProjectAndCrew(project.id, crew.id)
  let created
  if (existing) {
    if (existing.status === 'CANCELLED') {
      created = await hireRequestRepo.reopenCancelled(existing.id, { role: input.role, message })
    }
    if (!created) {
      const why =
        existing.status === 'ACCEPTED' ? 'This crew member is already hired for this project'
        : existing.status === 'DECLINED' ? 'This crew member declined this project'
        : 'A hire request is already pending for this crew member and project'
      throw new ApiError(409, why, 'DUPLICATE_REQUEST')
    }
  } else {
    try {
      created = await hireRequestRepo.create({ employerId: employer.id, crewId: crew.id, projectId: project.id, role: input.role, message })
    } catch (err) {
      // Unique (project, crew) lost a race with a parallel request.
      if (err instanceof Error && /duplicate key|23505/i.test(err.message)) {
        throw new ApiError(409, 'A hire request is already pending for this crew member and project', 'DUPLICATE_REQUEST')
      }
      throw err
    }
  }

  try {
    await notificationRepo.create({
      userId: crew.userId,
      type: 'HIRE_REQUEST',
      title: 'New hire request',
      message: `${input.producerName} wants to hire you${input.role ? ` as ${input.role}` : ''} for ${project.projectName}.`,
      data: { hireRequestId: created.id, projectId: project.id },
    }, requester)
  } catch (error) {
    console.error('Hire request notification failed:', error)
  }

  if (crew.user?.email) {
    const to = crew.user.email
    const crewName = crew.user.name || 'there'
    const { producerName } = input
    const projectName = project.projectName
    const role = input.role ?? null
    const text = message
    // Email is sent after the response (SMTP can take seconds); failures are only logged.
    after(async () => {
      try {
        const { subject, html } = createHireRequestEmail(crewName, producerName, projectName, role, text)
        await sendEmail({ to, subject, html })
      } catch (error) {
        console.error('Hire request email failed:', error)
      }
    })
  }

  return created
}
