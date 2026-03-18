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

    const OFFSET = 100

    function onScroll() {
      // At bottom of page: activate last heading
      if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 50) {
        setActiveId(items[items.length - 1].id)
        return
      }

      // Find the last heading that has scrolled past the offset
      let current = items[0]?.id ?? ""
      for (const item of items) {
        const el = document.getElementById(item.id)
        if (el && el.getBoundingClientRect().top <= OFFSET) {
          current = item.id
        }
      }
      setActiveId(current)
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    onScroll()

    return () => window.removeEventListener("scroll", onScroll)
  }, [items])

  if (items.length === 0) return null

  return (
    <nav
      aria-label="Table of contents"
      className="hidden 2xl:block absolute top-0 bottom-0 right-[calc(100%+2rem)] w-44"
    >
      <div className="sticky top-24">
        <p className="font-mono text-[11px] uppercase tracking-widest text-text-muted mb-4">
          On this page
        </p>
        <ul className="space-y-3">
          {items.map((item) => {
            const isActive = activeId === item.id
            return (
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
                  className="group flex items-center text-[13px] leading-snug"
                >
                  <span
                    className={`relative transition-colors ${
                      isActive
                        ? "text-text-primary"
                        : "text-text-secondary group-hover:text-text-primary"
                    }`}
                  >
                    {item.text}
                    <span
                      className={`absolute -bottom-0.5 left-0 h-px w-full origin-left bg-accent transition-transform ${
                        isActive
                          ? "scale-x-100"
                          : "scale-x-0 group-hover:scale-x-100"
                      }`}
                    />
                  </span>
                </a>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}
