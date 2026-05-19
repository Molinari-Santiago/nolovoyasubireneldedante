import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Route protection middleware.
 * Reads the Zustand persisted auth state from cookie.
 * If not authenticated, redirects to /login.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect /dashboard/* routes
  if (!pathname.startsWith('/dashboard')) {
    return NextResponse.next();
  }

  // Check for Zustand persisted auth (stored as cookie by zustand persist middleware)
  const authCookie = request.cookies.get('noctua-auth');

  if (authCookie) {
    try {
      const authData = JSON.parse(authCookie.value);
      if (authData?.state?.isAuthenticated) {
        return NextResponse.next();
      }
    } catch {
      // Invalid cookie — fall through to redirect
    }
  }

  // No valid session — redirect to login
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('from', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
