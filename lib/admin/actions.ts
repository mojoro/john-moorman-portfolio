"use server"

import { redirect } from "next/navigation"
import {
  verifyPassword,
  createSessionToken,
  setSessionCookie,
  clearSessionCookie,
  isAuthenticated,
} from "@/lib/admin/auth"

interface ActionResult {
  success: boolean
  error?: string
}

export async function loginAction(formData: FormData): Promise<ActionResult> {
  const password = formData.get("password") as string | null
  if (!password) return { success: false, error: "Password required." }

  if (!verifyPassword(password)) {
    return { success: false, error: "Invalid password." }
  }

  const token = createSessionToken()
  await setSessionCookie(token)
  redirect("/admin")
}

export async function logoutAction(): Promise<void> {
  await clearSessionCookie()
  redirect("/admin/login")
}

async function requireAuth(): Promise<ActionResult | null> {
  if (!(await isAuthenticated())) {
    return { success: false, error: "Unauthorized" }
  }
  return null
}

// ── Content ──

import fs from "fs/promises"
import path from "path"
import matter from "gray-matter"
import { revalidatePath } from "next/cache"

interface SaveContentInput {
  type: "blog" | "work"
  slug: string
  frontmatter: Record<string, unknown>
  content: string
}

export async function saveContent(input: SaveContentInput): Promise<ActionResult> {
  const authError = await requireAuth()
  if (authError) return authError

  const filePath = path.join(process.cwd(), "content", input.type, `${input.slug}.mdx`)

  try {
    const mdxContent = matter.stringify(input.content, input.frontmatter)
    await fs.writeFile(filePath, mdxContent, "utf-8")
  } catch {
    return { success: false, error: "Failed to write file. Content editing is only available in development." }
  }

  revalidatePath(`/${input.type}/${input.slug}`)
  revalidatePath(`/${input.type}`)
  revalidatePath("/")

  return { success: true }
}

// ── Comments ──

import { deleteComment } from "@/lib/db"

export async function deleteCommentAction(id: number): Promise<ActionResult> {
  const authError = await requireAuth()
  if (authError) return authError

  await deleteComment(id)
  revalidatePath("/admin/comments")
  return { success: true }
}

// ── Chats ──

import { deleteChat } from "@/lib/db"

export async function deleteChatAction(id: string): Promise<ActionResult> {
  const authError = await requireAuth()
  if (authError) return authError

  await deleteChat(id)
  revalidatePath("/admin/chats")
  return { success: true }
}

// ── Chatbot Prompt ──

export async function savePrompt(content: string): Promise<ActionResult> {
  const authError = await requireAuth()
  if (authError) return authError

  const filePath = path.join(process.cwd(), "lib", "chatbot-prompt.ts")

  try {
    const fileContent = `export const SYSTEM_PROMPT = ${JSON.stringify(content)}\n`
    await fs.writeFile(filePath, fileContent, "utf-8")
  } catch {
    return { success: false, error: "Failed to write file. Prompt editing is only available in development." }
  }

  revalidatePath("/api/chat")
  return { success: true }
}
