'use client';

// Force dynamic rendering to prevent static generation errors
export const dynamic = 'force-dynamic';

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
import { type ResolvedBlend } from '@/components/ResolutionPanel';
import UsageProtocol from '@/components/UsageProtocol';
import AgeGate from '@/components/AgeGate';
import DispensarySourceSplash from '@/components/DispensarySourceSplash';
import OutcomeInputPanel from '@/components/OutcomeInputPanel';
import ResolvingPanel from '@/components/ResolvingPanel';
import ResultPanel from '@/components/ResultPanel';
import { generateDeterministicExplanation, type DeterministicExplanation } from '@/lib/outcomeBrain/deterministicExplanation';
import { StrategicGuidance } from '@/lib/strategicGuidance';
import { translateGuidanceToIntent } from '@/lib/guidanceToIntent';
import { ReferenceProfile, referenceProfileToIntent } from '@/lib/referenceProfile';
import { convertToResolvedBlend } from '@/lib/convertToResolvedBlend';
import { computeIntentConfidence, filterRedundantQuestions, shouldClarify } from '@/lib/intentConfidence';

type InteractionPhase = 'FREE' | 'GUIDED' | 'LOCKED';
type OutcomePhase = 'input' | 'resolving' | 'result';

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
  const [userAge, setUserAge] = useState<number | null>(null);
  
  // Dispensary source splash (shows once per session after age gate)
  const [showSourceSplash, setShowSourceSplash] = useState<boolean | null>(null);
  
  useEffect(() => {
    // Check if user has seen splash in this session
    if (ageGateComplete) {
      const seen = typeof window !== 'undefined' ? sessionStorage.getItem('dispensary-splash-seen') : null;
      if (!seen) {
        setShowSourceSplash(true);
      } else {
        setShowSourceSplash(false);
      }
    }
  }, [ageGateComplete]);
  
  const handleContinueSplash = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('dispensary-splash-seen', 'true');
    }
    setShowSourceSplash(false);
  };

  // Phase management
  const [phase, setPhase] = useState<InteractionPhase>('FREE');
  const [guidance, setGuidance] = useState<StrategicGuidance | null>(null);
  // Clarification answers
  const [clarificationAnswers, setClarificationAnswers] = useState<Record<string, string | string[]>>({});
  // Track resolved axes to prevent re-asking
  const [resolvedAxes, setResolvedAxes] = useState<Set<string>>(new Set());
  // Current clarification question (only one at a time)
  const [currentClarification, setCurrentClarification] = useState<{ type: string; question: string; options: string[] } | null>(null);

  // Outcome Phase (controls main UI mount/unmount) - Single source of truth
  const [outcomePhase, setOutcomePhase] = useState<OutcomePhase>('input');

  // Phase 3 (LOCKED): Engine inputs and outputs
  const [intent, setIntent] = useState<OutcomeIntent | null>(null);
  const [outcome, setOutcome] = useState<OutcomeResult | null>(null);
  const [namedResolution, setNamedResolution] = useState<NamedResolutionResult | null>(null);
  const [resolvedBlend, setResolvedBlend] = useState<ResolvedBlend | null>(null);
  const [showUsageProtocol, setShowUsageProtocol] = useState(false);
  const [hasResolved, setHasResolved] = useState(false);
  const [deterministicExplanation, setDeterministicExplanation] = useState<DeterministicExplanation | null>(null);
  
  // LLM-generated explanations (separate from deterministic resolver)
  const [llmExplanation, setLlmExplanation] = useState<string | null>(null);
  const [llmUsageInstructions, setLlmUsageInstructions] = useState<string | null>(null);
  const [blendNickname, setBlendNickname] = useState<string | null>(null);
  const [blendHashtag, setBlendHashtag] = useState<string | null>(null);
  const [shareCaption, setShareCaption] = useState<string | null>(null);
  
  // Store original user input for explanation generation
  const [originalUserInput, setOriginalUserInput] = useState<string>('');

  /**
   * Generate LLM explanations after outcome is resolved
   * This runs asynchronously and does not block UI rendering
   */
  const generateLLMExplanations = async (blend: ResolvedBlend, userIntent: string, intent: OutcomeIntent) => {
    // Clear previous explanations
    setLlmExplanation(null);
    setLlmUsageInstructions(null);
    setBlendNickname(null);
    setBlendHashtag(null);
    setShareCaption(null);

    try {
      // Convert blend to format expected by API
      const blendComponents = blend.primaryBlend.map((cultivar) => ({
        name: cultivar.name,
        percentage: cultivar.percentage,
        role: cultivar.role,
      }));

      // Extract constraints from intent (consumer-friendly terms only)
      const constraints: string[] = [];
      if (intent.activation > 0.7) {
        constraints.push('high energy preference');
      } else if (intent.activation < 0.3) {
        constraints.push('calm and relaxation preference');
      }
      if (intent.cognitiveEndurance > 0.7) {
        constraints.push('sustained focus needs');
      }
      if (intent.anxietySensitivity > 0.6) {
        constraints.push('low anxiety tolerance');
      }

      // Extract dominant terpenes from blend if available
      // Note: This assumes terpene data is in the blend metadata or we calculate from strains
      const dominantTerpenes: Array<{ name: string; percentage: number }> = [];
      // TODO: Extract actual terpene data from blend when available
      // For now, pass empty array - this can be enhanced when terpene data structure is confirmed

      // IMPORTANT: LLM must not choose strains. It only explains math-selected blends.
      // Convert alternates if available
      const alternateBlends = blend.alternates?.map(alt => 
        alt.primaryBlend.map(c => ({
          name: c.name,
          percentage: c.percentage,
          role: c.role,
        }))
      );

      // Generate explanation
      const explanationResponse = await fetch('/api/explanation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIntent,
          blend: blendComponents,
          constraints,
          userAge,
          dominantTerpenes: dominantTerpenes.length > 0 ? dominantTerpenes : undefined,
          alternates: alternateBlends,
        }),
      });

      if (explanationResponse.ok) {
        const data = await explanationResponse.json();
        if (data.ok && data.explanation) {
          setLlmExplanation(data.explanation);
        }
      }

      // Generate usage instructions
      const intensity = intent.activationTarget || intent.activation || 0.5;
      const duration = intent.cognitiveEndurance || 0.5;
      
      const instructionsResponse = await fetch('/api/usage-instructions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blend: blendComponents,
          intensity,
          duration,
          userAge,
        }),
      });

      if (instructionsResponse.ok) {
        const data = await instructionsResponse.json();
        if (data.ok && data.instructions) {
          setLlmUsageInstructions(data.instructions);
        }
      }

      // Generate blend social content (nickname, hashtag, caption)
      const socialResponse = await fetch('/api/blend-social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIntent,
          blend: blendComponents,
          userAge,
          dominantTerpenes: dominantTerpenes.length > 0 ? dominantTerpenes : undefined,
        }),
      });

      if (socialResponse.ok) {
        const data = await socialResponse.json();
        if (data.ok) {
          setBlendNickname(data.blendNickname || null);
          setBlendHashtag(data.blendHashtag || null);
          setShareCaption(data.shareCaption || null);
        }
      }
    } catch (error) {
      console.error('Error generating LLM explanations:', error);
      // Don't set error state - explanations are optional, UI should still render
    }
  };

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

    // Clear previous explanations
    setLlmExplanation(null);
    setLlmUsageInstructions(null);
    setBlendNickname(null);
    setBlendHashtag(null);
    setShareCaption(null);

    if (inputMode === 'reference' && referenceProfile) {
      try {
        setPhase('LOCKED');
        const referenceIntent = referenceProfileToIntent(referenceProfile);
        setIntent(referenceIntent);
        
        // Transition to resolving phase
        setOutcomePhase('resolving');
        
        setTimeout(() => {
          const resolvedOutcome = resolveOutcome(referenceIntent);
          setOutcome(resolvedOutcome);
          setDeterministicExplanation(generateDeterministicExplanation(referenceIntent, resolvedOutcome));

          if (resolvedOutcome.failure) {
            const blend = convertToResolvedBlend(
              { primaryBlend: [], stackingOptions: [], confidenceScore: 0, tradeoffs: [], rationaleSummary: '', resolutionMode: 'BLENDED' },
              resolvedOutcome
            );
            setResolvedBlend(blend);
            setDeterministicExplanation(generateDeterministicExplanation(referenceIntent, resolvedOutcome));
            setOutcomePhase('result');
            setIsProcessing(false);
            return;
          }

          const named = resolveToNamedStrains(resolvedOutcome);
          setNamedResolution(named);
          const blend = convertToResolvedBlend(named, resolvedOutcome);
          setResolvedBlend(blend);
          setDeterministicExplanation(generateDeterministicExplanation(referenceIntent, resolvedOutcome));
          
          // Generate LLM explanations asynchronously (non-blocking)
          generateLLMExplanations(blend, originalUserInput || userInput || 'Default blend selection', referenceIntent);
          
          setOutcomePhase('result');
          setIsProcessing(false);
        }, 200);
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
    setDeterministicExplanation(null);
    setLlmExplanation(null);
    setLlmUsageInstructions(null);
    setBlendNickname(null);
    setBlendHashtag(null);
    setShareCaption(null);
    
    // Store original user input for explanation generation
    setOriginalUserInput(userInput);
    
    // CRITICAL: Set phase to 'resolving' BEFORE async call
    setOutcomePhase('resolving');

    // Small delay to ensure resolving panel mounts, then calculate
    setTimeout(() => {
      try {
        const resolvedOutcome = resolveOutcome(translatedIntent);
        setOutcome(resolvedOutcome);
        setDeterministicExplanation(generateDeterministicExplanation(translatedIntent, resolvedOutcome));

        if (resolvedOutcome.failure) {
          const blend = convertToResolvedBlend({ primaryBlend: [], stackingOptions: [], confidenceScore: 0, tradeoffs: [], rationaleSummary: '', resolutionMode: 'BLENDED' }, resolvedOutcome);
          setResolvedBlend(blend);
          setDeterministicExplanation(generateDeterministicExplanation(translatedIntent, resolvedOutcome));
          setOutcomePhase('result');
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
        setHasResolved(true);
        
        // CRITICAL: Transition to result phase after calculation completes
        setOutcomePhase('result');
        
        // Generate LLM explanations asynchronously (non-blocking)
        generateLLMExplanations(blend, userInput, translatedIntent);
        
        setPhase('FREE');
        setGuidance(null);
        setClarificationAnswers({});

      } catch (err) {
        console.error('Resolution error:', err);
        setError('Failed to resolve outcome. Please try again.');
        setOutcomePhase('input'); // Reset to input on error
      }
    }, 200); // Small delay to ensure resolving panel is visible
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
    setDeterministicExplanation(null);
    setLlmExplanation(null);
    setLlmUsageInstructions(null);
    
    // Transition to resolving phase
    setOutcomePhase('resolving');

    // Small delay to show resolving, then calculate
    setTimeout(() => {
      try {
        // Create updated intent with adjusted values
        const updatedIntent: OutcomeIntent = {
          ...intent,
          // Keep activation and activationTarget in sync (engine uses intent.activation)
          activation: adjustedIntent.activationTarget,
          activationTarget: adjustedIntent.activationTarget,
          cognitiveEndurance: adjustedIntent.cognitiveEndurance,
          anxietySensitivity: adjustedIntent.anxietySensitivity,
        };
        
        setIntent(updatedIntent);
        
        // Re-resolve with adjusted intent
        const resolvedOutcome = resolveOutcome(updatedIntent);
        setOutcome(resolvedOutcome);
        setDeterministicExplanation(generateDeterministicExplanation(updatedIntent, resolvedOutcome));

        if (resolvedOutcome.failure) {
          const blend = convertToResolvedBlend({ primaryBlend: [], stackingOptions: [], confidenceScore: 0, tradeoffs: [], rationaleSummary: '', resolutionMode: 'BLENDED' }, resolvedOutcome);
          setResolvedBlend(blend);
          setDeterministicExplanation(generateDeterministicExplanation(updatedIntent, resolvedOutcome));
          setOutcomePhase('result');
          setIsProcessing(false);
          return;
        }

        const named = resolveToNamedStrains(resolvedOutcome);
        setNamedResolution(named);
        const blend = convertToResolvedBlend(named, resolvedOutcome);
        setResolvedBlend(blend);
        
        // Generate LLM explanations asynchronously (non-blocking)
        generateLLMExplanations(blend, originalUserInput || userInput, updatedIntent);
        
        // Transition back to result phase
        setOutcomePhase('result');
      } catch (err) {
        console.error('Adjustment error:', err);
        setError('Failed to adjust outcome. Please try again.');
        setOutcomePhase('result'); // Keep showing result on error
      } finally {
        setIsProcessing(false);
      }
    }, 200); // Small delay for resolving phase
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

  // Reset outcome phase when user starts new input
  const handleInputChange = (newValue: string) => {
    setUserInput(newValue);
    if (phase === 'LOCKED' || resolvedBlend) {
      setResolvedBlend(null);
      setDeterministicExplanation(null);
      setOutcomePhase('input');
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
  };

  // Show age gate if not complete
  if (!ageGateComplete) {
    return (
      <AgeGate
        onComplete={(age) => {
          setUserAge(age);
          setAgeGateComplete(true);
        }}
      />
    );
  }

  // Show dispensary source splash if needed (once per session)
  if (showSourceSplash === null) {
    // Still checking sessionStorage, don't render yet
    return null;
  }

  if (showSourceSplash) {
    return (
      <div className="min-h-screen bg-noise text-[#E5E5E5] font-sans selection:bg-accent/30 overflow-x-hidden flex flex-col">
        <DispensarySourceSplash onContinue={handleContinueSplash} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-noise text-[#E5E5E5] font-sans selection:bg-accent/30 overflow-x-hidden flex flex-col">
      {/* PHASED MOUNT/UNMOUNT - Each phase has its own wrapper with distinct styling */}
      {/* Input Phase - Hero layout with centered input */}
      {outcomePhase === 'input' && (
        <main key="input" className="flex-1 w-full max-w-[1920px] mx-auto px-6 lg:px-12 xl:px-24 pb-32 pt-20 lg:pt-28 overflow-y-auto min-h-0 transition-opacity duration-300">
          {isProcessing && (
            <div className="mb-4">
              <span className="text-[10px] font-mono font-medium tracking-widest text-zinc-400">PROCESSING...</span>
            </div>
          )}
          <OutcomeInputPanel
            userInput={userInput}
            currentClarification={currentClarification}
            clarificationAnswers={clarificationAnswers}
            isProcessing={isProcessing}
            onInputChange={handleInputChange}
            onSubmit={handleAnalyze}
            onClarificationAnswer={handleClarificationAnswer}
            onClearClarification={() => {
              setCurrentClarification(null);
              setResolvedAxes(new Set());
              setClarificationAnswers({});
            }}
          />
        </main>
      )}

      {/* Resolving Phase - Distinct background, centered, no input */}
      {outcomePhase === 'resolving' && (
        <main key="resolving" className="flex-1 w-full max-w-[1920px] mx-auto px-6 lg:px-12 xl:px-24 pb-32 pt-20 lg:pt-28 overflow-y-auto min-h-0 bg-zinc-950/60 transition-opacity duration-300">
          <ResolvingPanel />
        </main>
      )}

      {/* Result Phase - Result-focused layout */}
      {outcomePhase === 'result' && resolvedBlend && (
        <main key="result" className="flex-1 w-full max-w-[1920px] mx-auto px-6 lg:px-12 xl:px-24 pb-32 pt-20 lg:pt-28 overflow-y-auto min-h-0 transition-opacity duration-300">
          <ResultPanel
            blend={resolvedBlend}
            intent={intent}
            isProcessing={isProcessing}
            deterministicExplanation={deterministicExplanation}
            llmExplanation={llmExplanation}
            llmUsageInstructions={llmUsageInstructions}
            blendNickname={blendNickname}
            blendHashtag={blendHashtag}
            shareCaption={shareCaption}
            onRefineOutcome={handleRefineOutcome}
            onShowUsageProtocol={handleShowUsageProtocol}
            onAdjustment={handleAdjustment}
            hasResolved={hasResolved}
          />
        </main>
      )}

      {/* Microphone - Fixed Bottom Right */}
      <div className="fixed bottom-12 right-12 z-50">
        <button
          onClick={isListening ? stopListening : startListening}
          className={`flex items-center gap-4 transition-colors duration-500 ${isListening ? 'text-accent' : 'text-zinc-600 hover:text-white'}`}
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
