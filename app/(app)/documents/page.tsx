import Link from "next/link";
import { redirect } from "next/navigation";
import { formatDate } from "@/lib/utils";
import { Disclaimer } from "@/components/Disclaimer";
import { getOwnedClient, getOrCreateActiveCase } from "@/lib/db/cases";
import { listDocuments } from "@/lib/db/documents";
import { getOrCreateChecklist } from "@/lib/db/checklist";
import { UploadForm } from "./upload-form";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  const client = await getOwnedClient();
  if (!client) redirect("/onboarding");
  const snapCase = await getOrCreateActiveCase({ clientId: client.id });
  const [{ items }, docs] = await Promise.all([
    getOrCreateChecklist(snapCase.id),
    listDocuments(client.id),
  ]);

  const labelById = new Map(items.map((i) => [i.id, i.label]));

  return (
    <div className="space-y-4">
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">Documents</h1>
          <p className="text-sm text-gray-600">
            Uploaded files are private. Only you and the human caseworker assigned to your case can access them.
          </p>
        </div>
      </header>
      <Disclaimer variant="compact" />

      <UploadForm checklistOptions={items.map((i) => ({ id: i.id, label: i.label }))} />

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
            {docs.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-sm text-gray-500">
                  No documents yet. Upload your first one above.
                </td>
              </tr>
            )}
            {docs.map((d) => (
              <tr key={d.id} className="border-t border-gray-100">
                <td className="p-3 font-medium">{d.original_name ?? "Untitled"}</td>
                <td className="p-3">{d.detected_type ?? "—"}</td>
                <td className="p-3 text-gray-700">
                  {d.checklist_item_id ? labelById.get(d.checklist_item_id) ?? "—" : "—"}
                </td>
                <td className="p-3 text-gray-600">{formatDate(d.uploaded_at)}</td>
                <td className="p-3">
                  <span
                    className={
                      d.status === "accepted"
                        ? "badge-green"
                        : d.status === "flagged"
                        ? "badge-red"
                        : d.status === "review"
                        ? "badge-amber"
                        : "badge-gray"
                    }
                  >
                    {d.status}
                  </span>
                </td>
                <td className="p-3 text-right">
                  <Link href={`/documents/${d.id}`} className="text-brand-700 text-sm">
                    Open
                  </Link>
                </td>
              </tr>
            ))}
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
