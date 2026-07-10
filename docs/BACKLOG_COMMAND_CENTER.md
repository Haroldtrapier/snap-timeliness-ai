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

## Known gaps / next steps

- **Persistence is browser-local** for the demo. Productionizing means mapping
  the `lib/backlog` model onto the existing Supabase schema (`clients`,
  `snap_cases`, `checklist_items`, `documents`, `deadlines`) + `log_audit` RPC,
  and moving mutations into server actions with RLS.
- Alerts are in-app only (no email/SMS yet).
- Reports export via browser print-to-PDF (no server-rendered PDF yet).
- Role selector is a demo affordance; real RBAC should derive from
  `profiles.user_type`.
- No automated tests yet (repo has no test runner configured); verified via
  `next build` typecheck + a headless-browser smoke test of all routes.
