'use client';

export const dynamic = 'force-dynamic';

/**
 * GO Line — Guided Outcomes Calculator
 * 
 * Panel-based interface for the Outcome Resolution Layer of the GO system.
 * 
 * Architecture:
 * - Panel-based presentation layer (no chat-style rendering)
 * - StrategicGuidance → deterministic resolution (unchanged)
 * - LLM does not decide when to resolve
 * - Deterministic engine controls resolution
 * - Single Resolution UI path through ResolutionPanel
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Search,
  Settings,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';
import { OutcomeIntent, OutcomeResult } from '@/lib/goOutcomeEngine';
import { resolveOutcome } from '@/lib/goOutcomeEngine';
import { StrategicGuidance, ClarificationQuestion } from '@/lib/strategicGuidance';
import { translateGuidanceToIntent } from '@/lib/guidanceToIntent';
import { ClarificationAxis, parseResolvedAxes, getAxisFromQuestionType } from '@/lib/clarificationAxes';
import { presets, type Preset, type BaselineCalibration as PresetBaselineCalibration } from '@/lib/presets';
import PreRollStack, { type StackSegment } from '@/components/PreRollStack';
import CompositionBreakdown, { type BlendComponent } from '@/components/CompositionBreakdown';
import CinematicRightPanel from '@/components/CinematicRightPanel';
import OnboardingModal from '@/components/OnboardingModal'; // Keeping if needed, but likely unused
import OnboardingOverlay from '@/components/OnboardingOverlay';
import AgeGate from '@/components/AgeGate';
import StrainInsightCard from '@/components/StrainInsightCard';
import BlendExecutionCalculator from '@/components/BlendExecutionCalculator';
import SecretInventoryPortalComponent, { type InventoryItem } from '@/components/SecretInventoryPortal';
import { STRAIN_LIBRARY } from '@/lib/strainLibrary';
import { generateEffectiveExplanation } from '@/lib/generateEffectiveExplanation';

// Conversation state exists for parsing/clarification but is NOT visually rendered
type ConversationState = 'active' | 'resolved';

interface BaselineCalibration {
  thcTolerance?: 'low' | 'moderate' | 'high';
  anxietySensitivity?: 'low' | 'moderate' | 'high';
  experienceLevel?: 'occasional' | 'regular' | 'experienced';
}

interface GuidanceResponse {
  ok: boolean;
  guidance?: StrategicGuidance;
  error?: string;
  message?: string;
}


// Canonical intent normalization
function normalizeIntent(intent: OutcomeIntent): OutcomeIntent {
  return {
    activation: intent.activation ?? 0.5,
    anxietySensitivity: intent.anxietySensitivity ?? 0.5,
    cognitiveEndurance: intent.cognitiveEndurance ?? 0.5,
    bodyLoadPreference: intent.bodyLoadPreference ?? 0.5,
    temporalOnset: intent.temporalOnset ?? 0.5,
    activationTarget: intent.activationTarget ?? intent.activation ?? 0.5,
    physicalRelief: intent.physicalRelief ?? 0.5,
    cognitiveClarity: intent.cognitiveClarity ?? 0.5,
    functionalEnergy: intent.functionalEnergy ?? 0.5,
    // Preserve others if present
    avoidSedation: intent.avoidSedation,
    overshootTolerance: intent.overshootTolerance,
    durationPreference: intent.durationPreference,
  };
}

export default function GOLineCalculator() {
  // Preset selection state
  const [selectedPreset, setSelectedPreset] = useState<Preset | null>(null);
  const [presetSelected, setPresetSelected] = useState(false);

  // Baseline calibration (optional, lightweight)
  const [baselineCalibration, setBaselineCalibration] = useState<BaselineCalibration>({});
  const [calibrationComplete, setCalibrationComplete] = useState(false);

  // Conversation state (for parsing/clarification only, NOT visually rendered)
  const [conversationState, setConversationState] = useState<'idle' | 'active' | 'resolved' | 'synthesizing'>('idle');
  const [userInput, setUserInput] = useState('');

  // Internal context tracking (structured, not raw chat - not visually rendered)
  const [accumulatedContext, setAccumulatedContext] = useState<string>('');
  const [currentGuidance, setCurrentGuidance] = useState<StrategicGuidance | null>(null);
  const [pendingClarification, setPendingClarification] = useState<ClarificationQuestion | null>(null);

  // Clarification axis tracking (prevents asking about same axis twice)
  const [resolvedAxes, setResolvedAxes] = useState<Set<ClarificationAxis>>(new Set());



  // Resolution state (for PreRollStack)
  const [intent, setIntent] = useState<OutcomeIntent | null>(null);
  const [outcomeResult, setOutcomeResult] = useState<OutcomeResult | null>(null);
  const [stackSegments, setStackSegments] = useState<StackSegment[]>([]);
  const [breakdownComponents, setBreakdownComponents] = useState<BlendComponent[]>([]);

  // UI state
  const [consumptionMode, setConsumptionMode] = useState<'blend' | 'stack'>('blend');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);

  // Secret inventory portal state
  const [showInventoryPortal, setShowInventoryPortal] = useState(false);
  const [ageGateComplete, setAgeGateComplete] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showCalcDetails, setShowCalcDetails] = useState(false);
  const [showPromptTips, setShowPromptTips] = useState(true);
  const [logoClickCount, setLogoClickCount] = useState(0);
  const [logoClickTimer, setLogoClickTimer] = useState<NodeJS.Timeout | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [expandedStrainId, setExpandedStrainId] = useState<string | null>(null);

  // Sales Pitch Mode State
  const [salesMode, setSalesMode] = useState(false);
  const [salesToast, setSalesToast] = useState<{ title: string; message: string } | null>(null);

  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Check status on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Check Age Gate (Persistent)
    const storedAge = localStorage.getItem('go_age_verified');
    if (storedAge) {
      setAgeGateComplete(true);
    }

    // 2. Check Onboarding (Session-based) - REMOVED per user request for explicit trigger
    // const onboardingSeen = sessionStorage.getItem('go_onboarding_session');
    // if (!onboardingSeen) {
    //   setShowOnboarding(true);
    // }
  }, []);

  const handleAgeComplete = (age: number) => {
    setAgeGateComplete(true);
    localStorage.setItem('go_age_verified', 'true');
  };

  const handleOnboardingClose = () => {
    setShowOnboarding(false);
    sessionStorage.setItem('go_onboarding_session', 'true');
  };

  // Logo click detection (6 clicks within 3 seconds)
  const handleLogoClick = () => {
    const newCount = logoClickCount + 1;
    setLogoClickCount(newCount);

    // Clear existing timer
    if (logoClickTimer) {
      clearTimeout(logoClickTimer);
    }

    if (newCount >= 6) {
      setShowInventoryPortal(true);
      setLogoClickCount(0);
      if (logoClickTimer) clearTimeout(logoClickTimer);
    } else {
      // Set timer to reset count after 3 seconds
      const timer = setTimeout(() => {
        setLogoClickCount(0);
      }, 3000);
      setLogoClickTimer(timer);
    }
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (logoClickTimer) {
        clearTimeout(logoClickTimer);
      }
    };
  }, [logoClickTimer]);

  // Sales Pitch Demo Listener
  useEffect(() => {
    const handleDemoRun = (e: CustomEvent) => {
      const intent = e.detail.intent;
      // 1. Enter Sales Mode
      setSalesMode(true);
      setPresetSelected(true); // Ensure we are past the landing screen
      setCalibrationComplete(true); // Skip calibration
      setSalesToast({ title: 'Step 1: Intent Capture', message: 'User expresses need in natural language. No Strain names required.' });

      // 2. Type Intent (Visual Simulation)
      let i = 0;
      setUserInput('');
      const typeInterval = setInterval(() => {
        if (i < intent.length) {
          setUserInput(prev => prev + intent.charAt(i));
          i++;
        } else {
          clearInterval(typeInterval);

          // 3. Trigger Submission after typing
          setTimeout(() => {
            setSalesToast({ title: 'Step 2: Processing', message: 'Engine converts vague terms into precise chemical targets (Terpenes/Cannabinoids).' });
            handleUserMessage(intent);

            // 4. Show Result Hooks
            setTimeout(() => {
              setSalesToast({ title: 'Step 3: Business Value', message: 'Upsell Opportunity: Logic prioritized slow-moving inventory as the perfect "Modulator".' });

              setTimeout(() => {
                setSalesToast({ title: 'Step 4: Retention', message: 'Loyalty Hook: "This specific feeling" is now a repeatable SKU they can return for.' });
              }, 6000);

            }, 4000);

          }, 800);
        }
      }, 30);
    };

    window.addEventListener('go-demo-run' as any, handleDemoRun);
    return () => window.removeEventListener('go-demo-run' as any, handleDemoRun);
  }, []);

  // Handle preset selection
  const handlePresetSelect = (preset: Preset) => {
    setSelectedPreset(preset);
    setPresetSelected(true);
    setShowOnboarding(false); // Disable onboarding for presets
    // Pre-fill baseline calibration from preset
    setBaselineCalibration(preset.baselineCalibration);
    // Pre-fill initial intent text (will be sent as first message after calibration)
    setUserInput(preset.initialIntentText);
  };

  // Handle baseline calibration completion
  const handleCalibrationComplete = () => {
    setCalibrationComplete(true);

    // If a preset was selected, send its initial intent text automatically
    if (selectedPreset && selectedPreset.initialIntentText) {
      setTimeout(() => {
        handleUserMessage(selectedPreset.initialIntentText);
      }, 100);
    }
  };

  // Process user message (triggers inference)
  const handleUserMessage = async (text: string) => {
    if (!text.trim() || isProcessing || conversationState === 'resolved') return;

    // Conversation state exists for parsing only, not visual rendering

    // Parse user reply to determine which clarification axes are resolved
    // This is a deterministic control step, not an LLM call
    if (currentGuidance && currentGuidance.clarificationNeeded && currentGuidance.clarificationNeeded.length > 0) {
      const openAxes: ClarificationAxis[] = currentGuidance.clarificationNeeded
        .map(q => getAxisFromQuestionType(q.type))
        .filter(axis => !resolvedAxes.has(axis));

      const newlyResolved = parseResolvedAxes(text.trim(), openAxes);

      if (newlyResolved.length > 0) {
        // Mark axes as resolved (never ask about them again)
        setResolvedAxes(prev => {
          const updated = new Set(prev);
          newlyResolved.forEach(axis => updated.add(axis));
          return updated;
        });
      }
    }

    // Append to accumulated context
    const updatedContext = accumulatedContext
      ? `${accumulatedContext}\n\n${text.trim()}`
      : text.trim();
    setAccumulatedContext(updatedContext);
    setUserInput('');
    setIsProcessing(true);
    setError(null);

    try {
      // Call StrategicGuidance inference (with full context - axes filtering happens after)
      const guidanceResponse = await fetch('/api/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: updatedContext,
          baselineCalibration: Object.keys(baselineCalibration).length > 0 ? baselineCalibration : undefined,
        }),
      });

      if (!guidanceResponse.ok) {
        const errorData = await guidanceResponse.json();
        throw new Error(errorData.message || 'Failed to analyze intent');
      }

      const data: GuidanceResponse = await guidanceResponse.json();

      if (!data.ok || !data.guidance) {
        throw new Error(data.message || 'Failed to analyze intent');
      }

      setCurrentGuidance(data.guidance);

      // Filter clarification questions to only show unresolved axes
      const unresolvedQuestions = (data.guidance.clarificationNeeded || []).filter(q => {
        const axis = getAxisFromQuestionType(q.type);
        return !resolvedAxes.has(axis);
      });

      // Check if any clarification axes remain unresolved
      if (unresolvedQuestions.length > 0) {
        // Get the first unresolved clarification question
        const firstQuestion = unresolvedQuestions[0];
        setPendingClarification(firstQuestion);

        // Conversation remains active (for clarification - not visually rendered)
        setConversationState('active');
      } else {
        // All clarification axes resolved - proceed to resolution immediately
        setPendingClarification(null);
        await handleResolution(data.guidance);
      }
    } catch (err: any) {
      console.error('Intent analysis error:', err);
      setError(err.message || 'Unable to analyze intent. AI service unavailable.');
    } finally {
      setIsProcessing(false);
      inputRef.current?.focus();
    }
  };

  // Convert OutcomeResult to StackSegment and BlendComponent format
  // IMPORTANT: Uses the new OutcomeResult format with primary + alternates
  const convertToStackFormat = (outcome: OutcomeResult) => {
    // Handle new format with primary + alternates
    if (outcome.failure) {
      throw new Error(`Resolution failed: ${outcome.failure.reason || 'Unknown error'}`);
    }

    const primary = outcome.primary;

    // Validate: must have named strains
    if (!primary.selectedCultivars || primary.selectedCultivars.length === 0) {
      throw new Error('Resolution without cultivar names is invalid');
    }

    const hasUnnamed = primary.selectedCultivars.some(c => !c.displayName || c.displayName.trim() === '');
    if (hasUnnamed) {
      throw new Error('Resolution contains unnamed cultivars - invalid resolution');
    }

    // Assign roles based on ratio order: largest = foundation, second = modulator, rest = accent
    const sorted = primary.selectedCultivars
      .map((cultivar, index) => ({
        cultivar,
        ratio: primary.ratios[index],
        index,
      }))
      .sort((a, b) => b.ratio - a.ratio);

    const segments: StackSegment[] = sorted.map((item, idx) => {
      let role: 'foundation' | 'modulator' | 'accent' = 'accent';
      if (idx === 0) role = 'foundation';
      else if (idx === 1) role = 'modulator';

      return {
        name: item.cultivar.displayName,
        percentage: item.ratio,
        role,
      };
    });

    // Also create breakdown components (horizontal bars)
    const components: BlendComponent[] = sorted.map((item, idx) => {
      let role: 'foundation' | 'modulator' | 'accent' = 'accent';
      if (idx === 0) role = 'foundation';
      else if (idx === 1) role = 'modulator';

      return {
        name: item.cultivar.displayName,
        percentage: item.ratio,
        role,
      };
    });

    return { segments, components };
  };

  // Handle resolution (when no clarification questions remain)
  const handleResolution = async (guidance: StrategicGuidance) => {
    // Translate StrategicGuidance to OutcomeIntent
    const translatedIntent = translateGuidanceToIntent(guidance, {});
    const normalized = normalizeIntent(translatedIntent);
    setIntent(normalized);

    // Resolve outcome using deterministic engine (with variation logic)
    const resolvedOutcome = resolveOutcome(normalized);
    setOutcomeResult(resolvedOutcome);

    // Convert to stack format for PreRollStack
    const { segments, components } = convertToStackFormat(resolvedOutcome);
    setStackSegments(segments);
    setBreakdownComponents(components);

    // Reveal Result
    setConversationState('resolved');
  };

  // Handle adjustment (when user adjusts sliders)
  const handleAdjustment = async (adjustments: {
    activationTarget: number;
    cognitiveEndurance: number;
    anxietySensitivity: number;
  }) => {
    if (!intent) return;

    // Create updated intent with adjustments
    const updatedIntent: OutcomeIntent = {
      ...intent,
      activation: adjustments.activationTarget,
      activationTarget: adjustments.activationTarget, // Ensure target matches
      cognitiveEndurance: adjustments.cognitiveEndurance,
      anxietySensitivity: adjustments.anxietySensitivity,
    };

    const normalized = normalizeIntent(updatedIntent);
    setIntent(normalized);

    // Re-resolve with updated intent
    const resolvedOutcome = resolveOutcome(normalized);
    setOutcomeResult(resolvedOutcome);
    const { segments, components } = convertToStackFormat(resolvedOutcome);
    setStackSegments(segments);
    setBreakdownComponents(components);
  };

  // Handle submit (Enter key or button)
  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (userInput.trim() && !isProcessing && conversationState !== 'resolved') {
      handleUserMessage(userInput);
    }
  };

  // --- RENDER: AGE GATE (Strict Blocking) ---
  if (!ageGateComplete) {
    return (
      <AgeGate onComplete={(age) => {
        setAgeGateComplete(true);
        if (typeof window !== 'undefined') localStorage.setItem('go_age_verified', 'true');
      }} />
    );
  }

  // --- RENDER: VIEW 1 - PRESET SELECTION ---
  if (!presetSelected && !calibrationComplete) {
    return (
      <main className="fixed inset-0 w-screen h-screen bg-[#0a0b0e] text-white flex flex-col font-sans overflow-hidden">
        {/* Background Layers (Cinematic) */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-900/20 via-black to-black opacity-80" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/50" />
        </div>

        {/* Header (Standardized) */}
        <div className="h-12 border-b border-white/5 bg-[#0a0b0e]/80 backdrop-blur-sm flex items-center justify-center shrink-0 z-50 relative">
          <button onClick={handleLogoClick} className="text-xs font-bold tracking-[0.2em] text-[#D4AF37]/80 hover:text-[#D4AF37] transition-colors">
            GO LINE // CALCULATOR
          </button>
        </div>

        {/* Content Container */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 overflow-y-auto">
          <div className="max-w-[1000px] w-full animate-in fade-in slide-in-from-bottom-4 duration-700">

            <div className="text-center mb-12">
              <h1 className="text-2xl font-light text-white mb-2 tracking-wide">Select Your Starting Point</h1>
              <p className="text-white/40 text-sm tracking-wide">Choose a preset profile or start from a blank slate</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handlePresetSelect(preset)}
                  className="group relative flex flex-col items-start p-6 bg-white/5 border border-white/10 hover:border-[#D4AF37]/50 hover:bg-white/10 transition-all duration-300 rounded-sm text-left"
                >
                  <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[#D4AF37] text-[10px] uppercase tracking-widest">Select</span>
                  </div>
                  <div className="text-sm font-bold text-white/90 mb-2 tracking-widest uppercase group-hover:text-[#D4AF37] transition-colors">
                    {preset.name}
                  </div>
                  <div className="text-xs text-white/50 leading-relaxed font-sans group-hover:text-white/70">
                    {preset.description}
                  </div>
                </button>
              ))}
            </div>

            <div className="text-center">
              <button
                onClick={() => {
                  setPresetSelected(true);
                  setShowOnboarding(true); // Enable onboarding for scratch
                }}
                className="text-[10px] uppercase tracking-[0.2em] text-white/30 hover:text-[#D4AF37] transition-colors border-b border-transparent hover:border-[#D4AF37] pb-1"
              >
                Skip presets and start from scratch
              </button>
            </div>
          </div>
        </div>

        <SecretInventoryPortalComponent
          isOpen={showInventoryPortal}
          onClose={() => setShowInventoryPortal(false)}
          onSave={(items) => setInventory(items)}
        />
      </main>
    );
  }

  // --- RENDER: VIEW 2 - CALIBRATION ---
  if (presetSelected && !calibrationComplete) {
    return (
      <main className="fixed inset-0 w-screen h-screen bg-[#0a0b0e] text-white flex flex-col font-sans overflow-hidden">
        {/* Background Layers (Cinematic) */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-900/20 via-black to-black opacity-80" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/50" />
        </div>

        {/* Header (Standardized) */}
        <div className="h-12 border-b border-white/5 bg-[#0a0b0e]/80 backdrop-blur-sm flex items-center justify-center shrink-0 z-50 relative">
          <button onClick={handleLogoClick} className="text-xs font-bold tracking-[0.2em] text-[#D4AF37]/80 hover:text-[#D4AF37] transition-colors">
            GO LINE // CALCULATOR
          </button>
        </div>

        {/* Content Container */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 bg-black/20">
          <div className="max-w-[700px] w-full animate-in fade-in slide-in-from-bottom-4 duration-500">

            <div className="bg-[#111216]/90 backdrop-blur-md border border-white/10 rounded-sm p-8 shadow-2xl relative overflow-hidden">
              {/* Decorative top accent */}
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent" />

              {selectedPreset && (
                <div className="mb-8 pb-6 border-b border-white/5 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-[#D4AF37] uppercase tracking-widest mb-2">Selected Preset Profile</div>
                    <div className="text-xl font-light text-white">{selectedPreset.name}</div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedPreset(null);
                      setBaselineCalibration({});
                      setUserInput('');
                      setPresetSelected(false);
                    }}
                    className="text-[10px] uppercase tracking-wider text-white/40 hover:text-white transition-colors border-b border-white/10 hover:border-white/40 pb-0.5"
                  >
                    Change selection
                  </button>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-sm font-medium text-white mb-2">Fine-tune your baseline (Optional)</h3>
                <p className="text-xs text-white/40 leading-relaxed mb-6">
                  Adjust these settings if you have specific tolerance or sensitivity requirements different from the preset defaults.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="space-y-2">
                  <label className="block text-[10px] text-white/40 uppercase tracking-wider">THC Tolerance</label>
                  <div className="relative">
                    <select
                      value={baselineCalibration.thcTolerance || ''}
                      onChange={(e) => setBaselineCalibration({ ...baselineCalibration, thcTolerance: e.target.value as any })}
                      className="w-full px-4 py-3 bg-[#0a0b0e] border border-white/10 rounded-sm text-white text-xs focus:outline-none focus:border-[#D4AF37]/50 appearance-none hover:border-white/20 transition-colors"
                    >
                      <option value="">Default (Preset)</option>
                      <option value="low">Low</option>
                      <option value="moderate">Moderate</option>
                      <option value="high">High</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/20 text-[10px]">▼</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] text-white/40 uppercase tracking-wider">Anxiety Sensitivity</label>
                  <div className="relative">
                    <select
                      value={baselineCalibration.anxietySensitivity || ''}
                      onChange={(e) => setBaselineCalibration({ ...baselineCalibration, anxietySensitivity: e.target.value as any })}
                      className="w-full px-4 py-3 bg-[#0a0b0e] border border-white/10 rounded-sm text-white text-xs focus:outline-none focus:border-[#D4AF37]/50 appearance-none hover:border-white/20 transition-colors"
                    >
                      <option value="">Default (Preset)</option>
                      <option value="low">Low</option>
                      <option value="moderate">Moderate</option>
                      <option value="high">High</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/20 text-[10px]">▼</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] text-white/40 uppercase tracking-wider">Experience Level</label>
                  <div className="relative">
                    <select
                      value={baselineCalibration.experienceLevel || ''}
                      onChange={(e) => setBaselineCalibration({ ...baselineCalibration, experienceLevel: e.target.value as any })}
                      className="w-full px-4 py-3 bg-[#0a0b0e] border border-white/10 rounded-sm text-white text-xs focus:outline-none focus:border-[#D4AF37]/50 appearance-none hover:border-white/20 transition-colors"
                    >
                      <option value="">Default (Preset)</option>
                      <option value="occasional">Occasional</option>
                      <option value="regular">Regular</option>
                      <option value="experienced">Experienced</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/20 text-[10px]">▼</div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-white/5">
                <button
                  onClick={handleCalibrationComplete}
                  className="px-8 py-3 bg-[#D4AF37] text-black font-bold text-xs uppercase tracking-widest hover:bg-[#b5952f] transition-colors rounded-sm shadow-[0_0_20px_rgba(212,175,55,0.2)] hover:shadow-[0_0_30px_rgba(212,175,55,0.4)]"
                >
                  Initialize System
                </button>
              </div>
            </div>
          </div>
        </div>

        <SecretInventoryPortalComponent
          isOpen={showInventoryPortal}
          onClose={() => setShowInventoryPortal(false)}
          onSave={(items) => setInventory(items)}
        />
      </main>
    );
  }


  // --- RENDER: VIEW 3 - STRICT DASHBOARD ---
  return (
    <main className="min-h-screen w-full bg-[#0a0b0e] text-white flex flex-col overflow-auto overscroll-none">
      {/* 1. Age Gate - Blocking (Handled at top level now) */}


      {/* 2. Onboarding Overlay - Session Based, Dashboard Visible Behind */}
      {ageGateComplete && showOnboarding && (
        <OnboardingOverlay
          onComplete={handleOnboardingClose}
        />
      )}

      {/* Header */}
      <div className="h-12 border-b border-white/5 bg-[#0a0b0e] flex items-center justify-center shrink-0 z-50 relative">
        <div className="text-xs font-bold tracking-[0.2em] text-[#D4AF37]/80">GO LINE // CALCULATOR</div>

        {/* Phase 5: Admin Button */}
        {process.env.NEXT_PUBLIC_ADMIN_ENABLED === 'true' && (
          <button
            onClick={() => setShowInventoryPortal(true)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] uppercase tracking-widest text-white/20 hover:text-[#D4AF37] transition-colors font-mono"
          >
            Admin Panel
          </button>
        )}
      </div>

      {/* 3-Column Grid - Height locked to remaining space */}
      <div className="flex-1 grid grid-cols-12 overflow-hidden relative">

        {/* PANEL 1: INPUT (Left, 3 cols) - Scrollable internally */}
        <div className="col-span-3 border-r border-white/10 bg-[#0a0b0e] flex flex-col h-full overflow-hidden">

          {/* Header - Sticky Top */}
          <div className="p-6 pb-4 shrink-0 bg-[#0a0b0e] border-b border-white/5">
            <h2 className="text-sm font-medium text-white mb-2">Describe the outcome you’re looking for</h2>
            <p className="text-[10px] text-white/50 leading-relaxed max-w-[90%] font-sans">
              There’s more than one way to get to the same experience.
              Start from whatever reference you have — we’ll handle the rest.
            </p>
          </div>

          {/* Scrollable Form Area */}
          <div className="flex-1 overflow-y-auto px-6 pb-6 scrollbar-thin scrollbar-thumb-white/10">

            {/* Prompt Mode Guidance (Collapsible) */}
            <div className="py-6">
              <button
                onClick={() => setShowPromptTips(!showPromptTips)}
                className="flex items-center gap-2 text-xs uppercase tracking-widest text-white/40 hover:text-white/60 transition-colors mb-4 group w-full text-left"
              >
                <span>You can start from any of these</span>
                <span className="text-white/20 group-hover:text-white/40 font-mono">{showPromptTips ? '[-]' : '[+]'}</span>
              </button>

              {showPromptTips && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="text-sm text-white/80 border-l border-white/10 pl-4 font-sans leading-relaxed">
                    <span className="block text-white/40 text-[10px] uppercase mb-1 font-mono">Desired feeling</span>
                    “Relaxed but alert, no anxiety”
                  </div>
                  <div className="text-sm text-white/80 border-l border-white/10 pl-4 font-sans leading-relaxed">
                    <span className="block text-white/40 text-[10px] uppercase mb-1 font-mono">Problem → solution</span>
                    “Pain relief and anti-nausea, but no jitters”
                  </div>
                  <div className="text-sm text-white/80 border-l border-white/10 pl-4 font-sans leading-relaxed">
                    <span className="block text-white/40 text-[10px] uppercase mb-1 font-mono">Memory-based reference</span>
                    “Something like Blue Dream, but calmer”
                  </div>
                  <div className="text-sm text-white/80 border-l border-white/10 pl-4 font-sans leading-relaxed">
                    <span className="block text-white/40 text-[10px] uppercase mb-1 font-mono">Functional goal</span>
                    “Focused and creative without racing thoughts”
                  </div>
                  <div className="text-sm text-white/80 border-l border-white/10 pl-4 font-sans leading-relaxed">
                    <span className="block text-white/40 text-[10px] uppercase mb-1 font-mono">Product-based reference</span>
                    “I liked this product — can you recreate the feeling?”
                    <div className="text-[10px] text-white/30 mt-1 italic">Labels with THC / terpene percentages work especially well.</div>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <textarea
                ref={inputRef}
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                placeholder="Describe the experience you want to recreate…"
                className="w-full p-4 bg-[#111216] border border-white/10 rounded-sm text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#D4AF37]/50 resize-none font-sans leading-relaxed min-h-[160px]"
                disabled={isProcessing}
              />
            </form>

            {/* Adjustment Controls (Conditional) */}
            {conversationState === 'resolved' && intent && (
              <div className="mt-8 pt-8 border-t border-white/5 space-y-8 animate-in fade-in">
                {/* Energy */}
                <div>
                  <div className="flex justify-between text-[10px] text-white/40 mb-2 uppercase">
                    <span>Sedative</span>
                    <span>Energetic</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={Math.round(intent.activation * 100)}
                    onChange={(e) => handleAdjustment({
                      activationTarget: parseInt(e.target.value) / 100,
                      cognitiveEndurance: intent.cognitiveEndurance,
                      anxietySensitivity: intent.anxietySensitivity,
                    })}
                    className="w-full h-1 bg-white/10 appearance-none cursor-pointer accent-[#D4AF37]"
                  />
                </div>
                {/* Duration */}
                <div>
                  <div className="flex justify-between text-[10px] text-white/40 mb-2 uppercase">
                    <span>Short</span>
                    <span>Extended</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={Math.round(intent.cognitiveEndurance * 100)}
                    onChange={(e) => handleAdjustment({
                      activationTarget: intent.activation,
                      cognitiveEndurance: parseInt(e.target.value) / 100,
                      anxietySensitivity: intent.anxietySensitivity,
                    })}
                    className="w-full h-1 bg-white/10 appearance-none cursor-pointer accent-[#D4AF37]"
                  />
                </div>
                {/* Anxiety */}
                <div>
                  <div className="flex justify-between text-[10px] text-white/40 mb-2 uppercase">
                    <span>Sensitivity</span>
                    <span>Robust</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={Math.round(intent.anxietySensitivity * 100)}
                    onChange={(e) => handleAdjustment({
                      activationTarget: intent.activation,
                      cognitiveEndurance: intent.cognitiveEndurance,
                      anxietySensitivity: parseInt(e.target.value) / 100,
                    })}
                    className="w-full h-1 bg-white/10 appearance-none cursor-pointer accent-[#D4AF37]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Fixed Bottom CTA */}
          <div className="p-6 border-t border-white/10 bg-[#0a0b0e] shrink-0">
            <button
              onClick={() => handleSubmit()}
              disabled={!userInput.trim() || isProcessing}
              className="w-full py-4 bg-white text-black font-bold text-xs uppercase tracking-widest hover:bg-[#D4AF37] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Calculating...' : `Calculate ${consumptionMode}`}
            </button>
          </div>
        </div>

        {/* PANEL 2: VISUALIZATION (Middle, 6 cols) - Locked, No Scroll */}
        <div className="col-span-6 border-r border-white/10 bg-black relative h-full overflow-hidden flex flex-col">
          <div className="flex-1 relative w-full h-full">
            <CinematicRightPanel
              phase={conversationState}
              blend={outcomeResult?.primary as any}
              mode={consumptionMode as any}
            />
          </div>
        </div>

        {/* PANEL 3: RESULTS (Right, 3 cols) - Scrollable internally */}
        <div className="col-span-3 bg-[#0a0b0e] flex flex-col h-full overflow-hidden">

          {/* Header */}
          <div className="p-6 border-b border-white/5 shrink-0">
            <h2 className="text-xs font-mono text-white/40 uppercase tracking-widest">
              {conversationState === 'active' ? 'Output Context' : 'Composition Analysis'}
            </h2>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/10">
            {conversationState === 'active' ? (
              // Idle State: Empty and clean as requested
              <div className="h-full w-full" />
            ) : (
              // Result State
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">

                {/* Match Badge */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-white/40 font-mono">CONFIDENCE</span>
                  <span className="text-xs font-bold text-[#D4AF37]">98.4%</span>
                </div>

                {/* Analysis Explainer */}
                <div className="py-2">
                  <h3 className="text-[10px] text-white/60 uppercase tracking-wider mb-3">Why this blend was chosen</h3>
                  <p className="text-xs text-white/80 leading-relaxed font-sans border-l-2 border-[#D4AF37]/50 pl-4 py-1">
                    {outcomeResult?.primary ? generateEffectiveExplanation(outcomeResult.primary as any) : ''}
                  </p>
                </div>

                {/* Mode-Specific Display: Forced to Blend Only */}
                <div className="bg-[#111216] border border-white/10 rounded-sm p-4">
                  {/* Composition List / Cards */}
                  <div className="space-y-4 pt-2">
                    <h4 className="text-[10px] text-white/40 uppercase tracking-widest mb-4">Formulation Insights</h4>

                    {outcomeResult?.primary?.selectedCultivars?.map((cultivar: any, i: number) => {
                      const strainData = STRAIN_LIBRARY[cultivar.id];
                      if (!strainData) return null;

                      // Ratios are typically 0-100 (e.g. 60, 40). Convert to decimal 0-1 for Card.
                      const rawRatio = outcomeResult.primary.ratios?.[i] ?? 0;
                      const percentage = rawRatio > 1 ? rawRatio / 100 : rawRatio;

                      return (
                        <StrainInsightCard
                          key={cultivar.id}
                          strain={strainData}
                          percentage={percentage}
                          role={cultivar.role}
                          index={i}
                          isExpanded={expandedStrainId === cultivar.id}
                          onToggle={() => setExpandedStrainId(prev => prev === cultivar.id ? null : cultivar.id)}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Phase 4: Execution */}
                <div className="mt-4">
                  <BlendExecutionCalculator blend={outcomeResult?.primary as any} />
                </div>

                {/* Calculation Methodology (Collapsible) */}
                <div className="mt-8 border-t border-white/5 pt-4">
                  <button
                    onClick={() => setShowCalcDetails(!showCalcDetails)}
                    className="flex items-center justify-between w-full text-left group"
                  >
                    <span className="text-[10px] text-white/40 group-hover:text-white/60 uppercase tracking-widest transition-colors">
                      How this recommendation is calculated
                    </span>
                    <span className="text-white/40 text-xs font-mono">{showCalcDetails ? '[-]' : '[+]'}</span>
                  </button>

                  {showCalcDetails && (
                    <div className="mt-4 text-[11px] text-white/60 leading-relaxed space-y-3 font-sans animate-in slide-in-from-top-1 fade-in duration-300">
                      <p>Cannabis effects aren’t linear. Terpenes and cannabinoids don’t just add up — they interact. Some amplify each other, some counteract, and some change behavior entirely depending on dose.</p>
                      <p className="pl-3 border-l border-white/10 italic text-white/50">For example: Certain terpenes can reduce anxiety at low levels but increase it at higher ones.</p>
                      <p>This system models those interactions — including counterbalancing, biphasic behavior, and known entourage effects — to arrive at a recommendation that fits the outcome you described, using what’s actually available right now.</p>
                    </div>
                  )}
                </div>

                {/* Technical Metadata */}
                <div className="pt-8 border-t border-white/5">
                  <p className="text-[9px] text-white/30 font-mono leading-relaxed">
                    RESOLVED_AT: {new Date().toISOString().split('T')[1].split('.')[0]}<br />
                    MODE: {consumptionMode.toUpperCase()}<br />
                    VECTOR_ID: {Math.random().toString(16).substr(2, 6).toUpperCase()}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      <SecretInventoryPortalComponent
        isOpen={showInventoryPortal}
        onClose={() => setShowInventoryPortal(false)}
        onSave={(items) => setInventory(items)}
      />

      {/* Sales Pitch Overlay */}
      <AnimatePresence>
        {salesMode && salesToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            key={salesToast.title}
            className="fixed bottom-12 left-0 right-0 z-[200] flex justify-center pointer-events-none"
          >
            <div className="bg-[#D4AF37] text-black px-8 py-6 rounded-sm shadow-[0_0_50px_rgba(212,175,55,0.4)] max-w-xl w-full mx-4 border border-white/20 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-white/40" />
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-[0.2em] mb-2 text-black/60">{salesToast.title}</h3>
                  <p className="text-lg font-medium leading-snug">{salesToast.message}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* BUILD FINGERPRINT */}
      <div className="fixed bottom-2 right-2 text-[9px] text-white/20 font-mono pointer-events-none z-[100]">
        GO CALC BUILD — 2026-01-08-B
      </div>
    </main>
  );
}
