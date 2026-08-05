"use server"

import { redirect } from "next/navigation"
import {
  verifyPassword,
  createSessionToken,
  setSessionCookie,
  clearSessionCookie,
  isAuthenticated,
} from "@/lib/admin/auth"

export interface ActionResult {
  success: boolean
  error?: string
  redirectTo?: string
  importedCount?: number
  skippedCount?: number
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
import { revalidatePath, revalidateTag } from "next/cache"

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

import { commentsTag, deleteComment } from "@/lib/db"

export async function deleteCommentAction(id: number): Promise<ActionResult> {
  const authError = await requireAuth()
  if (authError) return authError

  const slug = await deleteComment(id)
  if (slug) {
    revalidateTag(commentsTag(slug))
    revalidatePath(`/blog/${slug}`)
  }
  revalidatePath("/admin/comments")
  return { success: true }
}

// ── Chats ──

import { deleteChat } from "@/lib/db"
import {
  createTimesheetEntry,
  generateInvoice,
  importTimesheetCsv,
  MAX_CSV_BYTES,
  removeInvoice,
  saveClient,
} from "@/lib/invoicing/service"
import { requirePositiveInt, requirePositiveIntArray, ValidationError } from "@/lib/invoicing/validate"

export async function deleteChatAction(id: string): Promise<ActionResult> {
  const authError = await requireAuth()
  if (authError) return authError

  await deleteChat(id)
  revalidatePath("/admin/chats")
  return { success: true }
}

// ── Invoicing ──

/** Absent fields become undefined so the shared validators see a consistent shape. */
function formValue(formData: FormData, key: string): unknown {
  const value = formData.get(key)
  return value === null ? undefined : value
}

export async function addTimesheetEntryAction(formData: FormData): Promise<ActionResult> {
  const authError = await requireAuth()
  if (authError) return authError

  try {
    await createTimesheetEntry({
      workDate: formValue(formData, "workDate"),
      workEndDate: formValue(formData, "workEndDate"),
      hours: formValue(formData, "hours"),
      task: formValue(formData, "task"),
      clientId: formValue(formData, "clientId"),
    })
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to add timesheet entry." }
  }

  revalidatePath("/admin/timesheet")
  return { success: true }
}

export async function importTimesheetCsvAction(formData: FormData): Promise<ActionResult> {
  const authError = await requireAuth()
  if (authError) return authError

  try {
    const clientId = requirePositiveInt(formValue(formData, "clientId"), "clientId")
    const file = formData.get("csvFile")
    let csvText = String(formData.get("csvText") ?? "").trim()

    if (file instanceof File && file.size > 0) {
      if (file.size > MAX_CSV_BYTES) throw new ValidationError("CSV file must be smaller than 1 MB.")
      csvText = await file.text()
    }

    if (!csvText.trim()) throw new ValidationError("Choose a CSV file or paste CSV text to import.")

    const { importedCount, skippedCount } = await importTimesheetCsv(csvText, clientId)

    revalidatePath("/admin/timesheet")
    return { success: true, importedCount, skippedCount }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to import timesheet CSV." }
  }
}

export async function saveClientAction(formData: FormData): Promise<ActionResult> {
  const authError = await requireAuth()
  if (authError) return authError

  try {
    await saveClient({
      id: formValue(formData, "id"),
      name: formValue(formData, "name"),
      invoicePrefix: formValue(formData, "invoicePrefix"),
      billTo: formValue(formData, "billTo"),
      ustId: formValue(formData, "ustId"),
      hourlyRateEur: formValue(formData, "hourlyRateEur"),
    })
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to save client." }
  }

  revalidatePath("/admin/clients")
  revalidatePath("/admin/timesheet")
  return { success: true }
}

export async function generateInvoiceAction(formData: FormData): Promise<ActionResult> {
  const authError = await requireAuth()
  if (authError) return authError

  const rawEntryIds = formData.getAll("entryId")
  if (rawEntryIds.length === 0) return { success: false, error: "Select at least one uninvoiced entry." }

  try {
    const invoice = await generateInvoice(requirePositiveIntArray(rawEntryIds.map(String), "entryId"))

    revalidatePath("/admin/timesheet")
    revalidatePath("/admin/invoices")
    return { success: true, redirectTo: `/admin/invoices#invoice-${invoice.id}` }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to generate invoice." }
  }
}

export async function deleteInvoiceAction(invoiceId: number): Promise<ActionResult> {
  const authError = await requireAuth()
  if (authError) return authError

  try {
    await removeInvoice(requirePositiveInt(invoiceId, "invoiceId"))
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to delete invoice." }
  }

  revalidatePath("/admin/timesheet")
  revalidatePath("/admin/invoices")
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

const VAR_DECL_RE = /(--([\w-]+):\s*)([^;]+)(;)/g
const LIGHT_BLOCK_RE = /\[data-theme="light"\]\s*\{([^}]+)\}/

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

    // Single pass over each block: match any `--var: value;` declaration and
    // replace from the new map. Avoids recompiling a regex per token.
    const replaceVars = (block: string, vars: Record<string, string>) =>
      block.replace(VAR_DECL_RE, (match, prefix: string, name: string, _val: string, suffix: string) => {
        const next = vars[name]
        return next ? `${prefix}${next}${suffix}` : match
      })

    // :root block — outside any [data-theme] block. Replace dark vars there.
    css = replaceVars(css, colors.dark)

    // [data-theme="light"] block.
    const lightBlock = css.match(LIGHT_BLOCK_RE)
    if (lightBlock) {
      const updatedBlock = replaceVars(lightBlock[1], colors.light)
      css = css.replace(lightBlock[1], updatedBlock)
    }

    await fs.writeFile(cssPath, css, "utf-8")
  } catch {
    return { success: false, error: "Failed to write file. Palette editing is only available in development." }
  }

  revalidatePath("/")
  return { success: true }
}
