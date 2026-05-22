-- SNAP AI — initial schema
-- Phase 2: Supabase backend with row-level security and role-based access.
--
-- Conventions:
--   * `profiles.id` is the auth.users id (Supabase auth).
--   * `clients.owner_user_id` is the applicant/recipient who owns the case.
--   * Organization staff see clients via `organization_members` (org_id link).
--   * Service-role-only writes for audit_logs.

create extension if not exists "pgcrypto";

-- ============================================================================
-- 1. PROFILES & ORGANIZATIONS
-- ============================================================================

create type user_type as enum ('applicant', 'recipient', 'navigator', 'county', 'state', 'admin');
create type org_role as enum ('member', 'worker', 'supervisor', 'admin');
create type snap_stage as enum ('exploring','applying','pending','approved','recertifying','denied','reporting_change');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  user_type user_type not null default 'applicant',
  state text,
  county text,
  language text default 'en',
  accessibility jsonb default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null default 'county_dss', -- county_dss, state_agency, nonprofit, navigator_org
  state text,
  county text,
  sandbox boolean not null default true,
  created_at timestamptz not null default now()
);

create table organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role org_role not null default 'worker',
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

-- ============================================================================
-- 2. CLIENTS, HOUSEHOLD, CASES
-- ============================================================================

create table clients (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references profiles(id) on delete set null,  -- the applicant/recipient
  organization_id uuid references organizations(id) on delete set null,  -- managing org, if any
  full_name text not null,
  state text,
  county text,
  language text default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table household_members (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  full_name text,
  relationship text,
  date_of_birth date,
  is_minor boolean default false,
  is_elderly boolean default false,
  is_disabled boolean default false,
  is_student boolean default false,
  created_at timestamptz not null default now()
);

create table snap_cases (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  stage snap_stage not null default 'applying',
  household_size integer,
  monthly_income_cents integer,
  expedited boolean default false,
  filed_at timestamptz,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table eligibility_prescreens (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  household_size integer not null,
  monthly_income_cents integer not null,
  elderly_or_disabled boolean default false,
  student boolean default false,
  rent_cents integer default 0,
  utilities_cents integer default 0,
  childcare_cents integer default 0,
  medical_cents integer default 0,
  preliminary text not null,    -- likely | possibly | unlikely (guidance only)
  notes jsonb,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- 3. CHECKLISTS & DOCUMENTS
-- ============================================================================

create table application_checklists (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references snap_cases(id) on delete cascade,
  generated_at timestamptz not null default now()
);

create table checklist_items (
  id uuid primary key default gen_random_uuid(),
  checklist_id uuid not null references application_checklists(id) on delete cascade,
  label text not null,
  category text not null,
  required boolean not null default true,
  status text not null default 'open',  -- open | uploaded | complete
  notes text
);

create table documents (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  case_id uuid references snap_cases(id) on delete set null,
  checklist_item_id uuid references checklist_items(id) on delete set null,
  storage_path text not null,  -- path in protected bucket
  original_name text,
  mime_type text,
  size_bytes integer,
  detected_type text,
  status text not null default 'uploaded', -- uploaded | review | flagged | accepted | rejected
  uploaded_by uuid references profiles(id),
  uploaded_at timestamptz not null default now()
);

create table document_extractions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  detected_type text,
  fields jsonb,
  flags jsonb default '[]'::jsonb,  -- e.g. ["unreadable image","name mismatch"]
  human_review_required boolean default false,
  model text,
  extracted_at timestamptz not null default now()
);

-- ============================================================================
-- 4. NOTICES & DEADLINES
-- ============================================================================

create table notices (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  case_id uuid references snap_cases(id) on delete set null,
  title text not null,
  agency text,
  notice_type text,  -- interview | verification_request | approval | denial | recert | appeal_window | other
  urgency text default 'medium',
  received_at timestamptz,
  raw_text text,
  storage_path text,
  created_at timestamptz not null default now()
);

create table notice_explanations (
  id uuid primary key default gen_random_uuid(),
  notice_id uuid not null references notices(id) on delete cascade,
  summary text,
  action text,
  deadline timestamptz,
  urgency text,
  questions jsonb,
  model text,
  created_at timestamptz not null default now()
);

create table deadlines (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  case_id uuid references snap_cases(id) on delete set null,
  type text not null,  -- interview | document_due | recertification | periodic_report | change_report | appeal
  due_at timestamptz not null,
  description text,
  related_notice_id uuid references notices(id) on delete set null,
  related_document_id uuid references documents(id) on delete set null,
  suggested_next text,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create table reminders (
  id uuid primary key default gen_random_uuid(),
  deadline_id uuid not null references deadlines(id) on delete cascade,
  scheduled_for timestamptz not null,
  channel text not null default 'inapp', -- inapp | email | sms
  sent_at timestamptz
);

-- ============================================================================
-- 5. CASE NOTES, TASKS, AI CONVERSATIONS
-- ============================================================================

create table case_notes (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  author_user_id uuid references profiles(id),
  body text not null,
  visibility text not null default 'internal', -- internal | applicant_visible
  created_at timestamptz not null default now()
);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  organization_id uuid references organizations(id) on delete cascade,
  assignee_user_id uuid references profiles(id),
  label text not null,
  priority text not null default 'medium',
  due_at timestamptz,
  status text not null default 'open', -- open | in_progress | done
  created_at timestamptz not null default now()
);

create table ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  client_id uuid references clients(id) on delete cascade,
  surface text not null default 'assistant', -- assistant | notice | document | eligibility
  messages jsonb not null,
  model text,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- 6. RECIPIENT TOOLS
-- ============================================================================

create table benefit_budget_plans (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  monthly_benefit_cents integer not null,
  allocation jsonb not null,
  created_at timestamptz not null default now()
);

create table grocery_plans (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  week_start date not null,
  meals jsonb not null,
  groceries jsonb not null,
  total_cents integer,
  created_at timestamptz not null default now()
);

create table resource_referrals (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  name text not null,
  category text,    -- food_pantry | wic | summer_ebt | utility_assistance | other
  county text,
  contact jsonb,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- 7. AUDIT LOG
-- ============================================================================

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references profiles(id),
  actor_role text,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb,
  ip_address inet,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- 8. HELPER FUNCTION
-- ============================================================================

-- True if the caller is a member of the same organization as the client.
create or replace function is_org_member_of_client(_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from clients c
    join organization_members om on om.organization_id = c.organization_id
    where c.id = _client_id and om.user_id = auth.uid()
  );
$$;

create or replace function is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select user_type = 'admin' from profiles where id = auth.uid()),
    false
  );
$$;

-- ============================================================================
-- 9. ENABLE RLS
-- ============================================================================

alter table profiles enable row level security;
alter table organizations enable row level security;
alter table organization_members enable row level security;
alter table clients enable row level security;
alter table household_members enable row level security;
alter table snap_cases enable row level security;
alter table eligibility_prescreens enable row level security;
alter table application_checklists enable row level security;
alter table checklist_items enable row level security;
alter table documents enable row level security;
alter table document_extractions enable row level security;
alter table notices enable row level security;
alter table notice_explanations enable row level security;
alter table deadlines enable row level security;
alter table reminders enable row level security;
alter table case_notes enable row level security;
alter table tasks enable row level security;
alter table ai_conversations enable row level security;
alter table benefit_budget_plans enable row level security;
alter table grocery_plans enable row level security;
alter table resource_referrals enable row level security;
alter table audit_logs enable row level security;

-- ============================================================================
-- 10. POLICIES
-- ============================================================================

-- profiles
create policy "profiles self read"
  on profiles for select using (auth.uid() = id or is_admin());
create policy "profiles self upsert"
  on profiles for insert with check (auth.uid() = id);
create policy "profiles self update"
  on profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- organizations + members
create policy "org members can read their org"
  on organizations for select using (
    exists (select 1 from organization_members om where om.organization_id = organizations.id and om.user_id = auth.uid())
    or is_admin()
  );
create policy "members read own membership"
  on organization_members for select using (user_id = auth.uid() or is_admin());

-- clients: applicant owns OR org member sees
create policy "client owner or org member"
  on clients for select using (
    owner_user_id = auth.uid()
    or is_org_member_of_client(id)
    or is_admin()
  );
create policy "client owner insert"
  on clients for insert with check (owner_user_id = auth.uid());
create policy "client owner update"
  on clients for update using (owner_user_id = auth.uid() or is_admin())
                  with check (owner_user_id = auth.uid() or is_admin());

-- Generic "owns through client" policies via repeating pattern.
-- household_members
create policy "household via client"
  on household_members for select using (
    exists (select 1 from clients c where c.id = household_members.client_id
            and (c.owner_user_id = auth.uid() or is_org_member_of_client(c.id) or is_admin()))
  );
create policy "household owner write"
  on household_members for all using (
    exists (select 1 from clients c where c.id = household_members.client_id and c.owner_user_id = auth.uid())
  ) with check (
    exists (select 1 from clients c where c.id = household_members.client_id and c.owner_user_id = auth.uid())
  );

-- snap_cases
create policy "case via client"
  on snap_cases for select using (
    exists (select 1 from clients c where c.id = snap_cases.client_id
            and (c.owner_user_id = auth.uid() or is_org_member_of_client(c.id) or is_admin()))
  );
create policy "case owner write"
  on snap_cases for all using (
    exists (select 1 from clients c where c.id = snap_cases.client_id and c.owner_user_id = auth.uid())
  ) with check (
    exists (select 1 from clients c where c.id = snap_cases.client_id and c.owner_user_id = auth.uid())
  );

-- eligibility_prescreens
create policy "prescreen via client"
  on eligibility_prescreens for select using (
    exists (select 1 from clients c where c.id = eligibility_prescreens.client_id
            and (c.owner_user_id = auth.uid() or is_org_member_of_client(c.id) or is_admin()))
  );
create policy "prescreen owner write"
  on eligibility_prescreens for insert with check (
    exists (select 1 from clients c where c.id = eligibility_prescreens.client_id and c.owner_user_id = auth.uid())
  );

-- application_checklists + checklist_items
create policy "checklist via case"
  on application_checklists for select using (
    exists (
      select 1 from snap_cases s
      join clients c on c.id = s.client_id
      where s.id = application_checklists.case_id
        and (c.owner_user_id = auth.uid() or is_org_member_of_client(c.id) or is_admin())
    )
  );
create policy "checklist owner write"
  on application_checklists for all using (
    exists (
      select 1 from snap_cases s join clients c on c.id = s.client_id
      where s.id = application_checklists.case_id and c.owner_user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from snap_cases s join clients c on c.id = s.client_id
      where s.id = application_checklists.case_id and c.owner_user_id = auth.uid()
    )
  );
create policy "checklist items via checklist"
  on checklist_items for all using (
    exists (
      select 1 from application_checklists a
      join snap_cases s on s.id = a.case_id
      join clients c on c.id = s.client_id
      where a.id = checklist_items.checklist_id
        and (c.owner_user_id = auth.uid() or is_org_member_of_client(c.id) or is_admin())
    )
  ) with check (
    exists (
      select 1 from application_checklists a
      join snap_cases s on s.id = a.case_id
      join clients c on c.id = s.client_id
      where a.id = checklist_items.checklist_id and c.owner_user_id = auth.uid()
    )
  );

-- documents
create policy "documents via client"
  on documents for select using (
    exists (select 1 from clients c where c.id = documents.client_id
            and (c.owner_user_id = auth.uid() or is_org_member_of_client(c.id) or is_admin()))
  );
create policy "documents owner write"
  on documents for all using (
    exists (select 1 from clients c where c.id = documents.client_id and c.owner_user_id = auth.uid())
  ) with check (
    exists (select 1 from clients c where c.id = documents.client_id and c.owner_user_id = auth.uid())
  );
create policy "document_extractions via document"
  on document_extractions for select using (
    exists (
      select 1 from documents d join clients c on c.id = d.client_id
      where d.id = document_extractions.document_id
        and (c.owner_user_id = auth.uid() or is_org_member_of_client(c.id) or is_admin())
    )
  );

-- notices + explanations
create policy "notices via client"
  on notices for select using (
    exists (select 1 from clients c where c.id = notices.client_id
            and (c.owner_user_id = auth.uid() or is_org_member_of_client(c.id) or is_admin()))
  );
create policy "notices owner write"
  on notices for all using (
    exists (select 1 from clients c where c.id = notices.client_id and c.owner_user_id = auth.uid())
  ) with check (
    exists (select 1 from clients c where c.id = notices.client_id and c.owner_user_id = auth.uid())
  );
create policy "notice_explanations via notice"
  on notice_explanations for select using (
    exists (
      select 1 from notices n join clients c on c.id = n.client_id
      where n.id = notice_explanations.notice_id
        and (c.owner_user_id = auth.uid() or is_org_member_of_client(c.id) or is_admin())
    )
  );

-- deadlines + reminders
create policy "deadlines via client"
  on deadlines for select using (
    exists (select 1 from clients c where c.id = deadlines.client_id
            and (c.owner_user_id = auth.uid() or is_org_member_of_client(c.id) or is_admin()))
  );
create policy "deadlines owner write"
  on deadlines for all using (
    exists (select 1 from clients c where c.id = deadlines.client_id and c.owner_user_id = auth.uid())
  ) with check (
    exists (select 1 from clients c where c.id = deadlines.client_id and c.owner_user_id = auth.uid())
  );
create policy "reminders via deadline"
  on reminders for select using (
    exists (
      select 1 from deadlines d join clients c on c.id = d.client_id
      where d.id = reminders.deadline_id
        and (c.owner_user_id = auth.uid() or is_org_member_of_client(c.id) or is_admin())
    )
  );

-- case notes
create policy "case notes via client"
  on case_notes for select using (
    exists (select 1 from clients c where c.id = case_notes.client_id
            and (
              c.owner_user_id = auth.uid() and case_notes.visibility = 'applicant_visible'
              or is_org_member_of_client(c.id)
              or is_admin()
            ))
  );
create policy "case notes org write"
  on case_notes for insert with check (
    exists (select 1 from clients c where c.id = case_notes.client_id and is_org_member_of_client(c.id))
  );

-- tasks
create policy "tasks via org or assignee"
  on tasks for select using (
    assignee_user_id = auth.uid()
    or exists (select 1 from organization_members om where om.organization_id = tasks.organization_id and om.user_id = auth.uid())
    or is_admin()
  );
create policy "tasks org write"
  on tasks for all using (
    exists (select 1 from organization_members om where om.organization_id = tasks.organization_id and om.user_id = auth.uid())
  ) with check (
    exists (select 1 from organization_members om where om.organization_id = tasks.organization_id and om.user_id = auth.uid())
  );

-- ai_conversations
create policy "ai conv self"
  on ai_conversations for select using (user_id = auth.uid() or is_admin());
create policy "ai conv self write"
  on ai_conversations for insert with check (user_id = auth.uid());

-- recipient tools
create policy "budget via client"
  on benefit_budget_plans for select using (
    exists (select 1 from clients c where c.id = benefit_budget_plans.client_id
            and (c.owner_user_id = auth.uid() or is_admin()))
  );
create policy "budget owner write"
  on benefit_budget_plans for all using (
    exists (select 1 from clients c where c.id = benefit_budget_plans.client_id and c.owner_user_id = auth.uid())
  ) with check (
    exists (select 1 from clients c where c.id = benefit_budget_plans.client_id and c.owner_user_id = auth.uid())
  );
create policy "grocery via client"
  on grocery_plans for select using (
    exists (select 1 from clients c where c.id = grocery_plans.client_id
            and (c.owner_user_id = auth.uid() or is_admin()))
  );
create policy "grocery owner write"
  on grocery_plans for all using (
    exists (select 1 from clients c where c.id = grocery_plans.client_id and c.owner_user_id = auth.uid())
  ) with check (
    exists (select 1 from clients c where c.id = grocery_plans.client_id and c.owner_user_id = auth.uid())
  );
create policy "referrals via client"
  on resource_referrals for select using (
    exists (select 1 from clients c where c.id = resource_referrals.client_id
            and (c.owner_user_id = auth.uid() or is_org_member_of_client(c.id) or is_admin()))
  );

-- audit logs: read by admin; writes restricted to service role (bypasses RLS).
create policy "audit admin read"
  on audit_logs for select using (is_admin());

-- ============================================================================
-- 11. PROTECTED STORAGE BUCKET
-- ============================================================================
-- Documents bucket is private. Files must be addressed only via signed URLs
-- generated server-side after RLS check.
--
-- Run this in the Supabase dashboard (or via SQL) once:
--
--   insert into storage.buckets (id, name, public)
--   values ('snap-documents', 'snap-documents', false)
--   on conflict (id) do nothing;
--
-- And add policies that mirror the documents table:
--
--   create policy "documents storage read"
--     on storage.objects for select
--     using (bucket_id = 'snap-documents' and exists (
--       select 1 from public.documents d
--       where d.storage_path = name
--         and (d.client_id in (select id from public.clients where owner_user_id = auth.uid())
--             or public.is_org_member_of_client(d.client_id)
--             or public.is_admin())
--     ));
--
--   create policy "documents storage write"
--     on storage.objects for insert
--     with check (bucket_id = 'snap-documents' and auth.uid() is not null);
