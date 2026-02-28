# From Scraper to Inbox: Building an AI-Powered Real Estate Sourcing Tool for a Client

Finding good investment property in Germany is a slow, manual process. You're cross-referencing three or four listing platforms, filtering by your own criteria, calculating yields, and doing all of it again the next morning because new listings appeared overnight. I recently built a system to automate most of this for a client — and the result is something I'm genuinely proud of.

## The Brief

The client needed a way to monitor the German real estate market across multiple platforms simultaneously, filter listings against their specific investment criteria, and surface only the most relevant opportunities daily — without spending hours doing it manually. The output needed to be both a persistent dashboard for browsing and a daily email digest so nothing good slipped past.

## The Stack

I built the system by connecting four tools that each do one thing well:

- **Apify** — scraping Immobilienscout24, Immonet/Immowelt, and Kleinanzeigen on a scheduled basis
- **n8n** — orchestrating the entire processing pipeline: deduplication, filtering, enrichment, AI analysis, and email dispatch
- **Airtable** — serving as the data store and structured backend
- **Next.js** — the client-facing dashboard, pulling data from Airtable

No single piece of this is novel. The value is in how they fit together.

## The Pipeline

### Scraping and Ingestion

Apify handles the scraping. Each of the three platforms gets its own actor running on a schedule, and results land in n8n via webhook. At this stage the data is raw and messy — duplicate listings are common because the same property often appears on multiple platforms, and the field schemas differ enough between sites to require normalization before anything useful can happen.

The first n8n steps normalize fields into a common schema and deduplicate across sources. Deduplication by listing ID alone doesn't work across platforms, so the logic uses a combination of address, price, and size to catch cross-site duplicates.

### Filtering and Enrichment

Once deduplicated, listings pass through a filter stage based on the client's criteria: price range, size, location, property type. Anything that doesn't meet the hard minimums is discarded here.

Listings that survive filtering get enriched with yield estimates calculated from the asking price and local average rental data. This gives each listing a rough return figure without requiring the client to do that math manually.

### The AI Analysis Step

This is where it gets interesting. The filtered and enriched listings are passed to an AI model via n8n, along with the client's full investment criteria document. The model evaluates each listing and returns:

- A **status**: `GO`, `NO-GO`, or `PRÜFEN`
- A **risk summary**: a short description of notable concerns
- A **match description**: how well the listing aligns with the client's stated expectations

The three-way classification was a deliberate design choice. Binary GO/NO-GO would be too blunt — a lot of listings are genuinely ambiguous, and forcing them into a binary answer either creates false positives or filters out real opportunities. `PRÜFEN` (German for "examine") is the honest answer for those cases, and it gives the client a meaningful signal without pretending certainty.

The model's output is written back to Airtable alongside the listing data, so it's visible in the dashboard and queryable.

### Email Digest

At the end of each daily run, n8n compiles the day's `GO` and `PRÜFEN` listings into a formatted email and sends it to the client. The email is the primary touchpoint — the dashboard is for deeper browsing, but the email ensures the client doesn't have to think about checking in. The best opportunities come to them.

## The Dashboard

The Next.js frontend reads from Airtable and presents listings in a filterable table with the AI status prominently displayed. The client can sort by yield, filter by status, and drill into individual listings to see the full AI analysis. Keeping Airtable as the data layer rather than a custom database was a deliberate tradeoff: it meant faster development and gave the client a familiar interface to inspect and annotate the raw data directly if they ever needed to.

The main engineering challenge here was keeping the dashboard data fresh without hammering the Airtable API. Airtable's rate limits are generous but not unlimited, and the polling strategy needed some care to stay within bounds while still reflecting newly processed listings promptly.

## What I'd Do Differently

The n8n workflow grew more complex than I initially planned. What started as a linear pipeline acquired several conditional branches as edge cases emerged — what to do with listings that are missing size data, how to handle Apify failures gracefully, how to avoid re-processing listings that had already been analyzed. In hindsight I'd have designed the state management more explicitly from the start rather than adding it reactively.

## What I Took Away From This

Building this confirmed something I suspected: the interesting engineering in automation projects is rarely the integration itself. Connecting Apify to n8n to Airtable is straightforward. The real work is in the data quality layer — normalization, deduplication, deciding what counts as a duplicate — and in translating fuzzy client criteria into something a system can actually act on reliably.

The GO/NO-GO/PRÜFEN framing is a good example of that. A technically simpler binary classifier would have been faster to build, but it would have given the client worse outcomes. Getting the output format right required understanding the use case well enough to know where the model should express uncertainty rather than commit to an answer.
