"use client"

import { useRouter, usePathname } from "next/navigation"
import { useEffect, useRef } from "react"

/**
 * After the initial page load settles, eagerly fetches every route on the site
 * into the browser's HTTP cache and Next.js client router cache. This makes
 * subsequent navigations near-instant.
 *
 * Respects Save-Data and slow connections. Skips the current page.
 * Fetches sequentially with a small gap to avoid contention with user requests.
 */
export function PrefetchRoutes({ routes }: { routes: string[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true

    // Respect explicit data-saver preference
    const nav = navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }
    if (nav.connection?.saveData) return
    if (nav.connection?.effectiveType === "slow-2g" || nav.connection?.effectiveType === "2g") return

    // Order: prioritize sibling pages (same depth), then everything else.
    // Always skip the page the user is already on.
    const depth = pathname.split("/").filter(Boolean).length
    const remaining = routes.filter((r) => r !== pathname)
    remaining.sort((a, b) => {
      const ad = Math.abs(a.split("/").filter(Boolean).length - depth)
      const bd = Math.abs(b.split("/").filter(Boolean).length - depth)
      return ad - bd
    })

    let cancelled = false

    async function run() {
      // Wait for the page to fully settle before starting background fetches
      await new Promise<void>((resolve) => {
        if (typeof requestIdleCallback === "function") {
          requestIdleCallback(() => resolve(), { timeout: 3000 })
        } else {
          setTimeout(resolve, 2000)
        }
      })

      for (const route of remaining) {
        if (cancelled) break

        // Prefetch via Next.js router (caches RSC flight payload)
        router.prefetch(route)

        // Also fetch the full HTML into the browser HTTP cache
        try {
          await fetch(route, { priority: "low" } as RequestInit)
        } catch {
          // Network errors are fine to ignore, this is purely optimistic
        }

        // Small gap between fetches so we don't contend with user-initiated requests
        await new Promise((r) => setTimeout(r, 100))
      }
    }

    run()

    return () => {
      cancelled = true
    }
  }, [routes, pathname, router])

  return null
}
