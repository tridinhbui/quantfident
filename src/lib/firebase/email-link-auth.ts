import { AuthError, isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import { auth } from './client';
import { mapFirebaseError } from './auth-errors';
import { clearServerSession, createServerSession } from './session-auth';
import type { AuthResult } from './google-auth';

const isFirebaseConfigured = auth !== null;

export async function completeSignInWithEmailLink(
  email: string,
  emailLink: string
): Promise<AuthResult> {
  if (!isFirebaseConfigured || !auth) {
    return { success: false, error: 'Firebase chưa được cấu hình đầy đủ.' };
  }

  if (!isSignInWithEmailLink(auth, emailLink)) {
    return { success: false, error: 'Liên kết đăng nhập không hợp lệ hoặc đã hết hạn.' };
  }

  try {
    const result = await signInWithEmailLink(auth, email, emailLink);

    const sessionResult = await createServerSession(result.user);
    if (!sessionResult.success) {
      await clearServerSession();
      return {
        success: false,
        error: sessionResult.error || 'Không thể tạo phiên đăng nhập.',
      };
    }

    return { success: true, user: result.user };
  } catch (error) {
    const authError = error as AuthError;
    if (authError.code === 'auth/invalid-action-code') {
      return { success: false, error: 'Liên kết đăng nhập đã hết hạn. Vui lòng gửi lại.' };
    }

    await clearServerSession();
    return {
      success: false,
      error: mapFirebaseError(error, 'Không thể xác thực email. Vui lòng thử lại.'),
    };
  }
}
