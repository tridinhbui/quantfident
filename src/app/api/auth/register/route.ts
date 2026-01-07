import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    // Mock validation
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Thiếu thông tin bắt buộc' },
        { status: 400 }
      );
    }

    // Mock email uniqueness check
    if (email === 'existing@example.com') {
      return NextResponse.json(
        { error: 'Email đã được sử dụng' },
        { status: 409 }
      );
    }

    // Mock successful registration
    return NextResponse.json(
      {
        message: 'Đăng ký thành công',
        user: { id: '123', email, name }
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: 'Lỗi máy chủ nội bộ' },
      { status: 500 }
    );
  }
}
