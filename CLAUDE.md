# CLAUDE.md — Portfolio Site

## Who I Am

John Moorman — Software Engineer, Berlin. Former operatic performer (Boston Conservatory at Berklee). Self-taught engineer, freelancing full time and currently well booked. **Not job hunting.** Open to new clients when the fit is good, selective about what he takes on. Primary differentiators: Next.js 15 / TypeScript / React 19 and AI-native development workflow (Anthropic API, Claude Code, Cursor, n8n, Apify).

Site copy must never describe John as looking for a role, seeking employment, or available for hire full-time, and must not label his seniority as "mid-level" or "junior". The target read is an experienced independent engineer with a full calendar.

**Contacts / Links:**
- johnmoorman.com (this site, deployed to Vercel)
- github.com/mojoro
- linkedin.com/in/john-moorman
- john@johnmoorman.com
- +49 176 303 21460

---

## Site Purpose

Make a founder or CTO with a real project think "this is the engineer I want on it" within 30 seconds. Three things the site must accomplish:
1. Instantly communicate that I am an AI-native engineer who ships production-quality work
2. Feature the BOA automation case study as the flagship proof point (€74K/year savings, replaced 2 staff)
3. Give visitors something memorable to interact with — the "Ask John" AI chatbot

---

## Tech Stack

