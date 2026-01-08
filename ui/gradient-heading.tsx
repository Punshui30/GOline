"use client"

import React from "react"

interface GradientHeadingProps {
  variant?: "primary" | "secondary"
  size?: "xl" | "xxl"
  children: React.ReactNode
  className?: string
}

export function GradientHeading({
  variant = "primary",
  size = "xl",
  children,
  className = "",
}: GradientHeadingProps) {
  const sizeClasses = {
    xl: "text-2xl md:text-3xl lg:text-4xl",
    xxl: "text-3xl md:text-4xl lg:text-5xl xl:text-6xl",
  }

  const variantClasses = {
    primary: "text-bronze-gradient",
    secondary: "text-white/70",
  }

  return (
    <h2
      className={`font-serif font-light leading-tight tracking-tight ${sizeClasses[size]} ${variantClasses[variant]} ${className}`.trim()}
    >
      {children}
    </h2>
  )
}

