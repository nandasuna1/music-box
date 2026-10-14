# Database Architecture Change: Firestore to Supabase PostgreSQL

## Status

**Assessment complete; implementation and data migration not started.** This document records the recommendation, review findings, prerequisites, and implementation tasks. No Firestore records, Firebase Authentication accounts, application services, or Supabase project configuration have been changed.

## Recommendation

Move app-owned persisted data from Firestore to **Supabase PostgreSQL**, retaining **Firebase Authentication** and existing Firebase UIDs. Use the Supabase JavaScript client in the app; do not add an app-owned backend.

Build and test the schema, authorization, migration tooling, and app integration locally using the Supabase CLI and its Docker-based local development stack **before configuring or using a hosted Supabase project**. Promote the locally validated migrations to a hosted project only after local acceptance and project-owner approval.

SQL is a better fit for profiles, reviews, and saved albums because they belong to users, reference albums, and need uniqueness, filtering, ordering, and relational integrity. The current Firestore implementation duplicates records/pointer documents and transactionally maintains profile counters. PostgreSQL foreign keys, unique constraints, indexes, and transactions express these requirements directly.

Changing authentication is **not required** to use Supabase PostgreSQL. Keeping Firebase Auth is recommended for this migration to avoid an unnecessary identity-provider change and account migration. Supabase supports Firebase Auth as a third-party JWT provider. For hosted use, the app must provide Firebase ID tokens to the Supabase client, Firebase users must have the `authenticated` role claim, and PostgreSQL Row Level Security (RLS) must enforce the intended access. Provision custom claims only through a trusted Firebase Admin environment. Never include Firebase Admin credentials or a Supabase service-role key in the app.

Keep Deezer as the source for album search, charts, discovery, and album details; these data do not currently need SQL persistence. Keep Firestore intact throughout development, hosted cutover, and the agreed rollback period. Do not delete or modify source data as part of assessment or import.

## Review findings

Reviewed `services/firebase.ts`, `services/album/*`, `services/reviews/*`, `services/saveForLater/*`, `services/user/*`, their login/profile/album-screen callers, `types/Album.ts`, `types/User.ts`, and `package.json`/`package-lock.json`.

- User profile documents are keyed by Firebase UID.
- Review and saved-for-later documents use composite UID/album IDs and are duplicated through per-user pointer subcollections. Writes use Firestore transactions and increment per-user counters.
- Existing IDs imply one review and one saved entry per user and album. Enforce this in SQL rather than retaining pointer records.
- Reads include user-scoped reviews and saved albums, recent reviews ordered/limited by timestamp, and review/favorite lookup by album.
- Deezer is the catalog/search/detail source; reviewed services do not persist the catalog.
- The app initializes Firebase Auth and Firestore. Supabase client/configuration, migrations, and local Supabase setup have not been added or verified.
- Supabase client compatibility with the app's Expo native/web targets, Firebase JWT handoff, and RLS behavior remain to be validated.

## Proposed relational model and access boundaries

Represent the following entities in versioned PostgreSQL migrations. Prefer conventional lowercase `snake_case` table and column names in SQL; map them to existing app types at the service boundary.

| Entity         | Proposed role                                                                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `users`        | Firebase UID as stable primary key; profile name, email, photo URL, and creation timestamp. No Supabase Auth identity is required.                     |
| `albums`       | Unique Deezer album ID and title, artist, and cover fields used by the app. Decide whether values are current metadata or a review/save-time snapshot. |
| `reviews`      | Required user and album foreign keys; rating, optional comment, server-managed timestamp; unique `(user_id, album_id)`.                                |
| `saved_albums` | Required user and album foreign keys; server-managed saved timestamp; unique `(user_id, album_id)`.                                                    |

Index user-scoped review/save reads by timestamp. Remove Firestore pointer records from the target model. Prefer derived counts if supported and efficient; otherwise maintain them transactionally and test consistency.

Enable RLS on every exposed table and define explicit policies for each permitted read and mutation. Use the authenticated JWT subject (`auth.uid()`) for owner-scoped policies, never caller-supplied UIDs. Confirm from the active Firestore rules and product owner whether profile and review reads should be private or public before defining policies. A screen or service accepting an arbitrary UID is not proof that data is intended to be public.

