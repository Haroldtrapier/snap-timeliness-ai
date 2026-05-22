import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { HouseholdMember } from "./types";

export async function listHousehold(clientId: string): Promise<HouseholdMember[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("household_members")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: true });
  return (data as HouseholdMember[] | null) ?? [];
}

export async function addHouseholdMember(args: {
  clientId: string;
  fullName?: string | null;
  relationship?: string | null;
  dateOfBirth?: string | null;
  isMinor?: boolean;
  isElderly?: boolean;
  isDisabled?: boolean;
  isStudent?: boolean;
}): Promise<HouseholdMember> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("household_members")
    .insert({
      client_id: args.clientId,
      full_name: args.fullName ?? null,
      relationship: args.relationship ?? null,
      date_of_birth: args.dateOfBirth ?? null,
      is_minor: args.isMinor ?? false,
      is_elderly: args.isElderly ?? false,
      is_disabled: args.isDisabled ?? false,
      is_student: args.isStudent ?? false,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as HouseholdMember;
}

export async function removeHouseholdMember(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("household_members").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
