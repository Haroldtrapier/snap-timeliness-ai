import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { AIConversation } from "./types";

export async function appendConversation(args: {
  userId: string;
  clientId?: string | null;
  surface: "assistant" | "notice" | "document" | "eligibility";
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  model?: string | null;
}): Promise<AIConversation | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("ai_conversations")
    .insert({
      user_id: args.userId,
      client_id: args.clientId ?? null,
      surface: args.surface,
      messages: args.messages,
      model: args.model ?? null,
    })
    .select("*")
    .single();
  if (error) {
    console.error("[conversations] insert failed:", error.message);
    return null;
  }
  return data as AIConversation;
}
