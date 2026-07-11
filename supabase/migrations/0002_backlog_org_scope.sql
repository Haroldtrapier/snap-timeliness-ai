-- SNAP AI — Backlog Command Center: org-scoped sharing upgrade.
--
-- Upgrades the owner-scoped model from 0001 so a whole county DSS TEAM shares
-- one backlog (instead of each supervisor seeing only their own rows).
--
-- Self-contained org model (no dependency on the app's org tables). Each owned
-- row carries an org_id that DEFAULTS to the caller's org via bk_ensure_org(),
-- so inserts auto-provision + stamp the org and the app code needs no change.
--
-- Verified against the live project with a two-user RLS test:
--   A_sees=1, B_sees_before_join=0, B_counties_readable=6, B_sees_after_join=1.
--
-- Idempotent.

create table if not exists public.bk_organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.bk_org_members (
  org_id uuid not null references public.bk_organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'Supervisor',
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);

-- Membership check. SECURITY DEFINER so RLS policies that call it don't recurse.
create or replace function public.bk_is_member(check_org uuid)
returns boolean language sql stable security definer set search_path = public as $fn$
  select exists(select 1 from public.bk_org_members m where m.org_id = check_org and m.user_id = auth.uid());
$fn$;

-- Auto-provision the caller's org on first use; returns the org id.
create or replace function public.bk_ensure_org()
returns uuid language plpgsql security definer set search_path = public as $fn$
declare oid uuid;
begin
  select org_id into oid from public.bk_org_members where user_id = auth.uid() order by created_at asc limit 1;
  if oid is null then
    insert into public.bk_organizations(name) values ('My County DSS') returning id into oid;
    insert into public.bk_org_members(org_id, user_id, role) values (oid, auth.uid(), 'Admin');
  end if;
  return oid;
end;
$fn$;

grant execute on function public.bk_ensure_org() to authenticated;
grant execute on function public.bk_is_member(uuid) to authenticated;

-- Add org_id to every owned table, defaulting to the caller's org.
alter table public.bk_workers          add column if not exists org_id uuid references public.bk_organizations(id) on delete cascade;
alter table public.bk_cases            add column if not exists org_id uuid references public.bk_organizations(id) on delete cascade;
alter table public.bk_case_documents   add column if not exists org_id uuid references public.bk_organizations(id) on delete cascade;
alter table public.bk_document_events  add column if not exists org_id uuid references public.bk_organizations(id) on delete cascade;
alter table public.bk_notes            add column if not exists org_id uuid references public.bk_organizations(id) on delete cascade;
alter table public.bk_audit            add column if not exists org_id uuid references public.bk_organizations(id) on delete cascade;

alter table public.bk_workers          alter column org_id set default public.bk_ensure_org();
alter table public.bk_cases            alter column org_id set default public.bk_ensure_org();
alter table public.bk_case_documents   alter column org_id set default public.bk_ensure_org();
alter table public.bk_document_events  alter column org_id set default public.bk_ensure_org();
alter table public.bk_notes            alter column org_id set default public.bk_ensure_org();
alter table public.bk_audit            alter column org_id set default public.bk_ensure_org();

-- RLS for the org tables themselves.
alter table public.bk_organizations enable row level security;
alter table public.bk_org_members   enable row level security;

drop policy if exists bk_org_read on public.bk_organizations;
create policy bk_org_read on public.bk_organizations
  for select to authenticated using (bk_is_member(id));

drop policy if exists bk_org_members_read on public.bk_org_members;
create policy bk_org_members_read on public.bk_org_members
  for select to authenticated using (user_id = auth.uid() or bk_is_member(org_id));

drop policy if exists bk_org_members_admin_write on public.bk_org_members;
create policy bk_org_members_admin_write on public.bk_org_members
  for all to authenticated
  using (exists(select 1 from public.bk_org_members m where m.org_id = bk_org_members.org_id and m.user_id = auth.uid() and m.role = 'Admin'))
  with check (exists(select 1 from public.bk_org_members m where m.org_id = bk_org_members.org_id and m.user_id = auth.uid() and m.role = 'Admin'));

-- Swap owned tables from owner-scoped (0001) to org-scoped.
do $mig$
declare t text;
begin
  foreach t in array array['bk_workers','bk_cases','bk_case_documents','bk_document_events','bk_notes','bk_audit'] loop
    execute format('drop policy if exists %I_owner_all on public.%I;', t, t);
    execute format('drop policy if exists %I_org_all on public.%I;', t, t);
    execute format('create policy %I_org_all on public.%I for all to authenticated using (org_id is not null and bk_is_member(org_id)) with check (org_id is not null and bk_is_member(org_id));', t, t);
  end loop;
end
$mig$;
