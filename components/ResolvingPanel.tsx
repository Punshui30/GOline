'use client';

/**
 * ResolvingPanel - Shows during calculation phase
 * 
 * This component creates a visual pause and cognitive separation
 * between input submission and result display.
 * 
 * CRITICAL: Must be visually undeniable - different background,
 * centered content, removes input entirely.
 */

export default function ResolvingPanel() {
  return (
    <div className="flex items-center justify-center min-h-[70vh] w-full">
      <div className="text-center space-y-6">
        <div className="text-xl lg:text-2xl font-sans text-white font-medium">Calculating your outcome</div>
        <div className="h-1.5 w-64 mx-auto bg-zinc-800 overflow-hidden rounded-full">
          <div className="h-full w-1/2 bg-[#C5A065] animate-pulse" />
        </div>
      </div>
    </div>
  );
}



