"use client"

export function MdxAudio(props: React.ComponentProps<"audio"> & { title?: string }) {
  const { title, ...audioProps } = props

  return (
    <figure className="my-6">
      <div className="rounded-lg border border-border bg-bg-surface px-4 py-3">
        {title && (
          <p className="mb-2 font-mono text-xs text-text-muted">{title}</p>
        )}
        <audio
          controls
          className="w-full"
          style={{ colorScheme: "dark" }}
          {...audioProps}
        />
      </div>
    </figure>
  )
}
