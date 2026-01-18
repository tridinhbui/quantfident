// Firebase client-side SDK initialization
// This file should only be imported in client components

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Validate required environment variables
const requiredEnvVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
];

const hasValidConfig = typeof window !== 'undefined' && requiredEnvVars.every(envVar => process.env[envVar]);

if (!hasValidConfig) {
  console.warn('Firebase configuration incomplete. Make sure all NEXT_PUBLIC_FIREBASE_* environment variables are set.');
}

// Initialize Firebase only if config is valid
export const app = hasValidConfig ? initializeApp(firebaseConfig) : null;

// Initialize Firebase services only if app exists
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;

// Export types for convenience
export type { User, AuthError } from 'firebase/auth';
export type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
