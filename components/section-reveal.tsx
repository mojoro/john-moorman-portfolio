"use client"

import { motion, useReducedMotion } from "framer-motion"
import type { ReactNode } from "react"

interface SectionRevealProps {
  children: ReactNode
  className?: string
  delay?: number
}

/**
 * Wraps a section in a fade-up-and-in animation triggered when it enters
 * the viewport. Uses `once: true` so the animation doesn't replay on
 * re-scroll. Respects `prefers-reduced-motion`.
 */
export function SectionReveal({
  children,
  className,
  delay = 0,
}: SectionRevealProps) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
