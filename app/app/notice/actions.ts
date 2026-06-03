"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getApplicantClientId } from "@/lib/repositories";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { explainNotice, explainNoticeFromFile, NOTICE_MODEL } from "@/lib/anthropic";

const BUCKET = "snap-documents";
const MAX_FILE_BYTES = 8 * 1024 * 1024;

function safeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(-80) || "notice";
}

// Save a notice (pasted text OR an uploaded PDF/image), generate a
// plain-language explanation (when Anthropic is configured), and store it.
export async function submitNotice(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!isSupabaseConfigured || session.id === "demo") redirect("/app/notice");

  const title = String(formData.get("title") ?? "").trim() || "SNAP notice";
  const rawText = String(formData.get("raw_text") ?? "").trim();
  const file = formData.get("file");
  const hasFile = file instanceof File && file.size > 0;

  if (!hasFile && rawText.length < 20) redirect("/app/notice?error=short");

  const clientId = await getApplicantClientId(session.id);
  if (!clientId) redirect("/app/onboarding");

  const supabase = await createSupabaseServerClient();

  let storagePath: string | null = null;
  let explanation = null;

  if (hasFile) {
    const f = file as File;
    if (f.size > MAX_FILE_BYTES) redirect("/app/notice?error=size");
    const mime = f.type || "application/octet-stream";
    if (mime !== "application/pdf" && !mime.startsWith("image/")) {
      redirect("/app/notice?error=type");
    }

    const path = `${session.id}/${clientId}/notice-${Date.now()}-${safeName(f.name)}`;
    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, f, { contentType: mime, upsert: false });
    if (!upErr) storagePath = path;

    const base64 = Buffer.from(await f.arrayBuffer()).toString("base64");
    explanation = await explainNoticeFromFile(base64, mime);
  } else {
    explanation = await explainNotice(rawText);
  }

  const { data: notice, error } = await supabase
    .from("notices")
    .insert({
      client_id: clientId,
      title,
      raw_text: hasFile ? null : rawText,
      storage_path: storagePath,
    })
    .select("id")
    .single();
  if (error || !notice) redirect("/app/notice?error=save");

  if (explanation) {
    let deadlineIso: string | null = null;
    if (explanation.deadline) {
      const d = new Date(explanation.deadline);
      if (!Number.isNaN(d.getTime())) deadlineIso = d.toISOString();
    }
    await supabase.from("notice_explanations").insert({
      notice_id: notice.id,
      summary: explanation.summary,
      action: explanation.action,
      deadline: deadlineIso,
      urgency: explanation.urgency,
      questions: explanation.questions,
      model: NOTICE_MODEL,
    });
  }

  revalidatePath("/app/notice");
  redirect(`/app/notice/${notice.id}`);
}
