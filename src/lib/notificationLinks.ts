// Where a notification should take the user when clicked.

type Role = 'CREW' | 'EMPLOYER' | 'ADMIN' | string | undefined

const SAFE_ID = /^[A-Za-z0-9_-]{1,64}$/

export function notificationLink(type: string, data: unknown, role: Role): string {
  const d = (data && typeof data === 'object' ? data : {}) as Record<string, unknown>
  const projectId = typeof d.projectId === 'string' && SAFE_ID.test(d.projectId) ? d.projectId : null
  const producer = role === 'EMPLOYER'

  switch (type) {
    case 'HIRE_REQUEST':
      return '/dashboard?tab=requests'
    case 'HIRE_RESPONSE':
      return '/employer/dashboard?tab=hire'
    case 'APPLICATION_RECEIVED':
      return '/employer/dashboard?tab=applications'
    case 'APPLICATION_STATUS_CHANGED':
      return '/dashboard?tab=applications'
    case 'PROJECT_POSTED':
      // producer: their own project went live; crew: a new project matching their profile
      if (producer) return '/employer/dashboard?tab=projects'
      return projectId ? `/projects/${projectId}` : '/find-work'
    case 'CONNECTION_REQUEST':
    case 'CONNECTION_ACCEPTED':
      return producer ? '/employer/dashboard' : '/dashboard?tab=network'
    case 'SUBSCRIPTION_EXPIRING':
      return '/subscription-plans'
    case 'MESSAGE_RECEIVED':
    default:
      return producer ? '/employer/dashboard' : '/dashboard'
  }
}
