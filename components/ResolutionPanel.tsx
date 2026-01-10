// ResolutionPanel: Represents the "Monitor Surface" | "Presented Response"
// Design Philosophy: Swiss Style, International Typographic Style
// Strict Grid, Scaling Typography, No Decoration.

'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import BlendVisualizer from './BlendVisualizer';
import OutcomeTransitionBanner from './OutcomeTransitionBanner';
import TypewriterText from './TypewriterText';
import DispensaryMenuBackground from './DispensaryMenuBackground';
import type { DeterministicExplanation } from '@/lib/outcomeBrain/deterministicExplanation';
import { staggerContainer, itemFade } from '@/lib/motion';

// Interfaces matching the new "Editorial" data structure
export type CultivarRole = 'primary' | 'secondary' | 'supporting' | 'driver' | 'modulator' | 'anchor' | 'Anchor' | 'Modulator' | 'Driver';

// Map internal role names to consumer-friendly display names
export function getRoleDisplayName(role: CultivarRole): string {
  switch (role) {
    case 'primary':
      return 'PRIMARY CONTRIBUTOR';
    case 'secondary':
      return 'SECONDARY CONTRIBUTOR';
    case 'supporting':
      return 'SUPPORTING CONTRIBUTOR';
    default:
      return role;
  }
}

export interface ResolvedCultivar {
  id: string;
  name: string;
  role: CultivarRole;
  rank: number; // 1-based rank
  percentage: number;
  weight: number; // 0-1
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
  // Stack segments for sequential visualization
  stackSegments?: ResolvedCultivar[];
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
  mode?: 'blend' | 'stack';
}

