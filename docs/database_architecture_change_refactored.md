# Database Architecture Change: Firestore to Supabase PostgreSQL

## Status

**Task 1 started: CLI verification and repository scaffolding are complete; hosted project provisioning remains blocked by project-owner approval.** This document records the recommendation, review findings, prerequisites, and implementation tasks. No Firestore records, Firebase Authentication accounts, application services, or hosted Supabase project configuration have been changed.

## Recommendation

Move app-owned persisted data from Firestore to **Supabase PostgreSQL**, retain **Firebase Authentication** and existing Firebase UIDs, and use the Supabase JavaScript client in the app. Use **Prisma as the schema and migration layer**, while keeping the database itself in Supabase and the app access path in the Supabase client plus Firebase-backed JWT auth. Do not add an app-owned backend.

Because this Mac cannot run Docker, use a **dedicated hosted Supabase development project** for schema, authorization, migration rehearsal, and app integration testing. This replaces the Docker-based local Supabase stack; it does not replace Supabase with another database. Supabase CLI can be used for project linking and remote checks, and Prisma can manage the relational schema and migration history against the hosted project via environment credentials. Do not run local-stack commands such as `supabase start` or `supabase db reset` on this machine. If hosted development access is not approved or available, pause hosted database integration work; do not use production or assume an unverified local substitute is equivalent.

Keep development, staging, and production projects separate. Use synthetic records in hosted development. Do not import real user data or connect the app to production until the required approvals and acceptance gates below pass. Hosted development has network, quota, billing, and data-retention implications; the project owner must approve the project and review its current terms and operational limits before provisioning it.

SQL fits profiles, reviews, and saved albums because they belong to users, reference albums, and need uniqueness, filtering, ordering, and relational integrity. PostgreSQL foreign keys, unique constraints, indexes, and transactions express these requirements directly. The current Firestore implementation duplicates records/pointer documents and transactionally maintains profile counters.

Changing authentication is **not required** to use Supabase PostgreSQL. Keeping Firebase Auth avoids an unnecessary identity-provider change and account migration. Supabase supports Firebase Auth as a third-party JWT provider. For hosted use, configure the Firebase project as a Supabase third-party auth provider, supply Firebase ID tokens to the Supabase client, and ensure tokens carry the `authenticated` role claim. Provision custom claims only through a trusted Firebase Admin environment. Never include Firebase Admin credentials or a Supabase service-role key in the app.

Keep Deezer as the source for album search, charts, discovery, and album details; these data do not currently need SQL persistence. Keep Firestore intact throughout development, hosted cutover, and the agreed rollback period. Do not delete or modify source data as part of assessment or import.

## Review findings

Reviewed `services/firebase.ts`, `services/album/*`, `services/reviews/*`, `services/saveForLater/*`, `services/user/*`, their login/profile/album-screen callers, `types/Album.ts`, `types/User.ts`, and `package.json`/`package-lock.json`.

- User profile documents are keyed by Firebase UID.
- Review and saved-for-later documents use composite UID/album IDs and are duplicated through per-user pointer subcollections. Writes use Firestore transactions and increment per-user counters.
- Existing IDs imply one review and one saved entry per user and album. Enforce this in SQL rather than retaining pointer records.
- Reads include user-scoped reviews and saved albums, recent reviews ordered/limited by timestamp, and review/favorite lookup by album.
- Deezer is the catalog/search/detail source; reviewed services do not persist the catalog.
- The app initializes Firebase Auth and Firestore. Supabase client/configuration, migrations, and hosted development setup have not been added or verified.
- Supabase client compatibility with the app's Expo native/web targets, Firebase JWT handoff, and RLS behavior remain to be validated.

## Proposed relational model and access boundaries

Represent the following entities in the Prisma schema and in versioned PostgreSQL migrations. Prefer conventional lowercase `snake_case` table and column names in SQL when the Prisma schema is translated or when RLS-specific SQL is required; map them to existing app types at the service boundary.

| Entity | Proposed role |
| --- | --- |
| `users` | Firebase UID as stable primary key; profile name, email, photo URL, and creation timestamp. No Supabase Auth identity is required. Store Firebase UIDs as text unless testing proves a UUID representation is appropriate. |
| `albums` | Unique Deezer album ID and title, artist, and cover fields used by the app. Decide whether values are current metadata or a review/save-time snapshot. |
| `reviews` | Required user and album foreign keys; rating, optional comment, server-managed timestamp; unique `(user_id, album_id)`. |
| `saved_albums` | Required user and album foreign keys; server-managed saved timestamp; unique `(user_id, album_id)`. |