- **Framework:** Next.js 15.5.12 (App Router, RSC where appropriate, Turbopack dev server)
- **Language:** TypeScript throughout — strict mode, no `any`
- **Styling:** Tailwind CSS v4
- **Animations:** Framer Motion
- **Background:** Animated PCB circuit board canvas (Web Workers + OffscreenCanvas, CSS scroll-driven animation)
- **AI Feature:** OpenRouter (GPT-5.6 Luna) for the chatbot, Gemini fallback via OpenRouter
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
  blog/page.tsx             — blog index (?tag= filter)
  blog/loading.tsx          — skeleton loading state
  blog/[slug]/page.tsx      — individual post (MDX + comments section)
  work/page.tsx             — work/case study index (?tag= filter)
  work/loading.tsx          — skeleton loading state
  work/[slug]/page.tsx      — individual case study (MDX)
  tags/page.tsx             — tag index, weighted by use
  tags/loading.tsx          — skeleton loading state
  tags/[tag]/page.tsx       — tag archive, work and blog grouped separately
  tags/[tag]/loading.tsx    — skeleton loading state
  resume/page.tsx           — printable resume
  og/route.tsx              — OG image generation (next/og)
  robots.ts                 — robots.txt generation
  sitemap.ts                — dynamic sitemap from blog + work posts + tags
  api/chat/route.ts         — Ask John chatbot (Node runtime, streaming)
  api/contact/route.ts      — contact form handler
  api/invoicing/clients/route.ts        — GET list, POST create/update client
  api/invoicing/timesheet/route.ts      — GET entries, POST one or many
  api/invoicing/timesheet/[id]/route.ts — DELETE an uninvoiced entry
  api/invoicing/invoices/route.ts       — GET list, POST generate invoice
  api/invoicing/invoices/[id]/route.ts  — GET one, DELETE
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
      clients/page.tsx      — invoicing client list + create/edit form
      timesheet/page.tsx    — timesheet log, CSV import, invoice generation
      invoices/page.tsx     — generated invoice list with PDF links + delete
      invoices/file/[filename]/route.ts — auth-gated local invoice PDF download

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
  tag-pill.tsx              — reusable tag badge, link when given an href
                              (`overCardLink` for pills sitting on a card link)
  tag-filter.tsx            — server-rendered ?tag= chip row for index pages
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
  circuit-watchdog.ts       — frame-cost watchdog shared by both circuit render paths
  ratelimit.ts              — Upstash Redis rate limiter
  sanitize.ts               — input sanitization (stripDangerous + sanitizeInput)
  db.ts                     — Neon PostgreSQL client (conversations, comments, admin queries)
  toc.ts                    — TOC helpers (slugify, TocItem type)
  tag-slug.ts               — tagSlug/tagHref, the client-safe half of the tag helpers
  tags.ts                   — tag vocabulary: counts, archives, ?tag= parsing
  actions/comments.ts       — server action for blog comment submission

  admin/
    auth.ts                 — password verification, HMAC session tokens, cookie helpers
    constants.ts            — shared constants (cookie name) safe for Edge runtime
    require-admin-page.ts   — server-side page guard, redirects to /admin/login
    actions.ts              — server actions: login, logout, save content, delete comment/chat,
                              save prompt, save palette, create content, invoicing adapters

  invoicing/
    service.ts              — shared operations behind both the admin actions and the API
    validate.ts             — value validators + ValidationError (dates, hours, ids, prefixes)
    db.ts                   — clients, timesheet entries, invoices, invoice-number counters
    types.ts                — Client, TimesheetEntry, Invoice, InvoiceLineItem
    pdf.tsx                 — @react-pdf/renderer invoice document (sender details from env)
    blob.ts                 — Vercel Blob upload/delete, local .invoices/ fallback
    csv.ts                  — timesheet CSV parser with header aliases
    grouping.ts             — line items, totals, VAT, Kleinunternehmer notice
    invoice-number.ts       — PREFIX-YYMMDD-N numbering keyed to the period start
    time.ts                 — hh:mm:ss and decimal hour parsing
    api-auth.ts             — bearer token check + rate limit for /api/invoicing/*
    api-response.ts         — JSON helpers, ValidationError to 400 mapping

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

Dark mode is a lit circuit board. Light mode is the same board printed on
paper: the page is a faint cool stock, cards are raised toward the light, and
the accent drops to ink depth so it still carries at small sizes.

### Color palette (dark mode — default)

```
--bg:             #0a192f   /* Navy base */
--bg-surface:     #112240   /* Card/panel backgrounds */
--bg-elevated:    #1d3461   /* Hover states */
--accent:         #64ffda   /* Mint — use sparingly */
--text-primary:   #ccd6f6   /* Warm slate */
--text-secondary: #9ca6c5   /* Secondary text */
--text-muted:     #8592b2   /* Timestamps, dividers */
--border:         rgba(255,255,255,0.08)
--border-strong:  rgba(255,255,255,0.28)   /* Form controls */
```

### Color palette (light mode)

```
--bg:             #f2f5f9   /* Cool paper stock */
--bg-surface:     #fdfeff   /* Cards, raised toward the light */
--bg-elevated:    #e3e8f0   /* Inset fills, hover, skeletons */
--accent:         #006f75   /* The mint at ink depth — 5.4:1 on paper */
--text-primary:   #162035   /* 14.9:1 */
--text-secondary: #475167   /* 7.3:1 */
--text-muted:     #5d6679   /* 5.3:1 */
--border:         #d2d8e1   /* Card hairline */
--border-strong:  #78818f   /* Form controls — 3.6:1, clears WCAG 1.4.11 */
```

Note the elevation model inverts between themes. In dark mode surfaces get
*lighter* as they rise; in light mode `--bg-surface` is the raised card and
`--bg-elevated` is the recessed fill used for hovers, skeletons, and media
placeholders. A skeleton or hover tint must never use `--bg-surface` in light
mode, it disappears against the card.

Shared semantic tokens: `--danger`, `--warning`, `--shadow-cast` (cast shadows),
`--card-shadow` (surfaced through the `shadow-card` utility; `none` in dark).
Never reach for a raw Tailwind palette colour (`text-red-400`, `bg-yellow-400`)
or a white/black alpha (`border-white/[0.06]`) outside a permanently dark
surface such as the image lightbox — those only work in one theme.

Every light-mode text token clears WCAG AA against every surface it lands on.
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
- **The viewport height is `lvh`, never `innerHeight`.** A phone resizes its layout viewport when the browser toolbar slides in or out, so `window.innerHeight` lurches mid-scroll and drags the board with it. The canvas box is sized in `lvh` and the tile height is measured off the element (`clientHeight / 2`), which is toolbar-immune. Below 768px the parallax is off entirely — scroll progress itself shifts when the toolbar moves, and no amount of stable arithmetic fixes that.
- **Frame-rate watchdog (`lib/circuit-watchdog.ts`).** Both paths time their own `draw()` and back off if the device cannot afford it, rather than guessing from `navigator.hardwareConcurrency` or `deviceMemory` (wrong in both directions). Two signals: the mean cost of `draw()`, and the mean gap between draws, since `setInterval` does not skip frames the way rAF does and a stretched gap means the loop cannot be serviced on time. Two stages, both measured over a rolling 64-frame window (~2.1s at 33ms) with the first 10 frames after init/resize/regeneration/config/unhide discarded: **degrade** at a mean draw cost of 60% of the frame interval (~20ms of 33) or a mean gap of 1.6x the interval, which halves the density and drops 24 pulses to 8 (~24% cheaper draws, and the pulse cap is most of that — density only reaches the interior seeding and buys nothing below 0.5); **disable** at 85% (~28ms) if the thinner board is still over budget, which stops the loop, fades the canvas out and terminates the worker. Samples never accumulate while the page is hidden — a throttled tab is not a slow device, and the worker cannot read `document`, so visibility crosses by postMessage. `prefers-reduced-motion` draws one static frame and never starts a loop, so it is never watched. Any `circuit-config` event resets the window; an explicit `reset` restores full quality. Stage changes fire a `circuit-watchdog` CustomEvent on `window`.
- **Interactivity:** cursor proximity highlighting on circuit segments, click-to-pulse effects.
- **Admin controls:** `/admin/circuit` provides sliders for generation math parameters (local dev only).
- Canvas width adjusts for the sidebar offset on desktop.
- **Two colours, not one.** The etched board (traces, pads) draws in `--circuit-ink`; the live signal (glows, pulses, cursor highlight) keeps `--accent`. They are the same value in dark mode, where the board glows. In light mode the ink goes navy so the background reads as a printed schematic rather than a cyan smudge, and glows/pulses drop to roughly a fifth of their dark-mode strength because paper has no backlight.
- A horizontal vignette knocks the schematic out of the centre column, so it only survives in the outer margins. It must stay quiet enough there that the sidebar boundary at x=240 does not read as a seam. Below 768px there is no margin to spare (the text column spans nearly the full width), so both themes drop the transparent edge band and knock the board out across the whole span, leaving it as a faint texture at the edges.

### Motion (Framer Motion)

- Page load: staggered reveal (nav -> hero elements), 80-100ms delays
- Scroll: `whileInView` fade-up, `once: true`
- Chatbot: spring-physics open/close (`stiffness: 300, damping: 30`)
- Cards: subtle lift on hover (`y: -4`)
- All animations respect `prefers-reduced-motion` via `useReducedMotion()` hook

---

## Environment Variables

```
OPENROUTER_API_KEY=         # Chatbot — both the primary model and the Gemini fallback. Server-side only, never NEXT_PUBLIC_
UPSTASH_REDIS_REST_URL=     # Upstash console
UPSTASH_REDIS_REST_TOKEN=   # Upstash console
DATABASE_URL=               # Neon PostgreSQL connection string
RESEND_API_KEY=             # Contact form email (Resend)
ADMIN_PASSWORD=             # Admin dashboard login + session signing key
NEXT_PUBLIC_TURNSTILE_SITE_KEY=  # Cloudflare Turnstile (blog comments, client-side)
TURNSTILE_SECRET_KEY=       # Cloudflare Turnstile (server-side verification)
NEXT_PUBLIC_GOOGLE_CALENDAR_URL= # Google Calendar appointment scheduling link
BLOB_READ_WRITE_TOKEN=      # Vercel Blob — invoice PDF storage
INVOICE_SENDER_ADDRESS=     # Invoice letterhead address — never hardcode, this repo is public
INVOICE_TAX_NUMBER=         # Steuernummer printed on invoices
INVOICE_IBAN=               # IBAN printed on invoices
INVOICE_API_TOKEN=          # Bearer token for the invoicing API — unset disables it (min 32 chars)
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

