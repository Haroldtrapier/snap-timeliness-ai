# SNAP AI — Backlog Command Center: 5-minute demo script

A tight, repeatable walkthrough that hits every Phase 1 acceptance criterion.
Works on the branch preview in **Demo** mode (no keys needed) or in **Live**
mode once the migration + Supabase keys are in place.

**Entry:** sign in → **Agency / Caseworker** → Agency console → **Open Backlog AI**
(or `/app/agency/backlog`).

---

### 1. Frame the county (30s)
- Point out the **County selector** (top-right) — switch between Cumberland,
  Mecklenburg, Wake, Guilford, Durham, Forsyth.
- Call out the **Backlog risk score** and **Timeliness score** cards, and the
  **weekly trend** (new this week vs. prior week).
- Note the **Demo / Live** badge and the human-in-the-loop disclaimer.

### 2. Load a backlog (45s)
- Go to **Upload**. Click **Download sample CSV** to show the template, then
  **Load sample data** → **Import**.
- Highlight the **import preview**: column validation, per-row errors, and
  **duplicate detection** (re-import the same file to show duplicates skipped).

### 3. Triage the queue (60s)
- Open **Priority Queue**. Read the top case's **plain-language explanation**
  ("High priority because expedited and 2 days until deadline…").
- Point out the **visual tags** (Expedited, Overdue, Near Deadline, Missing
  Documents, Ready for Review, Worker Review Required).

### 4. Work a case (90s)
- Click the top case → **Case detail**.
- Walk the **summary** (household, income, expenses, days pending, deadline).
- **Missing document checklist**: mark a document **Requested → Received →
  Verified** (each change is logged).
- Read the **Eligibility pre-screen** category + notes, and the disclaimer.
- **Assign a worker**, **add a note**, then **Move to ready for review**.

### 5. Alerts (20s)
- Open **Alerts** — overdue, deadline-approaching, expedited, missing-doc,
  worker-overload, backlog-spike, with severity levels.

### 6. Leadership report (30s)
- Open **Reports** → pick **Weekly leadership report** → **Print / Save as PDF**.
- Show the metrics, backlog-risk summary, and **recommended supervisor actions**.

### 7. Prove the audit trail (25s)
- Open **Audit & Roles** — every action from the demo is logged (CSV upload,
  status change, document change, note, worker assignment, pre-screen,
  report generated), with timestamp / user / prev → new. **Export CSV**.

### 8. Configurability (15s)
- Open **Settings** — show the editable pre-screen income thresholds and
  timeliness SLAs (so state/federal policy can be updated without code).

---

**Reset between demos:** Audit & Roles → **Reset demo data** (Demo mode only).

**Talking point:** every screen states that SNAP AI supports — and never
replaces — caseworker judgment; final eligibility decisions stay with the agency.
