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

      {/* Logo - Hero Element with Strengthened Animation */}
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ 
          duration: 0.65,
          ease: 'easeOut',
          delay: 0.05
        }}
        className="mb-10 flex flex-col items-start"
      >
        <div className="relative">
          {/* Subtle ambient glow behind logo (slightly more visible) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.9, ease: 'easeOut', delay: 0.2 }}
            className="absolute -inset-10 -z-10 bg-accent/5 blur-3xl rounded-full"
          />
          
          {/* Logo - Increased prominence */}
          <img
            src="/brand/go-mark.png"
            srcSet="/brand/go-mark@2x.png 2x"
            alt="GO Line"
            width={144}
            height={80}
            className="h-16 lg:h-20 max-h-[64px] lg:max-h-[80px] w-auto object-contain brightness-110"
            style={{
              display: "block",
              objectFit: "contain"
            }}
          />
          
          {/* Visual anchor divider - more prominent */}
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: '100%', opacity: 0.35 }}
            transition={{
              duration: 0.75,
              ease: 'easeOut',
              delay: 0.7
            }}
            className="h-[1.5px] bg-gradient-to-r from-accent/30 via-accent/15 to-transparent mt-7"
          />
        </div>
      </motion.div>

      {/* Headline and Description */}
      <div className="mb-8">
        <h1 className="font-serif text-5xl lg:text-7xl font-light text-white leading-tight mb-6">
          Calculate Your Outcome
        </h1>
        <p className="text-sm lg:text-base font-sans text-zinc-400 max-w-md border-l border-zinc-700 pl-4 mb-6">
          Describe your desired physical and mental state. The system will calculate a precise blend formulation to match your needs.
        </p>
        
        {/* Inventory-based accuracy explanation */}
        <div className="max-w-md mt-6 pt-4 border-t border-zinc-800/50">
          <p className="text-xs lg:text-sm font-sans text-zinc-500 leading-relaxed">
            <span className="font-medium text-zinc-400">How results stay accurate.</span>{' '}
            Outcomes are calculated using actual strains available from participating dispensaries, based on lab-tested terpene and cannabinoid profiles. When inventory changes, recommendations adjust automatically, using real percentage data rather than averages or strain names alone. This keeps outcomes consistent with what's actually on the menu where you're shopping.
          </p>
        </div>
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



