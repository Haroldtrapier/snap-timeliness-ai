"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const BUCKET = "snap-documents";

function safeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(-80) || "upload";
}

// Upload a file for a checklist item: store it in the private bucket under
// <auth_uid>/<client_id>/... (required by the Storage RLS policy), record a
// documents row, and flip the checklist item to 'provided' so readiness rises.
export async function uploadDocument(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!isSupabaseConfigured || session.id === "demo") redirect("/app/documents");

  const file = formData.get("file");
  const clientId = String(formData.get("client_id") ?? "");
  const caseId = String(formData.get("case_id") ?? "") || null;
  const checklistItemId = String(formData.get("checklist_item_id") ?? "") || null;

  if (!(file instanceof File) || file.size === 0 || !clientId) {
    redirect("/app/documents?error=file");
  }

  const supabase = await createSupabaseServerClient();
  const path = `${session.id}/${clientId}/${Date.now()}-${safeName(file.name)}`;

  const { error: uploadErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type || "application/octet-stream", upsert: false });
  if (uploadErr) redirect("/app/documents?error=upload");

  const { error: rowErr } = await supabase.from("documents").insert({
    client_id: clientId,
    case_id: caseId,
    checklist_item_id: checklistItemId,
    storage_path: path,
    original_name: file.name,
    mime_type: file.type || null,
    size_bytes: file.size,
    status: "uploaded",
    uploaded_by: session.id,
  });
  if (rowErr) redirect("/app/documents?error=save");

  if (checklistItemId) {
    await supabase.from("checklist_items").update({ status: "provided" }).eq("id", checklistItemId);
  }

  revalidatePath("/app/documents");
  revalidatePath("/app/applicant");
  redirect("/app/documents?ok=1");
}
