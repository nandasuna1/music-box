# Interview-oriented refactor roadmap

## Purpose

This roadmap turns the Hyperion360 **Impact Engineer - React Native
Front-end** role in [`../../position.md`](../../position.md) into concrete,
verifiable improvements to this application. It is intended to be decomposed
into bounded implementation tasks for individual agents or contributors.

The target is an interview-quality engineering sample: a small but complete
product flow with explicit architecture, accessible and reusable UI, measured
performance, reliable data behavior, security boundaries, and meaningful
automated checks. It is not a claim that this repository can prove years of
professional experience, a degree, or collaboration history.

## Scope and framework decision

**Decision: retain the current Expo architecture.** Do not migrate this
repository to React Native CLI as part of this roadmap.

This boundary is important, not cosmetic: the position explicitly says the
team is not using Expo, while this application uses Expo SDK 54, Expo Router,
Expo native modules, and EAS Build. Improving this app can demonstrate
transferable React Native, React, TypeScript, and mobile engineering skills. It
cannot honestly demonstrate hands-on experience shipping a React Native CLI
application. Document this mismatch accurately in an interview; demonstrate
RN-CLI experience separately only if there is genuine work that supports that
claim. Do not rename the tooling or imply Expo is RN CLI.

**In scope:** strengthen the existing application and its interview evidence
within Expo; make design, performance, security, testing, and delivery
decisions visible and reproducible.

**Out of scope:** framework migration, claims about professional history,
invented team processes, a custom backend, and speculative optimization with no
measurement.

The shared supported-platform boundary, primary demonstration journey, and
validation baseline for follow-on work are recorded in the
[interview-sample quality contract](quality-contract.md).

## Current-state snapshot

The existing app already provides a useful foundation:

- React Native 0.81, React 19, Expo SDK 54, TypeScript strict mode, and
  Expo Router routes for login, album discovery/detail, rating, and profile.
- TanStack Query for server-backed state and a shared `QueryClient`.
- Firebase Authentication with Google credentials, Firestore client services,
  and native secure session persistence with a web storage fallback.
- Deezer catalog services for chart, search, and album detail.
- Some reusable components, image caching in the home grid, transactional
  review/save writes, Jest tests, ESLint, and GitHub Actions validation.

The existing documentation describes the system in
[`../README.md`](../README.md), [`../components.md`](../components.md),
[`../network.md`](../network.md), [`../security.md`](../security.md), and
[`../development.md`](../development.md). This roadmap links to those guides
instead of duplicating their full architecture reference.

Current gaps evidenced by the code and docs include:

- Expo instead of the role's required RN-CLI stack.
- Little explicit accessibility metadata on interactive controls, and no
  documented accessibility test or review process.
- Styling and component responsibilities are inconsistent; there is no
  documented, enforced design-token/component contract.
- No recorded device performance baseline, JS-thread investigation, or
  regression budget.
- Incomplete loading/error/empty/mutation feedback on some screens. For
  example, review-save errors are logged but the rate screen navigates away
  from the form in `finally`.
- Profile “recent” queries have no timestamp ordering; the avatar picker is
  only a local preview; saved albums have no remove operation.
- Firestore rules and index definitions are external to the repository. The
  client route guard is not database authorization.
- Test coverage is limited to selected home, auth, persistence, and logger
  behavior; there are no documented component/accessibility, Firestore-rules,
  navigation-flow, or device smoke-test gates.

These are candidate refactor areas, not permission to change behavior without
product decisions. In particular, define UX behavior for failed saves,
removing saved albums, avatar persistence, offline operation, and retention of
user data before implementing those changes.

## Role-to-repository gap matrix

Priority meanings:

- **P0 — disclose/blocker:** a material mismatch or safety condition that must
  be explicit before presenting the sample.
- **P1 — core proof:** high-value implementation evidence for the role.
- **P2 — polish:** useful quality work after the core product path is reliable.
- **Not code-solvable:** requires genuine experience, collaboration, or
  qualifications; do not manufacture evidence.

