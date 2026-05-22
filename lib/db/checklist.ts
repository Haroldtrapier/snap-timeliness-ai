import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { ApplicationChecklist, ChecklistItem } from "./types";

const DEFAULT_ITEMS: Array<Omit<ChecklistItem, "id" | "checklist_id">> = [
  { label: "Photo ID (driver's license or state ID)", required: true, status: "open", category: "Identity", notes: null },
  { label: "Proof of residence (utility bill or lease)", required: true, status: "open", category: "Residence", notes: null },
  { label: "Pay stubs (last 30 days)", required: true, status: "open", category: "Income", notes: null },
  { label: "Tax return (most recent year)", required: false, status: "open", category: "Income", notes: "Helpful for self-employed" },
  { label: "Household member info (DOBs, SSNs)", required: true, status: "open", category: "Household", notes: null },
  { label: "Rent or mortgage statement", required: true, status: "open", category: "Expenses", notes: null },
  { label: "Utility bills (electric, gas, water)", required: false, status: "open", category: "Expenses", notes: null },
  { label: "Childcare receipts", required: false, status: "open", category: "Expenses", notes: "If applicable" },
  { label: "Medical expense records (60+ or disabled only)", required: false, status: "open", category: "Expenses", notes: null },
  { label: "Interview preparation checklist reviewed", required: true, status: "open", category: "Interview", notes: null },
];

export async function getOrCreateChecklist(caseId: string): Promise<{
  checklist: ApplicationChecklist;
  items: ChecklistItem[];
}> {
  const supabase = createClient();
  const { data: existing } = await supabase
    .from("application_checklists")
    .select("*")
    .eq("case_id", caseId)
    .maybeSingle();

  let checklist = existing as ApplicationChecklist | null;
  if (!checklist) {
    const { data, error } = await supabase
      .from("application_checklists")
      .insert({ case_id: caseId })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    checklist = data as ApplicationChecklist;

    const rows = DEFAULT_ITEMS.map((it) => ({
      checklist_id: checklist!.id,
      label: it.label,
      category: it.category,
      required: it.required,
      status: it.status,
      notes: it.notes,
    }));
    const { error: insertErr } = await supabase.from("checklist_items").insert(rows);
    if (insertErr) throw new Error(insertErr.message);
  }

  const { data: items } = await supabase
    .from("checklist_items")
    .select("*")
    .eq("checklist_id", checklist.id)
    .order("category", { ascending: true });

  return { checklist, items: (items as ChecklistItem[] | null) ?? [] };
}

export async function setItemStatus(itemId: string, status: ChecklistItem["status"]): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("checklist_items").update({ status }).eq("id", itemId);
  if (error) throw new Error(error.message);
}