Index user-scoped review/save reads by timestamp. Remove Firestore pointer records from the target model. Prefer derived counts if supported and efficient; otherwise maintain them transactionally and test consistency.

Enable RLS on every exposed table and define explicit grants and policies for each permitted read and mutation. Policies must bind ownership to the trusted Firebase JWT subject, not caller-supplied UIDs. Firebase UIDs are not necessarily UUIDs, so do **not** assume `auth.uid()` is type-compatible; verify the token and column types and use an appropriate text comparison (for example, the JWT `sub` claim) or an explicitly approved stable mapping. Confirm from active Firestore rules and the product owner whether profile and review reads should be private or public before defining policies. A screen or service accepting an arbitrary UID is not proof that data is intended to be public.

For hosted RLS tests, use the anon/publishable key and Firebase tokens from approved non-production test accounts configured for the development Supabase project. Test signed-out requests, owner access, cross-user isolation, and any specifically approved public access. Do not use a service-role key for owner-isolation tests because it bypasses RLS. Do not use production tokens as test fixtures. Verify the Firebase project's issuer/audience and the `authenticated` role claim as part of the integration test.

### Future follows — explicitly out of scope

A future directed user-follow association can reference two user rows, enforce unique `(follower, followed)` pairs, and prohibit self-following. This migration must **not** create the follow table, expose follow queries/mutations, or add social UI/feed behavior. Decide privacy and feed semantics only if that feature is separately approved.

## Development workflow without Docker

1. Obtain project-owner approval for a **non-production hosted Supabase development project** before provisioning or using it. Confirm region, access control, billing/quotas, backups/restore, inactivity behavior, and expected usage.
2. Keep the schema in reviewed, versioned migration files in the repository. Use the Supabase CLI to create migrations and, after confirming the selected CLI version's remote-only behavior, link to the development project and apply migrations there. Use a dry run where supported and verify the linked project reference before every apply.
3. Do not treat Dashboard edits as the source of truth. If an emergency Dashboard change is explicitly approved, capture it as a reviewed migration immediately and reconcile it before continuing.
4. Run database checks against the dedicated development project with synthetic data and targeted cleanup. Use the hosted project's normal API with non-production Firebase test accounts for RLS behavior. Use an approved SQL client or migration/test runner for constraint and integrity checks; do not assume a remote API test covers every database-level case.
5. The CLI's local-stack commands, local database reset, and tests that depend on the local Supabase stack are unavailable on this Mac. Never run destructive commands against a hosted project as a substitute for a local reset. If a clean database is needed, use a separate disposable non-production project or an explicitly reviewed, narrowly scoped cleanup plan.
6. Keep access tokens, database passwords, and administrative credentials out of source control, logs, app bundles, and issue text. Use per-developer CLI authentication and an approved secret store for automation. The client may contain only the project's publishable/anon key; it must never contain the service-role key.

## Current blockers and safety gates

- Docker and the Supabase CLI are not prerequisites for the selected workflow, but the CLI version and remote migration commands have not been verified. No Supabase migrations, hosted development project, client, or service replacement has been added.
- A hosted non-production project, region, environment separation, access policy, and budget approval are not established. Do not provision or use a hosted project before project-owner approval.
- Live Firestore documents, indexes, and security rules were not accessible. The two test users' counts, data consistency, visibility policy, and migration effort remain unknown.
- Test-data disposition is **assess first**. This is not permission to reset, copy, or delete data. Treat Firestore documents and Firebase Auth accounts as live and preserve them.
- Supabase hosted setup, SQL migrations, Firebase JWT/RLS behavior, app integration, Expo native/web compatibility, and remote test procedures are not yet verified.
- Before relying on a hosted free tier, the project owner must review current quotas, inactivity/pausing behavior, backups/restore options, region availability, and expected usage.
- Hosted development sends test traffic and data over the network and is subject to the provider's availability and policies. Use synthetic data by default; obtain explicit approval before any real user data is transferred.
- Preserve unrelated worktree changes.

## Ordered implementation tasks

**Execution order:** Task 1 and Task 2 may proceed in parallel. Task 3 requires both. Tasks 4 and 5 require Task 3 and may proceed in parallel. Task 6 requires Tasks 4 and 5. Task 7 requires Tasks 1–6 to pass and explicit project-owner approval. No production setup, production data import, or cutover may precede those gates.

### Task 1 — Establish the hosted non-production Supabase development environment

**Status:** In progress — the Supabase CLI was verified and the repository scaffold was initialized; hosted project provisioning remains blocked on project-owner approval.  
**Depends on:** Project-owner approval for a hosted non-production environment; otherwise blocked. Independent of Task 2.

