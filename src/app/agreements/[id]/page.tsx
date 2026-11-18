import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { CheckCircle2, ChevronLeft, Mail, MapPin, Phone } from 'lucide-react'
import { getSession } from '@/lib/auth/server'
import { hireRequestRepo } from '@/lib/repo'
import { ensureAgreement } from '@/lib/agreements/service'
import { fillFields } from '@/lib/agreements/build'
import { PrintButton } from '@/components/agreements/PrintButton'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Agreement | MissingCrew', robots: { index: false, follow: false } }

const SAFE_ID = /^[A-Za-z0-9_-]{1,64}$/

const dateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }) + ' IST'

const dateOnly = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' })

// The agreement of an accepted hire: only the producer and the crew member of that hire (and
// admins) can open it. It shows the frozen copy made when the crew member accepted.
export default async function AgreementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!SAFE_ID.test(id)) notFound()

  const session = await getSession()
  if (!session?.user?.id) redirect(`/accounts?tab=signin&returnUrl=${encodeURIComponent(`/agreements/${id}`)}`)

  const hire = await hireRequestRepo.findById(id)
  if (!hire) notFound()

  const isCrew = session.user.role === 'CREW' && hire.crew?.userId === session.user.id
  const isProducer = session.user.role === 'EMPLOYER' && hire.employer?.userId === session.user.id
  if (!isCrew && !isProducer && session.user.role !== 'ADMIN') notFound() // same answer as "does not exist"

  const agreement = await ensureAgreement(hire)
  const backHref = isCrew ? '/dashboard?tab=requests' : session.user.role === 'ADMIN' ? '/admin' : '/employer/dashboard?tab=hire'

  if (!agreement) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-gray-900">No agreement yet</h1>
        <p className="mt-2 text-gray-600">The agreement is created when the crew member accepts the hire request.</p>
        <Link href={backHref} className="mt-6 inline-flex rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
          Back to hire requests
        </Link>
      </div>
    )
  }

  const f = agreement.fields
  const fill = (t: string) => fillFields(t, f)

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 print:max-w-none print:p-0">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href={backHref} className="inline-flex items-center gap-1 text-sm font-medium text-indigo-700 hover:underline">
          <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Back
        </Link>
        <PrintButton />
      </div>

      <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm print:rounded-none print:border-0 print:shadow-none">
        <div className="h-2 bg-gradient-to-r from-[#05529a] via-[#1975ca] to-[#ffab2e]" aria-hidden="true" />

        <div className="p-6 sm:p-10">
          <header className="border-b border-gray-200 pb-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Missing Crew" className="mb-4 h-10 w-auto" />
            <h1 className="text-2xl font-bold leading-tight text-[#05529a] sm:text-3xl">
              {agreement.title}
              <span className="block text-lg font-semibold text-gray-700 sm:text-xl">{fill('{{site.name}}')}</span>
            </h1>
            <dl className="mt-4 grid gap-1 text-sm text-gray-700 sm:grid-cols-[11rem_1fr]">
              <dt className="font-semibold">Agreement ID:</dt>
              <dd className="font-mono">{f['agreement.id']}</dd>
              <dt className="font-semibold">Date of Agreement:</dt>
              <dd>{dateOnly(f['agreement.date'])}</dd>
              <dt className="font-semibold">Platform:</dt>
              <dd>{f['site.domain']}</dd>
            </dl>
            <p className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-emerald-700">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Signed by both parties
            </p>
          </header>

          <p className="mt-6 text-sm leading-relaxed text-gray-700">
            This agreement records the mutual understanding and commitment between the Employer and the Crew Member for the professional engagement
            described below. Both parties agree to the terms and conditions set out in this document.
          </p>

          {agreement.sections.map((section) => (
            <section key={section.title} className="mt-8 break-inside-avoid-page">
              <h2 className="border-b-2 border-[#ffab2e] pb-1 text-base font-bold text-[#05529a] sm:text-lg">{section.title}</h2>
              <div className="mt-3 space-y-3">
                {section.blocks.map((b, i) => {
                  if (b.k === 'h3') return <h3 key={i} className="pt-2 text-sm font-bold uppercase tracking-wide text-gray-600">{b.x}</h3>
                  if (b.k === 'p') return <p key={i} className="text-sm leading-relaxed text-gray-700">{fill(b.x)}</p>
                  if (b.k === 'clause')
                    return (
                      <p key={i} className="flex gap-3 text-sm leading-relaxed text-gray-700">
                        <span className="w-9 shrink-0 font-semibold text-gray-500">{b.n}</span>
                        <span className="whitespace-pre-line">{fill(b.x)}</span>
                      </p>
                    )
                  if (b.k === 'ul')
                    return (
                      <ul key={i} className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-gray-700">
                        {b.items.map((it, j) => (
                          <li key={j}>{fill(it)}</li>
                        ))}
                      </ul>
                    )
                  return (
                    <dl key={i} className="divide-y divide-gray-100 rounded-lg border border-gray-100">
                      {b.items.map((it) => (
                        <div key={it.field} className="grid grid-cols-1 gap-0.5 px-3 py-2 sm:grid-cols-[14rem_1fr] sm:gap-4">
                          <dt className="text-sm text-gray-500">{it.label}</dt>
                          <dd className="whitespace-pre-line break-words text-sm font-medium text-gray-900">{f[it.field] ?? ''}</dd>
                        </div>
                      ))}
                    </dl>
                  )
                })}
              </div>
            </section>
          ))}

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {[
              { title: 'Employer Acceptance', name: f['employer.name'], sig: f['employer.signature'], at: f['employer.signedAt'] },
              { title: 'Crew Member Acceptance', name: f['crew.name'], sig: f['crew.signature'], at: f['crew.signedAt'] },
            ].map((a) => (
              <section key={a.title} className="break-inside-avoid rounded-xl border border-gray-200 p-4">
                <h2 className="text-sm font-bold text-[#05529a]">{a.title}</h2>
                <dl className="mt-2 space-y-2 text-sm">
                  <div>
                    <dt className="text-gray-500">Name</dt>
                    <dd className="font-medium text-gray-900">{a.name}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Digital Signature</dt>
                    <dd className="font-medium italic text-gray-900">{a.sig}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Date and Time</dt>
                    <dd className="font-medium text-gray-900">{dateTime(a.at)}</dd>
                  </div>
                </dl>
              </section>
            ))}
          </div>

          <p className="mt-6 text-sm">
            <span className="font-bold">AGREEMENT STATUS:</span> <span className="font-semibold text-emerald-700">{f['agreement.status']}</span>
          </p>
          <p className="mt-1 text-xs leading-relaxed text-gray-500">
            <span className="font-semibold">Agreement Record:</span> This document is stored with a unique Agreement ID and a record of the version accepted by both parties.
            Version {agreement.version}.
          </p>
        </div>

        <footer className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 bg-[#05529a] px-4 py-3 text-xs text-white">
          <a href={`tel:${f['site.supportPhone']}`} className="inline-flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5" aria-hidden="true" /> {f['site.supportPhone']}
          </a>
          <a href={`mailto:${f['site.supportEmail']}`} className="inline-flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5" aria-hidden="true" /> {f['site.supportEmail']}
          </a>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" /> {f['site.location']}
          </span>
        </footer>
      </article>
    </div>
  )
}
