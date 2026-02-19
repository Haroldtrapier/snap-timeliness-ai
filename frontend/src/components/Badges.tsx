import type { CaseStatus, Priority, EligibilityResult, DocumentStatus } from '../types'

const STATUS_STYLES: Record<CaseStatus, string> = {
  PENDING_REVIEW: 'bg-amber-100 text-amber-800',
  IN_REVIEW: 'bg-blue-100 text-blue-800',
  PENDING_VERIFICATION: 'bg-purple-100 text-purple-800',
  APPROVED: 'bg-green-100 text-green-800',
  DENIED: 'bg-red-100 text-red-800',
  WITHDRAWN: 'bg-gray-100 text-gray-600',
  CLOSED: 'bg-gray-100 text-gray-600',
}

const STATUS_LABELS: Record<CaseStatus, string> = {
  PENDING_REVIEW: 'Pending Review',
  IN_REVIEW: 'In Review',
  PENDING_VERIFICATION: 'Pending Verification',
  APPROVED: 'Approved',
  DENIED: 'Denied',
  WITHDRAWN: 'Withdrawn',
  CLOSED: 'Closed',
}

const PRIORITY_STYLES: Record<Priority, string> = {
  EXPEDITED: 'bg-red-100 text-red-800 ring-1 ring-red-300',
  HIGH: 'bg-orange-100 text-orange-800',
  NORMAL: 'bg-gray-100 text-gray-700',
  LOW: 'bg-gray-50 text-gray-500',
}

const ELIGIBILITY_STYLES: Record<EligibilityResult, string> = {
  ELIGIBLE: 'bg-green-100 text-green-800',
  INELIGIBLE: 'bg-red-100 text-red-800',
  EXPEDITED_ELIGIBLE: 'bg-orange-100 text-orange-800',
  PENDING_VERIFICATION: 'bg-yellow-100 text-yellow-800',
  NEEDS_REVIEW: 'bg-purple-100 text-purple-800',
}

const DOC_STYLES: Record<DocumentStatus, string> = {
  PENDING: 'bg-gray-100 text-gray-600',
  PROCESSING: 'bg-blue-100 text-blue-700',
  VERIFIED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  NEEDS_REPLACEMENT: 'bg-orange-100 text-orange-700',
}

export function StatusBadge({ status }: { status: CaseStatus }) {
  return (
    <span className={`badge ${STATUS_STYLES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  )
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span className={`badge ${PRIORITY_STYLES[priority]}`}>
      {priority === 'EXPEDITED' ? '⚡ EXPEDITED' : priority}
    </span>
  )
}

export function EligibilityBadge({ result }: { result: EligibilityResult }) {
  return (
    <span className={`badge ${ELIGIBILITY_STYLES[result]}`}>
      {result.replace(/_/g, ' ')}
    </span>
  )
}

export function DocumentStatusBadge({ status }: { status: DocumentStatus }) {
  return (
    <span className={`badge ${DOC_STYLES[status]}`}>
      {status.replace(/_/g, ' ')}
    </span>
  )
}
