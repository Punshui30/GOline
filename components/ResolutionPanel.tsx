// ResolutionPanel: Represents the "Monitor Surface" | "Presented Response"
// Design Philosophy: Swiss Style, International Typographic Style
// Strict Grid, Scaling Typography, No Decoration.

'use client';

import { useState, useEffect, useRef } from 'react';
import { OutcomeResult } from '@/lib/goOutcomeEngine';
import BlendVisualizer from './BlendVisualizer';
import OutcomeTransitionBanner from './OutcomeTransitionBanner';
import type { DeterministicExplanation } from '@/lib/outcomeBrain/deterministicExplanation';

// Interfaces matching the new "Editorial" data structure
export type CultivarRole = 'Anchor' | 'Modifier' | 'Synergist';

// Map internal role names to consumer-friendly display names
export function getRoleDisplayName(role: CultivarRole): string {
  switch (role) {
    case 'Anchor':
      return 'Primary Contributor';
    case 'Modifier':
      return 'Supporting Contributor';
    case 'Synergist':
      return 'Weighted Influence';
    default:
      return role;
  }
}

export interface ResolvedCultivar {
  id: string;
  name: string;
  role: CultivarRole;
  percentage: number;
  explanation: string;
  chemotypeId: string;
  weightGrams?: number;
}

export interface ResolvedBlend {
  resolutionMode: 'SINGLE_TARGET' | 'BLENDED' | 'FALLBACK';
  confidenceScore: number;
  stackingOptions?: { // Made optional to prevent TS errors if missing
    type: string;
    efficiencyScore: number;
  }[];
  // Allow flexible property names if strict types were causing issues, but stick to intent
  primaryBlend: ResolvedCultivar[];
  tradeoffs: string[];
  rationaleSummary: string;
  // Previously missing props that might have caused errors:
  cultivars?: ResolvedCultivar[]; // Alias for primaryBlend if engine uses this name
  stack?: any[]; // Alias for stackingOptions
  failure?: any;
}

interface ResolutionPanelProps {
  blend: ResolvedBlend | null;
  intent?: {
    activationTarget: number;
    cognitiveEndurance: number;
    anxietySensitivity: number;
  } | null;
  isComputing?: boolean;
  onRefineOutcome?: () => void;
  onShowUsageProtocol?: () => void;
  onAdjustment?: (adjustedIntent: {
    activationTarget: number;
    cognitiveEndurance: number;
    anxietySensitivity: number;
  }) => void;
  isAnimating?: boolean;
  hasResolved?: boolean;
  deterministicExplanation?: DeterministicExplanation;
}

