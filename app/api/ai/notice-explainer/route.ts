import { NextResponse } from "next/server";
import { z } from "zod";
import { SAFETY } from "@/lib/safety";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEADLINE_RE = /(\b\d{4}-\d{2}-\d{2}\b|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4})/i;

const Schema = z.object({
  text: z.string().trim().min(10).max(20_000),
});

function detectType(text: string): { type: string; urgency: "low" | "medium" | "high" } {
  const t = text.toLowerCase();
  if (t.includes("interview")) return { type: "interview", urgency: "high" };
  if (t.includes("verification") || t.includes("verify") || t.includes("submit")) return { type: "verification_request", urgency: "high" };
  if (t.includes("approved")) return { type: "approval", urgency: "low" };
  if (t.includes("denied") || t.includes("denial")) return { type: "denial", urgency: "high" };
  if (t.includes("recertif")) return { type: "recert", urgency: "medium" };
  if (t.includes("appeal") || t.includes("hearing")) return { type: "appeal_window", urgency: "high" };
  return { type: "other", urgency: "medium" };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }
    const text = parsed.data.text;

    const { type, urgency } = detectType(text);
    const deadlineMatch = text.match(DEADLINE_RE);
    const deadline = deadlineMatch ? deadlineMatch[0] : null;

    const summaries: Record<string, string> = {
      interview: "Your SNAP interview has been scheduled. Be available at the scheduled time. Missing it can delay or close your case.",
      verification_request: "The agency is asking for additional documents. Submit them before the deadline or your application may be denied for missing information.",
      approval: "Your SNAP benefits have been approved by your state agency. Watch for your EBT card and the start date.",
      denial: "Your application was denied by the agency. You typically have a limited window to request a hearing or fix missing information.",
      recert: "Your recertification window is open. Submit updated income, household, and expense information to keep benefits active.",
      appeal_window: "You have a limited time to request a fair hearing. Read the notice carefully for the exact deadline.",
      other: "Read the notice carefully. If anything is unclear, contact your county SNAP office.",
    };

    return NextResponse.json({
      type,
      urgency,
      deadline,
      summary: summaries[type],
      action:
        type === "verification_request"
          ? "Gather the requested documents and upload them before the deadline."
          : type === "interview"
          ? "Add the interview to your calendar and have documents ready."
          : type === "appeal_window"
          ? "Decide whether to request a hearing. The deadline is short."
          : "Take the action listed in the notice or call your county SNAP office.",
      questions: [
        "Can you confirm what has been received already?",
        "Is there anything else you need from me?",
        "Can the deadline be extended if I have trouble getting a document?",
      ],
      disclaimer: SAFETY.guidanceOnly,
    });
  } catch {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
