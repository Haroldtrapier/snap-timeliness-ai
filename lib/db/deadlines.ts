import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Deadline } from "./types";

export async function listDeadlines(clientId: string): Promise<Deadline[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("deadlines")
    .select("*")
    .eq("client_id", clientId)
    .order("due_at", { ascending: true });
  return (data as Deadline[] | null) ?? [];
}

export async function getDeadline(id: string): Promise<Deadline | null> {
  const supabase = createClient();
  const { data } = await supabase.from("deadlines").select("*").eq("id", id).maybeSingle();
  return (data as Deadline | null) ?? null;
}

export async function insertDeadline(args: {
  clientId: string;
  caseId?: string | null;
  type: string;
  dueAt: string;
  description?: string | null;
  relatedNoticeId?: string | null;
  relatedDocumentId?: string | null;
  suggestedNext?: string | null;
}): Promise<Deadline> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("deadlines")
    .insert({
      client_id: args.clientId,
      case_id: args.caseId ?? null,
      type: args.type,
      due_at: args.dueAt,
      description: args.description ?? null,
      related_notice_id: args.relatedNoticeId ?? null,
      related_document_id: args.relatedDocumentId ?? null,
      suggested_next: args.suggestedNext ?? null,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as Deadline;
}

export async function updateDeadline(
  id: string,
  patch: Partial<Pick<Deadline, "type" | "due_at" | "description" | "suggested_next" | "resolved_at">>
): Promise<Deadline> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("deadlines")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as Deadline;
}

export async function deleteDeadline(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("deadlines").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
