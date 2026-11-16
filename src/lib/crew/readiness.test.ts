import { describe, it, expect } from 'vitest'
import { coreGaps, fullGaps, gapMessage } from './readiness'

const complete = { photo: 'data:image/png;base64,xx', phone: '9876543210', city: 'Mumbai, Maharashtra, India', primaryRoles: ['Editor'], completed: true }

describe('coreGaps', () => {
  it('is empty for photo + 10-digit phone + city', () => {
    expect(coreGaps(complete)).toEqual([])
  })
  it('lists every missing item', () => {
    expect(coreGaps({})).toEqual(['photo', 'phone', 'city'])
    expect(coreGaps({ ...complete, photo: '  ' })).toEqual(['photo'])
    expect(coreGaps({ ...complete, city: '' })).toEqual(['city'])
  })
  it('rejects numbers that are not 10 digits but accepts old +91 numbers', () => {
    expect(coreGaps({ ...complete, phone: '98765' })).toEqual(['phone'])
    expect(coreGaps({ ...complete, phone: '+1 202 555 0143' })).toEqual(['phone'])
    expect(coreGaps({ ...complete, phone: '+919876543210' })).toEqual([])
    expect(coreGaps({ ...complete, phone: null })).toEqual(['phone'])
  })
})

describe('fullGaps', () => {
  it('needs core + a role + finished steps', () => {
    expect(fullGaps(complete)).toEqual([])
    expect(fullGaps({ ...complete, primaryRoles: [] })).toEqual(['roles'])
    expect(fullGaps({ ...complete, completed: false })).toEqual(['steps'])
    expect(fullGaps({ photo: '', phone: '', city: '', primaryRoles: null, completed: null })).toEqual(['photo', 'phone', 'city', 'roles', 'steps'])
  })
  it('writes a readable message', () => {
    expect(gapMessage(['photo', 'phone'])).toBe('add a profile photo, add your 10-digit mobile number')
  })
})
