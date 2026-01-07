'use client';

import { useState } from 'react';

interface AgeGateProps {
  onComplete: () => void;
}

type GateStep = 'age' | 'experience' | 'onboarding';

export default function AgeGate({ onComplete }: AgeGateProps) {
  const [step, setStep] = useState<GateStep>('age');
  const [age, setAge] = useState('');
  const [ageError, setAgeError] = useState<string | null>(null);
  const [isFirstTime, setIsFirstTime] = useState<boolean | null>(null);

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
      onComplete();
    }
  };

  const handleOnboardingComplete = () => {
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
      <div className="relative max-w-lg w-full mx-4 bg-zinc-900 border border-zinc-800 p-8 lg:p-12">
        {step === 'age' && (
          <div className="space-y-6">
            <h2 className="font-serif text-3xl lg:text-4xl font-light text-white mb-2">Age Verification</h2>
            <p className="text-sm font-sans text-zinc-400 leading-relaxed">
              You must be 21 or older to use this calculator.
            </p>
            <form onSubmit={handleAgeSubmit} className="space-y-4">
              <div>
                <label htmlFor="age" className="block text-sm font-sans font-medium text-white mb-2">
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
                  className="w-full bg-zinc-800 border border-zinc-700 text-white px-4 py-3 font-sans focus:border-[#C5A065] focus:outline-none transition-colors"
                  placeholder="21"
                  autoFocus
                />
                {ageError && (
                  <p className="mt-2 text-sm font-sans text-red-400">{ageError}</p>
                )}
              </div>
              <button
                type="submit"
                className="w-full px-6 py-3 border border-[#C5A065] text-[#C5A065] text-xs font-sans uppercase tracking-widest hover:bg-[#C5A065] hover:text-black active:bg-[#B89555] transition-all duration-200 cursor-pointer"
              >
                Continue
              </button>
            </form>
          </div>
        )}

        {step === 'experience' && (
          <div className="space-y-6">
            <h2 className="font-serif text-3xl lg:text-4xl font-light text-white mb-2">Welcome</h2>
            <p className="text-sm font-sans text-zinc-400 leading-relaxed mb-6">
              Have you used this calculator before?
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => handleExperienceChoice('first-time')}
                className="w-full px-6 py-3 border border-zinc-700 text-white text-sm font-sans uppercase tracking-wider hover:border-zinc-500 active:border-zinc-400 transition-all duration-200 cursor-pointer text-left"
              >
                First time
              </button>
              <button
                onClick={() => handleExperienceChoice('returning')}
                className="w-full px-6 py-3 border border-zinc-700 text-white text-sm font-sans uppercase tracking-wider hover:border-zinc-500 active:border-zinc-400 transition-all duration-200 cursor-pointer text-left"
              >
                I've used it before
              </button>
            </div>
          </div>
        )}

        {step === 'onboarding' && isFirstTime && (
          <div className="space-y-6">
            <h2 className="font-serif text-3xl lg:text-4xl font-light text-white mb-6">How this works</h2>
            
            <div className="space-y-4 text-sm font-sans text-zinc-400 leading-relaxed">
              <p>
                Cannabis strains change by batch, grow, and availability.
              </p>
              <p>
                The feeling people like isn't tied to one strain name.
              </p>
              <p>
                This calculator uses strain math to match effects, not hype.
              </p>
              <p>
                You describe how you want to feel.
              </p>
              <p>
                The system calculates the closest match using real terpene and effect data.
              </p>
              <p>
                Sometimes that result is a single cultivar.
              </p>
              <p>
                Sometimes it's a blend that more accurately recreates the outcome.
              </p>
            </div>

            <div className="pt-4">
              <button
                onClick={handleOnboardingComplete}
                className="w-full px-6 py-3 border border-[#C5A065] text-[#C5A065] text-xs font-sans uppercase tracking-widest hover:bg-[#C5A065] hover:text-black active:bg-[#B89555] transition-all duration-200 cursor-pointer"
              >
                Start
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

