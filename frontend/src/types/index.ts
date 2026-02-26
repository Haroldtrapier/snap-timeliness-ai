export type Role = 'ELIGIBILITY_WORKER' | 'SUPERVISOR' | 'ADMIN'
export type CaseStatus = 'PENDING_REVIEW' | 'IN_REVIEW' | 'PENDING_VERIFICATION' | 'APPROVED' | 'DENIED' | 'WITHDRAWN' | 'CLOSED'
export type Priority = 'EXPEDITED' | 'HIGH' | 'NORMAL' | 'LOW'
export type EligibilityResult = 'ELIGIBLE' | 'INELIGIBLE' | 'EXPEDITED_ELIGIBLE' | 'PENDING_VERIFICATION' | 'NEEDS_REVIEW'
export type DocumentStatus = 'PENDING' | 'PROCESSING' | 'VERIFIED' | 'REJECTED' | 'NEEDS_REPLACEMENT'

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: Role
  county: string
  _count?: { assignedCases: number }
}

export interface SnapCase {
  id: string
  caseNumber: string
  applicantFirstName: string
  applicantLastName: string
  applicantDob: string
  phone?: string
  email?: string
  address: string
  city: string
  state: string
  zipCode: string
  householdSize: number
  monthlyGrossIncome: number
  monthlyNetIncome: number
  assets: number
  hasElderly: boolean
  hasDisabled: boolean
  isHomeless: boolean
  isMigrantWorker: boolean
  status: CaseStatus
  priority: Priority
  eligibilityResult?: EligibilityResult
  estimatedBenefit?: number
  denialReason?: string
  denialLetterText?: string
  denialLetterGeneratedAt?: string
  notes?: string
  applicationDate: string
  dueDate: string
  reviewStartedAt?: string
  decisionMadeAt?: string
  processingDays?: number
  aiScreeningScore?: number
  aiScreeningNotes?: string
  assignedWorker?: { id: string; firstName: string; lastName: string; email: string }
  documents?: Document[]
  eligibilityChecks?: EligibilityCheck[]
  auditLogs?: AuditLog[]
}

export interface AuditLog {
  id: string
  action: string
  details?: Record<string, unknown>
  ipAddress?: string
  createdAt: string
  userId?: string
}

export interface Document {
  id: string
  caseId: string
  fileName: string
  originalName: string
  mimeType: string
  fileSize: number
  type: string
  status: DocumentStatus
  aiExtractedData?: Record<string, unknown>
  aiConfidence?: number
  reviewerNotes?: string
  uploadedAt: string
  processedAt?: string
}

export interface EligibilityCheck {
  id: string
  grossIncomeLimit: number
  netIncomeLimit: number
  assetLimit: number
  grossIncomeActual: number
  netIncomeActual: number
  assetsActual: number
  grossIncomePass: boolean
  netIncomePass: boolean
  assetPass: boolean
  expeditedEligible: boolean
  result: EligibilityResult
  estimatedMonthlyBenefit?: number
  maxAllotment: number
  povertyLevel: number
  checkedAt: string
}

export interface CaseNote {
  id: string
  caseId: string
  authorId: string
  author: { id: string; firstName: string; lastName: string; role: Role }
  body: string
  createdAt: string
  updatedAt: string
}

export interface DashboardStats {
  total: number
  pending: number
  expedited: number
  approved: number
  denied: number
  overdue: number
  avgProcessingDays: number
  timelinessRate: number
}

export interface TimelinessReport {
  period: string
  standard: { total: number; timely: number; rate: number; federalStandard: number }
  expedited: { total: number; timely: number; rate: number; federalStandard: number }
  compliant: boolean
}