export default function ResolutionPanel({ blend, intent, isComputing, onRefineOutcome, onShowUsageProtocol, onAdjustment, isAnimating = true, hasResolved = false, deterministicExplanation }: ResolutionPanelProps) {
  const [showAdjustments, setShowAdjustments] = useState(false);
  const [showWhy, setShowWhy] = useState(false);
  const [localIntent, setLocalIntent] = useState(intent || {
    activationTarget: 0.5,
    cognitiveEndurance: 0.5,
    anxietySensitivity: 0.5,
  });
  const adjustmentTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (intent) {
      setLocalIntent(intent);
    }
  }, [intent]);

  const handleAdjustmentChange = (field: 'activationTarget' | 'cognitiveEndurance' | 'anxietySensitivity', value: number) => {
    const updated = { ...localIntent, [field]: value };
    setLocalIntent(updated);
    
    // Debounce the adjustment callback
    if (adjustmentTimeoutRef.current) {
      clearTimeout(adjustmentTimeoutRef.current);
    }
    
    adjustmentTimeoutRef.current = setTimeout(() => {
      if (onAdjustment) {
        onAdjustment(updated);
      }
    }, 300); // 300ms debounce
  };

  const handleRefineOutcome = () => {
    setShowAdjustments(true);
    if (onRefineOutcome) {
      onRefineOutcome();
    }
  };

  // IDLE STATE (Presented as potential)
  if (!blend) {
    return (
      <div className="opacity-0 lg:opacity-100 transition-opacity duration-1000 delay-500 min-h-[50vh] flex flex-col justify-start pt-12">
        <div className="w-8 h-1 bg-[#C5A065] mb-8" />
        <p className="text-xs font-bold text-zinc-700 uppercase tracking-widest max-w-xs">
          System Ready
        </p>
      </div>
    );
  }

  // ACTIVE STATE
  return (
    <div className="flex flex-col gap-24 lg:gap-32 mb-32 text-[#E5E5E5] overflow-y-auto">

      {/* 1. Header: Primary Conclusion */}
      <section className="opacity-0 animate-[fadeIn_0.6s_ease-out_0.2s_forwards] overflow-y-auto">
        <div className="flex flex-col gap-6">
          <span className="text-[10px] font-sans font-medium uppercase tracking-[0.2em] text-zinc-500">
            Best Match
          </span>
          <h2 className="font-serif text-3xl lg:text-5xl font-light leading-tight tracking-tight text-white break-words">
            {blend.primaryBlend.length === 1
              ? 'One strain already matches what you want'
              : 'This blend best matches your desired outcome'}
          </h2>
        </div>
      </section>

      {/* 2. Composition (The Blend) */}
      <section className="opacity-0 animate-[fadeIn_0.6s_ease-out_0.4s_forwards]">
        <OutcomeTransitionBanner visible={hasResolved} />
        <h3 className="text-[10px] font-sans font-medium uppercase tracking-[0.2em] text-zinc-500 mb-12 mt-6">Blend Composition</h3>

        {/* Animated Visualizer Component */}
        <BlendVisualizer blend={blend} isAnimating={isAnimating} />

        {deterministicExplanation && (
          <div className="mt-10 border border-zinc-800 bg-zinc-900/30 overflow-y-auto">
            <button
              type="button"
              onClick={() => setShowWhy((v) => !v)}
              className="w-full flex items-center justify-between px-6 py-4 text-left"
            >
              <span className="text-sm font-sans font-medium text-white">
                {deterministicExplanation.headline}
              </span>
              <span className="text-xs font-sans text-zinc-400">
                {showWhy ? 'Hide' : 'Why this result'}
              </span>
            </button>
            {showWhy && (
              <div className="px-6 pb-6">
                <ul className="space-y-3">
                  {deterministicExplanation.bullets.map((b, i) => (
                    <li key={i} className="text-sm font-sans text-zinc-400 leading-relaxed break-words">
                      - {b}
                    </li>
                  ))}
                </ul>
                {deterministicExplanation.confidenceNote && (
                  <p className="mt-4 text-sm font-sans text-zinc-400 leading-relaxed break-words">
                    {deterministicExplanation.confidenceNote}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Blend Explanation */}
        {blend.resolutionMode === 'BLENDED' && (
          <div className="mt-12 p-6 border border-zinc-800 bg-zinc-900/30 overflow-y-auto">
            <h4 className="font-sans text-sm font-medium text-white mb-3">Blend Formulation</h4>
            <p className="text-sm font-sans text-zinc-400 leading-relaxed max-w-xl">
              This is a blended formulation where all components are mixed together. The <span className="text-white font-medium">Primary Contributor</span> provides the main effect profile. The <span className="text-white font-medium">Supporting Contributor</span> fine-tunes the experience. The <span className="text-white font-medium">Weighted Influence</span> adds complementary effects. All components work together simultaneously in a single blended product.
            </p>
          </div>
        )}

      </section>

      {/* 3. Metrics */}
      <section className="opacity-0 animate-[fadeIn_0.6s_ease-out_0.6s_forwards]">
        <h3 className="text-[10px] font-sans font-medium uppercase tracking-[0.2em] text-zinc-500 mb-12">Match Confidence</h3>

        <div className="grid grid-cols-2 gap-x-12 gap-y-16">
          <div>
            <span className="block text-[9px] font-sans uppercase tracking-widest text-zinc-500 mb-2">Confidence</span>
            <div className="text-5xl font-serif font-light text-white tracking-tight">
              {(blend.confidenceScore * 100).toFixed(0)}<span className="text-lg font-sans text-zinc-500">%</span>
            </div>
          </div>

          {intent && (
            <>
              <div>
                <span className="block text-[9px] font-sans uppercase tracking-widest text-zinc-500 mb-2">Energy Level</span>
                <div className="text-5xl font-serif font-light text-white tracking-tight">
                  {(intent.activationTarget * 10).toFixed(1)}
                </div>
              </div>
              <div>
                <span className="block text-[9px] font-sans uppercase tracking-widest text-zinc-500 mb-2">Duration</span>
                <div className="text-5xl font-serif font-light text-white tracking-tight">
                  {(intent.cognitiveEndurance * 10).toFixed(1)}
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Adjustment Controls */}
      {showAdjustments && onAdjustment && (
        <section className="opacity-0 animate-[fadeIn_0.6s_ease-out_0.8s_forwards] border-t border-zinc-800 pt-8">
          <h3 className="text-[10px] font-sans font-medium uppercase tracking-[0.2em] text-zinc-500 mb-8">Adjust Blend</h3>
          <div className="space-y-8">
            {/* Energy ↔ Calm */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-sans text-white uppercase tracking-wider">Energy ↔ Calm</div>
                <div className="text-xs font-mono text-zinc-400">{Math.round(localIntent.activationTarget * 100)}</div>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={Math.round(localIntent.activationTarget * 100)}
                onChange={(e) => handleAdjustmentChange('activationTarget', parseInt(e.target.value) / 100)}
                className="w-full h-1 bg-zinc-800 appearance-none cursor-pointer accent-[#C5A065] hover:accent-[#D4B075] transition-colors"
              />
            </div>

            {/* Duration ↔ Intensity */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-sans text-white uppercase tracking-wider">Duration ↔ Intensity</div>
                <div className="text-xs font-mono text-zinc-400">{Math.round(localIntent.cognitiveEndurance * 100)}</div>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={Math.round(localIntent.cognitiveEndurance * 100)}
                onChange={(e) => handleAdjustmentChange('cognitiveEndurance', parseInt(e.target.value) / 100)}
                className="w-full h-1 bg-zinc-800 appearance-none cursor-pointer accent-[#C5A065] hover:accent-[#D4B075] transition-colors"
              />
            </div>

            {/* Anxiety Sensitivity */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-sans text-white uppercase tracking-wider">Anxiety Sensitivity</div>
                <div className="text-xs font-mono text-zinc-400">{Math.round(localIntent.anxietySensitivity * 100)}</div>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={Math.round(localIntent.anxietySensitivity * 100)}
                onChange={(e) => handleAdjustmentChange('anxietySensitivity', parseInt(e.target.value) / 100)}
                className="w-full h-1 bg-zinc-800 appearance-none cursor-pointer accent-[#C5A065] hover:accent-[#D4B075] transition-colors"
              />
            </div>
          </div>
        </section>
      )}

      {/* 4. Tradeoffs & Follow Up */}
      <section className="opacity-0 animate-[fadeIn_0.6s_ease-out_1s_forwards]">
        {blend.tradeoffs.length > 0 && (
          <div className="mb-12 overflow-y-auto">
            <h3 className="text-[10px] font-sans font-medium uppercase tracking-[0.2em] text-zinc-500 mb-8">Notes</h3>
            <ul className="space-y-4">
              {blend.tradeoffs.map((tradeoff, i) => (
                <li key={i} className="text-sm font-sans text-zinc-400 leading-relaxed flex gap-3">
                  <span className="text-zinc-600">•</span> <span className="break-words">{tradeoff}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Follow-Up Actions */}
        <div className="border-t border-zinc-800 pt-8 flex flex-col gap-4">
          <span className="text-[10px] font-sans font-medium uppercase tracking-[0.2em] text-zinc-500">Actions</span>
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={handleRefineOutcome}
              className="px-6 py-3 border border-[#C5A065] text-[#C5A065] text-xs font-sans uppercase tracking-widest hover:bg-[#C5A065] hover:text-black active:bg-[#B89555] transition-all duration-200 cursor-pointer"
            >
              Refine Outcome
            </button>
            <button 
              onClick={onShowUsageProtocol}
              className="px-6 py-3 border border-zinc-700 text-zinc-400 text-xs font-sans uppercase tracking-widest hover:border-zinc-500 hover:text-zinc-300 active:border-zinc-400 active:text-zinc-200 transition-all duration-200 cursor-pointer"
            >
              Usage Protocol
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}
