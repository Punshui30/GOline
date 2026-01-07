'use client';

import { useEffect, useState } from 'react';

interface OutcomeTransitionBannerProps {
  visible: boolean;
}

export default function OutcomeTransitionBanner({ visible }: OutcomeTransitionBannerProps) {
  const [shouldRender, setShouldRender] = useState(visible);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      // Trigger animation after render
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      setIsAnimating(false);
      // Remove from DOM after fade out
      const timer = setTimeout(() => setShouldRender(false), 350);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!shouldRender) return null;

  return (
    <div
      className={`w-full border-b border-white/10 bg-[#0e0f13] px-6 py-4 transition-all duration-350 ease-out ${
        isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      }`}
    >
      <div className="max-w-[900px] mx-auto">
        <p className="text-sm text-white/80">
          Here's what best matches what you're looking for.
        </p>
      </div>
    </div>
  );
}

