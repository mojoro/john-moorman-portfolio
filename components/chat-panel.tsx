"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import Image from "next/image"
import ReactMarkdown from "react-markdown"
import type { Components } from "react-markdown"

const chatMarkdownComponents: Components = {
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="mb-2 list-disc pl-4 space-y-0.5">{children}</ul>,
  ol: ({ children }) => <ol className="mb-2 list-decimal pl-4 space-y-0.5">{children}</ol>,
  li: ({ children }) => <li className="leading-snug">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-text-primary">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  h3: ({ children }) => <h3 className="font-semibold text-text-primary mt-2 mb-1">{children}</h3>,
  h2: ({ children }) => <h2 className="font-semibold text-text-primary mt-3 mb-1">{children}</h2>,
  code: ({ children }) => (
    <code className="font-mono text-xs bg-bg-elevated px-1 py-0.5 rounded">{children}</code>
  ),
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-accent underline">
      {children}
    </a>
  ),
}

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
  const [sessionId] = useState(() => {
    if (typeof window === "undefined") return crypto.randomUUID()
    const stored = localStorage.getItem("chat_session_id")
    if (stored) return stored
    const id = crypto.randomUUID()
    localStorage.setItem("chat_session_id", id)
    return id
  })
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const shouldReduceMotion = useReducedMotion()

  const turnCount = messages.filter((m) => m.role === "user").length
  const limitReached = turnCount >= MAX_TURNS
  const [showGreeting, setShowGreeting] = useState(false)

  // Auto-greeting bubble (once per visitor)
  useEffect(() => {
    if (typeof window === "undefined") return
    if (localStorage.getItem("chatGreetingDismissed")) return
    const timer = setTimeout(() => setShowGreeting(true), 2000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!showGreeting) return
    const dismiss = () => {
      setShowGreeting(false)
      localStorage.setItem("chatGreetingDismissed", "true")
    }
    const scrollHandler = () => dismiss()
    const timer = setTimeout(dismiss, 5000)
    window.addEventListener("scroll", scrollHandler, { once: true })
    return () => {
      clearTimeout(timer)
      window.removeEventListener("scroll", scrollHandler)
    }
  }, [showGreeting])

  // Hydrate messages from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("chat_messages")
      if (stored) {
        const parsed = JSON.parse(stored) as Message[]
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed)
        }
      }
    } catch {
      // Corrupted storage, start fresh
    }
  }, [])

  // Persist messages to localStorage on every update
  useEffect(() => {
    if (messages.length > 0) {
      try {
        localStorage.setItem("chat_messages", JSON.stringify(messages))
      } catch {
        // Storage full or unavailable
      }
    }
  }, [messages])

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
            sessionId,
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

        if (!assistantContent) {
          throw new Error(
            "No response received. The chat may be temporarily unavailable."
          )
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
      {/* Greeting speech bubble */}
      <AnimatePresence>
        {showGreeting && !open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-20 right-6 z-40 max-w-[260px] cursor-pointer rounded-xl rounded-br-sm border border-accent/25 bg-accent/10 px-4 py-3 text-sm text-text-primary shadow-lg print:hidden"
            onClick={() => {
              setShowGreeting(false)
              localStorage.setItem("chatGreetingDismissed", "true")
              setOpen(true)
            }}
          >
            Hi! I&apos;m John&apos;s AI assistant. Ask me anything about his work.
            <span className="mt-1.5 block text-xs text-text-secondary">Click to chat &rarr;</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating avatar trigger */}
      <motion.button
        onClick={() => setOpen(true)}
        className={`fixed bottom-6 right-6 z-40 flex items-center justify-center w-[52px] h-[52px] rounded-full border-2 border-accent/40 bg-bg-surface shadow-lg shadow-black/30 transition-colors hover:border-accent/60 print:hidden ${
          open ? "hidden" : ""
        }`}
        whileHover={shouldReduceMotion ? {} : { scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Open chat with John's AI assistant"
      >
        <Image
          src="/images/chat-avatar.svg"
          alt=""
          width={36}
          height={36}
          className="rounded-full"
        />
        <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-bg bg-accent" />
      </motion.button>

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
                    {msg.role === "user" ? (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <ReactMarkdown components={chatMarkdownComponents}>
                        {msg.content}
                      </ReactMarkdown>
                    )}
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
                    </a>{" "}
                    or on{" "}
                    <a
                      href="https://linkedin.com/in/john-moorman"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent underline"
                    >
                      LinkedIn
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
              {/* Layer 5a: honeypot, hidden from real users */}
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
