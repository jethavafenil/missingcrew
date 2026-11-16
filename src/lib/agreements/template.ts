// Wording of the engagement agreement. It is copied into every agreement when the crew member
// accepts, so changing the text here never changes agreements that were already signed.
// DRAFT: replace with the client's final wording (bump AGREEMENT_VERSION when you do).

export const AGREEMENT_VERSION = '1.0'

export const AGREEMENT_TITLE = 'Engagement Agreement'

export const AGREEMENT_TERMS: readonly { heading: string; text: string }[] = [
  {
    heading: 'Engagement',
    text: 'The Producer engages the Crew Member for the role, project, dates and location named in this agreement, and the Crew Member agrees to take part.',
  },
  {
    heading: 'Signing',
    text: "The Producer sent this engagement through MissingCrew and the Crew Member accepted it there. Doing so is each party's electronic signature, and the dates and times of both actions are recorded below.",
  },
  {
    heading: 'Fees and payment',
    text: 'The fee, the payment schedule and any expenses are as agreed between the Producer and the Crew Member. MissingCrew does not take or hold payments.',
  },
  {
    heading: 'Changes',
    text: 'A change to the dates, location or scope of work needs both parties to agree. A message through MissingCrew or an email that both can see is enough.',
  },
  {
    heading: 'Cancellation',
    text: 'If either party cannot go ahead, they will tell the other as early as possible and in writing.',
  },
  {
    heading: 'Conduct and confidentiality',
    text: 'Both parties will act professionally and keep the details of the project confidential unless the project owner says otherwise. Credits and rights are as agreed between them.',
  },
  {
    heading: 'About MissingCrew',
    text: 'MissingCrew connects the parties and keeps this record. It is not a party to this agreement. This is a confirmation of the engagement and is not legal advice. The parties may also sign a separate contract.',
  },
]
