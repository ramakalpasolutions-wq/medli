import { NextResponse } from 'next/server'

// Routes that require authentication
const PROTECTED_PREFIXES = [
  '/user',
  '/doctor',
  '/hospital-admin',
  '/lab-admin',
  '/regional',
  '/super-admin',
]

// Routes only for unauthenticated users
const AUTH_ONLY_ROUTES = [
  '/auth/login',
  '/auth/register',
]

export function middleware(request) {
  const { pathname } = request.nextUrl

  // ── Always pass API routes through ──────────────────────────────────
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // ── Get token from cookies ───────────────────────────────────────────
  const token = request.cookies.get('accessToken')?.value

  // ── Unauthenticated user trying to access protected route ────────────
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))
  if (isProtected && !token) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  // ── Authenticated user trying to access login/register ──────────────
  // ✅ This was causing the loop — authenticated users kept hitting /auth/login
  const isAuthRoute = AUTH_ONLY_ROUTES.some((p) => pathname.startsWith(p))
  if (isAuthRoute && token) {
    // Don't redirect here — let the page handle it via useAuth
    // Middleware can't decode JWT without edge-compatible jwt lib
    // The login page already redirects on mount when user is set
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}