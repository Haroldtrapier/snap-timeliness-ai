# Supabase schema

This directory is the **version-controlled source of truth** for the SNAP AI
database. Until now the schema lived only inside the hosted Supabase project;
these migrations reconstruct it from the queries in `lib/repositories.ts`, the
server actions in `app/app/**/actions.ts`, the reminders cron
(`app/api/cron/reminders/route.ts`), and `lib/auth.ts`.

## What's here

`migrations/` (applied in filename order):

| File | Contents |
|------|----------|
| `…090000_extensions_and_enums.sql` | `pgcrypto`/`uuid-ossp`; enums `user_type`, `snap_stage`, `note_visibility`, `reminder_channel`, `notice_urgency` |
| `…090100_core_tables.sql` | 15 tables: `profiles`, `organizations`, `organization_members`, `clients`, `household_members`, `snap_cases`, `application_checklists`, `checklist_items`, `documents`, `deadlines`, `reminders`, `notices`, `notice_explanations`, `case_notes`, `audit_log` |
| `…090200_functions.sql` | RLS helpers (`is_admin`, `is_owner_of_client`, `is_org_member_of_client`) and RPCs (`find_or_create_county_org`, `grant_org_membership`, `revoke_org_membership`, `log_audit`) |
| `…090300_rls.sql` | Row-level security enabled + policies on every table |
| `…090400_storage.sql` | Private `snap-documents` bucket + object policies (path `<auth_uid>/<client_id>/…`) |

## Access model

- **Applicants** own their `clients` row and everything hanging off it
  (`is_owner_of_client`).
- **Caseworkers** reach a client's data through organization membership
  (`is_org_member_of_client`).
- **Admins** (`profiles.user_type = 'admin'`) can read org / membership /
  profile data for the admin console; membership grants/revokes go through the
  `SECURITY DEFINER` RPCs.
- The reminders **cron uses the service-role key** and bypasses RLS.

## Applying the migrations

### Option A — Supabase CLI (recommended)

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

### Option B — SQL editor

Paste each file in `migrations/` into the Supabase SQL editor **in filename
order** and run it. The files are idempotent where practical (`if not exists`,
`on conflict do nothing`, `create or replace`), so re-running is safe.

## After applying

Set the environment variables from `.env.example` (Supabase URL + anon key,
service-role key for the cron, `ANTHROPIC_API_KEY` for the notice explainer).
With those present the app switches from demo fixtures to the real backend
automatically (`lib/supabase/config.ts` → `isSupabaseConfigured`).

## Caveats / follow-ups

- **Reconstructed, not migrated from prod.** If a live Supabase project already
  has these tables, diff before applying — column types here are inferred from
  usage and may differ from what's deployed. Treat the first apply against an
  existing project as a review step, not a blind push.
- These migrations create schema only; they contain **no seed data**. Sample
  data still lives in `lib/data.ts` and is used only as a demo fallback.
- `checklist_items.status` and `documents.status` are `text` (not enums) on
  purpose — the read-side mapping in `lib/repositories.ts` tolerates a wide
  range of values.
