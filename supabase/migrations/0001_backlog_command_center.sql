-- SNAP AI — Backlog Command Center persistence.
--
-- Self-contained `bk_` tables for the supervisor backlog surface at
-- /app/agency/backlog. Designed to complement (not replace) the existing
-- applicant/agency schema. Rows are OWNER-SCOPED by auth.uid() via RLS —
-- secure by default. Widening reads to county/organization sharing is a
-- follow-up once the live org/membership schema is confirmed.
--
-- Safe to run more than once (IF NOT EXISTS / ON CONFLICT DO NOTHING).

create extension if not exists "pgcrypto";

-- Reference data: counties (global, readable by any authenticated user).
create table if not exists public.bk_counties (
  id    text primary key,
  name  text not null,
  state text not null
);

insert into public.bk_counties (id, name, state) values
  ('cty_cumberland',  'Cumberland County',  'NC'),
  ('cty_mecklenburg', 'Mecklenburg County', 'NC'),
  ('cty_wake',        'Wake County',        'NC'),
  ('cty_guilford',    'Guilford County',    'NC'),
  ('cty_durham',      'Durham County',      'NC'),
  ('cty_forsyth',     'Forsyth County',     'NC')
on conflict (id) do nothing;

-- Caseworkers / supervisors, owned by the agency user who created them.
create table if not exists public.bk_workers (
  id             text primary key,
  owner_user_id  uuid not null default auth.uid() references auth.users (id) on delete cascade,
  county_id      text not null references public.bk_counties (id),
  name           text not null,
  title          text not null default 'Eligibility Caseworker',
  role           text not null default 'Caseworker'
);
create index if not exists bk_workers_owner_idx on public.bk_workers (owner_user_id);

-- Imported backlog cases.
create table if not exists public.bk_cases (
  id                  uuid primary key default gen_random_uuid(),
  owner_user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  external_id         text not null,                    -- the county "Case ID"
  applicant_label     text not null,                    -- anonymized (Household #XXXX)
  county_id           text not null references public.bk_counties (id),
  application_date    timestamptz not null,
  status              text not null default 'New',
  expedited           boolean not null default false,
  household_size      integer not null default 1,
  monthly_income      numeric not null default 0,
  monthly_expenses    numeric not null default 0,
  assigned_worker_id  text references public.bk_workers (id) on delete set null,
  vulnerability_flags text[] not null default '{}',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (owner_user_id, external_id)                   -- dedupe imports per owner
);
create index if not exists bk_cases_owner_idx  on public.bk_cases (owner_user_id);
create index if not exists bk_cases_county_idx on public.bk_cases (county_id);

-- Per-case document checklist.
create table if not exists public.bk_case_documents (
  id             uuid primary key default gen_random_uuid(),
  owner_user_id  uuid not null default auth.uid() references auth.users (id) on delete cascade,
  case_id        uuid not null references public.bk_cases (id) on delete cascade,
  doc_key        text not null,
  label          text not null,
  required       boolean not null default false,
  status         text not null default 'Missing',
  updated_at     timestamptz not null default now(),
  unique (case_id, doc_key)
);
create index if not exists bk_docs_case_idx on public.bk_case_documents (case_id);

-- Append-only document status history.
create table if not exists public.bk_document_events (
  id             uuid primary key default gen_random_uuid(),
  owner_user_id  uuid not null default auth.uid() references auth.users (id) on delete cascade,
  document_id    uuid not null references public.bk_case_documents (id) on delete cascade,
  status         text not null,
  by_user        text not null default 'system',
  at             timestamptz not null default now()
);
create index if not exists bk_docevents_doc_idx on public.bk_document_events (document_id);

-- Worker notes.
create table if not exists public.bk_notes (
  id             uuid primary key default gen_random_uuid(),
  owner_user_id  uuid not null default auth.uid() references auth.users (id) on delete cascade,
  case_id        uuid not null references public.bk_cases (id) on delete cascade,
  body           text not null,
  author         text not null default 'demo.supervisor',
  created_at     timestamptz not null default now()
);
create index if not exists bk_notes_case_idx on public.bk_notes (case_id);

-- Append-only audit trail (user + AI/system actions).
create table if not exists public.bk_audit (
  id                uuid primary key default gen_random_uuid(),
  owner_user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  at                timestamptz not null default now(),
  user_id           text not null,
  case_external_id  text not null default '-',
  county_id         text not null default '-',
  action            text not null,
  prev              text,
  next              text,
  system_note       text,
  automated         boolean not null default false
);
create index if not exists bk_audit_owner_idx on public.bk_audit (owner_user_id, at desc);

-- ---------------------------------------------------------------------------
-- Row-level security: each user sees and mutates only their own rows.
-- ---------------------------------------------------------------------------
alter table public.bk_counties        enable row level security;
alter table public.bk_workers          enable row level security;
alter table public.bk_cases            enable row level security;
alter table public.bk_case_documents   enable row level security;
alter table public.bk_document_events  enable row level security;
alter table public.bk_notes            enable row level security;
alter table public.bk_audit            enable row level security;

-- Counties: readable by any authenticated user; not writable from the client.
drop policy if exists bk_counties_read on public.bk_counties;
create policy bk_counties_read on public.bk_counties
  for select to authenticated using (true);

-- Owner-scoped policies for every owned table.
do $$
declare t text;
begin
  foreach t in array array[
    'bk_workers','bk_cases','bk_case_documents','bk_document_events','bk_notes','bk_audit'
  ] loop
    execute format('drop policy if exists %I_owner_all on public.%I;', t, t);
    execute format(
      'create policy %I_owner_all on public.%I
         for all to authenticated
         using (owner_user_id = auth.uid())
         with check (owner_user_id = auth.uid());', t, t);
  end loop;
end $$;
