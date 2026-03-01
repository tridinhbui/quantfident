// POST /api/sessions/share - Share context data across all user sessions
import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME, verifySessionCookie } from '@/lib/auth/server-auth';
import { SessionService } from '@/lib/services/session-service';

export async function POST(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await verifySessionCookie(sessionCookie, true);
    if (!user) {
      return NextResponse.json(
        { error: 'Session expired' },
        { status: 401 }
      );
    }

    const { contextKey, contextValue } = await request.json();

    if (!contextKey || typeof contextKey !== 'string') {
      return NextResponse.json(
        { error: 'contextKey must be a non-empty string' },
        { status: 400 }
      );
    }

    const sessions = await SessionService.shareContextAcrossSessions(
      user.uid,
      contextKey,
      contextValue
    );

    return NextResponse.json({
      success: true,
      sessionsUpdated: sessions.length,
      message: `Context shared to ${sessions.length} active session(s)`,
    });
  } catch (error) {
    console.error('Failed to share context:', error);
    return NextResponse.json(
      { error: 'Failed to share context' },
      { status: 500 }
    );
  }
}
