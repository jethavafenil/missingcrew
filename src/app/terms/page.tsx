import type { Metadata } from 'next'
import { LegalDocument } from '@/components/legal/LegalDocument'
import { TERMS_DOC } from '@/lib/legal/terms'

export const metadata: Metadata = {
  title: 'Terms and Conditions | MissingCrew',
  description: 'Terms and Conditions of use of MissingCrew.',
}

export default function TermsPage() {
  return <LegalDocument doc={TERMS_DOC} other={{ href: '/privacy', label: 'Read the Privacy Policy' }} />
}
