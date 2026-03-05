"use client"

import { useState, useEffect, useCallback } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { ThemeToggle } from "./theme-toggle"

const NAV_ITEMS = [
  { number: "01", label: "About",      hash: "about",      page: "/about" },
  { number: "02", label: "Work",       hash: "work",        page: "/work" },
  { number: "03", label: "Experience", hash: "experience",  page: null },
  { number: "04", label: "Blog",       hash: "blog",        page: "/blog" },
  { number: "05", label: "Contact",    hash: "contact",     page: null },
] as const

const SOCIAL_LINKS = [
  {
    label: "GitHub",
    href: "https://github.com/mojoro",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
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
        <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
      </svg>
    ),
  },
  {
    label: "LinkedIn",
    href: "https://linkedin.com/in/john-moorman",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
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
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
        <rect width="4" height="12" x="2" y="9" />
        <circle cx="4" cy="4" r="2" />
      </svg>
    ),
  },
  {
    label: "Email",
    href: "mailto:john@johnmoorman.com",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
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
        <rect width="20" height="16" x="2" y="4" rx="2" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
      </svg>
    ),
  },
] as const

export function Sidebar() {
  const [activeSection, setActiveSection] = useState("")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const isHomePage = pathname === "/"

  // Scroll-spy — only relevant on homepage
  useEffect(() => {
    if (!isHomePage) return

    const sectionIds = NAV_ITEMS.map((item) => item.hash)
    const observers: IntersectionObserver[] = []

    for (const id of sectionIds) {
      const el = document.getElementById(id)
      if (!el) continue

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveSection(id)
        },
        { rootMargin: "-40% 0px -40% 0px" }
      )

      observer.observe(el)
      observers.push(observer)
    }

    return () => {
      for (const observer of observers) observer.disconnect()
    }
  }, [isHomePage])

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [mobileMenuOpen])

  const handleNavClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, hash: string, page: string | null) => {
      e.preventDefault()
      setMobileMenuOpen(false)

      if (isHomePage) {
        // Smooth scroll to section on homepage
        document.getElementById(hash)?.scrollIntoView({ behavior: "smooth" })
      } else if (page) {
        // Navigate to dedicated page
        router.push(page)
      } else {
        // No dedicated page — go home to the section
        router.push(`/#${hash}`)
      }
    },
    [isHomePage, router]
  )

  // Determine active item: scroll-spy on home, pathname match elsewhere
  const isActive = (item: typeof NAV_ITEMS[number]) => {
    if (isHomePage) return activeSection === item.hash
    return item.page !== null && pathname.startsWith(item.page)
  }

  const getHref = (item: typeof NAV_ITEMS[number]) => {
    if (isHomePage) return `#${item.hash}`
    return item.page ?? `/#${item.hash}`
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="fixed left-0 top-0 z-40 hidden h-screen w-60 flex-col justify-between border-r border-border bg-bg px-6 py-10 md:flex"
        aria-label="Main navigation"
      >
        <div>
          <Link
            href="/"
            className="font-mono text-lg font-medium text-accent"
            aria-label="Home"
          >
            JM
          </Link>

          <nav className="mt-16">
            <ul className="flex flex-col gap-6">
              {NAV_ITEMS.map((item) => (
                <li key={item.hash}>
                  <a
                    href={getHref(item)}
                    onClick={(e) => handleNavClick(e, item.hash, item.page)}
                    className="group flex items-center gap-3 text-sm"
                  >
                    <span className="font-mono text-xs text-accent">
                      {item.number}.
                    </span>
                    <span
                      className={`relative transition-colors ${
                        isActive(item)
                          ? "text-text-primary"
                          : "text-text-secondary group-hover:text-text-primary"
                      }`}
                    >
                      {item.label}
                      <span
                        className={`absolute -bottom-1 left-0 h-px w-full bg-accent transition-transform origin-left ${
                          isActive(item)
                            ? "scale-x-100"
                            : "scale-x-0 group-hover:scale-x-100"
                        }`}
                      />
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="flex items-center gap-5">
          {SOCIAL_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target={link.href.startsWith("mailto:") ? undefined : "_blank"}
              rel={
                link.href.startsWith("mailto:")
                  ? undefined
                  : "noopener noreferrer"
              }
              className="text-text-muted transition-colors hover:text-accent"
              aria-label={link.label}
            >
              {link.icon}
            </a>
          ))}
        </div>
      </aside>

      {/* Mobile top bar */}
      <header
        className="fixed left-0 top-0 z-50 flex h-14 w-full items-center justify-between border-b border-border bg-bg/90 px-6 backdrop-blur-sm md:hidden"
        aria-label="Mobile navigation"
      >
        <Link
          href="/"
          className="font-mono text-lg font-medium text-accent"
          aria-label="Home"
        >
          JM
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="relative z-50 flex h-8 w-8 flex-col items-center justify-center gap-1.5"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
          >
            <span className={`h-0.5 w-5 bg-text-primary transition-all ${mobileMenuOpen ? "translate-y-2 rotate-45" : ""}`} />
            <span className={`h-0.5 w-5 bg-text-primary transition-all ${mobileMenuOpen ? "opacity-0" : ""}`} />
            <span className={`h-0.5 w-5 bg-text-primary transition-all ${mobileMenuOpen ? "-translate-y-2 -rotate-45" : ""}`} />
          </button>
        </div>
      </header>

      {/* Desktop theme toggle — fixed top-right */}
      <div className="fixed right-5 top-5 z-50 hidden md:block print:hidden">
        <ThemeToggle />
      </div>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 flex items-start justify-start bg-bg md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          <nav className="w-full">
            <ul className="flex w-full flex-col pt-24">
              {NAV_ITEMS.map((item) => (
                <li key={item.hash} className="w-full">
                  <a
                    href={getHref(item)}
                    onClick={(e) => handleNavClick(e, item.hash, item.page)}
                    className="flex w-full flex-col items-start gap-1 px-6 py-4"
                  >
                    <span className="font-mono text-sm text-accent">
                      {item.number}.
                    </span>
                    <span className="text-2xl text-text-primary">
                      {item.label}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}
    </>
  )
}
