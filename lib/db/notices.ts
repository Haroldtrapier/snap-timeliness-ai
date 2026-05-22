import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Notice, NoticeExplanation } from "./types";

export async function listNotices(clientId: string): Promise<Notice[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("notices")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  return (data as Notice[] | null) ?? [];
}

export async function getNotice(id: string): Promise<Notice | null> {
  const supabase = createClient();
  const { data } = await supabase.from("notices").select("*").eq("id", id).maybeSingle();
  return (data as Notice | null) ?? null;
}

export async function getNoticeExplanation(noticeId: string): Promise<NoticeExplanation | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("notice_explanations")
    .select("*")
    .eq("notice_id", noticeId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as NoticeExplanation | null) ?? null;
}

export async function insertNotice(args: {
  clientId: string;
  caseId?: string | null;
  title: string;
  agency?: string | null;
  noticeType?: string | null;
  urgency?: string | null;
  receivedAt?: string | null;
  rawText?: string | null;
  storagePath?: string | null;
}): Promise<Notice> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("notices")
    .insert({
      client_id: args.clientId,
      case_id: args.caseId ?? null,
      title: args.title,
      agency: args.agency ?? null,
      notice_type: args.noticeType ?? null,
      urgency: args.urgency ?? "medium",
      received_at: args.receivedAt ?? new Date().toISOString(),
      raw_text: args.rawText ?? null,
      storage_path: args.storagePath ?? null,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as Notice;
}

export async function insertNoticeExplanation(args: {
  noticeId: string;
  summary?: string | null;
  action?: string | null;
  deadline?: string | null;
  urgency?: string | null;
  questions?: unknown;
  model?: string | null;
}): Promise<NoticeExplanation> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("notice_explanations")
    .insert({
      notice_id: args.noticeId,
      summary: args.summary ?? null,
      action: args.action ?? null,
      deadline: args.deadline ?? null,
      urgency: args.urgency ?? null,
      questions: args.questions ?? null,
      model: args.model ?? null,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as NoticeExplanation;
}
