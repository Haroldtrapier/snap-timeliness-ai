"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getOwnedClient, getOrCreateActiveCase } from "@/lib/db/cases";
import { insertNotice, insertNoticeExplanation } from "@/lib/db/notices";
import { insertDeadline } from "@/lib/db/deadlines";
import { logAudit } from "@/lib/db/audit";

const NoticeSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  agency: z.string().trim().max(200).optional(),
  raw_text: z.string().trim().min(10, "Paste the full notice text."),
});

function getOrigin(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

export async function submitNoticeAction(_prev: { error?: string } | undefined, formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const parsed = NoticeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const client = await getOwnedClient();
  if (!client) return { error: "Set up your profile first via Onboarding." };
  const snapCase = await getOrCreateActiveCase({ clientId: client.id });

  const explainerUrl = `${getOrigin()}/api/ai/notice-explainer`;
  let explanation: {
    type?: string;
    urgency?: string;
    deadline?: string | null;
    summary?: string;
    action?: string;
    questions?: string[];
  } = {};
  try {
    const res = await fetch(explainerUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: parsed.data.raw_text }),
      cache: "no-store",
    });
    if (res.ok) {
      explanation = await res.json();
    }
  } catch {
    // Tolerate AI route failure — we still save the raw notice.
  }

  const fallbackTitle = explanation.type
    ? `${explanation.type.replace(/_/g, " ")} notice`
    : "Notice";

  let notice;
  try {
    notice = await insertNotice({
      clientId: client.id,
      caseId: snapCase.id,
      title: parsed.data.title || fallbackTitle,
      agency: parsed.data.agency || null,
      noticeType: explanation.type ?? null,
      urgency: explanation.urgency ?? "medium",
      receivedAt: new Date().toISOString(),
      rawText: parsed.data.raw_text,
    });
  } catch (e) {
    return { error: `Failed to save notice: ${(e as Error).message}` };
  }

  await insertNoticeExplanation({
    noticeId: notice.id,
    summary: explanation.summary ?? null,
    action: explanation.action ?? null,
    deadline: parseDeadlineToISO(explanation.deadline),
    urgency: explanation.urgency ?? null,
    questions: explanation.questions ?? null,
  });

  // If the explainer detected a deadline, push it into the deadlines table.
  const parsedDeadline = parseDeadlineToISO(explanation.deadline);
  if (parsedDeadline) {
    await insertDeadline({
      clientId: client.id,
      caseId: snapCase.id,
      type: explanation.type === "interview" ? "interview" : "document_due",
      dueAt: parsedDeadline,
      description: explanation.action ?? "Action required from notice",
      relatedNoticeId: notice.id,
      suggestedNext: explanation.action ?? null,
    });
  }

  await logAudit({
    actorUserId: user.id,
    action: "notice_explanation",
    entityType: "notice",
    entityId: notice.id,
    metadata: { detected_type: explanation.type, urgency: explanation.urgency },
  });

  revalidatePath("/notices");
  revalidatePath("/deadlines");
  revalidatePath("/dashboard");
  redirect(`/notices/${notice.id}`);
}

function parseDeadlineToISO(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}
