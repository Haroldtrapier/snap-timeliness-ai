import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { getCaseworkerQueue, getCaseworkerOrgCount } from "@/lib/repositories";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Icon } from "@/components/Icons";
import { reviewDocument } from "./actions";

export const metadata: Metadata = {
  title: "Review queue · SNAP AI",
};

const BUCKET = "snap-documents";

function statusClass(status: string): string {
  const s = status.toLowerCase();
  if (["verified", "complete", "approved"].includes(s)) return "ok";
  if (["changes_requested", "rejected"].includes(s)) return "bad";
  return "pending";
}

export default async function ReviewQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ reviewed?: string }>;
}) {
  const { reviewed } = await searchParams;
  const session = await getSession();

  if (session && session.role !== "agency") {
    return (
      <div className="app-surface">
        <div className="section-head">
          <h1 className="section-title">Review queue</h1>
        </div>
        <div className="card" style={{ padding: 24 }}>
          <p style={{ margin: 0, color: "var(--ink-2)" }}>This area is for agency caseworkers.</p>
        </div>
      </div>
    );
  }

  const [queue, orgCount] = await Promise.all([
    getCaseworkerQueue(session?.id),
    getCaseworkerOrgCount(session?.id),
  ]);

  // Signed URLs for viewing the uploaded files (caseworker has org read access).
  const signed: Record<string, string> = {};
  const paths = queue.flatMap((c) => c.documents.map((d) => d.storagePath));
  if (paths.length) {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.storage.from(BUCKET).createSignedUrls(paths, 600);
    (data ?? []).forEach((s) => {
      if (s.signedUrl && s.path) signed[s.path] = s.signedUrl;
    });
  }

  return (
    <div className="app-surface">
      <div className="section-head">
        <h1 className="section-title">Review queue</h1>
        <p className="section-sub">
          Documents submitted by applicants in your organization. AI surfaces them for review —
          you decide. Nothing here is an eligibility determination.
        </p>
      </div>

      {reviewed && (
        <div className="auth-info" role="status">
          Review recorded.
        </div>
      )}

      {queue.length === 0 ? (
        <div className="card" style={{ padding: 24 }}>
          {orgCount === 0 ? (
            <p style={{ margin: 0, color: "var(--ink-2)" }}>
              Your account hasn&apos;t been added to an organization yet. An administrator must
              grant you access before applicant cases appear here.
            </p>
          ) : (
            <p style={{ margin: 0, color: "var(--ink-2)" }}>
              No documents to review right now.
            </p>
          )}
        </div>
      ) : (
        <div className="queue-list">
          {queue.map((client) => (
            <div className="queue-client" key={client.clientId}>
              <div className="queue-client-head">
                <div className="avatar" aria-hidden="true">
                  {client.name
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((w) => w[0]?.toUpperCase())
                    .join("")}
                </div>
                <div>
                  <div className="queue-client-name">{client.name}</div>
                  {client.location && <div className="queue-client-loc mono">{client.location}</div>}
                </div>
              </div>

              <div className="docs-list">
                {client.documents.map((doc) => (
                  <div className="docs-item" key={doc.id}>
                    <div className="docs-info">
                      <div className="docs-name">
                        {doc.label ?? doc.originalName ?? "Document"}
                        <span className={"qstatus " + statusClass(doc.status)}>{doc.status}</span>
                      </div>
                      {doc.originalName && <div className="docs-cat mono">{doc.originalName}</div>}
                    </div>
                    <form action={reviewDocument} className="queue-review">
                      <input type="hidden" name="document_id" value={doc.id} />
                      <input type="hidden" name="client_id" value={client.clientId} />
                      <input type="hidden" name="checklist_item_id" value={doc.checklistItemId ?? ""} />
                      <input type="hidden" name="label" value={doc.label ?? doc.originalName ?? "document"} />
                      <input
                        className="queue-note"
                        type="text"
                        name="note"
                        placeholder="Optional note to applicant…"
                        aria-label="Note to applicant"
                      />
                      <div className="docs-actions">
                        {signed[doc.storagePath] && (
                          <a
                            className="btn btn-ghost btn-tiny"
                            href={signed[doc.storagePath]}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Icon.Eye /> View
                          </a>
                        )}
                        <button type="submit" name="decision" value="verify" className="btn btn-primary btn-tiny">
                          <Icon.Check /> Verify
                        </button>
                        <button type="submit" name="decision" value="request" className="btn btn-ghost btn-tiny">
                          Request re-upload
                        </button>
                      </div>
                    </form>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
