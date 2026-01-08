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
      <div className="h-full flex items-center justify-center bg-glass border border-go rounded-xl">
        <p className="text-go-muted text-sm font-sans">Enter your desired outcome to begin</p>
      </div>
    );
  }

  // Calculating State
  if (state === 'calculating') {
    return (
      <div className="h-full flex items-center justify-center bg-glass border border-go rounded-xl relative overflow-hidden">
        {/* Abstract motion: numbers, symbols, molecules */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="grid grid-cols-3 gap-4 opacity-30">
            {[...Array(9)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0.8, 1.2, 0.8],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.1,
                  ease: 'easeInOut',
                }}
                className="text-amber text-2xl font-mono"
              >
                {['+', '×', '≈', '→', '•', '≡', '∞', 'Δ', '∑'][i]}
              </motion.div>
            ))}
          </div>
        </motion.div>
        {/* GO logo may animate as part of resolution */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative z-10"
        >
          <img
            src="/brand/go-mark.png"
            srcSet="/brand/go-mark@2x.png 2x"
            alt="GO"
            width={80}
            height={44}
            className="h-10 w-auto object-contain opacity-60"
          />
        </motion.div>
      </div>
    );
  }

  // Resolved State - Blend Visualization
  if (state === 'resolved' && mode === 'blend') {
    return (
      <div className="h-full bg-glass border border-go rounded-xl p-6">
        <div className="h-full flex items-center justify-center">
          <div className="text-center space-y-4">
            <h3 className="text-go font-serif text-xl mb-4">Blend Visualization</h3>
            {/* Overlapping/merged forms representing simultaneous consumption */}
            <div className="relative w-48 h-48 mx-auto">
              {blendData?.primaryBlend?.map((cultivar: any, idx: number) => {
                const size = 80 + idx * 20;
                const rotation = idx * 45;
                return (
                  <motion.div
                    key={cultivar.id || idx}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 0.7, scale: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    className="absolute inset-0 flex items-center justify-center"
                    style={{
                      width: `${size}px`,
                      height: `${size}px`,
                      left: '50%',
                      top: '50%',
                      transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
                    }}
                  >
                    <div
                      className="rounded-full border-2"
                      style={{
                        width: '100%',
                        height: '100%',
                        borderColor: getColorForRole(cultivar.role),
                        backgroundColor: `${getColorForRole(cultivar.role)}20`,
                      }}
                    />
                  </motion.div>
                );
              }) || (
                <div className="w-full h-full flex items-center justify-center text-go-muted text-sm">
                  Blend data loading...
                </div>
              )}
            </div>
            <p className="text-go-muted text-xs">Simultaneous consumption</p>
          </div>
        </div>
      </div>
    );
  }

  // Resolved State - Stack Visualization
  if (state === 'resolved' && mode === 'stack') {
    return (
      <div className="h-full bg-glass border border-go rounded-xl p-6">
        <div className="h-full flex items-center justify-center">
          <div className="text-center space-y-4">
            <h3 className="text-go font-serif text-xl mb-4">Stack Visualization</h3>
            {/* Layered/directional forms representing sequential consumption */}
            <div className="relative w-48 h-48 mx-auto">
              {blendData?.stackSegments?.map((segment: any, idx: number) => {
                const width = 60 + idx * 15;
                const left = idx * 30;
                return (
                  <motion.div
                    key={segment.id || idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 0.8, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="absolute bottom-0"
                    style={{
                      left: `${left}px`,
                      width: `${width}px`,
                      height: `${40 + idx * 20}px`,
                      backgroundColor: getColorForRole(segment.role || 'Anchor'),
                      border: `2px solid ${getColorForRole(segment.role || 'Anchor')}`,
                      borderRadius: '4px 4px 0 0',
                    }}
                  />
                );
              }) || (
                <div className="w-full h-full flex items-center justify-center text-go-muted text-sm">
                  Stack data loading...
                </div>
              )}
            </div>
            <p className="text-go-muted text-xs">Sequential consumption</p>
          </div>
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
      return '#d4af37'; // Amber for energy/primary
    case 'balance':
    case 'modifier':
      return '#8b9dc3'; // Blue-gray for balance
    case 'grounding':
      return '#6b8e23'; // Olive for grounding
    case 'calm':
    case 'synergist':
      return '#9b7fb8'; // Purple for calm
    default:
      return '#d4af37'; // Default amber
  }
}