## Invoicing API

JSON API under `/api/invoicing/*` so invoices can be generated by script (or by an agent) without driving the admin UI.

**Auth:** `Authorization: Bearer $INVOICE_API_TOKEN`. The token is separate from `ADMIN_PASSWORD` so it can be rotated independently. It is never accepted from a query string. If `INVOICE_API_TOKEN` is unset or under 32 characters, every route returns 404 — the API is off unless deliberately configured. Rate limited to 120 req/hour/IP on its own Upstash prefix.

| Method   | Path                          | Body / query                                                  |
| -------- | ----------------------------- | ------------------------------------------------------------- |
| `GET`    | `/api/invoicing/clients`      | —                                                              |
| `POST`   | `/api/invoicing/clients`      | `{name, invoicePrefix, billTo, ustId?, hourlyRateEur, id?}`    |
| `GET`    | `/api/invoicing/timesheet`    | `?clientId=&includeInvoiced=true`                              |
| `POST`   | `/api/invoicing/timesheet`    | one `{workDate, hours, task, clientId}` or `{clientId, entries: [...]}` |
| `GET`    | `/api/invoicing/invoices`     | —                                                              |
| `POST`   | `/api/invoicing/invoices`     | `{entryIds: [1,2,3], sequence?}` — all must share one client   |
| `GET`    | `/api/invoicing/invoices/:id` | —                                                              |
| `DELETE` | `/api/invoicing/invoices/:id` | releases the entries, deletes the PDF, frees the number        |

