'use client';

/**
 * GO Line — Guided Outcomes Calculator
 * 
 * Functional prototype demonstrating the Outcome Resolution Layer of the GO system.
 * This calculator translates natural language intent into structured cultivar blends
 * using deterministic terpene profiling and biphasic scoring logic.
 */

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { OutcomeIntent, ResolutionType } from '@/lib/goOutcomeEngine';
import { resolveOutcome } from '@/lib/goOutcomeEngine';
import { resolveToNamedStrains, type NamedResolutionResult } from '@/lib/namedResolution';
import ResolutionPanel, { type ResolvedBlend, type ResolvedCultivar, type CultivarRole } from '@/components/ResolutionPanel';
import { StrategicGuidance, ClarificationQuestion } from '@/lib/strategicGuidance';
import { DEMO_MENU } from '@/data/demoMenu';
import { translateGuidanceToIntent } from '@/lib/guidanceToIntent';
import { convertToResolvedBlend } from '@/lib/convertToResolvedBlend';

type InteractionPhase = 'FREE' | 'GUIDED' | 'LOCKED';

interface GuidanceResponse {
  ok: boolean;
  guidance?: StrategicGuidance;
  error?: string;
  message?: string;
}

interface BlendComponent {
  cultivarId: string;
  displayName: string;
  role: "primary" | "corrective" | "supporting";
  ratio: number;
}

interface ResolutionTier {
  tierLabel: "Optimal" | "Balanced" | "Simplified";
  compositionStrategy: "single_cultivar" | "homogeneous_blend" | "layered_stack";
  resolutionType: ResolutionType;
  composition: BlendComponent[];
  compositionFit: number;
  systemNotes: string[];
  whyChosen: string[];
  tradeoffs: string[];
  instructions: string;
}

interface OutcomeResult {
  resolutionMode?: "BLENDED" | "STACKED";
  tiers?: ResolutionTier[];
  phases?: Array<{
    phase: "Top / Opening" | "Middle / Core" | "End / Landing" | "Primary / Early" | "Later / Wind-Down";
    intentFocus: string;
    composition: BlendComponent[];
    compositionFit: number;
    systemNotes: string[];
    instructions: string;
    purpose?: string;
    whatYoullFeel?: string;
  }>;
  refused?: boolean;
}

// Helper functions for qualitative display
function valueToQualitative(value: number): string {
  if (value < 0.2) return 'Low';
  if (value < 0.4) return 'Moderate';
  if (value < 0.6) return 'Moderate–High';
  if (value < 0.8) return 'High';
  return 'Very High';
}

function getCompositionFitLabel(score: number): { label: string; explanation: string } {
  if (score >= 0.8) {
    return { 
      label: 'Strong', 
      explanation: 'Strong fit under current constraints.' 
    };
  } else if (score >= 0.6) {
    return { 
      label: 'Moderate', 
      explanation: 'Moderate fit; tradeoffs required.' 
    };
  } else if (score >= 0.4) {
    return { 
      label: 'Conservative', 
      explanation: 'Conservative fit due to conflicting goals.' 
    };
  } else {
    return { 
      label: 'Low', 
      explanation: 'Low fit; chemistry limited by constraints.' 
    };
  }
}

function roleToLabel(role: "primary" | "corrective" | "supporting"): string {
  if (role === 'primary') return 'Primary Base';
  if (role === 'corrective') return 'Corrective';
  return 'Supporting';
}

function getTierDescription(tier: ResolutionTier): string {
  const componentCount = tier.composition.length;
  if (tier.tierLabel === 'Optimal') {
    return `Closest chemical match to your goal (${componentCount} ${componentCount === 1 ? 'component' : 'components'})`;
  } else if (tier.tierLabel === 'Balanced') {
    return `Strong alignment with fewer adjustments (${componentCount} ${componentCount === 1 ? 'component' : 'components'})`;
  } else {
    return `Directionally aligned with minimal complexity (${componentCount} ${componentCount === 1 ? 'component' : 'components'})`;
  }
}

function getResolutionTypeLabel(type: ResolutionType): string {
  if (type === 'SINGLE_CULTIVAR') return 'Single Cultivar';
  if (type === 'CORRECTIVE_BLEND') return 'Corrective Blend';
  return 'Compositional Blend';
}

/**
 * Outcome Dimensions - Fixed, stable set used internally by the engine
 * Each dimension maps to a subtle accent color
 */
type OutcomeDimension = 'energy' | 'clarity' | 'calm' | 'sedation' | 'mood_lift';

interface DimensionWeights {
  energy: number;      // 0-1: activation/energizing
  clarity: number;     // 0-1: cognitive clarity/focus
  calm: number;        // 0-1: relaxation/tension release
  sedation: number;    // 0-1: sleep-inducing/deep relaxation
  mood_lift: number;   // 0-1: mood elevation/social ease
}

/**
 * Compute dimensional weights from OutcomeIntent
 * Outcomes are vectors (weighted combinations), not categories
 */
