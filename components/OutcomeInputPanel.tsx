'use client';

import { motion } from 'framer-motion';
import OutcomeIntentInput from './OutcomeIntentInput';

type ConsumptionMode = 'blend' | 'stack';

interface OutcomeInputPanelProps {
  userInput: string;
  mode: ConsumptionMode;
  currentClarification: { type: string; question: string; options: string[] } | null;
  clarificationAnswers: Record<string, string | string[]>;
  isProcessing: boolean;
  onInputChange: (value: string) => void;
  onModeChange: (mode: ConsumptionMode) => void;
  onSubmit: () => void;
  onClarificationAnswer: (questionType: string, answer: string, isMultiSelect?: boolean) => void;
  onClearClarification: () => void;
}

export default function OutcomeInputPanel({
  userInput,
  mode,
  currentClarification,
  clarificationAnswers,
  isProcessing,
  onInputChange,
  onModeChange,
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
          {/* Subtle ambient glow behind logo */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.9, ease: 'easeOut', delay: 0.2 }}
            className="absolute -inset-10 -z-10 bg-energy/5 blur-3xl rounded-full"
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
            className="h-[1.5px] bg-gradient-to-r from-energy/30 via-energy/15 to-transparent mt-7"
          />
        </div>
      </motion.div>

      {/* Headline and Description */}
      <div className="mb-8">
        <h1 className="font-serif text-5xl lg:text-7xl font-light text-go leading-tight mb-6 tracking-tight">
          Calculate Your Outcome
        </h1>
        <p className="text-sm lg:text-base font-sans text-go-muted max-w-md border-l border-go ml-1 pl-5 mb-6 leading-relaxed">
          Describe your desired physical and mental state. The system will calculate a precise blend formulation to match your needs.
        </p>

        {/* Inventory-based accuracy explanation */}
        <div className="max-w-md mt-6 pt-6 border-t border-go">
          <p className="text-xs lg:text-sm font-sans text-go-subtle leading-relaxed">
            <span className="font-medium text-go-muted">How results stay accurate.</span>{' '}
            Outcomes are calculated using actual strains available from participating dispensaries, based on lab-tested terpene and cannabinoid profiles. When inventory changes, recommendations adjust automatically, using real percentage data rather than averages or strain names alone.
          </p>
        </div>
      </div>

      {/* Current Clarification Question - Glass Container */}
      {currentClarification && (
        <div className="mb-8 p-6 bg-glass rounded-2xl overflow-y-auto shadow-lg backdrop-blur-xl">
          <p className="text-sm font-sans text-go mb-5 break-words font-medium tracking-wide border-b border-go pb-4">{currentClarification.question}</p>
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
                  className={`text-sm font-sans transition-all duration-300 text-left relative py-3 px-4 rounded-lg w-full break-words ${isSelected
                      ? 'text-nearblack bg-energy font-medium shadow-amber-sm'
                      : 'text-go-muted hover:text-go hover:bg-white/5'
                    }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Mode Selector */}
      <div className="mb-8">
        <label className="block text-[10px] font-sans font-semibold text-go-subtle uppercase tracking-[0.2em] mb-4">
          Consumption Mode
        </label>
        <div className="flex gap-4">
          <button
            onClick={() => onModeChange('blend')}
            className={`flex-1 px-6 py-4 border rounded-xl text-sm font-sans uppercase tracking-widest transition-go ${mode === 'blend'
                ? 'border-energy text-energy bg-energy/5 shadow-amber-sm' // Active
                : 'border-go text-go-muted hover:border-go-strong hover:bg-white/5' // Inactive
              }`}
          >
            Simultaneous Blend
          </button>
          <button
            onClick={() => onModeChange('stack')}
            className={`flex-1 px-6 py-4 border rounded-xl text-sm font-sans uppercase tracking-widest transition-go ${mode === 'stack'
                ? 'border-energy text-energy bg-energy/5 shadow-amber-sm' // Active
                : 'border-go text-go-muted hover:border-go-strong hover:bg-white/5' // Inactive
              }`}
          >
            Sequential Stack
          </button>
        </div>
      </div>

      <div className="mb-10 border-b border-go focus-within:border-energy transition-colors duration-500 py-6">
        <label className="block text-[10px] font-sans font-semibold text-go-subtle uppercase tracking-[0.2em] mb-4">
          Desired Outcome
        </label>
        <OutcomeIntentInput
          value={userInput}
          onChange={onInputChange}
          onSubmit={onSubmit}
          disabled={isProcessing || !!currentClarification}
        />
      </div>

      <div className="mt-10 flex items-center gap-8">
        <button
          onClick={onSubmit}
          disabled={!userInput.trim() || isProcessing}
          className={`
            text-sm font-medium tracking-[0.2em] uppercase transition-all duration-300 flex items-center gap-4 px-10 py-5 rounded-xl
            ${userInput.trim()
              ? 'text-nearblack bg-energy hover:bg-energy/90 shadow-amber hover:shadow-amber-sm hover:-translate-y-0.5'
              : 'text-go-subtle bg-glass border border-go cursor-not-allowed opacity-50'}
          `}
        >
          <span>Calculate {mode === 'blend' ? 'Blend' : 'Stack'}</span>
        </button>
      </div>
    </section>
  );
}