`hours` accepts `1.5`, `"1,5"`, or `"01:30:00"`. Dates must be real `YYYY-MM-DD` values. Validation failures return 400 with a message; everything else returns 500.

**Trailing slash required.** `next.config.ts` sets `trailingSlash: true`, so `/api/invoicing/clients` 308-redirects to `/api/invoicing/clients/`. Clients that follow redirects work either way (308 preserves method and body), but `curl` without `-L` will just show the redirect. Write the slash.

Typical flow: `GET /clients` for the id → `POST /timesheet` to log work → `GET /timesheet` for entry ids → `POST /invoices` with those ids. The response carries `invoice.pdf_url`.

**Shared logic:** `lib/invoicing/service.ts` holds the operations; the admin server actions in `lib/admin/actions.ts` and these routes are both thin adapters over it, so validation and the invoice-number compensation logic exist in exactly one place. Value-level validators live in `lib/invoicing/validate.ts`.

### Invoice numbering and reuse

Numbers are `PREFIX-YYMMDD-N`, where the date is the **start of the service period**, not the issue date, so December work billed in January stays in the right tax year.

`N` is the **lowest sequence not currently used** for that prefix and period, read from the `invoices` table (`nextInvoiceSequence` in `lib/invoicing/db.ts`). There is no counter. Consequences:

- Deleting an invoice frees its number — regenerating reuses it instead of incrementing.
- A generation that fails partway costs nothing; the number stays available.
- Gaps get filled before the range extends.
- `POST /api/invoicing/invoices` accepts `sequence` to force a specific number. If that number is taken it returns 400 telling you to delete the existing invoice first.

Six legacy invoices still use the older `PREFIX-YYYY-MM-DD-NN` format. They live in a separate namespace and are never parsed, so they can't collide with new numbers.

`invoice_number_counters` is superseded and unused; `db/migrations/004_*.sql` drops it and is optional. `voided_invoice_numbers` is kept as a log of failed attempts but no longer gates allocation.

**Reusing a number is safe for an invoice you never sent.** If a client already has the PDF, issue a corrected invoice with a new number rather than silently reusing the old one.

---

## Chatbot — Ask John

The most important feature. Lives at `POST /api/chat` (Node runtime, streaming).

**Provider chain:** OpenRouter GPT-5.6 Luna (primary) -> OpenRouter Gemini (fallback). Both stream through the same OpenRouter endpoint on `OPENROUTER_API_KEY`.

