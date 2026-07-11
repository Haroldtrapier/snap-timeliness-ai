# SNAP-AI: SNAP Application Backlog Automation & Eligibility Acceleration

## 🎯 Project Overview

**Primary Target:** County & State Social Services Agencies  
**Core Purpose:** SNAP Application Backlog Automation & Eligibility Acceleration  
**Initial Deployment:** Cumberland County, North Carolina  
**Strategic Level:** State & County Government Automation Platform

---

## 🖥️ Web Application (Marketing Site & Product Previews)

This repository now includes the **production web application** — a
[Next.js](https://nextjs.org) (App Router) site built from the design handoff. It
presents the marketing site plus three interactive product previews (applicant
dashboard, notice explainer, agency console).

### Run locally

```bash
npm install
npm run dev      # http://localhost:3000
```

```bash
npm run build    # production build
npm run start    # serve the production build
```

Requires Node.js 18.18+ (Node 20+ recommended).

### Project structure

```
app/
  layout.tsx          # root layout, metadata, self-hosted fonts (next/font), skip link
  page.tsx            # marketing landing page (composes the section order)
  globals.css         # the full design system (tokens + component CSS)
  login/              # demo sign-in page + server actions (login/logout)
  app/                # authenticated product area (gated by middleware.ts)
    layout.tsx        #   app shell: top bar, role-aware nav, sign out
    page.tsx          #   workspace hub
    applicant/        #   /app/applicant — applicant dashboard
    notice/           #   /app/notice — notice explainer
    agency/           #   /app/agency — agency console
middleware.ts         # gates /app/* — redirects unauthenticated users to /login
components/
  Icons.tsx           # inline SVG icon set (typed)
  layout/             # Header (utility bar + nav), Footer
  sections/           # one file per landing section (Hero … FinalCTA, FAQ)
  dashboards/         # ApplicantDashboard, NoticeExplainer, AgencyDashboard
lib/
  data.ts             # typed sample data for the product previews
  auth.ts             # session helpers (DEMO cookie session — swap for a real IdP)
  repositories.ts     # async data-access layer (integration points for a real backend)
```

### Authentication & data (current state)

The authenticated product area under `/app` is real and navigable, but uses a
**demo session** (`lib/auth.ts`): sign-in accepts any email with no password and
sets an unsigned cookie. This is a scaffold, not production auth. Replace it with a
real identity provider (Supabase Auth, Auth.js, or SSO/SAML for agency staff) — the
route guards call only `getSession()` and the cookie name, so the swap is localized.

Likewise, `lib/repositories.ts` resolves the in-memory fixtures from `lib/data.ts`
behind async functions. Each is an integration point for a real, per-user,
auth-scoped data source.

### Notes for production

- **Design tokens** live as CSS custom properties at the top of `app/globals.css`.
- **Fonts** (Inter, Source Serif 4, JetBrains Mono) are self-hosted at build time via
  `next/font` — no CDN requests.
- **Accessibility**: skip link, focus-visible outlines, ARIA on the stage tracker,
  pipeline table, FAQ accordion, and reduced-motion support. Continue hardening toward
  WCAG 2.1 AA / Section 508 as required for a government-deployed tool.
- All sample data (names, case numbers, `−38%`, `1,847 active cases`, the May 2026
  calendar) is **fictional/illustrative**. Replace the `lib/data.ts` models and the
  dashboards with real, auth-gated services before any production use.

### Marketing imagery

The landing page uses four editorial photographs (hero food-distribution scene,
applicant kitchen table, caseworker workspace, and a civic-building trust band).
They were generated with **Higgsfield** and are referenced from a central manifest
in [`lib/media.ts`](lib/media.ts), which pairs each image with a CSS gradient
**fallback** so every media surface still reads as intentional if an asset URL is
unavailable. The shared `.media-frame` / `.trust-band` styles live at the bottom of
`app/globals.css`. To fully self-host, download each `src` in `lib/media.ts` into
`public/img/` and swap the URLs for local paths.

---

## 📋 What SNAP-AI Does

SNAP-AI is built to help counties **clear Supplemental Nutrition Assistance Program (SNAP) application backlogs** through intelligent automation of eligibility processing. The system addresses the critical delays in SNAP benefit delivery by accelerating application review while maintaining strict compliance with federal and state regulations.

### Core Functions

#### 1. **Automated Application Review**
- Intelligent parsing of SNAP applications (paper and digital)
- Automatic extraction of applicant information
- Cross-field validation and consistency checks
- Identification of missing or incomplete information
- Flagging of issues requiring human review

#### 2. **Eligibility Pre-Screening**
- Automated income verification checks
- Household composition analysis
- Asset and resource verification
- Categorical eligibility determination
- Preliminary benefit calculation
- Compliance with federal income limits (130% of poverty line)

#### 3. **Document Validation**
- Automated document classification and indexing
- Identity verification support
- Income documentation review (pay stubs, tax returns)
- Residency verification
- Citizenship/immigration status validation
- Utility bill and expense verification

#### 4. **Case Prioritization**
- Urgency scoring based on household needs
- Expedited service identification (homeless, no income, migrant workers)
- Application age tracking and priority queuing
- Time-to-decision monitoring
- Deadline compliance tracking

#### 5. **Workload Distribution Dashboards**
- Real-time case assignment to eligibility workers
- Capacity-based load balancing
- Performance metrics and productivity tracking
- Backlog visualization and trending
- Worker efficiency analytics

#### 6. **Compliance Checks**
- Federal SNAP guidelines enforcement (7 CFR Part 273)
- State-specific regulation compliance (North Carolina DHHS rules)
- Quality control scoring
- Error rate reduction
- Audit trail maintenance

#### 7. **Processing Speed Improvement & Reporting**
- Processing time analytics
- Bottleneck identification
- Workflow optimization recommendations
- Federal reporting compliance (FNS-388, FNS-388A)
- Performance reporting for state and federal oversight

---

## 🎯 Strategic Positioning

### Market Position
- **State & County Government Automation Platform**
- Workforce augmentation tool (not replacement)
- Reduces SNAP application processing delays
- Improves benefit delivery timelines for vulnerable populations
- Positioned for state modernization grants and digital transformation funding

### Key Differentiators
- **Human-Centered Automation:** Assists eligibility workers rather than replacing them
- **Regulatory Compliance Built-In:** Ensures adherence to federal and state SNAP rules
- **Rapid Deployment:** County-level implementation in weeks, not years
- **Scalable Solution:** From single-county pilots to statewide rollout

---

## 🏛️ Target Deployment

### Primary Customers
- **County Departments of Social Services (DSS)**
- **State Human Services Agencies**
- North Carolina Department of Health and Human Services (NCDHHS)
- Other state SNAP agencies nationwide

### Initial Pilot
- **Cumberland County, North Carolina**
- Population: ~330,000
- SNAP caseload: ~30,000+ households
- Known for significant application backlogs

### Expansion Roadmap
1. **Phase 1:** Cumberland County pilot
2. **Phase 2:** North Carolina statewide rollout
3. **Phase 3:** Multi-state expansion

---

## 💼 Business Model

**Revenue Model:** SaaS + Government Contracts  
- Per-application pricing model
- Monthly/annual subscription tiers
- County-level contracts
- State enterprise agreements
- Implementation and training services
- Ongoing support and maintenance

### Funding Sources
- County IT modernization budgets
- State SNAP administrative funding (50% federal match)
- Federal modernization grants
- Digital transformation initiatives

---

## 📊 Key Performance Indicators

### Success Metrics
- **Application Processing Time:** Target 50% reduction in processing days
- **Backlog Reduction:** Clear aged applications within 90 days
- **Accuracy Rate:** Maintain >95% eligibility determination accuracy
- **Timeliness Compliance:** Meet federal 30-day processing standard
- **Cost Efficiency:** Reduce per-application administrative cost
- **Client Satisfaction:** Improved applicant experience scores

### Federal SNAP Performance Measures
- **Payment Error Rate (PER):** Target <5%
- **Negative Error Rate (NER):** Target <5%
- **Positive Error Rate (POSER):** Minimize overpayments
- **Timeliness:** 30-day standard for non-expedited, 7-day for expedited

---

## 🔐 Compliance & Security

### Federal Regulations
- **7 CFR Part 273:** SNAP Eligibility Requirements
- **7 CFR Part 277:** SNAP Data Security Standards
- **FNS Handbook 901:** Quality Control Review

### Data Security
- **PII Protection:** Personal Identifiable Information safeguards
- **IRS 1075 Compliance:** Tax information security
- **HIPAA Compliance:** Health information protection (if applicable)
- **State Security Standards:** North Carolina SCIF compliance

### Accessibility
- **Section 508 Compliance:** ADA accessibility requirements
- **Language Access:** Multi-language support for LEP populations

---

## 🛠️ Technology Stack

*(To be populated with specific technical architecture)*

### Anticipated Core Components
- Document OCR and classification
- Natural Language Processing (NLP)
- Rules engine for eligibility determination
- Integration with state SNAP systems (NC FAST, etc.)
- Secure API layer
- Cloud-based infrastructure
- Real-time analytics dashboard

---

## 🚀 Roadmap

### Phase 1: Cumberland County Pilot (Q2 2026)
- Core application review automation
- Document classification system
- Basic eligibility pre-screening
- Integration with NC FAST system

### Phase 2: Enhanced Intelligence (Q3-Q4 2026)
- Advanced ML models for fraud detection
- Predictive workload balancing
- Mobile-friendly case worker interface
- Expanded reporting capabilities

### Phase 3: Statewide Rollout (2027)
- Multi-county deployment across North Carolina
- State-level analytics and oversight tools
- Cross-county performance benchmarking
- Continuous improvement based on pilot learnings

### Phase 4: National Expansion (2027-2028)
- Multi-state platform deployment
- State-specific configuration management
- Federal reporting automation
- Best practice sharing network

---

## 📞 Project Information

**Project Type:** State/County Government Social Services Automation  
**Status:** Development / Pilot Planning  
**Primary Location:** Cumberland County, North Carolina  
**Owner:** Harold Trapier  

---

## 🌐 Related Projects

- **Vision-AI:** Federal VA claims modernization platform
- **Sturgeon AI:** Contract intelligence system for government contractors

---

## 📝 Notes

This system is **separate from Sturgeon AI**, which serves government contractors. SNAP-AI is designed specifically for **county and state government social services agencies** to improve benefits delivery.

**SNAP-AI is a workforce augmentation tool**, not a workforce replacement. It is designed to help eligibility workers process applications faster and more accurately while maintaining compliance with federal SNAP regulations.

### Why Cumberland County?
- Known SNAP processing backlogs
- Strong county government leadership
- Opportunity for measurable impact
- Strategic location in North Carolina for state-level expansion

---

*Last Updated: February 2026*