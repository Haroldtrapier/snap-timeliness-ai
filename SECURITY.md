# SNAP AI — Security overview

SNAP AI handles personally identifiable information (PII) for people interacting
with the SNAP program. This document describes the security model.

## Position

SNAP AI is **not** a government agency. It does **not** approve or deny SNAP
benefits, and it does **not** make fraud determinations. Flags are for human
review only. Final eligibility decisions are made by the state SNAP agency.

## Architecture

- **Frontend:** Next.js App Router on Vercel
- **Backend:** Supabase Postgres + Supabase Storage + Supabase Auth
- **AI:** Server-side routes only (`app/api/ai/*`). API keys are never exposed
  to the browser. The browser never talks to the AI provider directly.

## Data protection

| Layer | Control |
|---|---|
| AuthN | Supabase Auth (email/password, magic link, SSO-ready) |
| AuthZ | Row-level security (RLS) on every table |
| Roles | `applicant`, `recipient`, `navigator`, `county`, `state`, `admin` |
| Org scoping | Agency users only see clients tied to their organization |
| Documents | Private Supabase Storage bucket (`snap-documents`); signed URLs only |
| Transport | HTTPS only (Vercel + Supabase) |
| Secrets | Server-side env vars; service role key is server-only |
| Audit log | `audit_logs` table records AI suggestions and human actions |

## RLS guarantees

- An applicant can only see their own profile, clients, documents, notices,
  deadlines, and AI conversations.
- A navigator/county worker can only see clients tied to their organization
  (via `organization_members`).
- Audit logs are readable only by admins. Writes happen server-side using the
  service-role client.

The full RLS policy set is in
`supabase/migrations/20260522000000_initial_schema.sql`.

## AI safety

- All AI calls go through `/api/ai/*` routes.
- Every route imports the centralized `SYSTEM_PROMPT` and `SAFETY` strings from
  `lib/safety.ts`, which forbid banned language ("approved by AI", "denied by
  AI", "fraud detected", "guaranteed eligibility", "official government
  determination").
- Responses are scrubbed against the banned phrase list before being returned.
- Eligibility, deadline, and notice responses include a disclaimer.

## Pilot mode

- `NEXT_PUBLIC_USE_MOCK_DATA=true` runs the app on in-memory sandbox data with
  no real resident records. Recommended for evaluation and county demos.

## Things you must NOT do

- Do not put `SUPABASE_SERVICE_ROLE_KEY` into a `NEXT_PUBLIC_*` variable.
- Do not call AI providers from client components.
- Do not store sensitive applicant data in `localStorage` in production.
- Do not bypass RLS by using the service-role client for routine queries.
- Do not present AI output as an eligibility decision, fraud finding, or
  official government determination.

## Compliance posture (target)

- 7 CFR Part 273 (SNAP eligibility requirements) — reference only; SNAP AI does
  not determine eligibility.
- 7 CFR Part 277 (SNAP data security) — alignment via RLS, audit logs,
  protected storage.
- Section 508 (accessibility) — covered by Tailwind defaults plus user-selected
  accessibility preferences during onboarding.
- IRS 1075 / HIPAA — out of scope for the demo; addressed in pilot scoping.

## Reporting a vulnerability

Email the project owner with the details. Do not file public GitHub issues for
security reports.