| Role requirement                             | Current evidence                                                           | Gap / interview proof to build                                                                                                                                            | Priority          |
| -------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| React Native, React, JavaScript, TypeScript  | React Native and React app; strict TypeScript configuration                | Demonstrate typed component/service boundaries and explain React Native rendering and platform behavior with concrete examples                                            | P1                |
| React Native CLI; role does not use Expo     | Expo SDK, Expo Router, native modules, EAS profiles                        | Direct stack mismatch. Keep Expo per scope decision, state limitation plainly, and do not claim RN-CLI delivery from this repository                                      | P0                |
| Performance, JS thread, optimization         | `FlatList`, paginated query, `expo-image` caching in home screen           | Add repeatable baseline on representative iOS/Android devices; identify actual bottlenecks; measure any changes and document JS/UI-thread tradeoffs                       | P1                |
| Reusable, maintainable, testable modules     | Shared components exist; many screen concerns remain colocated             | Establish component contracts and test strategy, reduce duplicated presentation/state logic where it improves clarity, and prove through focused tests                    | P1                |
| Design systems, aesthetics, mobile-first UX  | Dark visual language and basic theme values in `constants/theme.ts`        | Create semantic design tokens and reusable primitives; verify layouts, text scaling, touch targets, and visual states on small/large screens                              | P1                |
| Accessibility                                | No established accessibility contract apparent in interactive controls     | Add labels, roles, values/states/hints and screen-reader semantics; test keyboard/screen-reader-relevant interactions and document manual checks                          | P1                |
| Reliable cross-platform behavior             | iOS, Android, and web targets configured; native Google sign-in limits web | Define supported platforms and test native behavior on iOS and Android. Treat web sign-in as unsupported until intentionally implemented                                  | P1                |
| Debugging, stability, user experience        | Logger, Sentry setup, and some UI error states                             | Normalize actionable errors, preserve user input on failure, give recovery affordances, and verify monitoring/logging does not leak sensitive data                        | P1                |
| Modern tools and PoCs                        | Expo, TanStack Query, Firebase, Jest, CI already used                      | Add a small measured PoC only if it resolves a demonstrated need; record alternatives and decision rather than adding tools for résumé keywords                           | P2                |
| Documentation, reviews, knowledge sharing    | Architecture/setup documentation and this plan                             | Record concise design/measurement decisions and include a reproducible demo/review checklist. Real code-review/collaboration experience must be truthful                  | P2                |
| AI-assisted engineering                      | No implementation evidence is required in app runtime                      | If discussed, explain a real workflow: scoped prompts, independent verification, tests, and human review. Do not add AI features to the product merely to match this line | P2                |
| Weekly shipping, Agile/SCRUM, high ownership | Repository contains CI but no proof of actual team cadence                 | Use a realistic small-batch task history only if genuine. Explain prioritization/tradeoffs from real work; repository artifacts cannot establish team experience          | Not code-solvable |
| 4+ years, degree/equivalent, collaboration   | Not inferable from source                                                  | Represent actual qualifications and work history accurately; do not generate fabricated résumé or process evidence                                                        | Not code-solvable |
| Native iOS/Android experience is a plus      | Expo native modules/build configurations exist                             | Explain actual native integration/configuration work and limitations. Do not imply native implementation beyond the checked-in evidence                                   | P2                |

## Workstreams and task cards

Each workstream below is written so it can become one or more implementation
tasks. Agents should own distinct file surfaces where practical, but should not
independently redefine shared contracts. Acceptance criteria describe intended
outcomes; implementation tasks must first inspect current code and preserve
working behavior unless a behavior change is explicitly approved.

### W0 — Establish the interview-sample quality contract

**Goal:** create a clear baseline and definition of done shared by follow-on
workstreams.

**Inspect:** `position.md`, all current `docs/*.md`, `package.json`,
`app.json`, `eas.json`, `.github/workflows/*.yaml`, test files, and key routes.

**Work:**

- Keep Expo as a documented architectural choice; add the RN-CLI mismatch to
  interview notes without claiming this repo meets that requirement.
- Define the supported platform scope: prioritize native iOS and Android;
  document web as a configured target with Google sign-in limitations unless
  web auth is deliberately brought into scope.
- Inventory existing test/lint/build commands and establish a known baseline
  before changing implementation.
- Define what constitutes a successful end-to-end demonstration: sign in,
  browse/search, open album, rate with comment, see the updated review/profile,
  save for later, and sign out.
- Add a small architecture decision note only when a choice affects multiple
  workstreams (shared UI contract, query/error behavior, performance tooling).

**Acceptance criteria:**

- The supported platforms, Expo boundary, and end-to-end user journey are
  stated in docs and do not overclaim RN-CLI experience.
- Baseline lint/tests can be run using documented commands; failures are
  attributed to existing baseline or resolved before claiming green.
