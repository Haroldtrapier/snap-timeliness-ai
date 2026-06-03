"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getApplicantClientId } from "@/lib/repositories";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function addDeadline(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!isSupabaseConfigured || session.id === "demo") redirect("/app/deadlines");

  const type = String(formData.get("type") ?? "").trim() || "Other";
  const description = String(formData.get("description") ?? "").trim() || null;
  const dueDate = String(formData.get("due_at") ?? "").trim();
  if (!dueDate) redirect("/app/deadlines?error=date");

  const due = new Date(dueDate);
  if (Number.isNaN(due.getTime())) redirect("/app/deadlines?error=date");

  const clientId = await getApplicantClientId(session.id);
  if (!clientId) redirect("/app/onboarding");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("deadlines").insert({
    client_id: clientId,
    type,
    description,
    due_at: due.toISOString(),
  });
  if (error) redirect("/app/deadlines?error=save");

  revalidatePath("/app/deadlines");
  revalidatePath("/app/applicant");
  redirect("/app/deadlines?ok=add");
}

export async function resolveDeadline(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!isSupabaseConfigured || session.id === "demo") redirect("/app/deadlines");

  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/app/deadlines");

  const supabase = await createSupabaseServerClient();
  await supabase.from("deadlines").update({ resolved_at: new Date().toISOString() }).eq("id", id);

  revalidatePath("/app/deadlines");
  revalidatePath("/app/applicant");
  redirect("/app/deadlines?ok=done");
}
