import type { PrescreenConfig } from "@/lib/backlog/types";

// Federal SNAP timeliness standards (configurable):
//  - Expedited SNAP: eligibility processed within 7 calendar days.
//  - Standard applications: within 30 calendar days.
export const DEFAULT_PRESCREEN_CONFIG: PrescreenConfig = {
  // Illustrative gross monthly income limits (~130% FPL, 48 states). Editable in Settings.
  grossMonthlyIncomeLimit: { 1: 1632, 2: 2215, 3: 2798, 4: 3380, 5: 3963, 6: 4546, 7: 5129, 8: 5712 },
  // Illustrative net monthly income limits (~100% FPL, 48 states). Editable in Settings.
  netMonthlyIncomeLimit: { 1: 1255, 2: 1704, 3: 2152, 4: 2600, 5: 3049, 6: 3497, 7: 3945, 8: 4394 },
  additionalMemberGross: 583,
  additionalMemberNet: 449,
  expeditedSlaDays: 7,
  standardSlaDays: 30,
  nearDeadlineDays: 3,
};

export const STANDARD_DOCUMENTS: { key: string; label: string; required: boolean }[] = [
  { key: "id_verification", label: "ID verification", required: true },
  { key: "proof_of_income", label: "Proof of income", required: true },
  { key: "pay_stubs", label: "Pay stubs", required: true },
  { key: "proof_of_address", label: "Proof of address", required: true },
  { key: "lease_rent_proof", label: "Lease / rent proof", required: false },
  { key: "utility_bill", label: "Utility bill", required: false },
  { key: "household_verification", label: "Household verification", required: true },
];

export const CASE_STATUSES: CaseStatusTuple = [
  "New",
  "Pending Review",
  "Missing Documents",
  "Expedited Review",
  "Ready for Review",
  "Overdue",
  "Completed",
];
type CaseStatusTuple = readonly import("@/lib/backlog/types").CaseStatus[];

export const BACKLOG_ROLES: readonly import("@/lib/backlog/types").BacklogRole[] = [
  "Admin",
  "Supervisor",
  "Caseworker",
  "Viewer",
];

export const DISCLAIMERS = {
  case: "SNAP AI supports human review and does not make final eligibility decisions.",
  report:
    "This report is a workflow-support tool. Final SNAP eligibility decisions remain with authorized agency staff.",
  prescreen:
    "Decision support only — worker review required. SNAP AI does not approve or deny benefits.",
  integration:
    "NC FAST-compatible intake layer (integration-ready architecture). Live NC FAST integration is not enabled in this demo.",
};
