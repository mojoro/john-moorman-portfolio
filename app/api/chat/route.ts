import Anthropic from "@anthropic-ai/sdk"
import { checkRateLimit } from "@/lib/ratelimit"
import { sanitizeInput } from "@/lib/sanitize"
import { SYSTEM_PROMPT } from "@/lib/chatbot-prompt"
import { upsertConversation } from "@/lib/db"

export const runtime = "edge"

const MAX_TURNS = 10
const MAX_OUTPUT_TOKENS = 1200

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

  // .create() with stream: true is properly async — throws on auth
  // errors, rate limits, or service outages before we return a Response.
  const stream = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: MAX_OUTPUT_TOKENS,
    system: SYSTEM_PROMPT,
    messages: anthropicMessages,
    stream: true,
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

/** Stream a response via OpenRouter (Gemini fallback). Uses the OpenAI-
 *  compatible SSE endpoint, so no SDK required — just fetch. Throws if
 *  the initial HTTP request fails. */
async function streamGemini(
  messages: ChatMessage[],
  ctx: { sessionId: string; ip: string; trimmedHistory: ChatMessage[]; sanitizedMessage: string }
): Promise<ReadableStream<Uint8Array>> {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      max_tokens: MAX_OUTPUT_TOKENS,
      stream: true,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
    }),
  })

  if (!response.ok || !response.body) {
    throw new Error(`OpenRouter error: ${response.status}`)
  }

  const upstream = response.body.getReader()
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()

  return new ReadableStream({
    async start(controller) {
      let assistantContent = ""
      let buffer = ""
      try {
        while (true) {
          const { done, value } = await upstream.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split("\n")
          buffer = lines.pop() ?? ""
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue
            const payload = line.slice(6).trim()
            if (payload === "[DONE]") continue
            try {
              const chunk = JSON.parse(payload)
              const text: string = chunk.choices?.[0]?.delta?.content ?? ""
              if (text) {
                assistantContent += text
                controller.enqueue(encoder.encode(text))
              }
            } catch {
              // skip malformed SSE chunk
            }
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
    } catch (e) {
      console.error("[chat] Anthropic failed, falling back to Gemini:", e)
    }
  }

  if (process.env.OPENROUTER_API_KEY) {
    try {
      const readable = await streamGemini(allMessages, ctx)
      return new Response(readable, { headers: responseHeaders })
    } catch (e) {
      console.error("[chat] OpenRouter fallback failed:", e)
    }
  }

  return new Response(
    "Chat is temporarily unavailable. Please email john@johnmoorman.com instead.",
    { status: 503 }
  )
}
