"use client"

import React from "react"
import Image from "next/image"

// Dispensary logos must remain SVG for scaling + animation integrity.
// Do not replace with raster assets.

const DISPENSARY_LOGOS = [
  {
    name: 'gLeaf',
    src: '/dispensaries/gleaf.svg',
  },
  {
    name: 'Evermore',
    src: '/dispensaries/evermore.svg',
  },
  {
    name: 'Curio',
    src: '/dispensaries/curio.svg',
  },
]

export default function LogoCarousel({ columnCount = 3 }: { columnCount?: number }) {
  return (
    <div className="w-full overflow-hidden">
      <div className="flex items-center justify-center gap-10 opacity-60">
        {DISPENSARY_LOGOS.map((logo) => (
          <div
            key={logo.name}
            className="relative h-10 w-40 flex items-center justify-center flex-shrink-0"
          >
            <Image
              src={logo.src}
              alt={logo.name}
              width={160}
              height={40}
              className="object-contain"
              priority
            />
          </div>
        ))}
      </div>
    </div>
  )
}

