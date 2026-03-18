"use client"

const inputClasses =
  "w-full rounded-lg border border-border bg-bg-surface px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
const labelClasses = "font-mono text-xs text-text-muted"

interface FrontmatterFormProps {
  frontmatter: Record<string, unknown>
  type: "blog" | "work"
  onChange: (fm: Record<string, unknown>) => void
}

export function FrontmatterForm({
  frontmatter,
  type,
  onChange,
}: FrontmatterFormProps) {
  function update(key: string, value: unknown) {
    onChange({ ...frontmatter, [key]: value })
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Title */}
      <label className="flex flex-col gap-1.5">
        <span className={labelClasses}>Title</span>
        <input
          type="text"
          value={(frontmatter.title as string) ?? ""}
          onChange={(e) => update("title", e.target.value)}
          placeholder="Post title"
          className={inputClasses}
        />
      </label>

      {/* Date */}
      <label className="flex flex-col gap-1.5">
        <span className={labelClasses}>Date</span>
        <input
          type="date"
          value={(frontmatter.date as string) ?? ""}
          onChange={(e) => update("date", e.target.value)}
          className={inputClasses}
        />
      </label>

      {/* Description */}
      <label className="flex flex-col gap-1.5">
        <span className={labelClasses}>Description</span>
        <textarea
          rows={2}
          value={(frontmatter.description as string) ?? ""}
          onChange={(e) => update("description", e.target.value)}
          placeholder="1-2 sentence description"
          className={inputClasses + " resize-y"}
        />
      </label>

      {/* Tags */}
      <label className="flex flex-col gap-1.5">
        <span className={labelClasses}>Tags (comma-separated)</span>
        <input
          type="text"
          value={
            Array.isArray(frontmatter.tags)
              ? (frontmatter.tags as string[]).join(", ")
              : ""
          }
          onChange={(e) => {
            const tags = e.target.value
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
            update("tags", tags)
          }}
          placeholder="Next.js, TypeScript, AI"
          className={inputClasses}
        />
      </label>

      {/* Draft */}
      <label className="flex items-center gap-2.5">
        <input
          type="checkbox"
          checked={(frontmatter.draft as boolean) ?? false}
          onChange={(e) => update("draft", e.target.checked)}
          className="h-4 w-4 rounded border-border bg-bg-surface accent-accent"
        />
        <span className={labelClasses}>Draft</span>
      </label>

      {/* Work-specific fields */}
      {type === "work" && (
        <>
          <hr className="border-border" />

          {/* Featured */}
          <label className="flex items-center gap-2.5">
            <input
              type="checkbox"
              checked={(frontmatter.featured as boolean) ?? false}
              onChange={(e) => update("featured", e.target.checked)}
              className="h-4 w-4 rounded border-border bg-bg-surface accent-accent"
            />
            <span className={labelClasses}>Featured</span>
          </label>

          {/* Status */}
          <label className="flex flex-col gap-1.5">
            <span className={labelClasses}>Status</span>
            <select
              value={(frontmatter.status as string) ?? ""}
              onChange={(e) =>
                update("status", e.target.value || undefined)
              }
              className={inputClasses}
            >
              <option value="">None</option>
              <option value="shipped">Shipped</option>
              <option value="in-progress">In Progress</option>
              <option value="upcoming">Upcoming</option>
            </select>
          </label>

          {/* Challenge */}
          <label className="flex flex-col gap-1.5">
            <span className={labelClasses}>Challenge</span>
            <input
              type="text"
              value={(frontmatter.challenge as string) ?? ""}
              onChange={(e) =>
                update("challenge", e.target.value || undefined)
              }
              placeholder="10-in-10 challenge name"
              className={inputClasses}
            />
          </label>

          {/* Week */}
          <label className="flex flex-col gap-1.5">
            <span className={labelClasses}>Week</span>
            <input
              type="number"
              value={(frontmatter.week as number) ?? ""}
              onChange={(e) => {
                const val = e.target.value
                update("week", val ? Number(val) : undefined)
              }}
              placeholder="Week number"
              className={inputClasses}
            />
          </label>
        </>
      )}
    </div>
  )
}
