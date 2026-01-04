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
import { StrategicGuidance, ClarificationQuestion } from '@/lib/strategicGuidance';
import { translateGuidanceToIntent } from '@/lib/guidanceToIntent';

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

  // Phase management
  const [phase, setPhase] = useState<InteractionPhase>('FREE');
  const [guidance, setGuidance] = useState<StrategicGuidance | null>(null);
  const [clarificationAnswers, setClarificationAnswers] = useState<Record<string, string>>({});

  // Phase 3 (LOCKED): Engine inputs and outputs
  const [intent, setIntent] = useState<OutcomeIntent | null>(null);
  const [outcome, setOutcome] = useState<OutcomeResult | null>(null);

  // Conversational state (seam for LLM separation)
  const [conversation, setConversation] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [intentSummary, setIntentSummary] = useState<string>('');
  const [axesClosed, setAxesClosed] = useState(false);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setSpeechSupported(true);
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
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
          setIsListening(false);
          if (event.error === 'no-speech') {
            setError('No speech detected. Please try again.');
          } else if (event.error === 'not-allowed') {
            setError('Microphone permission denied. Please enable microphone access.');
          }
        };

        recognition.onend = () => {
          setIsListening(false);
          // Append any remaining interim transcript
          if (interimTranscriptRef.current) {
            setUserInput((prev) => prev + interimTranscriptRef.current + ' ');
            interimTranscriptRef.current = '';
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
        recognitionRef.current.start();
      } catch (err) {
        console.error('Failed to start recognition:', err);
        setError('Failed to start voice input. Please try again.');
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
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

      // Update conversation with assistant response
      const newConversation = [
        ...updatedConversation,
        { role: 'assistant' as const, content: data.message },
      ];
      setConversation(newConversation);

      // Build structured summary from conversation (not raw messages)
      const summary = newConversation
        .filter(msg => msg.role === 'user')
        .map(msg => msg.content)
        .join('\n\n');
      setIntentSummary(summary);

      // For now, axes closed after 2 user messages (can be refined)
      if (newConversation.filter(msg => msg.role === 'user').length >= 2) {
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
    } catch (err) {
      console.error('Resolution error:', err);
      setError('Failed to resolve outcome. Please try again.');
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

  // Determine visual phase for styling
  const visualPhase = isProcessing ? 'clarifying' : phase === 'FREE' ? 'listening' : phase === 'LOCKED' ? 'resolving' : 'clarifying';
  
  // Compute dimensional weights from intent (vector-based, not categorical)
  const dimensionWeights = computeDimensionWeights(intent);
  const dimensionColor = computeDimensionColor(dimensionWeights);
  const outcomeEmphasis = computeOutcomeIconEmphasis(dimensionWeights);

  return (
    <main className="min-h-screen w-full go-bg-primary text-white">
      <div className="pt-16 pb-20">
        <div className="max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12 text-center border-b border-white/5 pb-8 go-fade-in">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-light text-white mb-4 tracking-tight flex items-center justify-center gap-3">
              <Image 
                src="/go-logo.png" 
                alt="GO" 
                width={80} 
                height={80} 
                className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 object-contain"
              />
              Line
            </h1>
            <p className="text-base md:text-lg text-white/50 font-light leading-relaxed max-w-2xl mx-auto">
              Outcome Resolution Layer
            </p>
          </div>

          {/* Outcome Constellation - Dimension-based visual emphasis */}
          <div className="mb-12 go-fade-in">
            <div className="go-bg-elevated rounded-sm p-6">
              <div className="grid grid-cols-4 gap-4">
                {/* RELAX - calm + low energy */}
                <div 
                  className="flex flex-col items-center gap-2 p-4 rounded transition-all duration-500"
                  style={{
                    color: `rgba(${dimensionColor}, ${0.2 + outcomeEmphasis.relax * 0.6})`,
                    opacity: 0.3 + outcomeEmphasis.relax * 0.7,
                  }}
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <span className="text-xs font-light tracking-wide">RELAX</span>
                </div>
                {/* STUDY - clarity + moderate energy */}
                <div 
                  className="flex flex-col items-center gap-2 p-4 rounded transition-all duration-500"
                  style={{
                    color: `rgba(${dimensionColor}, ${0.2 + outcomeEmphasis.study * 0.6})`,
                    opacity: 0.3 + outcomeEmphasis.study * 0.7,
                  }}
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <span className="text-xs font-light tracking-wide">STUDY</span>
                </div>
                {/* MOVE - energy + mood_lift */}
                <div 
                  className="flex flex-col items-center gap-2 p-4 rounded transition-all duration-500"
                  style={{
                    color: `rgba(${dimensionColor}, ${0.2 + outcomeEmphasis.move * 0.6})`,
                    opacity: 0.3 + outcomeEmphasis.move * 0.7,
                  }}
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="text-xs font-light tracking-wide">MOVE</span>
                </div>
                {/* SLEEP - sedation + calm */}
                <div 
                  className="flex flex-col items-center gap-2 p-4 rounded transition-all duration-500"
                  style={{
                    color: `rgba(${dimensionColor}, ${0.2 + outcomeEmphasis.sleep * 0.6})`,
                    opacity: 0.3 + outcomeEmphasis.sleep * 0.7,
                  }}
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                  <span className="text-xs font-light tracking-wide">SLEEP</span>
                </div>
              </div>
            </div>
          </div>

          {/* Intent Presets (Offline Testing) */}
          <div className="mb-6">
            <div className="bg-[#111216] border border-white/10 rounded-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-medium text-white/60 uppercase tracking-wider">
                  Preset Intent (AI Offline)
                </label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                    setLlmFailed(false);
                    setError(null);
                  }}
                  className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-sm text-white text-sm font-mono hover:bg-white/10 hover:border-white/20 transition-colors text-left"
                >
                  Social & upbeat
                </button>
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
                    setLlmFailed(false);
                    setError(null);
                  }}
                  className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-sm text-white text-sm font-mono hover:bg-white/10 hover:border-white/20 transition-colors text-left"
                >
                  Relaxed but alert
                </button>
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
                    setLlmFailed(false);
                    setError(null);
                  }}
                  className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-sm text-white text-sm font-mono hover:bg-white/10 hover:border-white/20 transition-colors text-left"
                >
                  Wind down later
                </button>
              </div>
              <p className="text-xs text-white/40 mt-3 italic">
                Use these presets to test the engine without AI interpretation.
              </p>
            </div>
          </div>

          {/* Input Section */}
          <div className="mb-12">
            <div className="bg-[#111216] border border-white/10 rounded-sm p-6">
              <label htmlFor="outcome-input" className="block text-sm font-medium text-white/80 mb-3">
                Describe desired outcome
              </label>
              <p className="text-xs text-white/40 mb-3 italic">
                Describe what you want now — and later, if applicable.
              </p>
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
                  placeholder="Example: I need something energizing for afternoon work, but I'm sensitive to anxiety..."
                  className={`w-full h-32 px-4 py-3 pr-20 bg-[#050506] border rounded-sm text-white placeholder-white/20 font-light text-sm focus:outline-none resize-none transition-all ${
                    phase === 'LOCKED' 
                      ? 'border-white/5 opacity-50 cursor-not-allowed' 
                      : 'border-white/8 focus:border-white/20 focus:go-border-metallic'
                  }`}
                  disabled={isProcessing || phase === 'LOCKED'}
                />
                {speechSupported && (
                  <button
                    type="button"
                    onMouseDown={startListening}
                    onMouseUp={stopListening}
                    onTouchStart={(e) => {
                      e.preventDefault();
                      startListening();
                    }}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      stopListening();
                    }}
                    disabled={isProcessing}
                    className={`absolute right-3 top-3 p-2 rounded-sm transition-all ${
                      isListening
                        ? 'bg-red-500/20 border-red-500/50 animate-pulse'
                        : 'bg-white/5 border-white/20 hover:bg-white/10'
                    } border disabled:opacity-50 disabled:cursor-not-allowed`}
                    title={isListening ? 'Release to stop recording' : 'Hold to speak'}
                  >
                    <svg
                      className={`w-5 h-5 ${isListening ? 'text-red-400' : 'text-white/60'}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      {isListening ? (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      ) : (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                        />
                      )}
                    </svg>
                  </button>
                )}
              </div>
              {isListening && (
                <p className="mt-2 text-xs text-red-400/80 flex items-center gap-2">
                  <span className="inline-block w-2 h-2 bg-red-400 rounded-full animate-pulse"></span>
                  Listening... Release to stop
                </p>
              )}
              <div className="flex items-center justify-between mt-4">
                {phase === 'FREE' && (
                  <button
                    onClick={() => axesClosed ? handleAnalyze() : handleConversation(userInput)}
                    disabled={isProcessing || !userInput.trim()}
                    className="px-6 py-2.5 bg-white/10 border border-white/20 text-white font-light text-sm rounded-sm hover:bg-white/15 hover:border-white/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    {isProcessing ? (axesClosed ? 'Resolving...' : 'Processing...') : (axesClosed ? 'Resolve' : 'Send')}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Conversation output */}
          {conversation.length > 0 && (
            <div className="mb-12 mt-6 space-y-4">
              {conversation.map((msg, idx) => (
                <div
                  key={idx}
                  className={`max-w-[85%] rounded-lg px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'assistant'
                      ? 'bg-neutral-800 text-neutral-100'
                      : 'ml-auto bg-neutral-700 text-neutral-100'
                  }`}
                >
                  {msg.content}
                </div>
              ))}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mb-8 p-4 bg-[#1a0f0f] border border-red-500/20 rounded-sm">
              <p className="text-sm text-red-400/80">{error}</p>
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

          {/* Results Section - Only show if LLM succeeded */}
          {!llmFailed && intent && outcome && (
            <div className="space-y-8">
              {/* Outcome Constraints */}
              <div className="bg-[#111216] border border-white/10 rounded-sm p-6">
                <h2 className="text-lg font-medium text-white mb-4 border-b border-white/10 pb-2">
                  Outcome Constraints
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                  <div>
                    <div className="text-white/50 text-xs mb-1">Energy Level</div>
                    <div className="text-white">{valueToQualitative(intent.activationTarget)}</div>
                  </div>
                  <div>
                    <div className="text-white/50 text-xs mb-1">Anxiety Guardrails</div>
                    <div className="text-white">{valueToQualitative(intent.anxietySensitivity)}</div>
                  </div>
                  <div>
                    <div className="text-white/50 text-xs mb-1">Mental Stability Over Time</div>
                    <div className="text-white">{valueToQualitative(intent.cognitiveEndurance)}</div>
                  </div>
                  <div>
                    <div className="text-white/50 text-xs mb-1">Blend Aggressiveness</div>
                    <div className="text-white">
                      {intent.overshootTolerance < 0.4 ? 'Conservative' : 
                       intent.overshootTolerance < 0.7 ? 'Moderate' : 'Aggressive'}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-white/40 italic mt-4">
                  These describe how the system constrained the blend — not predicted effects.
                </p>
              </div>

              {/* Resolution Mode Display */}
              {outcome.resolutionMode === 'STACKED' && outcome.phases && (
                <div className="bg-[#111216] border border-white/10 rounded-sm p-6 mb-6">
                  <div className="mb-4">
                    <h2 className="text-lg font-medium text-white mb-2">
                      Resolution Mode: Stacked (Now / Later)
                    </h2>
                    <p className="text-sm text-white/60">
                      Your goal included both an active phase and a later wind-down phase.
                      Combining these into a single blend would require compromises that increase early-phase risk.
                      Separating them allows each phase to be optimized safely.
                    </p>
                  </div>
                </div>
              )}

              {outcome.resolutionMode === 'BLENDED' && (
                <div className="bg-[#111216] border border-white/10 rounded-sm p-6 mb-6">
                  <div className="mb-4">
                    <h2 className="text-lg font-medium text-white mb-2">
                      Resolution Mode: Single Composition
                    </h2>
                  </div>
                </div>
              )}

              {/* Stacked Phases - PART 6: Novice-Friendly UI */}
              {outcome.resolutionMode === 'STACKED' && outcome.phases && outcome.phases.length > 0 && (
                <div className="space-y-6">
                  {/* Header */}
                  <div className="bg-[#111216] border border-white/10 rounded-sm p-6 mb-6">
                    <h2 className="text-2xl font-medium text-white mb-2 flex items-center gap-2">
                      <span className="text-2xl">🔥</span>
                      Your Stacked Experience
                    </h2>
                    <p className="text-sm text-white/60 italic">
                      (Designed to change as you go)
                    </p>
                  </div>

                  {outcome.phases.map((phaseData, phaseIndex) => {
                    // Determine phase indicator and color
                    const isOpening = phaseData.phase === 'Top / Opening' || phaseData.phase === 'Primary / Early';
                    const isCore = phaseData.phase === 'Middle / Core';
                    const isLanding = phaseData.phase === 'End / Landing' || phaseData.phase === 'Later / Wind-Down';
                    
                    const phaseIndicator = isOpening ? '🟢' : isCore ? '🔵' : '🟣';
                    const phaseLabel = isOpening ? 'Start' : isCore ? 'Middle' : 'End';
                    const phaseTitle = phaseData.phase;

                    return (
                      <div key={phaseIndex} className="bg-[#111216] border border-white/10 rounded-sm p-6">
                        <div className="mb-4">
                          <h2 className="text-lg font-medium text-white mb-2 flex items-center gap-2">
                            <span className="text-xl">{phaseIndicator}</span>
                            <span>{phaseLabel} — {phaseTitle}</span>
                          </h2>
                          {phaseData.purpose && (
                            <p className="text-sm text-white/70 mb-2">
                              <span className="text-white/50">Purpose:</span> {phaseData.purpose}
                            </p>
                          )}
                          <p className="text-xs text-white/50 italic mb-4">
                            Chemotypes are selected based on chemical balance, not strain category.
                          </p>
                        </div>

                      <div className="space-y-3 mb-4">
                        {phaseData.composition.map((component) => (
                          <div
                            key={component.cultivarId}
                            className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
                          >
                            <div className="flex items-center gap-3">
                              <div className="text-white font-medium">{component.displayName}</div>
                              <span className="text-xs text-white/40 font-mono px-2 py-0.5 bg-white/5 rounded">
                                {roleToLabel(component.role)}
                              </span>
                            </div>
                            <div className="text-white/60 font-mono text-sm">
                              {component.ratio}%
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-white/60 text-sm">Composition Fit</span>
                            <span className="text-white font-medium">
                              {getCompositionFitLabel(phaseData.compositionFit).label}
                            </span>
                          </div>
                          <p className="text-xs text-white/50 italic">
                            {getCompositionFitLabel(phaseData.compositionFit).explanation}
                          </p>
                        </div>

                        {/* Mixing Instructions */}
                        {phaseData.instructions && (
                          <div className="mt-4 pt-4 border-t border-white/10">
                            <h3 className="text-sm font-medium text-white/90 mb-2">
                              Mixing Instructions
                            </h3>
                            <p className="text-white/80 text-sm leading-relaxed">
                              {phaseData.instructions}
                            </p>
                          </div>
                        )}

                        {phaseData.whatYoullFeel && (
                          <div className="mt-4 pt-4 border-t border-white/10">
                            <h3 className="text-sm font-medium text-white/90 mb-2">
                              What you'll feel:
                            </h3>
                            <p className="text-white/80 text-sm leading-relaxed italic">
                              {phaseData.whatYoullFeel}
                            </p>
                          </div>
                        )}

                        {phaseData.systemNotes.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-white/5">
                            <h3 className="text-sm font-medium text-white/80 mb-2">System Notes</h3>
                            <ul className="space-y-1">
                              {phaseData.systemNotes.map((note, index) => (
                                <li key={index} className="text-white/70 text-xs leading-relaxed">
                                  • {note}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                    );
                  })}

                  {/* Why This Is Stacked - PART 6 */}
                  <div className="bg-[#111216] border border-white/10 rounded-sm p-6">
                    <h3 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
                      <span>⚙️</span>
                      Why This Is Stacked
                    </h3>
                    <p className="text-white/70 text-sm leading-relaxed mb-3">
                      Instead of forcing one blend to do everything, this sequence:
                    </p>
                    <ul className="space-y-2 text-white/70 text-sm">
                      <li>• Delivers energy without anxiety</li>
                      <li>• Maintains the core experience</li>
                      <li>• Ends smoothly without abrupt drop-off</li>
                    </ul>
                  </div>

                  {/* Optional Adjustments - PART 6 */}
                  <div className="bg-[#111216] border border-white/10 rounded-sm p-6">
                    <h3 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
                      <span>🔧</span>
                      Optional Adjustments
                    </h3>
                    <ul className="space-y-2 text-white/70 text-sm">
                      <li>• <span className="text-white/90">Want a faster start?</span> → increase Opening Phase activation cultivar</li>
                      <li>• <span className="text-white/90">Want a softer ending?</span> → increase CBD or calming cultivar in End Phase</li>
                    </ul>
                  </div>

                  {/* Important Note - PART 6 */}
                  <div className="bg-[#1a0f1a] border border-purple-500/20 rounded-sm p-4">
                    <p className="text-white/90 text-sm leading-relaxed flex items-start gap-2">
                      <span className="text-lg">❗</span>
                      <span>
                        <span className="font-medium">Important Note:</span> Each phase is intentional. Changing phase order or ratios will change the experience.
                      </span>
                    </p>
                  </div>
                </div>
              )}

              {/* Blended Resolution Tiers */}
              {outcome.refused ? (
                <div className="bg-[#111216] border border-white/10 rounded-sm p-6">
                  <div className="py-4">
                    <p className="text-white/70 text-sm mb-2">No safe composition found under current constraints.</p>
                    <p className="text-white/50 text-xs">Consider refining intent parameters or adjusting overshoot tolerance.</p>
                  </div>
                </div>
              ) : outcome.resolutionMode !== 'STACKED' && outcome.tiers && outcome.tiers.length > 0 ? (
                <div className="space-y-6">
                  {outcome.tiers.map((tier, tierIndex) => (
                    <div key={tierIndex} className="bg-[#111216] border border-white/10 rounded-sm p-6">
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <h2 className="text-lg font-medium text-white">
                            {tier.tierLabel}
                          </h2>
                          <span className="text-xs text-white/40 font-mono px-2 py-1 bg-white/5 rounded">
                            {getResolutionTypeLabel(tier.resolutionType)}
                          </span>
                        </div>
                        <p className="text-sm text-white/60 mb-4">
                          {getTierDescription(tier)}
                        </p>
                      </div>

                        <p className="text-xs text-white/50 mb-4 italic">
                          Chemotypes are selected based on chemical balance, not strain category.
                        </p>

                      <div className="space-y-3 mb-4">
                        {tier.composition.map((component) => (
                          <div
                            key={component.cultivarId}
                            className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
                          >
                            <div className="flex items-center gap-3">
                              <div className="text-white font-medium">{component.displayName}</div>
                              <span className="text-xs text-white/40 font-mono px-2 py-0.5 bg-white/5 rounded">
                                {roleToLabel(component.role)}
                              </span>
                            </div>
                            <div className="text-white/60 font-mono text-sm">
                              {component.ratio}%
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-white/60 text-sm">Composition Fit</span>
                            <span className="text-white font-medium">
                              {getCompositionFitLabel(tier.compositionFit).label}
                            </span>
                          </div>
                          <p className="text-xs text-white/50 italic">
                            {getCompositionFitLabel(tier.compositionFit).explanation}
                          </p>
                        </div>

                        {/* Mixing Instructions */}
                        {tier.instructions && (
                          <div className="mt-4 pt-4 border-t border-white/10">
                            <h3 className="text-sm font-medium text-white/90 mb-2">
                              Mixing Instructions
                            </h3>
                            <p className="text-white/80 text-sm leading-relaxed">
                              {tier.instructions}
                            </p>
                          </div>
                        )}

                        {/* Why This Was Chosen */}
                        {tier.whyChosen && tier.whyChosen.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-white/5">
                            <h3 className="text-sm font-medium text-white/80 mb-2">
                              Why This Was Chosen
                            </h3>
                            <ul className="space-y-1">
                              {tier.whyChosen.map((reason, index) => (
                                <li key={index} className="text-white/70 text-xs leading-relaxed">
                                  • {reason}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Tradeoffs */}
                        {tier.tradeoffs && tier.tradeoffs.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-white/5">
                            <h3 className="text-sm font-medium text-white/80 mb-2">
                              Tradeoffs
                            </h3>
                            <ul className="space-y-1">
                              {tier.tradeoffs.map((tradeoff, index) => (
                                <li key={index} className="text-white/70 text-xs leading-relaxed">
                                  • {tradeoff}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* System Notes */}
                        {tier.systemNotes.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-white/5">
                            <h3 className="text-sm font-medium text-white/80 mb-2">System Notes</h3>
                            <ul className="space-y-1">
                              {tier.systemNotes.map((note, index) => (
                                <li key={index} className="text-white/70 text-xs leading-relaxed">
                                  • {note}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              {/* Static Explainer */}
              <div className="bg-[#111216] border border-white/10 rounded-sm p-6">
                <p className="text-sm text-white/70 leading-relaxed">
                  This system prioritizes balance and consistency over intensity.
                  When goals conflict chemically, it defaults to safer, more stable compositions.
                </p>
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <div className="mt-16 pt-8 border-t border-white/10">
            <p className="text-xs text-white/40 leading-relaxed text-center max-w-2xl mx-auto">
              This prototype uses canonical chemotype profiles representing common terpene + cannabinoid patterns.
              Live GO systems operate exclusively on QR-verified batch data from accredited testing laboratories.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

