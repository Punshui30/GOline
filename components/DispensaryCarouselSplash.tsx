"use client"

import React from "react"
import { GradientHeading } from "../ui/gradient-heading"
import LogoCarousel from "../ui/logo-carousel"

export function DispensaryCarouselSplash({
  onContinue,
}: {
  onContinue: () => void
}) {
  return (
    <div className="h-full w-full flex items-center justify-center min-h-screen">
      <div className="w-full max-w-screen-lg mx-auto flex flex-col items-center space-y-10 px-4">
        <div className="text-center space-y-4">
          <GradientHeading variant="secondary">
            The best are already here
          </GradientHeading>

          <GradientHeading size="xxl">
            Guided Outcome Calculator
          </GradientHeading>
        </div>

        <LogoCarousel columnCount={3} />

        <button
          onClick={onContinue}
          className="px-6 py-2 border border-white/20 text-sm text-white/80 hover:border-white/40 hover:text-white transition-colors mt-8"
        >
          Continue
        </button>
      </div>
    </div>
  )
}
