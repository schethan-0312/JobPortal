"use client";

import { useEffect, useRef, useState } from "react";
import { api, ApiError } from "@/lib/api";

interface ChatMessage {
  role: "user" | "model";
  text: string;
}

export default function AiChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "model", text: "Hi! I'm the JobStock Career Assistant. Ask me about jobs, resumes, interviews, or how to use the platform." },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages, open]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const message = input.trim();
    if (!message || sending) return;

    const history = messages.map((m) => ({ role: m.role, text: m.text }));
    setMessages((prev) => [...prev, { role: "user", text: message }]);
    setInput("");
    setSending(true);

    try {
      const data = await api.post<{ reply: string }>("/chatbot/message", { message, history }, { auth: false });
      setMessages((prev) => [...prev, { role: "model", text: data.reply }]);
    } catch (err) {
      const errMsg = err instanceof ApiError ? err.message : "Sorry, something went wrong. Please try again.";
      setMessages((prev) => [...prev, { role: "model", text: errMsg }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="no-print" style={{ position: "fixed", bottom: 24, right: 24, zIndex: 1050 }}>
      {open && (
        <div
          style={{
            width: 340,
            maxWidth: "90vw",
            height: 460,
            background: "#fff",
            borderRadius: 12,
            boxShadow: "0 8px 30px rgba(0,0,0,0.2)",
            display: "flex",
            flexDirection: "column",
            marginBottom: 12,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              background: "var(--main-color, #5142fc)",
              color: "#fff",
              padding: "12px 16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <strong>JobStock Career Assistant</strong>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              style={{ background: "none", border: "none", color: "#fff", fontSize: 18, cursor: "pointer" }}
            >
              &times;
            </button>
          </div>

          <div ref={bodyRef} style={{ flex: 1, overflowY: "auto", padding: 12, background: "#f7f7fb" }}>
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    maxWidth: "85%",
                    padding: "8px 12px",
                    borderRadius: 10,
                    fontSize: 14,
                    lineHeight: 1.4,
                    background: m.role === "user" ? "var(--main-color, #5142fc)" : "#e9e9f2",
                    color: m.role === "user" ? "#fff" : "#222",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {sending && (
              <div style={{ fontSize: 13, color: "#888", padding: "4px 12px" }}>Typing...</div>
            )}
          </div>

          <form onSubmit={handleSend} style={{ display: "flex", borderTop: "1px solid #eee" }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about jobs, resumes, interviews..."
              style={{ flex: 1, border: "none", padding: "10px 12px", fontSize: 14, outline: "none" }}
              disabled={sending}
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              style={{
                background: "var(--main-color, #5142fc)",
                color: "#fff",
                border: "none",
                padding: "0 16px",
                cursor: "pointer",
              }}
            >
              <i className="fa-solid fa-paper-plane"></i>
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Open career assistant chat"
        style={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "var(--main-color, #5142fc)",
          color: "#fff",
          border: "none",
          boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
          fontSize: 22,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginLeft: "auto",
        }}
      >
        <i className={open ? "fa-solid fa-xmark" : "fa-solid fa-comment-dots"}></i>
      </button>
    </div>
  );
}
