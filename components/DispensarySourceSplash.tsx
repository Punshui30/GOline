'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';

const DISPENSARY_LOGOS = [
  {
    name: 'Curio',
    src: '/dispensaries/curio.png',
  },
  {
    name: 'Evermore',
    src: '/dispensaries/evermore.png',
  },
  {
    name: 'gLeaf',
    src: '/dispensaries/gleaf.png',
  },
];

export default function DispensarySourceSplash({
  onContinue,
}: {
  onContinue: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen w-full flex items-center justify-center"
    >
      <div className="flex flex-col items-center gap-8">
        {/* Headline */}
        <div className="text-center">
          <p className="text-xs uppercase tracking-wide text-white/50">
            Calculated from real dispensary menus
          </p>
          <h2 className="mt-2 text-lg text-white/80">
            GO Line uses live inventory and lab-tested data
          </h2>
        </div>

        {/* Logo carousel row (static, no gimmicks) */}
        <div className="flex items-center gap-10 opacity-60">
          {DISPENSARY_LOGOS.map((d) => (
            <div
              key={d.name}
              className="relative h-10 w-40 flex items-center justify-center"
            >
              <Image
                src={d.src}
                alt={d.name}
                fill
                className="object-contain"
                priority
              />
            </div>
          ))}
        </div>

        {/* Continue action */}
        <button
          onClick={onContinue}
          className="mt-4 px-6 py-2 border border-white/20 text-sm text-white/80 hover:border-white/40 transition"
        >
          Continue
        </button>
      </div>
    </motion.div>
  );
}

