"use client"

import React from "react"
import Image from "next/image"
import { motion } from "framer-motion"

// Dispensary logos must remain SVG for scaling + animation integrity.
// Do not replace with raster assets.

const logos = [
  { name: "CULTA", src: "/logos/culta.svg" },
  { name: "gLeaf", src: "/logos/gleaf.svg" },
  { name: "Remedy", src: "/logos/remedy.svg" },
  { name: "Curio", src: "/logos/curio.svg" },
  { name: "Evermore", src: "/logos/evermore.svg" },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
}

export default function LogoCarousel({ columnCount = 3 }: { columnCount?: number }) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full overflow-hidden"
    >
      <div className="grid grid-cols-3 gap-8 md:gap-12 lg:gap-16 items-center justify-items-center max-w-4xl mx-auto px-4">
        {logos.map((logo, index) => (
          <motion.div
            key={logo.name}
            variants={itemVariants}
            whileHover={{ scale: 1.05, opacity: 1 }}
            className="relative h-12 w-32 md:h-16 md:w-40 flex items-center justify-center opacity-40 hover:opacity-100 transition-opacity duration-300 cursor-pointer group"
          >
            <Image
              src={logo.src}
              alt={logo.name}
              width={160}
              height={64}
              className="object-contain filter grayscale group-hover:grayscale-0 transition-all duration-300"
              priority={index < 3}
            />
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
