"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { logoutAction } from "@/lib/admin/actions"

const NAV_LINKS = [
  { label: "Dashboard", href: "/admin" },
  { label: "Content", href: "/admin/content" },
  { label: "Comments", href: "/admin/comments" },
  { label: "Chats", href: "/admin/chats" },
  { label: "Prompt", href: "/admin/prompt" },
] as const

export function AdminNav() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin"
    return pathname.startsWith(href)
  }

  return (
    <nav className="border-b border-border bg-bg-surface">
      <div className="mx-auto flex max-w-[1100px] items-center justify-between px-6 py-3">
        <div className="flex items-center gap-8">
          <Link href="/admin" className="font-mono text-sm font-medium text-accent">
            JM Admin
          </Link>
          <div className="hidden items-center gap-1 sm:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-md px-3 py-1.5 font-mono text-xs transition-colors ${
                  isActive(link.href)
                    ? "bg-accent/10 text-accent"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs text-text-muted transition-colors hover:text-accent"
          >
            View site ↗
          </a>
          <form action={logoutAction}>
            <button
              type="submit"
              className="font-mono text-xs text-text-muted transition-colors hover:text-red-400"
            >
              Log out
            </button>
          </form>
        </div>
      </div>

      {/* Mobile nav */}
      <div className="flex gap-1 overflow-x-auto px-6 pb-2 sm:hidden">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`shrink-0 rounded-md px-3 py-1.5 font-mono text-xs transition-colors ${
              isActive(link.href)
                ? "bg-accent/10 text-accent"
                : "text-text-secondary"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
