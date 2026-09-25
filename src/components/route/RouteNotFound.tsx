import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface RouteNotFoundProps {
  resource: string
  href: string
  linkLabel: string
}

export function RouteNotFound({ resource, href, linkLabel }: RouteNotFoundProps) {
  return (
    <main className="flex min-h-[60vh] items-center justify-center bg-gray-50 px-4 py-12">
      <div className="max-w-lg text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">404</p>
        <h1 className="mt-3 text-3xl font-bold text-gray-900">{resource} not found</h1>
        <p className="mt-3 text-gray-600">It may have been removed, renamed, or the link may be incorrect.</p>
        <Link href={href} className="inline-block">
          <Button className="mt-6">{linkLabel}</Button>
        </Link>
      </div>
    </main>
  )
}
