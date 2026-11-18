import { describe, expect, it } from 'vitest'
import { createApplicationEmail, createShortlistEmail, createApplicationsMilestoneEmail, escapeHtml } from '@/lib/email'

describe('email templates', () => {
  it('escapes user-controlled text', () => {
    expect(escapeHtml('<script>alert("x")</script> & \'q\'')).toBe('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; &#39;q&#39;')
    const { html } = createApplicationEmail('e@x.com', '<b>Evil</b>', '<i>Proj</i>', 'c@x.com')
    expect(html).not.toContain('<b>Evil</b>')
    expect(html).toContain('&lt;b&gt;Evil&lt;/b&gt;')
  })

  it('shortlist email names the producer and project and links to applications', () => {
    const { subject, html } = createShortlistEmail('Asha', 'ABC Studios', 'Neon Nights')
    expect(subject).toContain('Neon Nights')
    expect(html).toContain('ABC Studios')
    expect(html).toContain('/dashboard?tab=applications')
  })

  it('milestone email states the count', () => {
    const { subject } = createApplicationsMilestoneEmail('Ravi', 'Neon Nights', 5)
    expect(subject).toContain('5 crew members')
  })
})

describe('application email contact details', () => {
  it('lists the crew member contact details and escapes them', () => {
    const { html } = createApplicationEmail('e@x.com', 'Ravi', 'Neon', 'r@x.com', {
      phone: '9876543210',
      whatsapp: '+919123456789',
      city: 'Pune <b>',
      roles: ['Actor', 'Editor'],
      profileUrl: 'https://missingcrew.example/crew/ravi',
    })
    expect(html).toContain('+91 98765 43210')
    expect(html).toContain('+91 91234 56789')
    expect(html).toContain('Actor, Editor')
    expect(html).toContain('Pune &lt;b&gt;')
    expect(html).toContain('https://missingcrew.example/crew/ravi')
    expect(html).toContain('mailto:r@x.com')
  })
  it('still works with only an email', () => {
    const { html } = createApplicationEmail('e@x.com', 'Ravi', 'Neon', 'r@x.com')
    expect(html).toContain('r@x.com')
    expect(html).not.toContain('Phone:')
  })
})
