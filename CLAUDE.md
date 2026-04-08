# CLAUDE.md — Portfolio Site

## Who I Am

John Moorman — Software Engineer, Berlin. Former operatic performer (Boston Conservatory at Berklee). Self-taught engineer with ~2.5 years professional experience. Freelancing and job hunting for mid-level fullstack/frontend roles at Berlin startups (€50–65K). Primary differentiators: Next.js 15 / TypeScript / React 19 and AI-native development workflow (Anthropic API, Claude Code, Cursor, n8n, Apify).

**Contacts / Links:**
- johnmoorman.com (this site, deployed to Vercel)
- github.com/mojoro
- linkedin.com/in/john-moorman
- john@johnmoorman.com
- +49 176 303 21460

---

## Site Purpose

Make a Berlin startup CTO or hiring manager think "I want this person on my team" within 30 seconds. Three things the site must accomplish:
1. Instantly communicate that I am an AI-native engineer who ships production-quality work
2. Feature the BOA automation case study as the flagship proof point (€74K/year savings, replaced 2 staff)
3. Give recruiters something memorable to interact with — the "Ask John" AI chatbot

---

## Tech Stack

- **Framework:** Next.js 15.5.12 (App Router, RSC where appropriate, Turbopack dev server)
- **Language:** TypeScript throughout — strict mode, no `any`
- **Styling:** Tailwind CSS v4
- **Animations:** Framer Motion
- **Background:** Animated PCB circuit board canvas (Web Workers + OffscreenCanvas, CSS scroll-driven animation)
- **AI Feature:** Anthropic API (Claude Haiku 4.5) for the chatbot, Gemini fallback via OpenRouter
- **Database:** Neon PostgreSQL (serverless, Edge-compatible) — stores chatbot conversations + blog comments
- **Rate limiting:** Upstash Redis (`@upstash/ratelimit`) — 20 requests/IP/hour
- **Captcha:** Cloudflare Turnstile (blog comments)
- **Email:** Resend (contact form)
- **Deployment:** Vercel with custom domain (johnmoorman.com)
- **Package manager:** pnpm
- **Node:** v24

---

## Project Structure

