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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0A0A0A] text-white">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-lg p-8 mx-4 bg-[#111216] border border-white/10 rounded-2xl shadow-2xl relative"
      >
        {/* Decorative Grid Background */}
        <div className="absolute inset-0 bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:16px_16px] opacity-5 pointer-events-none rounded-2xl" />

        <AnimatePresence mode="wait">
          {step === 'age' && (
            <motion.div
              key="age"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.3 }}
              className="relative z-10 space-y-8"
            >
              <div className="text-center space-y-2">
                <img
                  src="/brand/go-mark.png"
                  alt="GO"
                  className="h-10 w-auto mx-auto mb-6 opacity-80"
                />
                <h2 className="text-3xl font-serif font-light text-white">Age Verification</h2>
                <p className="text-sm text-gray-400 font-sans">
                  You must be 21 or older to access this interface.
                </p>
              </div>

              <form onSubmit={handleAgeSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="age" className="block text-xs uppercase tracking-widest text-gray-500 font-bold">
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
                    className="w-full bg-black/40 border border-white/20 text-white text-lg px-4 py-4 rounded-lg focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] focus:outline-none transition-all placeholder-gray-700 font-mono"
                    placeholder="21"
                    autoFocus
                  />
                  {ageError && (
                    <p className="text-sm text-red-500 mt-2">{ageError}</p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#D4AF37] hover:bg-[#E5C158] text-black font-bold uppercase tracking-widest py-4 rounded-lg shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:shadow-[0_0_30px_rgba(212,175,55,0.5)] transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  I am 21+ and confirm
                </button>
              </form>
            </motion.div>
          )}

          {step === 'experience' && (
            <motion.div
              key="experience"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.3 }}
              className="relative z-10 space-y-8"
            >
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-serif font-light text-white">Welcome</h2>
                <p className="text-sm text-gray-400 font-sans">
                  Configure your experience level.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <button
                  onClick={() => handleExperienceChoice('first-time')}
                  className="group relative p-6 border border-white/20 rounded-xl hover:bg-white/5 transition-all text-left space-y-2 hover:border-[#D4AF37]"
                >
                  <span className="block text-lg font-medium text-white group-hover:text-[#D4AF37] transition-colors">First time</span>
                  <span className="block text-sm text-gray-500">I want to understand how the system works.</span>
                </button>

                <button
                  onClick={() => handleExperienceChoice('returning')}
                  className="group relative p-6 border border-white/20 rounded-xl hover:bg-white/5 transition-all text-left space-y-2 hover:border-[#D4AF37]"
                >
                  <span className="block text-lg font-medium text-white group-hover:text-[#D4AF37] transition-colors">Returning user</span>
                  <span className="block text-sm text-gray-500">Skip the introduction and start calculating.</span>
                </button>
              </div>
            </motion.div>
          )}

          {step === 'onboarding' && isFirstTime && (
            <motion.div
              key="onboarding"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.3 }}
              className="relative z-10 space-y-6"
            >
              <div className="space-y-4">
                <h2 className="text-2xl font-serif text-white">Guided Outcomes</h2>
                <div className="h-px w-12 bg-[#D4AF37]" />
                <p className="text-sm text-gray-300 leading-relaxed">
                  This system builds intentional cultivar blends based on your desired physical and mental state.
                </p>
                <p className="text-sm text-gray-300 leading-relaxed">
                  Most effects are biphasic—meaning they change based on dose and combination. We use structured resolution to ensure your blend aligns with your intent.
                </p>
              </div>

              <button
                onClick={handleOnboardingComplete}
                className="w-full mt-4 bg-[#D4AF37] hover:bg-[#E5C158] text-black font-bold uppercase tracking-widest py-4 rounded-lg shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-all"
              >
                Enter System
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
