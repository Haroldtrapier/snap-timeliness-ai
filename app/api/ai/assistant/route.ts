import { NextResponse } from "next/server";
import { z } from "zod";
import { SYSTEM_PROMPT, SAFETY } from "@/lib/safety";
import { createClient } from "@/lib/supabase/server";
import { appendConversation } from "@/lib/db/conversations";
import { logAudit } from "@/lib/db/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Msg = { role: "user" | "assistant"; content: string };

const Schema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(8000),
      })
    )
    .min(1)
    .max(40),
});

const BANNED = [
  "approved by ai",
  "denied by ai",
  "fraud decision",
  "guaranteed eligibility",
  "official government determination",
];

function scrub(text: string): string {
  let out = text;
  for (const phrase of BANNED) {
    const re = new RegExp(phrase, "ig");
    out = out.replace(re, "[redacted: use guidance language]");
  }
  return out;
}

function mockReply(userText: string): string {
  const t = userText.toLowerCase();
  if (t.includes("approve") || t.includes("denied") || t.includes("qualify")) {
    return `I can't tell you whether you'll be approved or denied — only your state SNAP agency makes that decision. What I can do is help you prepare:\n\n• Check the eligibility-check page for a preliminary picture\n• Open your checklist and gather the required documents\n• Track interview and document deadlines\n\n${SAFETY.notGovernment}`;
  }
  if (t.includes("interview")) {
    return `Here's how to prepare for the SNAP interview:\n\n• Be available at the scheduled phone number/time\n• Have ID, proof of residence, and the most recent pay stubs nearby\n• Be ready to confirm household members and expenses\n• If you can't make it, call your county DSS as soon as possible to reschedule\n\n${SAFETY.guidanceOnly}`;
  }
  if (t.includes("document") || t.includes("paystub") || t.includes("pay stub")) {
    return `For SNAP, you typically need:\n\n• Photo ID\n• Proof of residence (utility bill or lease)\n• Income verification (pay stubs from the last 30 days)\n• Household member info\n• Expense documentation (rent, utilities, childcare, medical if 60+/disabled)\n\nOpen your checklist for the exact list tailored to your household. ${SAFETY.guidanceOnly}`;
  }
  if (t.includes("recert")) {
    return `Recertification keeps your SNAP active. A few weeks before your window opens, gather updated income, household, and expense info. We'll remind you in your deadlines. ${SAFETY.guidanceOnly}`;
  }
  return `I can help with checklists, documents, notices, deadlines, and recertification. What would you like to look at? ${SAFETY.guidanceOnly}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    const messages: Msg[] = parsed.data.messages;
    const last = messages[messages.length - 1]!;
    if (last.role !== "user") {
      return NextResponse.json({ error: "Last message must be from user" }, { status: 400 });
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    let raw: string;
    let model: string;
    if (anthropicKey) {
      model = "claude-haiku-4-5-20251001";
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model,
          max_tokens: 600,
          system: SYSTEM_PROMPT,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      raw = res.ok ? (await res.json())?.content?.[0]?.text ?? mockReply(last.content) : mockReply(last.content);
    } else if (openaiKey) {
      model = "gpt-4o-mini";
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { authorization: `Bearer ${openaiKey}`, "content-type": "application/json" },
        body: JSON.stringify({
          model,
          messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages.map((m) => ({ role: m.role, content: m.content }))],
          max_tokens: 600,
        }),
      });
      raw = res.ok ? (await res.json())?.choices?.[0]?.message?.content ?? mockReply(last.content) : mockReply(last.content);
    } else {
      model = "mock";
      raw = mockReply(last.content);
    }

    const reply = scrub(raw);

    if (user) {
      const fullThread: Msg[] = [...messages, { role: "assistant", content: reply }];
      const saved = await appendConversation({
        userId: user.id,
        surface: "assistant",
        messages: fullThread,
        model,
      });
      await logAudit({
        actorUserId: user.id,
        action: "assistant_query",
        entityType: "ai_conversation",
        entityId: saved?.id ?? null,
        metadata: { model, message_count: fullThread.length },
      });
    }

    return NextResponse.json({ reply, disclaimer: SAFETY.guidanceOnly });
  } catch (e) {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
