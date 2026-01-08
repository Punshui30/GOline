'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AgeGateProps {
  onComplete: (userAge: number) => void;
}

type GateStep = 'age' | 'experience' | 'onboarding';

export default function AgeGate({ onComplete }: AgeGateProps) {
  const [step, setStep] = useState<GateStep>('age');
  const [age, setAge] = useState('');
  const [ageError, setAgeError] = useState<string | null>(null);
  const [isFirstTime, setIsFirstTime] = useState<boolean | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log('[AGEGATE] Modal overlay mounted - does not control layout');
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReducedMotion(mediaQuery.matches);
    }
  }, []);

  const handleAgeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAgeError(null);

    const ageNum = parseInt(age, 10);
    if (isNaN(ageNum) || ageNum < 1) {
      setAgeError('Please enter a valid age');
      return;
    }

    if (ageNum < 21) {
      setAgeError('You must be 21 or older to use this calculator');
      return;
    }

    setStep('experience');
  };

  const handleExperienceChoice = (choice: 'first-time' | 'returning') => {
    if (choice === 'first-time') {
      setIsFirstTime(true);
      setStep('onboarding');
    } else {
      const ageNum = parseInt(age, 10);
      onComplete(ageNum);
    }
  };

  const handleOnboardingComplete = () => {
    const ageNum = parseInt(age, 10);
    onComplete(ageNum);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={reducedMotion ? {} : { opacity: 0 }}
        animate={reducedMotion ? {} : { opacity: 1 }}
        exit={reducedMotion ? {} : { opacity: 0 }}
        transition={reducedMotion ? {} : { duration: 0.3 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-go/95 backdrop-blur-xl"
      >
        <motion.div
          initial={reducedMotion ? {} : { opacity: 0, scale: 0.95, y: 8 }}
          animate={reducedMotion ? {} : { opacity: 1, scale: 1, y: 0 }}
          transition={reducedMotion ? {} : { duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="relative max-w-lg w-full mx-4 bg-glass-elevated border border-go rounded-xl p-8 lg:p-12 shadow-2xl"
        >
          <AnimatePresence mode="wait">
            {step === 'age' && (
              <motion.div
                key="age"
                initial={reducedMotion ? {} : { opacity: 0, x: -8 }}
                animate={reducedMotion ? {} : { opacity: 1, x: 0 }}
                exit={reducedMotion ? {} : { opacity: 0, x: 8 }}
                transition={reducedMotion ? {} : { duration: 0.3 }}
                className="space-y-6"
              >
                <h2 className="font-serif text-3xl lg:text-4xl font-light text-go mb-2">Age Verification</h2>
                <p className="text-sm font-sans text-go-muted leading-relaxed">
                  You must be 21 or older to use this calculator.
                </p>
                <form onSubmit={handleAgeSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="age" className="block text-sm font-sans font-medium text-go mb-2">
                      Enter your age
                    </label>
                    <input
                      id="age"
                      type="number"
                      min="1"
                      max="120"
                      value={age}
                      onChange={(e) => {
                        setAge(e.target.value);
                        setAgeError(null);
                      }}
                      className="w-full bg-glass border border-go text-go px-4 py-3 font-sans rounded-lg focus:border-amber focus:outline-none focus:ring-1 focus:ring-amber/20 transition-go"
                      placeholder="21"
                      autoFocus
                    />
                    {ageError && (
                      <p className="mt-2 text-sm font-sans text-red-400">{ageError}</p>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="w-full px-6 py-3 border border-amber text-amber text-xs font-sans uppercase tracking-widest hover:bg-amber hover:text-go-bg active:bg-amber-active transition-go cursor-pointer rounded-lg"
                  >
                    Continue
                  </button>
                </form>
              </motion.div>
            )}

            {step === 'experience' && (
              <motion.div
                key="experience"
                initial={reducedMotion ? {} : { opacity: 0, x: -8 }}
                animate={reducedMotion ? {} : { opacity: 1, x: 0 }}
                exit={reducedMotion ? {} : { opacity: 0, x: 8 }}
                transition={reducedMotion ? {} : { duration: 0.3 }}
                className="space-y-6"
              >
                <h2 className="font-serif text-3xl lg:text-4xl font-light text-go mb-2">Welcome</h2>
                <p className="text-sm font-sans text-go-muted leading-relaxed mb-6">
                  Have you used this calculator before?
                </p>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => handleExperienceChoice('first-time')}
                    className="w-full px-6 py-3 border border-go text-go text-sm font-sans uppercase tracking-wider hover:border-amber active:border-amber transition-go cursor-pointer text-left rounded-lg"
                  >
                    First time
                  </button>
                  <button
                    onClick={() => handleExperienceChoice('returning')}
                    className="w-full px-6 py-3 border border-go text-go text-sm font-sans uppercase tracking-wider hover:border-amber active:border-amber transition-go cursor-pointer text-left rounded-lg"
                  >
                    I've used it before
                  </button>
                </div>
              </motion.div>
            )}

            {step === 'onboarding' && isFirstTime && (
              <motion.div
                key="onboarding"
                initial={reducedMotion ? {} : { opacity: 0, x: -8 }}
                animate={reducedMotion ? {} : { opacity: 1, x: 0 }}
                exit={reducedMotion ? {} : { opacity: 0, x: 8 }}
                transition={reducedMotion ? {} : { duration: 0.3 }}
                className="space-y-6"
              >
                <h2 className="font-serif text-3xl lg:text-4xl font-light text-go mb-6">How this works</h2>
                <div className="space-y-4 text-sm font-sans text-go-muted leading-relaxed">
                  <p>
                    This system doesn't recommend a single strain—it builds intentional blends. Each strain contains many compounds that can interact differently depending on how they're combined. Some effects stack, some balance out, and some only work within certain ranges.
                  </p>
                  <p>
                    By blending multiple strains together, the system can more reliably recreate the feeling you're looking for, even when individual strains vary or aren't available. Behind the scenes, it uses real cannabis knowledge and structured math to weigh those interactions and turn your goal into a blend designed to work consistently. The result is less guesswork and a more predictable experience.
                  </p>
                </div>
                <div className="pt-4">
                  <button
                    onClick={handleOnboardingComplete}
                    className="w-full px-6 py-3 border border-amber text-amber text-xs font-sans uppercase tracking-widest hover:bg-amber hover:text-go-bg active:bg-amber-active transition-go cursor-pointer rounded-lg"
                  >
                    Start
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
