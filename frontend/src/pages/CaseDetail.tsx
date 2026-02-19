import { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, Brain, CheckCircle2, Upload, FileText,
  AlertTriangle, User, Home, DollarSign, UserCheck
} from 'lucide-react'
import { casesApi, documentsApi, usersApi } from '../services/api'
import { StatusBadge, PriorityBadge, EligibilityBadge, DocumentStatusBadge } from '../components/Badges'
import { useToast } from '../components/Toast'
import type { User as UserType } from '../types'

const DOC_TYPES = [
  'IDENTITY', 'INCOME_PAYSTUB', 'INCOME_TAX_RETURN', 'RESIDENCY_UTILITY',
  'RESIDENCY_LEASE', 'ASSETS_BANK_STATEMENT', 'CITIZENSHIP', 'OTHER'
]

function InfoRow({ label, value }: { label: string; value: string | number | boolean | undefined }) {
  const display = value === true ? 'Yes' : value === false ? 'No' : (value ?? '—')
  return (
    <div className="flex justify-between py-1.5 text-sm border-b border-gray-50 last:border-0">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900">{String(display)}</span>
    </div>
  )
}

function currentUserRole(): string {
  try {
    const u = JSON.parse(localStorage.getItem('user') ?? '{}') as { role?: string }
    return u.role ?? ''
  } catch {
    return ''
  }
}

