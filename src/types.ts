export type Severity = 'low' | 'medium' | 'high';

export type DocStatus = 'received' | 'missing' | 'needs review' | 'possible mismatch';

export type DocKey =
  | 'id'
  | 'proof_of_income'
  | 'utility_bill'
  | 'lease_proof'
  | 'ssn_verification'
  | 'child_support_docs';

export interface DocumentRecord {
  key: DocKey;
  label: string;
  required: boolean;
  status: DocStatus;
  note?: string;
}

export interface HouseholdMember {
  id: string;
  name: string;
  age: number;
  relationship: string;
  income: number;
  isStudent?: boolean;
  isDisabled?: boolean;
  isElderly?: boolean;
}

export interface RiskFlag {
  id: string;
  type: string;
  severity: Severity;
  detail: string;
  requiresHumanReview: boolean;
}

export type EligibilityStatus =
  | 'likely eligible'
  | 'needs more information'
  | 'likely ineligible'
  | 'expedited review recommended';

export type QueueStatus =
  | 'intake complete'
  | 'missing documents'
  | 'risk review'
  | 'expedited review'
  | 'ready for caseworker';

export interface SnapCase {
  id: string;
  applicantName: string;
  address: string;
  county: string;
  householdSize: number;
  income: number;
  employmentStatus: string;
  benefitsRequested: string[];
  emergencyNeed: boolean;
  householdMembers: HouseholdMember[];
  documents: DocumentRecord[];
  riskFlags: RiskFlag[];
  eligibility: EligibilityStatus;
  queueStatus: QueueStatus;
  submittedAt: string;
  assignedReviewer?: string;
  priority: 'low' | 'normal' | 'high' | 'expedited';
  notes?: string;
}