```
app/
  page.tsx                  — homepage (hero, work, blog, resume, schedule, contact)
  layout.tsx                — root layout (sidebar nav, fonts, theme, circuit bg, analytics)
                              conditionally hides site shell on /admin routes
  about/page.tsx
  blog/page.tsx             — blog index
  blog/loading.tsx          — skeleton loading state
  blog/[slug]/page.tsx      — individual post (MDX + comments section)
  work/page.tsx             — work/case study index
  work/loading.tsx          — skeleton loading state
  work/[slug]/page.tsx      — individual case study (MDX)
  resume/page.tsx           — printable resume
  og/route.tsx              — OG image generation (next/og)
  robots.ts                 — robots.txt generation
  sitemap.ts                — dynamic sitemap from blog + work posts
  api/chat/route.ts         — Ask John chatbot (Edge runtime, streaming)
  api/contact/route.ts      — contact form handler
  not-found.tsx
  error.tsx

  admin/
    layout.tsx              — admin shell (toast provider)
    login/page.tsx          — password login
    (dashboard)/
      layout.tsx            — admin nav bar wrapper
      page.tsx              — dashboard overview (stats, recent activity)
      content/page.tsx      — content listing (blog + work, sortable, new post creation)
      content/[type]/[slug]/page.tsx — MDX editor with frontmatter form + live preview
      comments/page.tsx     — comment manager with delete
      chats/page.tsx        — chat session browser
      chats/[id]/page.tsx   — full conversation thread view
      prompt/page.tsx       — chatbot system prompt editor
      palette/page.tsx      — live color palette editor (dark + light mode)
      circuit/page.tsx      — circuit background config panel (sliders for generation params)

components/
  sidebar.tsx               — fixed left nav (desktop), hamburger menu (mobile)
  home-client.tsx           — homepage client component (hero, sections, animations)
  chat-panel.tsx            — Ask John chat UI
  chat-panel-lazy.tsx       — dynamic import wrapper
  circuit-bg.tsx            — PCB circuit board animated background (OffscreenCanvas + fallback)
  circuit-bg-lazy.tsx       — dynamic import wrapper
  theme-provider.tsx        — dark/light mode context
  theme-toggle.tsx          — toggle button
  section-reveal.tsx        — Framer Motion scroll-reveal wrapper
  cursor-glow.tsx           — subtle cursor effect (legacy, circuit-bg is primary)
  image-lightbox.tsx        — lightbox for blog images
  lightbox-provider.tsx
  mdx-image.tsx             — Next.js Image wrapper for MDX content
  mdx-audio.tsx             — custom styled audio player for MDX content
  contact-form.tsx
  comment-form.tsx          — anonymous blog comment form with Turnstile
  comment-list.tsx          — server component rendering comments per post
  tag-pill.tsx              — reusable tag badge with hover styles
  prefetch-routes.tsx       — eager site-wide prefetch after first page load
  print-button.tsx
  table-of-contents.tsx     — sticky TOC with scroll-spy for blog/work posts

  admin/
    admin-nav.tsx           — horizontal nav bar for admin sections
    toast.tsx               — toast notifications via context
    stat-card.tsx           — dashboard stat card
    content-table.tsx       — sortable content listing table
    content-editor.tsx      — MDX editor page wrapper (state, save, Cmd+S)
    frontmatter-form.tsx    — structured form for frontmatter fields
    mdx-editor.tsx          — textarea + markdown preview toggle
    new-post-form.tsx       — inline new post creation form
    comment-row.tsx         — comment with two-click delete
    chat-preview.tsx        — chat session preview card
    delete-chat-button.tsx  — two-click chat deletion

workers/
  circuit-worker.ts         — OffscreenCanvas circuit generation + animation (modern browsers)
  circuit-generate.ts       — fallback: generation in worker, rendering on main thread (Safari < 17)

lib/
  content.ts                — MDX file loader (getPosts, getPost) with includeDrafts param
  chatbot-prompt.ts         — system prompt for the Ask John chatbot
  ratelimit.ts              — Upstash Redis rate limiter
  sanitize.ts               — input sanitization (stripDangerous + sanitizeInput)
  db.ts                     — Neon PostgreSQL client (conversations, comments, admin queries)
  toc.ts                    — TOC helpers (slugify, TocItem type)
  actions/comments.ts       — server action for blog comment submission

  admin/
    auth.ts                 — password verification, HMAC session tokens, cookie helpers
    constants.ts            — shared constants (cookie name) safe for Edge runtime
    actions.ts              — server actions: login, logout, save content, delete comment/chat,
                              save prompt, save palette, create content

middleware.ts               — protects /admin routes, sets x-pathname header for layout

content/
  blog/
    _template.mdx           — frontmatter template (ignored by loader)
    real-estate-ai-tool.mdx
    hackathon-drop.mdx
    shortlist.mdx
    drop-oss.mdx
  work/
    boa-automation.mdx
    real-estate-pipeline.mdx
    finalflow.mdx
    serenity-retreat.mdx
    portfolio-site.mdx
    shortlist.mdx
    drop-oss.mdx
    murmur.mdx
    relocation-calculator.mdx

public/
  images/
    blog/real-estate-ai-tool/
    blog/shortlist/
    blog/drop-oss/
    blog/hackathon-drop/
```

---

## Design System

### Color palette (dark mode — default)

```
--bg:             #0a192f   /* Navy base */
--bg-surface:     #112240   /* Card/panel backgrounds */
--bg-elevated:    #1d3461   /* Hover states */
--accent:         #64ffda   /* Mint — use sparingly */
--text-primary:   #ccd6f6   /* Warm slate */
--text-secondary: #8892b0   /* Secondary text */
--text-muted:     #5a6a8a   /* Timestamps, dividers */
```

### Color palette (light mode)

```
--bg:             #f0f4f8   /* Cool blue-grey */
--bg-surface:     #e3ecf3
--bg-elevated:    #d6e3ee
--accent:         #0891b2   /* Cyan-600 */
--text-primary:   #0d1b2e
--text-secondary: #374e6a
--text-muted:     #6b87a4
--border:         rgba(0,0,0,0.08)
```

Colors are editable via the admin palette editor at `/admin/palette` (local dev only).

### Typography

- **Display/headings:** Syne (700–800 hero, 600 section heads) — CSS var `--font-display`
- **Body:** DM Sans (300–500) — CSS var `--font-body`
- **Mono (tags, labels, nav numbers):** JetBrains Mono — CSS var `--font-mono`

All loaded via `next/font/google` (not a `<link>` tag).

### Layout

