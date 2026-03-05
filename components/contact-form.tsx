"use client"

import { useState } from "react"

type Status = "idle" | "submitting" | "success" | "error"

export function ContactForm() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [honeypot, setHoneypot] = useState("")
  const [pageLoadedAt] = useState(() => Date.now())
  const [status, setStatus] = useState<Status>("idle")
  const [errorMessage, setErrorMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (status === "submitting") return

    setStatus("submitting")
    setErrorMessage("")

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message, honeypot, pageLoadedAt }),
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `Error ${res.status}`)
      }

      setStatus("success")
      setName("")
      setEmail("")
      setMessage("")
    } catch (err) {
      setStatus("error")
      setErrorMessage(
        err instanceof Error ? err.message : "Something went wrong"
      )
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-lg border border-accent/30 bg-accent/5 px-6 py-8 text-center">
        <p className="font-display text-lg font-semibold text-text-primary">
          Message sent.
        </p>
        <p className="mt-2 text-sm text-text-secondary">
          Thanks for reaching out. I&apos;ll get back to you soon.
        </p>
        <button
          onClick={() => setStatus("idle")}
          className="mt-6 font-mono text-xs text-accent underline decoration-accent/30 underline-offset-2 transition-colors hover:decoration-accent"
        >
          Send another message
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Honeypot: hidden from real users */}
      <input
        name="website"
        tabIndex={-1}
        autoComplete="off"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        className="absolute h-0 w-0 opacity-0"
        aria-hidden="true"
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label
            htmlFor="contact-name"
            className="mb-1.5 block font-mono text-xs text-text-muted"
          >
            Name
          </label>
          <input
            id="contact-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="w-full rounded-lg border border-border bg-bg-surface px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
          />
        </div>
        <div>
          <label
            htmlFor="contact-email"
            className="mb-1.5 block font-mono text-xs text-text-muted"
          >
            Email
          </label>
          <input
            id="contact-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            className="w-full rounded-lg border border-border bg-bg-surface px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="contact-message"
          className="mb-1.5 block font-mono text-xs text-text-muted"
        >
          Message
        </label>
        <textarea
          id="contact-message"
          required
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="What's on your mind?"
          className="w-full resize-none rounded-lg border border-border bg-bg-surface px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
        />
      </div>

      {status === "error" && (
        <p className="text-sm text-red-400">{errorMessage}</p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="rounded border border-accent px-8 py-3 font-mono text-sm text-accent transition-colors hover:bg-accent/10 disabled:opacity-50"
      >
        {status === "submitting" ? "Sending..." : "Send message"}
      </button>
    </form>
  )
}
