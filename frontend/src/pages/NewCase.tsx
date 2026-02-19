import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { ArrowLeft, CheckCircle2, AlertTriangle } from 'lucide-react'
import { casesApi } from '../services/api'

const initialForm = {
  applicantFirstName: '', applicantLastName: '', applicantDob: '',
  applicantSsn: '', phone: '', email: '', address: '', city: '',
  state: 'NC', zipCode: '', householdSize: 1, monthlyGrossIncome: 0,
  monthlyEarnedIncome: 0, monthlyNetIncome: 0, assets: 0,
  hasElderly: false, hasDisabled: false, isHomeless: false,
  isMigrantWorker: false, hasMinors: false, categoricalEligible: false,
  shelterCost: 0, medicalExpenses: 0, dependentCareExpenses: 0,
}

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  )
}

const inputClass = "w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-snap-green"
const checkboxClass = "w-4 h-4 text-snap-green border-gray-300 rounded focus:ring-snap-green"

export default function NewCasePage() {
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)
  const [result, setResult] = useState<Record<string, unknown> | null>(null)

  const set = (key: string, value: unknown) => setForm(f => ({ ...f, [key]: value }))

  const createMutation = useMutation({
    mutationFn: () => casesApi.create(form as unknown as Record<string, unknown>),
    onSuccess: (res) => {
      setResult(res.data as unknown as Record<string, unknown>)
    },
  })

  if (result) {
    const snapCase = result.case as Record<string, unknown>
    const eligibility = result.eligibility as Record<string, unknown>
    return (
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="card text-center">
          <CheckCircle2 size={48} className="text-snap-green mx-auto mb-3" />
          <h2 className="text-xl font-bold text-gray-900 mb-1">Application Submitted</h2>
          <p className="text-gray-500 text-sm mb-4">Case {String(snapCase?.caseNumber)} has been created and pre-screened.</p>
          <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold mb-6 ${
            eligibility.result === 'ELIGIBLE' || eligibility.result === 'EXPEDITED_ELIGIBLE'
              ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
          }`}>
            {String(eligibility.result).replace(/_/g, ' ')}
            {typeof eligibility.estimatedMonthlyBenefit === 'number' && eligibility.estimatedMonthlyBenefit > 0 &&
              ` — Est. $${eligibility.estimatedMonthlyBenefit}/mo`}
          </div>
          <div className="flex gap-3 justify-center">
            <button onClick={() => navigate(`/cases/${String(snapCase?.id)}`)} className="btn-primary">
              View Case
            </button>
            <button onClick={() => { setResult(null); setForm(initialForm) }} className="btn-secondary">
              New Application
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="btn-secondary py-2 px-3">
          <ArrowLeft size={16} />
        </button>
        <h1 className="text-xl font-bold text-gray-900">New SNAP Application</h1>
      </div>

      {createMutation.isError && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700 flex items-center gap-2">
          <AlertTriangle size={16} /> Failed to submit application. Please check all required fields.
        </div>
      )}

      <form onSubmit={e => { e.preventDefault(); createMutation.mutate() }} className="space-y-5">
        {/* Applicant */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Applicant Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="First Name" required>
              <input type="text" required className={inputClass} value={form.applicantFirstName}
                onChange={e => set('applicantFirstName', e.target.value)} />
            </Field>
            <Field label="Last Name" required>
              <input type="text" required className={inputClass} value={form.applicantLastName}
                onChange={e => set('applicantLastName', e.target.value)} />
            </Field>
            <Field label="Date of Birth" required>
              <input type="date" required className={inputClass} value={form.applicantDob}
                onChange={e => set('applicantDob', e.target.value)} />
            </Field>
            <Field label="SSN (XXX-XX-XXXX)" required>
              <input type="text" required pattern="\d{3}-\d{2}-\d{4}" placeholder="000-00-0000"
                className={inputClass} value={form.applicantSsn}
                onChange={e => set('applicantSsn', e.target.value)} />
            </Field>
            <Field label="Phone">
              <input type="tel" className={inputClass} value={form.phone}
                onChange={e => set('phone', e.target.value)} />
            </Field>
            <Field label="Email">
              <input type="email" className={inputClass} value={form.email}
                onChange={e => set('email', e.target.value)} />
            </Field>
          </div>
        </div>

        {/* Address */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Address</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Field label="Street Address" required>
                <input type="text" required className={inputClass} value={form.address}
                  onChange={e => set('address', e.target.value)} />
              </Field>
            </div>
            <Field label="City" required>
              <input type="text" required className={inputClass} value={form.city}
                onChange={e => set('city', e.target.value)} />
            </Field>
            <Field label="ZIP Code" required>
              <input type="text" required pattern="\d{5}" className={inputClass} value={form.zipCode}
                onChange={e => set('zipCode', e.target.value)} />
            </Field>
          </div>
        </div>

        {/* Household */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Household & Income</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Household Size" required>
              <input type="number" required min={1} max={20} className={inputClass}
                value={form.householdSize} onChange={e => set('householdSize', parseInt(e.target.value))} />
            </Field>
            <Field label="Monthly Gross Income ($)" required>
              <input type="number" required min={0} step="0.01" className={inputClass}
                value={form.monthlyGrossIncome} onChange={e => set('monthlyGrossIncome', parseFloat(e.target.value))} />
            </Field>
            <Field label="Monthly Earned Income ($)" required>
              <input type="number" required min={0} step="0.01" className={inputClass}
                value={form.monthlyEarnedIncome} onChange={e => set('monthlyEarnedIncome', parseFloat(e.target.value))} />
            </Field>
            <Field label="Monthly Net Income ($)" required>
              <input type="number" required min={0} step="0.01" className={inputClass}
                value={form.monthlyNetIncome} onChange={e => set('monthlyNetIncome', parseFloat(e.target.value))} />
            </Field>
            <Field label="Total Assets ($)">
              <input type="number" min={0} step="0.01" className={inputClass}
                value={form.assets} onChange={e => set('assets', parseFloat(e.target.value))} />
            </Field>
            <Field label="Monthly Shelter Cost ($)">
              <input type="number" min={0} step="0.01" className={inputClass}
                value={form.shelterCost} onChange={e => set('shelterCost', parseFloat(e.target.value))} />
            </Field>
            <Field label="Medical Expenses/mo ($)">
              <input type="number" min={0} step="0.01" className={inputClass}
                value={form.medicalExpenses} onChange={e => set('medicalExpenses', parseFloat(e.target.value))} />
            </Field>
            <Field label="Dependent Care Expenses/mo ($)">
              <input type="number" min={0} step="0.01" className={inputClass}
                value={form.dependentCareExpenses} onChange={e => set('dependentCareExpenses', parseFloat(e.target.value))} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            {[
              ['hasElderly', 'Household member age 60+'],
              ['hasDisabled', 'Household member with disability'],
              ['isHomeless', 'Homeless household'],
              ['isMigrantWorker', 'Migrant/seasonal worker'],
              ['hasMinors', 'Children under 18 present'],
              ['categoricalEligible', 'Categorically eligible (TANF/SSI)'],
            ].map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" className={checkboxClass}
                  checked={form[key as keyof typeof form] as boolean}
                  onChange={e => set(key, e.target.checked)} />
                {label}
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={createMutation.isPending} className="btn-primary px-8">
            {createMutation.isPending ? 'Submitting & Screening...' : 'Submit Application'}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
