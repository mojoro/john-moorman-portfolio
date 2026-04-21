import indexData from "./rag-index.json"

export interface IndexChunk {
  id: string
  type: "blog" | "work"
  slug: string
  title: string
  date?: string
  heading?: string
  url: string
  text: string
  embedding: number[]
}

interface Index {
  model: string
  dimensions: number
  generatedAt: string
  chunks: IndexChunk[]
}

const index = indexData as unknown as Index

function cosine(a: number[], b: number[]): number {
  let dot = 0
  let na = 0
  let nb = 0
  const len = Math.min(a.length, b.length)
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i]
    na += a[i] * a[i]
    nb += b[i] * b[i]
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb)
  return denom ? dot / denom : 0
}

async function embedQuery(text: string): Promise<number[]> {
  const res = await fetch("https://openrouter.ai/api/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: index.model,
      input: text,
      dimensions: index.dimensions,
    }),
  })
  if (!res.ok) {
    throw new Error(`Embedding request failed: ${res.status}`)
  }
  const json = (await res.json()) as { data: Array<{ embedding: number[] }> }
  return json.data[0].embedding
}

export interface RetrievedChunk {
  chunk: IndexChunk
  score: number
}

export async function retrieveChunks(query: string, k = 5): Promise<RetrievedChunk[]> {
  if (!index.chunks.length) return []
  const qvec = await embedQuery(query)
  return index.chunks
    .map((chunk) => ({ chunk, score: cosine(qvec, chunk.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
}

export function formatContext(results: RetrievedChunk[]): string {
  if (!results.length) return ""
  return results
    .map(({ chunk }, i) => {
      const label = chunk.heading ? `${chunk.title} — ${chunk.heading}` : chunk.title
      const datePart = chunk.date ? ` · ${chunk.date}` : ""
      return `[${i + 1}] ${label}${datePart} (${chunk.url})\n${chunk.text}`
    })
    .join("\n\n---\n\n")
}

/** Chronological roster of every post in the index. Lets the model answer
 *  temporal questions ("most recent", "what did you ship in March") that
 *  pure cosine similarity can't rank. */
export function postTimeline(limit = 20): string {
  const seen = new Map<string, IndexChunk>()
  for (const c of index.chunks) {
    const key = `${c.type}/${c.slug}`
    if (!seen.has(key)) seen.set(key, c)
  }
  return [...seen.values()]
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))
    .slice(0, limit)
    .map((c) => `- ${c.date ?? "unknown"} · ${c.title} (${c.url})`)
    .join("\n")
}
