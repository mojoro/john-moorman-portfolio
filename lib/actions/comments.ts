"use server"

import { insertComment } from "@/lib/db"
import { stripDangerous } from "@/lib/sanitize"
import { revalidatePath } from "next/cache"

const MAX_BODY_LENGTH = 1000
const MAX_NAME_LENGTH = 50

interface ActionResult {
  success: boolean
  error?: string
}

export async function addComment(
  postSlug: string,
  formData: FormData
): Promise<ActionResult> {
  const rawName = formData.get("author") as string | null
  const rawBody = formData.get("body") as string | null
  const token = formData.get("cf-turnstile-response") as string | null

  // Validate Turnstile token
  if (!token) {
    return { success: false, error: "Captcha verification required." }
  }

  const secret = process.env.TURNSTILE_SECRET_KEY
  if (secret) {
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ secret, response: token }),
      }
    )
    const data = await res.json()
    if (!data.success) {
      return { success: false, error: "Captcha verification failed." }
    }
  }

  // Validate body
  if (!rawBody || typeof rawBody !== "string") {
    return { success: false, error: "Comment cannot be empty." }
  }

  const body = stripDangerous(rawBody).slice(0, MAX_BODY_LENGTH)
  if (!body) {
    return { success: false, error: "Comment is empty after sanitization." }
  }

  const author = rawName
    ? stripDangerous(rawName).slice(0, MAX_NAME_LENGTH) || "Anonymous"
    : "Anonymous"

  await insertComment(postSlug, author, body)
  revalidatePath(`/blog/${postSlug}`)

  return { success: true }
}
