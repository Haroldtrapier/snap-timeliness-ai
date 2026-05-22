"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getOwnedClient, getOrCreateActiveCase } from "@/lib/db/cases";
import { insertDocument, deleteDocument, BUCKET } from "@/lib/db/documents";
import { logAudit } from "@/lib/db/audit";

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/pdf",
]);

const ChecklistItemSchema = z.string().uuid().optional().nullable();

export async function uploadDocumentAction(formData: FormData): Promise<{ error?: string; ok?: boolean }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Please choose a file to upload." };
  }
  if (file.size > MAX_BYTES) {
    return { error: "File is too large. Limit is 10 MB." };
  }
  if (!ALLOWED.has(file.type)) {
    return { error: `Unsupported file type: ${file.type || "unknown"}. Use JPG, PNG, HEIC, or PDF.` };
  }

  const checklistItemRaw = formData.get("checklist_item_id");
  const checklistItemParse = ChecklistItemSchema.safeParse(
    typeof checklistItemRaw === "string" && checklistItemRaw ? checklistItemRaw : null
  );
  if (!checklistItemParse.success) return { error: "Invalid checklist item." };
  const checklistItemId = checklistItemParse.data ?? null;

  const client = await getOwnedClient();
  if (!client) return { error: "Set up your profile first via Onboarding." };
  const snapCase = await getOrCreateActiveCase({ clientId: client.id });

  // Storage path: <user_id>/<case_id>/<timestamp>-<safe-filename>
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
  const objectPath = `${user.id}/${snapCase.id}/${Date.now()}-${safeName}`;

  const ab = await file.arrayBuffer();
  const { error: storageErr } = await supabase.storage
    .from(BUCKET)
    .upload(objectPath, ab, {
      contentType: file.type,
      upsert: false,
    });
  if (storageErr) return { error: `Upload failed: ${storageErr.message}` };

  let inserted;
  try {
    inserted = await insertDocument({
      clientId: client.id,
      caseId: snapCase.id,
      checklistItemId,
      storagePath: objectPath,
      originalName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      uploadedBy: user.id,
      status: "uploaded",
    });
  } catch (e) {
    // Best-effort rollback of the uploaded blob.
    await supabase.storage.from(BUCKET).remove([objectPath]);
    return { error: `Saved file but metadata insert failed: ${(e as Error).message}` };
  }

  // If mapped to a checklist item, mark it as uploaded.
  if (checklistItemId) {
    await supabase.from("checklist_items").update({ status: "uploaded" }).eq("id", checklistItemId);
  }

  await logAudit({
    actorUserId: user.id,
    action: "document_upload",
    entityType: "document",
    entityId: inserted.id,
    metadata: {
      mime_type: file.type,
      size_bytes: file.size,
      checklist_item_id: checklistItemId,
    },
  });

  revalidatePath("/documents");
  revalidatePath("/application-checklist");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteDocumentAction(documentId: string): Promise<{ error?: string; ok?: boolean }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  try {
    await deleteDocument(documentId);
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/documents");
  return { ok: true };
}
