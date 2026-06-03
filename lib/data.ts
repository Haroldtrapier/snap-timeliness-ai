// ============================================================
// Sample data for the product previews.
//
// All names, case numbers, and dates are FICTIONAL placeholders
// used purely to demonstrate the interface. Replace these with
// real, auth-gated data models and APIs before production use.
// ============================================================

import type { IconName } from "@/components/Icons";

export type DocStatus = "ok" | "missing" | "pending";

export interface ApplicantDocument {
  name: string;
  status: DocStatus;
  note: string;
}

export interface ApplicantDeadline {
  m: string;
  d: number;
  what: string;
  when: string;
  badge: "urgent" | "upcoming" | "routine";
}

export interface ApplicantProfile {
  name: string;
  case: string;
  household: string;
  initials: string;
  /** 0=intake, 1=docs, 2=verify, 3=interview, 4=decision */
  stage: number;
  readiness: number;
  documents: ApplicantDocument[];
  deadlines: ApplicantDeadline[];
  nextStep: { what: string; why: string };
}

export const STAGES = [
  "Intake",
  "Documents",
  "Verification",
  "Interview",
  "Decision",
] as const;

export const APPLICANT_DATA: { applicant: ApplicantProfile } = {
  applicant: {
    name: "Maria Vasquez",
    case: "Case #SNAP-2026-08471",
    household: "Household of 4 · 2 children",
    initials: "MV",
    stage: 2,
    readiness: 78,
    documents: [
      { name: "Photo ID (Driver's License)", status: "ok", note: "Verified" },
      { name: "Social Security cards (×4)", status: "ok", note: "All on file" },
      { name: "Proof of address (lease)", status: "ok", note: "Updated May 2" },
      { name: "Income — last 30 days", status: "missing", note: "Need pay stubs" },
      { name: "Childcare expenses", status: "missing", note: "Receipt or letter" },
      { name: "Utility bill (heating)", status: "pending", note: "Auto-pull requested" },
    ],
    deadlines: [
      { m: "MAY", d: 19, what: "Submit missing pay stubs", when: "in 3 days", badge: "urgent" },
      { m: "MAY", d: 24, what: "Phone interview with caseworker", when: "Tue 10:30 AM", badge: "upcoming" },
      { m: "JUN", d: 7, what: "Decision notice expected", when: "by federal 30-day window", badge: "routine" },
    ],
    nextStep: {
      what: "Upload your two most recent pay stubs",
      why: "Required for income verification — this unblocks your interview.",
    },
  },
};

export type ClientStage = "intake" | "docs" | "review" | "recert";
export type TimelinessClass = "ok" | "warn" | "bad";

export interface AgencyMetric {
  label: string;
  value: string;
  suffix?: string;
  delta: string;
  dir: "up" | "down" | "flat";
}

export interface AgencyClient {
  initials: string;
  name: string;
  case: string;
  stage: ClientStage;
  ready: number;
  time: string;
  timeCls: TimelinessClass;
  deadline: string;
}

export const AGENCY_DATA: { metrics: AgencyMetric[]; clients: AgencyClient[] } = {
  metrics: [
    { label: "Active cases", value: "1,847", delta: "+82 this week", dir: "flat" },
    { label: "On-time rate (30d)", value: "94.2", suffix: "%", delta: "+6.1 vs Q1", dir: "up" },
    { label: "Avg. days to decide", value: "21.4", delta: "-3.8 days", dir: "up" },
    { label: "Backlog (>30d)", value: "126", delta: "-41 this month", dir: "up" },
  ],
  clients: [
    { initials: "MV", name: "Maria Vasquez", case: "SNAP-2026-08471", stage: "review", ready: 78, time: "On track · day 7", timeCls: "ok", deadline: "May 22" },
    { initials: "TR", name: "Tarell Robinson", case: "SNAP-2026-08510", stage: "docs", ready: 45, time: "Warning · day 14", timeCls: "warn", deadline: "May 19" },
    { initials: "AK", name: "Ayesha Khan", case: "SNAP-2026-08389", stage: "intake", ready: 22, time: "On track · day 2", timeCls: "ok", deadline: "Jun 02" },
    { initials: "DL", name: "Daniel Lockwood", case: "SNAP-2026-08124", stage: "recert", ready: 91, time: "On track · day 41", timeCls: "ok", deadline: "Jun 14" },
    { initials: "JC", name: "Joyce Chen", case: "SNAP-2026-07998", stage: "review", ready: 62, time: "Late · day 32", timeCls: "bad", deadline: "Overdue" },
    { initials: "RB", name: "Roberto Brizuela", case: "SNAP-2026-08612", stage: "docs", ready: 38, time: "Warning · day 11", timeCls: "warn", deadline: "May 25" },
  ],
};

export const STAGE_LABELS: Record<ClientStage, string> = {
  intake: "Intake",
  docs: "Docs pending",
  review: "In review",
  recert: "Recert",
};

// Persona / capability content used by the marketing sections.
export interface IconCard {
  icon: IconName;
  title: string;
  body: string;
}
