interface RouteLoadingProps {
  label?: string
}

export function RouteLoading({ label = 'Loading page' }: RouteLoadingProps) {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50/30 to-purple-50/30 px-4 py-10" aria-busy="true" aria-label={label}>
      <div className="container mx-auto max-w-6xl animate-pulse space-y-8">
        <div className="space-y-3">
          <div className="h-9 w-2/5 rounded-lg bg-indigo-100" />
          <div className="h-4 w-3/5 rounded bg-gray-200" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="h-56 rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="h-24 rounded-t-2xl bg-gradient-to-r from-indigo-100 to-purple-100" />
              <div className="space-y-3 p-5">
                <div className="h-5 w-3/4 rounded bg-gray-200" />
                <div className="h-4 w-full rounded bg-gray-100" />
                <div className="h-4 w-2/3 rounded bg-gray-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
