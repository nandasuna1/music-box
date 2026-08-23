import { secureStoreAsyncStorage } from "@/storage/auth/secureStorePersistence";
import { logger } from "@/utils/logger";
import { FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import {
  Auth,
  getAuth,
  getReactNativePersistence,
  initializeAuth,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Validate required config
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  throw new Error(
    "Firebase config is incomplete. Check your .env file for EXPO_PUBLIC_FIREBASE_* variables.",
  );
}

// Singleton: reuse app if already initialized (prevents multiple initialization)
let app: FirebaseApp;
try {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
} catch (error) {
  logger.error("Failed to initialize Firebase app", { error });
  throw error;
}

export const db = getFirestore(app);

// Singleton: use getAuth() if already initialized, otherwise initialize with persistence
function initializeFirebaseAuth(): Auth {
  try {
    // Try to get existing auth instance first
    return getAuth(app);
  } catch (_) {
    // getAuth() throws if auth was never initialized - this is expected
    try {
      // First initialization - provide secureStoreAsyncStorage for persistent auth
      return initializeAuth(app, {
        persistence: getReactNativePersistence(secureStoreAsyncStorage),
      });
    } catch (error) {
      // If persistence initialization fails, try without persistence as last resort
      logger.error(
        "Failed to initialize auth with persistence, falling back to memory",
        {
          error,
        },
      );
      try {
        return initializeAuth(app);
      } catch (fallbackError) {
        // Critical error - log to Sentry and re-throw
        logger.error(
          "Critical: Failed to initialize Firebase Auth even with fallback",
          {
            error: fallbackError,
          },
        );
        throw new Error("Firebase Auth initialization failed completely");
      }
    }
  }
}

export const auth = initializeFirebaseAuth();
