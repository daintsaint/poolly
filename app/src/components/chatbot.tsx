"use client";

import { useState, useRef, useEffect } from "react";

type Message = { role: "user" | "assistant"; content: string };

const STARTERS = [
  "Cheapest way to get Netflix + Spotify?",
  "Is Poolly safe to use?",
  "Help me cut my $150/mo subscriptions",
  "How does escrow protect me?",
];

export function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  async function send(text?: string) {
    const userText = (text ?? input).trim();
    if (!userText || streaming) return;
    setInput("");

    const newMessages: Message[] = [...messages, { role: "user", content: userText }];
    setMessages(newMessages);
    setStreaming(true);

    let assistantText = "";
    setMessages([...newMessages, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.body) throw new Error("No stream");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.text) {
              assistantText += parsed.text;
              setMessages([...newMessages, { role: "assistant", content: assistantText }]);
            }
          } catch { /* ignore partial JSON */ }
        }
      }
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "Sorry, I'm having trouble connecting. Please try again." }]);
    } finally {
      setStreaming(false);
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all"
        style={{
          background: open ? "rgba(124,58,237,0.9)" : "linear-gradient(135deg,#7c3aed,#6366f1)",
          boxShadow: "0 8px 32px rgba(124,58,237,0.5)",
          border: "1px solid rgba(255,255,255,0.15)",
        }}
        aria-label="Ask Poolly AI"
      >
        {open ? (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M2 2l14 14M16 2L2 16" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d="M3 7h16M3 11h10M3 15h7" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
            <circle cx="18" cy="15" r="3.5" fill="#34d399"/>
          </svg>
        )}
      </button>

      {/* Chat window */}
      {open && (
        <div
          className="fixed bottom-24 right-6 z-50 flex flex-col rounded-3xl overflow-hidden shadow-2xl"
          style={{
            width: "360px",
            height: "500px",
            background: "var(--bg-card)",
            border: "1px solid rgba(124,58,237,0.25)",
            boxShadow: "0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(124,58,237,0.15)",
          }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3.5 shrink-0"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(124,58,237,0.08)" }}>
            <div className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg,#7c3aed,#6366f1)" }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 4h10M2 7h6M2 10h4" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-white">Ask Poolly</p>
              <p className="text-xs" style={{ color: "#34d399" }}>● AI assistant · always on</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 ? (
              <div className="space-y-4 pt-2">
                <p className="text-sm text-center" style={{ color: "var(--text-2)" }}>
                  Ask me anything about saving on subscriptions.
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {STARTERS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="text-left text-xs px-3 py-2.5 rounded-xl transition-all"
                      style={{
                        background: "rgba(124,58,237,0.08)",
                        border: "1px solid rgba(124,58,237,0.2)",
                        color: "#a78bfa",
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className="max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed"
                    style={m.role === "user" ? {
                      background: "linear-gradient(135deg,#7c3aed,#6366f1)",
                      color: "white",
                      borderBottomRightRadius: "6px",
                    } : {
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.07)",
                      color: "var(--text-1)",
                      borderBottomLeftRadius: "6px",
                    }}
                  >
                    {m.content || (
                      <span className="flex gap-1 py-0.5">
                        {[0,1,2].map((d) => (
                          <span key={d} className="w-1.5 h-1.5 rounded-full bg-violet-400"
                            style={{ animation: `bounce 1s ease-in-out ${d * 0.15}s infinite` }}/>
                        ))}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={bottomRef}/>
          </div>

          {/* Input */}
          <div className="px-3 py-3 shrink-0"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex gap-2 items-center rounded-xl px-3 py-2"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder="Ask anything…"
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: "var(--text-1)" }}
                disabled={streaming}
              />
              <button
                onClick={() => send()}
                disabled={!input.trim() || streaming}
                className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0 disabled:opacity-40 transition-all"
                style={{ background: "linear-gradient(135deg,#7c3aed,#6366f1)" }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M1 6h10M7 2l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
