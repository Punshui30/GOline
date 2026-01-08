'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

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
    alt: 'GLEAF',
    name: 'GLEAF'
  },
  {
    src: '/brand/dispensary-logo-1.avif',
    alt: 'Dispensary',
    name: 'Dispensary'
  },
  {
    src: '/brand/dispensary-logo-2.png',
    alt: 'Dispensary',
    name: 'Dispensary'
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
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="mb-12 pb-8 border-b border-zinc-800/30"
    >
      <div className="flex flex-col items-center gap-6">
        {/* Heading */}
        <div className="text-center">
          <h2 className="text-sm lg:text-base font-sans font-medium text-zinc-400 mb-3 tracking-wide">
            Calculated from real dispensary menus
          </h2>
          <p className="text-xs lg:text-sm opacity-70 text-center max-w-md text-zinc-500 leading-relaxed">
            GO Line uses live inventory and lab-tested terpene data from participating dispensaries.
          </p>
        </div>

        {/* Dispensary Logos - Static display, low visual weight */}
        <div className="relative w-full py-2">
          <div className="flex items-center justify-center gap-12 lg:gap-16">
            {DISPENSARY_LOGOS.map((logo, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.15,
                  ease: 'easeOut'
                }}
                className="flex-shrink-0"
              >
                <img
                  src={logo.src}
                  alt={logo.alt}
                  className="h-8 lg:h-10 w-auto object-contain"
                  style={{
                    filter: 'grayscale(100%) opacity(0.35)',
                    maxHeight: '40px',
                  }}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  );
}

