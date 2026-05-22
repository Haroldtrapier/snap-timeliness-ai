/**
 * Mock data for the pre-Supabase demo. Replace with Supabase queries when
 * NEXT_PUBLIC_USE_MOCK_DATA is "false".
 */

export type SnapStage =
  | "exploring"
  | "applying"
  | "pending"
  | "approved"
  | "recertifying"
  | "denied"
  | "reporting_change";

export type DocStatus = "missing" | "uploaded" | "review" | "flagged" | "accepted";

export type ChecklistItem = {
  id: string;
  label: string;
  required: boolean;
  status: "open" | "uploaded" | "complete";
  category: string;
  notes?: string;
};

export type Document = {
  id: string;
  name: string;
  type: string;
  uploadedAt: string;
  status: DocStatus;
  flags: string[];
  mappedTo?: string;
};

export type Notice = {
  id: string;
  title: string;
  receivedAt: string;
  agency: string;
  type: "interview" | "verification_request" | "approval" | "denial" | "recert" | "appeal_window" | "other";
  urgency: "low" | "medium" | "high";
  excerpt: string;
  summary?: string;
  action?: string;
  deadline?: string;
};

export type Deadline = {
  id: string;
  type: "interview" | "document_due" | "recertification" | "periodic_report" | "change_report" | "appeal";
  date: string;
  description: string;
  relatedId?: string;
  suggestedNext?: string;
};

export const mockProfile = {
  id: "user_demo",
  name: "Demo Applicant",
  email: "demo@example.com",
  state: "NC",
  county: "Cumberland",
  userType: "applicant" as const,
  stage: "applying" as SnapStage,
  householdSize: 3,
  monthlyIncome: 1800,
  language: "en",
  accessibility: [] as string[],
};

export const mockChecklist: ChecklistItem[] = [
  { id: "id1", label: "Photo ID (driver's license or state ID)", required: true, status: "complete", category: "Identity" },
  { id: "res1", label: "Proof of residence (utility bill or lease)", required: true, status: "uploaded", category: "Residence" },
  { id: "inc1", label: "Pay stubs (last 30 days)", required: true, status: "open", category: "Income" },
  { id: "inc2", label: "Tax return (most recent year)", required: false, status: "open", category: "Income", notes: "Helpful for self-employed" },
  { id: "hh1", label: "Household member info (DOBs, SSNs)", required: true, status: "uploaded", category: "Household" },
  { id: "exp1", label: "Rent or mortgage statement", required: true, status: "open", category: "Expenses" },
  { id: "util1", label: "Utility bills (electric, gas, water)", required: false, status: "open", category: "Expenses" },
  { id: "child1", label: "Childcare receipts", required: false, status: "open", category: "Expenses", notes: "If applicable" },
  { id: "med1", label: "Medical expense records (60+ or disabled only)", required: false, status: "open", category: "Expenses" },
  { id: "int1", label: "Interview preparation checklist reviewed", required: true, status: "open", category: "Interview" },
];

export const mockDocuments: Document[] = [
  {
    id: "doc_001",
    name: "drivers_license_front.jpg",
    type: "Photo ID",
    uploadedAt: "2026-05-15",
    status: "accepted",
    flags: [],
    mappedTo: "id1",
  },
  {
    id: "doc_002",
    name: "duke_energy_bill_apr.pdf",
    type: "Utility Bill",
    uploadedAt: "2026-05-16",
    status: "review",
    flags: [],
    mappedTo: "res1",
  },
  {
    id: "doc_003",
    name: "paystub_apr.jpg",
    type: "Pay Stub",
    uploadedAt: "2026-05-17",
    status: "flagged",
    flags: ["unreadable image", "possible missing pages"],
    mappedTo: "inc1",
  },
];

export const mockNotices: Notice[] = [
  {
    id: "ntc_001",
    title: "Interview Scheduled — Cumberland County DSS",
    receivedAt: "2026-05-18",
    agency: "Cumberland County DSS",
    type: "interview",
    urgency: "high",
    excerpt:
      "Your phone interview is scheduled for 2026-05-28 at 10:00 AM. Please be available at the phone number on file...",
    summary:
      "Your SNAP eligibility interview is scheduled. Be available at your phone at the scheduled time. If you miss it, your application may be delayed or closed.",
    action:
      "Be ready by 9:45 AM on 2026-05-28. Have your documents nearby. If you cannot make the call, contact the county DSS immediately to reschedule.",
    deadline: "2026-05-28",
  },
  {
    id: "ntc_002",
    title: "Verification Request — Income",
    receivedAt: "2026-05-19",
    agency: "Cumberland County DSS",
    type: "verification_request",
    urgency: "high",
    excerpt:
      "Submit pay stubs for the last 30 days no later than 2026-05-29 or your application may be denied for missing information...",
    summary:
      "The county is asking for proof of income. If you don't send pay stubs by the deadline, your application may be denied for missing information.",
    action: "Upload pay stubs for the last 30 days before 2026-05-29.",
    deadline: "2026-05-29",
  },
];

export const mockDeadlines: Deadline[] = [
  { id: "dl_001", type: "interview", date: "2026-05-28", description: "Phone interview with Cumberland County DSS", relatedId: "ntc_001", suggestedNext: "Be available at 9:45 AM and have your documents ready." },
  { id: "dl_002", type: "document_due", date: "2026-05-29", description: "Submit pay stubs for last 30 days", relatedId: "ntc_002", suggestedNext: "Upload the pay stubs in Documents." },
  { id: "dl_003", type: "recertification", date: "2026-11-30", description: "SNAP recertification window opens", suggestedNext: "Start gathering updated income and household documents in October." },
];

export const mockOrgDashboard = {
  activeCases: 312,
  onTimeRate: 0.82,
  avgDaysToDecision: 21,
  backlog: 47,
  missingDocQueue: 28,
  urgentDeadlines: 9,
  reviewFlags: 12,
};

export const mockOrgClients = [
  { id: "c1", name: "M. Johnson", stage: "applying" as SnapStage, daysOpen: 12, missingDocs: 2, flags: 1, urgentDeadlines: 1 },
  { id: "c2", name: "T. Rivera", stage: "pending" as SnapStage, daysOpen: 18, missingDocs: 0, flags: 0, urgentDeadlines: 0 },
  { id: "c3", name: "A. Brown", stage: "recertifying" as SnapStage, daysOpen: 5, missingDocs: 3, flags: 2, urgentDeadlines: 1 },
];