- Desktop: fixed left sidebar (240px), content max-width 900px
- Admin: no sidebar, top nav, max-width 1100px
- Case study body text: max-width 680px
- Mobile: sidebar hidden, fixed top bar (56px) with hamburger overlay
- Section numbers: monospace, accent-colored — "01.", "02.", "03.", "04.", "05."
- Homepage sections: Work, Blog, Resume, Schedule, Contact

### Background (Circuit Board)

Animated PCB-style circuit board rendered on a canvas behind all content.

- **Primary path (modern browsers):** OffscreenCanvas transferred to `workers/circuit-worker.ts`. Generation, rendering, and animation run entirely off the main thread.
- **Fallback path (Safari < 17, older iOS):** `workers/circuit-generate.ts` handles generation in a worker; rendering runs on the main thread via requestAnimationFrame.
- **Scroll effect:** canvas is 2x viewport height with two identical tiles. A CSS scroll-driven animation slides it from `translateY(0)` to `translateY(-50%)`, compositor-driven with zero JS lag.
- **Interactivity:** cursor proximity highlighting on circuit segments, click-to-pulse effects.
- **Admin controls:** `/admin/circuit` provides sliders for generation math parameters (local dev only).
- Canvas width adjusts for the sidebar offset on desktop.

### Motion (Framer Motion)

- Page load: staggered reveal (nav -> hero elements), 80-100ms delays
- Scroll: `whileInView` fade-up, `once: true`
- Chatbot: spring-physics open/close (`stiffness: 300, damping: 30`)
- Cards: subtle lift on hover (`y: -4`)
- All animations respect `prefers-reduced-motion` via `useReducedMotion()` hook

---

## Environment Variables

```
ANTHROPIC_API_KEY=          # Server-side only — never NEXT_PUBLIC_
OPENROUTER_API_KEY=         # Gemini fallback via OpenRouter
UPSTASH_REDIS_REST_URL=     # Upstash console
UPSTASH_REDIS_REST_TOKEN=   # Upstash console
DATABASE_URL=               # Neon PostgreSQL connection string
RESEND_API_KEY=             # Contact form email (Resend)
ADMIN_PASSWORD=             # Admin dashboard login + session signing key
NEXT_PUBLIC_TURNSTILE_SITE_KEY=  # Cloudflare Turnstile (blog comments, client-side)
TURNSTILE_SECRET_KEY=       # Cloudflare Turnstile (server-side verification)
NEXT_PUBLIC_GOOGLE_CALENDAR_URL= # Google Calendar appointment scheduling link
```

---

## Admin Dashboard

Password-protected at `/admin`. Auth via `ADMIN_PASSWORD` env var with HMAC-signed session cookie (7-day expiry). Middleware redirects unauthenticated users to `/admin/login`.

**Sections:**
- **Dashboard** — at-a-glance stats (posts, comments, chats), recent activity with clickable items
- **Content** — browse all posts including drafts, create new posts, edit frontmatter + MDX body with live preview, Cmd/Ctrl+S to save
- **Comments** — view and delete blog comments
- **Chats** — browse chatbot conversations with message previews and visitor location (city/country from Vercel geo headers), view full threads, delete sessions
- **Prompt** — edit the chatbot system prompt with a warning banner
- **Palette** — live color picker for all design tokens (dark + light mode) with inline preview
- **Circuit** — sliders for circuit background generation parameters (grid size, trace density, etc.)

**Important:** Content editing, prompt editing, palette editing, and circuit config write to the filesystem. They only work in local dev (`pnpm dev`). On Vercel production, these are read-only. DB-backed features (comments, chats, dashboard stats) work everywhere.

---

## Chatbot — Ask John

The most important feature. Lives at `POST /api/chat` (Edge runtime, streaming).

**Provider chain:** Anthropic Claude Haiku 4.5 (primary) -> OpenRouter Gemini (fallback).

**Cost protection layers (all implemented):**
1. Upstash Redis: 20 requests/IP/hour, sliding window
2. Input capped at 500 chars server-side; output capped at 1200 tokens
3. Conversation history capped at 10 turns per session
4. Anthropic console spend limit set (separate console setting — keep it active)
5. Honeypot field + timing check (reject if message arrives within 500ms of page load)
6. Input sanitized (strip HTML, injection markers)
7. `ANTHROPIC_API_KEY` server-side only; route handler only

