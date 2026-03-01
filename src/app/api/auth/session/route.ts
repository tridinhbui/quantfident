import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    {
      error: 'Endpoint session mock đã bị loại bỏ. Vui lòng dùng /api/auth/me.',
    },
    { status: 410 }
  );
}