**Progress to date:**
- Verified the remote-only CLI path works without Docker: `npx --yes supabase@2.120.0 --version`.
- Initialized the repository's Supabase structure with `npx --yes supabase init` under `supabase/`.
- Created a CLI workflow document at `supabase/README.md` and a secrets placeholder file at `supabase/.env.example`.
- No hosted project reference, credentials, or destructive database commands were added.

**Actions:**

1. Confirm approval to provision/use a dedicated development project. Record its owner, region, access controls, billing/quotas, backups/restore, retention expectations, and separation from production. Do not use a production project for development.
2. Select and document a supported Supabase CLI version and installation method. Verify project linking and remote migration/preview commands for that version without starting a local stack. Record the exact commands and required secrets, but never record secret values. Use Prisma for the schema and migration history, and keep Supabase CLI for project operations, checks, and remote verification.
3. Initialize the repository's Supabase migration structure if approved. Keep environment-specific project references and hosted secrets out of application source and separate from production credentials. Keep the Prisma schema in `prisma/schema.prisma` as the authoritative declarative model for the relational layer.
4. Link only to the approved development project. Before applying any migration, verify the target project reference and review the proposed changes. Use a dry run where supported, then apply only reviewed migrations to development. For Prisma, use the approved remote `DATABASE_URL`/`DIRECT_URL` values and the corresponding migration/deploy commands for the active project.
5. Document how developers authenticate to the CLI, create or update the Prisma schema, preview/apply migrations remotely, verify schema/API availability, run hosted tests with synthetic fixtures, and clean up only their own test records. Clearly mark any command that can mutate or delete hosted data.
6. Document that local-stack operations (`supabase start`, local `db reset`, and other Docker-dependent commands) are not part of this workflow. If a task depends on an unavailable local-only command, define and approve a safe hosted alternative before proceeding.

**Deliverable:** Approved, access-controlled hosted development project and reproducible remote migration/test workflow that does not require a local container runtime.  
**Acceptance criteria:** A developer can authenticate to the CLI, target only the approved development project, preview and apply a reviewed migration, verify the hosted database/API, run synthetic-data checks, and repeat without touching production or requiring Docker.

### Task 2 — Inventory Firestore behavior and the two test users' records

**Status:** Blocked — live Firestore rules/data were not accessible. Nothing has been exported or modified.  
**Depends on:** Authorized read-only Firebase project access. This task can run in parallel with Task 1.

**Actions:**

1. Read the active Firestore rules and record read/write visibility for profile, review, saved-album, and pointer documents.
2. For only the two test UIDs, inventory profiles, global review/save documents, and per-user pointers. Avoid credentials and unrelated users' data.
3. Record per-user/entity counts; compare pointer and global records; identify missing/orphaned pointers, duplicates/conflicts, absent timestamps, and profile-counter mismatches.
4. If export is required, use an authorized, access-controlled process; record its location and access controls. Do not alter, delete, or “clean up” source records. Do not upload real records to hosted development without explicit approval.
5. Document the source document fields/IDs and conversion rules needed to map records to the proposed SQL entities. List unresolved ambiguities and migration risks for owner review.

**Deliverable:** Minimal, access-controlled inventory and access-rule summary for the two test accounts, including source-to-target mapping notes.  
**Acceptance criteria:** Counts, discrepancies, visibility behavior, and unresolved mapping/data decisions are documented; source data remains unchanged.

### Task 3 — Finalize the relational schema and hosted development RLS policies

**Status:** Blocked — requires Task 1's approved development project and Task 2's source/access findings.  
**Depends on:** Tasks 1 and 2.

**Actions:**

1. Define `users` with Firebase UID as stable primary key and preserve profile fields currently consumed by the app. Confirm the Firebase UID's actual format and choose a compatible SQL type; do not assume it is a UUID.
2. Decide whether `albums` stores current Deezer metadata or a review/save-time snapshot; record the chosen semantics.
3. Define `reviews` and `saved_albums` with required user/album foreign keys, unique `(user_id, album_id)` constraints, server-managed timestamps, and indexes supporting user-scoped newest-first reads. Express the model in Prisma first, then emit the matching SQL or migration file required by the hosted project.
4. Preserve rating/comment semantics. Decide whether counts are derived or maintained transactionally and document how consistency will be verified.
5. Define table grants and RLS policies from Task 2's visibility findings. Bind owner checks to the trusted JWT subject using a type-safe comparison compatible with Firebase UIDs. Allow public access only when explicitly required and approved. Enable RLS on every app-exposed table.
6. Write Prisma-backed schema changes and corresponding versioned SQL migration artifacts, then apply them to the development project through the verified remote workflow. Seed synthetic fixtures only. Test constraints, grants, policies, migration ordering, and repeatable deployment using non-destructive hosted procedures.
7. Do not add follows, Deezer catalog persistence, or a follow-related API/UI.

