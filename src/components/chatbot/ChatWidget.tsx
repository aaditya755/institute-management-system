"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUp, Sparkles, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import MessageContent from "@/components/chatbot/MessageContent";
import { useChatbot } from "@/hooks/useChatbot";

type ChatWidgetProps = {
  userId: string;
  studentName: string;
  batchName: string;
  subjects: string[];
};

const suggestions = [
  "Explain a concept",
  "Practice questions",
  "Study plan help",
  "Exam strategy",
];

export default function ChatWidget({
  userId,
  studentName,
  batchName,
  subjects,
}: ChatWidgetProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const { messages, isLoading, error, sendMessage, clearChat } = useChatbot({
    userId,
    studentName,
    batchName,
    subjects,
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const canSend = input.trim().length > 0 && !isLoading;
  const characterCount = input.trim().length;

  const typingIndicator = useMemo(
    () => (
      <div className="flex items-center gap-1 px-2 py-1">
        {[0, 1, 2].map((dot) => (
          <span
            key={dot}
            className="h-2 w-2 rounded-full bg-violet-400 animate-bounce-dot"
            style={{ animationDelay: `${dot * 0.15}s` }}
          />
        ))}
      </div>
    ),
    [],
  );

  const submit = async () => {
    const content = input.trim();
    if (!content) return;
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    await sendMessage(content);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-violet-600 text-white shadow-lg shadow-violet-500/25 transition hover:bg-violet-700 md:bottom-6 md:right-6 ${
          open ? "" : "animate-pulse-ring"
        } max-md:bottom-20 max-md:right-4`}
        aria-label={open ? "Close Nova chat" : "Open Nova chat"}
      >
        {open ? <X className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
      </button>

      {open ? (
        <section className="fixed bottom-20 right-6 z-40 flex h-[560px] w-[380px] max-h-[80vh] origin-bottom-right flex-col overflow-hidden rounded-3xl border border-brand-border bg-brand-card shadow-2xl transition max-md:left-3 max-md:right-3 max-md:w-auto">
          <header className="flex h-14 items-center justify-between border-b border-brand-border px-4">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-violet-400" />
              </span>
              <div>
                <p className="font-outfit text-sm font-semibold text-white">Nova</p>
                <p className="text-[11px] text-brand-muted">Study Companion</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button type="button" variant="ghost" size="icon" onClick={clearChat} aria-label="Clear chat">
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button type="button" variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close chat">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-800 text-lg font-semibold text-violet-200">
                  N
                </div>
                <h2 className="mt-4 font-outfit text-xl font-semibold text-white">Hi {studentName}! I&apos;m Nova 👋</h2>
                <p className="mt-2 text-sm text-brand-muted">Ask me anything about your studies.</p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => setInput(suggestion)}
                      className="rounded-full border border-brand-border bg-white/[0.02] px-3 py-2 text-xs text-brand-muted transition hover:border-violet-500 hover:text-white"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {message.role === "assistant" ? (
                    <div className="flex max-w-[85%] gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-800 text-xs font-semibold text-violet-300">
                        N
                      </div>
                      <div className="rounded-2xl rounded-bl-sm border border-brand-border bg-[#1A1A2E] px-4 py-3">
                        {message.content ? <MessageContent content={message.content} /> : typingIndicator}
                      </div>
                    </div>
                  ) : (
                    <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-violet-600 px-4 py-3 text-sm text-white">
                      {message.content}
                    </div>
                  )}
                </div>
              ))
            )}
            {error ? (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            ) : null}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-brand-border">
            <div className="flex items-end gap-3 px-3 py-3">
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={(event) => {
                  setInput(event.target.value);
                  event.target.style.height = "auto";
                  event.target.style.height = `${Math.min(event.target.scrollHeight, 96)}px`;
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void submit();
                  }
                }}
                className="max-h-24 min-h-[44px] flex-1 resize-none bg-transparent px-2 py-2 text-sm text-white outline-none placeholder:text-brand-muted"
                placeholder="Ask Nova anything..."
              />
              <button
                type="button"
                disabled={!canSend}
                onClick={() => void submit()}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-600 text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Send message"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
            </div>
            {characterCount > 200 ? (
              <div className="px-4 pb-2 text-right text-[10px] text-brand-muted">{characterCount} characters</div>
            ) : null}
            <footer className="h-8 border-t border-brand-border px-4 text-center text-[10px] leading-8 text-brand-muted">
              Powered by Gemini · Nova by Milestone Coaches
            </footer>
          </div>
        </section>
      ) : null}
    </>
  );
}
