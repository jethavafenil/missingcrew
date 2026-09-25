import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Refreshes the GoTrue session cookies (access/refresh tokens) on every
// matched request so server components and route handlers see a valid session.
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  // Public read APIs are CDN cached and do not need an auth token refresh.
  // Mutation and private subroutes (for example `/apply`) continue below.
  const pathname = request.nextUrl.pathname
  if (request.method === 'GET' && /^\/api\/(?:projects|crew)(?:\/[^/]+)?$/.test(pathname)) {
    return response
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) return response

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        )
      },
    },
  })

  await supabase.auth.getUser()

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$).*)',
  ],
}
