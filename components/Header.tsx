'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function Header() {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [taps, setTaps] = useState<number[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReducedMotion(mediaQuery.matches);

      const handleChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  const handleLogoInteraction = (e: React.MouseEvent) => {
    console.log("ADMIN TAP FIRED");
    // Gate: Only active if enabled in environment
    if (process.env.NEXT_PUBLIC_ADMIN_ENABLED !== 'true') return;

    const now = Date.now();
    const WINDOW_MS = 4000;

    // Support two patterns:
    // 1. 7 taps in 4 seconds
    // 2. Shift + 3 clicks
    const threshold = e.shiftKey ? 3 : 7;

    const validTaps = [...taps, now].filter(t => now - t < WINDOW_MS);
    setTaps(validTaps);

    if (validTaps.length >= threshold) {
      console.log('[GO] Admin Protocol Initiated');
      window.dispatchEvent(new CustomEvent('go-admin-unlock'));
      setTaps([]);
    }
  };

  return (
    <header className="relative z-50 bg-glass border-b border-go-strong backdrop-blur-xl">
      <div className="px-6 lg:px-12 xl:px-24 py-4 flex items-center gap-4 h-16">
        <motion.div
          initial={reducedMotion ? {} : { opacity: 0, y: -8, scale: 0.96 }}
          animate={reducedMotion ? {} : { opacity: 1, y: 0, scale: 1 }}
          transition={reducedMotion ? {} : { duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          className="flex items-center gap-4 cursor-pointer select-none"
          onClick={handleLogoInteraction}
        >
          <img
            src="/brand/go-mark.png"
            srcSet="/brand/go-mark@2x.png 2x"
            alt="GO Line"
            width={144}
            height={80}
            className="h-10 lg:h-12 w-auto object-contain transition-go hover:opacity-90"
          />
          <span className="text-[10px] font-sans font-medium text-go-muted uppercase tracking-widest">GO // 2.1</span>
        </motion.div>
      </div>

      {/* Temporary Admin Trigger - Phase B3 */}
      {process.env.NEXT_PUBLIC_ADMIN_ENABLED === 'true' && (
        <button
          className="fixed bottom-4 right-4 z-[9999] text-[10px] font-mono text-red-500 opacity-50 hover:opacity-100 border border-red-500 px-2 py-1 rounded bg-black/80"
          onClick={() => window.dispatchEvent(new CustomEvent('go-admin-unlock'))}
        >
          ADMIN DEBUG
        </button>
      )}
    </header>
  );
}
