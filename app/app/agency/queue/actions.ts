"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Caseworker review decision on an uploaded document. Allowed by the
// "documents org review" / "checklist items org review" RLS policies for
// members of the client's organization. Each decision also writes an
// applicant-visible case note and an append-only audit entry.
// AI assists; the caseworker decides.
export async function reviewDocument(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!isSupabaseConfigured || session.id === "demo") redirect("/app/agency/queue");

  const documentId = String(formData.get("document_id") ?? "");
  const clientId = String(formData.get("client_id") ?? "") || null;
  const checklistItemId = String(formData.get("checklist_item_id") ?? "") || null;
  const label = String(formData.get("label") ?? "document").trim();
  const note = String(formData.get("note") ?? "").trim();
  const decision = String(formData.get("decision") ?? "");
  if (!documentId || (decision !== "verify" && decision !== "request")) {
    redirect("/app/agency/queue");
  }

  const supabase = await createSupabaseServerClient();

  if (decision === "verify") {
    await supabase.from("documents").update({ status: "verified" }).eq("id", documentId);
  } else {
    await supabase.from("documents").update({ status: "changes_requested" }).eq("id", documentId);
    if (checklistItemId) {
      await supabase.from("checklist_items").update({ status: "open" }).eq("id", checklistItemId);
    }
  }

  // Applicant-visible note explaining the decision.
  if (clientId) {
    const body =
      note ||
      (decision === "verify" ? `Verified: ${label}.` : `Please re-upload: ${label}.`);
    await supabase.from("case_notes").insert({
      client_id: clientId,
      author_user_id: session.id,
      body,
      visibility: "applicant_visible",
    });
  }

  // Append-only audit trail.
  await supabase.rpc("log_audit", {
    p_action: decision === "verify" ? "document.verify" : "document.request_changes",
    p_entity_type: "document",
    p_entity_id: documentId,
    p_metadata: { checklist_item_id: checklistItemId, label },
  });

  revalidatePath("/app/agency/queue");
  revalidatePath("/app/applicant");
  revalidatePath("/app/documents");
  redirect("/app/agency/queue?reviewed=1");
}
