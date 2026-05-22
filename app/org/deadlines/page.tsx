import { mockDeadlines } from "@/lib/mock-data";
import { daysUntil, formatDate, urgencyForDays } from "@/lib/utils";
import { Disclaimer } from "@/components/Disclaimer";

export default function OrgDeadlinesPage() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold">Caseload deadlines</h1>
        <p className="text-sm text-gray-600">Every interview, document due date, and recertification across your caseload.</p>
      </header>
      <Disclaimer variant="deadline" />

      <div className="card">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left p-3">Description</th>
              <th className="text-left p-3">Type</th>
              <th className="text-left p-3">Date</th>
              <th className="text-left p-3">Days out</th>
            </tr>
          </thead>
          <tbody>
            {mockDeadlines.map((d) => {
              const days = daysUntil(d.date);
              const u = urgencyForDays(days);
              return (
                <tr key={d.id} className="border-t border-gray-100">
                  <td className="p-3">{d.description}</td>
                  <td className="p-3">{d.type.replace("_", " ")}</td>
                  <td className="p-3">{formatDate(d.date)}</td>
                  <td className="p-3">
                    <span className={u === "overdue" || u === "high" ? "badge-red" : u === "medium" ? "badge-amber" : "badge-gray"}>
                      {u === "overdue" ? "overdue" : `${days}d`}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
