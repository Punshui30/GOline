'use client';

import ResolutionPanel, { type ResolvedBlend } from './ResolutionPanel';
import type { OutcomeIntent } from '@/lib/goOutcomeEngine';
import type { DeterministicExplanation } from '@/lib/outcomeBrain/deterministicExplanation';

interface ResultPanelProps {
  blend: ResolvedBlend;
  intent: OutcomeIntent | null;
  isProcessing: boolean;
  deterministicExplanation: DeterministicExplanation | null;
  onRefineOutcome: () => void;
  onShowUsageProtocol: () => void;
  onAdjustment: (adjustedIntent: {
    activationTarget: number;
    cognitiveEndurance: number;
    anxietySensitivity: number;
  }) => void;
  hasResolved: boolean;
}

export default function ResultPanel({
  blend,
  intent,
  isProcessing,
  deterministicExplanation,
  onRefineOutcome,
  onShowUsageProtocol,
  onAdjustment,
  hasResolved,
}: ResultPanelProps) {
  return (
    <section className="max-w-5xl mx-auto min-h-0">
      <ResolutionPanel
        blend={blend}
        intent={intent ? {
          activationTarget: intent.activationTarget || 0.5,
          cognitiveEndurance: intent.cognitiveEndurance || 0.5,
          anxietySensitivity: intent.anxietySensitivity || 0.5,
        } : undefined}
        isComputing={isProcessing}
        onRefineOutcome={onRefineOutcome}
        onShowUsageProtocol={onShowUsageProtocol}
        onAdjustment={onAdjustment}
        isAnimating={!isProcessing}
        hasResolved={hasResolved}
        deterministicExplanation={deterministicExplanation || undefined}
      />
    </section>
  );
}



