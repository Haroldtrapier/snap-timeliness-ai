// SNAP AI — Backlog Command Center domain types.
//
// This is a self-contained, human-in-the-loop supervisor surface. It never
// approves, denies, or replaces a caseworker. Every AI output carries a
// "worker review required" note. Demo data is fictional and anonymized.

export type CaseStatus =
  | "New"
  | "Pending Review"
  | "Missing Documents"
  | "Expedited Review"
  | "Ready for Review"
  | "Overdue"
  | "Completed";

export type RiskLabel = "Low" | "Medium" | "High" | "Critical";

export type BacklogRole = "Admin" | "Supervisor" | "Caseworker" | "Viewer";

export type DocStatus = "Missing" | "Requested" | "Received" | "Verified";

export type PriorityTag =
  | "Expedited"
  | "Overdue"
  | "Near Deadline"
  | "Missing Documents"
  | "Ready for Review"
  | "Worker Review Required"
  | "Vulnerable Household";

export type PrescreenCategory =
  | "Likely eligible — worker review required"
  | "Needs review"
  | "Missing information"
  | "Potential issue found";

export type AlertType =
  | "Overdue case"
  | "Deadline approaching"
  | "Expedited case needs review"
  | "Missing document blocker"
  | "Worker overload"
  | "Backlog spike";

export type AlertSeverity = "Low" | "Medium" | "High" | "Critical";

export type AuditAction =
  | "Case created"
  | "CSV uploaded"
  | "Worker assigned"
  | "Status changed"
  | "Document status changed"
  | "Note added"
  | "Report generated"
  | "Pre-screen generated"
  | "Priority score generated"
  | "Missing document checklist generated"
  | "Eligibility pre-screen generated"
  | "Case reviewed/closed"
  | "Demo data reset";

export interface County {
  id: string;
  name: string;
  state: string;
}

export interface Worker {
  id: string;
  name: string;
  role: BacklogRole;
  countyId: string;
  title: string;
}

export interface DocItem {
  key: string;
  label: string;
  required: boolean;
  status: DocStatus;
  history: { status: DocStatus; at: string; by: string }[];
}

export interface CaseNote {
  id: string;
  at: string;
  by: string;
  text: string;
}

export interface AuditEntry {
  id: string;
  at: string;
  userId: string;
  caseId: string;
  countyId: string;
  action: AuditAction;
  prev?: string;
  next?: string;
  systemNote?: string;
  automated?: boolean;
}

export interface SnapCase {
  id: string;
  applicantLabel: string;
  applicantName?: string;
  countyId: string;
  applicationDate: string;
  status: CaseStatus;
  expedited: boolean;
  householdSize: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  assignedWorkerId?: string;
  vulnerabilityFlags: string[];
  documents: DocItem[];
  notes: CaseNote[];
  createdAt: string;
  updatedAt: string;
}

export interface CaseView extends SnapCase {
  daysPending: number;
  deadlineDate: string;
  daysUntilDeadline: number;
  deadlineRisk: RiskLabel;
  missingDocs: DocItem[];
  missingRequiredDocs: DocItem[];
  priorityScore: number;
  priorityBand: RiskLabel;
  priorityTags: PriorityTag[];
  priorityExplanation: string;
  prescreen: { category: PrescreenCategory; notes: string[] };
  worker?: Worker;
  county?: County;
}

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  countyId: string;
  caseId?: string;
  message: string;
  at: string;
}

export interface PrescreenConfig {
  grossMonthlyIncomeLimit: Record<number, number>;
  netMonthlyIncomeLimit: Record<number, number>;
  additionalMemberGross: number;
  additionalMemberNet: number;
  expeditedSlaDays: number;
  standardSlaDays: number;
  nearDeadlineDays: number;
}

export interface BacklogState {
  version: number;
  activeCountyId: string;
  role: BacklogRole;
  currentUser: string;
  counties: County[];
  workers: Worker[];
  cases: SnapCase[];
  audit: AuditEntry[];
  prescreenConfig: PrescreenConfig;
}
