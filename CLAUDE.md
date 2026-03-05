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

- **Framework:** Next.js 15 (App Router, RSC where appropriate)
- **Language:** TypeScript throughout — strict mode, no `any`
- **Styling:** Tailwind CSS v4
- **Animations:** Framer Motion
- **AI Feature:** Anthropic API (`claude-sonnet-4-20250514`) for the chatbot
- **Database:** Neon PostgreSQL (serverless, Edge-compatible) — stores chatbot conversations
- **Rate limiting:** Upstash Redis (`@upstash/ratelimit`) — 10 requests/IP/hour
- **Deployment:** Vercel with custom domain (johnmoorman.com)
- **Package manager:** pnpm

---

## Project Structure

```
app/
  page.tsx                  — homepage (hero, about, work preview, contact)
  layout.tsx                — root layout (sidebar nav, fonts, theme, analytics)
  about/page.tsx
  blog/page.tsx             — blog index
  blog/[slug]/page.tsx      — individual post (MDX)
  work/page.tsx             — work/case study index
  work/[slug]/page.tsx      — individual case study (MDX)
  resume/page.tsx           — printable resume
  og/route.tsx              — OG image generation (next/og)
  api/chat/route.ts         — Ask John chatbot (Edge runtime, streaming)
  api/contact/route.ts      — contact form handler
  not-found.tsx
  error.tsx

components/
  sidebar.tsx               — fixed left nav (desktop), hamburger menu (mobile)
  chat-panel.tsx            — Ask John chat UI
  chat-panel-lazy.tsx       — dynamic import wrapper
  theme-provider.tsx        — dark/light mode context
  theme-toggle.tsx          — toggle button
  section-reveal.tsx        — Framer Motion scroll-reveal wrapper
  cursor-glow.tsx           — subtle cursor effect
  image-lightbox.tsx        — lightbox for blog images
  lightbox-provider.tsx
  mdx-image.tsx             — Next.js Image wrapper for MDX content
  contact-form.tsx
  print-button.tsx

lib/
  content.ts                — MDX file loader (getPosts) used by blog and work routes
  chatbot-prompt.ts         — system prompt for the Ask John chatbot
  ratelimit.ts              — Upstash Redis rate limiter
  sanitize.ts               — input sanitization for chat API
  db.ts                     — Neon PostgreSQL client (conversation storage)

content/
  blog/
    _template.mdx           — frontmatter template (ignored by loader)
    real-estate-ai-tool.mdx
  work/
    boa-automation.mdx
    real-estate-pipeline.mdx
    finalflow.mdx
    serenity-retreat.mdx
    portfolio-site.mdx

public/
  images/
    blog/real-estate-ai-tool/   — blog post images
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
--text-muted:     #495670   /* Timestamps, dividers */
```

### Color palette (light mode)

```
--bg:             #f5f3ee   /* Warm off-white */
--bg-surface:     #edeae3
--bg-elevated:    #e4e0d7
--accent:         #0a7a5c   /* Dark teal (mint doesn't work on light) */
--text-primary:   #1a1a2e
--text-secondary: #4a5568
--text-muted:     #94a3b8
--border:         rgba(0,0,0,0.08)
```

### Typography

- **Display/headings:** Syne (700–800 hero, 600 section heads) — CSS var `--font-display`
- **Body:** DM Sans (300–500) — CSS var `--font-body`
- **Mono (tags, labels, nav numbers):** JetBrains Mono — CSS var `--font-mono`

All loaded via `next/font/google` (not a `<link>` tag).

### Layout

- Desktop: fixed left sidebar (240px), content max-width 900px
- Case study body text: max-width 680px
- Mobile: sidebar hidden, fixed top bar (56px) with hamburger overlay
- Section numbers: monospace, accent-colored — "01.", "02." etc.

### Motion (Framer Motion)

