"use client";
import { useState } from "react";
import { Disclaimer } from "@/components/Disclaimer";

type Msg = { role: "user" | "assistant"; content: string };

export default function AssistantPage() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Hi — I'm your SNAP AI assistant. I can help you understand requirements, explain notices, and plan documents. I do not approve or deny benefits — final decisions are made by your state SNAP agency. What can I help with?",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || busy) return;
    const userMsg: Msg = { role: "user", content: input };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMsg] }),
      });
      const data = await res.json();
      setMessages((m) => [...m, { role: "assistant", content: data.reply || data.error || "I couldn't respond. Please try again." }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Network error. Please try again." }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold">SNAP AI assistant</h1>
        <p className="text-sm text-gray-600">Plain-language help with safety disclaimers. For urgent issues, contact your county SNAP office.</p>
      </header>
      <Disclaimer variant="eligibility" />

      <div className="card p-4 space-y-3">
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
              <div className={
                m.role === "user"
                  ? "bg-brand-600 text-white rounded-2xl rounded-br-sm px-3 py-2 max-w-[80%] text-sm"
                  : "bg-gray-100 text-gray-900 rounded-2xl rounded-bl-sm px-3 py-2 max-w-[80%] text-sm whitespace-pre-line"
              }>
                {m.content}
              </div>
            </div>
          ))}
          {busy && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-500 rounded-2xl px-3 py-2 text-sm">Thinking…</div>
            </div>
          )}
        </div>
        <form className="flex gap-2" onSubmit={send}>
          <input
            className="input flex-1"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about documents, notices, deadlines, recertification…"
          />
          <button type="submit" className="btn-primary" disabled={busy}>Send</button>
        </form>
        <p className="text-xs text-gray-500">
          SNAP AI does not provide legal advice or guarantee eligibility. For official or urgent issues, contact your local SNAP office.
        </p>
      </div>
    </div>
  );
}
