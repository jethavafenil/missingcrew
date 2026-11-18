// Fixed values of the Crew Engagement & Hiring Agreement (the client's wording is in clauses.ts).
// Everything here is copied into each agreement when the crew member accepts, so changing it
// never changes agreements that were already signed. Bump AGREEMENT_VERSION when the wording changes.

export const AGREEMENT_VERSION = '2.0'

export const AGREEMENT_TITLE = 'Crew Engagement & Hiring Agreement'

// Website settings the client's template lists (site.*).
export const SITE = {
  name: 'Missing Crew',
  domain: 'MissingCrew.com',
  governingLaw: 'Govt of India',
  supportPhone: '123-456-7890', // placeholder from the client's file: replace with the real number
  supportEmail: 'support@missingcrew.com',
  location: 'Mohali, Punjab',
} as const

// Shown where the platform does not hold the value yet.
export const NOT_PROVIDED = 'Not provided'
export const TO_BE_AGREED = 'To be agreed in writing between the parties'

export const NATURE_OF_ENGAGEMENT = 'Independent Contractor'
