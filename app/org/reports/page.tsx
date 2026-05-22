import { Disclaimer } from "@/components/Disclaimer";

export default function OrgReportsPage() {
  const metrics: [string, string, string][] = [
    ["Average days to decision (last 30d)", "21", "↓ from 28 baseline"],
    ["On-time rate (30-day)", "82%", "Federal compliance"],
    ["Expedited on-time rate (7-day)", "91%", ""],
    ["Backlog reduction (30d)", "−18%", "vs prior period"],
    ["Document readiness score (avg)", "74", "out of 100"],
    ["Review flags resolved (last 30d)", "62", "Human review"],
  ];
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold">Pilot reporting</h1>
        <p className="text-sm text-gray-600">Outcome metrics shared with county and state leadership.</p>
      </header>
      <Disclaimer variant="compact" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {metrics.map(([label, val, sub]) => (
          <div key={label} className="card card-pad">
            <div className="text-xs text-gray-500">{label}</div>
            <div className="mt-1 text-2xl font-bold">{val}</div>
            <div className="text-xs text-gray-500 mt-0.5">{sub}</div>
          </div>
        ))}
      </div>
      <div className="card card-pad">
        <h2 className="font-semibold">Federal reporting alignment (post-pilot)</h2>
        <ul className="mt-2 list-disc pl-5 text-sm text-gray-700 space-y-1">
          <li>FNS-388 / FNS-388A timeliness summary support</li>
          <li>Payment error rate (PER) and negative error rate (NER) workpapers</li>
          <li>Quality control audit trail of AI suggestions and human dispositions</li>
        </ul>
      </div>
    </div>
  );
}
