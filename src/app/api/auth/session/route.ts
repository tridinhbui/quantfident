import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Mock session check - in real app, this would verify JWT token
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { authenticated: false },
      { status: 401 }
    );
  }

  const token = authHeader.substring(7);

  // Mock token validation
  if (token === 'mock-jwt-token-12345') {
    return NextResponse.json({
      authenticated: true,
      user: {
        id: '123',
        email: 'test@example.com',
        name: 'Test User'
      }
    });
  }

  return NextResponse.json(
    { authenticated: false },
    { status: 401 }
  );
}
