'use client';

export const dynamic = 'force-dynamic';

/**
 * UI Sandbox Route
 * 
 * Visual debugging and iteration environment for testing phase transitions,
 * animations, and component layouts without touching production logic.
 * 
 * This route:
 * - Always renders with mock data
 * - Exercises real UI components
 * - Shows phase transitions clearly
 * - Never touches resolver, LLM, or production flows
 */

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import OutcomeInputPanel from '@/components/OutcomeInputPanel';
import ResolvingPanel from '@/components/ResolvingPanel';
import ResultPanel from '@/components/ResultPanel';
import type { ResolvedBlend } from '@/components/ResolutionPanel';
import type { OutcomeIntent } from '@/lib/goOutcomeEngine';
import type { DeterministicExplanation } from '@/lib/outcomeBrain/deterministicExplanation';
import { phaseContainer } from '@/lib/motion';

type Phase = 'input' | 'resolving' | 'result';

// Mock data - hardcoded for visual testing
const MOCK_BLEND: ResolvedBlend = {
  resolutionMode: 'BLENDED',
  confidenceScore: 0.85,
  primaryBlend: [
    {
      id: 'blue-dream',
      name: 'Blue Dream',
      role: 'Anchor',
      percentage: 60,
      explanation: 'Primary energy and focus profile',
      chemotypeId: 'blue-dream',
    },
    {
      id: 'granddaddy-purple',
      name: 'Granddaddy Purple',
      role: 'Modifier',
      percentage: 40,
      explanation: 'Balancing body relaxation and calm',
      chemotypeId: 'granddaddy-purple',
    },
  ],
  tradeoffs: ['Higher energy comes with moderate body load'],
  rationaleSummary: 'This blend balances the energizing effects of Blue Dream with the calming body effects of Granddaddy Purple, creating a balanced functional experience.',
};

const MOCK_INTENT: OutcomeIntent = {
  activation: 0.7,
  anxietySensitivity: 0.5,
  cognitiveEndurance: 0.6,
  activationTarget: 0.7,
  bodyLoadPreference: 0.5,
};

const MOCK_EXPLANATION: DeterministicExplanation = {
  headline: 'This blend balances energy and relaxation',
  bullets: [
    'Blue Dream provides the primary energizing and focus-enhancing effects',
    'Granddaddy Purple adds body relaxation without excessive sedation',
    'The 60/40 ratio ensures the energy profile dominates while maintaining balance',
  ],
  confidenceNote: 'High confidence - well-matched profile',
};

export default function UISandbox() {
  const [phase, setPhase] = useState<Phase>('input');
  const [userInput, setUserInput] = useState('I want to feel focused and energized but relaxed');
  const [isProcessing, setIsProcessing] = useState(false);

  // Mock handlers
  const handleSubmit = () => {
    setIsProcessing(true);
    setPhase('resolving');
    
    // Auto-transition to result after delay
    setTimeout(() => {
      setIsProcessing(false);
      setPhase('result');
    }, 1500);
  };

  const handleRefineOutcome = () => {
    setPhase('input');
    setUserInput('I want to feel focused and energized but relaxed');
  };

  const handleShowUsageProtocol = () => {
    // Mock - just log for now
    console.log('Usage protocol clicked');
  };

  const handleAdjustment = () => {
    // Mock - could trigger re-render of result
    console.log('Adjustment made');
  };

  return (
    <div className="min-h-screen bg-noise text-[#E5E5E5] font-sans selection:bg-[#C5A065]/30 overflow-x-hidden flex flex-col">
      {/* Main content area - scrollable */}
      <main className="flex-1 w-full max-w-[1920px] mx-auto px-6 lg:px-12 xl:px-24 pb-32 pt-20 lg:pt-28 overflow-y-auto min-h-0">
        {/* Phase transitions with Framer Motion */}
        <AnimatePresence mode="wait">
          {/* Input Phase */}
          {phase === 'input' && (
            <motion.div
              key="input-phase"
              {...phaseContainer}
            >
              <OutcomeInputPanel
                userInput={userInput}
                currentClarification={null}
                clarificationAnswers={{}}
                isProcessing={isProcessing}
                onInputChange={setUserInput}
                onSubmit={handleSubmit}
                onClarificationAnswer={() => {}}
                onClearClarification={() => {}}
              />
            </motion.div>
          )}

          {/* Resolving Phase */}
          {phase === 'resolving' && (
            <motion.div
              key="resolving-phase"
              {...phaseContainer}
            >
              <div className="bg-zinc-950/60 rounded-lg p-8">
                <ResolvingPanel />
              </div>
            </motion.div>
          )}

          {/* Result Phase */}
          {phase === 'result' && (
            <motion.div
              key="result-phase"
              {...phaseContainer}
            >
              <ResultPanel
                blend={MOCK_BLEND}
                intent={MOCK_INTENT}
                isProcessing={false}
                deterministicExplanation={MOCK_EXPLANATION}
                onRefineOutcome={handleRefineOutcome}
                onShowUsageProtocol={handleShowUsageProtocol}
                onAdjustment={handleAdjustment}
                hasResolved={true}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Phase Control Debug Panel */}
        <div className="fixed bottom-4 right-4 z-50 bg-zinc-900/90 backdrop-blur-sm border border-zinc-800 rounded-lg p-4 text-xs">
          <div className="text-zinc-400 mb-2">Phase Controls</div>
          <div className="flex gap-2">
            <button
              onClick={() => setPhase('input')}
              className={`px-3 py-1 rounded ${
                phase === 'input' ? 'bg-[#C5A065] text-black' : 'bg-zinc-800 text-zinc-300'
              }`}
            >
              Input
            </button>
            <button
              onClick={() => setPhase('resolving')}
              className={`px-3 py-1 rounded ${
                phase === 'resolving' ? 'bg-[#C5A065] text-black' : 'bg-zinc-800 text-zinc-300'
              }`}
            >
              Resolving
            </button>
            <button
              onClick={() => setPhase('result')}
              className={`px-3 py-1 rounded ${
                phase === 'result' ? 'bg-[#C5A065] text-black' : 'bg-zinc-800 text-zinc-300'
              }`}
            >
              Result
            </button>
          </div>
          <div className="mt-2 text-zinc-500">Current: {phase}</div>
        </div>
      </main>

    </div>
  );
}

