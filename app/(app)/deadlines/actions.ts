"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getOwnedClient, getOrCreateActiveCase } from "@/lib/db/cases";
import { insertDeadline, updateDeadline, deleteDeadline } from "@/lib/db/deadlines";
import { logAudit } from "@/lib/db/audit";

const DeadlineSchema = z.object({
  type: z.enum(["interview", "document_due", "recertification", "periodic_report", "change_report", "appeal"]),
  due_at: z.string().min(8),
  description: z.string().max(500).optional(),
  suggested_next: z.string().max(500).optional(),
});

export async function createDeadlineAction(_prev: { error?: string } | undefined, formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const parsed = DeadlineSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const client = await getOwnedClient();
  if (!client) return { error: "Set up your profile first via Onboarding." };
  const snapCase = await getOrCreateActiveCase({ clientId: client.id });

  const due = new Date(parsed.data.due_at);
  if (Number.isNaN(due.getTime())) return { error: "Invalid due date." };

  const row = await insertDeadline({
    clientId: client.id,
    caseId: snapCase.id,
    type: parsed.data.type,
    dueAt: due.toISOString(),
    description: parsed.data.description ?? null,
    suggestedNext: parsed.data.suggested_next ?? null,
  });

  await logAudit({
    actorUserId: user.id,
    action: "deadline_create",
    entityType: "deadline",
    entityId: row.id,
    metadata: { type: parsed.data.type, due_at: due.toISOString() },
  });

  revalidatePath("/deadlines");
  revalidatePath("/dashboard");
  return { ok: true };
}

const UpdateSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(["interview", "document_due", "recertification", "periodic_report", "change_report", "appeal"]),
  due_at: z.string().min(8),
  description: z.string().max(500).optional(),
  suggested_next: z.string().max(500).optional(),
});

export async function updateDeadlineAction(_prev: { error?: string } | undefined, formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const parsed = UpdateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const due = new Date(parsed.data.due_at);
  if (Number.isNaN(due.getTime())) return { error: "Invalid due date." };

  await updateDeadline(parsed.data.id, {
    type: parsed.data.type,
    due_at: due.toISOString(),
    description: parsed.data.description ?? null,
    suggested_next: parsed.data.suggested_next ?? null,
  });

  await logAudit({
    actorUserId: user.id,
    action: "deadline_update",
    entityType: "deadline",
    entityId: parsed.data.id,
  });

  revalidatePath("/deadlines");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteDeadlineAction(formData: FormData): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await deleteDeadline(id);
  await logAudit({
    actorUserId: user.id,
    action: "deadline_delete",
    entityType: "deadline",
    entityId: id,
  });
  revalidatePath("/deadlines");
  revalidatePath("/dashboard");
}
