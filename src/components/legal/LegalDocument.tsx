import Link from 'next/link'

export type LegalBlock = { t: 'title' | 'meta' | 'h' | 'sub' | 'p' | 'li'; x: string }

const slug = (text: string) =>
  'sec-' + (text.match(/^\d+/)?.[0] ?? text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))

// Terms and Privacy Policy share this layout: a title block, a contents list that jumps to each
// numbered section, then the text. Consecutive bullet items are grouped into one list.
export function LegalDocument({ doc, other }: { doc: ReadonlyArray<LegalBlock>; other: { href: string; label: string } }) {
  const titles = doc.filter((b) => b.t === 'title')
  const meta = doc.find((b) => b.t === 'meta')
  const headings = doc.filter((b) => b.t === 'h')

  const body: React.ReactNode[] = []
  let list: string[] = []
  const flush = (key: string) => {
    if (list.length === 0) return
    body.push(
      <ul key={`ul-${key}`} className="my-3 list-disc space-y-1.5 pl-6 text-gray-700">
        {list.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>,
    )
    list = []
  }
  doc.forEach((b, i) => {
    if (b.t === 'title' || b.t === 'meta') return
    if (b.t === 'li') {
      list.push(b.x)
      return
    }
    flush(String(i))
    if (b.t === 'h') {
      body.push(
        <h2 key={i} id={slug(b.x)} className="mt-10 scroll-mt-24 border-b border-gray-200 pb-2 text-xl font-bold text-gray-900 sm:text-2xl">
          {b.x}
        </h2>,
      )
    } else if (b.t === 'sub') {
      body.push(
        <h3 key={i} className="mt-6 text-lg font-semibold text-gray-900">
          {b.x}
        </h3>,
      )
    } else {
      body.push(
        <p key={i} className="my-3 leading-relaxed text-gray-700">
          {b.x}
        </p>,
      )
    }
  })
  flush('end')

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-10 sm:py-16">
        <div className="mx-auto max-w-4xl">
          <header className="mb-6 text-center">
            {titles.map((t, i) => (
              <h1 key={i} className={i === 0 && titles.length > 1 ? 'text-sm font-semibold uppercase tracking-widest text-indigo-600' : 'mt-1 text-2xl font-bold text-gray-900 sm:text-4xl'}>
                {t.x}
              </h1>
            ))}
            {meta && <p className="mx-auto mt-4 max-w-xl whitespace-pre-line text-sm text-gray-600">{meta.x}</p>}
            <p className="mt-3 text-sm">
              <Link href={other.href} className="font-medium text-indigo-700 hover:underline">
                {other.label}
              </Link>
            </p>
          </header>

          <details className="mb-6 rounded-xl border border-indigo-100 bg-white p-4 shadow-sm open:pb-5 md:open:pb-5">
            <summary className="cursor-pointer text-sm font-semibold text-gray-900">Contents ({headings.length} sections)</summary>
            <ol className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
              {headings.map((h) => (
                <li key={h.x}>
                  <a href={`#${slug(h.x)}`} className="text-indigo-700 hover:underline">
                    {h.x}
                  </a>
                </li>
              ))}
            </ol>
          </details>

          <article className="rounded-xl bg-white p-5 shadow-md sm:p-8">{body}</article>
        </div>
      </div>
    </div>
  )
}
