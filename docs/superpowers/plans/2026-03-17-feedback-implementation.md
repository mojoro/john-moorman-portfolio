# Feedback Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement 12 feedback items across IA restructure, UI improvements, content fixes, and new features.

**Architecture:** Four phases of increasing complexity. Phase 1 (quick wins) and Phase 2 (content) are independent changes. Phase 3 (IA restructure) is tightly coupled and must ship as one unit. Phase 4 (chat features) builds on the restructured site. All work happens in worktree at `/home/john/repos/john-moorman-portfolio-feedback/` on branch `refactor/feedback-implementation`.

**Tech Stack:** Next.js 15, TypeScript, Tailwind v4, Framer Motion, Anthropic API, pnpm

**Spec:** `docs/superpowers/specs/2026-03-17-feedback-implementation-design.md`

**Verification:** No test framework in this project. Verify visually with `pnpm dev` (runs on localhost:3000). Build check with `pnpm build`.

---

## Phase 1: Quick Wins

### Task 1: Switch chatbot model from Sonnet 4 to Haiku 4.5

**Files:**
- Modify: `app/api/chat/route.ts:65`

- [ ] **Step 1: Change the model string**

In `app/api/chat/route.ts`, line 65, change:
```ts
// FROM:
model: "claude-sonnet-4-20250514",
// TO:
model: "claude-haiku-4-5-20251001",
```

- [ ] **Step 2: Verify build**

Run: `pnpm build`
Expected: Build succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/chat/route.ts
git commit -m "Switch chatbot from Sonnet 4 to Haiku 4.5"
```

---

### Task 2: Drop version numbers from user-facing content

**Files:**
- Modify: `app/page.tsx` (SKILLS array, PROJECTS array)
- Modify: `app/resume/page.tsx` (SKILLS array)
- Modify: `app/about/page.tsx` (skills snapshot)
- Modify: `content/work/portfolio-site.mdx` (tags, description)
- Modify: `lib/chatbot-prompt.ts` (version references in system prompt)
- Modify: `CLAUDE.md` (tech stack section, chatbot model reference)

- [ ] **Step 1: Find all version number instances**

Search for patterns like "Next.js 15", "React 19", "Tailwind CSS v4", "Tailwind v4", "TypeScript 5", "Node 20", etc. across all user-facing files. Use grep to get exact locations.

Run: `grep -rn "Next\.js 1[0-9]\|React 1[0-9]\|Tailwind.*v[0-9]\|TypeScript [0-9]\|Node.*v\?2[0-9]" --include="*.tsx" --include="*.ts" --include="*.mdx" --include="*.md" app/ components/ content/ lib/ CLAUDE.md`

- [ ] **Step 2: Remove version numbers from homepage skills grid**

In `app/page.tsx`, SKILLS array (lines 8-36): remove version numbers from skill names. E.g., "Next.js 15" becomes "Next.js", "React 19" becomes "React", "Tailwind CSS v4" becomes "Tailwind CSS".

- [ ] **Step 3: Remove version numbers from resume skills**

In `app/resume/page.tsx`, SKILLS array (lines 41-47): same treatment.

- [ ] **Step 4: Remove version numbers from about page skills snapshot**

In `app/about/page.tsx`, skills grid (lines 93-119): same treatment.

- [ ] **Step 5: Clean version numbers from portfolio-site.mdx tags**

In `content/work/portfolio-site.mdx` frontmatter, change tags like `"Next.js 15"` to `"Next.js"`, `"Tailwind CSS v4"` to `"Tailwind CSS"`. Keep version numbers in the MDX body text where they're part of the migration narrative (e.g., "migrating to Next.js 15 App Router").

- [ ] **Step 6: Clean version numbers from chatbot system prompt**

In `lib/chatbot-prompt.ts`, find and remove specific version numbers from framework mentions. Keep version numbers where they add factual context (e.g., education dates).

- [ ] **Step 7: Update CLAUDE.md**

Update the tech stack section and chatbot model reference to reflect the Haiku 4.5 switch and removed version numbers.

- [ ] **Step 8: Verify build**

Run: `pnpm build`

- [ ] **Step 9: Commit**

```bash
git add app/page.tsx app/resume/page.tsx app/about/page.tsx content/work/portfolio-site.mdx lib/chatbot-prompt.ts CLAUDE.md
git commit -m "Drop version numbers from user-facing content"
```

---

### Task 3: American English audit

**Files:**
- Modify: `app/about/page.tsx` (memorising, rigour)
- Modify: `content/work/finalflow.mdx` (colour)
- Modify: `content/work/boa-automation.mdx` (organisation)
- Modify: `content/work/serenity-retreat.mdx` (modernised, behaviour)
- Possibly others found by search

- [ ] **Step 1: Search for British English spellings**

Run:
```bash
grep -rni "memoris\|organis\|realis\|specialis\|optimis\|customis\|colour\|favour\|honour\|centre\|theatre\|rigour\|behaviour\|defence\|licence" --include="*.tsx" --include="*.ts" --include="*.mdx" app/ components/ content/ lib/
```

- [ ] **Step 2: Fix all identified instances**

Known fixes:
- `app/about/page.tsx`: "memorising" → "memorizing", "rigour" → "rigor"
- `content/work/finalflow.mdx`: "colour" → "color"
- `content/work/boa-automation.mdx`: "organisation" → "organization"
- `content/work/serenity-retreat.mdx`: "modernised" → "modernized", "behaviour" → "behavior"
- Fix any additional instances found in step 1.

- [ ] **Step 3: Verify build**

Run: `pnpm build`

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "Fix British English spellings to American English"
```

