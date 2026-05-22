import { NextResponse } from "next/server";
import { z } from "zod";
import { SAFETY } from "@/lib/safety";
import { createClient } from "@/lib/supabase/server";
import { getOwnedClient } from "@/lib/db/cases";
import { insertPrescreen } from "@/lib/db/prescreen";
import { logAudit } from "@/lib/db/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GROSS_130: Record<number, number> = {
  1: 1632, 2: 2215, 3: 2798, 4: 3380, 5: 3963, 6: 4546, 7: 5129, 8: 5712,
};

const Schema = z.object({
  householdSize: z.coerce.number().int().min(1).max(20),
  monthlyIncome: z.coerce.number().min(0).max(1_000_000),
  elderlyOrDisabled: z.coerce.boolean().optional(),
  student: z.coerce.boolean().optional(),
  rent: z.coerce.number().min(0).max(1_000_000).optional(),
  utilities: z.coerce.number().min(0).max(1_000_000).optional(),
  childcare: z.coerce.number().min(0).max(1_000_000).optional(),
  medical: z.coerce.number().min(0).max(1_000_000).optional(),
  persist: z.boolean().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }
    const householdSize = Math.min(8, parsed.data.householdSize);
    const monthlyIncome = parsed.data.monthlyIncome;
    const elderlyOrDisabled = Boolean(parsed.data.elderlyOrDisabled);
    const student = Boolean(parsed.data.student);

    const limit = GROSS_130[householdSize]!;
    let preliminary: "likely" | "possibly" | "unlikely";
    if (monthlyIncome <= limit * 0.9) preliminary = "likely";
    else if (monthlyIncome <= limit * 1.05) preliminary = "possibly";
    else preliminary = "unlikely";
    if (elderlyOrDisabled && preliminary === "unlikely") preliminary = "possibly";

    const notes = [
      `Reference gross income limit for household of ${householdSize}: ~$${limit}/mo (130% FPL).`,
      elderlyOrDisabled ? "Elderly/disabled households use the net income test and may deduct medical expenses over $35." : null,
      student ? "Students 18–49 (half-time+) face restrictions unless an exemption applies." : null,
    ].filter(Boolean) as string[];

    const suggestedNext =
      preliminary === "unlikely"
        ? "Call your county DSS — deductions like shelter and medical can change the picture."
        : "Open your checklist and start gathering documents.";

    // Persist for the authenticated user when possible.
    let persisted = false;
    if (parsed.data.persist !== false) {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const client = await getOwnedClient();
        if (client) {
          try {
            const row = await insertPrescreen({
              clientId: client.id,
              householdSize: parsed.data.householdSize,
              monthlyIncomeCents: Math.round(monthlyIncome * 100),
              elderlyOrDisabled,
              student,
              rentCents: Math.round((parsed.data.rent ?? 0) * 100),
              utilitiesCents: Math.round((parsed.data.utilities ?? 0) * 100),
              childcareCents: Math.round((parsed.data.childcare ?? 0) * 100),
              medicalCents: Math.round((parsed.data.medical ?? 0) * 100),
              preliminary,
              notes: { items: notes },
            });
            persisted = true;
            await logAudit({
              actorUserId: user.id,
              action: "eligibility_prescreen",
              entityType: "eligibility_prescreen",
              entityId: row.id,
              metadata: { preliminary, household_size: parsed.data.householdSize },
            });
          } catch (e) {
            console.error("[prescreen] failed to persist:", (e as Error).message);
          }
        }
      }
    }

    return NextResponse.json({
      preliminary,
      limitReference: limit,
      notes,
      suggestedNext,
      persisted,
      disclaimer: `${SAFETY.notGovernment} ${SAFETY.guidanceOnly}`,
    });
  } catch {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