function computeDimensionWeights(intent: OutcomeIntent | null): DimensionWeights {
  if (!intent) {
    return { energy: 0, clarity: 0, calm: 0, sedation: 0, mood_lift: 0 };
  }

  // Energy: directly from activationTarget
  const energy = intent.activationTarget;

  // Clarity: from cognitiveEndurance (sustained focus)
  const clarity = intent.cognitiveEndurance;

  // Calm: inverse of activation when low, enhanced by low anxiety sensitivity
  const calm = (1 - intent.activationTarget) * (1 - intent.anxietySensitivity * 0.5);

  // Sedation: inverse of activation + low cognitive endurance
  const sedation = (1 - intent.activationTarget) * (1 - intent.cognitiveEndurance);

  // Mood lift: moderate activation + low anxiety sensitivity (social ease)
  const moodLiftBase = intent.activationTarget > 0.4 && intent.activationTarget < 0.7 ? intent.activationTarget : 0;
  const mood_lift = moodLiftBase * (1 - intent.anxietySensitivity);

  return {
    energy: Math.max(0, Math.min(1, energy)),
    clarity: Math.max(0, Math.min(1, clarity)),
    calm: Math.max(0, Math.min(1, calm)),
    sedation: Math.max(0, Math.min(1, sedation)),
    mood_lift: Math.max(0, Math.min(1, mood_lift)),
  };
}

/**
 * Compute blended accent color from dimensional weights
 * Returns CSS color string representing the dimensional blend
 */
function computeDimensionColor(weights: DimensionWeights): string {
  // Dimension colors (subtle, informational accents)
  const colors: Record<OutcomeDimension, string> = {
    energy: '212, 175, 55',      // warm gold
    clarity: '180, 200, 220',    // cool blue-white
    calm: '160, 180, 160',       // muted green
    sedation: '140, 120, 180',   // muted purple
    mood_lift: '200, 160, 120',  // warm peach
  };

  // Weighted blend (normalize to prevent oversaturation)
  let r = 0, g = 0, b = 0;
  let totalWeight = 0;

  Object.entries(weights).forEach(([dim, weight]) => {
    if (weight > 0.1) { // Only include dimensions above threshold
      const [cr, cg, cb] = colors[dim as OutcomeDimension].split(',').map(Number);
      r += cr * weight;
      g += cg * weight;
      b += cb * weight;
      totalWeight += weight;
    }
  });

  if (totalWeight === 0) {
    return '255, 255, 255'; // Neutral fallback
  }

  // Normalize and reduce saturation for restraint
  r = Math.round(r / totalWeight * 0.6); // Reduce intensity
  g = Math.round(g / totalWeight * 0.6);
  b = Math.round(b / totalWeight * 0.6);

  return `${r}, ${g}, ${b}`;
}

/**
 * Compute dimensional emphasis for outcome icons
 * Maps outcome icon regions to dimensional combinations
 */
function computeOutcomeIconEmphasis(
  weights: DimensionWeights
): { relax: number; study: number; move: number; sleep: number } {
  // RELAX: calm + low energy
  const relax = weights.calm * (1 - weights.energy * 0.5);

  // STUDY: clarity + moderate energy + low sedation
  const study = weights.clarity * (weights.energy > 0.4 && weights.energy < 0.7 ? 1 : 0.5) * (1 - weights.sedation);

  // MOVE: energy + mood_lift
  const move = weights.energy * (0.7 + weights.mood_lift * 0.3);

  // SLEEP: sedation + calm
  const sleep = weights.sedation * (0.7 + weights.calm * 0.3);

  return {
    relax: Math.max(0, Math.min(1, relax)),
    study: Math.max(0, Math.min(1, study)),
    move: Math.max(0, Math.min(1, move)),
    sleep: Math.max(0, Math.min(1, sleep)),
  };
}

