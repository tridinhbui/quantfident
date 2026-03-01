import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      error:
        'Endpoint đăng ký mock đã bị loại bỏ. Vui lòng dùng Firebase Google Sign-In và /api/auth/session-login.',
    },
    { status: 410 }
  );
}
