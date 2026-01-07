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
import { OutcomeIntent, OutcomeResult } from '@/lib/goOutcomeEngine';
import { resolveOutcome } from '@/lib/goOutcomeEngine';
import { resolveToNamedStrains, type NamedResolutionResult } from '@/lib/namedResolution';
import ResolutionPanel, { type ResolvedBlend, type ResolvedCultivar, type CultivarRole } from '@/components/ResolutionPanel';
import { StrategicGuidance, ClarificationQuestion } from '@/lib/strategicGuidance';
import { DEMO_MENU } from '@/data/demoMenu';
import { translateGuidanceToIntent } from '@/lib/guidanceToIntent';
import { ReferenceProfile, referenceProfileToIntent } from '@/lib/referenceProfile';
import { convertToResolvedBlend } from '@/lib/convertToResolvedBlend';
import { computeIntentConfidence, filterRedundantQuestions, shouldClarify } from '@/lib/intentConfidence';

type InteractionPhase = 'FREE' | 'GUIDED' | 'LOCKED';

interface GuidanceResponse {
  ok: boolean;
  guidance?: StrategicGuidance;
  error?: string;
  message?: string;
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

export default function Home() {
  // Phase 1 (FREE): User input
  const [userInput, setUserInput] = useState('');

  // Reference Profile Comparison (stateless, session-only)
  const [inputMode, setInputMode] = useState<'outcome' | 'reference'>('outcome');
  const [referenceProfile, setReferenceProfile] = useState<ReferenceProfile | null>(null);
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
  // Clarification answers: can be string (single-select) or string[] (multi-select for sensitivities)
  const [clarificationAnswers, setClarificationAnswers] = useState<Record<string, string | string[]>>({});

  // Phase 3 (LOCKED): Engine inputs and outputs
  const [intent, setIntent] = useState<OutcomeIntent | null>(null);
  const [outcome, setOutcome] = useState<OutcomeResult | null>(null);
  const [namedResolution, setNamedResolution] = useState<NamedResolutionResult | null>(null);
  const [resolvedBlend, setResolvedBlend] = useState<ResolvedBlend | null>(null);

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
            if (recognitionRef.current) {
              setTimeout(() => {
                if (recognitionRef.current && !explicitStopRef.current) {
                  try {
                    recognitionRef.current.start();
                  } catch (err) {
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
      } catch (err) {
        console.error('Failed to stop recognition:', err);
        explicitStopRef.current = false;
        setIsListening(false);
        if (interimTranscriptRef.current) {
          setUserInput((prev) => prev + interimTranscriptRef.current + ' ');
          interimTranscriptRef.current = '';
        }
      }
    }
  };

  // Phase 1: Free expression - get strategic guidance from LLM
  // NEW: Direct input handler - takes userInput and calls /api/intent
  const handleAnalyze = async () => {
    // VOICE STATE FIX #6: stopListening() must be called automatically on Analyze
    if (isListening && recognitionRef.current) {
      try {
        explicitStopRef.current = true;
        recognitionRef.current.stop();
        setIsListening(false);
      } catch (err) {
        console.error('Failed to stop recognition during analyze:', err);
      }
    }

    setIsProcessing(true);
    setError(null);
    setLlmFailed(false);

    // NOTE: We do NOT clear resolvedBlend immediately to support "State Retention"
    // Only clear it on confirmed failure or new success

    // Reference Profile mode: Convert reference to intent and resolve directly
    if (inputMode === 'reference' && referenceProfile) {
      try {
        setPhase('LOCKED');

        // Convert reference profile to OutcomeIntent
        const referenceIntent = referenceProfileToIntent(referenceProfile);
        setIntent(referenceIntent);

        console.debug('REFERENCE_PROFILE_INTENT', referenceIntent);
        console.debug('RESOLUTION_ATTEMPTED', true);

        // Resolve using the same deterministic engine
        const resolvedOutcome = resolveOutcome(referenceIntent);
        setOutcome(resolvedOutcome);

        if (resolvedOutcome.failure) {
          console.debug('RESOLUTION_FAILED_REASON', resolvedOutcome.failure.reason);
          const blend = convertToResolvedBlend(
            { primaryBlend: [], stackingOptions: [], confidenceScore: 0, tradeoffs: [], rationaleSummary: '', resolutionMode: 'BLENDED' },
            resolvedOutcome
          );
          setResolvedBlend(blend);
          setIsProcessing(false);
          return;
        }

        // Convert to named resolution
        const named = resolveToNamedStrains(resolvedOutcome);
        setNamedResolution(named);
        const blend = convertToResolvedBlend(named, resolvedOutcome);
        setResolvedBlend(blend);
        setIsProcessing(false);
      } catch (err) {
        console.error('Reference profile resolution error:', err);
        setError('Failed to resolve reference profile. Please check your input values.');
        setIsProcessing(false);
      }
      return;
    }

    // Normal outcome mode: Use LLM-based intent parsing
    if (!userInput.trim()) {
      setError('Please enter your desired outcome');
      setIsProcessing(false);
      return;
    }

    try {
      // Call /api/intent with userInput directly
      const guidanceResponse = await fetch('/api/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: userInput.trim() }),
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

      // HARD CLARIFICATION GATE: Compute confidence and enforce threshold
      const confidence = computeIntentConfidence(guidanceData.guidance);

      // Filter out redundant questions that restate already-expressed preferences
      const filteredQuestions = guidanceData.guidance.clarificationNeeded
        ? filterRedundantQuestions(guidanceData.guidance.clarificationNeeded, confidence)
        : [];

      // Only ask if confidence is below threshold AND questions remain after filtering
      const needsClarification = shouldClarify(confidence) && filteredQuestions.length > 0;

      if (needsClarification) {
        // Update guidance with filtered questions
        setGuidance({
          ...guidanceData.guidance,
          clarificationNeeded: filteredQuestions,
        });
        setPhase('GUIDED');
      } else {
        // Confidence is high enough - proceed directly to resolution
        // Clear any questions that were filtered out
        setGuidance({
          ...guidanceData.guidance,
          clarificationNeeded: [],
        });
        console.debug('RESOLUTION_ATTEMPTED', true);
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
  // VOICE STATE FIX #6: stopListening() must be called automatically on Resolve
  const handleLock = (finalGuidance: StrategicGuidance, answers: Record<string, string | string[]>) => {
    // Stop voice listening before resolving
    if (isListening && recognitionRef.current) {
      try {
        explicitStopRef.current = true;
        recognitionRef.current.stop();
        setIsListening(false);
      } catch (err) {
        console.error('Failed to stop recognition during resolve:', err);
      }
    }

    // Instead of locking, we just update the state
    // setPhase('LOCKED'); // REMOVED PER AUDIT

    // Translate strategic guidance to numeric intent constraints
    const translatedIntent = translateGuidanceToIntent(finalGuidance, answers);
    setIntent(translatedIntent);

    console.debug('RESOLUTION_ATTEMPTED', true);
    console.debug('RESOLUTION_INTENT', translatedIntent);

    // Resolve outcome using deterministic engine
    try {
      const resolvedOutcome = resolveOutcome(translatedIntent);
      setOutcome(resolvedOutcome);

      // Check for failure state
      if (resolvedOutcome.failure) {
        console.debug('RESOLUTION_FAILED_REASON', resolvedOutcome.failure.reason);
        console.debug('RESOLUTION_FAILED_DETAILS', resolvedOutcome.failure.details);
        const blend = convertToResolvedBlend({ primaryBlend: [], stackingOptions: [], confidenceScore: 0, tradeoffs: [], rationaleSummary: '', resolutionMode: 'BLENDED' }, resolvedOutcome);
        setResolvedBlend(blend);
        // VOICE STATE FIX #6: stopListening() must be called automatically on Failure
        if (isListening && recognitionRef.current) {
          try {
            explicitStopRef.current = true;
            recognitionRef.current.stop();
            setIsListening(false);
          } catch (err) {
            console.error('Failed to stop recognition on failure:', err);
          }
        }
        return;
      }

      console.debug('RESOLUTION_SUCCESS', true);
      // VOICE STATE FIX #6: stopListening() must be called automatically on Success
      if (isListening && recognitionRef.current) {
        try {
          explicitStopRef.current = true;
          recognitionRef.current.stop();
          setIsListening(false);
        } catch (err) {
          console.error('Failed to stop recognition on success:', err);
        }
      }

      // MANDATORY: Convert to named resolution (maps abstract chemotypes to actual strain names)
      const named = resolveToNamedStrains(resolvedOutcome);
      setNamedResolution(named);

      // Convert to ResolvedBlend format for ResolutionPanel
      const blend = convertToResolvedBlend(named, resolvedOutcome);
      setResolvedBlend(blend);

      // If we were in GUIDED phase, reset to FREE so questions disappear (or keep them?)
      // Better to clear guidance so we return to "Input" state
      setPhase('FREE');
      setGuidance(null);
      setClarificationAnswers({});

    } catch (err) {
      console.error('Resolution error:', err);
      setError('Failed to resolve outcome. Please try again.');
    }
  };

  // Handle clarification answer updates
  // For sensitivity questions (tradeoff type), supports multi-select with mutual exclusivity for "None / Balanced"
  const handleClarificationAnswer = (questionType: string, answer: string, isMultiSelect: boolean = false) => {
    setClarificationAnswers(prev => {
      // Check if this is a sensitivity question (tradeoff type with specific options)
      const isSensitivityQuestion = questionType === 'tradeoff' &&
        ['Anxiety', 'Overstimulation', 'Mental drift', 'None / Balanced'].includes(answer);

      if (isSensitivityQuestion || isMultiSelect) {
        const current = prev[questionType];
        const currentArray = Array.isArray(current) ? current : (current ? [current] : []);

        // Handle "None / Balanced" mutual exclusivity
        if (answer === 'None / Balanced') {
          // If selecting "None / Balanced", clear all others
          return {
            ...prev,
            [questionType]: ['None / Balanced'],
          };
        } else {
          // If selecting any other option, remove "None / Balanced" if present
          let newArray = currentArray.filter(item => item !== 'None / Balanced');

          // Toggle the selected option
          if (newArray.includes(answer)) {
            // Deselect if already selected
            newArray = newArray.filter(item => item !== answer);
          } else {
            // Select if not already selected
            newArray.push(answer);
          }

          return {
            ...prev,
            ...(newArray.length > 0 ? { [questionType]: newArray } : {}),
          };
        }
      } else {
        // Single-select behavior (non-sensitivity questions)
        return {
          ...prev,
          [questionType]: answer,
        };
      }
    });
  };

  // Check if all clarifications are answered
  const allClarificationsAnswered = (): boolean => {
    if (!guidance || !guidance.clarificationNeeded || guidance.clarificationNeeded.length === 0) {
      return true;
    }
    return guidance.clarificationNeeded.every((q) => {
      const answer = clarificationAnswers[q.type];
      // For multi-select (sensitivity questions), check if array has at least one item
      if (Array.isArray(answer)) {
        return answer.length > 0;
      }
      // For single-select, check if value exists
      return answer !== undefined && answer !== null && answer !== '';
    });
  };

  return (
    <main className="min-h-screen w-full bg-[#0B0B0D] text-[#EDEDED]" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div className="pt-8 pb-8 h-screen flex flex-col">
        {/* LOGO HEADER - Always visible, compacted */}
        <div className="text-center pb-6 border-b border-[rgba(255,255,255,0.06)] flex-shrink-0">
          <div className="flex items-center justify-center">
            <Image
              src="/go-logo.png"
              alt="GO Line"
              width={240}
              height={80}
              className="w-auto h-16 opacity-100"
            />
          </div>
        </div>

        {/* MAIN CONTENT - 2 Column Grid */}
        <div className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">

            {/* LEFT COLUMN: CONTROL SURFACE (Input + Settings) */}
            <div className="lg:col-span-5 flex flex-col h-full overflow-y-auto pr-2">

              {/* Mode Toggles */}
              <div className="flex gap-4 text-xs mb-6 shrink-0">
                <button
                  onClick={() => {
                    setInputMode('outcome');
                    setReferenceProfile(null);
                    setUserInput('');
                    // Do NOT clear resolvedBlend - keep context
                    setPhase('FREE');
                  }}
                  className={`px-3 py-1.5 transition-colors uppercase tracking-wider ${inputMode === 'outcome'
                    ? 'bg-white/10 text-white border border-[#D4AF37]/30'
                    : 'text-white/40 hover:text-white/70 border border-transparent'
                    }`}
                >
                  Describe Outcome
                </button>
                <button
                  onClick={() => {
                    setInputMode('reference');
                    // Do NOT clear resolvedBlend
                    setPhase('FREE');
                  }}
                  className={`px-3 py-1.5 transition-colors uppercase tracking-wider ${inputMode === 'reference'
                    ? 'bg-white/10 text-white border border-[#D4AF37]/30'
                    : 'text-white/40 hover:text-white/70 border border-transparent'
                    }`}
                >
                  Match Product
                </button>
              </div>

              {/* Primary Input */}
              <div className="mb-0 flex-1 flex flex-col min-h-[200px] lg:min-h-0">
                {inputMode === 'outcome' ? (
                  <div className="relative flex-1 flex flex-col">
                    <div className="relative flex-1">
                      <textarea
                        id="outcome-input"
                        value={userInput + (isListening && interimTranscriptRef.current ? interimTranscriptRef.current : '')}
                        onChange={(e) => setUserInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                            handleAnalyze();
                          }
                        }}
                        placeholder="Describe the desired effect..."
                        className="w-full h-full px-6 py-6 pr-20 bg-white/5 border border-white/10 focus:border-[#D6A84A]/60 text-white placeholder-white/20 text-lg leading-relaxed focus:outline-none resize-none transition-colors rounded-lg font-mono shadow-inner"
                        disabled={isProcessing} // Never fully locked, just disabled during processing
                      />

                      {/* Voice Controls */}
                      {speechSupported && !isProcessing && (
                        <div className="absolute right-4 bottom-4">
                          {!isListening ? (
                            <button
                              type="button"
                              onClick={startListening}
                              className="p-2 text-white/30 hover:text-white/80 transition-colors"
                              title="Start listening"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={stopListening}
                              className="p-2 text-[#D6A84A] animate-pulse transition-colors"
                              title="Stop listening"
                            >
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="1" /></svg>
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Resolve Action Bar */}
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={handleAnalyze}
                        disabled={isProcessing || !userInput.trim()}
                        className="px-6 py-3 bg-[#D6A84A]/10 hover:bg-[#D6A84A]/20 border border-[#D6A84A]/40 text-[#D6A84A] text-sm uppercase tracking-wider transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {isProcessing ? (
                          <>
                            <span className="w-2 h-2 bg-[#D6A84A] rounded-full animate-pulse" />
                            Resolving...
                          </>
                        ) : (
                          <>
                            Update Configuration
                            <span className="text-xs opacity-60 ml-1">⌘↵</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center border border-dashed border-white/10 text-white/30 text-sm">
                    Reference profile input form (Coming Soon)
                  </div>
                )}
              </div>

              {/* GUIDANCE / CLARIFICATION PANEL - Appears below input when needed */}
              {phase === 'GUIDED' && guidance && (
                <div className="mt-8 mb-8 go-fade-in border-t border-white/10 pt-6">
                  <div className="mb-6">
                    <h3 className="text-xs uppercase tracking-wider text-[#D6A84A] mb-2">Signal Clarification Required</h3>
                    <p className="text-sm text-white/60">The resolution engine needs more specificity to ensure safety guarantees.</p>
                  </div>

                  {/* Clarification Questions */}
                  {guidance.clarificationNeeded && guidance.clarificationNeeded.length > 0 && (
                    <div className="space-y-8">
                      {guidance.clarificationNeeded.map((question, index) => (
                        <div key={index} className="space-y-3">
                          <label className="block text-sm font-medium text-white font-mono">
                            {/* Add number prefix */}
                            <span className="text-[#D6A84A] mr-2">0{index + 1}.</span>
                            {question.question}
                          </label>
                          <div className="flex flex-wrap gap-2 pl-6">
                            {question.options.map((option) => {
                              const isSensitivityQuestion = question.type === 'tradeoff' &&
                                ['Anxiety', 'Overstimulation', 'Mental drift', 'None / Balanced'].includes(option);

                              const answer = clarificationAnswers[question.type];
                              const isChecked = isSensitivityQuestion
                                ? Array.isArray(answer) && answer.includes(option)
                                : answer === option;

                              return (
                                <label
                                  key={option}
                                  className={`inline-flex items-center px-3 py-2 cursor-pointer transition-all border ${isChecked
                                    ? 'bg-[#D6A84A]/20 text-[#EDEDED] border-[#D6A84A]/40'
                                    : 'bg-transparent text-white/50 border-white/10 hover:border-white/30 hover:text-white/80'
                                    }`}
                                >
                                  <input
                                    type={isSensitivityQuestion ? "checkbox" : "radio"}
                                    name={`clarification-${question.type}`}
                                    value={option}
                                    checked={isChecked}
                                    onChange={(e) => handleClarificationAnswer(question.type, e.target.value, isSensitivityQuestion)}
                                    className="sr-only"
                                  />
                                  <span className="text-xs uppercase tracking-wider">{option}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-8 pl-6">
                    <button
                      onClick={() => handleLock(guidance, clarificationAnswers)}
                      disabled={!allClarificationsAnswered()}
                      className="w-full px-4 py-3 bg-[#EDEDED] text-[#0B0B0D] font-medium text-sm uppercase tracking-wider hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Confirm & Resolve
                    </button>
                  </div>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="mt-6 p-4 bg-red-900/20 border border-red-500/20 text-red-200/80 text-sm">
                  {error}
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: MONITOR SURFACE (Visualization) */}
            <div className="lg:col-span-7 h-full bg-[#0F1013]/50 border border-white/5 p-8 relative overflow-hidden">
              {/* Header Gradient */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#D6A84A]/20 to-transparent opacity-50" />

              {/* Persistent Resolution Panel */}
              <ResolutionPanel
                blend={resolvedBlend}
                intent={intent ? {
                  activationTarget: intent.activationTarget,
                  cognitiveEndurance: intent.cognitiveEndurance,
                  anxietySensitivity: intent.anxietySensitivity || 0.5,
                } : null}
                isComputing={isProcessing}
              />
            </div>

          </div>
        </div>

      </div>
    </main>
  );
}
