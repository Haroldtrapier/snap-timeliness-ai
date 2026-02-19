import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Plus, Search, Filter } from 'lucide-react'
import { casesApi } from '../services/api'
import { PriorityBadge, StatusBadge } from '../components/Badges'
import type { SnapCase } from '../types'

const STATUSES = ['', 'PENDING_REVIEW', 'IN_REVIEW', 'PENDING_VERIFICATION', 'APPROVED', 'DENIED']
const PRIORITIES = ['', 'EXPEDITED', 'HIGH', 'NORMAL', 'LOW']

function daysToDue(dueDate: string) {
  return Math.ceil((new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

export default function CasesPage() {
  const [params, setParams] = useSearchParams()
  const [search, setSearch] = useState('')

  const status = params.get('status') ?? ''
  const priority = params.get('priority') ?? ''
  const page = parseInt(params.get('page') ?? '1')

  const { data, isLoading } = useQuery({
    queryKey: ['cases', { status, priority, page }],
    queryFn: () => casesApi.list({
      ...(status && { status }),
      ...(priority && { priority }),
      page: String(page),
    }).then(r => r.data),
  })

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    next.delete('page')
    setParams(next)
  }

  const cases = data?.cases ?? []
  const filtered = search
    ? cases.filter(c =>
        `${c.applicantFirstName} ${c.applicantLastName} ${c.caseNumber}`
          .toLowerCase()
          .includes(search.toLowerCase())
      )
    : cases

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Cases</h1>
          <p className="text-sm text-gray-500">{data?.total ?? 0} total cases</p>
        </div>
        <Link to="/cases/new" className="btn-primary">
          <Plus size={16} />
          New Application
        </Link>
      </div>

      {/* Filters */}
      <div className="card py-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or case number..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-snap-green"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Filter size={15} />
            <span>Filter:</span>
          </div>
          <select
            value={status}
            onChange={e => updateParam('status', e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-snap-green"
          >
            <option value="">All Statuses</option>
            {STATUSES.filter(Boolean).map(s => (
              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
            ))}
          </select>
          <select
            value={priority}
            onChange={e => updateParam('priority', e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-snap-green"
          >
            <option value="">All Priorities</option>
            {PRIORITIES.filter(Boolean).map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Case #</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Applicant</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">HH</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Income</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Priority</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Due</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Assigned To</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr><td colSpan={8} className="py-10 text-center text-gray-400">Loading cases...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="py-10 text-center text-gray-400">No cases found</td></tr>
              ) : (
                filtered.map((c: SnapCase) => {
                  const daysLeft = daysToDue(c.dueDate)
                  return (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <Link to={`/cases/${c.id}`} className="text-snap-blue hover:underline font-mono text-xs font-medium">
                          {c.caseNumber}
                        </Link>
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900">
                        {c.applicantFirstName} {c.applicantLastName}
                      </td>
                      <td className="py-3 px-4 text-gray-600">{c.householdSize}</td>
                      <td className="py-3 px-4 text-gray-600">${c.monthlyGrossIncome.toLocaleString()}/mo</td>
                      <td className="py-3 px-4"><PriorityBadge priority={c.priority} /></td>
                      <td className="py-3 px-4"><StatusBadge status={c.status} /></td>
                      <td className="py-3 px-4">
                        <span className={`text-xs font-medium ${
                          daysLeft <= 0 ? 'text-red-600' :
                          daysLeft <= 3 ? 'text-orange-600' :
                          daysLeft <= 7 ? 'text-amber-600' : 'text-gray-600'
                        }`}>
                          {daysLeft <= 0 ? 'OVERDUE' : `${daysLeft}d left`}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-500 text-xs">
                        {c.assignedWorker
                          ? `${c.assignedWorker.firstName} ${c.assignedWorker.lastName}`
                          : <span className="text-gray-300">Unassigned</span>}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <span className="text-sm text-gray-500">Page {page} of {data.pages}</span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => updateParam('page', String(page - 1))}
                className="btn-secondary py-1 px-3 text-xs disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page >= data.pages}
                onClick={() => updateParam('page', String(page + 1))}
                className="btn-secondary py-1 px-3 text-xs disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
