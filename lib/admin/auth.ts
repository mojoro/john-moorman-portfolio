import { cookies } from "next/headers"
import crypto from "crypto"
import { COOKIE_NAME } from "./constants"
const MAX_AGE = 60 * 60 * 24 * 7 // 7 days

function getSecret(): string {
  const secret = process.env.ADMIN_PASSWORD
  if (!secret) throw new Error("ADMIN_PASSWORD is not set")
  return secret
}

export function verifyPassword(password: string): boolean {
  const expected = getSecret()
  if (password.length !== expected.length) return false
  return crypto.timingSafeEqual(
    Buffer.from(password),
    Buffer.from(expected)
  )
}

export function createSessionToken(): string {
  const token = crypto.randomUUID()
  const signature = crypto
    .createHmac("sha256", getSecret())
    .update(token)
    .digest("hex")
  return `${token}.${signature}`
}

export function verifySessionToken(cookie: string): boolean {
  const dotIndex = cookie.lastIndexOf(".")
  if (dotIndex === -1) return false
  const token = cookie.slice(0, dotIndex)
  const signature = cookie.slice(dotIndex + 1)
  const expected = crypto
    .createHmac("sha256", getSecret())
    .update(token)
    .digest("hex")
  if (signature.length !== expected.length) return false
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  )
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: MAX_AGE,
    path: "/",
  })
}

export async function clearSessionCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return false
  try {
    return verifySessionToken(token)
  } catch {
    return false
  }
}
