// GET /api/sessions - List all active sessions for the current user
import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME, verifySessionCookie } from '@/lib/auth/server-auth';
import { SessionService } from '@/lib/services/session-service';

export async function GET(request: NextRequest) {
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

    const sessions = await SessionService.getUserActiveSessions(user.uid);

    return NextResponse.json({
      success: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sessions: sessions.map((session: any) => ({
        id: session.id,
        sessionId: session.sessionId,
        deviceName: session.deviceName,
        deviceType: session.deviceType,
        ipAddress: session.ipAddress,
        isActive: session.isActive,
        lastActivityAt: session.lastActivityAt,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
      })),
    });
  } catch (error) {
    console.error('Failed to fetch sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}
