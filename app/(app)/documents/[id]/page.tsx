import { notFound } from "next/navigation";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { Disclaimer } from "@/components/Disclaimer";
import { getDocument, createSignedDocUrl } from "@/lib/db/documents";
import { getOrCreateChecklist } from "@/lib/db/checklist";
import { getOwnedClient, getOrCreateActiveCase } from "@/lib/db/cases";

export const dynamic = "force-dynamic";

export default async function DocumentDetailPage({ params }: { params: { id: string } }) {
  const doc = await getDocument(params.id);
  if (!doc) notFound();

  const client = await getOwnedClient();
  let mappedLabel: string | null = null;
  if (client && doc.checklist_item_id) {
    const snapCase = await getOrCreateActiveCase({ clientId: client.id });
    const { items } = await getOrCreateChecklist(snapCase.id);
    mappedLabel = items.find((i) => i.id === doc.checklist_item_id)?.label ?? null;
  }

  const signed = await createSignedDocUrl(doc.storage_path, 300);

  return (
    <div className="space-y-4">
      <Link href="/documents" className="text-sm text-brand-700">
        ← All documents
      </Link>
      <header>
        <h1 className="text-2xl font-bold">{doc.original_name ?? "Document"}</h1>
        <p className="text-sm text-gray-600">
          Uploaded {formatDate(doc.uploaded_at)} · detected as {doc.detected_type ?? "—"}
        </p>
      </header>
      <Disclaimer variant="compact" />

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card card-pad">
          <h2 className="font-semibold">Preview</h2>
          <div className="mt-3 aspect-[3/4] bg-gray-100 rounded flex items-center justify-center text-gray-500 text-sm">
            {signed ? (
              doc.mime_type?.startsWith("image/") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={signed} alt={doc.original_name ?? "Document preview"} className="max-w-full max-h-full" />
              ) : (
                <a href={signed} target="_blank" rel="noopener" className="text-brand-700 underline">
                  Open file (signed link, expires in 5 min)
                </a>
              )
            ) : (
              "Preview not available."
            )}
          </div>
        </div>
        <div className="space-y-4">
          <div className="card card-pad">
            <h2 className="font-semibold">Classification</h2>
            <div className="mt-2 text-sm">
              <div>
                Detected type: <span className="font-medium">{doc.detected_type ?? "Not yet classified"}</span>
              </div>
              <div>
                Mapped to checklist item: <span className="font-medium">{mappedLabel ?? "—"}</span>
              </div>
              <div>
                Status: <span className="font-medium">{doc.status}</span>
              </div>
            </div>
          </div>
          <div className="card card-pad">
            <h2 className="font-semibold">Review flags</h2>
            <p className="mt-2 text-sm text-gray-600">
              Server-side document review runs after upload. Flags are advisory and shown to a human caseworker.
            </p>
            <p className="mt-3 text-xs text-gray-500">
              Flags are for human review only. A caseworker confirms whether the document is accepted.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
