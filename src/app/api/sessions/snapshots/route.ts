// POST /api/sessions/snapshots - Create a session snapshot
// GET /api/sessions/snapshots - List session snapshots
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

    const clientSessionId = request.headers.get('X-Session-ID');
    const { snapshotData, snapshotName } = await request.json();

    if (!snapshotData || typeof snapshotData !== 'object') {
      return NextResponse.json(
        { error: 'snapshotData must be a JSON object' },
        { status: 400 }
      );
    }

    const snapshot = await SessionService.createSessionSnapshot(
      user.uid,
      clientSessionId || undefined,
      snapshotData,
      snapshotName
    );

    return NextResponse.json({
      success: true,
      snapshot: {
        id: snapshot.id,
        snapshotName: snapshot.snapshotName,
        createdAt: snapshot.createdAt,
        source: snapshot.source,
      },
    });
  } catch (error) {
    console.error('Failed to create snapshot:', error);
    return NextResponse.json(
      { error: 'Failed to create snapshot' },
      { status: 500 }
    );
  }
}

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

    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '10');
    const snapshots = await SessionService.getUserSessionSnapshots(user.uid, limit);

    return NextResponse.json({
      success: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      snapshots: snapshots.map((snapshot: any) => ({
        id: snapshot.id,
        snapshotName: snapshot.snapshotName,
        source: snapshot.source,
        isManual: snapshot.isManual,
        createdAt: snapshot.createdAt,
        expiresAt: snapshot.expiresAt,
      })),
    });
  } catch (error) {
    console.error('Failed to fetch snapshots:', error);
    return NextResponse.json(
      { error: 'Failed to fetch snapshots' },
      { status: 500 }
    );
  }
}
