-- 20260718090100_core_tables.sql
--
-- Core tables. Column names and types are taken directly from the queries in
-- lib/repositories.ts and the inserts/updates in app/app/**/actions.ts. Ordering
-- columns referenced in code (created_at, generated_at, uploaded_at, due_at,
-- filed_at, decided_at) are all present with sensible defaults.

-- ------------------------------------------------------------------
-- profiles — one row per auth user. Provisioned on first visit by
-- lib/auth.ts getSession() (no auth.users trigger, by design).
-- ------------------------------------------------------------------
create table if not exists profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text,
  full_name  text,
  user_type  user_type not null default 'applicant',
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------------
-- organizations — county/state DSS offices. Created via the
-- find_or_create_county_org RPC (onboarding + admin).
-- ------------------------------------------------------------------
create table if not exists organizations (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  state      text,
  county     text,
  created_at timestamptz not null default now(),
  unique (state, county)
);

-- ------------------------------------------------------------------
-- organization_members — which caseworkers belong to which org.
-- Managed by grant_org_membership / revoke_org_membership RPCs.
-- ------------------------------------------------------------------
create table if not exists organization_members (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  user_id         uuid not null references auth.users (id) on delete cascade,
  role            text not null default 'worker',
  created_at      timestamptz not null default now(),
  unique (organization_id, user_id)
);

-- ------------------------------------------------------------------
-- clients — an applicant's case-holder record, owned by the auth user.
-- ------------------------------------------------------------------
create table if not exists clients (
  id              uuid primary key default gen_random_uuid(),
  owner_user_id   uuid not null references auth.users (id) on delete cascade,
  organization_id uuid references organizations (id) on delete set null,
  full_name       text not null,
  state           text,
  county          text,
  language        text not null default 'en',
  created_at      timestamptz not null default now()
);
create index if not exists clients_owner_idx on clients (owner_user_id);
create index if not exists clients_org_idx on clients (organization_id);

-- ------------------------------------------------------------------
-- household_members — used for the minor count on the applicant case.
-- ------------------------------------------------------------------
create table if not exists household_members (
  id           uuid primary key default gen_random_uuid(),
  client_id    uuid not null references clients (id) on delete cascade,
  full_name    text,
  relationship text,
  is_minor     boolean not null default false,
  created_at   timestamptz not null default now()
);
create index if not exists household_members_client_idx on household_members (client_id);

-- ------------------------------------------------------------------
-- snap_cases — a SNAP application/case for a client. Timeliness analytics
-- (getAgencyCaseload / getAgencyReports) are computed from filed_at/decided_at.
-- ------------------------------------------------------------------
create table if not exists snap_cases (
  id                  uuid primary key default gen_random_uuid(),
  client_id           uuid not null references clients (id) on delete cascade,
  stage               snap_stage not null default 'applying',
  household_size      integer,
  monthly_income_cents integer,
  expedited           boolean not null default false,
  filed_at            timestamptz,
  decided_at          timestamptz,
  created_at          timestamptz not null default now()
);
create index if not exists snap_cases_client_idx on snap_cases (client_id);
create index if not exists snap_cases_filed_idx on snap_cases (filed_at);

-- ------------------------------------------------------------------
-- application_checklists — one per case (newest used). generated_at ordered.
-- ------------------------------------------------------------------
create table if not exists application_checklists (
  id           uuid primary key default gen_random_uuid(),
  case_id      uuid not null references snap_cases (id) on delete cascade,
  generated_at timestamptz not null default now()
);
create index if not exists application_checklists_case_idx on application_checklists (case_id);

-- ------------------------------------------------------------------
-- checklist_items — required/optional documents. status is free text:
-- writes use 'open' / 'provided'; the read mapping tolerates more.
-- ------------------------------------------------------------------
create table if not exists checklist_items (
  id           uuid primary key default gen_random_uuid(),
  checklist_id uuid not null references application_checklists (id) on delete cascade,
  label        text not null,
  category     text not null default 'General',
  required     boolean not null default false,
  status       text not null default 'open',
  notes        text,
  created_at   timestamptz not null default now()
);
create index if not exists checklist_items_checklist_idx on checklist_items (checklist_id);

