"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Caseworker review decision on an uploaded document. Allowed by the
// "documents org review" / "checklist items org review" RLS policies for
// members of the client's organization. AI assists; the caseworker decides.
export async function reviewDocument(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!isSupabaseConfigured || session.id === "demo") redirect("/app/agency/queue");

  const documentId = String(formData.get("document_id") ?? "");
  const checklistItemId = String(formData.get("checklist_item_id") ?? "") || null;
  const decision = String(formData.get("decision") ?? "");
  if (!documentId) redirect("/app/agency/queue");

  const supabase = await createSupabaseServerClient();

  if (decision === "verify") {
    await supabase.from("documents").update({ status: "verified" }).eq("id", documentId);
  } else if (decision === "request") {
    await supabase.from("documents").update({ status: "changes_requested" }).eq("id", documentId);
    // Re-open the checklist item so the applicant is prompted to re-upload.
    if (checklistItemId) {
      await supabase.from("checklist_items").update({ status: "open" }).eq("id", checklistItemId);
    }
  }

  revalidatePath("/app/agency/queue");
  revalidatePath("/app/applicant");
  redirect("/app/agency/queue?reviewed=1");
}
