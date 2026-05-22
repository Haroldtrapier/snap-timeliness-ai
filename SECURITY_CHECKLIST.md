# SNAP AI — Pre-deploy security checklist

Run through this list before each pilot and before flipping prod traffic on.
Pair it with [SECURITY.md](./SECURITY.md) (architectural overview) and
[SUPABASE_SETUP.md](./SUPABASE_SETUP.md) (how the backend is provisioned).

## Secrets and environment

- [ ] `.env.local` is gitignored, and no env file is committed.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is set **only** as a server var. It is not
      prefixed with `NEXT_PUBLIC_` anywhere, and is not referenced from any
      client component.
- [ ] AI provider keys (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`) are
      server-only. The browser never talks to the AI provider.
- [ ] `lib/supabase/admin.ts` imports `"server-only"` at the top.
- [ ] `lib/supabase/server.ts` imports `"server-only"` at the top.
- [ ] `lib/db/*.ts` files import `"server-only"`.
- [ ] In Vercel, all envs above are set for **Production** and **Preview**.

## Supabase

- [ ] Migration `20260522000000_initial_schema.sql` is applied.
- [ ] RLS is enabled on every table created by the migration.
  Verify:
  ```sql
  select tablename, rowsecurity
  from pg_tables
  where schemaname = 'public'
  order by tablename;
  ```
  All rows should show `rowsecurity = true`.
- [ ] `storage.buckets` shows `snap-documents` with `public = false`.
- [ ] Storage policies created (read/insert/delete) per
      [SUPABASE_SETUP.md §3](./SUPABASE_SETUP.md).
- [ ] Auth site URL and additional redirect URLs match the prod domain.
- [ ] Email/Password provider is enabled. (Magic link / SSO optional.)

## App-level access control

- [ ] `middleware.ts` redirects unauthenticated users hitting `/dashboard`,
      `/documents`, `/notices`, `/deadlines`, `/assistant`, `/settings`,
      `/application-checklist`, `/eligibility-check`, `/benefit-planner`,
      `/grocery-plan`, `/onboarding`, or any `/org/*` route to `/login`.
- [ ] Signup creates a `profiles` row immediately via the server action.
- [ ] Onboarding writes `profiles`, `clients`, `snap_cases`,
      `application_checklists`, and a default set of `checklist_items`.
- [ ] A signed-in applicant cannot read another applicant's rows in any
      table (cross-account test described in
      [SUPABASE_SETUP.md §6](./SUPABASE_SETUP.md)).

## Documents and storage

- [ ] Upload action restricts the storage prefix to `<user_id>/<case_id>/*`.
- [ ] Allowed MIME types are: `image/jpeg`, `image/png`, `image/webp`,
      `image/heic`, `image/heif`, `application/pdf`.
- [ ] Max upload size is 10 MB.
- [ ] Document detail page renders a 5-minute signed URL — not a public
      `getPublicUrl`.
- [ ] AI document classification (when added) runs server-side only.

## AI safety

- [ ] All AI routes live under `app/api/ai/*` and use `runtime = "nodejs"`.
- [ ] `SYSTEM_PROMPT` in `lib/safety.ts` forbids "approved by AI",
      "denied by AI", "fraud decision", "guaranteed eligibility",
      "official government determination".
- [ ] Assistant route runs reply text through `scrub()` and adds a
      disclaimer.
- [ ] No AI route is reachable from a non-authenticated session and writes
      user-identified data (eligibility prescreens, assistant conversations)
      to the database.

## Audit logging

- [ ] `audit_logs` writes go through `createAdminClient()` so users can't
      tamper with their own history.
- [ ] The following actions log to `audit_logs`:
      `signup`, `onboarding_complete`, `document_upload`,
      `notice_explanation`, `eligibility_prescreen`, `deadline_create`,
      `deadline_update`, `deadline_delete`, `assistant_query`,
      `profile_update`, `logout`.
- [ ] `audit_logs` `select` policy restricts reads to `is_admin()`.

## Build and runtime

- [ ] `npm run lint` — clean.
- [ ] `npm run typecheck` — clean.
- [ ] `npm run build` — clean.
- [ ] Vercel preview deploy renders /, /login, /signup, and /dashboard
      (the last redirects to /login when not signed in).
- [ ] In production, after signing up, signing in, and completing
      onboarding, the dashboard shows real data drawn from Postgres.

## Things you must NOT do

- Do not put `SUPABASE_SERVICE_ROLE_KEY` into a `NEXT_PUBLIC_*` variable.
- Do not call AI providers from client components.
- Do not store sensitive applicant data in `localStorage` in production.
- Do not bypass RLS by using the service-role client for routine queries.
- Do not present AI output as an eligibility decision, fraud finding, or
  official government determination.
