import Link from "next/link";
import { mockDocuments, mockChecklist } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";
import { Disclaimer } from "@/components/Disclaimer";

export default function DocumentsPage() {
  return (
    <div className="space-y-4">
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">Documents</h1>
          <p className="text-sm text-gray-600">Uploaded files are private. Only you and the human caseworker assigned to your case can access them.</p>
        </div>
        <button className="btn-primary" disabled>Upload (pilot)</button>
      </header>
      <Disclaimer variant="compact" />

      <div className="card">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left p-3">File</th>
              <th className="text-left p-3">Detected type</th>
              <th className="text-left p-3">Mapped to</th>
              <th className="text-left p-3">Uploaded</th>
              <th className="text-left p-3">Status</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {mockDocuments.map((d) => {
              const mapped = mockChecklist.find((c) => c.id === d.mappedTo);
              return (
                <tr key={d.id} className="border-t border-gray-100">
                  <td className="p-3 font-medium">{d.name}</td>
                  <td className="p-3">{d.type}</td>
                  <td className="p-3 text-gray-700">{mapped?.label || "—"}</td>
                  <td className="p-3 text-gray-600">{formatDate(d.uploadedAt)}</td>
                  <td className="p-3">
                    <span className={
                      d.status === "accepted" ? "badge-green"
                      : d.status === "flagged" ? "badge-red"
                      : d.status === "review" ? "badge-amber"
                      : "badge-gray"
                    }>
                      {d.status}
                    </span>
                    {d.flags.length > 0 && (
                      <div className="text-xs text-red-700 mt-1">Flag: {d.flags.join(", ")}</div>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <Link href={`/documents/${d.id}`} className="text-brand-700 text-sm">Open</Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="card card-pad bg-gray-50">
        <div className="font-semibold">What we check, automatically</div>
        <ul className="mt-2 list-disc pl-5 text-sm text-gray-700 space-y-1">
          <li>Missing pages</li>
          <li>Unreadable image</li>
          <li>Expired document</li>
          <li>Wrong document type for the checklist item</li>
          <li>Incomplete information</li>
          <li>Name and address mismatch — flagged for human review only</li>
        </ul>
      </div>
    </div>
  );
}
