import Anthropic from "@anthropic-ai/sdk"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { checkRateLimit } from "@/lib/ratelimit"
import { sanitizeInput } from "@/lib/sanitize"
import { SYSTEM_PROMPT } from "@/lib/chatbot-prompt"
import { upsertConversation } from "@/lib/db"

export const runtime = "edge"

const MAX_TURNS = 10
const MAX_OUTPUT_TOKENS = 400

interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

interface ChatRequest {
  message: string
  history: ChatMessage[]
  sessionId: string
  honeypot?: string
  pageLoadedAt?: number
}

// ── Shared helpers ──

/** Persist the completed conversation to Neon. Swallows errors so a DB
 *  failure never breaks the chat response the user already received. */
async function saveConversation(
  sessionId: string,
  ip: string,
  trimmedHistory: ChatMessage[],
  sanitizedMessage: string,
  assistantContent: string
): Promise<void> {
  if (!sessionId || !assistantContent) return
  const fullConversation = [
    ...trimmedHistory,
    { role: "user" as const, content: sanitizedMessage },
    { role: "assistant" as const, content: assistantContent },
  ]
  await upsertConversation(sessionId, ip, fullConversation).catch(() => {})
}

// ── Provider streaming helpers ──

/** Stream a response from Anthropic's Claude API. Throws if the initial
 *  API call fails (bad key, rate limit, service down). */
async function streamAnthropic(
  messages: ChatMessage[],
  ctx: { sessionId: string; ip: string; trimmedHistory: ChatMessage[]; sanitizedMessage: string }
): Promise<ReadableStream<Uint8Array>> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

  const anthropicMessages: Anthropic.MessageParam[] = messages.map((msg) => ({
    role: msg.role as "user" | "assistant",
    content: msg.content,
  }))

  // This await throws on auth errors, rate limits, or service outages —
  // the caller catches it and falls back to Gemini.
  const stream = await client.messages.stream({
    model: "claude-sonnet-4-20250514",
    max_tokens: MAX_OUTPUT_TOKENS,
    system: SYSTEM_PROMPT,
    messages: anthropicMessages,
  })

  const encoder = new TextEncoder()
  return new ReadableStream({
    async start(controller) {
      let assistantContent = ""
      try {
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            assistantContent += event.delta.text
            controller.enqueue(encoder.encode(event.delta.text))
          }
        }
      } catch {
        controller.close()
        return
      }
      await saveConversation(
        ctx.sessionId, ctx.ip, ctx.trimmedHistory, ctx.sanitizedMessage, assistantContent
      )
      controller.close()
    },
  })
}

/** Stream a response from Google's Gemini API. Used as a fallback when
 *  Anthropic is unavailable. Throws on initial connection errors. */
async function streamGemini(
  messages: ChatMessage[],
  ctx: { sessionId: string; ip: string; trimmedHistory: ChatMessage[]; sanitizedMessage: string }
): Promise<ReadableStream<Uint8Array>> {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: SYSTEM_PROMPT,
  })

  // Gemini uses "model" instead of "assistant". History must exclude the
  // latest user message — that goes into sendMessageStream().
  const history = messages.slice(0, -1).map((m) => ({
    role: m.role === "assistant" ? ("model" as const) : ("user" as const),
    parts: [{ text: m.content }],
  }))

  const chat = model.startChat({
    history,
    generationConfig: { maxOutputTokens: MAX_OUTPUT_TOKENS },
  })

  const lastMessage = messages.at(-1)!.content
  const result = await chat.sendMessageStream(lastMessage)

  const encoder = new TextEncoder()
  return new ReadableStream({
    async start(controller) {
      let assistantContent = ""
      try {
        for await (const chunk of result.stream) {
          const text = chunk.text()
          assistantContent += text
          controller.enqueue(encoder.encode(text))
        }
      } catch {
        controller.close()
        return
      }
      await saveConversation(
        ctx.sessionId, ctx.ip, ctx.trimmedHistory, ctx.sanitizedMessage, assistantContent
      )
      controller.close()
    },
  })
}

// ── Route handler ──

export async function POST(request: Request) {
  // ── Layer 7: origin check ──
  const origin = request.headers.get("origin")
  const allowedOrigin = process.env.ALLOWED_ORIGIN
  if (allowedOrigin && origin && origin !== allowedOrigin) {
    return new Response("Forbidden", { status: 403 })
  }

  let body: ChatRequest
  try {
    body = await request.json()
  } catch {
    return new Response("Invalid request body", { status: 400 })
  }

  const { message, history = [], sessionId, honeypot, pageLoadedAt } = body

  // ── Layer 5a: honeypot ──
  if (honeypot) {
    return Response.json({ message: "Thanks!" }, { status: 200 })
  }

  // ── Layer 5b: timing-based bot detection ──
  if (pageLoadedAt && Date.now() - pageLoadedAt < 500) {
    return Response.json({ message: "Thanks!" }, { status: 200 })
  }

  if (!message || typeof message !== "string") {
    return new Response("Message is required", { status: 400 })
  }

  // ── Layer 1: rate limiting ──
  const ip = request.headers.get("x-forwarded-for") ?? "anonymous"
  const { allowed } = await checkRateLimit(ip)
  if (!allowed) {
    return new Response("Rate limit exceeded. Try again later.", {
      status: 429,
    })
  }

  // ── Layer 2: input sanitization + token cap ──
  const sanitizedMessage = sanitizeInput(message)
  if (!sanitizedMessage) {
    return new Response("Message is empty after sanitization", { status: 400 })
  }

  // ── Layer 3: conversation length limit ──
  const trimmedHistory = history.slice(-(MAX_TURNS * 2))

  const allMessages: ChatMessage[] = [
    ...trimmedHistory.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    })),
    { role: "user" as const, content: sanitizedMessage },
  ]

  const ctx = { sessionId, ip, trimmedHistory, sanitizedMessage }
  const responseHeaders = {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-cache",
  }

  // Try Anthropic first, fall back to Gemini on any error
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const readable = await streamAnthropic(allMessages, ctx)
      return new Response(readable, { headers: responseHeaders })
    } catch {
      // Anthropic failed — fall through to Gemini
    }
  }

  if (process.env.GOOGLE_AI_API_KEY) {
    try {
      const readable = await streamGemini(allMessages, ctx)
      return new Response(readable, { headers: responseHeaders })
    } catch {
      // Gemini also failed
    }
  }

  return new Response(
    "Chat is temporarily unavailable. Please email john@johnmoorman.com instead.",
    { status: 503 }
  )
}
