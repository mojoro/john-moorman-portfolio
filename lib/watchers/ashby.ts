import type { NormalizedJob, WatcherConfig } from "./types"

/**
 * Ashby's public job-posting API. No auth, no pagination — one board is one
 * response. https://developers.ashbyhq.com/docs/public-job-posting-api
 */
export function ashbyBoardUrl(board: string): string {
  return `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(board)}?includeCompensation=true`
}

/**
 * Every field here is optional in practice, not just in the docs. The live
 * Featherless board returns `isRemote: null` on jobs whose location literally
 * reads "Remote (world)", and `address` is null on most of them, so nothing can
 * be assumed present.
 */
interface AshbyPostalAddress {
  addressLocality?: string | null
  addressRegion?: string | null
  addressCountry?: string | null
}

interface AshbyAddress {
  postalAddress?: AshbyPostalAddress | null
}

interface AshbySecondaryLocation {
  location?: string | null
  address?: AshbyAddress | null
}

interface AshbyJob {
  id?: string | null
  title?: string | null
  location?: string | null
  secondaryLocations?: AshbySecondaryLocation[] | null
  address?: AshbyAddress | null
  isRemote?: boolean | null
  workplaceType?: string | null
  isListed?: boolean | null
  department?: string | null
  team?: string | null
  employmentType?: string | null
  publishedAt?: string | null
  jobUrl?: string | null
  applyUrl?: string | null
  compensation?: { compensationTierSummary?: string | null } | null
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}

function postalParts(address: AshbyAddress | null | undefined): string[] {
  const postal = address?.postalAddress
  if (!postal) return []
  return [postal.addressLocality, postal.addressRegion, postal.addressCountry].map(text).filter(Boolean)
}

/**
 * Everything location-ish the posting carries, lowercased and joined.
 *
 * The secondary locations are the whole reason this exists: on the live board
 * Berlin never appears in a job's primary `location`, only in the
 * `secondaryLocations` of a role whose primary location is "Europe". Matching
 * on `location` alone would miss it entirely.
 */
export function locationBlob(job: AshbyJob): string {
  const parts: string[] = [text(job.location), text(job.workplaceType)]

  for (const secondary of job.secondaryLocations ?? []) {
    parts.push(text(secondary?.location), ...postalParts(secondary?.address))
  }

  parts.push(...postalParts(job.address))

  return parts.filter(Boolean).join(" | ").toLowerCase()
}

/**
 * The job URL ends in a UUID and survives retitling, which makes it the best
 * available identity. `title::location` is a last resort for a malformed
 * posting — weaker, because a retitle then reads as a brand new job.
 */
export function externalKeyFor(job: AshbyJob): string {
  const url = text(job.jobUrl)
  if (url) return url
  return `${text(job.title)}::${text(job.location)}`
}

export function normalizeAshbyJob(job: AshbyJob): NormalizedJob {
  return {
    externalKey: externalKeyFor(job),
    title: text(job.title) || "Untitled role",
    location: text(job.location),
    url: text(job.jobUrl) || text(job.applyUrl),
    // Absent means listed. Ashby only sends `false` to hide a posting.
    isListed: job.isListed !== false,
    isRemote: job.isRemote === true,
    isRemoteWorkplace: text(job.workplaceType).toLowerCase() === "remote",
    locationBlob: locationBlob(job),
    payload: {
      id: text(job.id) || null,
      department: text(job.department) || null,
      team: text(job.team) || null,
      employmentType: text(job.employmentType) || null,
      workplaceType: text(job.workplaceType) || null,
      publishedAt: text(job.publishedAt) || null,
      applyUrl: text(job.applyUrl) || null,
      compensation: text(job.compensation?.compensationTierSummary) || null,
      secondaryLocations: (job.secondaryLocations ?? []).map((entry) => text(entry?.location)).filter(Boolean),
    },
  }
}

export function normalizeAshbyBoard(body: unknown): NormalizedJob[] {
  const jobs = (body as { jobs?: unknown } | null)?.jobs
  if (!Array.isArray(jobs)) {
    throw new Error("Ashby response did not contain a jobs array")
  }
  return jobs.filter((job): job is AshbyJob => typeof job === "object" && job !== null).map(normalizeAshbyJob)
}

export async function fetchAshbyJobs(config: WatcherConfig): Promise<NormalizedJob[]> {
  const response = await fetch(ashbyBoardUrl(config.board), {
    headers: { accept: "application/json" },
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error(`Ashby board "${config.board}" returned HTTP ${response.status}`)
  }

  return normalizeAshbyBoard(await response.json())
}
