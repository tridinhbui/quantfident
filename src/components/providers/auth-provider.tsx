"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { onAuthStateChange, getUserProfile, UserProfile } from '@/lib/firebase/auth';

// Check if Firebase is configured
const isFirebaseConfigured = typeof window !== 'undefined' &&
  !!(process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
     process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
     process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);

// Auth context type
interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth provider component
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Only set up auth listener if Firebase is configured
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    // Listen for auth state changes
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in
        setFirebaseUser(firebaseUser);
        const profile = await getUserProfile(firebaseUser.uid);
        setUser(profile);

        // Check admin status
        const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
        setIsAdmin(profile?.email?.toLowerCase() === adminEmail?.toLowerCase());
      } else {
        // User is signed out
        setFirebaseUser(null);
        setUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const value: AuthContextType = {
    user,
    firebaseUser,
    loading,
    isAuthenticated: !!user,
    isAdmin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

// Export context for advanced use cases
export { AuthContext };