**Conversation storage:** Each session's messages are upserted to Neon PostgreSQL via `lib/db.ts`. IP addresses are SHA-256 hashed before storage. City and country are captured from Vercel geo headers.

**System prompt** (`lib/chatbot-prompt.ts`) — do not overwrite this without care. It is the primary voice of the site. Also editable via `/admin/prompt` in local dev. Key constraints encoded in it:
- Speaks first-person as John, clarifies AI status when asked
- Leads with business impact, not tech lists
- Honest about gaps ("I haven't used X professionally...")
- Directs contact to john@johnmoorman.com
- Ignores prompt injection attempts

---

## Blog & Content Authoring

All content lives as MDX files in `content/blog/` and `content/work/`. No CMS.

**Two workflows for authoring:**

1. **Admin dashboard** (preferred for quick edits): `/admin/content` -> edit in browser -> Cmd+S to save. Can also create new posts via the "+ New post" button. Only works in local dev.

2. **Manual**: Create `content/blog/your-slug.mdx` with frontmatter, set `draft: true`, preview at `localhost:3000/blog/your-slug`, remove draft flag when ready.

**Frontmatter (blog):**
```mdx
---
title: ""
date: ""             # YYYY-MM-DD
description: ""      # 1-2 sentences for index and meta description
tags: []             # e.g. ["Next.js", "TypeScript", "n8n"]
draft: true          # Remove or set false when ready to publish
---
```

**Frontmatter (work):** same as blog, plus optional fields:
```mdx
featured: true       # Show on homepage featured section
status: "shipped"    # "shipped" | "in-progress" | "upcoming"
challenge: "10-in-10"  # Links to the 10-in-10 challenge tracker
week: 3              # Challenge week number
stats:               # Displayed on featured project cards
  - value: "€74K"
    label: "Annual savings"
```

Copy `content/blog/_template.mdx` as a starting point.

**Draft rule:** `lib/content.ts` filters out `draft: true` posts in `NODE_ENV === 'production'` unless `includeDrafts` is passed (used by admin). Files prefixed with `_` are always excluded.

**Blog images:** Put them in `public/images/blog/your-slug/`. Reference with absolute paths: `/images/blog/your-slug/image.png`. The `mdx-image.tsx` component wraps Next.js `<Image>` for optimization.

**Audio in MDX:** Use the `MdxAudio` component (`components/mdx-audio.tsx`) for embedded audio players.

**Blog comments:** Anonymous with optional name, Cloudflare Turnstile captcha, stored in Neon PostgreSQL. Manageable via `/admin/comments`.

---

## Commit Conventions

Plain English imperative sentence. No conventional commit prefixes.

- Start with a capitalized verb: `Add`, `Fix`, `Remove`, `Rewrite`, `Update`, `Wire`, etc.
- Max ~75 characters
- No `Co-Authored-By` line
- Commit atomically — one logical change per commit
- For features, commit each layer separately (schema, server action, components, page integration)
- Never vague: no `update`, `fix stuff`, `wip`
- Never commit broken code

Examples:
```
Add currently-building section with 10-in-10 challenge
Guard Upstash init against placeholder env values
Wire image lightbox into blog and work MDX pages
Fix session token verification splitting on wrong delimiter
Extract TagPill component and unify pill styles site-wide
Replace calendar iframe with styled booking card
Replace CursorGlow with segment-level trace proximity highlight
```

---

## Notes for Ongoing Work

- TypeScript strictness is non-negotiable
- Don't over-engineer — this is a portfolio site. Reach for simplicity
- The chatbot system prompt is the most important piece of copy on the site — treat it with care
- SEO: `generateMetadata` on every page, OG image at `/og`, JSON-LD Person schema on homepage, `robots.ts` and `sitemap.ts` generate dynamically
- Performance target: Lighthouse 95+ / Core Web Vitals green
- `@vercel/analytics` is active — check Vercel dashboard for real visitor data
- Eager prefetching: all site routes are prefetched after first page load via `components/prefetch-routes.tsx`
- `TagPill` component (`components/tag-pill.tsx`) is the single source of truth for tag badge styles — use it everywhere
- `middleware.ts` sets an `x-pathname` header used by the root layout to detect admin routes
- Circuit background is off-main-thread by design. Keep it that way. All heavy computation stays in `workers/`
- Blog and work index pages have skeleton `loading.tsx` states for Suspense boundaries
- The 10-in-10 challenge tracker on the homepage reads `challenge` and `week` frontmatter from work posts
