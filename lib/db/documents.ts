import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { DocumentRow } from "./types";

export const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "snap-documents";

export async function listDocuments(clientId: string): Promise<DocumentRow[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("documents")
    .select("*")
    .eq("client_id", clientId)
    .order("uploaded_at", { ascending: false });
  return (data as DocumentRow[] | null) ?? [];
}

export async function getDocument(id: string): Promise<DocumentRow | null> {
  const supabase = createClient();
  const { data } = await supabase.from("documents").select("*").eq("id", id).maybeSingle();
  return (data as DocumentRow | null) ?? null;
}

export async function insertDocument(args: {
  clientId: string;
  caseId?: string | null;
  checklistItemId?: string | null;
  storagePath: string;
  originalName?: string | null;
  mimeType?: string | null;
  sizeBytes?: number | null;
  detectedType?: string | null;
  status?: DocumentRow["status"];
  uploadedBy?: string | null;
}): Promise<DocumentRow> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("documents")
    .insert({
      client_id: args.clientId,
      case_id: args.caseId ?? null,
      checklist_item_id: args.checklistItemId ?? null,
      storage_path: args.storagePath,
      original_name: args.originalName ?? null,
      mime_type: args.mimeType ?? null,
      size_bytes: args.sizeBytes ?? null,
      detected_type: args.detectedType ?? null,
      status: args.status ?? "uploaded",
      uploaded_by: args.uploadedBy ?? null,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as DocumentRow;
}

export async function createSignedDocUrl(storagePath: string, expiresInSeconds = 60): Promise<string | null> {
  const supabase = createClient();
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(storagePath, expiresInSeconds);
  return data?.signedUrl ?? null;
}

export async function deleteDocument(id: string): Promise<void> {
  const supabase = createClient();
  const { data: doc } = await supabase.from("documents").select("storage_path").eq("id", id).maybeSingle();
  if (doc?.storage_path) {
    await supabase.storage.from(BUCKET).remove([doc.storage_path]);
  }
  const { error } = await supabase.from("documents").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
