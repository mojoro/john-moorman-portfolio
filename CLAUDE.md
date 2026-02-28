# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a static HTML/CSS/JS personal portfolio website for John Moorman, a Fullstack Engineer. The main portfolio is plain vanilla HTML/CSS/JS with no framework. A blog feature is built with a Node.js build script (`build-blog.js`) that converts markdown files in `posts/` into static HTML in `blog/`.

## Development

No build step for the portfolio itself. Open `index.html` directly in a browser, or use any static file server:

```bash
python3 -m http.server 8080
# or
npx serve .
```

### Blog build

When adding or editing a post, run:

```bash
npm run build:blog   # runs node build-blog.js
```

This reads all `.md` files from `posts/`, generates `blog/<slug>.html` for each, and regenerates `blog/index.html`. The `blog/` directory is committed — it's the deployable output, not a gitignored artifact.

## Architecture

Single-page site with one HTML file (`index.html`) and two asset files:

- **`assets/css/styles.css`** — All styles. Uses CSS custom properties defined in `:root` for colors (`--main-color`, `--accent-color`, `--text-color`) and SVG icons (inlined as data URIs in CSS variables). Three responsive breakpoints: desktop (default), tablet (`768px–1155px`), mobile (`<767px`).

- **`assets/js/scripts.js`** — Injects the "Welcome" SVG path into `#welcome` and animates it using `requestAnimationFrame` with a stroke-dashoffset drawing technique, then fills with white on completion.

- **`media/images/`** — Project screenshots and the animated developer illustration SVG (`developer-activity-animate.svg`).

- **`assets/fonts/`** — Self-hosted Inter font (woff/woff2).

### Blog

- **`posts/`** — Source markdown files. Each file requires YAML-style frontmatter with `title`, `date` (YYYY-MM-DD), and `description`.
- **`build-blog.js`** — Build script. Parses frontmatter manually (no extra dep), uses `marked` for markdown-to-HTML, writes to `blog/`.
- **`blog/`** — Generated static output. Do not edit by hand.
- Blog pages reuse the same CSS file and the same footer HTML as the portfolio. The `.post-header`, `.blog-post-content`, and `.post-card` CSS classes extend the existing design system.

### Key design patterns

- Icons are rendered as `<button class="icon [type]">` elements styled entirely via `background-image` CSS properties using inline SVG data URIs.
- Project cards use an absolutely-positioned `<a>` overlay at `z-index: 10` to make the entire card clickable, with inner links bumped to `z-index: 15` to remain interactive.
- The main section uses `::before`/`::after` pseudo-elements with `border-radius: 100%` to create curved top/bottom transitions against the teal background.