-- ------------------------------------------------------------------
-- documents — uploaded files (stored in the snap-documents bucket).
-- status: 'uploaded' -> 'verified' | 'changes_requested'.
-- ------------------------------------------------------------------
create table if not exists documents (
  id                uuid primary key default gen_random_uuid(),
  client_id         uuid not null references clients (id) on delete cascade,
  case_id           uuid references snap_cases (id) on delete set null,
  checklist_item_id uuid references checklist_items (id) on delete set null,
  storage_path      text not null,
  original_name     text,
  mime_type         text,
  size_bytes        bigint,
  status            text not null default 'uploaded',
  uploaded_by       uuid references auth.users (id) on delete set null,
  uploaded_at       timestamptz not null default now()
);
create index if not exists documents_client_idx on documents (client_id);
create index if not exists documents_checklist_item_idx on documents (checklist_item_id);

-- ------------------------------------------------------------------
-- deadlines — applicant-managed dates; the cron scans unresolved rows.
-- ------------------------------------------------------------------
create table if not exists deadlines (
  id             uuid primary key default gen_random_uuid(),
  client_id      uuid not null references clients (id) on delete cascade,
  type           text not null default 'Other',
  description    text,
  due_at         timestamptz not null,
  suggested_next text,
  resolved_at    timestamptz,
  created_at     timestamptz not null default now()
);
create index if not exists deadlines_client_idx on deadlines (client_id);
create index if not exists deadlines_due_idx on deadlines (due_at) where resolved_at is null;

-- ------------------------------------------------------------------
-- reminders — created by /api/cron/reminders (service role). One per
-- deadline per day (deduped in the cron via scheduled_for).
-- ------------------------------------------------------------------
create table if not exists reminders (
  id            uuid primary key default gen_random_uuid(),
  deadline_id   uuid not null references deadlines (id) on delete cascade,
  scheduled_for timestamptz not null default now(),
  channel       reminder_channel not null default 'inapp',
  sent_at       timestamptz,
  created_at    timestamptz not null default now()
);
create index if not exists reminders_deadline_idx on reminders (deadline_id);

-- ------------------------------------------------------------------
-- notices — a SNAP notice the applicant pasted or uploaded.
-- ------------------------------------------------------------------
create table if not exists notices (
  id           uuid primary key default gen_random_uuid(),
  client_id    uuid not null references clients (id) on delete cascade,
  title        text not null default 'SNAP notice',
  raw_text     text,
  storage_path text,
  created_at   timestamptz not null default now()
);
create index if not exists notices_client_idx on notices (client_id);

-- ------------------------------------------------------------------
-- notice_explanations — the Claude plain-language explanation (0/1 per notice).
-- ------------------------------------------------------------------
create table if not exists notice_explanations (
  id         uuid primary key default gen_random_uuid(),
  notice_id  uuid not null references notices (id) on delete cascade,
  summary    text,
  action     text,
  deadline   timestamptz,
  urgency    notice_urgency,
  questions  jsonb not null default '[]'::jsonb,
  model      text,
  created_at timestamptz not null default now(),
  unique (notice_id)
);

-- ------------------------------------------------------------------
-- case_notes — caseworker notes; applicant_visible ones surface to the client.
-- ------------------------------------------------------------------
create table if not exists case_notes (
  id             uuid primary key default gen_random_uuid(),
  client_id      uuid not null references clients (id) on delete cascade,
  author_user_id uuid references auth.users (id) on delete set null,
  body           text not null,
  visibility     note_visibility not null default 'internal',
  created_at     timestamptz not null default now()
);
create index if not exists case_notes_client_idx on case_notes (client_id);

-- ------------------------------------------------------------------
-- audit_log — append-only trail written via the log_audit RPC.
-- ------------------------------------------------------------------
create table if not exists audit_log (
  id             uuid primary key default gen_random_uuid(),
  actor_user_id  uuid references auth.users (id) on delete set null,
  action         text not null,
  entity_type    text,
  entity_id      text,
  metadata       jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now()
);
create index if not exists audit_log_entity_idx on audit_log (entity_type, entity_id);
create index if not exists audit_log_actor_idx on audit_log (actor_user_id);
