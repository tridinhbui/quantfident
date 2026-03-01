// POST /api/sessions/context - Update session context data
// GET /api/sessions/context - Get session context data
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

    // Get session ID from header (client sends this)
    const clientSessionId = request.headers.get('X-Session-ID');
    if (!clientSessionId) {
      return NextResponse.json(
        { error: 'X-Session-ID header is required' },
        { status: 400 }
      );
    }

    const { contextData } = await request.json();

    if (!contextData || typeof contextData !== 'object') {
      return NextResponse.json(
        { error: 'contextData must be a JSON object' },
        { status: 400 }
      );
    }

    const context = await SessionService.updateSessionContext(
      clientSessionId,
      contextData
    );

    return NextResponse.json({
      success: true,
      context: {
        id: context.id,
        contextData: context.contextData,
        updatedAt: context.updatedAt,
      },
    });
  } catch (error) {
    console.error('Failed to update session context:', error);
    return NextResponse.json(
      { error: 'Failed to update session context' },
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

    // Get session ID from header
    const clientSessionId = request.headers.get('X-Session-ID');
    if (!clientSessionId) {
      return NextResponse.json(
        { error: 'X-Session-ID header is required' },
        { status: 400 }
      );
    }

    const context = await SessionService.getSessionContext(clientSessionId);

    if (!context) {
      return NextResponse.json(
        { error: 'Context not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      context: {
        id: context.id,
        contextData: context.contextData,
        updatedAt: context.updatedAt,
        createdAt: context.createdAt,
      },
    });
  } catch (error) {
    console.error('Failed to fetch session context:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session context' },
      { status: 500 }
    );
  }
}