For local RLS tests, create a **local-only JWT fixture** signed with the local Supabase JWT secret, with `role: authenticated` and `sub` set to a known synthetic UID. Call the local Supabase API using the anon/publishable key and that JWT as the bearer token. Also test without a JWT and with a second UID. Never use the service-role key for owner-isolation tests because it bypasses RLS. Do not use production Firebase tokens or secrets as local fixtures.

### Future follows — explicitly out of scope

A future directed user-follow association can reference two user rows, enforce unique `(follower, followed)` pairs, and prohibit self-following. This migration must **not** create the follow table, expose follow queries/mutations, or add social UI/feed behavior. Decide privacy and feed semantics only if that feature is separately approved.

## Current blockers and safety gates

- Supabase CLI and Docker availability have not been verified. No Supabase migrations, seed data, local config, client, or service replacement has been added.
- No hosted Supabase project, region, or environment separation is established. Do not configure or target a hosted project before local acceptance and project-owner approval.
- Live Firestore documents, indexes, and security rules were not accessible. The two test users' counts, data consistency, visibility policy, and migration effort remain unknown.
- Test-data disposition is **assess first**. This is not permission to reset or delete data. Treat Firestore documents and Firebase Auth accounts as live and preserve them.
- Supabase local setup, SQL migrations, Firebase JWT/RLS behavior, app integration, and Expo native/web compatibility are not yet verified.
- Before relying on a hosted free tier, the project owner must review current quotas, inactivity/pausing behavior, backups/restore options, region availability, and expected usage.
- Preserve unrelated worktree changes.

## Ordered implementation tasks

**Execution order:** Task 1 and Task 2 may proceed in parallel. Task 3 requires both. Then complete Tasks 4, 5, and 6 against the local stack, in order. Task 7 is the hosted promotion and cutover gate. Do not configure or use hosted Supabase before Tasks 1–6 pass locally and the project owner approves.

### Task 1 — Create and verify the local Supabase environment

**Status:** Not started — CLI and Docker availability have not been checked.  
**Depends on:** None.

**Actions:**

1.  Check that Docker is installed and running. Select a compatible Supabase CLI version and document how developers obtain/use it; do not add unrelated app dependencies.
2.  Initialize the Supabase CLI project configuration in the repository, if approved as part of implementation. Keep local configuration and hosted secrets separate; commit no credentials.
3.  Start the local stack with the CLI (for example, `supabase start`) and verify its services/connection details using `supabase status`. Record the actual commands and required environment variables for the selected CLI version.
4.  Add a minimal health check or documented procedure proving local PostgreSQL and the Supabase API respond.
5.  Document how to stop the stack, create a versioned migration, apply migrations, reset **only the local** database, load seed data, and run database tests. Use the CLI's supported commands for the pinned version; make destructive local-only operations unmistakable.

**Deliverable:** Reproducible local Supabase setup instructions/configuration that do not require a hosted project.  
**Acceptance criteria:** A developer can start a clean local stack, verify PostgreSQL/API availability, apply a migration and seed data, reset the local database, and repeat successfully without touching hosted services.

### Task 2 — Inventory Firestore behavior and the two test users' records

**Status:** Blocked — live Firestore rules/data were not accessible. Nothing has been exported or modified.  
**Depends on:** Authorized read-only Firebase project access. This task can run in parallel with Task 1.

**Actions:**

1.  Read the active Firestore rules and record read/write visibility for profile, review, saved-album, and pointer documents.
2.  For only the two test UIDs, inventory profiles, global review/save documents, and per-user pointers. Avoid credentials and unrelated users' data.
3.  Record per-user/entity counts; compare pointer and global records; identify missing/orphaned pointers, duplicates/conflicts, absent timestamps, and profile-counter mismatches.
4.  If export is required, use an authorized, access-controlled process; record its location and access controls. Do not alter, delete, or “clean up” source records.
5.  Document the source document fields/IDs and conversion rules needed to map records to the proposed SQL entities. List unresolved ambiguities and migration risks for owner review.

**Deliverable:** Minimal, access-controlled inventory and access-rule summary for the two test accounts, including source-to-target mapping notes.  
**Acceptance criteria:** Counts, discrepancies, visibility behavior, and unresolved mapping/data decisions are documented; source data remains unchanged.

