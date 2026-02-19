import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  AlertTriangle, CheckCircle2, Clock, FileText,
  TrendingUp, Users, Zap, XCircle
} from 'lucide-react'
import { casesApi, reportsApi } from '../services/api'
import type { SnapCase } from '../types'
import { PriorityBadge, StatusBadge } from '../components/Badges'

function StatCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: number | string; sub?: string
  icon: React.ElementType; color: string
}) {
  return (
    <div className="card flex items-start gap-4">
      <div className={`rounded-xl p-3 ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-sm text-gray-500">{label}</div>
        {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  )
}

function daysToDue(dueDate: string) {
  return Math.ceil((new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

export default function DashboardPage() {
  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: () => casesApi.stats().then(r => r.data),
    refetchInterval: 60_000,
  })

  const { data: timeliness } = useQuery({
    queryKey: ['timeliness'],
    queryFn: () => reportsApi.timeliness().then(r => r.data),
  })

  const { data: casesData } = useQuery({
    queryKey: ['cases', 'urgent'],
    queryFn: () => casesApi.list({ priority: 'EXPEDITED', limit: '10' }).then(r => r.data),
  })

  const urgentCases = casesData?.cases ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">Cumberland County SNAP Processing Overview</p>
        </div>
        <Link to="/cases/new" className="btn-primary">
          <FileText size={16} />
          New Application
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Cases" value={stats?.total ?? '—'} icon={FileText} color="bg-snap-blue" />
        <StatCard label="Pending Review" value={stats?.pending ?? '—'} sub="Awaiting assignment" icon={Clock} color="bg-amber-500" />
        <StatCard label="Expedited" value={stats?.expedited ?? '—'} sub="7-day deadline" icon={Zap} color="bg-snap-orange" />
        <StatCard label="Overdue" value={stats?.overdue ?? '—'} sub="Past federal deadline" icon={AlertTriangle} color="bg-snap-red" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Approved" value={stats?.approved ?? '—'} icon={CheckCircle2} color="bg-snap-green" />
        <StatCard label="Denied" value={stats?.denied ?? '—'} icon={XCircle} color="bg-gray-500" />
        <StatCard
          label="Avg Processing"
          value={stats ? `${stats.avgProcessingDays}d` : '—'}
          sub="Target: ≤ 30 days"
          icon={TrendingUp}
          color="bg-purple-500"
        />
        <StatCard
          label="Timeliness Rate"
          value={stats ? `${stats.timelinessRate}%` : '—'}
          sub="Federal standard: 95%"
          icon={Users}
          color={stats && stats.timelinessRate >= 95 ? 'bg-snap-green' : 'bg-snap-orange'}
        />
      </div>

      {/* Federal compliance alert */}
      {timeliness && (
        <div className={`rounded-lg p-4 border ${
          timeliness.compliant
            ? 'bg-green-50 border-green-200'
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center gap-3">
            {timeliness.compliant
              ? <CheckCircle2 size={20} className="text-green-600 shrink-0" />
              : <AlertTriangle size={20} className="text-red-600 shrink-0" />
            }
            <div>
              <div className={`font-semibold text-sm ${timeliness.compliant ? 'text-green-800' : 'text-red-800'}`}>
                {timeliness.compliant ? 'Federal Compliance: PASSING' : 'Federal Compliance: AT RISK'}
              </div>
              <div className="text-xs text-gray-600 mt-0.5">
                Standard timeliness: {timeliness.standard.rate}% (federal standard: {timeliness.standard.federalStandard}%) &nbsp;|&nbsp;
                Expedited: {timeliness.expedited.rate}% (standard: {timeliness.expedited.federalStandard}%)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Urgent cases */}
      {urgentCases.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Zap size={18} className="text-snap-orange" />
            Expedited Cases — 7-Day Deadline
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Case #</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Applicant</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wide">HH Size</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Days Left</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {urgentCases.map((c: SnapCase) => {
                  const daysLeft = daysToDue(c.dueDate)
                  return (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="py-2.5 px-3">
                        <Link to={`/cases/${c.id}`} className="text-snap-blue hover:underline font-mono text-xs">
                          {c.caseNumber}
                        </Link>
                      </td>
                      <td className="py-2.5 px-3 font-medium">{c.applicantFirstName} {c.applicantLastName}</td>
                      <td className="py-2.5 px-3">{c.householdSize}</td>
                      <td className="py-2.5 px-3"><StatusBadge status={c.status} /></td>
                      <td className="py-2.5 px-3">
                        <span className={`font-semibold ${daysLeft <= 1 ? 'text-red-600' : daysLeft <= 3 ? 'text-orange-600' : 'text-gray-700'}`}>
                          {daysLeft <= 0 ? 'OVERDUE' : `${daysLeft}d`}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100">
            <Link to="/cases?priority=EXPEDITED" className="text-sm text-snap-blue hover:underline">
              View all expedited cases →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
