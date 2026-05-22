# Supabase setup

SNAP AI uses Supabase for auth, Postgres, and storage. This guide gets you from
zero to a running backend.

## 1. Create a project

1. Go to https://supabase.com and create a new project.
2. Copy the project URL and `anon` public key into `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
ANTHROPIC_API_KEY=<optional>
OPENAI_API_KEY=<optional>
SUPABASE_STORAGE_BUCKET=snap-documents
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Keep `SUPABASE_SERVICE_ROLE_KEY` server-only. Never prefix it with
`NEXT_PUBLIC_`. Set at least one AI provider key for live assistant
responses; without one, the routes fall back to deterministic mock replies.

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

## 3. Create the protected documents storage bucket

Run this in the SQL editor:

```sql
-- Create the bucket as private (not public).
insert into storage.buckets (id, name, public)
values ('snap-documents', 'snap-documents', false)
on conflict (id) do nothing;

-- READ: a user can read a file only if the matching row in public.documents
-- is one they own (or their org has access to, or they are admin).
create policy "documents storage read"
  on storage.objects for select
  using (
    bucket_id = 'snap-documents' and exists (
      select 1 from public.documents d
      where d.storage_path = storage.objects.name
        and (
          d.client_id in (select id from public.clients where owner_user_id = auth.uid())
          or public.is_org_member_of_client(d.client_id)
          or public.is_admin()
        )
    )
  );

-- WRITE: any authenticated user can upload, but the upload server action
-- restricts the prefix to <user_id>/<case_id>/* so a user can't write
-- under another user's namespace.
create policy "documents storage insert"
  on storage.objects for insert
  with check (
    bucket_id = 'snap-documents'
    and auth.uid() is not null
    and split_part(name, '/', 1) = auth.uid()::text
  );

-- DELETE: only the owning user (or admin) can delete a file.
create policy "documents storage delete"
  on storage.objects for delete
  using (
    bucket_id = 'snap-documents'
    and (
      split_part(name, '/', 1) = auth.uid()::text
      or public.is_admin()
    )
  );
```

The bucket must be **private**. Read access from the app uses signed URLs
created server-side after the RLS check passes.

## 4. Auth providers

In **Authentication → Providers**, enable:

- **Email/Password** (default for pilot).
  - Under **Email Templates**, customize the confirmation email.
  - Under **URL Configuration**, set:
    - Site URL: `https://<your-domain>` (or `http://localhost:3000` for dev)
    - Additional Redirect URLs: include `https://<your-domain>/dashboard`
- **Magic link** (optional).
- **SAML / OIDC** (for county/state SSO — post-pilot).

If you want signup without an email-confirmation step for the pilot,
turn off **Confirm email** in Authentication → Providers → Email.

## 5. (Optional) Seed an organization

Useful for testing navigator/county-staff flows:

```sql
insert into organizations (name, type, state, county, sandbox)
values ('Cumberland County DSS (sandbox)', 'county_dss', 'NC', 'Cumberland', true);
```

Then add staff users via the dashboard, and link them via
`organization_members`.

## 6. Verify RLS

Use the SQL editor's "impersonate" feature, or sign in as two different
applicants in two browsers:

- Sign in as Applicant A → can see their own profile, client, documents,
  notices, deadlines.
- Sign in as Applicant B → cannot see anything belonging to A.
- Sign in as an org member of organization O → can see clients with
  `organization_id = O.id`, and only those.
- `audit_logs` cannot be read by non-admins.

## 7. Run the app

```
npm install
npm run dev
```

Visit `http://localhost:3000`. You should be able to sign up, complete
onboarding, see your dashboard, upload a document, paste a notice, and add
deadlines.