- A concise shared definition of done is referenced by implementation tasks.

**Dependencies:** none; start first.

**Parallelism:** platform support inventory and baseline test inventory can be
done independently; architecture decisions must be consolidated before
downstream agents change shared contracts.

### W1 — Design tokens, component boundaries, and visual states

**Goal:** make the app's visual language consistent and reusable without
introducing a heavyweight UI framework.

See the detailed [W1 design plan](w1.md).

**Inspect:** `constants/theme.ts`, `components/themed-*`, `components/RatingInput.tsx`,
`components/SearchBar.tsx`, `components/profileComponents.tsx`, and inline
styles in `app/`.

**Work:**

- Define a small semantic token set for colors, spacing, typography, radii,
  elevation, and interactive states, aligned with the existing dark/gold visual
  direction. Avoid duplicating raw colors in screen styles.
- Decide a minimal reusable primitive boundary (for example buttons, text
  fields, album artwork/card, loading/error/empty panels). Keep feature
  components feature-oriented; do not create an abstraction for a single use
  without a concrete reuse or testability benefit.
- Define controlled component props, disabled/loading behavior, and error
  presentation contracts.
- Replace only the inline styles/tokens that are within agreed scope; preserve
  current visual hierarchy and make any intended UX changes explicit.
- Verify dynamic text sizes and narrow/wide layouts so visual polish does not
  reduce usability.

**Acceptance criteria:**

- Repeated semantic colors/spacing/type styles use named tokens rather than
  scattered literals in touched surfaces.
- Components have typed, documented-by-contract props and deterministic
  disabled/loading behavior.
- Screens retain a coherent visual treatment for normal, pressed, disabled,
  loading, empty, and error states.
- Component tests cover meaningful behavior/props, not implementation-only
  snapshots.

**Dependencies:** W0 shared quality contract. Coordinate token names with W2
before implementing accessibility focus/contrast states.

**Non-goals:** adopt a large design-system package, redesign all screens, or
restructure routes solely for stylistic consistency.

### W2 — Accessibility and inclusive mobile interaction

**Goal:** make core user flows understandable and operable with assistive
technology and diverse input needs.

**Inspect:** route screens, `GoogleLoginButton`, `SearchBar`, `RatingInput`,
album tiles, icon buttons, profile actions, tab buttons, and loading/error
messages.

**Work:**

- Add meaningful `accessibilityRole`, `accessibilityLabel`,
  `accessibilityHint` where useful, and `accessibilityState` (selected,
  disabled, busy, etc.) for all interactive controls.
- Make album cards expose album and artist identity and a clear action, not just
  artwork or a truncated title.
- Make the rating input announce the current 1–5 value and expose each
  selection as an understandable action; do not rely on star glyph/color alone.
- Ensure icon-only bookmark, profile image-picker, and navigation actions have
  labels and meaningful state.
- Preserve focus and useful validation/error announcements after failures.
- Check color contrast and touch target sizing for controls/states using the
  token system from W1.
- Add automated accessibility assertions for key semantics and a concise manual
  VoiceOver/TalkBack checklist; automation does not substitute for device
  verification.

**Acceptance criteria:**

- Core discovery, album detail, rating, save, and sign-out controls have
  appropriate screen-reader names, roles, and state.
- No critical action communicates state through color/icon appearance alone.
- Screen-reader navigation can complete the primary flow on iOS and Android
  with manual evidence/checklist recorded.
- Accessibility-focused tests fail if essential labels/roles/states regress.

**Dependencies:** W0; coordinate with W1 primitives and semantics.

**Parallelism:** one agent may inventory and test semantics while another
implements components only after shared naming/state expectations are agreed.

### W3 — Performance baseline and evidence-driven optimization

**Goal:** demonstrate knowledge of React Native performance and the JS/UI
threads through measured behavior rather than speculative memoization.

**Inspect:** `app/(protected)/(tabs)/index.tsx`,
`app/(protected)/album/[id].tsx`, `components/profileComponents.tsx`,
`services/album/*`, Expo image usage, and current device/build capabilities.

**Work:**

- Define a reproducible profiling scenario: device/model and OS, build type,
  dataset/network conditions, steps, and repeated run count. Record baseline
  list scroll responsiveness, render/load timing, memory/image behavior, and
  any available dropped-frame/JS-thread evidence.
