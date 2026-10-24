import { describe, it, expect } from 'vitest'
import { notificationLink } from './notificationLinks'

describe('notificationLink', () => {
  it('sends hire requests to the crew requests tab and answers to the producer hire tab', () => {
    expect(notificationLink('HIRE_REQUEST', null, 'CREW')).toBe('/dashboard?tab=requests')
    expect(notificationLink('HIRE_RESPONSE', null, 'EMPLOYER')).toBe('/employer/dashboard?tab=hire')
  })
  it('sends applications to the right side', () => {
    expect(notificationLink('APPLICATION_RECEIVED', { projectId: 'p1' }, 'EMPLOYER')).toBe('/employer/dashboard?tab=applications')
    expect(notificationLink('APPLICATION_STATUS_CHANGED', null, 'CREW')).toBe('/dashboard?tab=applications')
  })
  it('opens the matched project for crew and the projects tab for the producer', () => {
    expect(notificationLink('PROJECT_POSTED', { projectId: 'abc-1' }, 'CREW')).toBe('/projects/abc-1')
    expect(notificationLink('PROJECT_POSTED', { projectId: 'abc-1' }, 'EMPLOYER')).toBe('/employer/dashboard?tab=projects')
  })
  it('never builds a link from an unsafe id', () => {
    expect(notificationLink('PROJECT_POSTED', { projectId: '../x?y' }, 'CREW')).toBe('/find-work')
    expect(notificationLink('PROJECT_POSTED', 'junk', 'CREW')).toBe('/find-work')
  })
  it('falls back to the role dashboard', () => {
    expect(notificationLink('MESSAGE_RECEIVED', null, 'CREW')).toBe('/dashboard')
    expect(notificationLink('UNKNOWN', null, 'EMPLOYER')).toBe('/employer/dashboard')
  })
})
