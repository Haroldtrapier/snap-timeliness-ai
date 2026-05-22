# SNAP AI

Guidance and preparation software for the U.S. Supplemental Nutrition
Assistance Program (SNAP). SNAP AI helps applicants, current recipients,
benefits navigators, nonprofits, county DSS teams, and state agencies
understand requirements, prepare documents, explain notices, track deadlines,
and move cases forward — with humans in the loop.

> **SNAP AI is not a government agency.** It does not approve, deny, or make
> final eligibility decisions. Final decisions are made by the state SNAP
> agency. Caseworker support — not caseworker replacement.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- Supabase Auth / Postgres / Storage with row-level security
- Server-side AI routes (`app/api/ai/*`) — provider keys never reach the browser
- Vercel deployment target

## Run locally

```bash
npm install
cp .env.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
# SUPABASE_SERVICE_ROLE_KEY, and (optionally) ANTHROPIC_API_KEY or OPENAI_API_KEY.
# Apply the migration in supabase/migrations to your Supabase project first.
npm run dev
```

The app boots at <http://localhost:3000>. Without Supabase env, the auth,
dashboard, documents, notices, deadlines, and settings routes will return
a configuration error — set the env vars to bring the app to life.

## Lint, typecheck, build

```bash
npm run lint
npm run typecheck
npm run build
```

## Routes

### Public
- `/` — home
- `/how-it-works`
- `/for-applicants`
- `/for-recipients`
- `/for-navigators`
- `/for-agencies`
- `/integrity`
- `/pilot`
- `/faq`

### Auth
- `/login`
- `/signup`
- `/onboarding`

### Applicant / recipient app
- `/dashboard`
- `/eligibility-check`
- `/application-checklist`
- `/documents`, `/documents/[id]`
- `/notices`, `/notices/[id]`, `/notices/new`
- `/deadlines`
- `/benefit-planner`
- `/grocery-plan`
- `/assistant`
- `/settings`

### Navigator / agency portal
- `/org/dashboard`
- `/org/clients`, `/org/clients/[id]`
- `/org/tasks`
- `/org/deadlines`
- `/org/reports`
- `/org/settings`

### Server-side AI routes
- `POST /api/ai/assistant`
- `POST /api/ai/notice-explainer`
- `POST /api/ai/document-classify`
- `POST /api/ai/eligibility-prescreen`

## Supabase

Schema and RLS policies live in
[`supabase/migrations/20260522000000_initial_schema.sql`](./supabase/migrations/20260522000000_initial_schema.sql).
See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for the setup walk-through.

## Deploy to Vercel

1. Push this branch to GitHub.
2. Import the repo in Vercel.
3. Set environment variables (see `.env.example`).
4. Deploy. Vercel builds with `next build` automatically.

## Docs

- [PILOT_READINESS.md](./PILOT_READINESS.md) — what's built, measurable
  outcomes, implementation timeline.
- [SECURITY.md](./SECURITY.md) — auth, RLS, storage, AI safety.
- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) — bring up the backend.
- [docs/PROJECT_SPECS.md](./docs/PROJECT_SPECS.md) — strategic spec.
- [docs/ECOSYSTEM.md](./docs/ECOSYSTEM.md) — ecosystem overview.

## Safety language reminder

We use: *guidance only*, *possible*, *preliminary*, *flag for review*, *human
review required*.

We never use: *approved by AI*, *denied by AI*, *fraud decision*, *guaranteed
eligibility*, *official government determination*.

## License

Proprietary — pilot evaluation only.
