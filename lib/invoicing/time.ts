export function parseHoursAmount(value: string): number {
  const trimmed = value.trim()
  if (!trimmed) return Number.NaN

  const timeMatch = /^(\d+):([0-5]\d):([0-5]\d)$/.exec(trimmed)
  if (timeMatch) {
    const [, hours, minutes, seconds] = timeMatch
    const totalSeconds = Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds)
    return Math.round((totalSeconds * 100) / 3600) / 100
  }

  return Number(trimmed.replace(",", "."))
}
