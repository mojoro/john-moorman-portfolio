"use client"

import Image from "next/image"
import { useLightbox } from "./lightbox-provider"

export function MdxImage(props: React.ComponentProps<"img">) {
  const { open } = useLightbox()
  const src = typeof props.src === "string" ? props.src : ""
  const alt = props.alt ?? ""

  return (
    <figure className="my-6">
      <Image
        src={src}
        alt={alt}
        width={900}
        height={500}
        className="cursor-zoom-in rounded-lg"
        quality={100}
        sizes="(max-width: 768px) 100vw, 680px"
        onClick={() => open(src, alt)}
      />
      {alt && (
        <figcaption className="mt-2 text-center text-sm text-text-muted">
          {alt}
        </figcaption>
      )}
    </figure>
  )
}
