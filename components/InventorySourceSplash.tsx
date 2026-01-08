'use client';

import { useEffect, useState } from 'react';

/**
 * InventorySourceSplash Component
 * 
 * Contextual splash showing dispensary logos as data sources.
 * Calm, informational, non-promotional. Reinforces that GO Line
 * calculates from real dispensary inventory and lab data.
 */

const DISPENSARY_LOGOS = [
  {
    src: '/brand/gleaf-logo.webp',
    alt: 'Participating dispensary',
  },
  {
    src: '/brand/dispensary-logo-1.avif',
    alt: 'Participating dispensary',
  },
  {
    src: '/brand/dispensary-logo-2.png',
    alt: 'Participating dispensary',
  },
];

export default function InventorySourceSplash() {
  const [shouldShow, setShouldShow] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if user has seen splash in this session
    // Show on first visit of session, then hide
    const seen = typeof window !== 'undefined' ? sessionStorage.getItem('inventory-splash-seen') : null;
    if (!seen) {
      setShouldShow(true);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('inventory-splash-seen', 'true');
      }
    } else {
      setShouldShow(false);
    }
  }, []);

  // Don't render until we've checked sessionStorage to avoid flash
  if (shouldShow === null || !shouldShow) {
    return null;
  }

  return (
    <section className="mb-10 pb-6 border-b border-zinc-800/20">
      <div className="flex flex-col items-center gap-4">
        {/* Heading */}
        <div className="text-center">
          <h2 className="text-xs lg:text-sm font-sans font-medium text-zinc-500 mb-2 tracking-wide">
            Calculated from real dispensary menus
          </h2>
          <p className="text-[10px] lg:text-xs text-zinc-600 text-center max-w-md leading-relaxed">
            GO Line uses live inventory and lab-tested terpene data from participating dispensaries.
          </p>
        </div>

        {/* Dispensary Logos - Flat, uniform, desaturated */}
        <div className="relative w-full py-1">
          <div className="flex items-center justify-center gap-10 lg:gap-14">
            {DISPENSARY_LOGOS.map((logo, index) => (
              <div
                key={index}
                className="flex-shrink-0"
              >
                <img
                  src={logo.src}
                  alt={logo.alt}
                  className="h-7 lg:h-8 w-auto object-contain"
                  style={{
                    filter: 'grayscale(100%) opacity(0.3)',
                    maxHeight: '32px',
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

