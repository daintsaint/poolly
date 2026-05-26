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
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
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
        aria-label="Ask Poolly AI"
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 50,
          width: 52,
          height: 52,
          background: open ? "var(--b-ink-2)" : "var(--b-gold)",
          border: `1px solid ${open ? "var(--b-rule)" : "var(--b-gold)"}`,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.2s",
          boxShadow: open ? "none" : "0 4px 24px rgba(201,162,79,0.35)",
        }}
      >
        {open ? (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 1l12 12M13 1L1 13" stroke="var(--b-paper-60)" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M2 5h14M2 9h9M2 13h6" stroke="var(--b-ink)" strokeWidth="1.6" strokeLinecap="round"/>
            <circle cx="15" cy="13" r="2.5" fill="var(--b-emerald)"/>
          </svg>
        )}
      </button>

      {/* Chat window */}
      {open && (
        <div
          style={{
            position: "fixed",
            bottom: 88,
            right: 24,
            zIndex: 50,
            width: 360,
            height: 500,
            background: "var(--b-ink-2)",
            border: "1px solid var(--b-rule)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            boxShadow: "0 24px 64px rgba(0,0,0,0.7)",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "14px 16px",
              borderBottom: "1px solid var(--b-rule)",
              background: "var(--b-ink-3)",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                background: "var(--b-gold)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M1 3h10M1 6h7M1 9h5" stroke="var(--b-ink)" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <p
                style={{
                  fontFamily: "var(--font-geist-mono), monospace",
                  fontSize: 11,
                  color: "var(--b-paper)",
                  letterSpacing: "0.10em",
                  textTransform: "uppercase",
                  fontWeight: 700,
                }}
              >
                Ask Poolly
              </p>
              <p
                style={{
                  fontFamily: "var(--font-geist-mono), monospace",
                  fontSize: 9.5,
                  color: "var(--b-emerald)",
                  letterSpacing: "0.08em",
                }}
              >
                ● AI · always on
              </p>
            </div>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {messages.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 8 }}>
                <p
                  style={{
                    fontFamily: "var(--font-newsreader), Georgia, serif",
                    fontSize: 16,
                    fontStyle: "italic",
                    color: "var(--b-paper-60)",
                    lineHeight: 1.5,
                    textAlign: "center",
                    marginBottom: 4,
                  }}
                >
                  Ask me anything about saving on subscriptions.
                </p>
                {STARTERS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    style={{
                      background: "transparent",
                      border: "1px solid var(--b-rule)",
                      color: "var(--b-paper-60)",
                      padding: "9px 12px",
                      textAlign: "left",
                      fontFamily: "var(--font-geist), sans-serif",
                      fontSize: 12,
                      cursor: "pointer",
                      transition: "all 0.15s",
                      lineHeight: 1.4,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "rgba(201,162,79,0.4)";
                      e.currentTarget.style.color = "var(--b-paper)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--b-rule)";
                      e.currentTarget.style.color = "var(--b-paper-60)";
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            ) : (
              messages.map((m, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                  }}
                >
                  <div
                    style={{
                      maxWidth: "85%",
                      padding: "10px 14px",
                      fontSize: 13,
                      lineHeight: 1.55,
                      ...(m.role === "user"
                        ? {
                            background: "var(--b-gold)",
                            color: "var(--b-ink)",
                            fontFamily: "var(--font-geist), sans-serif",
                          }
                        : {
                            background: "var(--b-ink-3)",
                            border: "1px solid var(--b-rule)",
                            color: "var(--b-paper)",
                            fontFamily: "var(--font-geist), sans-serif",
                          }),
                    }}
                  >
                    {m.content || (
                      <span style={{ display: "flex", gap: 4, paddingTop: 2 }}>
                        {[0, 1, 2].map((d) => (
                          <span
                            key={d}
                            style={{
                              width: 5,
                              height: 5,
                              borderRadius: "50%",
                              background: "var(--b-gold)",
                              display: "inline-block",
                              animation: `bounce 1s ease-in-out ${d * 0.15}s infinite`,
                            }}
                          />
                        ))}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div
            style={{
              padding: "12px",
              borderTop: "1px solid var(--b-rule)",
              flexShrink: 0,
              background: "var(--b-ink-3)",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                background: "var(--b-ink-2)",
                border: "1px solid var(--b-rule)",
                padding: "8px 12px",
              }}
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder="Ask anything…"
                disabled={streaming}
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  fontFamily: "var(--font-geist), sans-serif",
                  fontSize: 13,
                  color: "var(--b-paper)",
                }}
              />
              <button
                onClick={() => send()}
                disabled={!input.trim() || streaming}
                style={{
                  width: 28,
                  height: 28,
                  background: input.trim() && !streaming ? "var(--b-gold)" : "transparent",
                  border: `1px solid ${input.trim() && !streaming ? "var(--b-gold)" : "var(--b-rule)"}`,
                  cursor: input.trim() && !streaming ? "pointer" : "not-allowed",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transition: "all 0.15s",
                  opacity: (!input.trim() || streaming) ? 0.4 : 1,
                }}
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M1 5h8M6 2l3 3-3 3" stroke={input.trim() && !streaming ? "var(--b-ink)" : "var(--b-paper)"} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </>
  );
}
