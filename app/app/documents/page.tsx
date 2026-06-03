import type { Metadata } from "next";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getApplicantChecklist } from "@/lib/repositories";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { Icon } from "@/components/Icons";
import { uploadDocument } from "./actions";

export const metadata: Metadata = {
  title: "Documents · SNAP AI",
};

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { ok, error } = await searchParams;
  const session = await getSession();
  const checklist = await getApplicantChecklist(session?.id);

  const ready = checklist?.items.filter((i) => i.provided).length ?? 0;
  const total = checklist?.items.length ?? 0;

  return (
    <div className="app-surface">
      <div className="section-head">
        <h1 className="section-title">Documents</h1>
        <p className="section-sub">
          Upload each document below. We review for legibility before it reaches a caseworker.
          Files are private to you.
        </p>
      </div>

      {ok && (
        <div className="auth-info" role="status">
          Uploaded. Your readiness has been updated.
        </div>
      )}
      {error && (
        <div className="auth-error" role="alert">
          {error === "file" ? "Please choose a file to upload." : "Upload failed — please try again."}
        </div>
      )}

      {!checklist ? (
        <div className="card" style={{ padding: 24 }}>
          {!isSupabaseConfigured || session?.id === "demo" ? (
            <p style={{ margin: 0, color: "var(--ink-2)" }}>
              Document upload is available when signed in with a real account.
            </p>
          ) : (
            <p style={{ margin: 0, color: "var(--ink-2)" }}>
              You don&apos;t have an application yet.{" "}
              <Link href="/app/onboarding" style={{ color: "var(--green-2)", fontWeight: 600 }}>
                Set one up
              </Link>{" "}
              to get your document checklist.
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="card" style={{ padding: "12px 16px", marginBottom: 16 }}>
            <b style={{ color: "var(--navy)" }}>
              {ready} of {total} provided
            </b>{" "}
            <span style={{ color: "var(--ink-3)" }}>
              — {total - ready} remaining to make your packet caseworker-ready.
            </span>
          </div>

          <div className="docs-list">
            {checklist.items.map((item) => (
              <div className={"docs-item" + (item.provided ? " provided" : "")} key={item.id}>
                <div className={"docs-icon " + (item.provided ? "ok" : "open")} aria-hidden="true">
                  {item.provided ? <Icon.Check /> : "!"}
                </div>
                <div className="docs-info">
                  <div className="docs-name">
                    {item.label}
                    {item.required && <span className="docs-req">Required</span>}
                  </div>
                  <div className="docs-cat mono">{item.category}</div>
                </div>
                {item.provided ? (
                  <span className="docs-status">Provided</span>
                ) : (
                  <form action={uploadDocument} className="docs-form">
                    <input type="hidden" name="client_id" value={checklist.clientId} />
                    <input type="hidden" name="case_id" value={checklist.caseId} />
                    <input type="hidden" name="checklist_item_id" value={item.id} />
                    <input
                      type="file"
                      name="file"
                      required
                      accept="image/*,application/pdf"
                      aria-label={`Upload ${item.label}`}
                    />
                    <button type="submit" className="btn btn-primary btn-tiny">
                      <Icon.Upload /> Upload
                    </button>
                  </form>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
