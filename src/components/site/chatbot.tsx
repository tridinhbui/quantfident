"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

type ChatMessage = { id: string; role: "user" | "bot"; text: string };

export function Chatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "m1", role: "bot", text: "Hi! Có câu hỏi về QuantFident Mentorship?" },
  ]);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  function send() {
    const text = input.trim();
    if (!text) return;
    const msg: ChatMessage = { id: Math.random().toString(36).slice(2), role: "user", text };
    setMessages((m) => [...m, msg]);
    setInput("");
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          id: Math.random().toString(36).slice(2),
          role: "bot",
          text:
            "Cảm ơn bạn! Hiện chatbot là bản demo. Vui lòng điền form Apply hoặc email để được tư vấn nhanh.",
        },
      ]);
    }, 500);
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!open && (
        <Button size="icon" className="rounded-full h-12 w-12 shadow-md" onClick={() => setOpen(true)} aria-label="Open chat">
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}
      {open && (
        <div className="w-80 rounded-2xl border bg-background shadow-xl overflow-hidden">
          <div className="p-3 border-b flex items-center justify-between">
            <div className="text-sm font-medium">QuantFident Assistant</div>
            <button onClick={() => setOpen(false)} aria-label="Close">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="h-64 overflow-y-auto p-3 space-y-2 text-sm">
            {messages.map((m) => (
              <div key={m.id} className={m.role === "user" ? "text-right" : "text-left"}>
                <span
                  className={`inline-block rounded-xl px-3 py-2 ${
                    m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                  }`}
                >
                  {m.text}
                </span>
              </div>
            ))}
            <div ref={endRef} />
          </div>
          <div className="p-3 border-t flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhập câu hỏi..."
              className="flex-1 h-9 rounded-md border px-3 bg-background"
            />
            <Button size="icon" onClick={send} aria-label="Send">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

