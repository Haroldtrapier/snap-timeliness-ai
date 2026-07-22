"use server";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { saveProfileAndCompute, type FinancialProfile } from "@/lib/prescreen";

const cents = (formData: FormData, name: string): number => {
  const v = Number.parseFloat(String(formData.get(name) ?? ""));
  return Number.isFinite(v) && v > 0 ? Math.round(v * 100) : 0;
};

const checked = (formData: FormData, name: string): boolean =>
  formData.get(name) === "on" || formData.get(name) === "true";

export async function runPrescreen(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.id === "demo") redirect("/app/prescreen?error=demo");

  const profile: FinancialProfile = {
    hasElderlyOrDisabledMember: checked(formData, "elderly_disabled"),
    earnedIncomeCents: cents(formData, "earned_income"),
    unearnedIncomeCents: cents(formData, "unearned_income"),
    dependentCareCents: cents(formData, "dependent_care"),
    medicalExpensesCents: cents(formData, "medical_expenses"),
    childSupportPaidCents: cents(formData, "child_support"),
    rentMortgageCents: cents(formData, "rent_mortgage"),
    utilitiesCents: cents(formData, "utilities"),
    useStandardUtilityAllowance: checked(formData, "use_sua"),
    liquidResourcesCents: cents(formData, "resources"),
    receivesQualifyingBenefit: checked(formData, "qualifying_benefit"),
  };

  const estimate = await saveProfileAndCompute(session.id, profile);
  if (!estimate) redirect("/app/prescreen?error=save");
  redirect("/app/prescreen?ok=1");
}
