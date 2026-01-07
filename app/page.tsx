'use client';

/**
 * GO Line — Guided Outcomes Calculator
 * 
 * Functional prototype demonstrating the Outcome Resolution Layer of the GO system.
 * This calculator translates natural language intent into structured cultivar blends
 * using deterministic terpene profiling and biphasic scoring logic.
 */

import { useState, useEffect, useRef } from 'react';
import { OutcomeIntent, OutcomeResult } from '@/lib/goOutcomeEngine';
import { resolveOutcome } from '@/lib/goOutcomeEngine';
import { resolveToNamedStrains, type NamedResolutionResult } from '@/lib/namedResolution';
import ResolutionPanel, { type ResolvedBlend, type ResolvedCultivar, type CultivarRole } from '@/components/ResolutionPanel';
import UsageProtocol from '@/components/UsageProtocol';
import AgeGate from '@/components/AgeGate';
import GoMark from '@/components/GoMark';
import OutcomeIntentInput from '@/components/OutcomeIntentInput';
import OutcomeTransitionBanner from '@/components/OutcomeTransitionBanner';
import { StrategicGuidance } from '@/lib/strategicGuidance';
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

  // Age gate and onboarding
  const [ageGateComplete, setAgeGateComplete] = useState(false);

  // Phase management
  const [phase, setPhase] = useState<InteractionPhase>('FREE');
  const [guidance, setGuidance] = useState<StrategicGuidance | null>(null);
  // Clarification answers
  const [clarificationAnswers, setClarificationAnswers] = useState<Record<string, string | string[]>>({});
  // Track resolved axes to prevent re-asking
  const [resolvedAxes, setResolvedAxes] = useState<Set<string>>(new Set());
  // Current clarification question (only one at a time)
  const [currentClarification, setCurrentClarification] = useState<{ type: string; question: string; options: string[] } | null>(null);

  // Phase 3 (LOCKED): Engine inputs and outputs
  const [intent, setIntent] = useState<OutcomeIntent | null>(null);
  const [outcome, setOutcome] = useState<OutcomeResult | null>(null);
  const [namedResolution, setNamedResolution] = useState<NamedResolutionResult | null>(null);
  const [resolvedBlend, setResolvedBlend] = useState<ResolvedBlend | null>(null);
  const [showUsageProtocol, setShowUsageProtocol] = useState(false);
  const [hasResolved, setHasResolved] = useState(false);

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
          if (event.error === 'no-speech') {
            return;
          } else if (event.error === 'not-allowed') {
            setIsListening(false);
            setError('Microphone permission denied. Please enable microphone access.');
          } else if (event.error === 'network' || event.error === 'aborted') {
            setIsListening(false);
          }
        };

        recognition.onend = () => {
          if (explicitStopRef.current) {
            explicitStopRef.current = false;
            setIsListening(false);
            if (interimTranscriptRef.current) {
              setUserInput((prev) => prev + interimTranscriptRef.current + ' ');
              interimTranscriptRef.current = '';
            }
          } else {
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
        explicitStopRef.current = false;
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
        explicitStopRef.current = true;
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
  const handleAnalyze = async () => {
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

    if (inputMode === 'reference' && referenceProfile) {
      try {
        setPhase('LOCKED');
        const referenceIntent = referenceProfileToIntent(referenceProfile);
        setIntent(referenceIntent);
        const resolvedOutcome = resolveOutcome(referenceIntent);
        setOutcome(resolvedOutcome);

        if (resolvedOutcome.failure) {
          const blend = convertToResolvedBlend(
            { primaryBlend: [], stackingOptions: [], confidenceScore: 0, tradeoffs: [], rationaleSummary: '', resolutionMode: 'BLENDED' },
            resolvedOutcome
          );
          setResolvedBlend(blend);
          setIsProcessing(false);
          return;
        }

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

    if (!userInput.trim()) {
      setError('Please enter your desired outcome');
      setIsProcessing(false);
      return;
    }

    try {
      const guidanceResponse = await fetch('/api/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: userInput.trim() }),
      });

      let guidanceData: GuidanceResponse;

      if (!guidanceResponse.ok) {
        try {
          const errorBody = await guidanceResponse.text();
          guidanceData = JSON.parse(errorBody);
        } catch (parseErr) {
          guidanceData = { ok: false, error: 'Parse error' };
        }
        setLlmFailed(true);
        setError(null);
        setIsProcessing(false);
        return;
      }

      try {
        guidanceData = await guidanceResponse.json();
      } catch (jsonError) {
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

      const confidence = computeIntentConfidence(guidanceData.guidance);
      const filteredQuestions = guidanceData.guidance.clarificationNeeded
        ? filterRedundantQuestions(guidanceData.guidance.clarificationNeeded, confidence)
        : [];
      
      // Filter out questions for already-resolved axes
      const unresolvedQuestions = filteredQuestions.filter(q => {
        const axis = getAxisFromQuestionType(q.type);
        return !resolvedAxes.has(axis);
      });

      const needsClarification = shouldClarify(confidence) && unresolvedQuestions.length > 0;

      if (needsClarification) {
        // Show only the first unresolved question
        const firstQuestion = unresolvedQuestions[0];
        setCurrentClarification({
          type: firstQuestion.type,
          question: firstQuestion.question,
          options: firstQuestion.options,
        });
        setGuidance({
          ...guidanceData.guidance,
          clarificationNeeded: [firstQuestion],
        });
        setPhase('GUIDED');
      } else {
        setCurrentClarification(null);
        setGuidance({
          ...guidanceData.guidance,
          clarificationNeeded: [],
        });
        handleLock(guidanceData.guidance, clarificationAnswers);
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setLlmFailed(true);
      setError(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const [isResolving, setIsResolving] = useState(false);

  const handleLock = (finalGuidance: StrategicGuidance, answers: Record<string, string | string[]>) => {
    if (isListening && recognitionRef.current) {
      try {
        explicitStopRef.current = true;
        recognitionRef.current.stop();
        setIsListening(false);
      } catch (err) {
        console.error('Failed to stop recognition during resolve:', err);
      }
    }

    const translatedIntent = translateGuidanceToIntent(finalGuidance, answers);
    setIntent(translatedIntent);

    // Clear previous visualization
    setResolvedBlend(null);
    setIsResolving(true);

    // Small delay to show clearing, then animate in new result
    setTimeout(() => {
      try {
        const resolvedOutcome = resolveOutcome(translatedIntent);
        setOutcome(resolvedOutcome);

        if (resolvedOutcome.failure) {
          const blend = convertToResolvedBlend({ primaryBlend: [], stackingOptions: [], confidenceScore: 0, tradeoffs: [], rationaleSummary: '', resolutionMode: 'BLENDED' }, resolvedOutcome);
          setResolvedBlend(blend);
          setIsResolving(false);
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

        if (isListening && recognitionRef.current) {
          try {
            explicitStopRef.current = true;
            recognitionRef.current.stop();
            setIsListening(false);
          } catch (err) {
            console.error('Failed to stop recognition on success:', err);
          }
        }

        const named = resolveToNamedStrains(resolvedOutcome);
        setNamedResolution(named);
        const blend = convertToResolvedBlend(named, resolvedOutcome);
        setResolvedBlend(blend);
        setIsResolving(false);
        setHasResolved(true);
        setPhase('FREE');
        setGuidance(null);
        setClarificationAnswers({});

      } catch (err) {
        console.error('Resolution error:', err);
        setError('Failed to resolve outcome. Please try again.');
        setIsResolving(false);
      }
    }, 200); // Small delay for visual clearing
  };

  const handleAdjustment = (adjustedIntent: {
    activationTarget: number;
    cognitiveEndurance: number;
    anxietySensitivity: number;
  }) => {
    if (!intent) return;
    
    setIsProcessing(true);
    setError(null);
    setHasResolved(false);

    // Clear previous visualization
    setResolvedBlend(null);
    setIsResolving(true);

    // Small delay to show clearing, then animate in new result
    setTimeout(() => {
      try {
        // Create updated intent with adjusted values
        const updatedIntent: OutcomeIntent = {
          ...intent,
          activationTarget: adjustedIntent.activationTarget,
          cognitiveEndurance: adjustedIntent.cognitiveEndurance,
          anxietySensitivity: adjustedIntent.anxietySensitivity,
        };
        
        setIntent(updatedIntent);
        
        // Re-resolve with adjusted intent
        const resolvedOutcome = resolveOutcome(updatedIntent);
        setOutcome(resolvedOutcome);

        if (resolvedOutcome.failure) {
          const blend = convertToResolvedBlend({ primaryBlend: [], stackingOptions: [], confidenceScore: 0, tradeoffs: [], rationaleSummary: '', resolutionMode: 'BLENDED' }, resolvedOutcome);
          setResolvedBlend(blend);
          setIsResolving(false);
          setIsProcessing(false);
          return;
        }

        const named = resolveToNamedStrains(resolvedOutcome);
        setNamedResolution(named);
        const blend = convertToResolvedBlend(named, resolvedOutcome);
        setResolvedBlend(blend);
        setIsResolving(false);
      } catch (err) {
        console.error('Adjustment error:', err);
        setError('Failed to adjust outcome. Please try again.');
        setIsResolving(false);
      } finally {
        setIsProcessing(false);
      }
    }, 200); // Small delay for visual clearing
  };

  const handleRefineOutcome = () => {
    // This is handled by ResolutionPanel showing adjustment controls
    // No additional action needed here
  };

  const handleShowUsageProtocol = () => {
    setShowUsageProtocol(true);
  };

  // Map question type to axis for tracking resolved dimensions
  const getAxisFromQuestionType = (questionType: string): string => {
    switch (questionType) {
      case 'tradeoff':
        return 'energy-anxiety'; // Energy vs calm, anxiety sensitivity
      case 'tolerance':
        return 'intensity'; // Intensity vs endurance
      case 'priority':
        return 'priority'; // Overall priority
      case 'temporal':
        return 'duration'; // Duration/temporal profile
      default:
        return questionType;
    }
  };

  const handleClarificationAnswer = (questionType: string, answer: string, isMultiSelect: boolean = false) => {
    // Mark this axis as resolved
    const axis = getAxisFromQuestionType(questionType);
    const updatedResolvedAxes = new Set([...resolvedAxes, axis]);
    setResolvedAxes(updatedResolvedAxes);

    setClarificationAnswers(prev => {
      const isSensitivityQuestion = questionType === 'tradeoff' &&
        ['Anxiety', 'Overstimulation', 'Mental drift', 'None / Balanced'].includes(answer);

      const updatedAnswers = isSensitivityQuestion || isMultiSelect
        ? (() => {
            const current = prev[questionType];
            const currentArray = Array.isArray(current) ? current : (current ? [current] : []);

            if (answer === 'None / Balanced') {
              return { ...prev, [questionType]: ['None / Balanced'] };
            } else {
              let newArray = currentArray.filter(item => item !== 'None / Balanced');
              if (newArray.includes(answer)) {
                newArray = newArray.filter(item => item !== answer);
              } else {
                newArray.push(answer);
              }
              return { ...prev, ...(newArray.length > 0 ? { [questionType]: newArray } : {}) };
            }
          })()
        : { ...prev, [questionType]: answer };

      // After answering, check if we need more clarification or can proceed
      if (guidance) {
        const confidence = computeIntentConfidence(guidance);
        const filteredQuestions = guidance.clarificationNeeded
          ? filterRedundantQuestions(guidance.clarificationNeeded, confidence)
          : [];
        
        const unresolvedQuestions = filteredQuestions.filter(q => {
          const qAxis = getAxisFromQuestionType(q.type);
          return !updatedResolvedAxes.has(qAxis);
        });

        // Clear current clarification
        setCurrentClarification(null);

        if (unresolvedQuestions.length > 0 && shouldClarify(confidence)) {
          // Show next question immediately
          const nextQuestion = unresolvedQuestions[0];
          setCurrentClarification({
            type: nextQuestion.type,
            question: nextQuestion.question,
            options: nextQuestion.options,
          });
          setGuidance({
            ...guidance,
            clarificationNeeded: [nextQuestion],
          });
        } else {
          // All dimensions resolved or confidence is high enough, proceed to calculation
          handleLock(guidance, updatedAnswers);
        }
      }

      return updatedAnswers;
    });
  };

  // Two mutually exclusive states: Input and Resolved
  const isResolved = resolvedBlend !== null;

  // Show age gate if not complete
  if (!ageGateComplete) {
    return <AgeGate onComplete={() => setAgeGateComplete(true)} />;
  }

  return (
    <div className="min-h-screen bg-noise text-[#E5E5E5] font-sans selection:bg-[#C5A065]/30 overflow-x-hidden flex flex-col">
      {/* Header */}
      <header className="pt-16 px-6 lg:px-12 xl:px-24 flex justify-between items-baseline">
        <div className="flex items-center gap-4">
          <GoMark
            className={`go-mark ${resolvedBlend ? "visible" : "hidden"}`}
          />
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-sans font-medium text-zinc-500 uppercase tracking-widest">GO // 2.1</span>
          </div>
        </div>
        {isProcessing && (
          <span className="text-[10px] font-mono font-medium tracking-widest text-zinc-400">PROCESSING...</span>
        )}
      </header>

      <main className="flex-1 w-full max-w-[1920px] mx-auto px-6 lg:px-12 xl:px-24 pb-32 pt-16 lg:pt-32 overflow-y-auto">
        {!isResolved ? (
          /* INPUT STATE: Header, textarea, submit button */
          <section className="max-w-3xl mx-auto">
            <div className="mb-8">
              <h1 className="font-serif text-5xl lg:text-7xl font-light text-white leading-tight mb-6">
                Calculate Your Outcome
              </h1>
              <p className="text-sm lg:text-base font-sans text-zinc-400 max-w-md border-l border-zinc-700 pl-4">
                Describe your desired physical and mental state. The system will calculate a precise blend formulation to match your needs.
              </p>
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
                        onClick={() => handleClarificationAnswer(
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

            <div className="mb-8 border-b border-zinc-700 focus-within:border-[#C5A065] transition-colors duration-300 py-4">
              <OutcomeIntentInput
                value={userInput}
                onChange={(newValue) => {
                  setUserInput(newValue);
                  if (phase === 'LOCKED' || resolvedBlend) {
                    setResolvedBlend(null);
                    setPhase('FREE');
                    setGuidance(null);
                    setCurrentClarification(null);
                    setResolvedAxes(new Set());
                    setClarificationAnswers({});
                  }
                  // Clear clarification if user starts typing new input
                  if (currentClarification) {
                    setCurrentClarification(null);
                    setResolvedAxes(new Set());
                    setClarificationAnswers({});
                  }
                }}
                onSubmit={handleAnalyze}
                disabled={isProcessing || !!currentClarification}
              />
            </div>

            <div className="mt-8 flex items-center gap-8">
              <button
                onClick={handleAnalyze}
                disabled={!userInput.trim() || isProcessing}
                className={`
                  text-sm font-medium tracking-widest uppercase transition-all duration-200 flex items-center gap-4 px-8 py-4
                  ${userInput.trim() 
                    ? 'text-black bg-[#C5A065] hover:bg-[#D4B075] active:bg-[#B89555] cursor-pointer' 
                    : 'text-zinc-500 bg-zinc-900 border border-zinc-800 cursor-not-allowed opacity-50'}
                `}
              >
                <span>Calculate My Outcome</span>
              </button>
            </div>

          </section>
        ) : (
          /* RESOLVED STATE: Header, blend visualization, composition breakdown, adjustment sliders */
          <section className="max-w-5xl mx-auto min-h-0 overflow-y-auto">
            {isResolving ? (
              <div className="flex items-center justify-center min-h-[400px]">
                <span className="text-sm font-sans text-zinc-400">Calculating...</span>
              </div>
            ) : (
              <ResolutionPanel
                blend={resolvedBlend}
                intent={intent ? {
                  activationTarget: intent.activationTarget || 0.5,
                  cognitiveEndurance: intent.cognitiveEndurance || 0.5,
                  anxietySensitivity: intent.anxietySensitivity || 0.5,
                } : undefined}
                isComputing={isProcessing}
                onRefineOutcome={handleRefineOutcome}
                onShowUsageProtocol={handleShowUsageProtocol}
                onAdjustment={handleAdjustment}
                isAnimating={!isProcessing}
                hasResolved={hasResolved}
              />
            )}
          </section>
        )}
      </main>

      {/* Microphone - Fixed Bottom Right */}
      <div className="fixed bottom-12 right-12 z-50">
        <button
          onClick={isListening ? stopListening : startListening}
          className={`flex items-center gap-4 transition-colors duration-500 ${isListening ? 'text-[#C5A065]' : 'text-zinc-600 hover:text-white'}`}
        >
          <span className="text-[10px] font-bold tracking-[0.2em] uppercase hidden lg:block">
            {isListening ? 'LISTENING' : 'VOICE INPUT'}
          </span>
          <div className={`w-3 h-3 rounded-full transition-all duration-500 ${isListening ? 'bg-current scale-125' : 'border border-current'}`} />
        </button>
      </div>

      {/* Usage Protocol Modal */}
      {showUsageProtocol && (
        <UsageProtocol onClose={() => setShowUsageProtocol(false)} />
      )}
    </div>
  );
}
