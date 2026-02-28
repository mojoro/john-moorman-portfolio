# Blog Feature: Implementation Plan

## Goal

Add a blog to the portfolio that generates static HTML pages from a folder of markdown files, styled consistently with the existing site, with a link added to `index.html`.

---

## Approach: Build Script (Node.js)

Since the site is plain HTML/CSS/JS with no framework, add a minimal Node.js build script (`build-blog.js`) that reads `.md` files from a `posts/` folder and outputs static HTML into `blog/`. No npm packages are strictly required — Node's `fs` module handles file I/O, and a single dependency (`marked`) parses markdown. Run the script manually whenever a new post is added.

**Why not client-side rendering?** Fetching and parsing markdown at runtime adds complexity, requires a server (no `file://` support), and is worse for SEO. A build script keeps the output as clean static HTML.

---

## New File Structure

```
/
├── posts/                        # Source markdown files (one per post)
│   └── real-estate-ai-tool.md   # (move blog-post.md here, rename)
├── blog/                         # Generated output — do not edit by hand
│   ├── index.html                # Blog listing page
│   └── real-estate-ai-tool.html # Generated post page
├── assets/
│   └── css/
│       └── styles.css            # Add blog-specific styles here
├── build-blog.js                 # Build script
└── index.html                    # Add "Blog" nav link
```

---

## Implementation Steps

### 1. Install dependency

```bash
npm init -y
npm install marked
```

### 2. Write `build-blog.js`

The script should:
- Read all `.md` files in `posts/`
- Parse frontmatter (manually, no extra dependency) for: `title`, `date`, `description`
- Use `marked` to convert body to HTML
- Wrap each post in the site's HTML shell (see template below)
- Write to `blog/[slug].html`
- Generate `blog/index.html` listing all posts sorted by date (newest first)

**Frontmatter format** (YAML-style, parsed manually with a simple regex):
```
---
title: From Scraper to Inbox
date: 2025-01-15
description: How I built an AI-powered real estate sourcing tool using Apify, n8n, and Next.js.
---
```

### 3. Post page template

Wrap generated markdown HTML in a shell that reuses the existing site structure:

- Same `<head>` boilerplate as `index.html` (charset, viewport, styles.css link, favicon)
- `<header>` with teal background (`var(--main-color)`) containing post title and date — simpler than the homepage header (no SVG animation, no illustration)
- `<main>` with the `#f0f0f0` background and curved top/bottom pseudo-elements (copy the existing `main::before`/`::after` pattern)
- Inside main: a single centered content column, max-width ~800px, with the markdown body rendered inside
- `<footer>` identical to the one in `index.html`
- A "← Back to Blog" link at the top of the content area

### 4. Blog index page template (`blog/index.html`)

- Same header/footer shell as post pages
- Main content: a list of post cards, one per post
- Each card shows: title, date, description, and a "Read more →" link
- Reuse `.project-card` styles from the existing CSS (or create a `.post-card` variant that's simpler — no image, just text)

### 5. Add styles to `assets/css/styles.css`

New rules needed:
- `.blog-post-content` — prose styles for rendered markdown: `line-height`, `font-size`, heading sizes, `<code>` styling, `<blockquote>` styling, `<a>` color using `var(--accent-color)`
- `.post-card` — card for the blog listing page (similar to `.project-card` but without image container)
- `.post-header` — the simplified post-page header variant

### 6. Add blog link to `index.html`

Add a navigation link to the blog in the header area of `index.html`, near the social media icons or as a standalone text link above them. Keep it lightweight — a single `<a>` styled as a button or text link, no nav bar needed.

### 7. Move `blog-post.md` to `posts/`

Rename `blog-post.md` → `posts/real-estate-ai-tool.md` and add the frontmatter block at the top.

---

## Running the Build

```bash
node build-blog.js
```

Run this each time a new `.md` file is added to `posts/`. The `blog/` directory should be committed to the repo (it's the deployable output).

---

## Out of Scope

- No watch mode / hot reload (run manually)
- No pagination (not needed at small scale)
- No syntax highlighting (can add `highlight.js` later if desired)
- No RSS feed (can add as a later enhancement)
