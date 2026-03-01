// Firebase auth facade (kept intentionally small)

export type { AuthResult } from './google-auth';
export { signInWithGoogle } from './google-auth';

export { completeSignInWithEmailLink } from './email-link-auth';

export type { SessionResult, UserProfile, SignOutResult } from './session-auth';
export {
  createServerSession,
  clearServerSession,
  getCurrentSessionProfile,
  signOutUser,
  onAuthStateChange,
  getCurrentUser,
  isAuthenticated,
} from './session-auth';

export { mapFirebaseError } from './auth-errors';
