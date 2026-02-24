import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { CheckCircle2, AlertTriangle, Clock, Users, Download } from 'lucide-react'
import { reportsApi } from '../services/api'

function downloadCSV(filename: string, rows: string[][]): void {
  const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function printReport(
  timeliness: import('../types').TimelinessReport | undefined,
  workload: Record<string, unknown>[],
): void {
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const tbl = (rows: string[][], headers: string[]) => `
    <table>
      <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
      <tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>
    </table>`

  const html = `<!DOCTYPE html><html><head><title>SNAP-AI Reports</title>
  <style>
    body { font-family: Arial, sans-serif; font-size: 12px; color: #111; margin: 24px; }
    h1 { font-size: 18px; margin-bottom: 4px; }
    h2 { font-size: 14px; margin: 20px 0 8px; border-bottom: 1px solid #ccc; padding-bottom: 4px; }
    p.sub { color: #555; font-size: 11px; margin: 0 0 12px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
    th { background: #f0f0f0; text-align: left; padding: 6px 8px; font-size: 11px; }
    td { padding: 5px 8px; border-bottom: 1px solid #eee; }
    .pass { color: #166534; font-weight: bold; }
    .fail { color: #991b1b; font-weight: bold; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; }
    .badge-pass { background: #dcfce7; color: #166534; }
    .badge-fail { background: #fee2e2; color: #991b1b; }
    @media print { @page { margin: 1.5cm; } }
  </style></head><body>
  <h1>SNAP-AI Reports &amp; Analytics</h1>
  <p class="sub">Cumberland County DSS &nbsp;·&nbsp; Generated ${date}</p>

  ${timeliness ? `
  <h2>Federal Timeliness Compliance</h2>
  <p class="sub">Period: ${timeliness.period}</p>
  <span class="badge ${timeliness.compliant ? 'badge-pass' : 'badge-fail'}">
    ${timeliness.compliant ? 'PASSING' : 'AT RISK'}
  </span>
  ${tbl([
    ['Standard (30-day)', String(timeliness.standard.total), String(timeliness.standard.timely),
     `${timeliness.standard.rate}%`, `${timeliness.standard.federalStandard}%`,
     timeliness.standard.rate >= timeliness.standard.federalStandard ? '✓' : '✗'],
    ['Expedited (7-day)', String(timeliness.expedited.total), String(timeliness.expedited.timely),
     `${timeliness.expedited.rate}%`, `${timeliness.expedited.federalStandard}%`,
     timeliness.expedited.rate >= timeliness.expedited.federalStandard ? '✓' : '✗'],
  ], ['Report Type', 'Total Cases', 'Timely Cases', 'Rate', 'Required', 'Status'])}
  ` : ''}

  ${workload.length ? `
  <h2>Worker Workload Distribution</h2>
  ${tbl(
    workload.map(w => [String(w.name), String(w.activeCases), String(w.expeditedCases), String(w.overdueCount)]),
    ['Worker', 'Active Cases', 'Expedited', 'Overdue'],
  )}
  ` : ''}

  <p style="margin-top:32px; color:#999; font-size:10px;">
    SNAP-AI v1.0 — Cumberland County DSS — 7 CFR § 273.2 federal processing standards
  </p>
  </body></html>`

  const w = window.open('', '_blank', 'width=800,height=600')
  if (!w) return
  w.document.write(html)
  w.document.close()
  w.focus()
  w.print()
}

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

  const exportTimeliness = () => {
    if (!timeliness) return
    downloadCSV(`timeliness-report-${new Date().toISOString().split('T')[0]}.csv`, [
      ['Report', 'Period', 'Total Cases', 'Timely Cases', 'Rate (%)', 'Federal Standard (%)'],
      ['Standard (30-day)', timeliness.period, String(timeliness.standard.total), String(timeliness.standard.timely), String(timeliness.standard.rate), String(timeliness.standard.federalStandard)],
      ['Expedited (7-day)', timeliness.period, String(timeliness.expedited.total), String(timeliness.expedited.timely), String(timeliness.expedited.rate), String(timeliness.expedited.federalStandard)],
    ])
  }

  const exportWorkload = () => {
    const rows = workload as Record<string, unknown>[]
    if (!rows.length) return
    downloadCSV(`workload-report-${new Date().toISOString().split('T')[0]}.csv`, [
      ['Worker', 'Active Cases', 'Expedited Cases', 'Overdue Cases'],
      ...rows.map(w => [String(w.name), String(w.activeCases), String(w.expeditedCases), String(w.overdueCount)]),
    ])
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-sm text-gray-500">Federal compliance and performance metrics — Last 30 days</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportTimeliness} disabled={!timeliness} className="btn-secondary text-xs py-1.5">
            <Download size={14} /> Timeliness CSV
          </button>
          <button onClick={exportWorkload} disabled={!workload.length} className="btn-secondary text-xs py-1.5">
            <Download size={14} /> Workload CSV
          </button>
          <button
            onClick={() => printReport(timeliness, workload)}
            disabled={!timeliness && !workload.length}
            className="btn-secondary text-xs py-1.5"
          >
            <Download size={14} /> Print / Save PDF
          </button>
        </div>
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