export default function CaseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { toast } = useToast()
  const fileRef = useRef<HTMLInputElement>(null)

  const [docType, setDocType] = useState('OTHER')
  const [decision, setDecision] = useState('')
  const [denialReason, setDenialReason] = useState('')
  const [selectedWorkerId, setSelectedWorkerId] = useState('')

  const role = currentUserRole()
  const isSupervisor = role === 'SUPERVISOR' || role === 'ADMIN'

  const { data: snapCase, isLoading } = useQuery({
    queryKey: ['case', id],
    queryFn: () => casesApi.get(id!).then(r => r.data),
    enabled: !!id,
  })

  const { data: workers } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.list().then(r => r.data),
    enabled: isSupervisor,
  })

  const screenMutation = useMutation({
    mutationFn: () => casesApi.aiScreen(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['case', id] })
      toast('AI screening complete')
    },
    onError: () => toast('AI screening failed', 'error'),
  })

  const assignMutation = useMutation({
    mutationFn: () => casesApi.assign(id!, selectedWorkerId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['case', id] })
      toast('Case assigned successfully')
      setSelectedWorkerId('')
    },
    onError: () => toast('Assignment failed', 'error'),
  })

  const decisionMutation = useMutation({
    mutationFn: () => casesApi.decision(id!, { decision, denialReason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['case', id] })
      toast(`Case marked as ${decision.toLowerCase()}`)
    },
    onError: () => toast('Failed to record decision', 'error'),
  })

  const uploadMutation = useMutation({
    mutationFn: (file: File) => documentsApi.upload(id!, file, docType),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['case', id] })
      toast('Document uploaded and queued for AI processing')
    },
    onError: () => toast('Upload failed — check file type and size', 'error'),
  })

  const verifyDocMutation = useMutation({
    mutationFn: ({ docId, status }: { docId: string; status: string }) =>
      documentsApi.verify(docId, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['case', id] })
      toast('Document status updated')
    },
    onError: () => toast('Failed to update document', 'error'),
  })

  if (isLoading) return <div className="text-center py-20 text-gray-400">Loading case...</div>
  if (!snapCase) return <div className="text-center py-20 text-gray-400">Case not found</div>

  const check = snapCase.eligibilityChecks?.[0]
  const daysLeft = Math.ceil((new Date(snapCase.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  const isDecided = ['APPROVED', 'DENIED', 'WITHDRAWN', 'CLOSED'].includes(snapCase.status)

  const eligibleWorkers = (workers ?? []).filter((w: UserType) =>
    w.role === 'ELIGIBILITY_WORKER' || w.role === 'SUPERVISOR'
  )

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="btn-secondary py-2 px-3">
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold text-gray-900">
              {snapCase.applicantFirstName} {snapCase.applicantLastName}
            </h1>
            <code className="text-xs bg-gray-100 text-gray-600 rounded px-2 py-0.5">{snapCase.caseNumber}</code>
            <PriorityBadge priority={snapCase.priority} />
            <StatusBadge status={snapCase.status} />
          </div>
          <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
            <span>Applied: {new Date(snapCase.applicationDate).toLocaleDateString()}</span>
            <span className={`font-medium ${daysLeft <= 0 ? 'text-red-600' : daysLeft <= 3 ? 'text-orange-600' : 'text-gray-600'}`}>
              Due: {daysLeft <= 0 ? 'OVERDUE' : `${daysLeft} days remaining`}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-5">

          {/* Applicant info */}
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User size={16} className="text-snap-green" /> Applicant Information
            </h2>
            <div className="grid grid-cols-2 gap-x-8">
              <div>
                <InfoRow label="Date of Birth" value={new Date(snapCase.applicantDob).toLocaleDateString()} />
                <InfoRow label="Phone" value={snapCase.phone} />
                <InfoRow label="Email" value={snapCase.email} />
              </div>
              <div>
                <InfoRow label="Address" value={`${snapCase.address}, ${snapCase.city}, ${snapCase.state}`} />
                <InfoRow label="ZIP Code" value={snapCase.zipCode} />
              </div>
            </div>
          </div>

          {/* Household info */}
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Home size={16} className="text-snap-green" /> Household & Income
            </h2>
            <div className="grid grid-cols-2 gap-x-8">
              <div>
                <InfoRow label="Household Size" value={snapCase.householdSize} />
                <InfoRow label="Has Elderly (60+)" value={snapCase.hasElderly} />
                <InfoRow label="Has Disabled" value={snapCase.hasDisabled} />
              </div>
              <div>
                <InfoRow label="Monthly Gross Income" value={`$${snapCase.monthlyGrossIncome.toLocaleString()}`} />
                <InfoRow label="Monthly Net Income" value={`$${snapCase.monthlyNetIncome.toLocaleString()}`} />
                <InfoRow label="Assets" value={`$${snapCase.assets.toLocaleString()}`} />
              </div>
            </div>
            {(snapCase.isHomeless || snapCase.isMigrantWorker) && (
              <div className="mt-3 flex gap-2">
                {snapCase.isHomeless && <span className="badge bg-orange-100 text-orange-800">Homeless</span>}
                {snapCase.isMigrantWorker && <span className="badge bg-blue-100 text-blue-800">Migrant Worker</span>}
              </div>
            )}
          </div>

          {/* Eligibility check */}
          {check && (
            <div className="card">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <DollarSign size={16} className="text-snap-green" /> Eligibility Pre-Screen
              </h2>
              <div className="flex items-center gap-3 mb-4">
                <EligibilityBadge result={check.result} />
                {check.estimatedMonthlyBenefit != null && check.estimatedMonthlyBenefit > 0 && (
                  <span className="text-sm text-gray-600">
                    Est. benefit: <strong>${check.estimatedMonthlyBenefit}/month</strong>
                  </span>
                )}
                <span className="text-xs text-gray-400 ml-auto">{check.povertyLevel}% of FPL</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Gross Income', limit: check.grossIncomeLimit, actual: check.grossIncomeActual, pass: check.grossIncomePass },
                  { label: 'Net Income', limit: check.netIncomeLimit, actual: Math.round(check.netIncomeActual), pass: check.netIncomePass },
                  { label: 'Assets', limit: check.assetLimit, actual: check.assetsActual, pass: check.assetPass },
                ].map(({ label, limit, actual, pass }) => (
                  <div key={label} className={`rounded-lg p-3 ${pass ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'}`}>
                    <div className="text-xs text-gray-500 mb-1">{label}</div>
                    <div className="text-sm font-semibold">
                      ${actual.toLocaleString()} <span className="text-xs font-normal text-gray-400">/ ${limit.toLocaleString()}</span>
                    </div>
                    <div className={`text-xs mt-1 font-medium ${pass ? 'text-green-700' : 'text-red-700'}`}>
                      {pass ? '✓ Pass' : '✗ Fail'}
                    </div>
                  </div>
                ))}
              </div>
              {check.expeditedEligible && (
                <div className="mt-3 rounded-lg bg-orange-50 border border-orange-200 p-3 text-sm text-orange-800">
                  ⚡ Qualifies for expedited processing — must be processed within 7 days
                </div>
              )}
            </div>
          )}

          {/* Documents */}
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText size={16} className="text-snap-green" /> Documents
              <span className="ml-auto text-xs text-gray-400">{snapCase.documents?.length ?? 0} files</span>
            </h2>

            {(snapCase.documents?.length ?? 0) === 0 ? (
              <p className="text-sm text-gray-400 mb-4">No documents uploaded yet</p>
            ) : (
              <div className="space-y-2 mb-4">
                {snapCase.documents?.map(doc => (
                  <div key={doc.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-800 truncate">{doc.originalName}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {doc.type.replace(/_/g, ' ')} · {(doc.fileSize / 1024).toFixed(0)}KB
                        {doc.aiConfidence != null && ` · AI confidence: ${Math.round(doc.aiConfidence * 100)}%`}
                      </div>
                      {doc.reviewerNotes && (
                        <div className="text-xs text-orange-700 mt-0.5 flex items-center gap-1">
                          <AlertTriangle size={11} /> {doc.reviewerNotes}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <DocumentStatusBadge status={doc.status} />
                      {doc.status === 'PENDING' && isSupervisor && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => verifyDocMutation.mutate({ docId: doc.id, status: 'VERIFIED' })}
                            className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-800 hover:bg-green-200 transition-colors"
                          >
                            Verify
                          </button>
                          <button
                            onClick={() => verifyDocMutation.mutate({ docId: doc.id, status: 'REJECTED' })}
                            className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-800 hover:bg-red-200 transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Upload */}
            <div className="border-t border-gray-100 pt-4 flex gap-2 flex-wrap">
              <select
                value={docType}
                onChange={e => setDocType(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-snap-green"
              >
                {DOC_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </select>
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.tiff"
                onChange={e => e.target.files?.[0] && uploadMutation.mutate(e.target.files[0])}
              />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploadMutation.isPending}
                className="btn-secondary"
              >
                <Upload size={15} />
                {uploadMutation.isPending ? 'Uploading...' : 'Upload Document'}
              </button>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">

          {/* Case Assignment — supervisor/admin only */}
          {isSupervisor && (
            <div className="card">
              <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <UserCheck size={16} className="text-snap-blue" /> Assign Case
              </h2>
              {snapCase.assignedWorker ? (
                <div className="mb-3 text-sm text-gray-600">
                  Currently assigned to:{' '}
                  <strong>{snapCase.assignedWorker.firstName} {snapCase.assignedWorker.lastName}</strong>
                </div>
              ) : (
                <div className="mb-3 text-sm text-amber-600">Unassigned</div>
              )}
              <div className="space-y-2">
                <select
                  value={selectedWorkerId}
                  onChange={e => setSelectedWorkerId(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-snap-green"
                >
                  <option value="">Select a worker...</option>
                  {eligibleWorkers.map((w: UserType) => (
                    <option key={w.id} value={w.id}>
                      {w.firstName} {w.lastName}
                    </option>
                  ))}
                </select>
                <button
                  disabled={!selectedWorkerId || assignMutation.isPending}
                  onClick={() => assignMutation.mutate()}
                  className="w-full btn-primary justify-center"
                >
                  <UserCheck size={15} />
                  {assignMutation.isPending ? 'Assigning...' : 'Assign'}
                </button>
              </div>
            </div>
          )}

          {/* AI Screening */}
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Brain size={16} className="text-purple-600" /> AI Screening
            </h2>
            {snapCase.aiScreeningScore != null ? (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="text-3xl font-bold text-gray-900">{snapCase.aiScreeningScore}</div>
                  <div className="text-sm text-gray-500">/ 100<br /><span className="text-xs">approval confidence</span></div>
                </div>
                <div className="bg-gray-100 h-2 rounded-full mb-3">
                  <div
                    className={`h-2 rounded-full ${snapCase.aiScreeningScore >= 70 ? 'bg-green-500' : snapCase.aiScreeningScore >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                    style={{ width: `${snapCase.aiScreeningScore}%` }}
                  />
                </div>
                {snapCase.aiScreeningNotes && (
                  <p className="text-xs text-gray-600 leading-relaxed">{snapCase.aiScreeningNotes}</p>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  Screened {snapCase.aiScreenedAt ? new Date(snapCase.aiScreenedAt).toLocaleDateString() : ''}
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-400 mb-3">No AI screening yet</p>
            )}
            <button
              onClick={() => screenMutation.mutate()}
              disabled={screenMutation.isPending}
              className="w-full btn-secondary text-sm"
            >
              <Brain size={15} />
              {screenMutation.isPending
                ? 'Screening...'
                : snapCase.aiScreeningScore != null ? 'Re-run AI Screen' : 'Run AI Screen'}
            </button>
          </div>

          {/* Decision */}
          {!isDecided && (
            <div className="card">
              <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-snap-green" /> Record Decision
              </h2>
              <div className="space-y-3">
                <select
                  value={decision}
                  onChange={e => setDecision(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-snap-green"
                >
                  <option value="">Select decision...</option>
                  <option value="APPROVED">Approve</option>
                  <option value="DENIED">Deny</option>
                  <option value="WITHDRAWN">Mark Withdrawn</option>
                </select>
                {decision === 'DENIED' && (
                  <textarea
                    value={denialReason}
                    onChange={e => setDenialReason(e.target.value)}
                    placeholder="Denial reason (required)..."
                    rows={3}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-snap-green resize-none"
                  />
                )}
                <button
                  disabled={!decision || (decision === 'DENIED' && !denialReason) || decisionMutation.isPending}
                  onClick={() => decisionMutation.mutate()}
                  className="w-full btn-primary justify-center"
                >
                  {decisionMutation.isPending ? 'Saving...' : 'Submit Decision'}
                </button>
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-3">Timeline</h2>
            <div className="space-y-1 text-sm">
              <InfoRow label="Applied" value={new Date(snapCase.applicationDate).toLocaleDateString()} />
              {snapCase.reviewStartedAt && (
                <InfoRow label="Review started" value={new Date(snapCase.reviewStartedAt).toLocaleDateString()} />
              )}
              {snapCase.decisionMadeAt && (
                <InfoRow label="Decision" value={new Date(snapCase.decisionMadeAt).toLocaleDateString()} />
              )}
              {snapCase.processingDays != null && (
                <InfoRow label="Total days" value={`${snapCase.processingDays} days`} />
              )}
              {snapCase.assignedWorker && (
                <InfoRow label="Assigned to" value={`${snapCase.assignedWorker.firstName} ${snapCase.assignedWorker.lastName}`} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
