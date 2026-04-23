/**
 * Query router for the chat pipeline. A fast, cheap first pass that decides
 * which project posts (by slug) would actually help answer the user's
 * question. The main call then loads only those posts into context.
 *
 * The router is prompted with the site index, which already lives in every
 * chat system prompt, so its cache prefix is stable and we get cache hits
 * on every request within the TTL. Router failures fall back to loading
 * every slug — slow but complete rather than fast but empty.
 */

const ROUTER_MODEL = "anthropic/claude-haiku-4.5"
const ROUTER_MAX_TOKENS = 300
const ROUTER_TIMEOUT_MS = 8_000

function buildRouterSystem(index: string): string {
  return `You are a query router for John Moorman's portfolio chatbot. You read a user's question and decide which project posts would help answer it.

SITE INDEX (one line per project — slug · date · challenge · URL · [tags] — followed by title and one-line description):
${index}

YOUR JOB:
- Return ONLY a JSON object of the form: {"slugs": ["slug1", "slug2"]}
- List every slug whose full content would materially help answer the user's question.
- If the user asks for a broad summary of all projects (e.g. "tell me about your work", "summarize your 10-in-10", "walk me through everything"), list ALL slugs.
- If the user asks about a specific project, technology, or challenge week, list the relevant slugs only.
- If the user asks about John's background, skills, availability, or contact info without referencing any project, return {"slugs": []}.
- If the query is off-topic (greetings, personal questions unrelated to John's work), return {"slugs": []}.
- Only return slugs that appear exactly as written in the SITE INDEX above.
- DO NOT include any explanation, prose, or markdown. Return ONLY the JSON object.`
}

export interface RouterDecision {
  slugs: string[]
  /** For observability: was this the primary model, or did we fall back? */
  source: "router" | "fallback-all" | "fallback-empty"
}

/** Ask a cheap model which project slugs to load for the given query.
 *  Always returns a decision — on failure, errs toward loading everything
 *  so the main call still has the content it needs. */
export async function classifyQuery(
  query: string,
  index: string,
  allSlugsForFallback: string[]
): Promise<RouterDecision> {
  if (!process.env.OPENROUTER_API_KEY) {
    return { slugs: allSlugsForFallback, source: "fallback-all" }
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ROUTER_TIMEOUT_MS)

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: ROUTER_MODEL,
        max_tokens: ROUTER_MAX_TOKENS,
        stream: false,
        messages: [
          {
            role: "system",
            content: [
              {
                type: "text",
                text: buildRouterSystem(index),
                cache_control: { type: "ephemeral" },
              },
            ],
          },
          { role: "user", content: query },
        ],
      }),
    })

    if (!response.ok) {
      throw new Error(`Router HTTP ${response.status}`)
    }

    const json = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>
    }
    const text = json.choices?.[0]?.message?.content?.trim() ?? ""
    const parsed = parseSlugs(text)
    const validSlugs = new Set(allSlugsForFallback)
    const filtered = parsed.filter((s) => validSlugs.has(s))
    return { slugs: filtered, source: "router" }
  } catch (e) {
    console.error("[router] classify failed, loading all slugs:", e)
    return { slugs: allSlugsForFallback, source: "fallback-all" }
  } finally {
    clearTimeout(timer)
  }
}

/** Pull a slug list out of the router's response. Tolerant to fenced code
 *  blocks and prose prefixes — some models can't resist adding a preamble
 *  despite the instruction not to. */
function parseSlugs(text: string): string[] {
  if (!text) return []

  const candidate = extractJsonObject(text)
  if (!candidate) return []

  try {
    const obj = JSON.parse(candidate) as { slugs?: unknown }
    if (!Array.isArray(obj.slugs)) return []
    return obj.slugs.filter((s): s is string => typeof s === "string" && s.length > 0)
  } catch {
    return []
  }
}

function extractJsonObject(text: string): string | null {
  const start = text.indexOf("{")
  if (start < 0) return null
  let depth = 0
  for (let i = start; i < text.length; i++) {
    const c = text[i]
    if (c === "{") depth++
    else if (c === "}") {
      depth--
      if (depth === 0) return text.slice(start, i + 1)
    }
  }
  return null
}
