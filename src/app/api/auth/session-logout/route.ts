import { NextRequest, NextResponse } from 'next/server';
import {
  revokeUserSessions,
  SESSION_COOKIE_NAME,
  verifySessionCookie,
} from '@/lib/auth/server-auth';

export async function POST(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;

    if (sessionCookie) {
      const user = await verifySessionCookie(sessionCookie, false);
      if (user) {
        await revokeUserSessions(user.uid);
      }
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
      domain: process.env.AUTH_COOKIE_DOMAIN || undefined,
    });

    return response;
  } catch (error) {
    console.error('Session logout error:', error);

    const response = NextResponse.json({ success: true });
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
      domain: process.env.AUTH_COOKIE_DOMAIN || undefined,
    });
    return response;
  }
}
