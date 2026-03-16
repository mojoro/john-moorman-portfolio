import { checkRateLimit } from "@/lib/ratelimit"
import { sanitizeInput } from "@/lib/sanitize"

export const runtime = "edge"

interface ContactRequest {
  name: string
  email: string
  message: string
  honeypot?: string
  pageLoadedAt?: number
}

export async function POST(request: Request) {
  let body: ContactRequest
  try {
    body = await request.json()
  } catch {
    return new Response("Invalid request body", { status: 400 })
  }

  const { name, email, message, honeypot, pageLoadedAt } = body

  // Honeypot: bots fill hidden fields, humans don't
  if (honeypot) {
    return Response.json({ success: true })
  }

  // Timing check: real users take more than 2 seconds to fill a form
  if (pageLoadedAt && Date.now() - pageLoadedAt < 2000) {
    return Response.json({ success: true })
  }

  // Basic validation
  if (!name || !email || !message) {
    return new Response("Name, email, and message are required", { status: 400 })
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return new Response("Invalid email address", { status: 400 })
  }

  // Rate limit by IP
  const ip = request.headers.get("x-forwarded-for") ?? "anonymous"
  const { allowed } = await checkRateLimit(ip)
  if (!allowed) {
    return new Response("Too many requests. Please try again later.", { status: 429 })
  }

  // Sanitize all fields
  const safeName = sanitizeInput(name).slice(0, 100)
  const safeEmail = sanitizeInput(email).slice(0, 200)
  const safeMessage = sanitizeInput(message).slice(0, 2000)

  if (!safeName || !safeEmail || !safeMessage) {
    return new Response("Message is empty after sanitization", { status: 400 })
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    // Resend not configured. Still return success so the form works on Vercel
    // once the env var is added. Silently drop in development.
    console.warn("RESEND_API_KEY not set, contact form submission dropped")
    return Response.json({ success: true })
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Portfolio Contact <noreply@resend.johnmoorman.com>",
        to: "john@johnmoorman.com",
        reply_to: safeEmail,
        subject: `Portfolio contact from ${safeName}`,
        text: `Name: ${safeName}\nEmail: ${safeEmail}\n\n${safeMessage}`,
      }),
    })

    if (!res.ok) {
      throw new Error(`Resend error ${res.status}`)
    }

    return Response.json({ success: true })
  } catch {
    return new Response("Failed to send message. Please try again.", { status: 500 })
  }
}
