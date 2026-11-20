import { describe, expect, it } from 'vitest'
import { cleanOffer, offerError, offerRows, offerSchema } from './offer'

describe('cleanOffer', () => {
  it('keeps known fields, trims, and drops empty and unknown ones', () => {
    expect(cleanOffer({ totalFee: '  ₹60,000 ', paymentBasis: 'Per Day', evil: 'x', schedule: '   ' })).toEqual({ totalFee: '₹60,000', paymentBasis: 'Per Day' })
  })
  it('returns null when nothing is filled in', () => {
    expect(cleanOffer({})).toBeNull()
    expect(cleanOffer({ totalFee: ' ' })).toBeNull()
    expect(cleanOffer(null)).toBeNull()
    expect(cleanOffer('x')).toBeNull()
  })
  it('drops values outside the lists and bad dates', () => {
    expect(cleanOffer({ engagementType: 'Forever', startDate: '1st Dec', workArrangement: 'Hybrid' })).toEqual({ workArrangement: 'Hybrid' })
  })
  it('limits length, removes control characters, keeps new lines in long fields only', () => {
    const o = cleanOffer({ totalFee: 'x'.repeat(500), responsibilities: 'a\nb\u0007c', schedule: 'a\n b' })
    expect(o?.totalFee?.length).toBe(100)
    expect(o?.responsibilities).toBe('a\nbc')
    expect(o?.schedule).toBe('a b')
  })
})

describe('offerError', () => {
  it('names a field with an invalid value', () => {
    expect(offerError({ paymentMethod: 'Cheque' })).toBe('Payment method is not valid')
    expect(offerError({ startDate: 'tomorrow' })).toBe('Start date is not valid')
  })
  it('rejects an end date before the start date', () => {
    expect(offerError({ startDate: '2026-12-10', endDate: '2026-12-01' })).toBe('The end date cannot be before the start date')
    expect(offerError({ startDate: '2026-12-01', endDate: '2026-12-10' })).toBeNull()
  })
  it('accepts empty input', () => {
    expect(offerError(undefined)).toBeNull()
    expect(offerError({})).toBeNull()
  })
})

describe('offerSchema', () => {
  it('stores the cleaned offer, or null', () => {
    const ok = offerSchema.safeParse({ totalFee: ' ₹1 ', junk: 1 })
    expect(ok.success && ok.data).toEqual({ totalFee: '₹1' })
    const empty = offerSchema.safeParse({})
    expect(empty.success && empty.data).toBeNull()
    expect(offerSchema.safeParse({ engagementType: 'No' }).success).toBe(false)
  })
})

describe('offerRows', () => {
  it('lists filled fields in form order with readable dates', () => {
    const rows = offerRows({ totalFee: '₹5', startDate: '2026-12-01' })
    expect(rows.map((r) => r.key)).toEqual(['startDate', 'totalFee'])
    expect(rows[0].value).toBe('1 December 2026')
  })
  it('is empty without an offer', () => {
    expect(offerRows(null)).toEqual([])
  })
})
