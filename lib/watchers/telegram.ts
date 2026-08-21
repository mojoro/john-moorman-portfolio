import type { StoredSighting } from "./types"

/** Telegram rejects anything longer than this, so long digests get chunked. */
export const TELEGRAM_MAX_MESSAGE = 4096

export function isTelegramConfigured(): boolean {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID)
}

/**
 * HTML parse mode, not MarkdownV2. MarkdownV2 requires escaping eighteen
 * different characters anywhere they appear, including inside URLs, and a
 * single missed one fails the whole send. HTML needs three.
 */
export function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

/**
 * Splits on line boundaries so a chunk never lands mid-tag and breaks the HTML
 * parse. A single line longer than the limit is hard-split as a last resort.
 */
export function chunkMessage(text: string, limit = TELEGRAM_MAX_MESSAGE): string[] {
  if (text.length <= limit) return text ? [text] : []

  const chunks: string[] = []
  let current = ""

  const push = () => {
    if (current) chunks.push(current)
    current = ""
  }

  for (const line of text.split("\n")) {
    let remaining = line
    while (remaining.length > limit) {
      push()
      chunks.push(remaining.slice(0, limit))
      remaining = remaining.slice(limit)
    }

    const candidate = current ? `${current}\n${remaining}` : remaining
    if (candidate.length > limit) {
      push()
      current = remaining
    } else {
      current = candidate
    }
  }

  push()
  return chunks
}

/** Throws on any failure so the caller can leave `notified_at` unset. */
export async function sendMessage(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) {
    throw new Error("TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID must both be set")
  }

  for (const chunk of chunkMessage(text)) {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: chunk,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    })

    if (!response.ok) {
      const detail = await response.text().catch(() => "")
      throw new Error(`Telegram sendMessage failed with HTTP ${response.status}${detail ? `: ${detail.slice(0, 200)}` : ""}`)
    }
  }
}

export function formatSightingsMessage(watcher: string, sightings: StoredSighting[]): string {
  const heading =
    sightings.length === 1
      ? `<b>1 new role</b> on the ${escapeHtml(watcher)} board`
      : `<b>${sightings.length} new roles</b> on the ${escapeHtml(watcher)} board`

  const blocks = sightings.map((sighting) => {
    const lines = [`• <b>${escapeHtml(sighting.title)}</b>`]
    if (sighting.location) lines.push(`  ${escapeHtml(sighting.location)}`)
    if (sighting.matchedReasons.length > 0) {
      lines.push(`  <i>matched: ${escapeHtml(sighting.matchedReasons.join(", "))}</i>`)
    }
    if (sighting.url) lines.push(`  ${escapeHtml(sighting.url)}`)
    return lines.join("\n")
  })

  return [heading, "", ...blocks].join("\n")
}

export function formatBaselineMessage(watcher: string, count: number): string {
  return `<b>${escapeHtml(watcher)}</b> baseline recorded: ${count} matching ${count === 1 ? "role" : "roles"}. Future runs will alert on new ones only.`
}