**Deliverable:** Reviewed SQL migrations, synthetic hosted fixtures, documented schema decisions, and hosted RLS policies/tests.  
**Acceptance criteria:** Migrations apply cleanly to the development project; foreign keys, uniqueness, timestamp ordering, grants, and owner/public access rules have passing tests; unresolved visibility/model decisions have owner approval.

### Task 4 — Verify hosted Firebase-token auth, RLS, and Supabase client compatibility

**Status:** Blocked — requires Task 3's hosted schema and policies.  
**Depends on:** Task 3. May proceed in parallel with Task 5.

**Actions:**

1. Configure Firebase as a third-party auth provider on the non-production Supabase project. Use the Supabase JavaScript client with its publishable/anon key and the current Firebase ID token through the SDK's supported access-token callback.
2. Use approved non-production Firebase test accounts, not production user tokens or fabricated production credentials. Ensure test tokens have the required `role: authenticated` claim; provision claims only through a trusted Firebase Admin environment. Verify claim refresh behavior after sign-up or claim updates.
3. Exercise requests through the hosted Supabase API: signed out, owner, second test UID, and any explicitly approved public-read case. Confirm owner-only reads/writes, cross-user isolation, permitted public reads, and that service-role credentials are not used by the app or RLS tests.
4. Verify Firebase issuer/audience acceptance and the JWT subject mapping against actual Firebase UID formats. Confirm profile and row-level owner checks do not depend on an incompatible `auth.uid()` UUID cast.
5. Verify Supabase client imports, token callback shape, refresh behavior, and bundling on supported Expo native and web targets. Check installed Supabase/Firebase SDK APIs rather than assuming compatibility.
6. Record limitations of hosted non-production tests. Production Firebase token acceptance, production policies/configuration, and production cutover still require Task 7's separate verification.

**Deliverable:** Passing hosted non-production client/RLS proof and documented Expo compatibility findings, with production-only checks listed.  
**Acceptance criteria:** Signed-out, owner, and cross-user tests pass through the hosted API using non-production Firebase accounts; app client bundles for supported targets; no service-role key is used in app tests.

### Task 5 — Build and rehearse the Firestore-to-PostgreSQL importer against development

**Status:** Blocked — requires approved inventory/mapping and target migrations.  
**Depends on:** Tasks 2 and 3. May proceed in parallel with Task 4.

**Actions:**

1. Obtain explicit approval for preserve/reset disposition before exporting or importing user records. Until then, use synthetic fixtures only.
2. Implement a repeatable, preferably idempotent transform/import for only the two approved UIDs. Map profile fields, reviews, saved albums, timestamps, and Deezer IDs. Convert pointer/global documents into one relational row per logical review/save.
3. Define deterministic handling for missing fields, duplicate/conflicting records, invalid references, and counter mismatches. Do not silently discard or choose conflicting values; report exceptions for approval.
4. Protect exports and import files as sensitive data. Keep them out of git, logs, and hosted development unless explicitly approved. Document encrypted storage, access controls, retention, and cleanup. Use trusted administrative tooling; do not embed Firebase Admin or Supabase service-role credentials in the app.
5. Rehearse first with synthetic fixtures in the hosted development project. Run the importer twice to prove repeatability and exercise failure/restart behavior. Do not use broad reset commands against a shared hosted project.
6. If real test-user data is later explicitly approved for hosted rehearsal, limit it to approved UIDs and fields, minimize retention, use a restricted project, and document who authorized the transfer. Reconcile source and target counts by UID/entity; compare representative records and IDs/timestamps; verify foreign keys, uniqueness, expected counters, and exception reports. Obtain approval for any exclusions or corrections.

**Deliverable:** Repeatable importer and hosted development rehearsal instructions, plus reconciliation evidence for synthetic fixtures or explicitly approved test-user data.  
**Acceptance criteria:** Re-running import produces no unintended duplicates; source/target counts and representative values match the approved mapping; all discrepancies are explained and approved; Firestore remains unchanged.

### Task 6 — Replace Firestore app operations and validate against hosted development

**Status:** Blocked — requires hosted client proof and a passing import rehearsal. No app services have been changed.  
**Depends on:** Tasks 4 and 5.

**Actions:**

