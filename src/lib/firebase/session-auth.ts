import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './client';
import { mapFirebaseError } from './auth-errors';

const isFirebaseConfigured = auth !== null;

export interface SessionResult {
  success: boolean;
  retryable: boolean;
  error?: string;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
  role: 'admin' | 'user';
  photoURL?: string;
}

export async function createServerSession(user: User): Promise<SessionResult> {
  try {
    const idToken = await user.getIdToken(true);

    const response = await fetch('/api/auth/session-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });

    if (response.ok) {
      return { success: true, retryable: false };
    }

    const data = await response.json().catch(() => ({ error: 'Không thể tạo phiên đăng nhập.' }));
    const retryable = response.status >= 500 || response.status === 429;

    return {
      success: false,
      retryable,
      error: data.error || 'Không thể tạo phiên đăng nhập.',
    };
  } catch (error) {
    return {
      success: false,
      retryable: true,
      error: mapFirebaseError(error, 'Lỗi mạng khi đồng bộ phiên đăng nhập với server.'),
    };
  }
}

export async function clearServerSession(): Promise<void> {
  try {
    await fetch('/api/auth/session-logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.warn('Unable to clear server session:', error);
  }

  if (isFirebaseConfigured && auth?.currentUser) {
    await signOut(auth);
  }
}

export async function getCurrentSessionProfile(): Promise<UserProfile | null> {
  try {
    const response = await fetch('/api/auth/me', { method: 'GET' });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.user as UserProfile;
  } catch (error) {
    console.warn('Unable to fetch current session profile:', error);
    return null;
  }
}

export interface SignOutResult {
  success: boolean;
  error?: string;
}

export async function signOutUser(): Promise<SignOutResult> {
  if (!isFirebaseConfigured || !auth) {
    return { success: false, error: 'Firebase chưa được cấu hình' };
  }

  try {
    await clearServerSession();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: mapFirebaseError(error, 'Không thể đăng xuất.'),
    };
  }
}

export function onAuthStateChange(callback: (user: User | null) => void) {
  if (!isFirebaseConfigured || !auth) {
    console.warn('Firebase not configured, auth state listener disabled');
    return () => {};
  }

  return onAuthStateChanged(auth, callback);
}

export function getCurrentUser(): User | null {
  return isFirebaseConfigured && auth ? auth.currentUser : null;
}

export function isAuthenticated(): boolean {
  return isFirebaseConfigured && auth ? auth.currentUser !== null : false;
}
