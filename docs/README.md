# Documentation

Technical documentation for **music-box** (branded in the app as **vinyl.**).
The repository is a client application: there is no custom application server
or REST API. The client connects directly to Deezer and Firebase.

## Architecture by layer

| Document                                                          | What it covers                                                                                            |
| -----------------------------------------------------------------|----------------------------------------------------------------------------------------------------------- |
| [Components](components.md)                                       | Screens, routes, shared UI, app state, and source layout                                                    |
| [Network and data](network.md)                                    | Deezer HTTP requests, Firebase client service operations, Firestore model, caching                          |
| [Security and configuration](security.md)                         | Google/Firebase authentication, session persistence, environment values, Firebase security responsibilities |
| [Development and delivery](development.md)                        | Requirements, local setup, scripts, tests, CI, and EAS build profiles                                       |
| [Interview-sample quality contract](refactor/quality-contract.md) | Supported platforms, demo journey, baseline checks, and shared definition of done                           |

## System overview

| Area                   | Implementation                                       |
| ---------------------- | ---------------------------------------------------- |
| App/runtime            | React Native 0.81, React 19, Expo SDK 54             |
| Navigation             | Expo Router 6, file-based routes                     |
| Server state/cache     | TanStack Query 5                                     |
| Authentication         | Firebase Authentication with Google credentials      |
| Database               | Cloud Firestore                                      |
| Album catalog          | Deezer public API through Axios                      |
| Local auth persistence | Expo SecureStore on iOS/Android; AsyncStorage on web |
| Monitoring             | Sentry React Native                                  |
| Language               | TypeScript, strict mode                              |
| Tests/lint             | Jest with `jest-expo`, ESLint                        |

## Application flow

1. `app/_layout.tsx` configures Google Sign-In and Sentry, then provides the
   shared TanStack Query client, navigation theme, safe-area context, and auth
   context to the route tree.
2. `AuthProvider` observes Firebase Auth with `onAuthStateChanged`. The auth
   route group redirects signed-in users to the protected tabs; the protected
   route group sends signed-out users to login.
3. Screens use TanStack Query for asynchronous reads and caching. Catalog
   queries call Deezer services; profile and listening activity queries call
   Firestore services.
4. Review and listen-later mutations write to Firestore in transactions. They
   keep top-level records, per-user references, and user counters consistent.
5. Screens update or invalidate relevant query keys after writes so dependent
   views can refresh.

There is no separate app-wide state store currently used: TanStack Query owns
server state, and screen/component state handles local interactions.

## Boundaries

- **UI and navigation:** Expo Router screens and reusable React Native
  components.
- **Network/data:** Deezer HTTP requests and Firebase client SDK operations;
  see [Network and data](network.md).
- **Identity and access:** Google sign-in, Firebase Auth, local persistence,
  environment configuration, and Firestore security rules; see
  [Security and configuration](security.md).
- **Delivery:** Expo CLI, EAS profiles, Jest, ESLint, and GitHub Actions; see
  [Development and delivery](development.md).
