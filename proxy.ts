import { NextResponse, type NextRequest } from 'next/server'
import { getSessionCookie } from 'better-auth/cookies'
import { LEADER_HINT_COOKIE } from '@/lib/leader-hint'

// Optimistic check only (is there a session cookie?): pages and server actions do the real
// check with requireLeader()/requireAdmin() in lib/dal.ts.
export function proxy(request: NextRequest) {
  const isLogin = request.nextUrl.pathname.startsWith('/tabu/login')
  const loggedIn = !!getSessionCookie(request)
  const response =
    !isLogin && !loggedIn ? NextResponse.redirect(new URL('/tabu/login/', request.url)) : NextResponse.next()

  // Keep the hint for the public navbar in step with the session cookie
  const hint = request.cookies.has(LEADER_HINT_COOKIE)
  if (loggedIn && !hint) {
    response.cookies.set(LEADER_HINT_COOKIE, '1', {
      path: '/',
      maxAge: 30 * 24 * 3600,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })
  } else if (!loggedIn && hint) {
    response.cookies.delete(LEADER_HINT_COOKIE)
  }
  return response
}

export const config = {
  matcher: ['/tabu/:path*'],
}
