import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { EligibilityPrescreen } from "./types";

export async function insertPrescreen(args: {
  clientId: string;
  householdSize: number;
  monthlyIncomeCents: number;
  elderlyOrDisabled?: boolean;
  student?: boolean;
  rentCents?: number;
  utilitiesCents?: number;
  childcareCents?: number;
  medicalCents?: number;
  preliminary: string;
  notes?: unknown;
}): Promise<EligibilityPrescreen> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("eligibility_prescreens")
    .insert({
      client_id: args.clientId,
      household_size: args.householdSize,
      monthly_income_cents: args.monthlyIncomeCents,
      elderly_or_disabled: args.elderlyOrDisabled ?? false,
      student: args.student ?? false,
      rent_cents: args.rentCents ?? 0,
      utilities_cents: args.utilitiesCents ?? 0,
      childcare_cents: args.childcareCents ?? 0,
      medical_cents: args.medicalCents ?? 0,
      preliminary: args.preliminary,
      notes: args.notes ?? null,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as EligibilityPrescreen;
}

export async function listPrescreens(clientId: string): Promise<EligibilityPrescreen[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("eligibility_prescreens")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  return (data as EligibilityPrescreen[] | null) ?? [];
}