- Profile representative native iOS and Android builds (not just a simulator
  development session); distinguish JS-thread stalls, native/UI work, network
  wait, and image decode/render costs.
- Inspect list item render cost, key stability, pagination triggers, query
  churn, artwork sizing/caching, and detail track-list behavior.
- Optimize only measured hotspots. Candidate techniques (memoized row
  components, stable callbacks, tuned list windowing, image sizing) require a
  before/after measurement and correctness check before adoption.
- Define realistic regression thresholds from the baseline and supported test
  devices; document environment variance rather than inventing universal frame
  budgets.

**Acceptance criteria:**

- A documented baseline can be reproduced by another engineer.
- At least one actual measured bottleneck is either fixed and remeasured or
  shown not to require code change.
- Before/after evidence records test conditions and avoids comparing unlike
  build/device conditions.
- Optimizations do not break pagination, search query keys, image identity,
  accessibility, or item correctness.

**Dependencies:** W0 supported-device decision; coordinate W1/W2 before
changing item/component boundaries. Baseline precedes optimization.

**Non-goals:** blanket `memo`, `useMemo`, or `useCallback` insertion; claims of
performance gains from code inspection alone.

### W4 — Data correctness, query contracts, and user-visible reliability

**Goal:** make async flows predictable and recoverable while keeping query
cache and Firestore behavior consistent.

**Inspect:** `services/album/*`, `services/reviews/*`,
`services/saveForLater/*`, `services/user/*`, `app/` query/mutation callers,
`types/Album.ts`, and the query invalidation paths.

**Work:**

- Specify query/mutation result and error contracts and ensure every caller has
  distinct initial-loading, background-refresh, error, empty, and success
  behavior.
- Fix profile “recent” semantics by ordering review and saved records by
  timestamp descending and limiting results. Confirm timestamp types and
  required Firestore composite indexes; add index configuration if the project
  adopts a checked-in rules/index deployment workflow.
- Make failed review writes preserve entered rating/comment and show a
  recoverable message. Navigate away only on confirmed success. Do not swallow
  the failure or present a success-shaped fallback.
- Ensure save-for-later reflects true persisted state, can be toggled off if
  product confirms removal, and updates both Firestore references/counters
  transactionally. Counter behavior and legacy-data reconciliation must be
  specified before shipping a removal mutation.
- Decide with product whether profile avatar editing should persist. If yes,
  define storage destination, permissions, upload progress, failure, and
  cleanup behavior; otherwise label the picker as preview-only or remove the
  misleading affordance.
- Define retry, cancellation, stale-data, and offline behavior per operation.
  Avoid retrying non-idempotent or user-visible mutations without an explicit
  idempotency strategy.
- Keep query keys centralized or consistently typed if repetition is causing
  invalidation mistakes; avoid abstraction that obscures the current small
  query set.

**Acceptance criteria:**

- “Recent” review/saved results have deterministic descending time order, with
  index requirements captured.
- A rejected review mutation leaves form input intact, gives a visible
  accessible error, and does not report navigation/success.
- Save/remove behavior, if approved, is idempotent and maintains counters and
  references for create, update, remove, and retry cases.
- Tests cover success, failure, empty, signed-out, and cache-invalidation
  behavior for the primary mutations/queries.
- No broad catches or silent fallback make failed network/data operations look
  successful.

**Dependencies:** W0 behavior decisions, W2 error announcement semantics, and
W5 Firestore ownership/rules review. Ordering change needs a deliberate index
check.

**Parallelism:** Deezer read-state error behavior can be worked independently
from Firestore transaction semantics; query/cache contracts must remain shared.

### W5 — Firebase security and deployable data rules

**Goal:** ensure the app's client behavior is matched by enforceable database
authorization, not just protected navigation.

**Inspect:** `services/firebase.ts`, auth/session code, every Firestore service
query/write, `docs/security.md`, and the Firebase project configuration without
exposing secrets.

**Work:**

- Design Firestore Rules for authenticated ownership of user profiles,
  reviews, saved albums, and per-user subcollections. Model exactly which
  profile fields a signed-in user can read/edit; avoid assuming every profile
  field is public.
- Enforce allowed field shapes, types, rating range, user ID/document ID
  consistency, immutable ownership fields, and timestamp/write constraints
  compatible with current transactions.
- Analyze every current query against Firestore's rules model; Firestore rules
  are not filters, so queries must only request data the rules can authorize.
