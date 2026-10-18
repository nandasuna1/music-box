# Development and delivery

## Requirements

- Node.js 24 (used by the GitHub Actions workflows)
- npm
- Xcode and/or Android Studio for native simulator/device builds
- A Firebase project with Google enabled as an Authentication provider and
  Cloud Firestore provisioned
- Google OAuth client IDs for the native app

See [Security and configuration](security.md) for environment variables,
platform configuration, and Firebase access requirements.

## Run locally

Install dependencies and start the Expo development server:

```bash
npm install
npx expo start
```

Use the Expo CLI prompts to open a simulator or a development build. Native
Google Sign-In requires a development/native build. For direct local native
builds:

```bash
npm run ios
npm run android
```

The web target is available with `npm run web`, but the app's configured
Google sign-in uses the native SDK and is not a complete web authentication
implementation.

Native iOS and Android are the prioritized platforms for this sample. The
project deliberately retains Expo and should not be presented as a React Native
CLI app. See the [interview-sample quality contract](refactor/quality-contract.md)
for the supported-platform boundary, demo journey, and shared validation
baseline.

## Project scripts

| Command                | Description                           |
| ---------------------- | ------------------------------------- |
| `npm start`            | Start the Expo development server     |
| `npm run ios`          | Build and run the iOS app locally     |
| `npm run android`      | Build and run the Android app locally |
| `npm run web`          | Start the web target                  |
| `npm test`             | Run Jest tests                        |
| `npm run test:watch`   | Run Jest in watch mode                |
| `npm run lint`         | Run ESLint                            |
| `npm run format:check` | Check formatting with Prettier        |

## Tests and continuous integration

Tests use Jest, `jest-expo`, and React Native Testing Library. Home-screen tests
cover chart rendering, loading and error states, album search, and navigation;
service tests cover Google/Firebase sign-in behavior. External services are
mocked in unit tests.

GitHub Actions runs `npm ci`, `npm run lint`, and `npm test` for pull requests
and pushes to the configured main branches. Run checks locally with:

```bash
npm run lint
npm test -- --runInBand
```

The current baseline results and known formatting failures are recorded in the
[interview-sample quality contract](refactor/quality-contract.md). The PR
workflow currently ignores documentation-only changes.

## EAS profiles

Build profiles are defined in `eas.json`:

- `development`: development-client build for internal distribution on the
  `development` channel.
- `preview`: internal distribution on the `preview` channel.
- `production`: production channel with automatic app-version increment.

The Expo app uses Expo Router, portrait orientation, and the `musicbox` deep
link scheme. The EAS project ID and update URL are configured in `app.json`.
