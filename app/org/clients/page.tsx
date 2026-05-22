import Link from "next/link";
import { mockOrgClients } from "@/lib/mock-data";
import { Disclaimer } from "@/components/Disclaimer";

export default function OrgClients() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold">Clients</h1>
        <p className="text-sm text-gray-600">Sandbox client list for the pilot. Agency users only see clients tied to their organization.</p>
      </header>
      <Disclaimer variant="compact" />

      <div className="card">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left p-3">Client</th>
              <th className="text-left p-3">Stage</th>
              <th className="text-left p-3">Days open</th>
              <th className="text-left p-3">Missing docs</th>
              <th className="text-left p-3">Review flags</th>
              <th className="text-left p-3">Urgent deadlines</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {mockOrgClients.map((c) => (
              <tr key={c.id} className="border-t border-gray-100">
                <td className="p-3 font-medium">{c.name}</td>
                <td className="p-3">{c.stage.replace("_", " ")}</td>
                <td className="p-3">{c.daysOpen}</td>
                <td className="p-3">{c.missingDocs > 0 ? <span className="badge-amber">{c.missingDocs}</span> : <span className="badge-green">0</span>}</td>
                <td className="p-3">{c.flags > 0 ? <span className="badge-red">{c.flags}</span> : <span className="badge-gray">0</span>}</td>
                <td className="p-3">{c.urgentDeadlines > 0 ? <span className="badge-red">{c.urgentDeadlines}</span> : <span className="badge-gray">0</span>}</td>
                <td className="p-3 text-right">
                  <Link href={`/org/clients/${c.id}`} className="text-brand-700 text-sm">Open</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
