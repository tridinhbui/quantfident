// Server-side authentication utilities using Firebase Admin SDK
// This file should only be used in API routes and server components

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { BlogDbService } from '@/lib/services/blog-db-service';
import { getAdminEmail } from '@/lib/admin/verification';

export const SESSION_COOKIE_NAME = 'quantfident_session';
export const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 5; // 5 days

let adminAuth: ReturnType<typeof getAuth> | null = null;

const getAdminAuth = () => {
  if (adminAuth) {
    return adminAuth;
  }

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountKey) {
    throw new Error('Firebase Admin not configured');
  }

  if (!getApps().length) {
    const serviceAccount = JSON.parse(serviceAccountKey);
    initializeApp({
      credential: cert(serviceAccount),
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
  }

  adminAuth = getAuth();
  return adminAuth;
};

export interface AuthenticatedUser {
  uid: string;
  email: string;
  emailVerified: boolean;
  displayName?: string;
  photoURL?: string;
  role: 'user' | 'admin';
  createdAt: Date;
  lastLoginAt: Date;
}

// Decode and verify Firebase ID token
export async function verifyIdToken(token: string, checkRevoked: boolean = false): Promise<AuthenticatedUser | null> {
  try {
    // Verify token with Firebase Admin
    const decodedToken = await getAdminAuth().verifyIdToken(token, checkRevoked);

    // Upsert user in Postgres via Prisma
    await BlogDbService.upsertUser({
      firebaseUid: decodedToken.uid,
      email: decodedToken.email || '',
      emailVerified: decodedToken.email_verified || false,
      displayName: decodedToken.name,
      photoURL: decodedToken.picture,
    });

    // Get updated user data from database
    const userData = await BlogDbService.getUserByFirebaseUid(decodedToken.uid);

    // Check if user should be admin (only if email matches and verified)
    const adminEmail = getAdminEmail();
    if (adminEmail &&
        decodedToken.email?.toLowerCase() === adminEmail.toLowerCase() &&
        decodedToken.email_verified &&
        userData?.role !== 'ADMIN') {
      // Grant admin role if conditions met
      await BlogDbService.grantAdminRole(decodedToken.uid, adminEmail);

      // Refresh user data after role update
      const updatedUser = await BlogDbService.getUserByFirebaseUid(decodedToken.uid);
      if (updatedUser) {
        return {
          uid: updatedUser.id,
          email: updatedUser.email,
          emailVerified: updatedUser.emailVerified,
          displayName: updatedUser.displayName ?? undefined,
          photoURL: updatedUser.photoURL ?? undefined,
          role: updatedUser.role.toLowerCase() as 'user' | 'admin',
          createdAt: updatedUser.createdAt,
          lastLoginAt: updatedUser.lastLoginAt || new Date(),
        };
      }
    }

    if (!userData) return null;

    return {
      uid: userData.id,
      email: userData.email,
      emailVerified: userData.emailVerified,
      displayName: userData.displayName ?? undefined,
      photoURL: userData.photoURL ?? undefined,
      role: userData.role.toLowerCase() as 'user' | 'admin',
      createdAt: userData.createdAt,
      lastLoginAt: userData.lastLoginAt || new Date(),
    };

  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

// Verify Firebase session cookie and resolve user profile from DB
export async function verifySessionCookie(sessionCookie: string, checkRevoked: boolean = true): Promise<AuthenticatedUser | null> {
  try {
    const decodedToken = await getAdminAuth().verifySessionCookie(sessionCookie, checkRevoked);

    await BlogDbService.upsertUser({
      firebaseUid: decodedToken.uid,
      email: decodedToken.email || '',
      emailVerified: decodedToken.email_verified || false,
      displayName: decodedToken.name,
      photoURL: decodedToken.picture,
    });

    const userData = await BlogDbService.getUserByFirebaseUid(decodedToken.uid);

    const adminEmail = getAdminEmail();
    if (
      adminEmail &&
      decodedToken.email?.toLowerCase() === adminEmail.toLowerCase() &&
      decodedToken.email_verified &&
      userData?.role !== 'ADMIN'
    ) {
      await BlogDbService.grantAdminRole(decodedToken.uid, adminEmail);
    }

    const resolvedUser = await BlogDbService.getUserByFirebaseUid(decodedToken.uid);
    if (!resolvedUser) {
      return null;
    }

    return {
      uid: resolvedUser.id,
      email: resolvedUser.email,
      emailVerified: resolvedUser.emailVerified,
      displayName: resolvedUser.displayName ?? undefined,
      photoURL: resolvedUser.photoURL ?? undefined,
      role: resolvedUser.role.toLowerCase() as 'user' | 'admin',
      createdAt: resolvedUser.createdAt,
      lastLoginAt: resolvedUser.lastLoginAt || new Date(),
    };
  } catch (error) {
    console.error('Session cookie verification failed:', error);
    return null;
  }
}

export async function createSessionCookieFromIdToken(idToken: string): Promise<string> {
  return getAdminAuth().createSessionCookie(idToken, { expiresIn: SESSION_MAX_AGE_MS });
}

export async function revokeUserSessions(uid: string): Promise<void> {
  await getAdminAuth().revokeRefreshTokens(uid);
}

// Require admin access for protected routes
export async function requireAdmin(token: string): Promise<AuthenticatedUser> {
  const user = await verifyIdToken(token);

  if (!user) {
    throw new Error('Invalid or expired token');
  }

  if (user.role !== 'admin') {
    throw new Error('Admin access required');
  }

  if (!user.emailVerified) {
    throw new Error('Email verification required');
  }

  return user;
}

// Get user by Firebase UID (for internal use)
export async function getUserById(firebaseUid: string): Promise<AuthenticatedUser | null> {
  try {
    const userData = await BlogDbService.getUserByFirebaseUid(firebaseUid);

    if (!userData) {
      return null;
    }

    return {
      uid: userData.id,
      email: userData.email,
      emailVerified: userData.emailVerified,
      displayName: userData.displayName ?? undefined,
      photoURL: userData.photoURL ?? undefined,
      role: userData.role.toLowerCase() as 'user' | 'admin',
      createdAt: userData.createdAt,
      lastLoginAt: userData.lastLoginAt || new Date(),
    };
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

// Extract token from Authorization header
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  return authHeader.substring(7); // Remove 'Bearer ' prefix
}
