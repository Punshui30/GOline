// ResolutionPanel: Represents the "Monitor Surface" | "Presented Response"
// Design Philosophy: Swiss Style, International Typographic Style
// Strict Grid, Scaling Typography, No Decoration.

'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { OutcomeResult } from '@/lib/goOutcomeEngine';
import BlendVisualizer from './BlendVisualizer';
import OutcomeTransitionBanner from './OutcomeTransitionBanner';
import TypewriterText from './TypewriterText';
import DispensaryMenuBackground from './DispensaryMenuBackground';
import type { DeterministicExplanation } from '@/lib/outcomeBrain/deterministicExplanation';
import { staggerContainer, itemFade } from '@/lib/motion';

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
  // Alternate viable blends (top 3-5, excluding primary)
  alternates?: ResolvedBlend[];
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
  llmExplanation?: string;
  llmUsageInstructions?: string;
  blendNickname?: string;
  blendHashtag?: string;
  shareCaption?: string;
}

export default function ResolutionPanel({ blend, intent, isComputing, onRefineOutcome, onShowUsageProtocol, onAdjustment, isAnimating = true, hasResolved = false, deterministicExplanation, llmExplanation, llmUsageInstructions, blendNickname, blendHashtag, shareCaption }: ResolutionPanelProps) {
  const [showAdjustments, setShowAdjustments] = useState(false);
  const [showAlternates, setShowAlternates] = useState(false);
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
        <div className="w-8 h-1 bg-accent mb-8" />
        <p className="text-xs font-bold text-zinc-700 uppercase tracking-widest max-w-xs">
          System Ready
        </p>
      </div>
    );
  }

  // Get selected strain IDs for background highlighting
  const selectedStrainIds = blend ? blend.primaryBlend.map(c => c.id) : [];

  // ACTIVE STATE
  return (
    <>
      {/* Dispensary Menu Background - Visual Context */}
      <DispensaryMenuBackground selectedStrainIds={selectedStrainIds} />
      
      <motion.div
        className="relative flex flex-col gap-20 mb-32 text-[#E5E5E5] overflow-y-auto min-h-0 z-10"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
      {/* PRIMARY SECTION: Outcome Summary & Confidence (40% visual attention) */}
      <motion.section 
        variants={itemFade} 
        className="bg-neutral-900/40 border border-neutral-800 rounded-lg p-8 lg:p-12"
      >
        <div className="flex flex-col gap-6">
          {/* Label */}
          <span className="text-[10px] font-sans font-medium uppercase tracking-[0.2em] text-zinc-500">
            Best Match
          </span>
          
          {/* Primary Headline - Large, Prominent */}
          <h1 className="font-serif text-4xl lg:text-6xl font-light leading-[1.1] tracking-tight text-white break-words max-w-4xl">
            {blend.primaryBlend.length === 1
              ? 'One strain already matches what you want'
              : 'This blend best matches your desired outcome'}
          </h1>
          
          {/* Confidence Indicator - Prominent, but secondary to headline */}
          <div className="mt-4 pt-6 border-t border-neutral-800">
            <div className="flex items-baseline gap-3">
              <span className="text-xs font-sans uppercase tracking-widest text-zinc-500">
                Confidence
              </span>
              <span className={`text-3xl lg:text-4xl font-serif font-light tracking-tight ${
                blend.confidenceScore >= 0.75 ? 'text-accent' : 'text-white'
              }`}>
                {(blend.confidenceScore * 100).toFixed(0)}<span className="text-lg font-sans text-zinc-500 ml-1">%</span>
              </span>
            </div>
          </div>
        </div>
      </motion.section>

      {/* SECONDARY SECTION: Blend Composition & Metrics (30% visual attention) */}
      <motion.section 
        variants={itemFade}
        className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-8 lg:p-12"
      >
        <OutcomeTransitionBanner visible={hasResolved} />
        
        <div className="mt-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-[10px] font-sans font-medium uppercase tracking-[0.2em] text-zinc-500">
              Blend Composition
            </h2>
            {/* Source indicator - Subtle, secondary */}
            <span className="text-[9px] font-sans text-zinc-600 uppercase tracking-wider">
              Source: <span className="text-zinc-500 font-medium">Dispensary inventory</span>
            </span>
          </div>

          {/* Animated Visualizer Component */}
          <BlendVisualizer blend={blend} isAnimating={isAnimating} />
        </div>

        {/* Blend Nickname & Hashtag - Directly under blend percentages */}
        {(blendNickname || blendHashtag) && (
          <div className="mt-6 pt-6 border-t border-neutral-800/50">
            <div className="flex items-center gap-4 flex-wrap">
              {blendNickname && (
                <div>
                  <span className="text-[10px] font-sans uppercase tracking-wider text-zinc-500 mb-1 block">
                    Blend Name
                  </span>
                  <span className="text-lg font-serif font-light text-white">
                    {blendNickname}
                  </span>
                </div>
              )}
              {blendHashtag && (
                <div>
                  <span className="text-[10px] font-sans uppercase tracking-wider text-zinc-500 mb-1 block">
                    Hashtag
                  </span>
                  <span className="text-sm font-sans text-zinc-400">
                    {blendHashtag}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Share Caption - With copy button */}
        {shareCaption && (
          <div className="mt-6 pt-6 border-t border-neutral-800/50">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <span className="text-[10px] font-sans uppercase tracking-wider text-zinc-500 mb-2 block">
                  Share Caption
                </span>
                <p className="text-sm font-sans text-zinc-300 leading-relaxed">
                  {shareCaption}
                </p>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(shareCaption);
                }}
                className="px-4 py-2 border border-zinc-700 text-zinc-400 text-xs font-sans uppercase tracking-wider hover:border-zinc-500 hover:text-white transition-colors flex-shrink-0"
              >
                Copy
              </button>
            </div>
          </div>
        )}

        {/* Usage Instructions - Moved up, immediately after blend composition */}
        <div className="mt-10 pt-10 border-t border-neutral-800/50">
          <h3 className="text-xs font-sans font-medium uppercase tracking-widest text-zinc-300 mb-6">
            How to Use This Blend
          </h3>
          {llmUsageInstructions ? (
            <div className="text-sm font-sans text-zinc-300 leading-[1.9] max-w-2xl">
              <TypewriterText text={llmUsageInstructions} speed={20} />
            </div>
          ) : (
            // 🚫 Do not add fallback copy here.
            // All explanation text must come from LLM output.
            <div className="text-sm font-sans text-zinc-500 leading-[1.9] max-w-2xl italic">
              Generating usage instructions...
            </div>
          )}
        </div>

        {/* Metrics - Grouped with blend composition */}
        {intent && (
          <div className="mt-10 pt-10 border-t border-neutral-800/50">
            <h3 className="text-[10px] font-sans font-medium uppercase tracking-[0.2em] text-zinc-500 mb-6">
              Profile Metrics
            </h3>
            <div className="grid grid-cols-2 gap-x-12 gap-y-8">
              <div>
                <span className="block text-[9px] font-sans uppercase tracking-widest text-zinc-500 mb-2">
                  Energy Level
                </span>
                <div className="text-3xl font-serif font-light text-white tracking-tight">
                  {(intent.activationTarget * 10).toFixed(1)}
                </div>
              </div>
              <div>
                <span className="block text-[9px] font-sans uppercase tracking-widest text-zinc-500 mb-2">
                  Duration
                </span>
                <div className="text-3xl font-serif font-light text-white tracking-tight">
                  {(intent.cognitiveEndurance * 10).toFixed(1)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Alternate Paths - Collapsed by default */}
        {blend.alternates && blend.alternates.length > 0 && (
          <div className="mt-10 pt-10 border-t border-neutral-800/50">
            <button
              onClick={() => setShowAlternates(!showAlternates)}
              className="w-full flex items-center justify-between text-left mb-4"
            >
              <h3 className="text-xs font-sans font-medium uppercase tracking-widest text-zinc-400">
                Alternate Paths ({blend.alternates.length})
              </h3>
              <span className="text-xs text-zinc-500">
                {showAlternates ? 'Hide' : 'Show'}
              </span>
            </button>
            
            {showAlternates && (
              <div className="space-y-6">
                {blend.alternates.map((alt, idx) => (
                  <div key={idx} className="bg-neutral-900/20 border border-neutral-800/50 rounded-lg p-6">
                    <div className="mb-4">
                      <BlendVisualizer blend={alt} isAnimating={false} />
                    </div>
                    <div className="text-xs font-sans text-zinc-500">
                      Confidence: {(alt.confidenceScore * 100).toFixed(0)}%
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PRIMARY ACTIONS - Prominent, after usage instructions */}
        <div className="mt-12 pt-10 border-t border-neutral-800">
          <h3 className="text-xs font-sans font-medium uppercase tracking-widest text-zinc-400 mb-6">
            Next Steps
          </h3>
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={handleRefineOutcome}
              className="px-8 py-4 border-2 border-accent text-accent text-sm font-sans uppercase tracking-widest hover:bg-accent hover:text-black active:bg-accent-active transition-all duration-200 cursor-pointer font-medium"
            >
              Refine Outcome
            </button>
            <button 
              onClick={onShowUsageProtocol}
              className="px-8 py-4 border-2 border-zinc-700 text-zinc-300 text-sm font-sans uppercase tracking-widest hover:border-zinc-500 hover:text-white active:border-zinc-400 transition-all duration-200 cursor-pointer font-medium"
            >
              Usage Protocol
            </button>
          </div>
        </div>

      </motion.section>

      {/* TERTIARY SECTION: Context & Guidance (30% visual attention) */}
      <motion.section 
        variants={itemFade}
        className="space-y-10"
      >
        {/* LLM-Generated Explanation - De-emphasized but visible */}
        {llmExplanation ? (
          <div className="bg-neutral-900/20 border border-neutral-800/50 rounded-lg p-8 lg:p-10">
            <h3 className="text-xs font-sans font-medium uppercase tracking-widest text-zinc-400 mb-6">
              Why This Blend Works For You
            </h3>
            <div className="text-sm font-sans text-zinc-400 leading-[1.9] max-w-2xl">
              <TypewriterText text={llmExplanation} speed={20} />
            </div>
          </div>
        ) : (
          // 🚫 Do not add fallback copy here.
          // All explanation text must come from LLM output.
          <div className="bg-neutral-900/20 border border-neutral-800/50 rounded-lg p-8 lg:p-10">
            <h3 className="text-xs font-sans font-medium uppercase tracking-widest text-zinc-400 mb-6">
              Why This Blend Works For You
            </h3>
            <div className="text-sm font-sans text-zinc-500 leading-[1.9] max-w-2xl italic">
              Generating explanation...
            </div>
          </div>
        )}


        {/* Blend Formulation Info - Tertiary */}
        {blend.resolutionMode === 'BLENDED' && (
          <div className="bg-neutral-900/20 border border-neutral-800/50 rounded-lg p-8 lg:p-10">
            <h3 className="text-xs font-sans font-medium uppercase tracking-widest text-zinc-400 mb-6">
              Blend Formulation
            </h3>
            <p className="text-sm font-sans text-zinc-400 leading-[1.9] max-w-2xl">
              This is a blended formulation where all components are mixed together. The <span className="text-white font-medium">Primary Contributor</span> provides the main effect profile. The <span className="text-white font-medium">Supporting Contributor</span> fine-tunes the experience. The <span className="text-white font-medium">Weighted Influence</span> adds complementary effects. All components work together simultaneously in a single blended product.
            </p>
          </div>
        )}

        {/* Tradeoffs/Notes - Tertiary */}
        {blend.tradeoffs.length > 0 && (
          <div className="bg-neutral-900/20 border border-neutral-800/50 rounded-lg p-8 lg:p-10">
            <h3 className="text-xs font-sans font-medium uppercase tracking-widest text-zinc-400 mb-6">
              Notes
            </h3>
            <ul className="space-y-4 max-w-2xl">
              {blend.tradeoffs.map((tradeoff, i) => (
                <li key={i} className="text-sm font-sans text-zinc-400 leading-[1.9] flex gap-3">
                  <span className="text-zinc-600 flex-shrink-0">•</span>
                  <span className="break-words">{tradeoff}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Adjustment Controls - Tertiary */}
        {showAdjustments && onAdjustment && (
          <div className="bg-neutral-900/20 border border-neutral-800/50 rounded-lg p-6 lg:p-8">
            <h3 className="text-xs font-sans font-medium uppercase tracking-widest text-zinc-400 mb-8">
              Adjust Blend
            </h3>
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
                  className="w-full h-1 bg-zinc-800 appearance-none cursor-pointer accent-accent hover:accent-accent-hover transition-colors"
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
                  className="w-full h-1 bg-zinc-800 appearance-none cursor-pointer accent-accent hover:accent-accent-hover transition-colors"
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
                  className="w-full h-1 bg-zinc-800 appearance-none cursor-pointer accent-accent hover:accent-accent-hover transition-colors"
                />
              </div>
            </div>
          </div>
        )}
      </motion.section>

    </motion.div>
    </>
  );
}