- Page load: staggered reveal (nav → hero elements), 80–100ms delays
- Scroll: `whileInView` fade-up, `once: true`
- Chatbot: spring-physics open/close (`stiffness: 300, damping: 30`)
- Cards: subtle lift on hover (`y: -4`)
- All animations respect `prefers-reduced-motion` via `useReducedMotion()` hook

---

## Environment Variables

```
ANTHROPIC_API_KEY=          # Server-side only — never NEXT_PUBLIC_
GOOGLE_AI_API_KEY=          # Gemini fallback — free tier at aistudio.google.com
UPSTASH_REDIS_REST_URL=     # Upstash console
UPSTASH_REDIS_REST_TOKEN=   # Upstash console
DATABASE_URL=               # Neon PostgreSQL connection string
```

---

## Chatbot — Ask John

The most important feature. Lives at `POST /api/chat` (Edge runtime, streaming).

**Cost protection layers (all implemented):**
1. Upstash Redis: 10 requests/IP/hour, sliding window
2. Input capped at 500 chars server-side; output capped at 400 tokens
3. Conversation history capped at 10 turns per session
4. Anthropic console spend limit set (separate console setting — keep it active)
5. Honeypot field + timing check (reject if message arrives within 500ms of page load)
6. Input sanitized (strip HTML, injection markers)
7. `ANTHROPIC_API_KEY` server-side only; route handler only

**Conversation storage:** Each session's messages are upserted to Neon PostgreSQL via `lib/db.ts`. IP addresses are SHA-256 hashed before storage.

**System prompt** (`lib/chatbot-prompt.ts`) — do not overwrite this without care. It is the primary voice of the site. Key constraints encoded in it:
- Speaks first-person as John, clarifies AI status when asked
- Leads with business impact, not tech lists
- Honest about gaps ("I haven't used X professionally...")
- Directs contact to john@johnmoorman.com
- Ignores prompt injection attempts

---

## Blog Authoring Workflow

All content lives as MDX files in `content/blog/` and `content/work/`. No CMS.

**To write a new blog post:**
1. Create `content/blog/your-slug.mdx` with frontmatter
2. Set `draft: true` while writing — visible locally, hidden in production
3. `pnpm dev` → `localhost:3000/blog/your-slug` to preview
4. When ready: remove `draft: true`, commit, push → Vercel auto-deploys

**Frontmatter:**
```mdx
---
title: ""
date: ""             # YYYY-MM-DD
description: ""      # 1–2 sentences for index and meta description
tags: []             # e.g. ["Next.js", "TypeScript", "n8n"]
draft: true          # Remove or set false when ready to publish
---
```

Copy `content/blog/_template.mdx` as a starting point.

**Draft rule:** `lib/content.ts` filters out `draft: true` posts in `NODE_ENV === 'production'`. Files prefixed with `_` are always excluded.

**Blog images:** Put them in `public/images/blog/your-slug/`. Reference with absolute paths: `/images/blog/your-slug/image.png`. The `mdx-image.tsx` component wraps Next.js `<Image>` for optimization.

---

## Commit Conventions

Plain English imperative sentence. No conventional commit prefixes.

- Start with a capitalized verb: `Add`, `Fix`, `Remove`, `Rewrite`, `Update`, `Wire`, etc.
- Max ~75 characters
- No `Co-Authored-By` line
- Never vague: no `update`, `fix stuff`, `wip`
- Never commit broken code
- If a decision involved a meaningful tradeoff, note it in the commit body

Examples:
```
Add currently-building section with 10-in-10 challenge
Guard Upstash init against placeholder env values
Wire image lightbox into blog and work MDX pages
```

---

## Notes for Ongoing Work

- TypeScript strictness is non-negotiable
- Don't over-engineer — this is a portfolio site. Reach for simplicity
- The chatbot system prompt is the most important piece of copy on the site — treat it with care
- SEO: `generateMetadata` on every page, OG image at `/og`, JSON-LD Person schema on homepage, sitemap and robots.txt in place
- Performance target: Lighthouse 95+ / Core Web Vitals green
- `@vercel/analytics` is active — check Vercel dashboard for real visitor data
