-- 20260718090300_rls.sql
--
-- Row-level security. Every table is RLS-enabled. The service-role key used by
-- the reminders cron (lib/supabase/admin.ts) bypasses RLS, so no policy is
-- needed for that path. Policy names mirror the comments in lib/repositories.ts
-- and the app actions.
--
-- Access model:
--   * applicants own their clients row and everything hanging off it;
--   * caseworkers reach a client's data through their organization membership
--     (is_org_member_of_client);
--   * admins can read org/membership/profile data for the admin console.

alter table profiles              enable row level security;
alter table organizations         enable row level security;
alter table organization_members  enable row level security;
alter table clients               enable row level security;
alter table household_members     enable row level security;
alter table snap_cases            enable row level security;
alter table application_checklists enable row level security;
alter table checklist_items       enable row level security;
alter table documents             enable row level security;
alter table deadlines             enable row level security;
alter table reminders             enable row level security;
alter table notices               enable row level security;
alter table notice_explanations   enable row level security;
alter table case_notes            enable row level security;
alter table audit_log             enable row level security;

-- ---------------- profiles ----------------
create policy "profiles self read"   on profiles for select using (id = auth.uid() or is_admin());
create policy "profiles self insert" on profiles for insert with check (id = auth.uid());
create policy "profiles self update" on profiles for update using (id = auth.uid()) with check (id = auth.uid());

-- ---------------- organizations ----------------
-- Admins see all; caseworkers see orgs they belong to.
create policy "organizations read" on organizations for select using (
  is_admin()
  or exists (
    select 1 from organization_members m
    where m.organization_id = organizations.id and m.user_id = auth.uid()
  )
);

-- ---------------- organization_members ----------------
create policy "org members read" on organization_members for select using (
  user_id = auth.uid() or is_admin()
);

-- ---------------- clients ----------------
create policy "clients owner all" on clients for all
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());
create policy "clients org read" on clients for select using (
  is_admin() or (
    organization_id is not null and exists (
      select 1 from organization_members m
      where m.organization_id = clients.organization_id and m.user_id = auth.uid()
    )
  )
);

-- ---------------- household_members ----------------
create policy "household owner all" on household_members for all
  using (is_owner_of_client(client_id))
  with check (is_owner_of_client(client_id));
create policy "household org read" on household_members for select
  using (is_org_member_of_client(client_id));

-- ---------------- snap_cases ----------------
create policy "cases owner all" on snap_cases for all
  using (is_owner_of_client(client_id))
  with check (is_owner_of_client(client_id));
create policy "cases org read" on snap_cases for select
  using (is_org_member_of_client(client_id));

-- ---------------- application_checklists ----------------
-- Reached through case -> client.
create policy "checklists owner all" on application_checklists for all
  using (is_owner_of_client((select client_id from snap_cases s where s.id = case_id)))
  with check (is_owner_of_client((select client_id from snap_cases s where s.id = case_id)));
create policy "checklists org read" on application_checklists for select
  using (is_org_member_of_client((select client_id from snap_cases s where s.id = case_id)));

-- ---------------- checklist_items ----------------
-- Owner can insert (onboarding) and update (uploadDocument flips to 'provided').
-- Org caseworkers can read + update (review reverts to 'open').
create policy "checklist items owner all" on checklist_items for all
  using (is_owner_of_client(
    (select s.client_id from application_checklists c join snap_cases s on s.id = c.case_id where c.id = checklist_id)
  ))
  with check (is_owner_of_client(
    (select s.client_id from application_checklists c join snap_cases s on s.id = c.case_id where c.id = checklist_id)
  ));
create policy "checklist items org read" on checklist_items for select
  using (is_org_member_of_client(
    (select s.client_id from application_checklists c join snap_cases s on s.id = c.case_id where c.id = checklist_id)
  ));
create policy "checklist items org review" on checklist_items for update
  using (is_org_member_of_client(
    (select s.client_id from application_checklists c join snap_cases s on s.id = c.case_id where c.id = checklist_id)
  ))
  with check (is_org_member_of_client(
    (select s.client_id from application_checklists c join snap_cases s on s.id = c.case_id where c.id = checklist_id)
  ));

-- ---------------- documents ----------------
create policy "documents owner all" on documents for all
  using (is_owner_of_client(client_id))
  with check (is_owner_of_client(client_id));
create policy "documents org read" on documents for select
  using (is_org_member_of_client(client_id));
create policy "documents org review" on documents for update
  using (is_org_member_of_client(client_id))
  with check (is_org_member_of_client(client_id));

-- ---------------- deadlines ----------------
create policy "deadlines owner write" on deadlines for all
  using (is_owner_of_client(client_id))
  with check (is_owner_of_client(client_id));
create policy "deadlines via client" on deadlines for select
  using (is_org_member_of_client(client_id));

-- ---------------- reminders ----------------
-- The cron writes with the service role (bypasses RLS). Applicants may read
-- reminders for their own deadlines.
create policy "reminders owner read" on reminders for select using (
  is_owner_of_client((select d.client_id from deadlines d where d.id = deadline_id))
);

-- ---------------- notices ----------------
create policy "notices owner all" on notices for all
  using (is_owner_of_client(client_id))
  with check (is_owner_of_client(client_id));
create policy "notices org read" on notices for select
  using (is_org_member_of_client(client_id));

-- ---------------- notice_explanations ----------------
-- Reached through notice -> client.
create policy "notice explanations owner all" on notice_explanations for all
  using (is_owner_of_client((select n.client_id from notices n where n.id = notice_id)))
  with check (is_owner_of_client((select n.client_id from notices n where n.id = notice_id)));
create policy "notice explanations org read" on notice_explanations for select
  using (is_org_member_of_client((select n.client_id from notices n where n.id = notice_id)));

-- ---------------- case_notes ----------------
-- Applicants see only applicant_visible notes on their own client; caseworkers
-- (org members) read all and insert.
create policy "case notes applicant read" on case_notes for select using (
  (visibility = 'applicant_visible' and is_owner_of_client(client_id))
  or is_org_member_of_client(client_id)
);
create policy "case notes org insert" on case_notes for insert with check (
  is_org_member_of_client(client_id) and author_user_id = auth.uid()
);

-- ---------------- audit_log ----------------
-- Written only via log_audit() (SECURITY DEFINER). Readable by admins.
create policy "audit admin read" on audit_log for select using (is_admin());
