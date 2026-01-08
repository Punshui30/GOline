'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

type VisualizationMode = 'blend' | 'stack';
type VisualizationState = 'idle' | 'calculating' | 'resolved';

interface VisualizationPanelProps {
  mode: VisualizationMode;
  state: VisualizationState;
  blendData?: any; // Will be typed properly when blend structure is finalized
}

export default function VisualizationPanel({ mode, state, blendData }: VisualizationPanelProps) {
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

  // Idle State
  if (state === 'idle') {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <p className="text-go-muted text-sm font-sans tracking-wide">Enter your desired outcome to begin</p>
      </div>
    );
  }

  // Calculating State
  if (state === 'calculating') {
    return (
      <div className="h-full flex items-center justify-center relative overflow-hidden p-6">
        {/* Abstract motion: numbers, symbols, molecules formulating */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1, // Sequential appearance
                delayChildren: 0.2
              }
            }
          }}
        >
          <div className="grid grid-cols-3 gap-6 opacity-30">
            {['+', '×', '≈', '→', '•', '≡', '∞', 'Δ', '∑'].map((symbol, i) => (
              <motion.div
                key={i}
                variants={{
                  hidden: { opacity: 0, scale: 0.8, filter: 'blur(4px)' },
                  visible: {
                    opacity: [0, 1, 0.4], // Fade in then settle
                    scale: 1,
                    filter: 'blur(0px)',
                    transition: {
                      duration: 0.8,
                      ease: [0.2, 0.65, 0.3, 0.9] // Smooth easing
                    }
                  }
                }}
                className="text-energy text-3xl font-mono flex items-center justify-center"
              >
                {symbol}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Central Anchor - Pulse gently */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10"
        >
          <img
            src="/brand/go-mark.png"
            srcSet="/brand/go-mark@2x.png 2x"
            alt="GO"
            width={80}
            height={44}
            className="h-10 w-auto object-contain opacity-80"
          />
        </motion.div>

        {/* Scanning beam effect - subtle */}
        <motion.div
          initial={{ top: '-10%', opacity: 0 }}
          animate={{ top: '110%', opacity: [0, 0.1, 0] }}
          transition={{ duration: 1.5, ease: 'easeInOut', repeat: Infinity, repeatDelay: 0.5 }}
          className="absolute inset-x-0 h-32 bg-gradient-to-b from-transparent via-energy/10 to-transparent pointer-events-none"
        />
      </div>
    );
  }

  // Resolved State - Blend Visualization
  if (state === 'resolved' && mode === 'blend') {
    return (
      <div className="h-full p-6 relative overflow-hidden flex flex-col items-center justify-center">
        {/* Subtle internal glow for depth */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"
        />

        <div className="relative z-10 w-full flex flex-col items-center">
          <motion.h3
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
            className="text-go font-serif text-2xl tracking-tight mb-8"
          >
            Blend Visualization
          </motion.h3>

          {/* Overlapping/merged forms representing simultaneous consumption */}
          <div className="relative w-64 h-64 flex items-center justify-center">
            {blendData?.primaryBlend?.map((cultivar: any, idx: number) => {
              // Size proportional to percentage, but kept large enough to overlap
              const baseSize = 140;
              const size = baseSize + (cultivar.percentage || 20);

              return (
                <motion.div
                  key={cultivar.id || idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 0.8, scale: 1 }}
                  // Deliberate, no bounce, staggered
                  transition={{
                    delay: 0.2 + (idx * 0.15),
                    duration: 0.6,
                    ease: [0.2, 0.65, 0.3, 0.9] // Custom calm bezier
                  }}
                  className="absolute flex items-center justify-center mix-blend-screen"
                  style={{
                    width: `${size}px`,
                    height: `${size}px`,
                    x: idx === 0 ? -20 : idx === 1 ? 20 : 0,
                    y: idx === 2 ? 20 : -10,
                  }}
                >
                  <div
                    className="rounded-full backdrop-blur-md"
                    style={{
                      width: '100%',
                      height: '100%',
                      backgroundColor: `${getColorForRole(cultivar.role)}40`, // Increased transparency for blending
                      border: `1px solid ${getColorForRole(cultivar.role)}80`,
                      boxShadow: `0 0 40px ${getColorForRole(cultivar.role)}20`,
                    }}
                  />
                </motion.div>
              );
            }) || (
                <div className="text-go-muted text-sm">Blend data loading...</div>
              )}
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="text-go-subtle text-xs uppercase tracking-widest mt-8"
          >
            Simultaneous consumption
          </motion.p>
        </div>
      </div>
    );
  }

  // Resolved State - Stack Visualization
  if (state === 'resolved' && mode === 'stack') {
    return (
      <div className="h-full p-6 relative overflow-hidden flex flex-col items-center justify-center">
        {/* Subtle internal glow for depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

        <div className="relative z-10 w-full flex flex-col items-center h-full max-h-full">
          <motion.h3
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
            className="text-go font-serif text-2xl tracking-tight mb-6 flex-shrink-0"
          >
            Stack Visualization
          </motion.h3>

          {/* Distinct ordered steps representing sequential consumption */}
          <div className="flex-1 w-full max-w-[240px] flex flex-col items-center justify-center gap-2 overflow-y-auto">
            {blendData?.stackSegments?.map((segment: any, idx: number) => (
              <motion.div
                key={segment.id || idx}
                initial={{ opacity: 0, x: -20, filter: 'blur(4px)' }}
                animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                transition={{ delay: idx * 0.25, duration: 0.5, ease: 'easeOut' }} // Slower stagger
                className="w-full flex items-center justify-center relative"
              >
                {/* Connector Line (except for last item) */}
                {idx < (blendData.stackSegments.length - 1) && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 16 }}
                    transition={{ delay: (idx * 0.25) + 0.4, duration: 0.3 }}
                    className="absolute bottom-[-16px] left-1/2 w-[1px] bg-go-border z-0"
                  />
                )}

                <div
                  className="w-full p-4 rounded-xl border backdrop-blur-sm shadow-lg flex items-center justify-between z-10"
                  style={{
                    borderColor: `${getColorForRole(segment.role)}`,
                    backgroundColor: `${getColorForRole(segment.role)}10`,
                  }}
                >
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-wider text-go-subtle">Step {idx + 1}</span>
                    <span className="text-sm font-medium text-go">{segment.name || segment.cultivar?.name}</span>
                  </div>
                  {/* Directional Indicator */}
                  <div className="text-xs opacity-50 text-current" style={{ color: getColorForRole(segment.role) }}>
                    ↓
                  </div>
                </div>
              </motion.div>
            )) || (
                <div className="text-go-muted text-sm">Stack data loading...</div>
              )}
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="text-go-subtle text-xs uppercase tracking-widest mt-6 flex-shrink-0"
          >
            Sequential consumption
          </motion.p>
        </div>
      </div>
    );
  }

  return null;
}

// Color encoding for functional roles
function getColorForRole(role: string): string {
  switch (role?.toLowerCase()) {
    case 'energy':
    case 'anchor':
      return '#D4AF37'; // Energy (Warm Amber)
    case 'balance':
    case 'modifier':
      return '#94A3B8'; // Balance (Cool Slate)
    case 'grounding':
      return '#4A5D23'; // Grounding (Deep Forest)
    case 'calm':
    case 'synergist':
      return '#9F9EB3'; // Calm (Muted Lavender)
    default:
      return '#D4AF37'; // Default Energy
  }
}