export default function ResolutionPanel({ blend, intent, isComputing, onRefineOutcome, onShowUsageProtocol, onAdjustment, isAnimating = true, hasResolved = false, deterministicExplanation, llmExplanation, llmUsageInstructions, blendNickname, blendHashtag, shareCaption, mode = 'blend' }: ResolutionPanelProps) {
  const [showAdjustments, setShowAdjustments] = useState(false);
  const [showAlternates, setShowAlternates] = useState(false);

  // CRITICAL: Log what blend is being rendered and assert expectations
  // CRITICAL: Log what blend is being rendered and assert expectations
  useEffect(() => {
    if (blend) {
      // Phase A1: Strict Role Validation
      const primaries = blend.primaryBlend.filter(c => c.role === 'primary');
      if (primaries.length > 1) {
        console.error('[GO_STRICT_VIOLATION] ❌ Multiple Primary Contributors detected!', primaries);
      }
      if (primaries.length === 0 && blend.primaryBlend.length > 0) {
        console.warn('[GO_STRICT_VIOLATION] ⚠️ No Primary Contributor assigned (requires Rank 1)');
      }

      const actualAlternateCount = blend.alternates?.length || 0;

      console.log('[UI] Rendering blend:', {
        primaryBlendCount: blend.primaryBlend.length,
        primaryStrains: blend.primaryBlend.map(c => c.name),
        primaryPercentages: blend.primaryBlend.map(c => c.percentage),
        hasAlternates: !!blend.alternates,
        alternateCount: actualAlternateCount,
        confidenceScore: blend.confidenceScore,
      });

      // ASSERT: Alternates should be present if resolver generated them
      // Note: We expect at least 1-4 alternates based on resolver logic
      // If resolver generates alternates but UI receives none, that's a regression
      const expectedAlternates = 4; // Resolver generates up to 4 alternates

      if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
        // In development, assert that alternates are not silently dropped
        // This will fail loudly if alternates are expected but missing
        if (expectedAlternates > 0 && actualAlternateCount === 0) {
          console.warn('[UI][ASSERT] Alternates expected but not rendered', {
            expected: expectedAlternates,
            actual: actualAlternateCount,
            hasAlternatesProp: !!blend.alternates,
          });
        }
      }

      if (blend.alternates && blend.alternates.length > 0) {
        blend.alternates.forEach((alt, idx) => {
          console.log(`[UI] Alternate ${idx + 1}:`, {
            strains: alt.primaryBlend.map(c => c.name),
            percentages: alt.primaryBlend.map(c => c.percentage),
            confidence: alt.confidenceScore,
          });
        });
      } else {
        console.log('[UI] WARNING: No alternates available to render');
      }
    }
  }, [blend]);
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
  console.log("ResolutionPanel rendered", {
    hasBlend: !!blend,
    primaryBlendCount: blend?.primaryBlend?.length || 0,
    alternatesCount: blend?.alternates?.length || 0,
  });

  return (
    <>
      {/* Dispensary Menu Background - Visual Context */}
      <DispensaryMenuBackground selectedStrainIds={selectedStrainIds} />

      <motion.div
        className="relative flex flex-col gap-20 mb-32 text-[#E5E5E5] z-10"
        variants={{
          initial: {},
          animate: {
            transition: {
              staggerChildren: 0.18, // Slower, more deliberate assembly
              delayChildren: 0.2, // Slight pause before starting
            },
          },
        }}
        initial="initial"
        animate="animate"
      >
        {/* PRIMARY SECTION: Outcome Summary & Confidence (40% visual attention) */}
        <motion.section
          variants={itemFade}
          className="bg-glass-elevated border border-go-strong rounded-2xl p-8 lg:p-12 shadow-2xl backdrop-blur-3xl"
        >
          <div className="flex flex-col gap-6">
            {/* Label */}
            <span className="text-[10px] font-sans font-semibold uppercase tracking-[0.2em] text-go-subtle">
              Best Match
            </span>

            {/* Primary Headline - Large, Prominent */}
            <h1 className="font-serif text-4xl lg:text-7xl font-thin leading-[1.05] tracking-tighter text-go break-words max-w-4xl">
              {blend.primaryBlend.length === 1
                ? 'One strain already matches what you want'
                : 'This blend best matches your desired outcome'}
            </h1>

            {/* Confidence Indicator - Prominent, but secondary to headline */}
            <div className="mt-8 pt-8 border-t border-go">
              <div className="flex items-baseline gap-4">
                <span className="text-xs font-sans uppercase tracking-[0.15em] text-go-subtle font-medium">
                  Confidence
                </span>
                <span className={`text-5xl lg:text-6xl font-serif font-light tracking-tight ${blend.confidenceScore >= 0.75 ? 'text-energy' : 'text-go'
                  }`}>
                  {(blend.confidenceScore * 100).toFixed(0)}<span className="text-2xl font-sans text-go-muted ml-2 font-light">%</span>
                </span>
              </div>
            </div>
          </div>
        </motion.section>

        {/* SECONDARY SECTION: Blend Composition & Metrics (30% visual attention) */}
        <motion.section
          variants={itemFade}
          className="bg-glass border border-go rounded-2xl p-8 lg:p-12 shadow-lg"
        >
          <OutcomeTransitionBanner visible={hasResolved} />

          <div className="mt-6">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-[10px] font-sans font-semibold uppercase tracking-[0.2em] text-go-subtle">
                Blend Composition
              </h2>
              {/* Source indicator - Subtle, secondary */}
              <span className="text-[9px] font-sans text-go-subtle uppercase tracking-wider">
                Source: <span className="text-go-muted font-medium">Dispensary inventory</span>
              </span>
            </div>

            {/* Animated Visualizer Component */}
            <BlendVisualizer blend={blend} isAnimating={isAnimating} mode={mode} />
          </div>

          {/* Blend Nickname & Hashtag - Directly under blend percentages */}
          {(blendNickname || blendHashtag) && (
            <div className="mt-8 pt-8 border-t border-go">
              <div className="flex items-center gap-6 flex-wrap">
                {blendNickname && (
                  <div>
                    <span className="text-[10px] font-sans uppercase tracking-wider text-go-subtle mb-1 block font-medium">
                      Blend Name
                    </span>
                    <span className="text-2xl font-serif font-light text-go tracking-wide">
                      {blendNickname}
                    </span>
                  </div>
                )}
                {blendHashtag && (
                  <div>
                    <span className="text-[10px] font-sans uppercase tracking-wider text-go-subtle mb-1 block font-medium">
                      Hashtag
                    </span>
                    <span className="text-sm font-sans text-go-muted tracking-wide">
                      {blendHashtag}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Share Caption - With copy button */}
          {shareCaption && (
            <div className="mt-8 pt-8 border-t border-go">
              <div className="flex items-start justify-between gap-6">
                <div className="flex-1">
                  <span className="text-[10px] font-sans uppercase tracking-wider text-go-subtle mb-3 block font-medium">
                    Share Caption
                  </span>
                  <p className="text-sm font-sans text-go-muted leading-relaxed">
                    {shareCaption}
                  </p>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(shareCaption);
                  }}
                  className="px-5 py-3 border border-go text-go-muted text-[10px] font-sans uppercase tracking-[0.15em] hover:border-go-strong hover:text-go hover:bg-white/5 transition-colors flex-shrink-0 rounded-lg"
                >
                  Copy
                </button>
              </div>
            </div>
          )}

          {/* Usage Instructions - Moved up, immediately after blend composition */}
          <div className="mt-12 pt-10 border-t border-go">
            <h3 className="text-xs font-sans font-semibold uppercase tracking-[0.2em] text-go-subtle mb-8">
              How to Use This Blend
            </h3>
            {llmUsageInstructions ? (
              <div className="text-sm font-sans text-go leading-[2] max-w-2xl text-justify">
                <TypewriterText text={llmUsageInstructions} speed={20} />
              </div>
            ) : (
              // 🚫 Do not add fallback copy here.
              // All explanation text must come from LLM output.
              <div className="text-sm font-sans text-go-muted leading-[1.9] max-w-2xl italic">
                Generating usage instructions...
              </div>
            )}
          </div>

          {/* Metrics - Grouped with blend composition */}
          {intent && (
            <div className="mt-12 pt-10 border-t border-go">
              <h3 className="text-[10px] font-sans font-semibold uppercase tracking-[0.2em] text-go-subtle mb-8">
                Profile Metrics
              </h3>
              <div className="grid grid-cols-2 gap-x-12 gap-y-10">
                <div>
                  <span className="block text-[9px] font-sans uppercase tracking-[0.15em] text-go-subtle mb-3 font-medium">
                    Energy Level
                  </span>
                  <div className="text-4xl font-serif font-light text-go tracking-tight">
                    {(intent.activationTarget * 10).toFixed(1)}
                  </div>
                </div>
                <div>
                  <span className="block text-[9px] font-sans uppercase tracking-[0.15em] text-go-subtle mb-3 font-medium">
                    Duration
                  </span>
                  <div className="text-4xl font-serif font-light text-go tracking-tight">
                    {(intent.cognitiveEndurance * 10).toFixed(1)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Alternate Paths - Collapsed by default */}
          {blend.alternates && blend.alternates.length > 0 && (
            <div className="mt-12 pt-10 border-t border-go">
              <button
                onClick={() => setShowAlternates(!showAlternates)}
                className="w-full flex items-center justify-between text-left mb-6 group"
              >
                <h3 className="text-xs font-sans font-semibold uppercase tracking-[0.2em] text-go-muted group-hover:text-go transition-colors">
                  Alternate Paths ({blend.alternates.length})
                </h3>
                <span className="text-[10px] font-sans uppercase tracking-wider text-go-subtle group-hover:text-go transition-colors">
                  {showAlternates ? 'Hide' : 'Show'}
                </span>
              </button>

              {showAlternates && (
                <div className="space-y-6">
                  {blend.alternates.map((alt, idx) => (
                    <div key={idx} className="bg-glass/50 border border-go rounded-xl p-6 hover:bg-glass/80 transition-colors">
                      <div className="mb-4">
                        <BlendVisualizer blend={alt} isAnimating={false} mode={mode} />
                      </div>
                      <div className="text-xs font-sans text-go-subtle uppercase tracking-wider font-medium">
                        Confidence: {(alt.confidenceScore * 100).toFixed(0)}%
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PRIMARY ACTIONS - Prominent, after usage instructions */}
          <div className="mt-16 pt-12 border-t border-go">
            <h3 className="text-xs font-sans font-semibold uppercase tracking-[0.2em] text-go-subtle mb-8">
              Next Steps
            </h3>
            <div className="flex flex-wrap gap-6">
              <button
                onClick={handleRefineOutcome}
                className="px-10 py-5 border border-energy text-energy text-sm font-sans uppercase tracking-[0.2em] hover:bg-energy hover:text-nearblack active:bg-energy-active transition-all duration-300 cursor-pointer font-medium rounded-xl shadow-amber-sm"
              >
                Refine Outcome
              </button>
              <button
                onClick={onShowUsageProtocol}
                className="px-10 py-5 border border-go text-go-muted text-sm font-sans uppercase tracking-[0.2em] hover:border-go-strong hover:text-go hover:bg-white/5 active:border-go transition-all duration-300 cursor-pointer font-medium rounded-xl"
              >
                Usage Protocol
              </button>
            </div>
          </div>

        </motion.section>

        {/* TERTIARY SECTION: Context & Guidance (30% visual attention) */}
        <motion.section
          variants={itemFade}
          className="space-y-8"
        >
          {/* LLM-Generated Explanation - De-emphasized but visible */}
          {llmExplanation ? (
            <div className="bg-glass/50 border border-go rounded-2xl p-8 lg:p-12">
              <h3 className="text-xs font-sans font-semibold uppercase tracking-[0.2em] text-go-subtle mb-6">
                Why This Blend Works For You
              </h3>
              <div className="text-sm font-sans text-go-muted leading-[1.9] max-w-2xl text-justify">
                <TypewriterText text={llmExplanation} speed={20} />
              </div>
            </div>
          ) : (
            // 🚫 Do not add fallback copy here.
            // All explanation text must come from LLM output.
            <div className="bg-glass/50 border border-go rounded-2xl p-8 lg:p-12">
              <h3 className="text-xs font-sans font-semibold uppercase tracking-[0.2em] text-go-subtle mb-6">
                Why This Blend Works For You
              </h3>
              <div className="text-sm font-sans text-go-muted leading-[1.9] max-w-2xl italic">
                Generating explanation...
              </div>
            </div>
          )}


          {/* Blend Formulation Info - Tertiary */}
          {blend.resolutionMode === 'BLENDED' && (
            <div className="bg-glass/30 border border-go rounded-2xl p-8 lg:p-10">
              <h3 className="text-xs font-sans font-semibold uppercase tracking-[0.2em] text-go-subtle mb-6">
                Blend Formulation
              </h3>
              <p className="text-sm font-sans text-go-subtle leading-[1.9] max-w-2xl">
                This is a blended formulation where all components are mixed together. The <span className="text-energy font-medium">Primary Contributor</span> provides the main effect profile. The <span className="text-balance font-medium">Supporting Contributor</span> fine-tunes the experience. The <span className="text-calm font-medium">Weighted Influence</span> adds complementary effects. All components work together simultaneously in a single blended product.
              </p>
            </div>
          )}

          {/* Tradeoffs/Notes - Tertiary */}
          {blend.tradeoffs.length > 0 && (
            <div className="bg-glass/30 border border-go rounded-2xl p-8 lg:p-10">
              <h3 className="text-xs font-sans font-semibold uppercase tracking-[0.2em] text-go-subtle mb-6">
                Notes
              </h3>
              <ul className="space-y-4 max-w-2xl">
                {blend.tradeoffs.map((tradeoff, i) => (
                  <li key={i} className="text-sm font-sans text-go-muted leading-[1.9] flex gap-3">
                    <span className="text-go-subtle flex-shrink-0">•</span>
                    <span className="break-words">{tradeoff}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Adjustment Controls - Tertiary */}
          {showAdjustments && onAdjustment && (
            <div className="bg-glass-elevated border border-go-strong rounded-2xl p-8 lg:p-10 shadow-lg">
              <h3 className="text-xs font-sans font-semibold uppercase tracking-[0.2em] text-go-subtle mb-10">
                Adjust Blend
              </h3>
              <div className="space-y-8">
                {/* Energy ↔ Calm */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-[10px] font-sans text-go uppercase tracking-wider font-medium">Energy ↔ Calm</div>
                    <div className="text-[10px] font-mono text-go-subtle">{Math.round(localIntent.activationTarget * 100)}</div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={Math.round(localIntent.activationTarget * 100)}
                    onChange={(e) => handleAdjustmentChange('activationTarget', parseInt(e.target.value) / 100)}
                    className="w-full h-1 bg-go-border appearance-none cursor-pointer accent-energy hover:accent-energy/80 transition-colors rounded-full"
                  />
                </div>

                {/* Duration ↔ Intensity */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-[10px] font-sans text-go uppercase tracking-wider font-medium">Duration ↔ Intensity</div>
                    <div className="text-[10px] font-mono text-go-subtle">{Math.round(localIntent.cognitiveEndurance * 100)}</div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={Math.round(localIntent.cognitiveEndurance * 100)}
                    onChange={(e) => handleAdjustmentChange('cognitiveEndurance', parseInt(e.target.value) / 100)}
                    className="w-full h-1 bg-go-border appearance-none cursor-pointer accent-energy hover:accent-energy/80 transition-colors rounded-full"
                  />
                </div>

                {/* Anxiety Sensitivity */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-[10px] font-sans text-go uppercase tracking-wider font-medium">Anxiety Sensitivity</div>
                    <div className="text-[10px] font-mono text-go-subtle">{Math.round(localIntent.anxietySensitivity * 100)}</div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={Math.round(localIntent.anxietySensitivity * 100)}
                    onChange={(e) => handleAdjustmentChange('anxietySensitivity', parseInt(e.target.value) / 100)}
                    className="w-full h-1 bg-go-border appearance-none cursor-pointer accent-energy hover:accent-energy/80 transition-colors rounded-full"
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
