# SNAP AI — Caseworker MVP Demo

SNAP AI is a standalone, AI-powered benefits processing support system for SNAP /
state social services agencies. It helps caseworkers process applications faster
by organizing intake data, reviewing uploaded documents, surfacing missing or
inconsistent information, flagging risk indicators, generating case summaries,
and routing final decisions to human review.

> **SNAP AI provides decision support only. Final eligibility decisions remain
> with authorized agency staff.** SNAP AI does not deny benefits automatically and
> does not accuse applicants of fraud.

This repository contains a **frontend MVP** built for a pilot demo with state
and county leadership. All data is mocked — no real resident data is used.

For deeper background and product positioning, see [`docs/PROJECT_BACKGROUND.md`](./docs/PROJECT_BACKGROUND.md).

---

## Tech stack

- React 18 + TypeScript
- Vite 5
- React Router 6
- Local React state (no backend required for the demo)

---

## Run locally

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build → dist/
npm run preview  # preview the production build
```

A FastAPI backend is **not** required for the demo. Production rollout uses a
secure backend with audit logging and state-specific rule packs (see Phase 2
below).

---

## App routes

| Route | Purpose |
|---|---|
| `/` | Landing page — plain-language pitch + CTA |
| `/dashboard` | Caseworker dashboard — totals, pending, missing docs, risk flags, today’s priority cases |
| `/intake` | Applicant intake form — saves to local state |
| `/household` | Household composition, unusual-pattern detection |
| `/documents` | Document checklist, mock upload, mismatch examples |
| `/eligibility` | Rules-based eligibility pre-screen + disclaimer |
| `/risk` | Risk / integrity flags across the case load |
| `/summary` | AI case summary — generate, copy, send to human review |
| `/queue` | Human review queue — priority, status, assign reviewer, escalate |
| `/pilot` | Senator / pilot brief — outcomes, security, pricing, Phase 2 |

---

## Mock data

Six demo cases ship in `src/data/mockCases.ts`:

1. `SNAP-1001` — clean application, likely eligible
2. `SNAP-1002` — missing proof of income
3. `SNAP-1003` — same household duplicate application (children listed twice, same address)
4. `SNAP-1004` — utility bill in child’s name
5. `SNAP-1005` — emergency expedited need (zero income, elderly + disabled household member)
6. `SNAP-1006` — possible altered ID document

---

## Compliance & safety language

The UI consistently uses non-accusatory language:

- "possible inconsistency"
- "requires review"
- "risk indicator"
- "human review required"

Every high-severity flag is marked **Requires human review**. The pre-screen
result and case summary include the disclaimer above.

---

## Privacy & security messaging (pilot brief)

- Encryption in transit and at rest
- Role-based access control (caseworker / supervisor / admin)
- Audit logs of every case action
- No real resident data in the pilot demo
- Posture aligned to federal SNAP confidentiality requirements (7 CFR §272.1(c))

---

## Demo script for the Senator meeting

See [`docs/DEMO_SCRIPT.md`](./docs/DEMO_SCRIPT.md).

---

## Phase 2 production features

Listed in-app on `/pilot` and in [`docs/PHASE_2.md`](./docs/PHASE_2.md):

- SSO (SAML/OIDC) and full RBAC
- Secure document storage with virus scan + PII tokenization
- State-specific eligibility rule packs (7 CFR Part 273 + state addenda)
- Integration with state SNAP case management (NCFAST and equivalents)
- Workforce analytics for supervisors
- Configurable risk-flag library with caseworker feedback loop
- Tamper-evident end-to-end audit logging
- WCAG 2.1 AA / Section 508 conformance
- FNS-388 / FNS-388A federal reporting export
- Optional AI-assisted document OCR with mandatory human verification gate

---

## What this is *not*

This is not Sturgeon, not Apex OS / Imani, and not GovCon. SNAP AI is its own
standalone product for state and county social services agencies.
