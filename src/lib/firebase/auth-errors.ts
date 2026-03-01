import { AuthError } from 'firebase/auth';

export function mapFirebaseError(error: unknown, fallback: string): string {
  const authError = error as AuthError;

  switch (authError?.code) {
    case 'auth/popup-closed-by-user':
      return 'Bạn đã đóng cửa sổ đăng nhập Google trước khi hoàn tất.';
    case 'auth/popup-blocked':
      return 'Trình duyệt đã chặn popup. Đang chuyển sang đăng nhập redirect...';
    case 'auth/network-request-failed':
      return 'Lỗi kết nối mạng tới Firebase. Vui lòng kiểm tra mạng và thử lại.';
    case 'auth/too-many-requests':
      return 'Bạn thao tác quá nhanh. Vui lòng thử lại sau ít phút.';
    default:
      console.error('Firebase Auth Error:', error);
      return fallback;
  }
}
