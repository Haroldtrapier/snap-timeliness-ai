"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { updateOwnProfile } from "@/lib/db/profiles";
import { logAudit } from "@/lib/db/audit";

const Schema = z.object({
  full_name: z.string().min(1).max(120),
  state: z.string().max(80).optional(),
  county: z.string().max(120).optional(),
  language: z.enum(["en", "es"]).default("en"),
});

export async function updateProfileAction(_prev: { error?: string; ok?: boolean } | undefined, formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const parsed = Schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  await updateOwnProfile({
    full_name: parsed.data.full_name,
    state: parsed.data.state ?? null,
    county: parsed.data.county ?? null,
    language: parsed.data.language,
  });

  await logAudit({
    actorUserId: user.id,
    action: "profile_update",
    entityType: "profile",
    entityId: user.id,
  });

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { ok: true };
}
