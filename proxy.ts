import { NextResponse, type NextRequest } from 'next/server'
import { getSessionCookie } from 'better-auth/cookies'

// Optimistic check only (is there a session cookie?): pages and server actions do the real
// check with requireLeader()/requireAdmin() in lib/dal.ts.
export function proxy(request: NextRequest) {
  const isLogin = request.nextUrl.pathname.startsWith('/tabu/login')
  if (!isLogin && !getSessionCookie(request)) {
    return NextResponse.redirect(new URL('/tabu/login/', request.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/tabu/:path*'],
}
