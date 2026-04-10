"use client";

import { useEffect, useState } from "react";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  isStreaming?: boolean;
};

type UseChatbotOptions = {
  userId: string;
  studentName: string;
  batchName: string;
  subjects: string[];
};

function createMessage(role: "user" | "assistant", content: string, isStreaming = false): ChatMessage {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    timestamp: new Date().toISOString(),
    isStreaming,
  };
}

export function useChatbot({
  userId,
  studentName,
  batchName,
  subjects,
}: UseChatbotOptions) {
  const maxContextMessages = 10;
  const storageKey = `nova-chat-${userId}`;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem(storageKey);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as ChatMessage[];
      setMessages(parsed);
    } catch {
      sessionStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  useEffect(() => {
    sessionStorage.setItem(storageKey, JSON.stringify(messages));
  }, [messages, storageKey]);

  const clearChat = () => {
    setMessages([]);
    setError(null);
    sessionStorage.removeItem(storageKey);
  };

  const sendMessage = async (content: string) => {
    const trimmed = content.trim();
    if (!trimmed || isLoading) return;

    setError(null);
    setIsLoading(true);

    const userMessage = createMessage("user", trimmed);
    const assistantMessage = createMessage("assistant", "", true);
    const nextMessages = [...messages, userMessage, assistantMessage];
    setMessages(nextMessages);

    try {
      const response = await fetch("/api/chatbot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: nextMessages
            .filter((message) => !message.isStreaming)
            .slice(-maxContextMessages)
            .map((message) => ({
              role: message.role,
              content: message.content,
            })),
          studentName,
          batchName,
          subjects,
        }),
      });

      if (!response.ok || !response.body) {
        const payload = (await response.json().catch(() => ({ error: "Unable to contact Nova" }))) as {
          error?: string;
        };
        throw new Error(payload.error ?? "Unable to contact Nova");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffered = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffered += decoder.decode(value, { stream: true });
        const events = buffered.split("\n\n");
        buffered = events.pop() ?? "";

        for (const event of events) {
          const dataLine = event.split("\n").find((line) => line.startsWith("data: "));
          if (!dataLine) continue;

          const payload = dataLine.replace(/^data:\s*/, "").trim();
          if (!payload) continue;
          if (payload === "[DONE]") {
            setMessages((current) =>
              current.map((message) =>
                message.id === assistantMessage.id
                  ? { ...message, isStreaming: false }
                  : message,
              ),
            );
            continue;
          }

          const parsed = JSON.parse(payload) as { text?: string };
          if (!parsed.text) continue;

          setMessages((current) =>
            current.map((message) =>
              message.id === assistantMessage.id
                ? {
                    ...message,
                    content: `${message.content}${parsed.text}`,
                  }
                : message,
            ),
          );
        }
      }

      setMessages((current) =>
        current.map((message) =>
          message.id === assistantMessage.id ? { ...message, isStreaming: false } : message,
        ),
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      setMessages((current) => current.filter((message) => message.id !== assistantMessage.id));
    } finally {
      setIsLoading(false);
    }
  };

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearChat,
  };
}
