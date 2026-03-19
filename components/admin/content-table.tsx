"use client"

import Link from "next/link"
import { useState } from "react"

interface ContentRow {
  slug: string
  type: "blog" | "work"
  title: string
  date: string
  draft: boolean
  status?: string
}

type SortKey = "title" | "type" | "status" | "date"

function getStatusLabel(row: ContentRow): string {
  if (row.draft) return "draft"
  if (row.status) return row.status
  return "published"
}

function statusBadgeClasses(status: string): string {
  switch (status) {
    case "draft":
      return "bg-orange-400/10 text-orange-400"
    case "shipped":
    case "published":
      return "bg-accent/10 text-accent"
    case "in-progress":
      return "bg-yellow-400/10 text-yellow-400"
    case "upcoming":
      return "bg-text-muted/10 text-text-muted"
    default:
      return "bg-text-muted/10 text-text-muted"
  }
}

export function ContentTable({ posts }: { posts: ContentRow[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("date")
  const [sortAsc, setSortAsc] = useState(false)

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc((prev) => !prev)
    } else {
      setSortKey(key)
      setSortAsc(key !== "date")
    }
  }

  const sorted = [...posts].sort((a, b) => {
    let cmp = 0
    switch (sortKey) {
      case "title":
        cmp = a.title.localeCompare(b.title)
        break
      case "type":
        cmp = a.type.localeCompare(b.type)
        break
      case "status":
        cmp = getStatusLabel(a).localeCompare(getStatusLabel(b))
        break
      case "date":
        cmp = new Date(a.date).getTime() - new Date(b.date).getTime()
        break
    }
    return sortAsc ? cmp : -cmp
  })

  const columns: { key: SortKey; label: string }[] = [
    { key: "title", label: "Title" },
    { key: "type", label: "Type" },
    { key: "status", label: "Status" },
    { key: "date", label: "Date" },
  ]

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-bg-surface">
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => handleSort(col.key)}
                  className="font-mono text-xs text-text-muted transition-colors hover:text-accent"
                >
                  {col.label}
                  {sortKey === col.key && (
                    <span className="ml-1">{sortAsc ? "↑" : "↓"}</span>
                  )}
                </button>
              </th>
            ))}
            <th className="px-4 py-3">
              <span className="font-mono text-xs text-text-muted">Edit</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => {
            const status = getStatusLabel(row)
            return (
              <tr
                key={`${row.type}-${row.slug}`}
                className="border-b border-border transition-colors last:border-0 hover:bg-bg-elevated/50"
              >
                <td className="px-4 py-3 text-text-primary">{row.title}</td>
                <td className="px-4 py-3">
                  <span className="font-mono text-xs text-text-secondary">
                    {row.type}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 font-mono text-xs ${statusBadgeClasses(status)}`}
                  >
                    {status}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-text-secondary">
                  {row.date}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/content/${row.type}/${row.slug}`}
                    className="font-mono text-xs text-accent transition-colors hover:text-accent/80"
                  >
                    Edit →
                  </Link>
                </td>
              </tr>
            )
          })}
          {sorted.length === 0 && (
            <tr>
              <td
                colSpan={5}
                className="px-4 py-8 text-center text-sm text-text-muted"
              >
                No content found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
