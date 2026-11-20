'use client'

import { OFFER_FIELDS, OFFER_GROUPS, offerRows, type OfferKey, type OfferTerms } from '@/lib/hire/offer'

const field =
  'block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-base text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500'

interface Props {
  value: OfferTerms
  onChange: (next: OfferTerms) => void
  idPrefix: string
  // HIRE ALL: the same terms go to everyone picked
  forEveryone?: boolean
}

// Optional offer details the producer can fill in. Whatever is left empty is written into the
// agreement as "to be agreed in writing". Collapsed by default so a quick hire stays quick.
export function OfferTermsFields({ value, onChange, idPrefix, forEveryone }: Props) {
  const filled = Object.values(value).filter((v) => v && v.trim()).length
  const set = (key: OfferKey, v: string) => onChange({ ...value, [key]: v })

  return (
    <details className="rounded-lg border border-gray-200 bg-gray-50 p-3 open:bg-white" open={filled > 0}>
      <summary className="cursor-pointer select-none text-sm font-semibold text-gray-800">
        Offer details for the agreement <span className="font-normal text-gray-500">(optional{filled > 0 ? `, ${filled} filled in` : ''})</span>
      </summary>
      <p className="mt-2 text-xs text-gray-500">
        {forEveryone ? 'These details go to everyone you are hiring. ' : ''}
        They appear in the agreement. Anything you leave empty is written as &ldquo;to be agreed in writing between the parties&rdquo;.
      </p>
      <div className="mt-3 space-y-5">
        {OFFER_GROUPS.map((group) => (
          <fieldset key={group} className="space-y-3">
            <legend className="text-xs font-bold uppercase tracking-wide text-gray-500">{group}</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {OFFER_FIELDS.filter((f) => f.group === group).map((f) => {
                const id = `${idPrefix}-${f.key}`
                const wide = f.kind === 'textarea'
                return (
                  <div key={f.key} className={wide ? 'sm:col-span-2' : ''}>
                    <label htmlFor={id} className="mb-1 block text-sm font-medium text-gray-700">
                      {f.label}
                    </label>
                    {f.kind === 'select' ? (
                      <select id={id} value={value[f.key] ?? ''} onChange={(e) => set(f.key, e.target.value)} className={field}>
                        <option value="">Select</option>
                        {f.options?.map((o) => (
                          <option key={o} value={o}>{o}</option>
                        ))}
                      </select>
                    ) : f.kind === 'textarea' ? (
                      <textarea id={id} value={value[f.key] ?? ''} onChange={(e) => set(f.key, e.target.value)} rows={3} maxLength={f.max} placeholder={f.placeholder} className={`${field} resize-y`} />
                    ) : (
                      <input id={id} type={f.kind === 'date' ? 'date' : 'text'} value={value[f.key] ?? ''} onChange={(e) => set(f.key, e.target.value)} maxLength={f.max} placeholder={f.placeholder} className={field} />
                    )}
                  </div>
                )
              })}
            </div>
          </fieldset>
        ))}
      </div>
    </details>
  )
}

// What the offer says, grouped, for the confirmation step and for the crew member.
export function OfferSummary({ offer, compact }: { offer: unknown; compact?: boolean }) {
  const rows = offerRows(offer)
  if (rows.length === 0) return null
  return (
    <div className={compact ? 'text-sm' : 'rounded-lg border border-gray-200 bg-white p-3 text-sm'}>
      <p className="mb-1.5 font-semibold text-gray-800">Offer details</p>
      <dl className="grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-[11rem_1fr]">
        {rows.map((r) => (
          <div key={r.key} className="contents">
            <dt className="text-gray-500">{r.label}</dt>
            <dd className="whitespace-pre-line break-words font-medium text-gray-900">{r.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
