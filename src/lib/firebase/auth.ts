// Firebase Auth helpers and facade
// Client-side authentication operations only

import {
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  signOut,
  onAuthStateChanged,
  User,
  AuthError
} from 'firebase/auth';
import { auth, db } from './client';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

// Check if Firebase is properly configured
const isFirebaseConfigured = auth !== null;

// Auth result types
export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

// User profile data
export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
  role: 'admin' | 'user';
  createdAt?: Date;
  lastLoginAt?: Date;
  totalLogins?: number;
}

// Email domain validation
const ALLOWED_DOMAINS = [
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
  'company.com', 'university.edu'
];

function isValidEmailFormat(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidEmailDomain(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  return domain ? ALLOWED_DOMAINS.includes(domain) : false;
}

// Convert Firebase User to our UserProfile
export function toUserProfile(user: User): UserProfile {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    emailVerified: user.emailVerified,
    role: 'user', // Default role
    createdAt: new Date(),
    lastLoginAt: new Date(),
    totalLogins: 1,
  };
}

// Auth error handler
function handleAuthError(error: AuthError): string {
  switch (error.code) {
    case 'auth/invalid-email':
      return 'Email không hợp lệ';
    case 'auth/user-disabled':
      return 'Tài khoản đã bị vô hiệu hóa';
    case 'auth/expired-action-code':
      return 'Link đăng nhập đã hết hạn';
    case 'auth/invalid-action-code':
      return 'Link đăng nhập không hợp lệ';
    case 'auth/network-request-failed':
      return 'Lỗi kết nối mạng';
    default:
      console.error('Firebase Auth Error:', error);
      return 'Đã xảy ra lỗi không xác định';
  }
}

// Send sign-in email
export async function sendSignInLink(email: string): Promise<AuthResult> {
  if (!isFirebaseConfigured || !auth) {
    return {
      success: false,
      error: 'Firebase chưa được cấu hình',
    };
  }

  if (!isValidEmailFormat(email)) {
    return { success: false, error: 'Email không hợp lệ' };
  }

  if (!isValidEmailDomain(email)) {
    return { success: false, error: 'Domain email không được hỗ trợ' };
  }

  try {
    const actionCodeSettings = {
      url: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/verify`,
      handleCodeInApp: true,
    };

    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    localStorage.setItem('emailForSignIn', email);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: handleAuthError(error as AuthError),
    };
  }
}

// Complete sign-in with email link
export async function signInWithEmailLink(email: string, emailLink: string): Promise<AuthResult> {
  if (!isFirebaseConfigured || !auth) {
    return {
      success: false,
      error: 'Firebase chưa được cấu hình',
    };
  }

  if (!isSignInWithEmailLink(auth, emailLink)) {
    return { success: false, error: 'Link không hợp lệ' };
  }

  try {
    const result = await signInWithEmailLink(auth, email, emailLink);
    await createOrUpdateUserProfile(result.user);

    localStorage.removeItem('emailForSignIn');
    return { success: true, user: result.user };
  } catch (error) {
    return {
      success: false,
      error: handleAuthError(error as AuthError),
    };
  }
}

// Create or update user profile in Firestore
async function createOrUpdateUserProfile(user: User) {
  if (!db) return;

  const userRef = doc(db, 'users', user.uid);
  const userDoc = await getDoc(userRef);

  const userData = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || user.email?.split('@')[0],
    emailVerified: user.emailVerified,
    role: userDoc.exists() ? userDoc.data()?.role : 'user',
    createdAt: userDoc.exists() ? userDoc.data()?.createdAt : serverTimestamp(),
    lastLoginAt: serverTimestamp(),
    totalLogins: userDoc.exists() ? (userDoc.data()?.totalLogins || 0) + 1 : 1,
  };

  await setDoc(userRef, userData, { merge: true });
}

// Get user profile from Firestore
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  if (!db) return null;

  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      return {
        ...data,
        createdAt: data.createdAt?.toDate(),
        lastLoginAt: data.lastLoginAt?.toDate(),
      } as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
}

// Sign out
export async function signOutUser(): Promise<AuthResult> {
  if (!isFirebaseConfigured || !auth) {
    return { success: false, error: 'Firebase chưa được cấu hình' };
  }

  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: handleAuthError(error as AuthError),
    };
  }
}

// Auth state listener
export function onAuthStateChange(callback: (user: User | null) => void) {
  if (!isFirebaseConfigured || !auth) {
    console.warn('Firebase not configured, auth state listener disabled');
    return () => {}; // Return no-op unsubscribe function
  }
  return onAuthStateChanged(auth, callback);
}

// Get current user
export function getCurrentUser(): User | null {
  return isFirebaseConfigured && auth ? auth.currentUser : null;
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  return isFirebaseConfigured && auth ? auth.currentUser !== null : false;
}
