// POST /api/sessions/snapshots/[id]/restore - Restore from a snapshot
import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME, verifySessionCookie } from '@/lib/auth/server-auth';
import { SessionService } from '@/lib/services/session-service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const restoredSnapshot = await SessionService.restoreFromSnapshot(id, user.uid);

    return NextResponse.json({
      success: true,
      snapshot: {
        snapshotData: restoredSnapshot.snapshotData,
        snapshotName: restoredSnapshot.snapshotName,
        createdAt: restoredSnapshot.createdAt,
      },
    });
  } catch (error) {
    console.error('Failed to restore snapshot:', error);
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Snapshot not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to restore snapshot' },
      { status: 500 }
    );
  }
}
