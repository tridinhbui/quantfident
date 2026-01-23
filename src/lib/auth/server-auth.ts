// Server-side authentication utilities using Firebase Admin SDK
// This file should only be used in API routes and server components

import { auth } from 'firebase-admin';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { BlogDbService } from '@/lib/services/blog-db-service';

// Initialize Firebase Admin (only once)
if (!getApps().length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY!);

  initializeApp({
    credential: cert(serviceAccount),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
}

const adminAuth = getAuth();
const adminDb = db; // Using same Firestore instance

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
    const decodedToken = await adminAuth.verifyIdToken(token, checkRevoked);

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
    const adminEmail = process.env.ADMIN_EMAIL;
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
          displayName: updatedUser.displayName,
          photoURL: updatedUser.photoURL,
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
      displayName: userData.displayName,
      photoURL: userData.photoURL,
      role: userData.role.toLowerCase() as 'user' | 'admin',
      createdAt: userData.createdAt,
      lastLoginAt: userData.lastLoginAt || new Date(),
    };

  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
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
      displayName: userData.displayName,
      photoURL: userData.photoURL,
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