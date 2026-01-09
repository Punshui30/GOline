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
import { OutcomeIntent, OutcomeResult } from '@/lib/goOutcomeEngine';
import { resolveOutcome } from '@/lib/goOutcomeEngine';
import { StrategicGuidance, ClarificationQuestion } from '@/lib/strategicGuidance';
import { translateGuidanceToIntent } from '@/lib/guidanceToIntent';
import { ClarificationAxis, parseResolvedAxes, getAxisFromQuestionType } from '@/lib/clarificationAxes';
import { presets, type Preset, type BaselineCalibration as PresetBaselineCalibration } from '@/lib/presets';
import PreRollStack, { type StackSegment } from '@/components/PreRollStack';
import CompositionBreakdown, { type BlendComponent } from '@/components/CompositionBreakdown';
import SecretInventoryPortal, { type InventoryItem } from '@/components/SecretInventoryPortal';
import CinematicRightPanel from '@/components/CinematicRightPanel';

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
  const [conversationState, setConversationState] = useState<ConversationState>('active');
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);

  // Secret inventory portal state
  const [showInventoryPortal, setShowInventoryPortal] = useState(false);
  const [logoClickCount, setLogoClickCount] = useState(0);
  const [logoClickTimer, setLogoClickTimer] = useState<NodeJS.Timeout | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  const inputRef = useRef<HTMLTextAreaElement>(null);

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

  // Handle preset selection
  const handlePresetSelect = (preset: Preset) => {
    setSelectedPreset(preset);
    setPresetSelected(true);
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
    setConversationState('resolved');

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

  // --- RENDER: VIEW 1 - PRESET SELECTION ---
  if (!presetSelected && !calibrationComplete) {
    return (
      <main className="min-h-screen w-full bg-[#0a0b0e] text-white flex flex-col">
        {/* Header */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-[#0a0b0e] border-b border-white/5">
          <div className="max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center h-16">
              <button onClick={handleLogoClick} className="text-lg font-medium text-white/90">
                GO Line Calculator
              </button>
            </div>
          </div>
        </div>

        <div className="pt-24 pb-8 px-4 sm:px-6 lg:px-8 flex-1">
          <div className="max-w-[900px] mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handlePresetSelect(preset)}
                  className="px-4 py-3 bg-[#111216] border border-white/10 rounded-sm text-left hover:bg-[#1a1c20] hover:border-white/20 transition-colors"
                >
                  <div className="text-sm font-medium text-white/90 mb-1">{preset.name}</div>
                  <div className="text-xs text-white/60">{preset.description}</div>
                </button>
              ))}
            </div>
            <div className="text-center">
              <button
                onClick={() => setPresetSelected(true)}
                className="text-xs text-white/50 hover:text-white/70 underline"
              >
                Skip presets and start from scratch
              </button>
            </div>
          </div>
        </div>

        <SecretInventoryPortal
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
      <main className="min-h-screen w-full bg-[#0a0b0e] text-white flex flex-col">
        {/* Header */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-[#0a0b0e] border-b border-white/5">
          <div className="max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center h-16">
              <button onClick={handleLogoClick} className="text-lg font-medium text-white/90">
                GO Line Calculator
              </button>
            </div>
          </div>
        </div>

        <div className="pt-24 pb-8 px-4 sm:px-6 lg:px-8 flex-1">
          <div className="max-w-[900px] mx-auto">
            <div className="bg-[#111216] border border-white/10 rounded-sm p-6">
              {selectedPreset && (
                <div className="mb-4 pb-4 border-b border-white/10">
                  <div className="text-xs text-white/50 mb-1">Selected preset:</div>
                  <div className="text-sm font-medium text-white/80">{selectedPreset.name}</div>
                  <button
                    onClick={() => {
                      setSelectedPreset(null);
                      setBaselineCalibration({});
                      setUserInput('');
                      setPresetSelected(false);
                    }}
                    className="text-xs text-white/50 hover:text-white/70 underline mt-2"
                  >
                    Change preset
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-xs text-white/60 mb-2">THC Tolerance</label>
                  <select
                    value={baselineCalibration.thcTolerance || ''}
                    onChange={(e) => setBaselineCalibration({ ...baselineCalibration, thcTolerance: e.target.value as any })}
                    className="w-full px-3 py-2 bg-[#0a0b0e] border border-white/10 rounded-sm text-white text-sm focus:outline-none focus:border-white/20"
                  >
                    <option value="">Skip</option>
                    <option value="low">Low</option>
                    <option value="moderate">Moderate</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-white/60 mb-2">Anxiety Sensitivity</label>
                  <select
                    value={baselineCalibration.anxietySensitivity || ''}
                    onChange={(e) => setBaselineCalibration({ ...baselineCalibration, anxietySensitivity: e.target.value as any })}
                    className="w-full px-3 py-2 bg-[#0a0b0e] border border-white/10 rounded-sm text-white text-sm focus:outline-none focus:border-white/20"
                  >
                    <option value="">Skip</option>
                    <option value="low">Low</option>
                    <option value="moderate">Moderate</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-white/60 mb-2">Experience Level</label>
                  <select
                    value={baselineCalibration.experienceLevel || ''}
                    onChange={(e) => setBaselineCalibration({ ...baselineCalibration, experienceLevel: e.target.value as any })}
                    className="w-full px-3 py-2 bg-[#0a0b0e] border border-white/10 rounded-sm text-white text-sm focus:outline-none focus:border-white/20"
                  >
                    <option value="">Skip</option>
                    <option value="occasional">Occasional</option>
                    <option value="regular">Regular</option>
                    <option value="experienced">Experienced</option>
                  </select>
                </div>
              </div>
              <button
                onClick={handleCalibrationComplete}
                className="px-4 py-2 bg-white/10 text-white text-sm rounded-sm hover:bg-white/20 transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        </div>

        <SecretInventoryPortal
          isOpen={showInventoryPortal}
          onClose={() => setShowInventoryPortal(false)}
          onSave={(items) => setInventory(items)}
        />
      </main>
    );
  }

  // --- RENDER: VIEW 3 - DASHBOARD INTERFACE ---
  return (
    <main className="h-screen w-full bg-[#0a0b0e] text-white flex flex-col overflow-hidden">
      {/* Fixed Header (Minimal) */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#0a0b0e] border-b border-white/5 h-12 flex items-center justify-center">
        <button onClick={handleLogoClick} className="text-sm font-bold tracking-widest text-[#D4AF37]/80">
          GO LINE // OUTCOMES
        </button>
      </div>

      {/* 3-Column Dashboard */}
      <div className="flex-1 grid grid-cols-12 overflow-hidden pt-12">

        {/* PANEL 1: INPUT & CONTROLS (Left, 3 Cols) */}
        <div className="col-span-3 border-r border-white/10 flex flex-col h-full bg-[#0a0b0e]">
          <div className="flex-1 p-6 flex flex-col">
            <div className="mb-6">
              <h2 className="text-xs font-mono text-white/40 uppercase tracking-widest mb-2">Intent Input</h2>
              <p className="text-[10px] text-white/30 leading-relaxed">
                Describe the desired physiological and cognitive state.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4 flex-1">
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
                placeholder="E.g. Creative energy without anxiety..."
                className="w-full p-4 bg-[#111216] border border-white/10 rounded-sm text-white placeholder-white/20 text-sm focus:outline-none focus:border-[#D4AF37]/50 resize-none font-sans leading-relaxed"
                style={{ minHeight: '120px' }}
                disabled={isProcessing}
              />

              <button
                type="submit"
                disabled={!userInput.trim() || isProcessing}
                className="w-full py-4 bg-white text-black font-bold text-xs uppercase tracking-widest hover:bg-[#D4AF37] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Analyzing...' : 'Analyze Intent'}
              </button>
            </form>

            {/* Adjustments (Always visible but disabled if not resolved? Or only visible if resolved?) */}
            {conversationState === 'resolved' && intent && (
              <div className="mt-8 pt-8 border-t border-white/5 space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
                <h3 className="text-xs font-mono text-white/40 uppercase tracking-widest">Fine Tuning</h3>

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
                {/* Anxiety (Often Hidden or Automatic, but keeping per user req) */}
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
        </div>

        {/* PANEL 2: VISUALIZATION (Middle, 6 Cols) */}
        <div className="col-span-6 border-r border-white/10 relative bg-black flex flex-col">
          {/* The Visualizer takes the full space */}
          <div className="flex-1 relative">
            <CinematicRightPanel
              phase={conversationState}
              blend={outcomeResult?.primary as any}
            />
          </div>
          {/* Processing Status Bar */}
          {isProcessing && (
            <div className="absolute bottom-8 left-0 right-0 flex justify-center">
              <div className="px-4 py-2 bg-black/50 backdrop-blur-md border border-white/10 rounded-full text-[10px] text-[#D4AF37] font-mono animate-pulse">
                PROCESSING NEURAL VECTORS
              </div>
            </div>
          )}
        </div>

        {/* PANEL 3: CONTEXT & RESULTS (Right, 3 Cols) */}
        <div className="col-span-3 bg-[#0a0b0e] flex flex-col h-full overflow-hidden">
          {conversationState === 'active' ? (
            // Idle / Context State
            <div className="flex-1 p-8 flex flex-col justify-center opacity-40">
              <h3 className="text-sm font-bold text-white mb-4">SYSTEM CONTEXT</h3>
              <p className="text-xs text-white/60 leading-loose mb-4">
                The GO Line Calculator utilizes deterministic biological constraints to map subjective intent to chemical composition.
              </p>
              <ul className="text-[10px] text-white/40 space-y-2 font-mono list-disc pl-4">
                <li>Inputs are normalized to 0-1 vectors</li>
                <li>Matched against live inventory (QR verified)</li>
                <li>Optimized for bi-phasic duration</li>
              </ul>
            </div>
          ) : (
            // Resolved Results State
            <div className="flex-1 overflow-y-auto p-6">
              {intent && stackSegments.length > 0 && (
                <div className="space-y-8">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xs font-mono text-[#D4AF37] uppercase tracking-widest">Target Solved</h3>
                      <span className="text-[10px] px-2 py-0.5 bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 rounded">98.4% Match</span>
                    </div>
                    <h2 className="text-lg font-bold text-white leading-tight">
                      {stackSegments.length}-Part Stack
                    </h2>
                  </div>

                  {/* Stack Visual */}
                  <div className="py-4">
                    <PreRollStack segments={stackSegments} height={300} />
                  </div>

                  {/* Composition List */}
                  <div className="space-y-2 border-t border-white/10 pt-4">
                    <h4 className="text-[10px] text-white/40 uppercase tracking-widest mb-3">Active Cultivars</h4>
                    {breakdownComponents.map((comp, i) => (
                      <div key={i} className="flex justify-between items-center text-xs">
                        <span className="text-white/80">{comp.name}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-white/60" style={{ width: `${comp.percentage * 100}%` }} />
                          </div>
                          <span className="font-mono text-white/40 w-8 text-right">{Math.round(comp.percentage * 100)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="pt-8 mt-8 border-t border-white/5 text-center">
                    <p className="text-[9px] text-white/20 font-mono">
                      BATCH_ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}<br />
                      VERIFIED_BY_GO_ENGINE
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      <SecretInventoryPortal
        isOpen={showInventoryPortal}
        onClose={() => setShowInventoryPortal(false)}
        onSave={(items) => setInventory(items)}
      />
    </main>
  );
}
