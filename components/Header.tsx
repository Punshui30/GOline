'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function Header() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReducedMotion(mediaQuery.matches);
      
      const handleChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  return (
    <header className="relative z-50 bg-glass border-b border-go-strong backdrop-blur-xl">
      <div className="px-6 lg:px-12 xl:px-24 py-4 flex items-center gap-4 h-16">
        <motion.div
          initial={reducedMotion ? {} : { opacity: 0, y: -8, scale: 0.96 }}
          animate={reducedMotion ? {} : { opacity: 1, y: 0, scale: 1 }}
          transition={reducedMotion ? {} : { duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          className="flex items-center gap-4"
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
    </header>
  );
}