### Task 3 — Finalize the relational schema and local RLS policies

**Status:** Blocked — requires local stack and source/access findings.  
**Depends on:** Tasks 1 and 2.

**Actions:**

1.  Define `users` with Firebase UID as stable primary key and preserve profile fields currently consumed by the app.
2.  Decide whether `albums` stores current Deezer metadata or a review/save-time snapshot; record the chosen semantics.
3.  Define `reviews` and `saved_albums` with required user/album foreign keys, unique `(user_id, album_id)` constraints, server-managed timestamps, and indexes supporting user-scoped newest-first reads.
4.  Preserve rating/comment semantics. Decide whether counts are derived or maintained transactionally and document how consistency will be verified.
5.  Define table grants and RLS policies from Task 2's visibility findings. Use `auth.uid()` for user ownership; allow public access only when explicitly required and approved. Enable RLS on every app-exposed table.
6.  Write versioned SQL migrations and seed only synthetic local fixtures. Apply migrations to an empty local database; test constraints, policy access, and migration/reset repeatability.
7.  Do not add follows, Deezer catalog persistence, or a follow-related API/UI.

**Deliverable:** Reviewed SQL migrations, local seed data, documented schema decisions, and local RLS policies/tests.  
**Acceptance criteria:** Migrations apply cleanly to a fresh local database; foreign keys, uniqueness, timestamp ordering, grants, and owner/public access rules have passing tests; unresolved visibility/model decisions have owner approval.

### Task 4 — Verify local Firebase-token-shaped auth and Supabase client compatibility

**Status:** Blocked — requires Task 3's local schema and policies.  
**Depends on:** Task 3.

**Actions:**

1.  Test the local Supabase API with the Supabase JavaScript client using the local anon/publishable key.
2.  Create a local-only signed JWT fixture with `role: authenticated` and `sub` matching a synthetic user. Confirm policies return that user's rows and permit only allowed writes.
3.  Confirm unauthenticated requests cannot access owner-only rows and a second fixture UID cannot read or mutate the first user's records. Test any specifically approved public reads separately.
4.  Verify imports, token callback shape, refresh behavior, and bundling on supported Expo native and web targets. Check the installed Supabase client SDK and Firebase SDK APIs rather than assuming compatibility.
5.  Record which checks a local fixture cannot establish. Real Firebase token acceptance, hosted Firebase third-party-auth configuration, and hosted RLS must be verified in Task 7 before cutover.

**Deliverable:** Passing local client/RLS proof and documented Expo compatibility findings, with hosted-only checks listed.  
**Acceptance criteria:** Local signed-out, owner, and cross-user tests pass through the API; client imports/builds for supported targets; no service-role key is used in app tests.

### Task 5 — Build and rehearse the Firestore-to-PostgreSQL importer locally

**Status:** Blocked — requires approved inventory/mapping and target migrations.  
**Depends on:** Tasks 2 and 3.

**Actions:**

1.  Obtain explicit approval for preserve/reset disposition before exporting or importing user records. Until then, use synthetic fixtures only.
2.  Implement a repeatable, preferably idempotent transform/import for only the two approved UIDs. Map profile fields, reviews, saved albums, timestamps, and Deezer IDs. Convert pointer/global documents into one relational row per logical review/save.
3.  Define deterministic handling for missing fields, duplicate/conflicting records, invalid references, and counter mismatches. Do not silently discard or choose conflicting values; report exceptions for approval.
4.  Protect exports and local import files as sensitive data, keep them out of git, and document cleanup/retention. Use trusted local administrative tooling; do not embed Firebase Admin or Supabase service-role credentials in the app.
5.  Run the importer against a resettable local database. Run it a second time to prove repeatability and exercise failure/restart behavior.
6.  Reconcile source and target counts by UID/entity; compare representative records and IDs/timestamps; verify foreign keys, uniqueness, expected counters, and exception reports. Obtain approval for any exclusions or corrections.

**Deliverable:** Repeatable local importer/rehearsal instructions and a reconciliation report for the approved fixture or test-user data.  
**Acceptance criteria:** Re-running import produces no unintended duplicates; source/target counts and representative values match the approved mapping; all discrepancies are explained and approved; Firestore remains unchanged.

