import Link from "next/link";
import { notFound } from "next/navigation";
import { mockOrgClients, mockChecklist, mockDocuments, mockDeadlines } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";
import { Disclaimer } from "@/components/Disclaimer";

const integrityFlags = [
  { id: "if_1", label: "Address mismatch between ID and utility bill", severity: "medium" as const },
  { id: "if_2", label: "Income discrepancy between pay stub and reported amount", severity: "medium" as const },
];

export default function OrgClientDetail({ params }: { params: { id: string } }) {
  const client = mockOrgClients.find((c) => c.id === params.id);
  if (!client) notFound();
  const missing = mockChecklist.filter((c) => c.required && c.status === "open");

  return (
    <div className="space-y-4">
      <Link href="/org/clients" className="text-sm text-brand-700">← All clients</Link>
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{client.name}</h1>
          <p className="text-sm text-gray-600">
            {client.stage.replace("_", " ")} · {client.daysOpen} days open
          </p>
        </div>
        <Link href="/org/tasks" className="btn-secondary text-sm">Open task queue</Link>
      </header>
      <Disclaimer variant="default" />

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card card-pad">
          <h2 className="font-semibold">Document readiness</h2>
          <p className="mt-1 text-sm text-gray-700">
            {missing.length === 0
              ? "All required documents collected."
              : `${missing.length} required document(s) missing.`}
          </p>
          <ul className="mt-2 list-disc pl-5 text-sm text-gray-700 space-y-0.5">
            {missing.slice(0, 5).map((m) => <li key={m.id}>{m.label}</li>)}
          </ul>
        </div>
        <div className="card card-pad">
          <h2 className="font-semibold">Upcoming deadlines</h2>
          <ul className="mt-2 text-sm space-y-1">
            {mockDeadlines.slice(0, 3).map((d) => (
              <li key={d.id} className="flex justify-between border-t border-gray-100 pt-1 first:border-t-0 first:pt-0">
                <span>{d.description}</span>
                <span className="text-gray-600">{formatDate(d.date)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="card card-pad">
        <div className="flex justify-between items-center">
          <h2 className="font-semibold">Review flags</h2>
          <span className="badge-gray">Human review only</span>
        </div>
        <ul className="mt-3 divide-y divide-gray-100">
          {integrityFlags.map((f) => (
            <li key={f.id} className="py-2 flex justify-between items-start">
              <div className="text-sm">{f.label}</div>
              <div className="flex gap-2">
                <span className={f.severity === "medium" ? "badge-amber" : "badge-red"}>possible inconsistency</span>
                <button className="text-sm text-brand-700" disabled>Resolve</button>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-gray-500">
          These are signals for human review only. SNAP AI never makes fraud or eligibility determinations.
        </p>
      </div>

      <div className="card card-pad">
        <h2 className="font-semibold">Recent documents</h2>
        <ul className="mt-2 text-sm space-y-1">
          {mockDocuments.map((d) => (
            <li key={d.id} className="flex justify-between border-t border-gray-100 pt-1 first:border-t-0 first:pt-0">
              <span>{d.name} <span className="text-gray-500">· {d.type}</span></span>
              <span className={d.status === "flagged" ? "badge-red" : d.status === "accepted" ? "badge-green" : "badge-amber"}>{d.status}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
