import Anthropic from "@anthropic-ai/sdk";

// The notice-explainer LLM call is OPTIONAL. When ANTHROPIC_API_KEY is set the
// app generates a plain-language explanation; when absent the notice is still
// saved and the UI degrades gracefully.
export const isAnthropicConfigured = Boolean(process.env.ANTHROPIC_API_KEY);

export const NOTICE_MODEL = "claude-opus-4-8";

export interface NoticeExplanation {
  summary: string;
  urgency: "high" | "medium" | "low";
  deadline: string | null; // YYYY-MM-DD or null
  action: string;
  questions: string[];
}

// Stable system prompt — cached (prompt caching) so repeated calls reuse the prefix.
const SYSTEM = `You are SNAP AI's notice explainer. You translate confusing government SNAP (food assistance) notices into clear, plain language for the person who received the notice.

Rules:
- Write at about a 6th-grade reading level. Be calm, respectful, and concrete.
- Explain what the notice means, what the person must do, and by when.
- NEVER give legal advice. NEVER tell the person they are approved or denied — only their state SNAP agency decides eligibility.
- If a reply-by or due date is present, extract it; if there is none, return an empty string for the deadline.
- "questions" must be 3 to 5 short, specific questions the person could ask their caseworker.
Return only the requested structured fields.`;

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    summary: { type: "string", description: "2-4 sentence plain-language explanation" },
    urgency: { type: "string", enum: ["high", "medium", "low"] },
    deadline: { type: "string", description: "The reply-by/due date as YYYY-MM-DD, or an empty string if there is none" },
    action: { type: "string", description: "The single most important action the person should take" },
    questions: { type: "array", items: { type: "string" } },
  },
  required: ["summary", "urgency", "deadline", "action", "questions"],
};

// Content blocks for the user turn (text, image, or PDF document).
type UserBlock =
  | { type: "text"; text: string }
  | { type: "image"; source: { type: "base64"; media_type: string; data: string } }
  | { type: "document"; source: { type: "base64"; media_type: "application/pdf"; data: string } };

async function runExplain(content: UserBlock[]): Promise<NoticeExplanation | null> {
  if (!isAnthropicConfigured) return null;
  try {
    const client = new Anthropic();
    // `as` cast bypasses excess-property checks so output_config (structured
    // outputs) is sent even if this SDK version doesn't type it yet.
    const response = await client.messages.create({
      model: NOTICE_MODEL,
      max_tokens: 4000,
      thinking: { type: "adaptive" },
      system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
      output_config: { format: { type: "json_schema", schema: SCHEMA } },
      messages: [{ role: "user", content }],
    } as Anthropic.Messages.MessageCreateParamsNonStreaming);

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") return null;

    const parsed = JSON.parse(textBlock.text) as Partial<NoticeExplanation>;
    const urgency =
      parsed.urgency === "high" || parsed.urgency === "low" ? parsed.urgency : "medium";
    const deadline =
      typeof parsed.deadline === "string" && parsed.deadline.trim() ? parsed.deadline.trim() : null;

    return {
      summary: String(parsed.summary ?? ""),
      urgency,
      deadline,
      action: String(parsed.action ?? ""),
      questions: Array.isArray(parsed.questions) ? parsed.questions.map(String).slice(0, 6) : [],
    };
  } catch {
    return null;
  }
}

export function explainNotice(rawText: string): Promise<NoticeExplanation | null> {
  return runExplain([
    {
      type: "text",
      text: `Explain this SNAP notice for the person who received it.\n\n<notice>\n${rawText.slice(0, 20000)}\n</notice>`,
    },
  ]);
}

// Read an uploaded notice (PDF or image) directly via the model's vision/document support.
export function explainNoticeFromFile(
  base64: string,
  mediaType: string,
): Promise<NoticeExplanation | null> {
  const fileBlock: UserBlock =
    mediaType === "application/pdf"
      ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } }
      : { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } };

  return runExplain([
    fileBlock,
    { type: "text", text: "Read the attached SNAP notice and explain it for the person who received it." },
  ]);
}
