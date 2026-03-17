# Feedback Implementation Design

Date: 2026-03-17

## Context

Two reviewers provided feedback on the portfolio site (johnmoorman.com). This spec addresses all 12 feedback items in a single coordinated pass.

## 1. Information Architecture Restructure

### Current state

Six nav items: About, Work, Building, Experience, Blog, Contact. The homepage duplicates most subpage content. Work/Building/Experience boundaries are fuzzy. Resume is hidden (only reachable from Experience section link).

### New structure

**Nav: 4 items**

```
01. Work    → /work
02. Blog    → /blog
03. Resume  → /resume
04. Contact → /#contact (scrolls to homepage contact section)
```

**Homepage sections (new order):**

1. **Hero** — Name, tagline, intro paragraph, CTAs ("Get in touch", "See my work"), "Full story →" link to /about
2. **Work preview** — 10-in-10 challenge callout (condensed) + 2-3 featured project cards with arrow indicators
3. **Blog preview** — Latest 2 posts
4. **Contact** — Contact form (keeps `#contact` hash anchor for nav)

**Removed from homepage:** About section (absorbed into hero intro), Building section (merged into Work), Experience section (lives exclusively on /resume).

**Removed from nav:** About (page still exists at /about, linked from homepage hero). Building and Experience no longer exist as standalone concepts.

### /about page

Stays at /about but is not in the nav. Linked from homepage hero ("Full story →"). Bio gets rewritten with:
- Different opening than the homepage intro paragraph (reviewer noted they start the same way)
- More traditional ordering: where you're from, education, career transition, current focus, personal details
- American English spelling throughout

### Sidebar changes

- Desktop sidebar: update NAV_ITEMS to 4 entries
- Scroll-spy on homepage watches: `#work`, `#blog`, `#contact` (3 sections instead of 6)
- Mobile hamburger menu: same 4 items
- Social links at bottom of sidebar remain unchanged

## 2. /work Page Redesign

### 10-in-10 Challenge Banner

Top of the /work page gets a prominent callout section:
- Label: "Challenge" (monospace, accent, uppercase)
- Title: "10 Projects in 10 Weeks"
- Progress indicator: "Week N of 10 · X shipped" (monospace, accent)
- Progress bar: 10 segments, colored by status (accent = shipped, yellow = in progress, muted = upcoming)

This data can be derived from the project list (count items tagged as "10 in 10" by status).

### Combined project list

Below the banner, all projects appear in a single flat list. Each card has:
- Status badge: "Shipped" (accent), "In Progress" (yellow), "Upcoming" (muted)
- "10 in 10" tag where applicable
- "Featured" badge for flagship case studies
- Arrow icon (↗) in top-right corner for clickable cards
- Cards link to their MDX detail page (same as today)
- Upcoming items use dashed border and reduced opacity (same pattern as current Building cards)

### Data source

Currently, homepage projects are hardcoded constants and /work pulls from MDX. After this change:
- /work page continues pulling from MDX via `getPosts("work")`
- MDX frontmatter gets two new optional fields: `status` ("shipped" | "in-progress" | "upcoming") and `challenge` (string, e.g., "10-in-10")
- Homepage work preview shows a curated subset (featured + latest in-progress), still derived from the same MDX source
- The 10-in-10 banner stats are computed from the MDX metadata

## 3. Chatbot Trigger Redesign

### Avatar

Extract the character head from `public/images/hero-vector.svg` (the `#Character` group, roughly viewBox `270 205 65 85`). Crop and export as a standalone SVG. Display it clipped to a circle (52px diameter) as the floating trigger button, replacing the current chat icon + "Ask me anything" text.

The avatar button sits in the bottom-right corner (same position as current trigger). It has:
- Circular border with accent color (rgba(100, 255, 218, 0.4))
- Subtle box shadow
- A small green dot indicator in the top-right (signals "online" / interactive)

### Auto-greeting speech bubble

On first visit (no localStorage flag `chatGreetingDismissed`):
- A speech bubble appears above the avatar: "Hi! I'm John's AI assistant. Ask me anything about his work."
- Appears with a spring animation (delay 2s after page load to avoid competing with hero animations)
- Auto-dismisses after 5 seconds, or on click, or on scroll
- Sets `chatGreetingDismissed: true` in localStorage
- Never appears again for that browser

### Chat panel

The panel itself stays the same (spring-physics open/close, same layout). Only the trigger changes.

## 4. Chat Persistence

### Approach: localStorage

Messages are stored in localStorage keyed by `chatSessionId`.

### Implementation

In `chat-panel.tsx`:
- On component mount: check localStorage for existing messages under the current sessionId. If found, hydrate state.
- On every message update (user sends or assistant responds): write the full messages array to localStorage.
- SessionId is already generated via `crypto.randomUUID()`. Store it in localStorage too so it persists across navigations.
- Existing server-side persistence (Neon upsert) continues unchanged.

### Storage key format

```
chat_session_id  → string (UUID)
chat_messages    → JSON string of Message[]
```

