import { loadEnvConfig } from "@next/env"
loadEnvConfig(process.cwd())

import fs from "fs/promises"
import path from "path"
import matter from "gray-matter"

const CONTENT_DIR = path.join(process.cwd(), "content")
const OUT_PATH = path.join(process.cwd(), "lib", "rag-index.json")
const MODEL = "openai/text-embedding-3-small"
const DIMENSIONS = 512
const MAX_CHUNK_CHARS = 1800

type ContentType = "blog" | "work"

interface ChunkInput {
  id: string
  type: ContentType
  slug: string
  title: string
  date?: string
  heading?: string
  url: string
  text: string
}

interface EmbeddedChunk extends ChunkInput {
  embedding: number[]
}

interface Index {
  model: string
  dimensions: number
  generatedAt: string
  chunks: EmbeddedChunk[]
}

function splitSections(content: string): { heading?: string; body: string }[] {
  const parts: { heading?: string; body: string }[] = []
  let current: { heading?: string; body: string } = { body: "" }
  for (const line of content.split("\n")) {
    const match = line.match(/^##\s+(.+)/)
    if (match) {
      if (current.body.trim()) parts.push(current)
      current = { heading: match[1].trim(), body: "" }
    } else {
      current.body += line + "\n"
    }
  }
  if (current.body.trim()) parts.push(current)
  return parts
}

function splitOversized(text: string, max: number): string[] {
  if (text.length <= max) return [text]
  const paragraphs = text.split(/\n{2,}/)
  const out: string[] = []
  let buf = ""
  for (const p of paragraphs) {
    if ((buf + "\n\n" + p).length > max && buf) {
      out.push(buf.trim())
      buf = p
    } else {
      buf = buf ? `${buf}\n\n${p}` : p
    }
  }
  if (buf.trim()) out.push(buf.trim())
  return out
}

function slugifyHeading(h: string): string {
  return h.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}

async function loadChunks(type: ContentType): Promise<ChunkInput[]> {
  const dir = path.join(CONTENT_DIR, type)
  const files = await fs.readdir(dir).catch(() => [] as string[])
  const chunks: ChunkInput[] = []

  for (const filename of files) {
    if (!filename.endsWith(".mdx") || filename.startsWith("_")) continue
    const slug = filename.replace(/\.mdx$/, "")
    const raw = await fs.readFile(path.join(dir, filename), "utf-8")
    const { data, content } = matter(raw)
    if (data.draft) continue

    const title: string = data.title ?? slug
    const description: string = data.description ?? ""
    const date: string | undefined = typeof data.date === "string" ? data.date : undefined
    const datedLine = date ? `[Published: ${date}]\n` : ""
    const header = `${datedLine}# ${title}${description ? `\n${description}` : ""}\n`
    const url = `/${type}/${slug}`

    const sections = splitSections(content)
    const sectioned = sections.length && sections.some((s) => s.heading)

    if (!sectioned) {
      const text = `${header}\n${content.trim()}`
      for (const part of splitOversized(text, MAX_CHUNK_CHARS)) {
        chunks.push({
          id: `${type}/${slug}`,
          type, slug, title, date, url,
          text: part,
        })
      }
      continue
    }

    for (const section of sections) {
      const body = `${section.heading ? `## ${section.heading}\n\n` : ""}${section.body.trim()}`
      const combined = `${header}\n${body}`
      const parts = splitOversized(combined, MAX_CHUNK_CHARS)
      parts.forEach((part, i) => {
        const headingSlug = section.heading ? `#${slugifyHeading(section.heading)}` : ""
        const partSuffix = parts.length > 1 ? `:${i}` : ""
        chunks.push({
          id: `${type}/${slug}${headingSlug}${partSuffix}`,
          type, slug, title, date,
          heading: section.heading,
          url,
          text: part,
        })
      })
    }
  }
  return chunks
}

async function embedBatch(inputs: string[]): Promise<number[][]> {
  const res = await fetch("https://openrouter.ai/api/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      input: inputs,
      dimensions: DIMENSIONS,
    }),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Embedding request failed ${res.status}: ${body}`)
  }
  const json = (await res.json()) as { data: Array<{ index: number; embedding: number[] }> }
  return [...json.data]
    .sort((a, b) => a.index - b.index)
    .map((d) => d.embedding)
}

async function main() {
  if (!process.env.OPENROUTER_API_KEY) {
    console.error("OPENROUTER_API_KEY is required in .env.local")
    process.exit(1)
  }

  const [blog, work] = await Promise.all([loadChunks("blog"), loadChunks("work")])
  const allChunks = [...blog, ...work]
  console.log(`Loaded ${allChunks.length} chunks (${blog.length} blog, ${work.length} work)`)
  if (!allChunks.length) {
    console.error("No chunks found. Aborting.")
    process.exit(1)
  }

  console.log(`Embedding with ${MODEL} (dim=${DIMENSIONS})...`)
  const embeddings = await embedBatch(allChunks.map((c) => c.text))

  const embedded: EmbeddedChunk[] = allChunks.map((c, i) => ({ ...c, embedding: embeddings[i] }))
  const index: Index = {
    model: MODEL,
    dimensions: DIMENSIONS,
    generatedAt: new Date().toISOString(),
    chunks: embedded,
  }

  await fs.writeFile(OUT_PATH, JSON.stringify(index) + "\n")
  console.log(`Wrote ${embedded.length} chunks to ${path.relative(process.cwd(), OUT_PATH)}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
