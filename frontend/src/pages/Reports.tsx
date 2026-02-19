import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { CheckCircle2, AlertTriangle, Clock, Users } from 'lucide-react'
import { reportsApi } from '../services/api'

const COLORS = ['#2D7D46', '#1565C0', '#E65100', '#9C27B0', '#757575', '#F44336']

function MetricCard({ label, value, sub, color }: { label: string; value: string | number; sub: string; color: string }) {
  return (
    <div className="card">
      <div className={`text-3xl font-bold mb-1 ${color}`}>{value}</div>
      <div className="font-medium text-gray-800 text-sm">{label}</div>
      <div className="text-xs text-gray-400 mt-0.5">{sub}</div>
    </div>
  )
}

export default function ReportsPage() {
  const { data: timeliness } = useQuery({
    queryKey: ['timeliness'],
    queryFn: () => reportsApi.timeliness().then(r => r.data),
  })

  const { data: workloadData } = useQuery({
    queryKey: ['workload'],
    queryFn: () => reportsApi.workload().then(r => r.data),
  })

  const { data: trendsData } = useQuery({
    queryKey: ['trends'],
    queryFn: () => reportsApi.trends().then(r => r.data),
  })

  const { data: pipelineData } = useQuery({
    queryKey: ['pipeline'],
    queryFn: () => reportsApi.pipeline().then(r => r.data),
  })

  const workload = (workloadData as { workload: Record<string, unknown>[] })?.workload ?? []
  const trends = (trendsData as { trends: Record<string, unknown>[] })?.trends ?? []
  const pipeline = (pipelineData as { pipeline: { status: string; count: number }[] })?.pipeline ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-sm text-gray-500">Federal compliance and performance metrics — Last 30 days</p>
      </div>

      {/* Federal compliance */}
      {timeliness && (
        <div className={`rounded-lg p-5 border-2 ${timeliness.compliant ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center gap-3 mb-4">
            {timeliness.compliant
              ? <CheckCircle2 size={24} className="text-green-600" />
              : <AlertTriangle size={24} className="text-red-600" />}
            <h2 className="font-bold text-gray-900">
              Federal Timeliness Compliance — {timeliness.compliant ? 'PASSING' : 'AT RISK'}
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-gray-600 mb-2">Standard Applications (30-day)</div>
              <div className="flex items-end gap-2">
                <span className={`text-4xl font-bold ${timeliness.standard.rate >= 95 ? 'text-green-600' : 'text-red-600'}`}>
                  {timeliness.standard.rate}%
                </span>
                <span className="text-sm text-gray-400 pb-1">/ {timeliness.standard.federalStandard}% required</span>
              </div>
              <div className="mt-2 bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${timeliness.standard.rate >= 95 ? 'bg-green-500' : 'bg-red-500'}`}
                  style={{ width: `${Math.min(100, timeliness.standard.rate)}%` }}
                />
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {timeliness.standard.timely} of {timeliness.standard.total} cases processed on time
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-600 mb-2">Expedited Applications (7-day)</div>
              <div className="flex items-end gap-2">
                <span className={`text-4xl font-bold ${timeliness.expedited.rate >= 100 ? 'text-green-600' : 'text-red-600'}`}>
                  {timeliness.expedited.rate}%
                </span>
                <span className="text-sm text-gray-400 pb-1">/ {timeliness.expedited.federalStandard}% required</span>
              </div>
              <div className="mt-2 bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${timeliness.expedited.rate >= 100 ? 'bg-green-500' : 'bg-orange-500'}`}
                  style={{ width: `${Math.min(100, timeliness.expedited.rate)}%` }}
                />
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {timeliness.expedited.timely} of {timeliness.expedited.total} expedited cases on time
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Processing trends */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock size={16} className="text-snap-green" /> Processing Trends (Weekly)
          </h2>
          {trends.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={trends}>
                <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="approved" name="Approved" fill="#2D7D46" radius={[3, 3, 0, 0]} />
                <Bar dataKey="denied" name="Denied" fill="#C62828" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-gray-300 text-sm">
              No completed cases yet
            </div>
          )}
        </div>

        {/* Pipeline */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Case Pipeline</h2>
          {pipeline.some(p => p.count > 0) ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pipeline.filter(p => p.count > 0)} dataKey="count" nameKey="status"
                  cx="50%" cy="50%" outerRadius={80} label={({ status, count }) => `${count}`}>
                  {pipeline.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v, n) => [v, String(n).replace(/_/g, ' ')]} />
                <Legend formatter={v => String(v).replace(/_/g, ' ')} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-gray-300 text-sm">No cases yet</div>
          )}
        </div>
      </div>

      {/* Workload distribution */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Users size={16} className="text-snap-green" /> Worker Workload Distribution
        </h2>
        {workload.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100">
                <tr>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">Worker</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">Active Cases</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">Expedited</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">Overdue</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">Load</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {workload.map((w: Record<string, unknown>) => (
                  <tr key={w.workerId as string}>
                    <td className="py-2.5 px-3 font-medium">{w.name as string}</td>
                    <td className="py-2.5 px-3">{w.activeCases as number}</td>
                    <td className="py-2.5 px-3">
                      {(w.expeditedCases as number) > 0
                        ? <span className="badge bg-orange-100 text-orange-800">{w.expeditedCases as number}</span>
                        : '—'}
                    </td>
                    <td className="py-2.5 px-3">
                      {(w.overdueCount as number) > 0
                        ? <span className="badge bg-red-100 text-red-800">{w.overdueCount as number}</span>
                        : <span className="text-green-600">✓</span>}
                    </td>
                    <td className="py-2.5 px-3 w-40">
                      <div className="bg-gray-100 rounded-full h-1.5">
                        <div className="bg-snap-green h-1.5 rounded-full"
                          style={{ width: `${Math.min(100, ((w.activeCases as number) / 30) * 100)}%` }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-400 text-sm">No eligibility workers found</p>
        )}
      </div>
    </div>
  )
}
