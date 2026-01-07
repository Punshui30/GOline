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

  // Phase management
  const [phase, setPhase] = useState<InteractionPhase>('FREE');
  const [guidance, setGuidance] = useState<StrategicGuidance | null>(null);
  // Clarification answers
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
      const needsClarification = shouldClarify(confidence) && filteredQuestions.length > 0;

      if (needsClarification) {
        setGuidance({
          ...guidanceData.guidance,
          clarificationNeeded: filteredQuestions,
        });
        setPhase('GUIDED');
      } else {
        setGuidance({
          ...guidanceData.guidance,
          clarificationNeeded: [],
        });
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

    try {
      const resolvedOutcome = resolveOutcome(translatedIntent);
      setOutcome(resolvedOutcome);

      if (resolvedOutcome.failure) {
        const blend = convertToResolvedBlend({ primaryBlend: [], stackingOptions: [], confidenceScore: 0, tradeoffs: [], rationaleSummary: '', resolutionMode: 'BLENDED' }, resolvedOutcome);
        setResolvedBlend(blend);
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
      setPhase('FREE');
      setGuidance(null);
      setClarificationAnswers({});

    } catch (err) {
      console.error('Resolution error:', err);
      setError('Failed to resolve outcome. Please try again.');
    }
  };

  const handleClarificationAnswer = (questionType: string, answer: string, isMultiSelect: boolean = false) => {
    setClarificationAnswers(prev => {
      const isSensitivityQuestion = questionType === 'tradeoff' &&
        ['Anxiety', 'Overstimulation', 'Mental drift', 'None / Balanced'].includes(answer);

      if (isSensitivityQuestion || isMultiSelect) {
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
      } else {
        return { ...prev, [questionType]: answer };
      }
    });
  };

  // PART 2: Render Layer - Swiss Editorial / Flat
  // Strict Grid, Typography Dominant
  // Added Elevation: Visual Anchor, Deep Layering, Micro-motion
  // ALIGNMENT REPAIR: High Contrast, Visible Input Structure
  return (
    <div className={`min-h-screen bg-[#080808] text-[#E5E5E5] font-sans selection:bg-[#D6A84A]/30 overflow-x-hidden flex flex-col relative transition-colors duration-1000 ${isProcessing || userInput.length > 20 ? 'bg-black' : 'bg-[#080808]'}`}>

      {/* Visual Anchor: Abstract Botanical (Fixed, Deep Layer) */}
      <div className="fixed bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] z-0 pointer-events-none opacity-[0.03] select-none mix-blend-screen">
        <Image
          src="/botanical_anchor.png"
          alt=""
          fill
          className="object-contain grayscale"
          priority
        />
      </div>

      {/* Header - Strictly Typographic, Top-Left Anchor */}
      <header className="relative z-50 pt-16 px-6 lg:px-12 xl:px-24 flex justify-between items-baseline pointer-events-none">
        <div className="flex flex-col gap-2">
          {/* Extremely subtle anchor */}
          <span className="text-[10px] font-bold text-zinc-800 uppercase tracking-widest">GO // 2.1</span>
        </div>

        {/* Status - Only visible when active */}
        <div className={`transition-opacity duration-700 ${isProcessing ? 'opacity-100' : 'opacity-0'}`}>
          <span className="text-[10px] font-mono tracking-widest text-[#D6A84A] animate-pulse">THINKING...</span>
        </div>
      </header>

      <main className="flex-1 relative z-10 w-full max-w-[1920px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-x-12 px-6 lg:px-12 xl:px-24 pb-32 pt-16 lg:pt-32">

        {/* LEFT REGION: DOMINANT INPUT (Cols 1-7) */}
        <section className="lg:col-span-7 flex flex-col">

          {/* The Prompt */}
          <div className="mb-24 lg:mb-32 relative">
            <div className={`relative group transition-all duration-700`}>
              <textarea
                value={userInput}
                onChange={(e) => {
                  setUserInput(e.target.value);
                  if (phase === 'LOCKED' || resolvedBlend) {
                    setResolvedBlend(null);
                    setPhase('FREE');
                    setGuidance(null);
                  }
                }}
                placeholder="How do you want to feel?"
                className="w-full bg-transparent text-5xl lg:text-7xl xl:text-8xl font-light leading-[1.05] tracking-tight text-white placeholder-zinc-500 outline-none resize-none border-b border-zinc-800 focus:border-[#D6A84A] py-8 transition-colors duration-300 overflow-y-hidden max-h-[400px]"
                rows={3}
                disabled={isProcessing}
                spellCheck={false}
              />
            </div>

            {/* Simpler Interaction / Action */}
            <div className="mt-12 flex items-center gap-8">
              <button
                onClick={handleAnalyze}
                disabled={!userInput.trim() || isProcessing}
                className={`
                  text-lg font-medium transition-all duration-300 flex items-center gap-4 group px-6 py-3 border border-transparent
                  ${userInput.trim() ? 'text-[#080808] bg-[#D6A84A] hover:bg-white' : 'text-zinc-500 bg-zinc-900 border-zinc-800 cursor-not-allowed'}
                `}
              >
                <span>RESOLVE</span>
                {userInput.trim() && <span className="block w-2 h-2 bg-current rounded-full" />}
              </button>
            </div>
          </div>

          {/* Clarification (Swiss List Style) */}
          {guidance?.clarificationNeeded && guidance.clarificationNeeded.length > 0 && !resolvedBlend && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-700 mt-12">
              <div className="space-y-16">
                {guidance.clarificationNeeded.map((q, idx) => (
                  <div key={idx} className="group">
                    <p className="text-2xl text-[#E5E5E5] mb-6 font-light leading-snug">{q.question}</p>
                    <div className="flex flex-col items-start gap-4">
                      {q.options.map((option) => {
                        const isSelected = clarificationAnswers[q.type] === option ||
                          (Array.isArray(clarificationAnswers[q.type]) && (clarificationAnswers[q.type] as string[]).includes(option));

                        return (
                          <button
                            key={option}
                            onClick={() => handleClarificationAnswer(q.type, option, q.type === 'tolerance' || q.type === 'priority')}
                            className={`text-base transition-all duration-500 text-left relative py-1 ${isSelected
                              ? 'text-[#D6A84A] font-medium pl-6'
                              : 'text-zinc-600 hover:text-zinc-300 pl-0 hover:pl-2'
                              }`}
                          >
                            <span className={`absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#D6A84A] transition-all duration-500 ${isSelected ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`} />
                            {option}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* RIGHT REGION: PROGRESSIVE RESOLUTION (Cols 9-12) */}
        {/* Added subtle elevation drop-shadow to lift it off the background slightly */}
        <section className="lg:col-start-9 lg:col-span-4 mt-24 lg:mt-0 relative">
          {resolvedBlend && (
            <div className="animate-in fade-in duration-1000 fill-mode-forwards">
              <div className="sticky top-32 drop-shadow-2xl">
                <ResolutionPanel
                  blend={resolvedBlend}
                  intent={guidance ? {
                    activationTarget: 0.5,
                    cognitiveEndurance: 0.5,
                    anxietySensitivity: 0.5,
                    ...intent
                  } : undefined}
                  isComputing={isProcessing}
                />
              </div>
            </div>
          )}
        </section>

      </main>

      {/* Microphone - Fixed Bottom Right, Minimal Text/Icon */}
      <div className="fixed bottom-12 right-12 z-50 mix-blend-difference">
        <button
          onClick={isListening ? stopListening : startListening}
          className={`flex items-center gap-4 transition-colors duration-500 ${isListening ? 'text-[#D6A84A]' : 'text-zinc-600 hover:text-white'}`}
        >
          <span className="text-[10px] font-bold tracking-[0.2em] uppercase hidden lg:block">
            {isListening ? 'LISTENING' : 'VOICE INPUT'}
          </span>
          <div className={`w-3 h-3 rounded-full transition-all duration-500 ${isListening ? 'bg-current scale-125' : 'border border-current'}`} />
        </button>
      </div>

    </div>
  );
}
