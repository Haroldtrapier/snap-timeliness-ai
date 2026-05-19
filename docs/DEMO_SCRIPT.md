# SNAP AI — Demo Script (Senator Meeting)

**Length:** ~10 minutes
**Audience:** Senator Val + staff
**Goal:** Show a working benefits-processing support tool, position the 60–90 day pilot, reinforce human-in-the-loop and privacy posture.

---

## 0. Opening (30 sec)

> "Senator, what you're about to see is SNAP AI. It's a tool we built for the
> caseworkers in your state who are processing SNAP applications every day.
> It does **not** decide who gets benefits — staff do. It just helps them get
> through the backlog faster and with fewer mistakes."

Open the app at `/` (Landing).

---

## 1. Landing Page (30 sec) — `/`

- Read the headline: *"An AI-powered support system for SNAP caseworkers."*
- Point out the six feature cards.
- Click **Enter Caseworker Demo**.

> "Everything you'll see is mock data. No real resident information is in this build."

---

## 2. Caseworker Dashboard (1 min) — `/dashboard`

Walk through the four KPIs:

- **Total applications** — pilot queue size
- **Pending review** — what staff still has to touch
- **Missing documents** — auto-detected gaps
- **Risk flags** — possible inconsistencies surfaced

Then point to:

- **Average processing time saved** — pilot target metric
- **Today's priority cases** — expedited + high-risk surfaced for the caseworker

> "The dashboard answers the supervisor's first question every morning:
> 'Where do we need to focus?'"

---

## 3. Applicant Intake (1 min) — `/intake`

- Fill in a quick mock applicant (any name, household size 2, income $1,400).
- Check **Emergency need**.
- Click **Save application**.

> "Same structured intake every time. Caseworkers don't waste time chasing
> fields. And if a household indicates emergency need, the system routes it
> to expedited review automatically — but staff still own the decision."

---

## 4. Household Members (1 min) — `/household`

Switch the case dropdown to **SNAP-1003 (Renee Carter)**.

- Point out the **Unusual household patterns** banner — *"Luis Alvarez and Sofia
  Alvarez also appear on SNAP-1001 at the same address."*

> "Two different adults submitted SNAP applications listing the same two
> children at the same address. SNAP AI doesn't accuse anyone — it just routes
> this to a human reviewer."

---

## 5. Document Review (1 min) — `/documents`

Switch to **SNAP-1004 (Devon Pierce)**.

- Point out the **utility bill** status: *possible mismatch — bill is in the
  name of minor child Jamal Pierce.*
- Scroll to the *fake/altered document risk examples* table.

> "These are common patterns we surface. We don't deny benefits over them —
> the application goes to a human reviewer with the evidence already organized."

---

## 6. Eligibility Pre-Screen (45 sec) — `/eligibility`

Switch to **SNAP-1005 (Brenda Hollis)**.

- Result: *Expedited review recommended.*
- Read the **disclaimer** out loud:
  > "SNAP AI provides decision support only. Final eligibility decisions remain
  > with authorized agency staff."

> "This case has $0 reported income, an elderly spouse, and a disability flag.
> Federal expedited service rules may apply — but the caseworker confirms that,
> not the model."

---

## 7. Risk / Integrity Flags (45 sec) — `/risk`

- Scroll the live flag table.
- Point at **SNAP-1006** — possible altered ID document, marked **Requires human review**.

> "Every high-severity flag carries that phrase: *Requires human review.* That
> is the contract with the agency."

---

## 8. AI Case Summary (1 min) — `/summary`

Pick **SNAP-1003**, click **Generate Summary**.

Read the section headers aloud: applicant overview → household → documents →
risk indicators → pre-screen result → recommended next action → disclaimer.

> "This is what the caseworker gets. It used to take them 15–20 minutes to
> assemble. Now it's one click and a copyable brief."

Click **Send to Human Review** to demonstrate the routing.

---

## 9. Human Review Queue (45 sec) — `/queue`

- Show the priority sort (expedited at top).
- Assign a reviewer to one case.
- Click **Request docs** on the missing-income case.

> "Supervisors see exactly who has what and what's stuck. Nothing leaves this
> queue without a caseworker action."

---

## 10. Pilot Brief (1 min) — `/pilot`

Walk the four panels: pilot structure → human-in-the-loop → security/privacy
→ measurable outcomes.

> "60 to 90 days. Three to five users. Mock cases — no real residents in the
> pilot demo. We give you the outcome numbers at day 30 and day 60. Pricing
> is fixed-fee per pilot, finalized once we scope users and integrations."

---

## 11. Close (30 sec)

> "Three things to remember, Senator:
> 1. **Staff make every decision.** SNAP AI never denies benefits and never accuses anyone.
> 2. **No real resident data** is in the demo.
> 3. **A 60–90 day pilot** gets your state measurable processing-time improvements without disrupting NCFAST or any existing system.
>
> Happy to walk your team through the security posture and rule packs whenever you’re ready."

---

## Anticipated questions & answers

**Q: Does this replace caseworkers?**
A: No. It's a productivity tool. Every benefit determination stays with authorized agency staff.

**Q: What if the AI is wrong about a flag?**
A: The flag is just a signal. The caseworker reviews the evidence and makes the call. We track flag accuracy across the pilot so the rules get tuned.

**Q: Is the resident's data safe?**
A: Encryption in transit and at rest, role-based access, audit logs, no real resident data in this demo. In production we align to federal SNAP confidentiality (7 CFR §272.1(c)) and the state's requirements.

**Q: How does this fit with NCFAST or our existing case system?**
A: Phase 2 adds direct integration. For the pilot, SNAP AI runs alongside the existing system — staff use it as a workbench, not a replacement.

**Q: How much does it cost?**
A: Fixed-fee pilot, finalized once we scope users and integrations. No per-decision charges.
