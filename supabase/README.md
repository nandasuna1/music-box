# Supabase workflow

This repository uses a remote-only Supabase workflow for hosted development. The app keeps Firebase Auth and existing Firebase UID values; Prisma remains the schema and migration authoring layer, while the Supabase CLI is used only for project operations, remote verification, and migration checks.

## Required tool version

Use the CLI version explicitly verified for this repository:

```bash
npx --yes supabase@2.120.0 --version
```

Do not use Docker-based local Supabase commands on this Mac. Local stack commands such as `supabase start`, `supabase db reset`, or other Docker-dependent flows are out of scope for this repository's approved workflow.

## Authentication and project targeting

Before any hosted project use, obtain project-owner approval for a dedicated non-production Supabase project and record the project metadata separately from source control.

```bash
npx --yes supabase@2.120.0 login
npx --yes supabase@2.120.0 link --project-ref <project-ref>
```

The project reference must be verified before every migration or remote check. Never hardcode production or developer secrets into the repository, logs, or issue text.

## Remote migration workflow

Use Prisma as the source of truth for the schema and migration history, and use Supabase CLI for remote verification and project-level operations.

```bash
# Preview the current remote schema against the local migration state
npx --yes supabase@2.120.0 db diff --linked

# Apply a reviewed migration to the approved development project
npx --yes supabase@2.120.0 db push
```

If the selected CLI version supports a preview or dry-run mode for a migration, use it before applying any change. Always review the proposed schema and project reference before mutating a hosted database.

## Prisma and hosted database configuration

Keep the Prisma schema in `prisma/schema.prisma` and use project-scoped environment values only in a local secret store or environment file that is excluded from source control.

```bash
# Example environment variables; keep actual values in approved secret storage
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
```

The app must never contain a Supabase service-role key. The client may only use the publishable/anon key and a Firebase ID token via the supported auth callback flow.

## Local stack restrictions

The following commands are not part of this workflow and must not be used here:

- `supabase start`
- `supabase stop`
- `supabase db reset`
- local Docker-dependent database resets or schema seeding against a developer machine

If a task requires a database reset or clean state, use a separate disposable non-production project or an explicitly reviewed hosted cleanup process, never a destructive command against a shared hosted project.

## Safety notes

- Keep hosted project access restricted to approved maintainers.
- Use synthetic records for development and testing.
- Do not import real user data or production data without explicit approval.
- Keep all environment-specific tokens out of git.
- Treat any dashboard change as an exception: capture it as a reviewed migration before continuing.

## Current status

This repository is scaffolded for the remote-only Supabase workflow, but it is not linked to a hosted Supabase development project yet. Project provisioning remains blocked until project-owner approval is received.
