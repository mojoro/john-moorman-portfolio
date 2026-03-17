"use client"

import { motion } from "framer-motion"

export function PrintButton() {
  return (
    <motion.button
      onClick={() => window.print()}
      className="group relative overflow-hidden rounded-lg border border-accent/40 bg-accent/15 px-5 py-2.5 font-mono text-sm font-medium text-accent transition-colors hover:border-accent/60 print:hidden"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      style={{
        backgroundImage: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)",
        backgroundSize: "200% 100%",
        backgroundRepeat: "no-repeat",
      }}
      onHoverStart={(e) => {
        const el = e.target as HTMLElement
        el.style.animation = "shimmer 1.5s linear infinite"
      }}
      onHoverEnd={(e) => {
        const el = e.target as HTMLElement
        el.style.animation = "none"
      }}
    >
      <span className="flex items-center gap-2">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 6 2 18 2 18 9" />
          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
          <rect x="6" y="14" width="12" height="8" />
        </svg>
        Print / Save PDF
      </span>
    </motion.button>
  )
}
