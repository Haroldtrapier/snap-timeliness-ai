# SNAP AI — Backlog Command Center (Phase 1 demo)

A supervisor-facing, human-in-the-loop backlog triage surface for county DSS /
Social Services offices. It lives inside the authenticated agency console at
**`/app/agency/backlog`** and is fully self-contained: it seeds fictional,
anonymized demo data and persists interactions in the browser (`localStorage`),
so it runs with **no Supabase or API keys required**.

> SNAP AI is human-in-the-loop decision support. It does **not** approve, deny,
> or replace caseworkers. Every recommendation and pre-screen result states that
> worker review is required.

## Demo flow (acceptance criteria)

1. Sign in / enter demo mode at `/login` (choose **Agency**) — no password in demo mode.
2. Open **Backlog AI** in the top nav → lands on `/app/agency/backlog`.
3. Use the **County** selector (Cumberland, Mecklenburg, Wake, Guilford, Durham, Forsyth).
4. View the **County dashboard** — pending / expedited / overdue / near-deadline /
   missing-docs / ready-for-review counts, a **backlog risk score** + timeliness
   score, and weekly trend cards.
5. **Upload** a backlog CSV (`/upload`) — column validation, import preview,
   error + duplicate flagging, sample template download.
6. Open the **Priority Queue** — ranked cases, each with a plain-language
   explanation and visual tags.
7. Open a **case detail** page — summary, household/income/expenses, missing-doc
   checklist, eligibility pre-screen notes, worker notes, activity history.
8. **Change document / case status, assign a worker, add a note** — every action
   is logged.
9. Generate a **printable leadership report** (`/reports`, Print / Save as PDF).
10. Review the **audit log** and role-based access under `/admin`.
11. Tune pre-screen thresholds and SLAs under `/settings`.

## Architecture

- `lib/backlog/` — framework-agnostic domain logic:
  - `types.ts` domain model · `config.ts` thresholds/SLAs/disclaimers
  - `derive.ts` deadlines, priority scoring + explanations, eligibility pre-screen
  - `metrics.ts` dashboard metrics + backlog risk · `alerts.ts` alerts engine
  - `csv.ts` parse/validate/preview + sample template · `report.ts` report builder
  - `seed.ts` fictional demo data · `store.tsx` client store (context + `localStorage` + audited mutations)
- `components/backlog/` — `badges.tsx` (status/risk/priority/severity), `BacklogNav.tsx`
- `app/app/agency/backlog/` — routes: dashboard, `upload`, `queue`, `cases`,
  `cases/[id]`, `reports`, `alerts`, `admin`, `settings` (+ scoped `backlog.css`)

Styling is scoped under `.bk-*` classes so it never collides with the existing
app's global styles.

## Compliance & positioning

- Demo data is fictional and anonymized; applicant names are shown as
  `Household #XXXX` labels, never raw PII.
- Human-review disclaimers appear on the dashboard, every case, every pre-screen
  result, and every report.
- Integration is described as an **NC FAST-compatible intake layer
  (integration-ready architecture)** — no live NC FAST integration is claimed.

## Persistence (Supabase)

The backlog persists to Postgres when Supabase is configured for a signed-in
agency user, and falls back to the localStorage demo otherwise. Two migrations
under `supabase/migrations/`:

- `0001_backlog_command_center.sql` — the `bk_*` tables (counties, workers,
  cases, case documents + events, notes, audit), initially owner-scoped.
- `0002_backlog_org_scope.sql` — **org-scoped sharing**: a self-contained
  `bk_organizations` / `bk_org_members` model so a whole county DSS team shares
  one backlog. Every owned row's `org_id` defaults to the caller's org via
  `bk_ensure_org()`, so inserts auto-provision + stamp the org (no app-code
  change). RLS on every owned table is `org_id is not null and bk_is_member(org_id)`.

Both migrations are **applied and verified** on the `snap-ai` Supabase project
(`pdtonyrjdmilidwehibk`). Org isolation + team sharing were proven with a
two-user RLS test (a different-org user sees 0 rows; after joining the org they
see the shared case).

## Making the deployed preview run in Live mode

The branch preview currently runs in **Demo** mode because the preview
deployment has no Supabase env vars (that's why any-password demo login works).
To flip a deployment to Live: set `NEXT_PUBLIC_SUPABASE_URL` +
`NEXT_PUBLIC_SUPABASE_ANON_KEY` on that deployment's environment and redeploy.
Note that enabling real Supabase auth replaces the demo login with real
sign-in, and the app's base schema (`profiles`, etc.) must exist for the rest
of the app to function.

## Known gaps / next steps

- Alerts are in-app only (no email/SMS yet).
- Reports export via browser print-to-PDF (no server-rendered PDF yet).
- Role selector is a demo affordance; production RBAC can map the
  `bk_org_members.role` to the in-app role.
- No automated tests yet (repo has no test runner configured); verified via
  `next build` typecheck, a headless-browser smoke test of all routes, and a
  live RLS test for the org policies.
