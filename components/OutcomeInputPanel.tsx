'use client';

import { motion } from 'framer-motion';
import OutcomeIntentInput from './OutcomeIntentInput';

interface OutcomeInputPanelProps {
  userInput: string;
  currentClarification: { type: string; question: string; options: string[] } | null;
  clarificationAnswers: Record<string, string | string[]>;
  isProcessing: boolean;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
  onClarificationAnswer: (questionType: string, answer: string, isMultiSelect?: boolean) => void;
  onClearClarification: () => void;
}

export default function OutcomeInputPanel({
  userInput,
  currentClarification,
  clarificationAnswers,
  isProcessing,
  onInputChange,
  onSubmit,
  onClarificationAnswer,
  onClearClarification,
}: OutcomeInputPanelProps) {
  return (
    <section className="max-w-3xl mx-auto">
      {/* Logo - Hero Element with Intentional Animation */}
      <motion.div
        initial={{ opacity: 0, y: 8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ 
          duration: 0.5,
          ease: 'easeOut',
          delay: 0.1
        }}
        className="mb-10 flex flex-col items-start"
      >
        <div className="relative">
          {/* Subtle ambient glow behind logo (very low opacity) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
            className="absolute -inset-8 -z-10 bg-accent/3 blur-3xl rounded-full"
          />
          
          {/* Logo */}
          <img
            src="/brand/go-mark.png"
            srcSet="/brand/go-mark@2x.png 2x"
            alt="GO Line"
            width={144}
            height={80}
            className="h-14 lg:h-16 max-h-[56px] lg:max-h-[64px] w-auto object-contain"
            style={{
              display: "block",
              objectFit: "contain"
            }}
          />
          
          {/* Subtle divider line that draws in */}
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: '100%', opacity: 0.2 }}
            transition={{
              duration: 0.6,
              ease: 'easeOut',
              delay: 0.6
            }}
            className="h-px bg-gradient-to-r from-accent/20 via-accent/10 to-transparent mt-6"
          />
        </div>
      </motion.div>

      {/* Headline and Description */}
      <div className="mb-8">
        <h1 className="font-serif text-5xl lg:text-7xl font-light text-white leading-tight mb-6">
          Calculate Your Outcome
        </h1>
        <p className="text-sm lg:text-base font-sans text-zinc-400 max-w-md border-l border-zinc-700 pl-4">
          Describe your desired physical and mental state. The system will calculate a precise blend formulation to match your needs.
        </p>
      </div>

      {/* Current Clarification Question - Inline above input */}
      {currentClarification && (
        <div className="mb-6 p-4 border border-zinc-800 bg-zinc-900/50 overflow-y-auto">
          <p className="text-sm font-sans text-white mb-4 break-words">{currentClarification.question}</p>
          <div className="flex flex-col items-start gap-2">
            {currentClarification.options.map((option) => {
              const isSelected = clarificationAnswers[currentClarification.type] === option ||
                (Array.isArray(clarificationAnswers[currentClarification.type]) && 
                 (clarificationAnswers[currentClarification.type] as string[]).includes(option));

              return (
                <button
                  key={option}
                  onClick={() => onClarificationAnswer(
                    currentClarification.type, 
                    option, 
                    currentClarification.type === 'tolerance' || currentClarification.type === 'priority'
                  )}
                  className={`text-sm font-sans transition-all duration-200 text-left relative py-2 px-0 break-words ${
                    isSelected
                      ? 'text-white font-medium pl-6'
                      : 'text-zinc-400 hover:text-zinc-200 pl-0 hover:pl-2'
                  }`}
                >
                  <span className={`absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white transition-all duration-200 ${
                    isSelected ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
                  }`} />
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="mb-8 border-b border-zinc-700 focus-within:border-accent transition-colors duration-300 py-4">
        <OutcomeIntentInput
          value={userInput}
          onChange={onInputChange}
          onSubmit={onSubmit}
          disabled={isProcessing || !!currentClarification}
        />
      </div>

      <div className="mt-8 flex items-center gap-8">
        <button
          onClick={onSubmit}
          disabled={!userInput.trim() || isProcessing}
          className={`
            text-sm font-medium tracking-widest uppercase transition-all duration-200 flex items-center gap-4 px-8 py-4
            ${userInput.trim() 
              ? 'text-black bg-accent hover:bg-accent-hover active:bg-accent-active cursor-pointer' 
              : 'text-zinc-500 bg-zinc-900 border border-zinc-800 cursor-not-allowed opacity-50'}
          `}
        >
          <span>Calculate My Outcome</span>
        </button>
      </div>
    </section>
  );
}



