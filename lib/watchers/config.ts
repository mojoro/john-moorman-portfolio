import type { WatcherConfig } from "./types"

/**
 * Watcher configuration lives in code on purpose. There is no admin UI for it
 * and there should never be one: a watcher is a few lines of literal, and a
 * form for editing them would be more surface area than the feature itself.
 *
 * `exclude` starts empty and is meant to grow once real alerts show what noise
 * looks like — "US only" style patterns are the expected first entries.
 */
export const WATCHERS: readonly WatcherConfig[] = [
  {
    id: "featherless",
    source: "ashby",
    board: "featherlessai",
    cities: ["berlin", "singapore"],
    includeRemote: true,
    exclude: [],
  },
]

export function getWatcher(id: string): WatcherConfig | undefined {
  return WATCHERS.find((watcher) => watcher.id === id)
}
