import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Mock validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email và mật khẩu là bắt buộc' },
        { status: 400 }
      );
    }

    // Mock authentication
    if (email === 'test@example.com' && password === 'password123') {
      // Mock successful login
      return NextResponse.json({
        message: 'Đăng nhập thành công',
        user: {
          id: '123',
          email: 'test@example.com',
          name: 'Test User'
        },
        // Mock session token
        token: 'mock-jwt-token-12345'
      });
    }

    // Mock failed login
    return NextResponse.json(
      { error: 'Thông tin đăng nhập không hợp lệ' },
      { status: 401 }
    );
  } catch {
    return NextResponse.json(
      { error: 'Lỗi máy chủ nội bộ' },
      { status: 500 }
    );
  }
}
