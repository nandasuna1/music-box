# Security and configuration

## Authentication flow

1. Google Sign-In is configured in `app/_layout.tsx` with the iOS and web
   OAuth client IDs and profile/email scopes.
2. `services/auth/login.ts` checks Google Play Services, requests a Google ID
   token, exchanges it for a Firebase credential, and creates a Firestore
   profile document for a first-time user.
3. `contexts/AuthContext.tsx` exposes the user and loading state from
   `hooks/useAuthSession.tsx`, which listens to Firebase
   `onAuthStateChanged`.
4. The auth route group redirects authenticated users to the protected tabs;
   the protected layout redirects unauthenticated users to login.
5. Logout signs out from Firebase and Google.

Firebase Auth and Firestore are initialized in `services/firebase.ts`.
Initialization requires at least `EXPO_PUBLIC_FIREBASE_API_KEY` and
`EXPO_PUBLIC_FIREBASE_PROJECT_ID`; missing required values throw an error.

## Auth session persistence

`storage/auth/secureStorePersistence.ts` adapts storage for Firebase Auth:

- On iOS and Android, session data is stored using Expo SecureStore (Keychain
  on iOS and Keystore-backed encrypted preferences on Android).
- Firebase's generated storage keys are sanitized to satisfy SecureStore's
  allowed key characters.
- Serialized values are split into chunks to fit SecureStore value limits.
- On web, the adapter uses AsyncStorage because SecureStore is unavailable.
- If Firebase Auth cannot initialize with the adapter, Firebase initialization
  logs the failure and attempts an in-memory Auth initialization.

## Environment variables

Copy `.env.example` to `.env` and configure values for the Firebase project and
Google OAuth clients.

| Variable                                   | Requirement                     | Purpose                                                |
| ------------------------------------------ | ------------------------------- | ------------------------------------------------------ |
| `EXPO_PUBLIC_IOS_CLIENT_ID`                | Required for iOS Google sign-in | iOS OAuth client ID                                    |
| `EXPO_PUBLIC_WEB_CLIENT_ID`                | Required for Google sign-in     | Web/server OAuth client ID used to obtain the ID token |
| `EXPO_PUBLIC_FIREBASE_API_KEY`             | Required                        | Firebase client configuration                          |
| `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`         | Firebase project configuration  | Firebase Authentication domain                         |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID`          | Required                        | Firebase project identifier                            |
| `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`      | Firebase project configuration  | Firebase Storage bucket                                |
| `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase project configuration  | Firebase messaging sender ID                           |
| `EXPO_PUBLIC_FIREBASE_APP_ID`              | Firebase project configuration  | Firebase app ID                                        |
| `EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID`      | Optional                        | Firebase measurement ID                                |
| `EXPO_PUBLIC_SENTRY_DSN`                   | Optional                        | Sentry project DSN                                     |

Expo `EXPO_PUBLIC_*` values are embedded in the client bundle and are not
secrets. Never put private keys, Firebase service-account credentials, or
server-only secrets in them.

The Android app configuration references `google-services.json`; use the file
for the intended Firebase Android app. The configured iOS bundle ID and Android
package are both `com.nandasuna.vinyl`. Configure authorized OAuth clients in
Google/Firebase for the app's platforms.

## Firestore access responsibility

The client-side route guard improves navigation but is not a database access
control. Every production Firebase deployment must have Firestore Security
Rules that validate the authenticated user and authorize each read/write.
Rules should enforce ownership for private profile, review, and saved-album
data and validate fields such as ratings and IDs. No rules are included in this
repository, so configure and test them in the Firebase project before exposing
production data.

Firebase client configuration and OAuth client IDs identify a project/client;
they do not replace database authorization. Avoid logging credentials or
personal data. The logger redacts values under keys that appear sensitive and
is disabled for normal console output in production; production error reporting
may be sent to Sentry when configured.

## Platform notes

- Native Google Sign-In requires a native app/development build; Expo Go does
  not provide the configured native sign-in module.
- A web target is configured, and auth persistence falls back to AsyncStorage,
  but the native Google Sign-In integration is not a complete web sign-in
  implementation.
- Firebase Auth persistence fallback to memory avoids startup failure if
  secure persistence cannot initialize, but the session will not be persisted
  by that fallback.
