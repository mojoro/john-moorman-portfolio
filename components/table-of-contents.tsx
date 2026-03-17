"use client"

import { useEffect, useState } from "react"
import type { TocItem } from "@/lib/toc"

interface Props {
  items: TocItem[]
}

export function TableOfContents({ items }: Props) {
  const [activeId, setActiveId] = useState<string>(items[0]?.id ?? "")

  useEffect(() => {
    if (items.length === 0) return

    const headingEls = items
      .map((item) => document.getElementById(item.id))
      .filter(Boolean) as HTMLElement[]

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .map((e) => e.target.id)

        if (visible.length > 0) {
          const first = items.find((item) => visible.includes(item.id))
          if (first) setActiveId(first.id)
        }
      },
      { rootMargin: "-80px 0px -70% 0px" }
    )

    headingEls.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [items])

  if (items.length === 0) return null

  return (
    <nav
      aria-label="Table of contents"
      className="hidden xl:block w-44 shrink-0"
    >
      <div className="sticky top-24">
        <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted mb-4">
          On this page
        </p>
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              style={{ paddingLeft: item.level === 3 ? "0.75rem" : "0" }}
            >
              <a
                href={`#${item.id}`}
                onClick={(e) => {
                  e.preventDefault()
                  document.getElementById(item.id)?.scrollIntoView({
                    behavior: "smooth",
                  })
                  setActiveId(item.id)
                }}
                className={`block text-xs leading-snug transition-colors hover:text-accent ${
                  activeId === item.id
                    ? "text-accent"
                    : "text-text-muted"
                }`}
              >
                {item.text}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}
