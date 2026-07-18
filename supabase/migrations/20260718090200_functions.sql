-- 20260718090200_functions.sql
--
-- Helper predicates (used by RLS) and the SECURITY DEFINER RPCs the app calls:
--   find_or_create_county_org  (onboarding + admin)
--   grant_org_membership       (admin)
--   revoke_org_membership      (admin)
--   log_audit                  (agency queue review)
--
-- The helpers are SECURITY DEFINER so they can consult clients /
-- organization_members / profiles without tripping those tables' own RLS
-- (which would otherwise recurse).

-- ------------------------------------------------------------------
-- is_admin() — true when the current user's profile is an admin.
-- ------------------------------------------------------------------
create or replace function is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and user_type = 'admin'
  );
$$;

-- ------------------------------------------------------------------
-- is_owner_of_client(uuid) — true when the current user owns the client.
-- ------------------------------------------------------------------
create or replace function is_owner_of_client(p_client uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from clients
    where id = p_client and owner_user_id = auth.uid()
  );
$$;

-- ------------------------------------------------------------------
-- is_org_member_of_client(uuid) — true when the current user is a member of
-- the organization that the client is linked to. This is the join the RLS
-- comments in lib/repositories.ts refer to for caseworker access.
-- ------------------------------------------------------------------
create or replace function is_org_member_of_client(p_client uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from clients c
    join organization_members m on m.organization_id = c.organization_id
    where c.id = p_client and m.user_id = auth.uid()
  );
$$;

-- ------------------------------------------------------------------
-- find_or_create_county_org(state, county) -> org id.
-- Called by onboarding (as the applicant) and by admin. Any authenticated
-- user may call it; it only ever upserts a county DSS org row.
-- ------------------------------------------------------------------
create or replace function find_or_create_county_org(p_state text, p_county text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;
  if coalesce(trim(p_state), '') = '' or coalesce(trim(p_county), '') = '' then
    raise exception 'state and county are required';
  end if;

  insert into organizations (name, state, county)
  values (trim(p_county) || ' County DSS', trim(p_state), trim(p_county))
  on conflict (state, county) do update set state = excluded.state
  returning id into v_id;

  return v_id;
end;
$$;

-- ------------------------------------------------------------------
-- grant_org_membership(user, org, role) — admin only. Upsert a membership.
-- ------------------------------------------------------------------
create or replace function grant_org_membership(p_user uuid, p_org uuid, p_role text default 'worker')
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'admin privileges required';
  end if;

  insert into organization_members (organization_id, user_id, role)
  values (p_org, p_user, coalesce(nullif(trim(p_role), ''), 'worker'))
  on conflict (organization_id, user_id) do update set role = excluded.role;
end;
$$;

-- ------------------------------------------------------------------
-- revoke_org_membership(user, org) — admin only.
-- ------------------------------------------------------------------
create or replace function revoke_org_membership(p_user uuid, p_org uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'admin privileges required';
  end if;

  delete from organization_members
  where organization_id = p_org and user_id = p_user;
end;
$$;

-- ------------------------------------------------------------------
-- log_audit(action, entity_type, entity_id, metadata) — append-only entry
-- attributed to the current user. Called from the caseworker review action.
-- ------------------------------------------------------------------
create or replace function log_audit(
  p_action text,
  p_entity_type text default null,
  p_entity_id text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into audit_log (actor_user_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), p_action, p_entity_type, p_entity_id, coalesce(p_metadata, '{}'::jsonb));
end;
$$;

-- Expose the RPCs to authenticated callers (admin gating is enforced inside).
grant execute on function find_or_create_county_org(text, text) to authenticated;
grant execute on function grant_org_membership(uuid, uuid, text) to authenticated;
grant execute on function revoke_org_membership(uuid, uuid) to authenticated;
grant execute on function log_audit(text, text, text, jsonb) to authenticated;
grant execute on function is_admin() to authenticated;
grant execute on function is_owner_of_client(uuid) to authenticated;
grant execute on function is_org_member_of_client(uuid) to authenticated;