// Blend Visualization Component
function BlendVisualization({ composition }: { composition: BlendComponent[] }) {
  if (composition.length === 1) {
    return (
      <div className="py-4">
        <div className="h-12 bg-white/5 border border-white/10 rounded-sm flex items-center justify-center">
          <span className="text-white/80 text-sm font-light">{composition[0].displayName}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="py-4">
      <div className="flex gap-1 h-12 items-stretch">
        {composition.map((comp, idx) => (
          <div
            key={comp.cultivarId}
            className="flex-1 bg-white/5 border border-white/10 rounded-sm flex flex-col items-center justify-center px-2 relative group"
            style={{ flexBasis: `${comp.ratio}%` }}
          >
            <span className="text-white/70 text-xs font-light text-center truncate w-full">
              {comp.displayName}
            </span>
            <span className="text-white/40 text-[10px] mt-0.5">{comp.ratio}%</span>
          </div>
        ))}
      </div>
      {composition.length > 1 && (
        <div className="mt-2 flex items-center justify-center gap-2 text-xs text-white/40">
          <span>Mix evenly</span>
        </div>
      )}
    </div>
  );
}

function generateConservativeExplanations(intent: OutcomeIntent, tier: ResolutionTier): string[] {
  const explanations: string[] = [];
  
  // Energy constrained due to anxiety sensitivity
  if (intent.activationTarget > 0.6 && intent.anxietySensitivity > 0.5) {
    explanations.push('Energy was constrained to reduce anxiety risk.');
  }
  
  // Modifier ratio limited
  const supportingRatio = tier.composition
    .filter(b => b.role === 'supporting')
    .reduce((sum, b) => sum + b.ratio, 0);
  if (supportingRatio > 0 && supportingRatio < 0.25 && intent.overshootTolerance < 0.7) {
    explanations.push('Supporting ratio was limited to avoid terpene dominance.');
  }
  
  // Overshoot concerns
  if (intent.overshootTolerance < 0.5) {
    explanations.push('More aggressive blends increased overshoot risk.');
  }
  
  // Cognitive endurance concerns
  if (intent.cognitiveEndurance > 0.6 && intent.activationTarget > 0.7) {
    explanations.push('Stability over time prioritized over peak intensity.');
  }
  
  // Low confidence explanations
  if (tier.compositionFit < 0.6) {
    explanations.push('Conservative blending chosen to maintain chemical balance.');
  }
  
  // CBD/CBG corrective explanation
  const hasCorrective = tier.composition.some(c => c.role === 'corrective');
  if (hasCorrective) {
    explanations.push('CBD/CBG introduced to reduce psychoactive load while preserving terpene balance.');
  }
  
  return explanations.slice(0, 3); // Max 3 explanations
}

// Generate summary from tier data
function generateBlendSummary(tier: ResolutionTier): string {
  const primaryStrains = tier.composition.filter(c => c.role === 'primary');
  const correctiveStrains = tier.composition.filter(c => c.role === 'corrective');
  
  const parts: string[] = [];
  
  if (primaryStrains.length > 0) {
    parts.push(`primary target delivery`);
  }
  
  if (correctiveStrains.length > 0) {
    parts.push(`adjustment for ${correctiveStrains.map(c => c.displayName.toLowerCase()).join(' and ')}`);
  }
  
  if (tier.systemNotes.some(note => note.toLowerCase().includes('anxiety'))) {
    parts.push('anxiety control');
  }
  
  if (tier.systemNotes.some(note => note.toLowerCase().includes('duration'))) {
    parts.push('extended duration');
  }
  
  if (parts.length === 0) {
    return 'Optimized blend based on your stated outcome.';
  }
  
  return `This blend ${parts.join(', ')}, with controlled balance across components.`;
}

// BlendResolutionPanel Component
// NOTE: This component only renders structured ResolutionResult objects from resolveOutcome()
// NO regex parsing or prose extraction is allowed

// Blend data structure for UI display (derived from OutcomeResult only)
interface BlendDisplayComponent {
  name: string;
  percentage: number;
  rationale?: string;
}

interface BlendDisplayData {
  components: BlendDisplayComponent[];
  isValid: boolean;
}
interface BlendResolutionPanelProps {
  blend: BlendDisplayData;
  onAdjustment?: (type: 'energy' | 'duration' | 'pain', value: number) => void;
}

function BlendResolutionPanel({ blend, onAdjustment }: BlendResolutionPanelProps) {
  const [energyValue, setEnergyValue] = useState(50);
  const [durationValue, setDurationValue] = useState(50);
  const [painValue, setPainValue] = useState(50);
  
  return (
    <div className="border-t border-white/10 pt-12 pb-8">
      <div className="mb-10">
        <div className="text-xs uppercase tracking-wider text-white/40 mb-1">
          GO Line — Resolved Composition
        </div>
        <div className="text-xs text-white/30 mb-6">
          Outcome-balanced cultivar blend
        </div>
      </div>

      {/* Blend Visualization */}
      <div className="mb-12 space-y-6">
        {blend.components.map((component, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between mb-1">
              <div className="text-sm font-medium text-white tracking-tight">
                {component.name}
              </div>
              <div className="text-sm text-white/50 font-mono">
                {component.percentage}%
              </div>
            </div>
            <div className="relative h-1.5 bg-white/5 overflow-hidden">
              <div
                className="h-full bg-white/25 transition-all"
                style={{ width: `${component.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Adjustment Controls */}
      {onAdjustment && (
        <div className="border-t border-white/5 pt-8 space-y-8">
          <div className="text-xs uppercase tracking-wider text-white/40 mb-6">
            Adjustment Controls
          </div>
          
          <div className="space-y-6">
            {/* Energy ↔ Calm */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs text-white/60 uppercase tracking-wider">Energy ↔ Calm</div>
                <div className="text-xs text-white/40 font-mono">{energyValue}</div>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={energyValue}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setEnergyValue(val);
                  onAdjustment('energy', val);
                }}
                className="w-full h-1 bg-white/5 appearance-none cursor-pointer accent-white/20"
              />
            </div>

            {/* Duration ↔ Intensity */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs text-white/60 uppercase tracking-wider">Duration ↔ Intensity</div>
                <div className="text-xs text-white/40 font-mono">{durationValue}</div>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={durationValue}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setDurationValue(val);
                  onAdjustment('duration', val);
                }}
                className="w-full h-1 bg-white/5 appearance-none cursor-pointer accent-white/20"
              />
            </div>

            {/* Pain Relief ↔ Cognitive Lift */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs text-white/60 uppercase tracking-wider">Pain Relief ↔ Cognitive Lift</div>
                <div className="text-xs text-white/40 font-mono">{painValue}</div>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={painValue}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setPainValue(val);
                  onAdjustment('pain', val);
                }}
                className="w-full h-1 bg-white/5 appearance-none cursor-pointer accent-white/20"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Premium ResolvedBlend Component
function ResolvedBlend({ tier }: { tier: ResolutionTier }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const summary = generateBlendSummary(tier);
  
  return (
    <div className="border-t border-white/10 pt-12 pb-8">
      <div className="mb-8">
        <div className="text-xs uppercase tracking-wider text-white/40 mb-2">
          GO LINE RECOMMENDATION
        </div>
        <div className="text-xs text-white/50 mb-6">
          Optimized blend based on your stated outcome
        </div>
        <p className="text-sm text-white/70 leading-relaxed max-w-2xl">
          {summary}
        </p>
      </div>

      <div className="mb-8">
        <div className="text-xs uppercase tracking-wider text-white/40 mb-6">
          BLEND BREAKDOWN
        </div>
        <div className="space-y-4">
          {tier.composition.map((component) => (
            <div key={component.cultivarId} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-white">
                  {component.displayName}
                </div>
                <div className="text-sm text-white/60 font-mono">
                  {component.ratio}%
                </div>
              </div>
              <div className="relative h-1 bg-white/5 overflow-hidden">
                <div
                  className="h-full bg-white/20 transition-all"
                  style={{ width: `${component.ratio}%` }}
                />
              </div>
              {component.role === 'primary' && (
                <div className="text-xs text-white/50 leading-relaxed">
                  Primary target delivery
                </div>
              )}
              {component.role === 'corrective' && (
                <div className="text-xs text-white/50 leading-relaxed">
                  Corrective adjustment
                </div>
              )}
              {component.role === 'supporting' && (
                <div className="text-xs text-white/50 leading-relaxed">
                  Supporting balance
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-white/5 pt-6">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-xs uppercase tracking-wider text-white/50 hover:text-white/70 transition-colors mb-4"
        >
          <span className={`transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
            ▸
          </span>
          Why this blend works
        </button>
        
        {isExpanded && (
          <div className="space-y-3 text-xs text-white/60 leading-relaxed">
            {tier.whyChosen && tier.whyChosen.length > 0 ? (
              tier.whyChosen.map((reason, index) => (
                <div key={index}>{reason}</div>
              ))
            ) : (
              <div>Blend composition optimized for stated outcome constraints.</div>
            )}
          </div>
        )}
      </div>

      {tier.instructions && (
        <div className="mt-6 pt-6 border-t border-white/5">
          <div className="text-xs uppercase tracking-wider text-white/40 mb-3">
            INSTRUCTIONS
          </div>
          <p className="text-xs text-white/60 leading-relaxed">
            {tier.instructions}
          </p>
        </div>
      )}
    </div>
  );
}

// Browser Speech Recognition types
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface Window {
  SpeechRecognition: new () => SpeechRecognition;
  webkitSpeechRecognition: new () => SpeechRecognition;
}

export default function GOLineCalculator() {
  // Phase 1 (FREE): User input
  const [userInput, setUserInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [llmFailed, setLlmFailed] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const interimTranscriptRef = useRef<string>('');
  const explicitStopRef = useRef<boolean>(false); // Track explicit user stop vs auto-end

  // Phase management
  const [phase, setPhase] = useState<InteractionPhase>('FREE');
  const [guidance, setGuidance] = useState<StrategicGuidance | null>(null);
  const [clarificationAnswers, setClarificationAnswers] = useState<Record<string, string>>({});

  // Phase 3 (LOCKED): Engine inputs and outputs
  const [intent, setIntent] = useState<OutcomeIntent | null>(null);
  const [outcome, setOutcome] = useState<OutcomeResult | null>(null);
  const [namedResolution, setNamedResolution] = useState<NamedResolutionResult | null>(null);
  const [resolvedBlend, setResolvedBlend] = useState<ResolvedBlend | null>(null);

  // Conversational state (seam for LLM separation)
  const [conversation, setConversation] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [intentSummary, setIntentSummary] = useState<string>('');
  const [axesClosed, setAxesClosed] = useState(false);
  
  // Note: All recommendations must come from structured OutcomeResult objects only
  // No regex parsing or prose-based extraction is allowed

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setSpeechSupported(true);
        const recognition = new SpeechRecognition();
        recognition.continuous = true; // Enable continuous listening
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          setIsListening(true);
          interimTranscriptRef.current = '';
        };

        recognition.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' ';
            } else {
              interimTranscript += transcript;
            }
          }

          if (finalTranscript) {
            setUserInput((prev) => prev + finalTranscript);
            interimTranscriptRef.current = '';
          } else {
            interimTranscriptRef.current = interimTranscript;
          }
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          // Don't stop on 'no-speech' errors - allow pauses
          if (event.error === 'no-speech') {
            // Silently ignore - user can pause while speaking
            return;
          } else if (event.error === 'not-allowed') {
            setIsListening(false);
            setError('Microphone permission denied. Please enable microphone access.');
          } else if (event.error === 'network' || event.error === 'aborted') {
            // Only stop on critical errors
            setIsListening(false);
          }
        };

        recognition.onend = () => {
          // Only stop if user explicitly stopped, not on auto-end
          if (explicitStopRef.current) {
            // User explicitly stopped - finalize transcript and reset
            explicitStopRef.current = false;
            setIsListening(false);
            if (interimTranscriptRef.current) {
              setUserInput((prev) => prev + interimTranscriptRef.current + ' ');
              interimTranscriptRef.current = '';
            }
          } else {
            // Auto-ended (silence, etc.) - ignore and keep listening
            // The continuous mode should handle this, but if it auto-ends, try to restart
            if (recognitionRef.current) {
              setTimeout(() => {
                if (recognitionRef.current && !explicitStopRef.current) {
                  try {
                    recognitionRef.current.start();
                  } catch (err) {
                    // Can't restart - user may have stopped, so reset state
                    setIsListening(false);
                  }
                }
              }, 100);
            }
          }
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        setError(null);
        explicitStopRef.current = false; // Reset explicit stop flag
        recognitionRef.current.start();
      } catch (err: any) {
        console.error('Failed to start recognition:', err);
        // Check if it's already running
        if (err.message && err.message.includes('already started')) {
          setIsListening(true);
        } else {
          setError('Failed to start voice input. Please try again.');
        }
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      try {
        explicitStopRef.current = true; // Mark as explicit stop
        recognitionRef.current.stop();
        // Transcript will be finalized in onend handler
      } catch (err) {
        console.error('Failed to stop recognition:', err);
        // Fallback: manually finalize if stop() fails
        explicitStopRef.current = false;
        setIsListening(false);
        if (interimTranscriptRef.current) {
          setUserInput((prev) => prev + interimTranscriptRef.current + ' ');
          interimTranscriptRef.current = '';
        }
      }
    }
  };

  // Conversational LLM handler (seam for separation)
  const handleConversation = async (input: string) => {
    if (!input.trim() || isProcessing) return;

    setIsProcessing(true);
    setError(null);

    try {
      const updatedConversation = [
        ...conversation,
        { role: 'user' as const, content: input.trim() },
      ];

      const res = await fetch('/api/conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedConversation.map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
        }),
      });

      if (!res.ok) {
        throw new Error('Conversation API failed');
      }

      const data = await res.json();
      if (!data.ok || !data.message) {
        throw new Error('Invalid conversation response');
      }

      // Add assistant response to conversation
      // NO parsing of recommendations - all recommendations must come from structured OutcomeResult
      const newConversation = [
        ...updatedConversation,
        { role: 'assistant' as const, content: data.message },
      ];
      setConversation(newConversation);

      // Build structured summary from conversation (not raw messages)
      const summary = updatedConversation
        .filter(msg => msg.role === 'user')
        .map(msg => msg.content)
        .join('\n\n');
      setIntentSummary(summary);

      // For now, axes closed after 2 user messages (can be refined)
      if (updatedConversation.filter(msg => msg.role === 'user').length >= 2) {
        setAxesClosed(true);
      }

      setUserInput('');
    } catch (err: any) {
      console.error('Conversation error:', err);
      setError('Failed to process conversation');
    } finally {
      setIsProcessing(false);
    }
  };

  // Phase 1: Free expression - get strategic guidance from LLM
  const handleAnalyze = async () => {
    if (!axesClosed) return; // Gate: only run when axes are closed

    if (!intentSummary.trim()) {
      setError('No intent summary available');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setGuidance(null);
    setClarificationAnswers({});
    setIntent(null);
    setOutcome(null);
    setLlmFailed(false);
    setPhase('FREE');

    try {
      const guidanceResponse = await fetch('/api/resolution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contextSummary: intentSummary }),
      });

      console.log('[CLIENT] Guidance response status:', guidanceResponse.status);
      
      let guidanceData: GuidanceResponse;
      
      if (!guidanceResponse.ok) {
        try {
          const errorBody = await guidanceResponse.text();
          console.log('[CLIENT] Error response body:', errorBody);
          guidanceData = JSON.parse(errorBody);
        } catch (parseErr) {
          console.error('[CLIENT] Failed to parse error response:', parseErr);
          guidanceData = { ok: false, error: 'Parse error' };
        }
        setLlmFailed(true);
        setError(null);
        setIsProcessing(false);
        return;
      }

      try {
        guidanceData = await guidanceResponse.json();
        console.log('[CLIENT] Guidance response body:', guidanceData);
      } catch (jsonError) {
        console.error('[CLIENT] Failed to parse response:', jsonError);
        setLlmFailed(true);
        setError(null);
        setIsProcessing(false);
        return;
      }

      if (!guidanceData.ok || !guidanceData.guidance) {
        setLlmFailed(true);
        setError(null);
        setIsProcessing(false);
        return;
      }

      setGuidance(guidanceData.guidance);
      setLlmFailed(false);

      // Transition to GUIDED phase if clarifications needed, otherwise go straight to LOCKED
      if (guidanceData.guidance.clarificationNeeded && guidanceData.guidance.clarificationNeeded.length > 0) {
        setPhase('GUIDED');
      } else {
        // No clarifications needed, proceed directly to locked
        handleLock(guidanceData.guidance, {});
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setLlmFailed(true);
      setError(null);
    } finally {
      setIsProcessing(false);
    }
  };

  // Phase 3: Lock and resolve - translate guidance to intent, call engine
  const handleLock = (finalGuidance: StrategicGuidance, answers: Record<string, string>) => {
    setPhase('LOCKED');
    
    // Translate strategic guidance to numeric intent constraints
    const translatedIntent = translateGuidanceToIntent(finalGuidance, answers);
    setIntent(translatedIntent);

    // Resolve outcome using deterministic engine
    try {
      const resolvedOutcome = resolveOutcome(translatedIntent);
      setOutcome(resolvedOutcome);
      
      // Check for failure state
      if (resolvedOutcome.failure) {
        const blend = convertToResolvedBlend({ primaryBlend: [], stackingOptions: [], confidenceScore: 0, tradeoffs: [], rationaleSummary: '', resolutionMode: 'BLENDED' }, resolvedOutcome);
        setResolvedBlend(blend);
        return;
      }
      
      // MANDATORY: Convert to named resolution (maps abstract chemotypes to actual strain names)
      const named = resolveToNamedStrains(resolvedOutcome);
      setNamedResolution(named);
      
      // Convert to ResolvedBlend format for ResolutionPanel
      const blend = convertToResolvedBlend(named, resolvedOutcome);
      setResolvedBlend(blend);
    } catch (err) {
      console.error('Resolution error:', err);
      setError('Failed to resolve outcome. Please try again.');
    }
  };
  
  // Re-resolution handler for sliders (triggers full pipeline with named outputs)
  const handleReResolution = (adjustedIntent: OutcomeIntent) => {
    try {
      const resolvedOutcome = resolveOutcome(adjustedIntent);
      setOutcome(resolvedOutcome);
      
      // Check for failure state
      if (resolvedOutcome.failure) {
        const blend = convertToResolvedBlend({ primaryBlend: [], stackingOptions: [], confidenceScore: 0, tradeoffs: [], rationaleSummary: '', resolutionMode: 'BLENDED' }, resolvedOutcome);
        setResolvedBlend(blend);
        return;
      }
      
      // MANDATORY: Re-resolve to named strains
      const named = resolveToNamedStrains(resolvedOutcome);
      setNamedResolution(named);
      
      // Update ResolvedBlend
      const blend = convertToResolvedBlend(named, resolvedOutcome);
      setResolvedBlend(blend);
    } catch (err) {
      console.error('Re-resolution error:', err);
      setError('Failed to re-resolve with adjustments.');
    }
  };

  // Handle clarification answer updates
  const handleClarificationAnswer = (questionType: string, answer: string) => {
    setClarificationAnswers(prev => ({
      ...prev,
      [questionType]: answer,
    }));
  };

  // Check if all clarifications are answered
  const allClarificationsAnswered = (): boolean => {
    if (!guidance || !guidance.clarificationNeeded || guidance.clarificationNeeded.length === 0) {
      return true;
    }
    return guidance.clarificationNeeded.every(q => clarificationAnswers[q.type] !== undefined);
  };

  // convertToResolvedBlend function extracted to @/lib/convertToResolvedBlend

  return (
    <main className="min-h-screen w-full go-bg-primary text-white">
      <div className="pt-16 pb-20">
        <div className="max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12 text-center border-b border-white/5 pb-8 go-fade-in">
            <div className="flex items-center justify-center mb-4">
              <Image 
                src="/go-logo.png" 
                alt="GO Line" 
                width={200} 
                height={60} 
                className="w-auto h-auto max-w-[60%] sm:max-w-[50%] md:max-w-[40%] object-contain"
              />
            </div>
          </div>

          {/* Mode Selector */}
          <div className="mb-16">
            <div className="text-xs uppercase tracking-wider text-white/40 mb-2">MODE</div>
            <div className="flex gap-6 text-sm text-white/70">
                <button
                  onClick={() => {
                    const preset: OutcomeIntent = {
                      activationTarget: 0.75,
                      anxietySensitivity: 0.3,
                      cognitiveEndurance: 0.6,
                      overshootTolerance: 0.5,
                      temporalProfile: 'single-phase',
                    };
                    setIntent(preset);
                    setUserInput('Social & upbeat');
                    const resolvedOutcome = resolveOutcome(preset);
                    setOutcome(resolvedOutcome);
                    // Check for failure state
                    if (resolvedOutcome.failure) {
                      const blend = convertToResolvedBlend({ primaryBlend: [], stackingOptions: [], confidenceScore: 0, tradeoffs: [], rationaleSummary: '', resolutionMode: 'BLENDED' }, resolvedOutcome);
                      setResolvedBlend(blend);
                    } else {
                      // MANDATORY: Convert to named resolution
                      const named = resolveToNamedStrains(resolvedOutcome);
                      setNamedResolution(named);
                      const blend = convertToResolvedBlend(named, resolvedOutcome);
                      setResolvedBlend(blend);
                    }
                    setLlmFailed(false);
                    setError(null);
                  }}
                className="hover:text-white transition-colors"
                >
                Social
                </button>
              <span className="text-white/20">/</span>
                <button
                  onClick={() => {
                    const preset: OutcomeIntent = {
                      activationTarget: 0.45,
                      anxietySensitivity: 0.5,
                      cognitiveEndurance: 0.7,
                      overshootTolerance: 0.4,
                      temporalProfile: 'single-phase',
                    };
                    setIntent(preset);
                    setUserInput('Relaxed but alert');
                    const resolvedOutcome = resolveOutcome(preset);
                    setOutcome(resolvedOutcome);
                    // Check for failure state
                    if (resolvedOutcome.failure) {
                      const blend = convertToResolvedBlend({ primaryBlend: [], stackingOptions: [], confidenceScore: 0, tradeoffs: [], rationaleSummary: '', resolutionMode: 'BLENDED' }, resolvedOutcome);
                      setResolvedBlend(blend);
                    } else {
                      // MANDATORY: Convert to named resolution
                      const named = resolveToNamedStrains(resolvedOutcome);
                      setNamedResolution(named);
                      const blend = convertToResolvedBlend(named, resolvedOutcome);
                      setResolvedBlend(blend);
                    }
                    setLlmFailed(false);
                    setError(null);
                  }}
                className="hover:text-white transition-colors"
                >
                Focus
                </button>
              <span className="text-white/20">/</span>
                <button
                  onClick={() => {
                    const preset: OutcomeIntent = {
                      activationTarget: 0.6,
                      anxietySensitivity: 0.4,
                      cognitiveEndurance: 0.5,
                      overshootTolerance: 0.6,
                      temporalProfile: 'multi-phase',
                      phases: [
                        {
                          phase: 'Primary / Early',
                          activationTarget: 0.7,
                          anxietySensitivity: 0.4,
                          cognitiveEndurance: 0.6,
                          overshootTolerance: 0.5,
                        },
                        {
                          phase: 'Later / Wind-Down',
                          activationTarget: 0.3,
                          anxietySensitivity: 0.5,
                          cognitiveEndurance: 0.4,
                          overshootTolerance: 0.6,
                        },
                      ],
                    };
                    setIntent(preset);
                    setUserInput('Wind down later');
                    const resolvedOutcome = resolveOutcome(preset);
                    setOutcome(resolvedOutcome);
                    // Check for failure state
                    if (resolvedOutcome.failure) {
                      const blend = convertToResolvedBlend({ primaryBlend: [], stackingOptions: [], confidenceScore: 0, tradeoffs: [], rationaleSummary: '', resolutionMode: 'BLENDED' }, resolvedOutcome);
                      setResolvedBlend(blend);
                    } else {
                      // MANDATORY: Convert to named resolution
                      const named = resolveToNamedStrains(resolvedOutcome);
                      setNamedResolution(named);
                      const blend = convertToResolvedBlend(named, resolvedOutcome);
                      setResolvedBlend(blend);
                    }
                    setLlmFailed(false);
                    setError(null);
                  }}
                className="hover:text-white transition-colors"
                >
                Wind-down
                </button>
            </div>
          </div>

          {/* Input Section */}
          <div className="mb-16">
            <div className="text-xs uppercase tracking-wider text-white/40 mb-3">
              OUTCOME INPUT
            </div>
              <div className="relative">
                <textarea
                  id="outcome-input"
                  value={userInput + (isListening && interimTranscriptRef.current ? interimTranscriptRef.current : '')}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && phase === 'FREE') {
                      handleAnalyze();
                    }
                  }}
                placeholder="Describe desired outcome..."
                className={`w-full h-32 px-4 py-3 pr-24 bg-transparent border-b border-white/10 text-white placeholder-white/20 text-sm focus:outline-none focus:border-white/30 resize-none transition-colors ${
                    phase === 'LOCKED' 
                      ? 'border-white/5 opacity-50 cursor-not-allowed' 
                    : ''
                  }`}
                  disabled={isProcessing || phase === 'LOCKED'}
                />
              
              {speechSupported && phase === 'FREE' && !isProcessing && (
                <div className="absolute right-2 top-2">
                  {!isListening ? (
                  <button
                    type="button"
                      onClick={startListening}
                      className="p-2 text-white/60 hover:text-white transition-colors"
                      title="Start listening"
                  >
                    <svg
                        className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                        />
                      </svg>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={stopListening}
                      className="p-2 text-white/80 hover:text-white transition-colors"
                      title="Stop listening"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 10h6v4H9z"
                        />
                    </svg>
                  </button>
                )}
              </div>
              )}
            </div>
            
              {isListening && (
              <div className="mt-2 space-y-1">
                <div className="text-xs text-white/40 uppercase tracking-wider">
                  Listening...
                </div>
                <div className="text-xs text-white/30">
                  You can pause while speaking — press Stop when you're done.
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-between mt-6">
                {phase === 'FREE' && (
                  <button
                    onClick={() => axesClosed ? handleAnalyze() : handleConversation(userInput)}
                    disabled={isProcessing || !userInput.trim()}
                  className="px-4 py-2 text-white/80 text-sm hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors uppercase tracking-wider"
                  >
                    {isProcessing ? (axesClosed ? 'Resolving...' : 'Processing...') : (axesClosed ? 'Resolve' : 'Send')}
                  </button>
                )}
              </div>
            </div>

          {/* Deterministic Resolution Panel - NO CHAT-STYLE OUTPUT */}
          {/* STEP 1: Chat-style rendering is DISABLED - removed all conversation.map JSX */}
          {resolvedBlend && intent && (
            <ResolutionPanel
              blend={resolvedBlend}
              intent={{
                activationTarget: intent.activationTarget,
                cognitiveEndurance: intent.cognitiveEndurance,
                anxietySensitivity: intent.anxietySensitivity || 0.5,
              }}
              onAdjust={(adjustments) => {
                const adjustedIntent: OutcomeIntent = {
                  ...intent,
                  activationTarget: adjustments.activationTarget,
                  cognitiveEndurance: adjustments.cognitiveEndurance,
                  anxietySensitivity: adjustments.anxietySensitivity,
                };
                setIntent(adjustedIntent);
                handleReResolution(adjustedIntent);
              }}
            />
          )}

          {/* Adjustment Controls are now handled by ResolutionPanel component - no duplicate */}

          {/* Conversation Output - Only show if no structured resolution */}
          {(conversation.length > 0 || isProcessing) && !outcome && (
            <div className="mb-20 space-y-6">
              {conversation.map((msg, idx) => (
                <div
                  key={idx}
                  className={
                    msg.role === "assistant"
                      ? "text-white text-sm leading-relaxed whitespace-pre-wrap max-w-[85%]"
                      : "text-white/50 text-sm ml-auto text-right max-w-[80%]"
                  }
                >
                  {msg.content}
                </div>
              ))}

              {isProcessing && (
                <div className="text-white/40 text-sm">
                  Resolving outcome...
                </div>
              )}
            </div>
          )}

          {/* Explanatory copy removed per PART 5 - no marketing copy in active states */}

          {/* Error Display */}
          {error && (
            <div className="mb-8 text-sm text-white/60">
              {error}
            </div>
          )}

          {/* Phase 2: GUIDED - Clarification Questions & Assumptions */}
          {phase === 'GUIDED' && guidance && (
            <div className="mb-8 space-y-6 go-fade-in">
              {/* Clarification Questions */}
              {guidance.clarificationNeeded && guidance.clarificationNeeded.length > 0 && (
                <div className="go-bg-elevated rounded-sm p-6 phase-clarifying">
                  <h2 className="text-lg font-medium text-white mb-4">
                    Clarifications Needed
                  </h2>
                  <div className="space-y-6">
                    {guidance.clarificationNeeded.map((question, index) => (
                      <div key={index} className="space-y-3">
                        <label className="block text-sm font-medium text-white/80">
                          {question.question}
                        </label>
                        <div className="space-y-2">
                          {question.options.map((option) => (
                            <label
                              key={option}
                              className="flex items-center gap-3 p-3 bg-[#0a0b0e] border border-white/10 rounded-sm cursor-pointer hover:bg-white/5 transition-colors"
                            >
                              <input
                                type="radio"
                                name={`clarification-${question.type}`}
                                value={option}
                                checked={clarificationAnswers[question.type] === option}
                                onChange={(e) => handleClarificationAnswer(question.type, e.target.value)}
                                className="w-4 h-4 text-white border-white/30 focus:ring-white/50"
                              />
                              <span className="text-sm text-white/80">{option}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Assumptions Panel */}
              <div className="bg-[#111216] border border-white/10 rounded-sm p-6">
                <h2 className="text-lg font-medium text-white mb-4">
                  Assumptions We're Making
                </h2>
                <div className="space-y-4">
                  {guidance.dominantPriorities.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-white/80 mb-2">Inferred Priorities</h3>
                      <ul className="space-y-1">
                        {guidance.dominantPriorities.map((priority, index) => (
                          <li key={index} className="text-sm text-white/70">• {priority}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {guidance.strictAvoidances.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-white/80 mb-2">Inferred Avoidances</h3>
                      <ul className="space-y-1">
                        {guidance.strictAvoidances.map((avoidance, index) => (
                          <li key={index} className="text-sm text-white/70">• {avoidance}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {guidance.acceptableTradeoffs.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-white/80 mb-2">Inferred Tradeoffs</h3>
                      <ul className="space-y-1">
                        {guidance.acceptableTradeoffs.map((tradeoff, index) => (
                          <li key={index} className="text-sm text-white/70">• {tradeoff}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {guidance.suggestedStrategies.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-white/80 mb-2">Suggested Strategies</h3>
                      <ul className="space-y-1">
                        {guidance.suggestedStrategies.map((strategy, index) => (
                          <li key={index} className="text-sm text-white/70">• {strategy}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <div className="mt-6 pt-4 border-t border-white/10">
                  <button
                    onClick={() => handleLock(guidance, clarificationAnswers)}
                    disabled={!allClarificationsAnswered()}
                    className="px-6 py-2.5 bg-white text-[#0a0b0e] font-medium text-sm rounded-sm hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Lock & Resolve
                  </button>
                  {!allClarificationsAnswered() && (
                    <p className="text-xs text-white/50 mt-2">
                      Please answer all clarification questions to proceed.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Phase 3: LOCKED - Show locked state indicator */}
          {phase === 'LOCKED' && (
            <div className="mb-6 p-4 go-bg-elevated rounded-sm phase-resolving go-expand">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 go-text-metallic" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="text-sm font-light text-white/70">Resolution Complete</span>
              </div>
            </div>
          )}

          {/* LLM Failure State */}
          {llmFailed && (
            <div className="mb-8 p-8 bg-[#111216] border border-white/10 rounded-sm text-center">
              <h2 className="text-xl font-medium text-white mb-4">
                Unable to Resolve Outcome
              </h2>
              <p className="text-white/70 mb-2 leading-relaxed">
                This calculator requires live AI interpretation to resolve nuanced outcomes.
                The system could not analyze your request at this time.
              </p>
              <p className="text-white/50 text-sm mt-4 italic">
                No results are shown to avoid misleading recommendations.
              </p>
              <p className="text-white/40 text-sm mt-6">
                Try again in a moment.
              </p>
            </div>
          )}


          {/* Footer Disclosure */}
          <div className="mt-32 pt-8 border-t border-white/5">
            <p className="text-xs text-white/30 leading-relaxed text-center max-w-2xl mx-auto">
              Demo system using a static dispensary inventory for concept validation.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

