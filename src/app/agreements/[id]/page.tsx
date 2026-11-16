import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { CheckCircle2, ChevronLeft } from 'lucide-react'
import { getSession } from '@/lib/auth/server'
import { hireRequestRepo } from '@/lib/repo'
import { ensureAgreement } from '@/lib/agreements/service'
import { PrintButton } from '@/components/agreements/PrintButton'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Agreement | MissingCrew', robots: { index: false, follow: false } }

const SAFE_ID = /^[A-Za-z0-9_-]{1,64}$/

const dateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }) + ' IST'

const day = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) : null)

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div className="grid grid-cols-1 gap-0.5 py-2 sm:grid-cols-[11rem_1fr] sm:gap-4">
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className="text-sm font-medium text-gray-900">{value}</dd>
    </div>
  )
}

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

  const p = agreement.project
  const dates = p.startDate && p.endDate && day(p.startDate) !== day(p.endDate) ? `${day(p.startDate)} – ${day(p.endDate)}` : day(p.startDate) ?? day(p.endDate)

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 print:max-w-none print:p-0">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href={backHref} className="inline-flex items-center gap-1 text-sm font-medium text-indigo-700 hover:underline">
          <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Back
        </Link>
        <PrintButton />
      </div>

      <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-10 print:rounded-none print:border-0 print:p-0 print:shadow-none">
        <header className="border-b border-gray-200 pb-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">MissingCrew</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">{agreement.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
            <span>
              Agreement no. <span className="font-mono font-semibold text-gray-900">{agreement.number}</span>
            </span>
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Signed by both parties
            </span>
          </div>
        </header>

        <section className="mt-6">
          <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500">Parties</h2>
          <dl className="mt-1 divide-y divide-gray-100">
            <Row label="Producer" value={agreement.producer.company && agreement.producer.company !== agreement.producer.name ? `${agreement.producer.name} (${agreement.producer.company})` : agreement.producer.name} />
            <Row label="Crew member" value={agreement.crew.name} />
            <Row label="Role" value={agreement.role} />
          </dl>
        </section>

        <section className="mt-6">
          <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500">Project</h2>
          <dl className="mt-1 divide-y divide-gray-100">
            <Row label="Project" value={p.name} />
            <Row label="Project ID" value={p.code} />
            <Row label="Type" value={p.type} />
            <Row label="Production house" value={p.productionHouse} />
            <Row label="Location" value={p.location} />
            <Row label="Shoot dates" value={dates} />
            <Row label="Shoot duration" value={p.duration} />
            <Row label="Project status" value={p.status} />
            <Row label="Budget shown on the project" value={p.budget} />
          </dl>
        </section>

        <section className="mt-6">
          <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500">Terms</h2>
          <ol className="mt-2 space-y-3">
            {agreement.terms.map((t, i) => (
              <li key={t.heading} className="text-sm leading-relaxed text-gray-700">
                <span className="font-semibold text-gray-900">
                  {i + 1}. {t.heading}.
                </span>{' '}
                {t.text}
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-8 grid gap-4 border-t border-gray-200 pt-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Producer</p>
            <p className="mt-1 font-semibold text-gray-900">{agreement.producer.name}</p>
            <p className="text-sm text-gray-600">Sent the agreement: {dateTime(agreement.offeredAt)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Crew member</p>
            <p className="mt-1 font-semibold text-gray-900">{agreement.crew.name}</p>
            <p className="text-sm text-gray-600">Accepted and signed: {dateTime(agreement.signedAt)}</p>
          </div>
        </section>

        <p className="mt-6 text-xs text-gray-400">
          Version {agreement.version}. Created on MissingCrew when the crew member accepted. Keep a copy for your records.
        </p>
      </article>
    </div>
  )
}
