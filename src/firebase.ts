import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

export const app = initializeApp(firebaseConfig);

// Initialize Firestore with long-polling auto-detection for reliable connections in sandboxed/iframe environments
export const db = initializeFirestore(
  app,
  {
    experimentalAutoDetectLongPolling: true,
  },
  firebaseConfig.firestoreDatabaseId
);

export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function logFirestoreError(error: unknown, operationType: OperationType, path: string | null): void {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error (Log): ', JSON.stringify(errInfo));
}

export function friendlyAuthError(err: any): string {
  if (!err) return "An unexpected error occurred. Please try again.";

  let message = typeof err === 'string' ? err : err?.message || String(err);
  
  // Try to parse if it's our structured error
  try {
    if (typeof message === 'string' && message.startsWith('{')) {
      const parsed = JSON.parse(message);
      message = parsed.error || message;
    }
  } catch {}

  if (typeof message !== 'string') return "Login failed. Please try again.";

  // Standard Firebase Auth Error checks
  if (message.includes('auth/invalid-credential') || message.includes('auth/wrong-password') || message.includes('auth/user-not-found')) {
    return "Invalid email or password. Please check your credentials.";
  }
  if (message.includes('auth/invalid-email')) return "Please enter a valid email address.";
  if (message.includes('auth/user-disabled')) return "This account has been disabled. Contact HealthPilot support at 9311601420.";
  if (message.includes('auth/too-many-requests')) return "Too many attempts. Please wait a few minutes or reset your password.";
  if (message.includes('auth/operation-not-allowed')) {
    return "Email/Password sign-in is not enabled in the Firebase Console yet. Please enable it under Firebase Console -> Authentication -> Sign-in method.";
  }
  if (message.includes('auth/unauthorized-domain')) {
    const domain = typeof window !== 'undefined' ? window.location.hostname : 'this domain';
    return `Unauthorized Domain: Please add "${domain}" to Firebase Console -> Authentication -> Settings -> Authorized domains.`;
  }
  if (message.includes('auth/configuration-not-found')) {
    return "Firebase Auth provider configuration not found. Please enable Authentication providers in Firebase Console.";
  }
  if (message.includes('auth/weak-password')) return "Password must be at least 8 characters with a number and symbol.";
  if (message.includes('auth/email-already-in-use')) return "An account with this email already exists. Please login instead.";
  if (message.includes('permission-denied') || message.includes('Missing or insufficient permissions')) {
    return "Database permission issue: Access was restricted by Firestore rules. Please check role permissions.";
  }

  // If error message is already clean & human-readable (e.g. from loginWithEmail or user validation)
  if (!message.includes('auth/') && !message.includes('Firebase:') && !message.includes('FirebaseError')) {
    return message;
  }
  
  console.error('Unhandled Auth Error:', err);
  return message || "Login failed. Please try again.";
}