- Add checked-in rules and index configuration only after verifying no
  production-project rules/indexes are being overwritten. Provide a
  non-production Firebase Emulator Suite setup for tests.
- Test authenticated owner, another authenticated user, unauthenticated user,
  malformed payload, and unauthorized collection/document access.
- Audit Sentry/logger payloads for tokens, email/UID, and other personal data;
  tighten redaction or event context as needed. Do not put credentials in
  `EXPO_PUBLIC_*`.

**Acceptance criteria:**

- Rules are version-controlled, documented, and tested against emulator
  scenarios for allow and deny cases.
- No user can read or mutate another user's private data by changing IDs or
  request parameters.
- Rules support the current create/update transactions without granting broad
  collection access.
- Local setup instructions make clear how to use emulator configuration and
  how to avoid deploying test rules to production accidentally.
- Logs/monitoring are reviewed and tests show sensitive values are not exposed
  in intended reporting paths.

**Dependencies:** W0; coordinate exact data ownership/field requirements with
W4 before finalizing rules. Do not parallelize rules and transaction redesign
without a shared schema contract.

**Safety:** never use production user data for security tests; do not weaken
rules to make client tests pass.

### W6 — Test strategy and cross-platform verification

**Goal:** add a meaningful test pyramid around reusable components, user
journeys, data invariants, and platform behavior.

**Inspect:** `jest.config.js`, `jest.setup.ts`, current tests under `__tests__/`,
`services/**`, persistence and logger tests, and CI workflow files.

**Work:**

- Add focused component tests for rating, search, loading/error/empty
  components, album card accessibility semantics, and disabled/busy behavior.
- Add integration tests for login guards and primary browse → detail → review
  → profile and save flows, using deterministic service mocks and an isolated
  TanStack Query client.
- Add Firestore Emulator Suite tests for rules and transaction invariants when
  W5 contracts are ready. Keep unit tests fast and deterministic.
- Add platform smoke steps for iOS and Android development/preview builds:
  launch, auth configuration, image loading, navigation, keyboard/form, and
  secure persistence. Clearly label any manual-only checks.
- Avoid snapshots as the sole proof for logic, accessibility, or performance.
- Add coverage thresholds only for useful, stable boundaries; do not inflate
  numbers with trivial tests.

**Acceptance criteria:**

- Every core path and its meaningful failure states have repeatable automated
  coverage at the appropriate layer.
- Tests do not depend on a live Deezer/Firebase production service.
- Firestore authorization/invariant tests run against emulator, not by mocking
  away the rules under test.
- Platform smoke instructions are reproducible and report unsupported web
  auth accurately.
- CI runs the agreed automated checks and provides actionable failure output.

**Dependencies:** W0; component contract with W1/W2, mutation contract with
W4, and rules emulator setup with W5. Component tests may start in parallel
after semantics are agreed.

### W7 — Operational quality, observability, and release proof

**Goal:** show that the sample can be validated and shipped through a
disciplined mobile workflow.

**Inspect:** `.github/workflows/pr-validator.yaml`,
`.github/workflows/merge-validator.yaml`, `eas.json`, `app.json`,
`utils/logger/`, `utils/monitoring/`, and `docs/development.md`.

**Work:**

- Align PR and main-branch validation commands/Node versions and include
  type-check, formatting, targeted tests, and any emulator checks that can run
  safely in CI.
- Keep secrets out of CI logs and client bundles; use protected CI secrets only
  for release-only tasks that require them.
- Define build channels and reproducible development/preview smoke steps;
  document that native module/config changes require an appropriate native
  build, not only a JS refresh.
- Review Sentry initialization/sample rates, logger production behavior, and
  error context. Ensure useful diagnostics do not include credentials or
  unnecessary personal data.
- Record release notes/checklist for platform validation, migration/rules
  deployment, rollback approach, and post-release monitoring.

**Acceptance criteria:**

- PR gates run the same documented lint/type/test/format commands locally and
  in CI; failures block merge.
- CI does not require production Firebase credentials for ordinary unit tests.
- Development and preview builds can be distinguished and tested without
  accidental production data changes.
- Monitoring/error-handling behavior and release checklist are documented.

**Dependencies:** W0; CI can add stable checks incrementally, but emulator and
release gates depend on W5/W6.

### W8 — Interview narrative and evidence package

**Goal:** make engineering reasoning easy to present without overstating
experience or duplicating the README.

