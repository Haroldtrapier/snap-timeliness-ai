# Supabase setup

SNAP AI uses Supabase for auth, Postgres, and storage. This guide gets you from
zero to a running backend.

## 1. Create a project

1. Go to https://supabase.com and create a new project.
2. Copy the project URL and `anon` public key into `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_USE_MOCK_DATA=false
```

Keep `SUPABASE_SERVICE_ROLE_KEY` server-only. Never prefix it with
`NEXT_PUBLIC_`.

## 2. Apply the schema

The full schema lives in
[`supabase/migrations/20260522000000_initial_schema.sql`](./supabase/migrations/20260522000000_initial_schema.sql).

You can apply it two ways:

### Option A: Supabase Dashboard
1. Open SQL Editor.
2. Paste the contents of the migration file.
3. Run it.

### Option B: Supabase CLI
```
supabase link --project-ref <your-ref>
supabase db push
```

The migration creates:

- All tables listed in the spec: `profiles`, `organizations`,
  `organization_members`, `clients`, `household_members`, `snap_cases`,
  `eligibility_prescreens`, `application_checklists`, `checklist_items`,
  `documents`, `document_extractions`, `notices`, `notice_explanations`,
  `deadlines`, `reminders`, `case_notes`, `tasks`, `ai_conversations`,
  `benefit_budget_plans`, `grocery_plans`, `resource_referrals`, `audit_logs`.
- Row-level security on every table.
- Helper functions `is_org_member_of_client(uuid)` and `is_admin()`.

## 3. Create the documents storage bucket

In SQL editor or dashboard:

```sql
insert into storage.buckets (id, name, public)
values ('snap-documents', 'snap-documents', false)
on conflict (id) do nothing;
```

Then add storage policies (see the bottom of the migration file for templates).
The bucket must be **private**. Read access is via signed URLs created on the
server after an RLS check.

## 4. Auth providers

In Auth → Providers, enable:
- Email/password (default for pilot)
- Magic link (optional)
- SAML / OIDC (for county/state SSO — post-pilot)

## 5. Seed an organization

```sql
insert into organizations (name, type, state, county, sandbox)
values ('Cumberland County DSS (sandbox)', 'county_dss', 'NC', 'Cumberland', true);
```

Then add staff users via the dashboard, and link them with
`organization_members`.

## 6. Verify RLS

Sign in as an applicant and confirm you can only see your own data. Sign in as
an org member and confirm you only see clients tied to your organization.

## 7. Switch the app off mock data

Set `NEXT_PUBLIC_USE_MOCK_DATA=false` in your environment. The lib/supabase
clients will use the live project.