**Cost protection layers (all implemented):**
1. Upstash Redis: 20 requests/IP/hour, sliding window
2. Input capped at 500 chars server-side; output capped at 1200 tokens
3. Conversation history capped at 10 turns per session
4. OpenRouter credit limit set (separate dashboard setting — keep it active)
5. Honeypot field + timing check (reject if message arrives within 500ms of page load)
6. Input sanitized (strip HTML, injection markers)
7. `OPENROUTER_API_KEY` server-side only; route handler only

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
fun: true            # Personal project — groups under the "Fun projects" section
stats:               # Displayed on featured project cards
  - value: "€74K"
    label: "Annual savings"
```

Copy `content/blog/_template.mdx` as a starting point.

**Draft rule:** `lib/content.ts` filters out `draft: true` posts in `NODE_ENV === 'production'` unless `includeDrafts` is passed (used by admin). Files prefixed with `_` are always excluded.

**Blog images:** Put them in `public/images/blog/your-slug/`. Reference with absolute paths: `/images/blog/your-slug/image.png`. The `mdx-image.tsx` component wraps Next.js `<Image>` for optimization.

**Audio in MDX:** Use the `MdxAudio` component (`components/mdx-audio.tsx`) for embedded audio players.

**Blog comments:** Anonymous with optional name, Cloudflare Turnstile captcha, stored in Neon PostgreSQL. Manageable via `/admin/comments`.

### Tags

Blog posts and work case studies share one tag vocabulary, derived entirely
from frontmatter. There is no tag registry to maintain: add a tag to a post and
its archive page exists on the next build.

- `/tags/` lists every tag in use, cards for the heavily used ones and pills for the tail.
- `/tags/<slug>/` lists everything carrying it, case studies and writing in separate sections. All prerendered via `generateStaticParams`, with `dynamicParams = false` so unknown slugs never render.
- `/blog/?tag=<slug>` and `/work/?tag=<slug>` narrow the index in place. Server-rendered, no client JS, `noindex` so they don't compete with the archive.
- Slugs come from `tagSlug` in `lib/tags.ts`, which reuses `slugify` from `lib/toc.ts` after turning non-alphanumeric runs into separators, so "Next.js" is `next-js`. Case and spacing variants of a tag fold together and the most-used spelling becomes the display name; a fold across genuinely different spellings logs a build warning.
- Drafts are excluded, so an unpublished post cannot invent or inflate a tag.

Prefer an existing spelling over a new one. "Tailwind" and "Tailwind CSS" are
two tags, not one.

#### Cards that carry tag pills

Every card listing tags is a **stretched link**, never a link wrapping the
card. An anchor cannot contain another anchor, so the layout is:

- the card is a `group relative` container (`article` or `div`, not `a`),
- its own link sits on the **title** and grows `after:absolute after:inset-0`,
  which keeps the whole card clickable, thumbnail included,
- the pills are `<TagPill href overCardLink>`, which raises them above that
  overlay with `relative z-10`.

Nothing between the card and the title link may be positioned, or the overlay
shrinks to that ancestor instead of the card. The work card's content column is
deliberately unpositioned for this reason, and its ↗ anchors to the card with a
`top-44 sm:top-4` offset that clears the `h-40` thumbnail on narrow screens.

`overCardLink` also sets `pointer-events-none md:pointer-events-auto`, so below
`md` a tap anywhere on the card, pills included, follows the card's own link.
Pills are 20px tall; on a touch screen they are a mis-tap, not a target. The
pill stays keyboard reachable at every width, which is the intended escape
hatch.

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
- `TagPill` component (`components/tag-pill.tsx`) is the single source of truth for tag badge styles — use it everywhere. Pass `href` to make it a link, and add `overCardLink` for a pill inside a card. See "Cards that carry tag pills" under Tags: the card link must never be the pill's ancestor, because an anchor inside an anchor is invalid HTML and breaks hydration
- `middleware.ts` sets an `x-pathname` header used by the root layout to detect admin routes
- Circuit background is off-main-thread by design. Keep it that way. All heavy computation stays in `workers/`
- Blog and work index pages have skeleton `loading.tsx` states for Suspense boundaries
- The "Fun projects" sections on the homepage and `/work` read the `fun` frontmatter flag from work posts. The homepage grid skips anything already shown as `featured`
