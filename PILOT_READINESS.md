# Pilot readiness — Senator / County briefing

This document is the at-a-glance status for the SNAP AI pilot conversation.

## Position

- SNAP AI is **not** a government agency.
- SNAP AI does **not** approve, deny, or make final eligibility decisions.
- Final eligibility decisions are made by the state SNAP agency.
- SNAP AI provides guidance and preparation support only.
- Flags are for human review only.
- Caseworker support — not caseworker replacement.

## Pilot scope (60–90 days)

- **County:** Cumberland County, NC (target)
- **Users:** 3–5 staff (workers + supervisor) + sandbox applicant accounts
- **Data:** Sandbox / synthetic — no real resident records required
- **Workflow:** Human-in-the-loop on every meaningful action
- **Reporting:** Weekly outcome readout to county leadership

## What's working today (in this repo)

| Capability | Route | Status |
|---|---|---|
| Public marketing site | `/`, `/how-it-works`, `/for-applicants`, `/for-recipients`, `/for-navigators`, `/for-agencies`, `/integrity`, `/pilot`, `/faq` | Built |
| Auth (mock) | `/login`, `/signup`, `/onboarding` | Mock; ready to wire to Supabase Auth |
| Applicant dashboard | `/dashboard` | Built (mock data) |
| Eligibility check | `/eligibility-check` | Built (federal references) |
| Application checklist | `/application-checklist` | Built |
| Documents + detail | `/documents`, `/documents/[id]` | Built with classification + flags |
| Notices + explainer | `/notices`, `/notices/[id]`, `/notices/new` | Built |
| Deadlines | `/deadlines` | Built |
| AI assistant | `/assistant` + `/api/ai/assistant` | Built — server-side, banned-phrase scrubber |
| Settings | `/settings` | Built |
| Benefit planner | `/benefit-planner` | Built |
| Grocery plan | `/grocery-plan` | Built |
| Org dashboard | `/org/dashboard` | Built |
| Clients + detail | `/org/clients`, `/org/clients/[id]` | Built with review flags |
| Org tasks | `/org/tasks` | Built |
| Org deadlines | `/org/deadlines` | Built |
| Reports | `/org/reports` | Built |
| Org settings | `/org/settings` | Built |
| Supabase schema | `supabase/migrations/...` | Written, ready to apply |
| AI routes | `/api/ai/{assistant,notice-explainer,document-classify,eligibility-prescreen}` | Built |

## Measurable outcomes (pilot)

- Reduced incomplete applications
- Faster document review (target: avg days to decision down ≥20%)
- Better deadline visibility for applicants
- Backlog visibility for supervisors
- Improved caseworker workload visibility

## Cybersecurity and privacy

- Supabase Postgres with row-level security on every table
- Protected storage bucket (`snap-documents`) with signed URLs
- Server-side AI routes only; provider keys never reach the browser
- Role-based access control: applicant, navigator, county, state, admin
- Full audit log of AI suggestions and human dispositions
- Sandbox mode for demos — no real resident data required

## Implementation timeline

| Week | Milestone |
|---|---|
| 1 | Pilot kickoff. Sandbox dataset chosen. Staff onboarded. |
| 2–4 | Workflow integration. Navigator/worker training. Baseline metrics captured. |
| 5–10 | Live pilot with weekly outcome review and staff feedback loop. |
| 11–13 | Outcome report. Applicant experience feedback. Expansion decision. |

## What is post-pilot (not in scope for Senator demo)

- NC FAST or other state-of-record integrations
- SSO / SAML for county and state IdPs
- Production language coverage beyond English/Spanish
- Federal FNS-388/388A automated submission
- IRS 1075 / HIPAA-bound flows (if program design requires)
- Mobile native apps

## Feedback loops

- Weekly staff feedback session during pilot
- Applicant experience feedback collected at every milestone
- Pilot debrief and outcome report shared with county leadership

## Policy-safe implementation reminders

- SNAP AI does **not** approve or deny benefits
- SNAP AI does **not** make eligibility determinations
- SNAP AI never issues fraud findings — flags are for human review only
- Aligned with caseworker workflows, not in place of them
- Designed to support state oversight and quality control
