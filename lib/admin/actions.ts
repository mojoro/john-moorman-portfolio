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

interface CreateContentInput {
  type: "blog" | "work"
  slug: string
  title: string
}

export async function createContent(input: CreateContentInput): Promise<ActionResult> {
  const authError = await requireAuth()
  if (authError) return authError

  const slug = input.slug
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")

  if (!slug) return { success: false, error: "Invalid slug." }

  const filePath = path.join(process.cwd(), "content", input.type, `${slug}.mdx`)

  try {
    await fs.access(filePath)
    return { success: false, error: `A ${input.type} post with slug "${slug}" already exists.` }
  } catch {
    // File doesn't exist, good
  }

  const today = new Date().toISOString().slice(0, 10)
  const frontmatter: Record<string, unknown> = {
    title: input.title || "Untitled",
    date: today,
    description: "",
    tags: [],
    draft: true,
  }

  try {
    const mdxContent = matter.stringify("\nYour content here.\n", frontmatter)
    await fs.writeFile(filePath, mdxContent, "utf-8")
  } catch {
    return { success: false, error: "Failed to create file. Only available in development." }
  }

  revalidatePath(`/${input.type}`)
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

// ── Palette ──

export interface PaletteColors {
  dark: Record<string, string>
  light: Record<string, string>
}

export async function savePalette(colors: PaletteColors): Promise<ActionResult> {
  const authError = await requireAuth()
  if (authError) return authError

  const cssPath = path.join(process.cwd(), "app", "globals.css")

  try {
    let css = await fs.readFile(cssPath, "utf-8")

    // Replace :root block values
    for (const [key, value] of Object.entries(colors.dark)) {
      const varName = `--${key}`
      const regex = new RegExp(`(${varName}:\\s*)([^;]+)(;)`)
      css = css.replace(regex, `$1${value}$3`)
    }

    // Replace [data-theme="light"] block values
    for (const [key, value] of Object.entries(colors.light)) {
      const varName = `--${key}`
      // Match inside [data-theme="light"] block specifically
      const lightBlock = css.match(/\[data-theme="light"\]\s*\{([^}]+)\}/)
      if (lightBlock) {
        const updatedBlock = lightBlock[1].replace(
          new RegExp(`(${varName}:\\s*)([^;]+)(;)`),
          `$1${value}$3`
        )
        css = css.replace(lightBlock[1], updatedBlock)
      }
    }

    await fs.writeFile(cssPath, css, "utf-8")
  } catch {
    return { success: false, error: "Failed to write file. Palette editing is only available in development." }
  }

  revalidatePath("/")
  return { success: true }
}
