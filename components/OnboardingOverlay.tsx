'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface OnboardingOverlayProps {
  onComplete: () => void;
  onSkip: () => void;
}

export default function OnboardingOverlay({ onComplete, onSkip }: OnboardingOverlayProps) {
  const [step, setStep] = useState(1);
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

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onSkip();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0A0A0A] text-white"
      >
        <motion.div
          initial={reducedMotion ? {} : { opacity: 0, scale: 0.95, y: 8 }}
          animate={reducedMotion ? {} : { opacity: 1, scale: 1, y: 0 }}
          transition={reducedMotion ? {} : { duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="relative max-w-2xl w-full mx-4 bg-[#111216] border border-white/10 rounded-xl p-8 lg:p-12 shadow-2xl"
        >
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={reducedMotion ? {} : { opacity: 0, x: -8 }}
                animate={reducedMotion ? {} : { opacity: 1, x: 0 }}
                exit={reducedMotion ? {} : { opacity: 0, x: 8 }}
                transition={reducedMotion ? {} : { duration: 0.3 }}
                className="space-y-6"
              >
                <h2 className="font-serif text-3xl lg:text-4xl font-light text-go mb-2">
                  What is the Guided Outcome Calculator?
                </h2>
                <div className="space-y-4 text-sm font-sans text-go-muted leading-relaxed">
                  <p>
                    The Guided Outcome Calculator translates your desired mental or physical state into structured cannabis blends. Instead of recommending a single strain, it builds intentional combinations that work together to achieve your goal.
                  </p>
                  <p>
                    The system uses real lab-tested terpene and cannabinoid data to calculate how different strains interact when combined. This allows for more reliable and predictable outcomes than single-strain recommendations.
                  </p>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={reducedMotion ? {} : { opacity: 0, x: -8 }}
                animate={reducedMotion ? {} : { opacity: 1, x: 0 }}
                exit={reducedMotion ? {} : { opacity: 0, x: 8 }}
                transition={reducedMotion ? {} : { duration: 0.3 }}
                className="space-y-6"
              >
                <h2 className="font-serif text-3xl lg:text-4xl font-light text-go mb-2">
                  Simultaneous Blends vs Sequential Stacks
                </h2>
                <div className="space-y-4 text-sm font-sans text-go-muted leading-relaxed">
                  <div>
                    <h3 className="text-go font-medium mb-2">Simultaneous Blend</h3>
                    <p>
                      Represents simultaneous consumption. All components are consumed together, and their effects resolve together. The visualization uses overlapping or merged forms to show how compounds interact.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-go font-medium mb-2">Sequential Stack</h3>
                    <p>
                      Represents ordered consumption. Components are consumed in a specific sequence, and the order determines the progression of effects. The visualization uses layered or directional forms to show the sequence.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={reducedMotion ? {} : { opacity: 0, x: -8 }}
                animate={reducedMotion ? {} : { opacity: 1, x: 0 }}
                exit={reducedMotion ? {} : { opacity: 0, x: 8 }}
                transition={reducedMotion ? {} : { duration: 0.3 }}
                className="space-y-6"
              >
                <h2 className="font-serif text-3xl lg:text-4xl font-light text-go mb-2">
                  Reading Visualizations and Results
                </h2>
                <div className="space-y-4 text-sm font-sans text-go-muted leading-relaxed">
                  <p>
                    The visualization panel shows the system's reasoning process. During calculation, you'll see abstract motion representing the analysis. Once resolved, you'll see either a Blend or Stack visualization depending on your selected mode.
                  </p>
                  <p>
                    Colors in the visualization encode functional roles: Energy, Balance, Grounding, Calm. These are not decorative—they represent how each component contributes to your desired outcome.
                  </p>
                  <p>
                    Results show multiple blend recommendations. You can select between options to compare different approaches to achieving your goal.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-between mt-8 pt-6 border-t border-go">
            <button
              onClick={handleSkip}
              className="text-sm font-sans text-go-muted hover:text-go transition-go uppercase tracking-wider"
            >
              Skip
            </button>
            <div className="flex items-center gap-2">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`w-2 h-2 rounded-full transition-go ${s === step ? 'bg-amber' : 'bg-go-border'
                    }`}
                />
              ))}
            </div>
            <button
              onClick={handleNext}
              className="px-6 py-3 border-2 border-amber text-amber text-xs font-sans uppercase tracking-widest hover:bg-amber hover:text-go-bg active:bg-amber-active hover:shadow-amber-sm transition-go cursor-pointer rounded-lg font-medium"
            >
              {step < 3 ? 'Next' : 'Start'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
