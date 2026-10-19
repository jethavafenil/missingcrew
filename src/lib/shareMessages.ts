// Premade, editable messages. The client will supply the final wording; change the
// templates here and every screen picks them up.

export function buildProfileShareMessage(input: { name: string; role?: string | null; city?: string | null }): string {
  const who = input.role ? `${input.name}, ${input.role}` : input.name
  const where = input.city ? ` from ${input.city}` : ''
  return `Check out ${who}${where} on MissingCrew. Available for work. View the full profile:`
}

// Used by the Hire Now flow (Phase 5): the producer edits this before sending the request.
export function buildHireMessage(input: {
  crewName: string
  producerName: string
  productionHouse?: string | null
  projectName?: string | null
  city?: string | null
  dates?: string | null
  role?: string | null
}): string {
  const from = input.productionHouse ? `${input.producerName} from ${input.productionHouse}` : input.producerName
  const project = input.projectName ? ` on ${input.projectName}` : ''
  const place = input.city ? ` in ${input.city}` : ''
  const when = input.dates ? ` (${input.dates})` : ''
  const role = input.role ? ` as ${input.role}` : ''
  return (
    `Hi ${input.crewName}, I'm ${from}. We're working${project}${place}${when} and I'd love to have you on board${role}. ` +
    `Please let me know if you're available, and we can finalise the details.`
  )
}