---

### Task 4: Add arrow indicators to clickable cards

**Files:**
- Modify: `app/page.tsx` (ProjectCard ~line 543, CurrentProjectCard ~line 598)

- [ ] **Step 1: Add arrow to ProjectCard**

In `app/page.tsx`, inside the `ProjectCard` component (around line 543-596), add an arrow icon to the top-right corner. The arrow should be muted by default and animate to accent on hover. Use the existing `group` class on the card wrapper.

Add inside the card's inner container, as the first child (positioned absolute top-right):
```tsx
<span className="absolute top-4 right-4 text-text-muted text-sm transition-all duration-300 group-hover:text-accent group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
  ↗
</span>
```

Ensure the card container has `relative` in its className.

- [ ] **Step 2: Add arrow to CurrentProjectCard (clickable ones only)**

In `app/page.tsx`, inside the `CurrentProjectCard` component (around line 598-660), add the same arrow icon but only when the card has an `href` (i.e., it's a motion Link, not a static div). Add the arrow inside the Link branch of the conditional render.

- [ ] **Step 3: Verify visually**

Run: `pnpm dev`
Check: Homepage work cards and shipped building cards show ↗ in top-right. Arrow shifts up-right and turns accent on hover. Upcoming (dashed border) cards have no arrow.

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx
git commit -m "Add arrow indicators to clickable project cards"
```

---

### Task 5: Print button visual upgrade

**Files:**
- Modify: `components/print-button.tsx`
- Modify: `app/globals.css` (add shimmer keyframe)

- [ ] **Step 1: Add shimmer keyframe to globals.css**

In `app/globals.css`, add the shimmer keyframe animation:
```css
@keyframes shimmer {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}
```

- [ ] **Step 2: Rewrite PrintButton with accent styling and animations**

Replace the contents of `components/print-button.tsx` with an upgraded version:
- Convert to a Framer Motion `motion.button`
- Default state: accent-colored (`bg-accent/15 border border-accent/40 text-accent`)
- Larger size: `px-5 py-2.5 text-sm font-medium`
- Hover: apply the shimmer animation via a className like `hover:[background:linear-gradient(90deg,var(--accent),white,var(--accent))] hover:[background-size:200%] hover:[animation:shimmer_1.5s_linear_infinite]`
- Click: `whileTap={{ scale: 0.95 }}` with spring transition
- Include a printer icon (inline SVG or unicode)

- [ ] **Step 2: Verify visually**

Run: `pnpm dev`, navigate to /resume.
Check: Button is larger, accent-colored by default. Hover triggers shimmering gradient. Click has satisfying scale-down.

- [ ] **Step 3: Commit**

```bash
git add components/print-button.tsx
git commit -m "Upgrade print button with accent styling and hover animation"
```

---

## Phase 2: Content Changes

### Task 6: Rewrite /about bio

**Files:**
- Modify: `app/about/page.tsx` (lines 38-89, bio paragraphs)

- [ ] **Step 1: Read current bio for reference**

Read `app/about/page.tsx` lines 38-89 to understand the current content and voice.

- [ ] **Step 2: Rewrite bio with new structure**

Replace the bio paragraphs (lines ~42-88) with restructured content following this order:
1. **Origin** — Where you're from (briefly)
2. **Education** — Boston Conservatory at Berklee, Bachelor of Music
3. **Career transition** — Opera to engineering story (compelling but not the opener)
4. **Current focus** — AI-native engineering, what you're building
5. **Personal** — Life in Berlin

Key constraints:
- Opening sentence must be distinctly different from the homepage hero intro
- Use American English
- Maintain the existing voice (direct, precise, with personality)
- Keep roughly the same length

- [ ] **Step 3: Verify visually**

Run: `pnpm dev`, navigate to /about.
Check: Bio reads well, has different opening than homepage, follows new structure order.

- [ ] **Step 4: Commit**

```bash
git add app/about/page.tsx
git commit -m "Rewrite about page bio with traditional ordering"
```

---

### Task 7: Accessibility audit and fixes

**Files:**
- Potentially modify: `app/globals.css` or Tailwind theme (contrast fixes)
- Modify: `components/sidebar.tsx` (ARIA labels)
- Modify: `components/chat-panel.tsx` (ARIA labels)
- Modify: `components/theme-toggle.tsx` (ARIA label)
- Modify: any components with missing alt text, focus indicators, or low contrast

- [ ] **Step 1: Run Lighthouse accessibility audit**

Start dev server: `pnpm dev`

Use the browser's Lighthouse tool or `npx lighthouse http://localhost:3000 --only-categories=accessibility --output=json` to audit the homepage. Note all failing checks.

- [ ] **Step 2: Audit key subpages**

Run Lighthouse on: /about, /work, /blog, /resume. Collect all unique accessibility issues across pages.

- [ ] **Step 3: Fix contrast ratio issues**

The main problem: `--text-muted: #495670` against `--bg: #0a192f` is ~2.3:1 (fails WCAG AA). Lighten `--text-muted` to approximately `#5a6a8a` (~3.5:1) or similar value that passes AA. Find where this variable is defined (likely `app/globals.css` or Tailwind config) and update it.

Check light mode muted colors too.

- [ ] **Step 4: Add missing ARIA labels**

Common fixes needed:
- Hamburger menu button in `sidebar.tsx`: add `aria-label="Toggle navigation menu"` and `aria-expanded={mobileMenuOpen}`
- Chat trigger button in `chat-panel.tsx`: add `aria-label="Open chat"`
- Theme toggle in `theme-toggle.tsx`: add `aria-label="Toggle dark mode"`
- Social links in `sidebar.tsx`: add `aria-label` to each (e.g., "GitHub profile", "LinkedIn profile", "Send email")

- [ ] **Step 5: Fix any remaining issues**

Address any other Lighthouse findings: missing alt text on images, insufficient focus indicators, form label associations, etc.

- [ ] **Step 6: Re-run Lighthouse on all pages**

Verify 100% (or near-100%) accessibility score on homepage, /about, /work, /blog, /resume.

- [ ] **Step 7: Verify build**

Run: `pnpm build`

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "Fix accessibility issues for 100% Lighthouse score"
```

---

## Phase 3: IA Restructure (ship as single unit)

> **IMPORTANT:** Tasks 8-11 are tightly coupled. Implement all of them before testing. Do not commit intermediate broken states. The final commit for this phase should be one atomic commit (or a small series of commits on the feature branch that together form a working state).

### Task 8: Update sidebar navigation (6 → 4 items)

**Files:**
- Modify: `components/sidebar.tsx` (lines 8-15, NAV_ITEMS)

- [ ] **Step 1: Replace NAV_ITEMS array**

In `components/sidebar.tsx`, replace lines 8-15 with:
```ts
const NAV_ITEMS = [
  { number: "01", label: "Work",    hash: "work",    page: "/work" },
  { number: "02", label: "Blog",    hash: "blog",    page: "/blog" },
  { number: "03", label: "Resume",  hash: null,       page: "/resume" },
  { number: "04", label: "Contact", hash: "contact",  page: null },
]
```

- [ ] **Step 2: Fix `getHref` for null hash**

The `getHref` helper (~line 149) returns `#${item.hash}` when on the homepage, which would produce `#null` for Resume. Fix it:
```ts
// When hash is null and page exists, always return the page path
if (!item.hash && item.page) return item.page
```

- [ ] **Step 3: Fix `handleNavClick` for null hash on homepage**

The `handleNavClick` function (~line 123-140) tries `document.getElementById(hash)?.scrollIntoView()` on the homepage. When hash is null, this silently does nothing, but we want Resume clicks to navigate to `/resume`. Add an early return:
```ts
if (!item.hash && item.page) {
  router.push(item.page)
  setMobileMenuOpen(false)
  return
}
```

- [ ] **Step 4: Fix React keys**

The `<li key={item.hash}>` (~line 172 desktop, ~line 268 mobile) will be `null` for Resume. Change to `key={item.label}` in both the desktop and mobile nav rendering.

- [ ] **Step 5: Verify scroll-spy skips null hash**

The IntersectionObserver setup (~lines 91-115) calls `document.getElementById(hash)` for each NAV_ITEM. Verify it gracefully handles null (it should, since `getElementById(null)` returns null and the observer just doesn't attach). If there's a null reference error, add a filter: `NAV_ITEMS.filter(item => item.hash)` before the observer loop.

---

### Task 9: Consolidate homepage sections

**Files:**
- Modify: `app/page.tsx` (major restructure)

- [ ] **Step 1: Read current homepage structure**

Read `app/page.tsx` fully. Map all sections: Hero (lines ~153-250), About (lines ~252-340), Work (lines ~342-420), Building (lines ~422-490), Experience (lines ~492-538), Blog (lines ~540-590), Contact (lines ~592-640). (Line numbers are approximate — verify by reading.)

- [ ] **Step 2: Remove About section from homepage**

Delete the About section (the one with number "01" and heading "About"). The hero section's intro paragraph and "Full story →" link to /about replaces it.

- [ ] **Step 3: Add "Full story →" link to hero**

In the hero section, after the intro paragraph, add a link:
```tsx
<Link href="/about" className="text-accent hover:underline text-sm font-mono">
  Full story →
</Link>
```

- [ ] **Step 4: Merge Building into Work section**

The current Work section (number "02") and Building section (number "03") become a single Work section (number "01"). Update the section's `id` to `"work"` and number to `"01"`.

The merged section contains three parts:

**Part A: Condensed 10-in-10 challenge callout.** A small banner at the top of the Work section:
```tsx
{/* Compute from CURRENT_PROJECTS array */}
const shipped = CURRENT_PROJECTS.filter(p => p.status === "shipped").length
const inProgress = CURRENT_PROJECTS.filter(p => p.status === "in-progress").length

<div className="border border-accent/20 rounded-lg p-4 mb-8 bg-accent/5">
  <div className="flex items-center justify-between">
    <div>
      <span className="font-mono text-xs text-accent/70 uppercase tracking-widest">Challenge</span>
      <h3 className="text-lg font-semibold text-text-primary mt-1">10 Projects in 10 Weeks</h3>
    </div>
    <span className="font-mono text-sm text-accent/80">
      {shipped + inProgress} of 10 · {shipped} shipped
    </span>
  </div>
  {/* 10-segment progress bar */}
  <div className="flex gap-1 mt-3">
    {Array.from({ length: 10 }, (_, i) => (
      <div key={i} className={`flex-1 h-1 rounded-full ${
        i < shipped ? "bg-accent/70" :
        i < shipped + inProgress ? "bg-yellow-400/50" :
        "bg-text-muted/20"
      }`} />
    ))}
  </div>
</div>
```

**Part B: Featured project cards** from the existing `PROJECTS` array (unchanged).

**Part C: Current building cards** from `CURRENT_PROJECTS` array, but only shipped + in-progress items (filter out upcoming). These use the existing `CurrentProjectCard` component.

- [ ] **Step 5: Remove Experience section from homepage**

Delete the Experience section (number "04"). This content now lives exclusively on /resume.

- [ ] **Step 6: Renumber remaining sections**

Update section numbers:
- Work: "01"
- Blog: "02"
- Contact: "03"

Update the Blog section's `id` to match.

- [ ] **Step 7: Update homepage SKILLS array usage**

If the About section referenced the SKILLS array and it's now removed from the homepage, check if SKILLS is still used elsewhere on the page. If not, remove the constant to avoid dead code.

- [ ] **Step 8: Update scroll-spy section IDs**

Verify the homepage sections have IDs matching the new NAV_ITEMS hashes: `work`, `blog`, `contact`.

---

### Task 10: Redesign /work page with challenge banner

**Files:**
- Modify: `lib/content.ts` (PostFrontmatter interface, lines 5-12)
- Modify: `app/work/page.tsx` (full rewrite)
- Modify: `content/work/boa-automation.mdx` (add status frontmatter)
- Modify: `content/work/real-estate-pipeline.mdx` (add status frontmatter)
- Modify: `content/work/finalflow.mdx` (add status frontmatter)
- Modify: `content/work/serenity-retreat.mdx` (add status frontmatter)
- Modify: `content/work/portfolio-site.mdx` (add status/challenge frontmatter)

- [ ] **Step 1: Extend PostFrontmatter interface**

In `lib/content.ts`, add to the `PostFrontmatter` interface:
```ts
export interface PostFrontmatter {
  title: string
  date: string
  description: string
  tags?: string[]
  featured?: boolean
  draft?: boolean
  status?: "shipped" | "in-progress" | "upcoming"
  challenge?: string
}
```

- [ ] **Step 2: Add status frontmatter to existing work MDX files**

Add `status: "shipped"` to all existing work MDX files that lack it:
- `boa-automation.mdx`: add `status: "shipped"`, `challenge: "10-in-10"` (if it's part of the challenge, otherwise omit challenge)
- `real-estate-pipeline.mdx`: add `status: "shipped"`
- `finalflow.mdx`: add `status: "shipped"`
- `serenity-retreat.mdx`: add `status: "shipped"`
- `portfolio-site.mdx`: add `status: "shipped"`, `challenge: "10-in-10"`

Check the homepage `CURRENT_PROJECTS` array to determine which projects are part of the 10-in-10 challenge and tag accordingly.

- [ ] **Step 3: Create MDX files for in-progress challenge items that have shipped**

For challenge items that have been completed and have real content, create proper MDX files with `status: "shipped"` and `challenge: "10-in-10"`. Do NOT create stub MDX files with `draft: true` for upcoming items — `getPosts()` filters out drafts in production, so they would be invisible on the /work page.

Instead, the 10-in-10 banner computes upcoming count as `10 - shipped - inProgress` (no MDX files needed for upcoming weeks). Only create MDX files for projects that have enough content to warrant a detail page.

For items that are in-progress (have started but aren't finished), create MDX files WITHOUT `draft: true` but with `status: "in-progress"`. They'll have a brief description and a "work in progress" note. Their cards on /work will be clickable.

- [ ] **Step 4: Rewrite /work page with challenge banner**

Rewrite `app/work/page.tsx` to include:

1. **Challenge banner** at top:
   - "Challenge" label (monospace, accent, uppercase tracking)
   - "10 Projects in 10 Weeks" title
   - Progress: "Week N of 10 . X shipped" (computed from MDX data)
   - 10-segment progress bar (accent = shipped, yellow = in-progress, muted = upcoming)
   - Stats derived: shipped = count where status=shipped AND challenge="10-in-10", inProgress = count where status=in-progress AND challenge="10-in-10", upcoming = 10 - shipped - inProgress

2. **Project list** below:
   - All posts from `getPosts("work")` (includes draft: false in production)
   - Each card shows: title, description, tags, status badge, challenge tag if applicable, featured badge if applicable, ↗ arrow for clickable items
   - Status badge colors: shipped = accent, in-progress = yellow, upcoming = muted
   - Upcoming items: dashed border, reduced opacity

- [ ] **Step 5: Verify the /work page**

Run: `pnpm dev`, navigate to /work.
Check: Challenge banner shows with correct progress. Projects listed with status badges. Featured projects prominent. Arrow icons on clickable cards.

---

### Task 11: Phase 3 verification and commit

- [ ] **Step 1: Full visual check**

Run: `pnpm dev`
Verify all of these:
- Homepage: Hero → Work (with challenge callout + cards) → Blog → Contact. No About/Building/Experience sections.
- Hero has "Full story →" link to /about
- Sidebar nav: 4 items (Work, Blog, Resume, Contact). Scroll-spy highlights correctly on homepage.
- /about page still works (accessible via hero link)
- /work page shows challenge banner + combined project list
- /resume page still works (accessible via nav)
- /blog page still works
- Mobile hamburger menu shows 4 items

- [ ] **Step 2: Build check**

Run: `pnpm build`
Expected: No errors, no TypeScript issues.

- [ ] **Step 3: Commit Phase 3**

```bash
git add -A
git commit -m "Restructure IA: merge nav to 4 items, consolidate homepage, redesign /work"
```

---

## Phase 4: Features

### Task 12: Chat persistence via localStorage

**Files:**
- Modify: `components/chat-panel.tsx`

- [ ] **Step 1: Update sessionId initialization**

In `components/chat-panel.tsx`, replace the sessionId useState (line ~49):

```ts
// FROM:
const [sessionId] = useState(() => crypto.randomUUID())

// TO:
const [sessionId] = useState(() => {
  if (typeof window === "undefined") return crypto.randomUUID()
  const stored = localStorage.getItem("chat_session_id")
  if (stored) return stored
  const id = crypto.randomUUID()
  localStorage.setItem("chat_session_id", id)
  return id
})
```

- [ ] **Step 2: Hydrate messages from localStorage on mount**

Add a useEffect to load stored messages when the component mounts:

```ts
useEffect(() => {
  try {
    const stored = localStorage.getItem("chat_messages")
    if (stored) {
      const parsed = JSON.parse(stored) as Message[]
      if (Array.isArray(parsed) && parsed.length > 0) {
        setMessages(parsed)
      }
    }
  } catch {
    // Corrupted storage, start fresh
  }
}, [])
```

- [ ] **Step 3: Persist messages on every update**

Add a useEffect that writes messages to localStorage whenever they change:

```ts
useEffect(() => {
  if (messages.length > 0) {
    try {
      localStorage.setItem("chat_messages", JSON.stringify(messages))
    } catch {
      // Storage full or unavailable, silently fail
    }
  }
}, [messages])
```

- [ ] **Step 4: Verify persistence**

Run: `pnpm dev`
Test flow:
1. Open chat, send a message, get a response
2. Click a nav link to navigate to a different page
3. Open chat again — messages should still be there
4. Refresh the page — messages should still be there

- [ ] **Step 5: Commit**

```bash
git add components/chat-panel.tsx
git commit -m "Persist chat messages across page navigations via localStorage"
```

---

### Task 13: Chatbot trigger redesign (avatar + greeting bubble)

**Files:**
- Create: `public/images/chat-avatar.svg` (extracted head from hero-vector.svg)
- Modify: `components/chat-panel.tsx` (trigger button redesign, greeting bubble)

- [ ] **Step 1: Create the avatar SVG**

Extract the character's head/face from `public/images/hero-vector.svg`. The `#Character` group (starting at line 154) contains a full-body illustration. Isolate the head paths (hair, face, eyes, glasses, mouth — roughly the elements between the top of the hair and the chin/neck area). Create a new standalone SVG at `public/images/chat-avatar.svg` with a tight viewBox around just the head. The result should be recognizable at 52px diameter when clipped to a circle.

This is a manual extraction task — inspect the SVG paths, identify the head elements, copy them into a new file, and adjust the viewBox.

- [ ] **Step 2: Replace the chat trigger button**

In `components/chat-panel.tsx`, replace the current floating trigger button (the "Ask me anything" button with chat icon) with:

```tsx
<motion.button
  onClick={() => setIsOpen(true)}
  className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-[52px] h-[52px] rounded-full border-2 border-accent/40 bg-bg-surface shadow-lg shadow-black/30 hover:border-accent/60 transition-colors"
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  aria-label="Open chat with John's AI assistant"
>
  <Image
    src="/images/chat-avatar.svg"
    alt="Chat avatar"
    width={36}
    height={36}
    className="rounded-full"
  />
  {/* Online indicator dot */}
  <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-accent rounded-full border-2 border-bg" />
</motion.button>
```

- [ ] **Step 3: Add the auto-greeting speech bubble**

Add a greeting bubble component that appears above the avatar on first visit:

```tsx
const [showGreeting, setShowGreeting] = useState(false)

useEffect(() => {
  if (typeof window === "undefined") return
  if (localStorage.getItem("chatGreetingDismissed")) return
  const timer = setTimeout(() => setShowGreeting(true), 2000)
  return () => clearTimeout(timer)
}, [])

useEffect(() => {
  if (!showGreeting) return
  const dismiss = () => {
    setShowGreeting(false)
    localStorage.setItem("chatGreetingDismissed", "true")
  }
  const scrollHandler = () => dismiss()
  const timer = setTimeout(dismiss, 5000)
  window.addEventListener("scroll", scrollHandler, { once: true })
  return () => {
    clearTimeout(timer)
    window.removeEventListener("scroll", scrollHandler)
  }
}, [showGreeting])
```

Render the bubble above the trigger button (only when `showGreeting && !isOpen`):

```tsx
<AnimatePresence>
  {showGreeting && !isOpen && (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="fixed bottom-20 right-6 z-50 max-w-[260px] bg-accent/10 border border-accent/25 rounded-xl rounded-br-sm px-4 py-3 text-sm text-text-primary cursor-pointer shadow-lg"
      onClick={() => {
        setShowGreeting(false)
        localStorage.setItem("chatGreetingDismissed", "true")
        setIsOpen(true)
      }}
    >
      Hi! I&apos;m John&apos;s AI assistant. Ask me anything about his work.
      <span className="block text-xs text-text-secondary mt-1.5">Click to chat →</span>
    </motion.div>
  )}
</AnimatePresence>
```

- [ ] **Step 4: Verify visually**

Run: `pnpm dev`
Test flow:
1. Load page — after 2s, greeting bubble appears above avatar
2. Wait 5s — bubble auto-dismisses
3. Refresh — bubble does not appear again (localStorage flag)
4. Clear localStorage, reload — bubble appears again
5. Click bubble — opens chat panel
6. Click avatar directly — opens chat panel

- [ ] **Step 5: Verify build**

Run: `pnpm build`

- [ ] **Step 6: Commit**

```bash
git add public/images/chat-avatar.svg components/chat-panel.tsx
git commit -m "Redesign chat trigger with avatar and auto-greeting bubble"
```

---

## Final Verification

### Task 14: Full site check and build

- [ ] **Step 1: Run full build**

Run: `pnpm build`
Expected: No errors. All pages statically generated or server-rendered without issues.

- [ ] **Step 2: Full visual review**

Run: `pnpm dev`

Check every page:
- Homepage: Hero with "Full story →", Work section with challenge callout + cards + arrows, Blog preview, Contact form. 3 numbered sections.
- /about: Restructured bio (different opening, traditional order, American English)
- /work: Challenge banner with progress, combined project list with status badges and arrows
- /blog: Unchanged (still works)
- /resume: Larger accent-colored print button with shimmer hover
- Chat: Avatar trigger with green dot, greeting bubble on first visit, messages persist across navigation
- Sidebar: 4 nav items, scroll-spy works on homepage, Resume links to /resume
- Mobile: Hamburger menu with 4 items, chat trigger visible

- [ ] **Step 3: Accessibility re-check**

Run Lighthouse accessibility on homepage and /resume to confirm fixes held through all the changes.

- [ ] **Step 4: Final commit if any cleanup needed**

```bash
git add -A
git commit -m "Final cleanup after feedback implementation"
```
