import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySessionCookie, SESSION_COOKIE_NAME } from '@/lib/auth/server-auth';

export async function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  // No cookie → redirect to home with auth prompt
  if (!sessionCookie) {
    const redirectUrl = new URL('/?auth=1', request.url);
    return NextResponse.redirect(redirectUrl);
  }

  // Validate cookie validity (not just presence)
  // This catches expired or tampered cookies early
  try {
    const user = await verifySessionCookie(sessionCookie, true);
    
    // Invalid or expired session
    if (!user) {
      // Clear the invalid cookie and redirect
      const redirectUrl = new URL('/?auth=1&session_expired=1', request.url);
      const response = NextResponse.redirect(redirectUrl);
      response.cookies.delete(SESSION_COOKIE_NAME);
      return response;
    }

    // Check admin-only routes
    if (request.nextUrl.pathname.startsWith('/admin')) {
      if (user.role !== 'admin') {
        // Non-admin trying to access admin routes → redirect to home
        return NextResponse.redirect(new URL('/', request.url));
      }
    }

    // Continue to requested page
    return NextResponse.next();
  } catch (error) {
    // Validation failed (e.g., decoding error, revoked token, DB error)
    console.warn('Middleware session validation failed:', error);
    
    // Clear the invalid cookie and redirect
    const redirectUrl = new URL('/?auth=1&session_invalid=1', request.url);
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  }
}

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*'],
};
