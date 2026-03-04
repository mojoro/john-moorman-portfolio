import Anthropic from "@anthropic-ai/sdk"
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

  const messages: Anthropic.MessageParam[] = [
    ...trimmedHistory.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    })),
    { role: "user" as const, content: sanitizedMessage },
  ]

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return new Response("Chat is temporarily unavailable.", { status: 503 })
  }

  const client = new Anthropic({ apiKey })

  try {
    const stream = await client.messages.stream({
      model: "claude-sonnet-4-20250514",
      max_tokens: MAX_OUTPUT_TOKENS,
      system: SYSTEM_PROMPT,
      messages,
    })

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
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

        // Write the completed exchange to Neon before closing the stream.
        // The user has already received the full streamed response by this
        // point, so the brief DB write latency is invisible to them.
        if (sessionId && assistantContent) {
          const fullConversation = [
            ...trimmedHistory,
            { role: "user" as const, content: sanitizedMessage },
            { role: "assistant" as const, content: assistantContent },
          ]
          await upsertConversation(sessionId, ip, fullConversation).catch(
            () => {} // DB errors must never break the chat response
          )
        }

        controller.close()
      },
    })

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    })
  } catch (error) {
    if (error instanceof Anthropic.APIError && error.status === 429) {
      return new Response("Service is busy. Please try again in a moment.", {
        status: 429,
      })
    }
    return new Response("Something went wrong. Please try again.", {
      status: 500,
    })
  }
}
