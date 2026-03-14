"use client"

import Image from "next/image"
import { useLightbox } from "./lightbox-provider"

export function MdxImage(props: React.ComponentProps<"img">) {
  const { open } = useLightbox()
  const src = typeof props.src === "string" ? props.src : ""

  return (
    <Image
      src={src}
      alt={props.alt ?? ""}
      width={900}
      height={500}
      className="my-6 cursor-zoom-in rounded-lg"
      quality={100}
      sizes="(max-width: 768px) 100vw, 680px"
      onClick={() => open(src, props.alt ?? "")}
    />
  )
}
