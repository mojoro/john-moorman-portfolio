# johnmoorman.com

Personal portfolio and blog. Built with Next.js 15, TypeScript, and Tailwind CSS v4. Deployed on Vercel.

**[johnmoorman.com](https://johnmoorman.com)**

## What's in here

- **Homepage** with scroll-spy navigation, staggered Framer Motion reveals, and a 10-in-10 challenge progress tracker
- **Work case studies** as MDX with table of contents, image lightbox, and per-project stats
- **Blog** with MDX authoring, read time estimates, and anonymous comments (Neon + Turnstile)
- **Ask John** AI chatbot (Anthropic Claude, Gemini fallback) with streaming responses, conversation persistence, rate limiting, and input sanitization
- **Resume** page with print-optimized layout
- **Contact form** with honeypot spam protection
- Eager site-wide prefetching for near-instant page transitions
- Dark/light mode with system preference detection
- SEO: `generateMetadata` on every route, OG image generation, JSON-LD, sitemap, robots.txt

## Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 15 (App Router, RSC) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 |
| Animation | Framer Motion |
| Content | MDX via next-mdx-remote |
| AI | Anthropic API (Claude), Google Gemini fallback |
| Database | Neon PostgreSQL (serverless, Edge-compatible) |
| Rate limiting | Upstash Redis |
| Captcha | Cloudflare Turnstile |
| Analytics | Vercel Analytics |
| Deployment | Vercel |
| Package manager | pnpm |

## Getting started

```bash
pnpm install
cp .env.example .env.local   # fill in your keys
pnpm dev                      # http://localhost:3000
```

## Environment variables

| Variable | Purpose |
|----------|---------|
| `ANTHROPIC_API_KEY` | Chatbot (server-only) |
| `GOOGLE_AI_API_KEY` | Gemini fallback (server-only) |
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `UPSTASH_REDIS_REST_URL` | Rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | Rate limiting |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Blog comment captcha (client) |
| `TURNSTILE_SECRET_KEY` | Blog comment captcha (server-only) |

## Project structure

```
app/
  page.tsx                  Homepage
  about/page.tsx            About
  blog/page.tsx             Blog index
  blog/[slug]/page.tsx      Blog post (MDX + comments)
  work/page.tsx             Work index
  work/[slug]/page.tsx      Case study (MDX)
  resume/page.tsx           Printable resume
  api/chat/route.ts         Ask John chatbot (Edge, streaming)
  api/contact/route.ts      Contact form handler
  og/route.tsx              Dynamic OG image

components/                 Client and server components
lib/                        DB, content loader, sanitization, rate limiting, server actions
content/blog/               Blog posts (MDX)
content/work/               Case studies (MDX)
```

## Content authoring

Blog posts and case studies are MDX files in `content/`. Set `draft: true` in frontmatter to hide from production. See `content/blog/_template.mdx` for the frontmatter schema.

## License

Not open source. This is a personal portfolio. You're welcome to read the code and take inspiration, but please don't clone and deploy it as your own.
