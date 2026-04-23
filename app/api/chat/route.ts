import { sanitizeInput } from "@/lib/sanitize"
import { SYSTEM_PROMPT } from "@/lib/chatbot-prompt"
import { upsertConversation } from "@/lib/db"
import { siteIndex, loadPosts, allSlugs } from "@/lib/site-context"
import { classifyQuery } from "@/lib/chat-router"
// Rate limiting currently disabled. To re-enable, uncomment the import
// below and the `checkRateLimit` block inside POST().
// import { checkRateLimit } from "@/lib/ratelimit"

export const runtime = "nodejs"

const PRIMARY_MODEL = "anthropic/claude-haiku-4.5"
const FALLBACK_MODEL = "google/gemini-3-flash-preview"
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
  assistantContent: string,
  geo?: { city?: string; country?: string }
): Promise<void> {
  if (!sessionId || !assistantContent) return
  const fullConversation = [
    ...trimmedHistory,
    { role: "user" as const, content: sanitizedMessage },
    { role: "assistant" as const, content: assistantContent },
  ]
  await upsertConversation(sessionId, ip, fullConversation, geo).catch(() => {})
}

// ── Provider streaming helper ──

/** Stream a response via OpenRouter's OpenAI-compatible SSE endpoint.
 *  Works for any model OpenRouter exposes. Throws if the initial HTTP
 *  request fails so callers can fall back to another model.
 *
 *  The system prompt ships as a single content block marked with
 *  `cache_control: ephemeral` so Anthropic caches it for 5 minutes
 *  (90% discount on cached reads). The field is silently ignored by
 *  non-Anthropic providers, so the Gemini fallback still works. */
async function streamOpenRouter(
  model: string,
  systemPrompt: string,
  messages: ChatMessage[],
  ctx: { sessionId: string; ip: string; trimmedHistory: ChatMessage[]; sanitizedMessage: string; geo?: { city?: string; country?: string } }
): Promise<ReadableStream<Uint8Array>> {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: MAX_OUTPUT_TOKENS,
      stream: true,
      messages: [
        {
          role: "system",
          content: [
            { type: "text", text: systemPrompt, cache_control: { type: "ephemeral" } },
          ],
        },
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
        ctx.sessionId, ctx.ip, ctx.trimmedHistory, ctx.sanitizedMessage, assistantContent, ctx.geo
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

  const ip = request.headers.get("x-forwarded-for") ?? "anonymous"

  // ── Layer 1: rate limiting (disabled; re-enable by uncommenting) ──
  // const { allowed } = await checkRateLimit(ip)
  // if (!allowed) {
  //   return new Response("Conversation size limit reached. Please try again later.", {
  //     status: 429,
  //   })
  // }

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

  const geo = {
    city: request.headers.get("x-vercel-ip-city") ?? undefined,
    country: request.headers.get("x-vercel-ip-country") ?? undefined,
  }
  const ctx = { sessionId, ip, trimmedHistory, sanitizedMessage, geo }
  const responseHeaders = {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-cache",
  }

  if (!process.env.OPENROUTER_API_KEY) {
    return new Response(
      "Chat is temporarily unavailable. Please email john@johnmoorman.com instead.",
      { status: 503 }
    )
  }

  // Two-pass retrieval:
  //   1. Always inject the compact site index (title, slug, date, tags per
  //      project). ~2-3K tokens. Cached.
  //   2. Route: ask a cheap Haiku call which project slugs the user's query
  //      actually needs. Returns [] for off-topic / background questions.
  //   3. Load the full text of only those slugs and append as a second
  //      section of the system prompt.
  //
  // Narrow queries ("do you use Rust?", "what food do you like?") finish
  // with ~3-5K tokens of context. Broad queries ("summarize everything")
  // still load everything but only when warranted. Router failures err
  // toward loading every slug so the main call is never context-starved.
  let systemPrompt = SYSTEM_PROMPT
  try {
    const index = await siteIndex()
    const everySlug = await allSlugs()
    const base = `${SYSTEM_PROMPT}\n\n---\n\nSITE INDEX (every project on John's site — one line each — slug · date · challenge · URL · [tags], followed by title and one-line description; always available):\n${index}`

    const decision = await classifyQuery(sanitizedMessage, index, everySlug)
    if (decision.slugs.length) {
      const loaded = await loadPosts(decision.slugs)
      systemPrompt = `${base}\n\n---\n\nLOADED PROJECT CONTENT (full text of the projects most relevant to this query, newest first — use this to answer with real technical detail; cite the URL from each header when directing the user to read more):\n\n${loaded}`
    } else {
      systemPrompt = base
    }
  } catch (e) {
    console.error("[chat] site-context load failed, continuing with bare system prompt:", e)
  }

  // Primary: Claude Haiku 4.5 via OpenRouter. Fallback: Gemini via OpenRouter.
  try {
    const readable = await streamOpenRouter(PRIMARY_MODEL, systemPrompt, allMessages, ctx)
    return new Response(readable, { headers: responseHeaders })
  } catch (e) {
    console.error(`[chat] ${PRIMARY_MODEL} failed, falling back to ${FALLBACK_MODEL}:`, e)
  }

  try {
    const readable = await streamOpenRouter(FALLBACK_MODEL, systemPrompt, allMessages, ctx)
    return new Response(readable, { headers: responseHeaders })
  } catch (e) {
    console.error(`[chat] ${FALLBACK_MODEL} fallback failed:`, e)
  }

  return new Response(
    "Chat is temporarily unavailable. Please email john@johnmoorman.com instead.",
    { status: 503 }
  )
}
