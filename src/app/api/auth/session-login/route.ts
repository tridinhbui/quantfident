import { NextRequest, NextResponse } from 'next/server';
import { authLimiter, getClientIdentifier } from '@/lib/middleware/rate-limit';
import {
  createSessionCookieFromIdToken,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_MS,
  verifyIdToken,
} from '@/lib/auth/server-auth';

export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIdentifier(request.headers);
    const rateLimitResult = authLimiter.check(clientIp);

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: 'Quá nhiều yêu cầu. Vui lòng thử lại sau 15 phút.',
          retryAfter: rateLimitResult.retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimitResult.retryAfter),
            'X-RateLimit-Remaining': String(rateLimitResult.remaining),
          },
        }
      );
    }

    const { idToken } = await request.json();

    if (!idToken || typeof idToken !== 'string') {
      return NextResponse.json({ error: 'idToken là bắt buộc' }, { status: 400 });
    }

    const user = await verifyIdToken(idToken, true);
    if (!user) {
      return NextResponse.json({ error: 'idToken không hợp lệ hoặc đã hết hạn' }, { status: 401 });
    }

    const sessionCookie = await createSessionCookieFromIdToken(idToken);
    const response = NextResponse.json({
      authenticated: true,
      user,
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: sessionCookie,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: Math.floor(SESSION_MAX_AGE_MS / 1000),
      path: '/',
      domain: process.env.AUTH_COOKIE_DOMAIN || undefined,
    });

    return response;
  } catch (error) {
    console.error('Session login error:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ nội bộ' }, { status: 500 });
  }
}
