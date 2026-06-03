"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getApplicantClientId } from "@/lib/repositories";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { explainNotice, NOTICE_MODEL } from "@/lib/anthropic";

// Save a pasted notice, generate a plain-language explanation (when the
// Anthropic API is configured), and store it. The notice is saved either way.
export async function submitNotice(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!isSupabaseConfigured || session.id === "demo") redirect("/app/notice");

  const title = String(formData.get("title") ?? "").trim() || "SNAP notice";
  const rawText = String(formData.get("raw_text") ?? "").trim();
  if (rawText.length < 20) redirect("/app/notice?error=short");

  const clientId = await getApplicantClientId(session.id);
  if (!clientId) redirect("/app/onboarding");

  const supabase = await createSupabaseServerClient();
  const { data: notice, error } = await supabase
    .from("notices")
    .insert({ client_id: clientId, title, raw_text: rawText })
    .select("id")
    .single();
  if (error || !notice) redirect("/app/notice?error=save");

  const explanation = await explainNotice(rawText);
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
