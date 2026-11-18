import type { Metadata } from 'next'
import { LegalDocument } from '@/components/legal/LegalDocument'
import { PRIVACY_DOC } from '@/lib/legal/privacy'

export const metadata: Metadata = {
  title: 'Privacy Policy | MissingCrew',
  description: 'How MissingCrew collects, uses and protects personal information.',
}

export default function PrivacyPage() {
  return <LegalDocument doc={PRIVACY_DOC} other={{ href: '/terms', label: 'Read the Terms and Conditions' }} />
}
