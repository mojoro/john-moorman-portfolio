export interface TocItem {
  id: string
  text: string
  level: 2 | 3
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
}

export function extractHeadings(markdown: string): TocItem[] {
  const regex = /^(#{2,3})\s+(.+)$/gm
  const headings: TocItem[] = []
  let match
  while ((match = regex.exec(markdown)) !== null) {
    const level = match[1].length as 2 | 3
    const text = match[2].trim()
    headings.push({ id: slugify(text), text, level })
  }
  return headings
}