1. Configure the Supabase JavaScript client for the hosted development endpoint and publishable/anon key using the app's existing environment/configuration conventions. Never include a service-role key in the app. Keep Prisma for schema and migration authoring, but use Supabase JS in the client-facing app layer.
2. Supply the current Firebase ID token using the Supabase client's supported access-token mechanism. Retain Firebase Auth, existing UIDs, and login/logout flows. Do not change identity providers.
3. Replace Firestore calls in profile, review, save-for-later, and album status services with Prisma-backed or Supabase-backed operations for profile upsert/read, review upsert/read/list/recent, and saved-album upsert/list.
4. Preserve public service return types where possible; update types deliberately where SQL results differ. Update React Query keys/invalidation and UI error handling. Keep Deezer service usage unchanged.
5. Test signed-out rejection, cross-user isolation, approved visibility, duplicate review/save upserts, foreign keys, timestamp ordering, counters, errors, and imported synthetic data against the non-production project.
6. Run focused tests, TypeScript, lint, and Expo native/web checks applicable to the changes. Record platform checks that require a device or hosted credentials. Make hosted dependencies and required network access clear to developers.
7. Leave Firestore configuration/source available for rollback.

**Deliverable:** Supabase-backed app service layer working against hosted development with focused test/build evidence.  
**Acceptance criteria:** Relevant flows work in the hosted non-production environment for both approved test accounts (or approved synthetic equivalents); authorization and data behavior pass; Firestore remains available and unchanged.

### Task 7 — Promote to production, verify, cut over, then consider Firestore retirement

**Status:** Blocked — Tasks 1–6 and explicit project-owner approval are prerequisites. No production migration or retirement has occurred.  
**Depends on:** Tasks 1–6 passing and explicit project-owner approval.

**Actions:**

1. Confirm the production Supabase project, staging/production separation, region, authorized access, billing plan, backup/restore, and production readiness with the project owner. Review current quotas, inactivity/pausing, backups/restore, and expected usage; do not assume free-tier suitability.
2. Configure the hosted production Supabase Firebase third-party-auth integration. Provision the `authenticated` custom claim for existing and future Firebase users only through a trusted Firebase Admin environment. Test real Firebase ID tokens, subject mapping, and RLS using approved non-production/test accounts before any production user data is loaded.
3. Apply the exact migrations already tested in development to an approved staging/production project through the reviewed remote migration workflow. Verify the target project reference and migration preview before applying. Use separate endpoints and credentials per environment; keep service-role keys in trusted administrative environments only.
4. Before importing live records, confirm explicit preserve/reset approval and successful rehearsal. Import only approved UIDs and fields, then reconcile counts and representative records again. Preserve Firestore as an untouched rollback source.
5. Test login/relogin, profile rendering, review creation/update/retrieval, saved-album creation/listing, and logout for both users. Verify owner isolation, approved public/private visibility, uniqueness, ordering, counts, errors, and data reconciliation.
6. Write cutover and rollback instructions covering configuration, migration procedure, Firebase token integration, health checks, Firestore retention/fallback, abort conditions, and recovery responsibilities.
7. Search the repository for all remaining Firestore calls. Remove Firestore persistence/configuration/dependency only after cutover is accepted, validations pass, rollback retention is no longer needed, and retirement is explicitly approved as a separate change.
8. Preserve Firebase Authentication and Deezer integrations.

**Deliverable:** Hosted verification evidence, approved cutover/rollback checklist, and only later a separately reviewable Firestore retirement change.  
**Acceptance criteria:** No production setup or real-data import precedes development acceptance and owner approval; real Firebase JWT/RLS checks and both users' agreed scenarios pass; reconciliation and rollback readiness are recorded; cutover and any retirement are explicitly approved.

### Deferred design note — future following

**Status:** Out of scope. If separately approved, design a directed relationship with unique `(follower, followed)` pairs, no self-following, access/privacy rules, and feed behavior. Do not create the table or feature as part of Tasks 1–7.

## Scope exclusions

- No follow table or user-follow/follower feature.
- No persistence of Deezer search, chart, or catalog data.
- No app-owned backend.
- No change from Firebase Auth to Supabase Auth.
- No deletion/reset of Firestore or Firebase Auth data without explicit informed approval.
- No use of a production Supabase project for development or testing.
- No hosted Supabase project provisioning or real-data transfer before project-owner approval and the required acceptance gates.
- No Docker-based local Supabase stack as a prerequisite for development on this Mac.

## References

- [Supabase: Firebase Auth third-party integration](https://supabase.com/docs/guides/auth/third-party/firebase-auth)
- [Supabase: Database migrations](https://supabase.com/docs/guides/deployment/database-migrations)
- [Supabase: Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
