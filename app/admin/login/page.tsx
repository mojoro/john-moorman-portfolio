"use client"

import { useState } from "react"
import { loginAction } from "@/lib/admin/actions"

export default function AdminLoginPage() {
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    const result = await loginAction(formData)

    if (!result.success) {
      setError(result.error ?? "Login failed.")
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="rounded-lg border border-border bg-bg-surface p-8">
          <p className="font-mono text-xs text-accent">Admin</p>
          <h1 className="mt-2 font-display text-xl font-semibold text-text-primary">
            Sign in
          </h1>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block font-mono text-xs text-text-muted"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoFocus
                className="w-full rounded-lg border border-border bg-bg px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
              />
            </div>

            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded border border-accent px-6 py-2.5 font-mono text-sm text-accent transition-colors hover:bg-accent/10 disabled:opacity-50"
            >
              {submitting ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
