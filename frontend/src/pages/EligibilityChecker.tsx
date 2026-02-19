import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Calculator, CheckCircle2, XCircle, Zap, Info } from 'lucide-react'
import { eligibilityApi } from '../services/api'

const initial = {
  householdSize: 3, monthlyGrossIncome: 2000, monthlyEarnedIncome: 2000,
  assets: 500, hasElderly: false, hasDisabled: false, isHomeless: false,
  isMigrantWorker: false, shelterCost: 800, medicalExpenses: 0,
  dependentCareExpenses: 0, categoricalEligible: false,
}

const inputClass = "w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-snap-green"

export default function EligibilityCheckerPage() {
  const [form, setForm] = useState(initial)
  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  const { data: guidelines } = useQuery({
    queryKey: ['guidelines'],
    queryFn: () => eligibilityApi.guidelines().then(r => r.data),
  })

  const checkMutation = useMutation({
    mutationFn: () => eligibilityApi.check(form as unknown as Record<string, unknown>).then(r => r.data),
  })

  const result = checkMutation.data as Record<string, unknown> | undefined

  return (
    <div className="max-w-4xl space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Eligibility Pre-Screener</h1>
        <p className="text-sm text-gray-500">
          Quick eligibility check — not a final determination. Based on FY2025 SNAP rules (7 CFR Part 273).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Input form */}
        <div className="lg:col-span-3 card space-y-4">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Calculator size={16} className="text-snap-green" /> Household Information
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Household Size</label>
              <input type="number" min={1} max={20} className={inputClass}
                value={form.householdSize} onChange={e => set('householdSize', parseInt(e.target.value))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Monthly Gross Income ($)</label>
              <input type="number" min={0} step="1" className={inputClass}
                value={form.monthlyGrossIncome} onChange={e => set('monthlyGrossIncome', parseFloat(e.target.value))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Monthly Earned Income ($)</label>
              <input type="number" min={0} step="1" className={inputClass}
                value={form.monthlyEarnedIncome} onChange={e => set('monthlyEarnedIncome', parseFloat(e.target.value))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Assets / Liquid Resources ($)</label>
              <input type="number" min={0} step="1" className={inputClass}
                value={form.assets} onChange={e => set('assets', parseFloat(e.target.value))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Monthly Shelter Cost ($)</label>
              <input type="number" min={0} step="1" className={inputClass}
                value={form.shelterCost} onChange={e => set('shelterCost', parseFloat(e.target.value))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Medical Expenses ($)</label>
              <input type="number" min={0} step="1" className={inputClass}
                value={form.medicalExpenses} onChange={e => set('medicalExpenses', parseFloat(e.target.value))} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              ['hasElderly', 'Elderly (60+) member'],
              ['hasDisabled', 'Disabled member'],
              ['isHomeless', 'Homeless household'],
              ['isMigrantWorker', 'Migrant worker'],
              ['categoricalEligible', 'Categorically eligible'],
            ].map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" className="w-4 h-4 text-snap-green border-gray-300 rounded"
                  checked={form[key as keyof typeof form] as boolean}
                  onChange={e => set(key, e.target.checked)} />
                {label}
              </label>
            ))}
          </div>

          <button onClick={() => checkMutation.mutate()} disabled={checkMutation.isPending}
            className="btn-primary">
            <Calculator size={16} />
            {checkMutation.isPending ? 'Calculating...' : 'Check Eligibility'}
          </button>
        </div>

        {/* Result */}
        <div className="lg:col-span-2 space-y-4">
          {result ? (
            <div className="card space-y-4">
              <div className="text-center">
                {(result.result === 'ELIGIBLE' || result.result === 'EXPEDITED_ELIGIBLE') ? (
                  <CheckCircle2 size={40} className="text-snap-green mx-auto mb-2" />
                ) : result.result === 'INELIGIBLE' ? (
                  <XCircle size={40} className="text-red-500 mx-auto mb-2" />
                ) : (
                  <Info size={40} className="text-amber-500 mx-auto mb-2" />
                )}
                <div className="font-bold text-lg text-gray-900">
                  {String(result.result).replace(/_/g, ' ')}
                </div>
                {(result.estimatedMonthlyBenefit as number) > 0 && (
                  <div className="text-2xl font-bold text-snap-green mt-1">
                    ${result.estimatedMonthlyBenefit as number}/mo
                  </div>
                )}
                <div className="text-xs text-gray-400 mt-0.5">
                  {result.povertyLevel as number}% of Federal Poverty Level
                </div>
              </div>

              {/* Tests */}
              <div className="space-y-2">
                {[
                  { label: 'Gross Income', limit: result.grossIncomeLimit as number, actual: result.grossIncomeActual as number, pass: result.grossIncomePass as boolean },
                  { label: 'Net Income', limit: result.netIncomeLimit as number, actual: Math.round(result.netIncomeActual as number), pass: result.netIncomePass as boolean },
                  { label: 'Assets', limit: result.assetLimit as number, actual: result.assetsActual as number, pass: result.assetPass as boolean },
                ].map(({ label, limit, actual, pass }) => (
                  <div key={label} className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${pass ? 'bg-green-50' : 'bg-red-50'}`}>
                    <span className="text-gray-600">{label}</span>
                    <span className={`font-medium ${pass ? 'text-green-700' : 'text-red-700'}`}>
                      ${actual.toLocaleString()} / ${limit.toLocaleString()} {pass ? '✓' : '✗'}
                    </span>
                  </div>
                ))}
              </div>

              {/* Deductions */}
              {result.deductions && (
                <div className="border-t border-gray-100 pt-3">
                  <div className="text-xs font-medium text-gray-500 mb-2">Deductions Applied</div>
                  <div className="space-y-1 text-xs text-gray-600">
                    {Object.entries(result.deductions as Record<string, number>)
                      .filter(([k, v]) => k !== 'total' && v > 0)
                      .map(([k, v]) => (
                        <div key={k} className="flex justify-between">
                          <span className="capitalize">{k.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
                          <span>${v}</span>
                        </div>
                      ))}
                    <div className="flex justify-between font-medium border-t border-gray-100 pt-1">
                      <span>Total deductions</span>
                      <span>${(result.deductions as Record<string, number>).total}</span>
                    </div>
                  </div>
                </div>
              )}

              {result.expeditedEligible && (
                <div className="rounded-lg bg-orange-50 border border-orange-100 p-3 text-xs text-orange-800 flex items-center gap-2">
                  <Zap size={14} /> Qualifies for expedited processing (7-day deadline)
                </div>
              )}
            </div>
          ) : (
            <div className="card text-center text-gray-400 py-10">
              <Calculator size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Enter household info and click "Check Eligibility"</p>
            </div>
          )}

          {/* Quick reference */}
          {guidelines && (
            <div className="card text-xs">
              <div className="font-medium text-gray-700 mb-2">FY2025 Quick Reference</div>
              <div className="space-y-1 text-gray-500">
                <div className="flex justify-between"><span>Gross income limit</span><span>130% FPL</span></div>
                <div className="flex justify-between"><span>Net income limit</span><span>100% FPL</span></div>
                <div className="flex justify-between"><span>Asset limit (standard)</span><span>$2,750</span></div>
                <div className="flex justify-between"><span>Asset limit (elderly/disabled)</span><span>$4,500</span></div>
                <div className="flex justify-between"><span>Earned income deduction</span><span>20%</span></div>
                <div className="flex justify-between"><span>Shelter deduction cap</span><span>$672</span></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
