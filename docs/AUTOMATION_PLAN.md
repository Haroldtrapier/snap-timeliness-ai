# Automation Roadmap — Implementation Plan

**Status:** Draft for review · **Scope:** Audit item #4 (the core "SNAP
automation" the README/specs advertise but that does not yet exist in code).

This plan covers the two unbuilt pillars: an **eligibility pre-screening
engine** and **document intake extraction**. It is written to be built in
phases, engine-first, with every phase independently shippable and testable.

---

## Non-negotiable guardrails

These shape every design decision below and match the product's existing
positioning ("Guidance and preparation support only · Final eligibility
decisions are made by your state SNAP agency"):

1. **Estimate, never a determination.** The engine produces a *pre-screening
   estimate*. It never approves, denies, or issues benefits. Every output is
   labeled as an estimate and repeats the not-a-decision disclaimer already used
   across the app and in reminder emails.
2. **Human-in-the-loop.** Extraction and estimates are decision *aids* for the
   applicant and caseworker. Nothing auto-populates an official record without a
   human confirming it.
3. **Explainable and auditable.** Every estimate carries a full rule trace
   (which threshold, which input, which result) and a policy version. This is
   required for 7 CFR compliance, appeals-readiness, and the existing
   `audit_log`.
4. **Data-driven policy, not hardcoded constants.** SNAP figures change every
   federal fiscal year (Oct 1). They live in versioned DB tables, updatable
   without a code deploy.

---

## Part A — Eligibility pre-screening engine

### A1. Policy data (new tables, migration + seed)

All figures are **loaded from the database**, keyed by fiscal year and region
(48 states + DC / Alaska / Hawaii) so the engine is multi-state and
year-over-year maintainable:

| Table | Holds |
|-------|-------|
| `policy_fpl` | Federal Poverty Guidelines by household size + region |
| `policy_income_limits` | Gross (130% FPL) and net (100% FPL) monthly limits — derivable from FPL |
| `policy_deductions` | Standard deduction (by hh size), 20% earned-income deduction, dependent-care, medical threshold, excess-shelter cap, homeless shelter standard, state Standard Utility Allowances |
| `policy_allotments` | Maximum and minimum monthly allotment by hh size + region |
| `policy_bbce` | Per-state Broad-Based Categorical Eligibility config (gross limit %, asset-test waiver) — **NC uses BBCE** |

> **Verification task (blocking for the seed migration, not the design):** the
> actual FY2026 dollar figures must be transcribed from the official FNS COLA
> tables and NC DHHS SUA tables and checked by a second reviewer before seeding.
> The engine design does not depend on any specific number.

### A2. The calculation (7 CFR 273.9 / 273.10)

A pure, deterministic module `lib/eligibility/` — no I/O, fully unit-testable:

1. **Household composition** — size, and whether any member is elderly (60+) or
   disabled (changes which tests apply and uncaps the shelter deduction).
2. **Categorical eligibility (BBCE)** — if the household receives qualifying
   TANF-funded benefits or meets the state BBCE gross limit, the asset test and
   sometimes the gross test are bypassed.
3. **Gross income test** — gross monthly income ≤ 130% FPL (waived for
   elderly/disabled households and BBCE cases).
4. **Deductions → net income** — 20% earned-income deduction, standard
   deduction, dependent care, child support paid, medical (elderly/disabled over
   threshold), and the excess-shelter deduction (with SUA), capped except for
   elderly/disabled households.
5. **Net income test** — net monthly income ≤ 100% FPL.
6. **Asset test** — only when not waived by BBCE; configurable limits.
7. **Benefit estimate** — `max_allotment − 0.30 × net_income`, floored at the
   minimum allotment for 1–2 person households, `$0` below the issuance
   threshold.
8. **Expedited screening (7 CFR 273.2(i))** — gross monthly income < $150 **and**
   liquid resources ≤ $100; **or** income + resources < monthly rent/mortgage +
   utilities; **or** destitute migrant/seasonal worker → 7-day processing flag.

### A3. Output model (new table `eligibility_estimates`)

```
{ case_id, computed_at, policy_version,
  gross_income_cents, net_income_cents,
  gross_test_pass, net_test_pass, asset_test_pass,
  categorically_eligible, likely_eligible,
  estimated_monthly_benefit_cents,
  expedited_flag,
  rule_trace: [ { step, description, input, threshold, result } ],
  disclaimer }
```

The `rule_trace` is what makes the estimate explainable rather than a black box.

### A4. Integration points (mostly already scaffolded)

- **Intake** — onboarding already captures `household_size` and
  `monthly_income_cents`. Extend it (and a new editable "financial profile"
  form) to capture the remaining engine inputs: earned vs. unearned income,
  shelter + utility costs, dependent-care, elderly/disabled members, and
  (if not BBCE-waived) liquid assets.
- **Applicant dashboard** — show a pre-screen card: "Based on what you entered,
  you *may* qualify for an estimated **$X/month**. This is an estimate, not a
  decision." Drives readiness and next-steps.
- **Caseworker queue / reports** — the `expedited_flag` and `likely_eligible`
  become prioritization signals, wiring up the README's "Case Prioritization"
  and "urgency scoring" features that are currently absent.

### A5. Testing

Rules engines live or die on their test suite. A **golden-case suite** built
from published FNS pre-screening examples, plus **boundary tests** at every
threshold (one dollar under/over each limit), plus property tests (benefit never
negative, never exceeds max allotment). This is high-value, fully offline, and
runs in the CI added in the previous phase.

---

## Part B — Document intake extraction

### B1. Reuse the notice-explainer pattern

`lib/anthropic.ts` already does Claude vision/PDF with structured JSON output and
prompt caching. Add `lib/extraction/` with per-document-type schemas:

| Document | Extracted fields |
|----------|------------------|
| Pay stub | employer, gross pay, pay frequency, YTD gross, pre-tax deductions |
| Photo ID | full name, DOB, address, expiry |
| Utility bill | provider, amount, service address, statement date |
| Bank statement | balance, account type, statement period |

### B2. Flow (async — never in the upload request path)

1. On upload (`documents/actions.ts`), enqueue extraction.
2. A worker (Vercel background function, or a cron sweep of unprocessed docs)
   runs the Claude call and writes a new `document_extractions` row
   `{ document_id, doc_type, fields jsonb, confidence, needs_review, model,
   extracted_at }`.
3. The caseworker queue shows extracted fields **next to** the document for
   one-click verify/correct — HITL, never auto-accepted.
4. Extracted income can **cross-check** the applicant's declared figures and
   flag mismatches — implementing the README's "cross-field validation."

### B3. Guardrails specific to extraction

- Low confidence → `needs_review = true`, routed to a human; never silently
  trusted.
- Extractions hold PII → same RLS discipline as `documents`, plus a retention
  policy (extractions are derived data; consider TTL / purge-on-decision).
- No official record is written from an extraction without human confirmation.

---

## Phasing

| Phase | Deliverable | Risk | Depends on |
|-------|-------------|------|-----------|
| 1 | Policy tables + migration + seed (verified FY2026 numbers) | Low | schema (done) |
| 2 | Pure eligibility engine + golden/boundary test suite (no UI) | Low | 1 |
| 3 | Intake extension + applicant pre-screen estimate card | Med | 2 |
| 4 | Caseworker prioritization (expedited + likely-eligible signals) | Med | 2 |
| 5 | Document extraction (schemas + async worker + review UI) | Med-High | schema, anthropic |
| 6 | Cross-field validation (extracted vs. declared) | Med | 3, 5 |

**Recommended order: engine first (1 → 2).** It is the actual product
differentiator, the lowest-risk to build, and 100% testable without any UI or
external service. Everything else layers on top.

---

## Open decisions (need your call before Phase 1)

1. **Estimate vs. pass/fail.** Show an estimated dollar benefit, or only a
   "you may/may not qualify" pre-screen? *Recommendation: estimate with a
   prominent disclaimer — far more useful, still not a determination.*
2. **NC-specific vs. generic-plus-config.** *Recommendation: generic federal
   engine + per-state config (seed NC first). Keeps the multi-state roadmap
   open at little extra cost.*
3. **Asset test.** NC uses BBCE (asset test generally waived). *Recommendation:
   implement it but make it config-gated so BBCE states skip it.*
4. **Build extraction now or defer.** *Recommendation: defer to after the engine
   (Phase 5). It depends on more infra (async worker) and delivers less than the
   engine.*
5. **Policy-number ownership.** Who maintains the annual figures? *Recommendation:
   seed via migration + make the tables admin-editable so updates need no
   deploy.*
