"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"

interface Message {
  role: "user" | "assistant"
  content: string
}

const STARTER_QUESTIONS = [
  "What's your most impressive project?",
  "Tell me about your AI experience",
  "Why did you leave opera?",
  "What's your availability?",
]

const MAX_TURNS = 10

export function ChatPanel() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [honeypot, setHoneypot] = useState("")
  const [pageLoadedAt] = useState(() => Date.now())
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const shouldReduceMotion = useReducedMotion()

  const turnCount = messages.filter((m) => m.role === "user").length
  const limitReached = turnCount >= MAX_TURNS

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Focus input when panel opens
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
    }
  }, [open])

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || streaming || limitReached) return

      setError(null)
      const userMessage: Message = { role: "user", content: text }
      const updatedMessages = [...messages, userMessage]
      setMessages(updatedMessages)
      setInput("")
      setStreaming(true)

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            history: messages,
            honeypot,
            pageLoadedAt,
          }),
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(errorText || `Error ${response.status}`)
        }

        if (!response.body) {
          throw new Error("No response body")
        }

        // Stream the response
        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let assistantContent = ""

        setMessages([
          ...updatedMessages,
          { role: "assistant", content: "" },
        ])

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          assistantContent += decoder.decode(value, { stream: true })
          setMessages([
            ...updatedMessages,
            { role: "assistant", content: assistantContent },
          ])
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Something went wrong"
        setError(errorMessage)
        // Remove the user message if the request failed entirely
        if (messages.length === updatedMessages.length - 1) {
          setMessages(messages)
        }
      } finally {
        setStreaming(false)
      }
    },
    [messages, streaming, limitReached, honeypot, pageLoadedAt]
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setOpen(true)}
        className={`fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full border border-accent bg-bg px-5 py-3 font-mono text-sm text-accent shadow-lg transition-colors hover:bg-accent/10 ${
          open ? "hidden" : ""
        }`}
        aria-label="Open chat"
      >
        <ChatIcon />
        Ask me anything
      </button>

      {/* Backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={
              shouldReduceMotion ? { opacity: 0 } : { x: "100%", opacity: 0 }
            }
            animate={{ x: 0, opacity: 1 }}
            exit={
              shouldReduceMotion ? { opacity: 0 } : { x: "100%", opacity: 0 }
            }
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-50 flex flex-col bg-bg md:inset-auto md:bottom-0 md:right-0 md:top-0 md:w-[420px] md:border-l md:border-border"
            role="dialog"
            aria-label="Chat with John's portfolio"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <h2 className="font-display text-lg font-semibold">
                  Ask John
                </h2>
                <p className="text-xs text-text-muted">
                  AI assistant &middot; answers about my experience
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-md p-1.5 text-text-muted transition-colors hover:text-text-primary"
                aria-label="Close chat"
              >
                <CloseIcon />
              </button>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {messages.length === 0 && (
                <div className="space-y-3">
                  <p className="text-sm text-text-secondary">
                    Hi! I&apos;m an AI that can answer questions about John&apos;s
                    experience, skills, and availability. Try one of these:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {STARTER_QUESTIONS.map((q) => (
                      <button
                        key={q}
                        onClick={() => sendMessage(q)}
                        className="rounded-full border border-border px-3 py-1.5 text-left text-xs text-text-secondary transition-colors hover:border-accent hover:text-accent"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`mb-4 ${msg.role === "user" ? "text-right" : ""}`}
                >
                  <div
                    className={`inline-block max-w-[85%] rounded-lg px-4 py-2.5 text-sm ${
                      msg.role === "user"
                        ? "bg-accent/15 text-text-primary"
                        : "bg-bg-surface text-text-secondary"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    {msg.role === "assistant" &&
                      msg.content === "" &&
                      streaming && (
                        <span className="inline-block animate-pulse text-text-muted">
                          ...
                        </span>
                      )}
                  </div>
                </div>
              ))}

              {error && (
                <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
                  <p>{error}</p>
                  <p className="mt-1 text-xs text-text-muted">
                    You can reach me directly at{" "}
                    <a
                      href="mailto:john@johnmoorman.com"
                      className="text-accent underline"
                    >
                      john@johnmoorman.com
                    </a>
                  </p>
                </div>
              )}

              {limitReached && (
                <div className="mb-4 rounded-lg bg-bg-surface px-4 py-2.5 text-sm text-text-secondary">
                  <p>
                    Conversation limit reached. Want to continue the
                    conversation?
                  </p>
                  <a
                    href="mailto:john@johnmoorman.com"
                    className="mt-1 inline-block font-mono text-xs text-accent underline"
                  >
                    Email me directly &rarr;
                  </a>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <form
              onSubmit={handleSubmit}
              className="border-t border-border px-5 py-4"
            >
              {/* Layer 5a: honeypot — hidden from real users */}
              <input
                name="website"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                className="absolute h-0 w-0 opacity-0"
                aria-hidden="true"
              />

              <div className="flex gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    limitReached
                      ? "Conversation limit reached"
                      : "Ask me anything..."
                  }
                  disabled={streaming || limitReached}
                  rows={1}
                  className="flex-1 resize-none rounded-lg border border-border bg-bg-surface px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || streaming || limitReached}
                  className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-bg transition-opacity hover:opacity-90 disabled:opacity-40"
                  aria-label="Send message"
                >
                  <SendIcon />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function ChatIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  )
}

function SendIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m22 2-7 20-4-9-9-4z" />
      <path d="m22 2-11 11" />
    </svg>
  )
}
