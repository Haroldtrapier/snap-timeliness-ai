# SNAP AI — Phase 2 Production Features

The MVP in this repo demonstrates the caseworker workflow with mock data. The
following features are scoped for the production rollout that follows a
successful 60–90 day pilot.

## Identity, access, and audit

- SSO via SAML 2.0 / OIDC against the agency identity provider
- Role-based access control: caseworker, supervisor, document reviewer, admin, auditor
- Tamper-evident audit log of every case action (who did what, when, to which case)
- Session timeout and device-bound sessions for compliance with state policy
- Mandatory MFA for supervisor and admin roles

## Data protection

- Encryption in transit (TLS 1.2+) and at rest (AES-256)
- PII tokenization for SSN, DOB, and document identifiers
- Per-tenant data isolation
- Secure document storage with virus scanning on upload
- Retention and disposition policies aligned to state record retention schedules
- Posture aligned to federal SNAP confidentiality (7 CFR §272.1(c)) and any applicable state requirements

## Eligibility & rules

- State-specific eligibility rule packs (7 CFR Part 273 plus state addenda)
- Income source library with categorical eligibility handling
- Expedited service detection per federal rules (homeless, no income, migrant/seasonal worker)
- Asset / resource verification workflows
- Configurable risk-flag library with caseworker feedback loop and false-positive tracking

## Document intelligence

- Optional AI-assisted document OCR and field extraction
- **Mandatory human verification gate** before any extracted field affects case data
- Document classification (ID, pay stub, utility bill, lease, etc.)
- Cross-document consistency checks (name, address, dates)
- Configurable confidence thresholds per document type

## Integration

- Bidirectional integration with state SNAP case management systems (NCFAST and equivalents)
- Document store integration (existing agency DMS or cloud object storage)
- Worker-queue sync with existing routing tools
- Federal reporting export (FNS-388 / FNS-388A)
- Webhook events for downstream agency systems

## Workforce experience

- Workforce analytics dashboard for supervisors (load balance, backlog, time-to-decision)
- Caseworker performance metrics (privacy-respecting, supervisor-only)
- Resident-facing notification templates for missing-document requests
- Multi-language support for resident-facing artifacts (English + Spanish at launch)

## Accessibility & compliance

- WCAG 2.1 AA conformance
- Section 508 conformance
- Keyboard-only operability for all primary workflows
- Screen-reader-tested ARIA labels across the case workbench

## Operational

- 99.9% target availability for pilot tenants; 99.95% target for production
- Disaster recovery: RPO ≤ 1 hour, RTO ≤ 4 hours
- Monitoring and alerting with on-call rotation
- Quarterly third-party security review

## Out of scope (intentionally)

- SNAP AI does not make final benefit determinations.
- SNAP AI does not automatically deny benefits.
- SNAP AI does not accuse applicants of fraud — it surfaces possible
  inconsistencies for human review.