### Task 6 — Replace Firestore app operations and validate locally

**Status:** Blocked — requires local client proof and a passing import rehearsal. No app services have been changed.  
**Depends on:** Tasks 4 and 5.

**Actions:**

1.  Configure the Supabase JavaScript client for the local endpoint and anon/publishable key. Never include a service-role key in the app.
2.  Supply the current Firebase ID token using the Supabase client's supported access-token mechanism. Retain Firebase Auth, existing UIDs, and login/logout flows. Do not change identity providers.
3.  Replace Firestore calls in profile, review, save-for-later, and album status services with Supabase operations for profile upsert/read, review upsert/read/list/recent, and saved-album upsert/list.
4.  Preserve public service return types where possible; update types deliberately where SQL results differ. Update React Query keys/invalidation and UI error handling. Keep Deezer service usage unchanged.
5.  Test signed-out rejection, cross-user isolation, approved visibility, duplicate review/save upserts, foreign keys, timestamp ordering, counters, errors, and import-loaded data.
6.  Run focused tests, TypeScript, lint, and Expo native/web checks applicable to the changes. Record platform checks that require a device or hosted credentials.
7.  Leave Firestore configuration/source available for rollback.

**Deliverable:** Supabase-backed app service layer working against local Supabase with focused test/build evidence.  
**Acceptance criteria:** Relevant flows work locally for both test users (or approved synthetic equivalents); authorization and data behavior pass; Firestore remains available and unchanged.

### Task 7 — Promote to hosted Supabase, verify, cut over, then consider Firestore retirement

**Status:** Blocked — local acceptance and project-owner approval are prerequisites. No hosted migration or retirement has occurred.  
**Depends on:** Tasks 1–6 passing locally and explicit project-owner approval.

**Actions:**

1.  Confirm the Supabase project, staging/production separation, region, authorized access, billing plan, and production readiness with the project owner. Review current free-tier quotas, inactivity/pausing, backups/restore, and expected usage; do not assume free-tier suitability.
2.  Configure Supabase's hosted Firebase third-party-auth integration. Provision the `authenticated` custom claim for existing and future Firebase users only through a trusted Firebase Admin environment. Test real Firebase ID tokens and token refresh against hosted RLS using non-production records.
3.  Apply the exact migrations already tested locally to an approved hosted development/staging project. Use separate endpoints/credentials per environment; keep service-role keys in trusted administrative environments only.
4.  Before importing live records, confirm explicit preserve/reset approval and local rehearsal acceptance. Import only the approved UIDs, then reconcile counts and representative records again. Preserve Firestore as an untouched rollback source.
5.  Test login/relogin, profile rendering, review creation/update/retrieval, saved-album creation/listing, and logout for both users. Verify owner isolation, public/private visibility, uniqueness, ordering, counts, errors, and data reconciliation.
6.  Write cutover and rollback instructions covering configuration, migration commands, Firebase token integration, health checks, Firestore retention/fallback, abort conditions, and recovery responsibilities.
7.  Search the repository for all remaining Firestore calls. Remove Firestore persistence/configuration/dependency only after cutover is accepted, validations pass, rollback retention is no longer needed, and retirement is explicitly approved as a separate change.
8.  Preserve Firebase Authentication and Deezer integrations.

**Deliverable:** Hosted verification evidence, approved cutover/rollback checklist, and only later a separately reviewable Firestore retirement change.  
**Acceptance criteria:** No hosted setup or real-data import precedes local acceptance; real Firebase JWT/RLS checks and both users' agreed scenarios pass; reconciliation and rollback readiness are recorded; cutover and any retirement are explicitly approved.

### Deferred design note — future following

**Status:** Out of scope. If separately approved, design a directed relationship with unique `(follower, followed)` pairs, no self-following, access/privacy rules, and feed behavior. Do not create the table or feature as part of Tasks 1–7.

## Scope exclusions

- No follow table or user-follow/follower feature.
- No persistence of Deezer search, chart, or catalog data.
- No app-owned backend.
- No change from Firebase Auth to Supabase Auth.
- No deletion/reset of Firestore or Firebase Auth data without explicit informed approval.
- No hosted Supabase setup or real-data import before local schema, RLS, application, and migration-rehearsal acceptance.
