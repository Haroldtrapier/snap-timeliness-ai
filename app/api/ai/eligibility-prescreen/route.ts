import { NextResponse } from "next/server";
import { SAFETY } from "@/lib/safety";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GROSS_130: Record<number, number> = {
  1: 1632, 2: 2215, 3: 2798, 4: 3380, 5: 3963, 6: 4546, 7: 5129, 8: 5712,
};

export async function POST(req: Request) {
  try {
    const b = await req.json();
    const householdSize = Math.min(8, Math.max(1, Number(b?.householdSize) || 1));
    const monthlyIncome = Math.max(0, Number(b?.monthlyIncome) || 0);
    const elderlyOrDisabled = Boolean(b?.elderlyOrDisabled);
    const student = Boolean(b?.student);

    const limit = GROSS_130[householdSize];
    let preliminary: "likely" | "possibly" | "unlikely";
    if (monthlyIncome <= limit * 0.9) preliminary = "likely";
    else if (monthlyIncome <= limit * 1.05) preliminary = "possibly";
    else preliminary = "unlikely";
    if (elderlyOrDisabled && preliminary === "unlikely") preliminary = "possibly";

    return NextResponse.json({
      preliminary,
      limitReference: limit,
      notes: [
        `Reference gross income limit for household of ${householdSize}: ~$${limit}/mo (130% FPL).`,
        elderlyOrDisabled ? "Elderly/disabled households use the net income test and may deduct medical expenses over $35." : null,
        student ? "Students 18–49 (half-time+) face restrictions unless an exemption applies." : null,
      ].filter(Boolean),
      suggestedNext:
        preliminary === "unlikely"
          ? "Call your county DSS — deductions like shelter and medical can change the picture."
          : "Open your checklist and start gathering documents.",
      disclaimer: `${SAFETY.notGovernment} ${SAFETY.guidanceOnly}`,
    });
  } catch {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
