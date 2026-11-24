# Interview-sample quality contract

This is the shared definition of done for implementation workstreams in the
[refactor roadmap](index.md). It records the current platform boundary, primary
demo journey, and validation baseline so follow-on work can make progress
without overstating what the sample supports.

## Platform and framework boundary

- The app remains an Expo application using Expo Router and EAS. This is a
  deliberate repository scope, not a React Native CLI implementation.
- Prioritize native iOS and Android for product behavior and manual
  verification. Use a native development or preview build for flows that
  require native modules, including Google Sign-In.
- Web is a configured target, but the current native Google Sign-In
  integration is not a complete web authentication flow. Do not describe web
  sign-in as supported unless it is intentionally implemented and verified.
- Describe only behavior demonstrated by this repository. In particular, do
  not claim RN-CLI delivery experience from this Expo app.

## Primary demonstration journey

Use a configured native build, Firebase project with Google authentication and
Firestore, and a working network connection. Demonstrate:

1. Sign in with Google and reach the authenticated app.
2. Browse chart albums or search for an album, then open its detail screen.
3. Submit a 1–5 rating with a comment and confirm the updated review/profile
   state.
4. Save an album for later and confirm it appears in the profile's saved list.
5. Sign out and confirm the app returns to its unauthenticated entry point.

If a required external service or native configuration is unavailable, report
the blocked step rather than treating a mock or partial flow as a successful
end-to-end demonstration. Error recovery and other scenarios should be added
to the demo as the relevant workstreams implement and verify them.

## Baseline commands and current results

Run checks from the repository root:

```bash
npm run lint
npm test -- --runInBand
npm run format:check
```

At the W0 baseline, lint passed and Jest passed all 7 suites and 28 tests using
the commands above. The format check failed on existing formatting in
`components/profileComponents.tsx`, `google-services.json`, `position.md`,
`utils/logger/logger.ts`, and `utils/monitoring/sentry.ts`. Do not count that
formatting check as green or attribute those existing failures to a later
workstream unless its changes affect those files. W0 does not include unrelated
formatting cleanup.

There is no dedicated type-check or generic build script in `package.json`.
Native `ios` and `android` scripts build and run locally but require the
corresponding native toolchain and configuration; they are not a substitute for
a recorded CI build check. GitHub Actions currently runs lint and tests. Its
pull-request workflow ignores `docs/**`, the workflows use different Node
version declarations, and their Jest commands differ. These are baseline facts,
not changes made by W0.

## Definition of done for follow-on work

Each implementation task should:

- state a bounded scope, relevant behavior/contracts, dependencies, and
  acceptance criteria before changing shared surfaces;
- preserve existing behavior unless an approved product decision says
  otherwise, and update directly affected documentation;
- run the checks relevant to its changes, report exact commands and outcomes,
  and distinguish newly introduced failures from this recorded baseline;
- avoid claiming unsupported platforms, unmeasured performance gains, or
  unverified security and product behavior.

Shared decisions that affect multiple workstreams should be recorded and
referenced before those workstreams change the same contract. Do not decide
component APIs, query/error semantics, or performance tooling in W0; those
decisions belong to the relevant workstream and should follow code inspection
and evidence.
