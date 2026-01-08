"use client"

import React from "react"
import LogoCarousel from "../ui/logo-carousel"

export function DispensaryCarouselSplash({
  onContinue,
}: {
  onContinue: () => void
}) {
  return (
    <div className="h-full w-full flex items-center justify-center">
      <div className="w-full max-w-screen-lg mx-auto flex flex-col items-center space-y-10">
        {/* Context text */}
        <div className="text-center">
          <p className="text-xs uppercase tracking-wide text-white/50">
            Calculated from real dispensary menus
          </p>
          <p className="mt-2 text-sm text-white/70">
            GO Line uses live inventory and lab-tested data
          </p>
        </div>

        {/* YOUR carousel, unchanged */}
        <LogoCarousel columnCount={3} />

        {/* Continue */}
        <button
          onClick={onContinue}
          className="px-6 py-2 border border-white/20 text-sm text-white/80 hover:border-white/40 transition"
        >
          Continue
        </button>
      </div>
    </div>
  )
}

