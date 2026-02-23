"use client";

import { useState, useRef, useEffect } from "react";
import { Listing, Evaluation } from "@/lib/types";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ListingChatProps {
  listing: Listing;
  evaluation: Evaluation | null;
}

const SUGGESTED_QUESTIONS = [
  "Quelles questions poser lors d'une visite ?",
  "Est-ce que ca correspond a mes criteres ?",
  "Quels sont les points a verifier en priorite ?",
  "Redige-moi un email de premier contact",
];

export function ListingChat({ listing, evaluation }: ListingChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (text?: string) => {
    const message = text || input.trim();
    if (!message || isLoading) return;

    const newMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: message },
    ];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          listing,
          evaluation,
          conversationHistory: messages,
        }),
      });

      if (!response.ok) throw new Error("Erreur API");

      const data = await response.json();
      setMessages([
        ...newMessages,
        { role: "assistant", content: data.response },
      ]);
    } catch {
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: "Desole, je n'ai pas pu repondre. Verifie ta connexion.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full p-4 bg-gradient-to-r from-[var(--surface)] to-emerald-50/30 border border-[var(--primary)] rounded-xl text-left hover:shadow-md transition-shadow"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[var(--primary)]/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-[var(--foreground)]">
              Poser une question sur cette annonce
            </p>
            <p className="text-sm text-[var(--primary)]">
              L&apos;IA connait les details de cette annonce et tes criteres
            </p>
          </div>
        </div>
      </button>
    );
  }

  return (
    <div className="border border-[var(--border-color)] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[var(--surface)] border-b border-[var(--border-color)]">
        <h3 className="font-semibold text-[var(--foreground)] flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Chat IA
        </h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-[var(--muted)] hover:text-[var(--foreground)]"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="max-h-80 overflow-y-auto p-4 space-y-3 bg-[var(--card-bg)]">
        {messages.length === 0 && (
          <div className="space-y-2">
            <p className="text-sm text-[var(--muted)]">
              Questions suggerees :
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(q)}
                  className="text-xs px-3 py-1.5 bg-[var(--primary)]/10 text-[var(--primary)] rounded-full border border-[var(--primary)]/30 hover:bg-[var(--primary)]/20 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                msg.role === "user"
                  ? "bg-violet-600 text-white"
                  : "bg-[var(--surface)] text-[var(--foreground)]"
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-[var(--surface)] rounded-lg px-4 py-2">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-[var(--muted)] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 bg-[var(--muted)] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 bg-[var(--muted)] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2 p-3 border-t border-[var(--border-color)] bg-[var(--surface)]">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Pose ta question..."
          className="flex-1 px-3 py-2 border border-[var(--border-color)] rounded-md text-sm bg-[var(--input-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          disabled={isLoading}
        />
        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || isLoading}
          className="px-4 py-2 bg-[var(--primary)] text-white rounded-md text-sm hover:bg-[var(--primary-hover)] disabled:opacity-50 transition-colors"
        >
          Envoyer
        </button>
      </div>
    </div>
  );
}
