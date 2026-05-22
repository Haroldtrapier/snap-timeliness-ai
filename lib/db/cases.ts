import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Client, SnapCase, SnapStage } from "./types";

export async function getOwnedClient(): Promise<Client | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("clients")
    .select("*")
    .eq("owner_user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return (data as Client | null) ?? null;
}

export async function getOrCreateOwnedClient(args: {
  fullName: string;
  state?: string | null;
  county?: string | null;
  language?: string | null;
}): Promise<Client> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const existing = await getOwnedClient();
  if (existing) return existing;

  const { data, error } = await supabase
    .from("clients")
    .insert({
      owner_user_id: user.id,
      full_name: args.fullName,
      state: args.state ?? null,
      county: args.county ?? null,
      language: args.language ?? "en",
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as Client;
}

export async function getActiveCase(clientId: string): Promise<SnapCase | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("snap_cases")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as SnapCase | null) ?? null;
}

export async function getOrCreateActiveCase(args: {
  clientId: string;
  stage?: SnapStage;
  householdSize?: number | null;
  monthlyIncomeCents?: number | null;
}): Promise<SnapCase> {
  const existing = await getActiveCase(args.clientId);
  if (existing) return existing;

  const supabase = createClient();
  const { data, error } = await supabase
    .from("snap_cases")
    .insert({
      client_id: args.clientId,
      stage: args.stage ?? "applying",
      household_size: args.householdSize ?? null,
      monthly_income_cents: args.monthlyIncomeCents ?? null,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as SnapCase;
}

export async function updateCase(
  caseId: string,
  patch: Partial<Pick<SnapCase, "stage" | "household_size" | "monthly_income_cents" | "expedited" | "filed_at" | "decided_at">>
): Promise<SnapCase> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("snap_cases")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", caseId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as SnapCase;
}