**Inspect:** current `README.md`, architecture docs, merged workstream evidence,
and actual app screenshots in `assets/readme_images/` if still current.

**Work:**

- Keep the root README focused on the product presentation. Link to
  architecture docs and this roadmap; do not turn the README into a résumé.
- Update architecture docs when actual code changes alter behavior, contracts,
  setup, security, or support matrix.
- Add a concise, versioned decision/measurement record for major tradeoffs:
  why Expo remains, what performance was measured, what was changed, and what
  was intentionally left unchanged.
- Prepare a demo script showing the end-to-end flow and at least one
  failure/recovery scenario.
- Prepare an interview discussion outline with architecture diagram/flow,
  performance before/after evidence, accessibility example, test strategy,
  security model, and honest Expo/RN-CLI limitation.
- AI-tool use may be described only as an actual workflow with human review and
  verification; no app feature is required for this job criterion.

**Acceptance criteria:**

- A reviewer can understand product, architecture, supported platforms,
  setup, and known limitations without relying on undocumented assumptions.
- Every performance or security claim links to reproducible evidence.
- Demo flow works in a clean development/preview environment and includes
  recovery behavior.
- Documentation and interview notes accurately distinguish demonstrated
  repository evidence from personal experience/qualifications.

**Dependencies:** W0; final evidence depends on W1–W7 outcomes.

## Recommended execution order

1. **W0 baseline and quality contract.** Confirm supported native platforms,
   journey, test baseline, and shared contracts.
2. **W5 security schema review and W3 performance baseline.** These discovery
   activities can run in parallel after the project/data boundaries are known;
   neither should mutate production configuration.
3. **W1 component/tokens and W2 accessibility.** Agree on primitive props,
   states, contrast, and semantics before parallel component/screen edits.
4. **W4 reliability/data behavior.** Make product choices explicit, then
   update query, mutation, loading/error UX, and Firestore index/rule contracts.
5. **W6 test expansion.** Add or complete integration/emulator tests as the
   preceding contracts stabilize; keep independent component tests moving
   earlier where safe.
6. **W3 measured optimization.** Use the baseline to prioritize and measure
   changes; repeat accessibility and correctness checks after list changes.
7. **W7 delivery gates and W8 evidence package.** Add CI checks incrementally
   and compile final demo/review materials after implementation is verified.

### Delegation boundaries

Agents can work in parallel only when they do not edit the same contracts or
shared files without coordination. Good parallel batches after W0 include:

- performance baseline on one platform and a second-platform reproduction;
- accessibility audit/inventory and isolated test harness;
- Firebase rules/schema proposal and Deezer read error-state test proposal;
- component test inventory and CI baseline audit.

Do **not** parallelize multiple agents rewriting `app/_layout.tsx`, shared
tokens/component APIs, Firestore record shapes, query keys, or mutation
semantics. Assign one owner to each contract and have dependent tasks consume
that agreed contract. Each implementation task should end with a small diff,
tests/checks, and an updated relevant architecture doc.

## Definition of interview-ready

The sample is ready to present when all of the following are true:

- [ ] The Expo choice and RN-CLI mismatch are stated accurately; no experience
      or qualification is fabricated.
- [ ] A reviewer can run the app with documented setup and understand the
      supported iOS/Android/web behavior.
- [ ] The primary discovery → detail → rate/review → profile/save path works,
      including visible error recovery and empty/loading states.
- [ ] Primary controls expose meaningful labels, roles, values, and states;
      VoiceOver/TalkBack have been manually checked on supported native targets.
- [ ] Shared components/tokens improve consistency without obscuring feature
      behavior or adding unnecessary framework dependencies.
- [ ] Performance claims include reproducible before/after measurements on
      representative native builds, or clearly state that measurement found no
      worthwhile optimization.
- [ ] Firestore ownership rules and data invariants are versioned and tested
      with a non-production emulator setup.
- [ ] CI validates formatting, lint, type safety, relevant automated tests, and
      any safe emulator checks; platform smoke steps are documented.
- [ ] Architecture docs describe the code that exists now, not planned
      behavior, and link to reproducible evidence.
- [ ] A short demo and tradeoff narrative can be presented without claiming
      that this Expo sample proves RN-CLI or professional/team qualifications.

## Related documentation

- [Architecture index](../README.md)
- [Components and UI](../components.md)
- [Network and data](../network.md)
- [Security and configuration](../security.md)
- [Development and delivery](../development.md)
- [Role description](../../position.md)
