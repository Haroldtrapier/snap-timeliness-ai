-- 20260722100000_prescreen.sql
--
-- Eligibility pre-screening persistence (AUTOMATION_PLAN Part A, Phases 3–4).
--
--   financial_profiles     — the applicant-editable engine inputs (1 per client)
--   eligibility_estimates  — computed snapshots with the full rule trace
--
-- The engine itself is pure (lib/eligibility) — these tables only hold its
-- inputs and outputs. Every estimate row carries policy_version + rule_trace
-- for explainability/appeals-readiness, and the standing disclaimer.

create table if not exists financial_profiles (
  id                              uuid primary key default gen_random_uuid(),
  client_id                       uuid not null references clients (id) on delete cascade,
  has_elderly_or_disabled_member  boolean not null default false,
  earned_income_cents             integer not null default 0,
  unearned_income_cents           integer not null default 0,
  dependent_care_cents            integer not null default 0,
  medical_expenses_cents          integer not null default 0,
  child_support_paid_cents        integer not null default 0,
  rent_mortgage_cents             integer not null default 0,
  utilities_cents                 integer not null default 0,
  use_standard_utility_allowance  boolean not null default true,
  liquid_resources_cents          integer not null default 0,
  receives_qualifying_benefit     boolean not null default false,
  updated_at                      timestamptz not null default now(),
  unique (client_id)
);
create index if not exists financial_profiles_client_idx on financial_profiles (client_id);

create table if not exists eligibility_estimates (
  id                               uuid primary key default gen_random_uuid(),
  client_id                        uuid not null references clients (id) on delete cascade,
  case_id                          uuid references snap_cases (id) on delete set null,
  computed_at                      timestamptz not null default now(),
  policy_version                   text not null,
  gross_income_cents               integer not null,
  net_income_cents                 integer not null,
  gross_test_pass                  boolean not null,
  net_test_pass                    boolean not null,
  asset_test_pass                  boolean not null,
  categorically_eligible           boolean not null,
  likely_eligible                  boolean not null,
  estimated_monthly_benefit_cents  integer not null,
  expedited                        boolean not null,
  rule_trace                       jsonb not null default '[]'::jsonb,
  disclaimer                       text not null
);
create index if not exists eligibility_estimates_client_idx
  on eligibility_estimates (client_id, computed_at desc);

alter table financial_profiles    enable row level security;
alter table eligibility_estimates enable row level security;

-- Applicants own their inputs and estimates; caseworkers in the client's org
-- read them (the expedited / likely-eligible flags drive queue prioritization).
create policy "financial profiles owner all" on financial_profiles for all
  using (is_owner_of_client(client_id))
  with check (is_owner_of_client(client_id));
create policy "financial profiles org read" on financial_profiles for select
  using (is_org_member_of_client(client_id));

create policy "estimates owner all" on eligibility_estimates for all
  using (is_owner_of_client(client_id))
  with check (is_owner_of_client(client_id));
create policy "estimates org read" on eligibility_estimates for select
  using (is_org_member_of_client(client_id));
