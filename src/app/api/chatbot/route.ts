import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "@/lib/auth-helpers";

const chatbotSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string().min(1),
    }),
  ),
  studentName: z.string().min(1),
  batchName: z.string().min(1),
  subjects: z.array(z.string()).min(1),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
  if (!apiKey) {
    return NextResponse.json(
      { error: "Nova is not configured. Please contact admin." },
      { status: 503 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = chatbotSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const systemPrompt = `You are Nova, the AI study companion for Milestone Coaches — a premium coaching center.
Your mission is to help students learn, understand concepts, and excel academically.
Student: ${parsed.data.studentName} | Batch: ${parsed.data.batchName} | Subjects: ${parsed.data.subjects.join(", ")}.
Personality: warm, encouraging, concise, academically rigorous.
Help with: concept explanations, problem solving, study planning, exam tips, practice questions.
Format responses clearly: use bullet points, numbered steps, bold key terms, code blocks for formulas.
Keep responses focused and not too long unless the topic requires depth.
NEVER discuss: fees, other students, staff details, or anything non-academic.
If asked off-topic: gently say 'I am here only to help with your studies 😊'`;

  const payload = {
    system_instruction: {
      parts: [{ text: systemPrompt }],
    },
    contents: parsed.data.messages.map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.content }],
    })),
    generationConfig: {
      maxOutputTokens: 512,
      temperature: 0.4,
      topP: 0.8,
    },
  };

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  const geminiData = (await response.json().catch(() => null)) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
    error?: { message?: string };
  } | null;

  if (!response.ok || !geminiData) {
    return NextResponse.json(
      { error: geminiData?.error?.message ?? "Nova is temporarily unavailable." },
      { status: 500 },
    );
  }

  const text =
    geminiData.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("")
      .trim() ?? "";

  if (!text) {
    return NextResponse.json(
      { error: "Nova could not generate a response right now." },
      { status: 500 },
    );
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
