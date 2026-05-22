import { notFound } from "next/navigation";
import Link from "next/link";
import { mockDocuments, mockChecklist } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";
import { Disclaimer } from "@/components/Disclaimer";

export default function DocumentDetailPage({ params }: { params: { id: string } }) {
  const doc = mockDocuments.find((d) => d.id === params.id);
  if (!doc) notFound();
  const mapped = mockChecklist.find((c) => c.id === doc.mappedTo);

  return (
    <div className="space-y-4">
      <Link href="/documents" className="text-sm text-brand-700">← All documents</Link>
      <header>
        <h1 className="text-2xl font-bold">{doc.name}</h1>
        <p className="text-sm text-gray-600">Uploaded {formatDate(doc.uploadedAt)} · detected as {doc.type}</p>
      </header>
      <Disclaimer variant="compact" />

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card card-pad">
          <h2 className="font-semibold">Preview</h2>
          <div className="mt-3 aspect-[3/4] bg-gray-100 rounded flex items-center justify-center text-gray-500 text-sm">
            Document preview placeholder
          </div>
        </div>
        <div className="space-y-4">
          <div className="card card-pad">
            <h2 className="font-semibold">Classification</h2>
            <div className="mt-2 text-sm">
              <div>Detected type: <span className="font-medium">{doc.type}</span></div>
              <div>Mapped to checklist item: <span className="font-medium">{mapped?.label || "—"}</span></div>
              <div>Status: <span className="font-medium">{doc.status}</span></div>
            </div>
          </div>
          <div className="card card-pad">
            <h2 className="font-semibold">Review flags</h2>
            {doc.flags.length === 0 ? (
              <p className="mt-2 text-sm text-green-700">No flags. Looks good to a caseworker.</p>
            ) : (
              <ul className="mt-2 list-disc pl-5 text-sm text-red-700 space-y-1">
                {doc.flags.map((f) => <li key={f}>{f}</li>)}
              </ul>
            )}
            <p className="mt-3 text-xs text-gray-500">
              Flags are for human review only. A caseworker confirms whether the document is accepted.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