### Limits

- Same 10-turn limit applies (counted from messages array length)
- If localStorage is unavailable (private browsing), fall back to in-memory only (current behavior)

## 5. Print Resume Button Upgrade

### Current state

Small `PrintButton` component in top-right of /resume page. Easy to miss.

### Changes

- Increase button size (larger padding, larger font)
- Default state: accent-colored background (`bg-accent/15`, `border-accent/40`, `text-accent`)
- Hover animation: gradient morph effect — accent color to white gradient that shifts/repeats. Use CSS `background-size` animation with a linear-gradient that moves, creating a shimmering/morphing effect. The animation should loop while hovering.
- Click animation: satisfying scale-down + spring-back (Framer Motion `whileTap={{ scale: 0.95 }}` with spring physics)
- Position: stays in the resume header area, more prominent

## 6. Card Arrow Indicators

### Scope

All clickable project cards on the homepage and /work page.

### Implementation

Add a small arrow icon (↗) to the top-right corner of each clickable card. The arrow should:
- Be subtle by default (muted color, small size ~14px)
- Animate on card hover: shift slightly up-right + become accent-colored
- Use the same Framer Motion group hover pattern already on the cards

This applies to:
- ProjectCard components (Work section)
- CurrentProjectCard components (only the ones with `href`, not upcoming static cards)

## 7. Model Switch: Sonnet 4 → Haiku 4.5

### Change

In `app/api/chat/route.ts`, change the primary model from `claude-sonnet-4-20250514` to `claude-haiku-4-5-20251001`.

### Rationale

Reviewer noted Haiku 4.5 is 5x cheaper, faster, and slightly more accurate than Sonnet 4 for this use case (conversational Q&A with a detailed system prompt).

### Fallback

Gemini fallback remains unchanged.

### System prompt

No changes needed. The prompt in `lib/chatbot-prompt.ts` works with any Claude model.

## 8. Accessibility Audit

### Goal

100% Lighthouse accessibility score.

### Approach

1. Run Lighthouse audit on all pages
2. Fix identified issues, likely including:
   - Contrast ratios on muted text colors (especially `--text-muted: #495670` against `--bg: #0a192f`)
   - Font size minimums (ensure nothing below 12px for body text)
   - Missing ARIA labels on interactive elements (chat trigger, hamburger menu, social links)
   - Focus indicators on all interactive elements
   - Image alt text completeness
3. Re-run audit to confirm 100%

### Constraint

Fix accessibility issues without changing the visual design language. Increase contrast within the existing palette rather than introducing new colors.

## 9. Drop Version Numbers

### Scope

Remove framework/library version numbers from all user-facing content:
- Homepage skills grid
- Resume skills section
- About page
- Blog post content (where version numbers appear in running text)
- Chatbot system prompt (references to specific versions)

### Exceptions

Keep version numbers in:
- `package.json` (obviously)
- Technical blog posts where the version is the point (e.g., "migrating from Next.js 14 to 15")
- MDX frontmatter metadata

## 10. Bio Rewrite

### Current issues

- Full bio (/about) starts the same way as abbreviated bio (homepage hero)
- Structure is non-traditional (leads with career transition story)

### New structure for /about

1. **Origin** — Where you're from (briefly)
2. **Education** — Boston Conservatory at Berklee, Bachelor of Music
3. **Career transition** — Opera to engineering (the compelling story, but not the opener)
4. **Current focus** — AI-native engineering, what you're building now
5. **Personal** — Life in Berlin, interests

### Homepage intro

Keep the current punchy intro style but ensure the opening sentence/hook is distinctly different from the /about opening.

## 11. American English Audit

### Known issues

- "memorising" → "memorizing" (flagged by reviewer)

### Approach

Search all content files (MDX, TSX, chatbot prompt) for common British English spellings:
- -ising → -izing (memorising, organising, realising, etc.)
- -ise → -ize (specialise, etc.)
- -our → -or (colour, favour, etc.)
- -re → -er (centre, etc.)
- -ence → -ense (defence, licence as noun, etc.)

## Implementation Order (suggested)

These are grouped by dependency, not priority:

**Phase 1 — Quick wins (no structural changes):**
- Model switch (Haiku 4.5)
- Drop version numbers
- American English audit
- Card arrow indicators
- Print button visual upgrade

**Phase 2 — Content changes:**
- Bio rewrite (/about page)
- Accessibility audit + fixes

**Phase 3 — IA restructure:**
- Sidebar nav update (6 → 4 items)
- Homepage section consolidation
- /work page redesign (merge Building, add challenge banner)
- Remove Building and Experience as standalone homepage sections

**Phase 4 — Features:**
- Chat persistence (localStorage)
- Chatbot trigger redesign (avatar + greeting bubble)

## Out of Scope

- Archiving site versions (v1/v2/v3 pattern mentioned by reviewer — acknowledged but not acting on now)
- CMS migration (site stays MDX-based)
- Full redesign of visual language (reviewer affirmed the typography and design are strong)
