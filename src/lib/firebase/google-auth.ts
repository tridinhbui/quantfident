import {
  AuthError,
  GoogleAuthProvider,
  User,
  signInWithPopup,
  signInWithRedirect,
} from 'firebase/auth';
import { auth } from './client';
import { mapFirebaseError } from './auth-errors';

const isFirebaseConfigured = auth !== null;

export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

function getGoogleProvider() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  return provider;
}

export async function signInWithGoogle(): Promise<AuthResult> {
  if (!isFirebaseConfigured || !auth) {
    return { success: false, error: 'Firebase chưa được cấu hình đầy đủ.' };
  }

  const provider = getGoogleProvider();

  try {
    const result = await signInWithPopup(auth, provider);
    return { success: true, user: result.user };
  } catch (error) {
    const authError = error as AuthError;

    if (authError.code === 'auth/popup-blocked') {
      try {
        await signInWithRedirect(auth, provider);
        return {
          success: false,
          error: 'Đang chuyển hướng tới Google để đăng nhập. Vui lòng đợi.',
        };
      } catch (redirectError) {
        return {
          success: false,
          error: mapFirebaseError(redirectError, 'Không thể chuyển hướng đăng nhập Google.'),
        };
      }
    }

    return {
      success: false,
      error: mapFirebaseError(error, 'Không thể đăng nhập với Google.'),
    };
  }
}
