'use client';

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
import { OutcomeIntent } from '@/lib/goOutcomeEngine';
import { resolveOutcome } from '@/lib/goOutcomeEngine';
import { StrategicGuidance, ClarificationQuestion } from '@/lib/strategicGuidance';
import { translateGuidanceToIntent } from '@/lib/guidanceToIntent';
import { ClarificationAxis, parseResolvedAxes, getAxisFromQuestionType } from '@/lib/clarificationAxes';
import { presets, type Preset, type BaselineCalibration as PresetBaselineCalibration } from '@/lib/presets';
import PreRollStack, { type StackSegment } from '@/components/PreRollStack';
import CompositionBreakdown, { type BlendComponent } from '@/components/CompositionBreakdown';
import SecretInventoryPortal, { type InventoryItem } from '@/components/SecretInventoryPortal';

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

interface OutcomeResult {
  selectedCultivars: Array<{ id: string; displayName: string }>;
  ratios: number[];
  confidenceScore: number;
  notes: string[];
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
  const [resolvedAxes, setResolvedAxes] = new Set<ClarificationAxis>();



  // Resolution state (for PreRollStack)
  const [intent, setIntent] = useState<OutcomeIntent | null>(null);
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
  const convertToStackFormat = (outcome: OutcomeResult) => {
    // Validate: must have named strains
    if (outcome.selectedCultivars.length === 0) {
      throw new Error('Resolution without cultivar names is invalid');
    }

    const hasUnnamed = outcome.selectedCultivars.some(c => !c.displayName || c.displayName.trim() === '');
    if (hasUnnamed) {
      throw new Error('Resolution contains unnamed cultivars - invalid resolution');
    }

    // Assign roles based on ratio order: largest = foundation, second = modulator, rest = accent
    const sorted = outcome.selectedCultivars
      .map((cultivar, index) => ({
        cultivar,
        ratio: outcome.ratios[index],
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

  return (
    <main className="min-h-screen w-full bg-[#0a0b0e] text-white flex flex-col">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#0a0b0e]/95 backdrop-blur-sm border-b border-white/5">
        <div className="max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-16">
            <button
              onClick={handleLogoClick}
              className="text-lg font-medium text-white/80 hover:text-white/90 transition-colors cursor-pointer"
            >
              GO Line Calculator
            </button>
          </div>
        </div>
      </div>

      {/* Preset Selection (Optional Entry Points) */}
      {!presetSelected && !calibrationComplete && (
        <div className="pt-24 pb-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-[900px] mx-auto">
            <div className="mb-6">
              <h2 className="text-sm font-medium text-white/80 mb-2">Quick Start (Optional)</h2>
              <p className="text-xs text-white/50 mb-4">Select a preset to pre-fill context, or start from scratch below.</p>
            </div>
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
      )}

      {/* Baseline Calibration (Optional, Lightweight) */}
      {presetSelected && !calibrationComplete && (
        <div className="pt-24 pb-8 px-4 sm:px-6 lg:px-8">
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
              <h2 className="text-sm font-medium text-white/80 mb-4">Quick Calibration (Optional)</h2>
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
      )}

      {/* Panel-Based Interface */}
      {calibrationComplete && (
        <div className="flex flex-col h-screen pt-16">
          {/* Top: Outcome Input */}
          <div className="border-b border-white/10 bg-[#0a0b0e]/95 backdrop-blur-sm">
            <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <form onSubmit={handleSubmit} className="flex gap-3">
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
                  placeholder="Describe your desired outcome..."
                  className="flex-1 px-4 py-3 bg-[#111216] border border-white/10 rounded-lg text-white placeholder-white/30 text-sm focus:outline-none focus:border-white/20 resize-none"
                  rows={2}
                  disabled={isProcessing}
                />
                <button
                  type="submit"
                  disabled={!userInput.trim() || isProcessing}
                  className="px-6 py-3 bg-white text-[#0a0b0e] font-medium text-sm rounded-lg hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isProcessing ? 'Processing...' : 'Process'}
                </button>
              </form>
              {error && (
                <div className="mt-2 text-xs text-red-400">{error}</div>
              )}
              {pendingClarification && conversationState === 'active' && (
                <div className="mt-2 text-xs text-white/60">
                  Clarification needed: {pendingClarification.question}
                </div>
              )}
            </div>
          </div>

          {/* Main Panel Area: Left (Adjustment Controls) + Right (Pre-Roll Stack Visualization) */}
          {conversationState === 'resolved' && intent && stackSegments.length > 0 && (
            <div className="flex-1 flex overflow-hidden">
              {/* Left: Adjustment Controls (sliders only) */}
              <div className="w-80 border-r border-white/10 bg-[#111216] p-6 overflow-y-auto">
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-white mb-1">Adjustment Controls</h3>
                  <div className="text-xs text-white/50">Fine-tune the outcome parameters</div>
                </div>

                <div className="space-y-8">
                  {/* Energy ↔ Calm */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-xs text-white/60 uppercase tracking-wider">Energy ↔ Calm</div>
                      <div className="text-xs text-white/40 font-mono">{Math.round(intent.activation * 100)}</div>
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
                      className="w-full h-1 bg-white/5 appearance-none cursor-pointer accent-white/20"
                    />
                  </div>

                  {/* Duration ↔ Intensity */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-xs text-white/60 uppercase tracking-wider">Duration ↔ Intensity</div>
                      <div className="text-xs text-white/40 font-mono">{Math.round(intent.cognitiveEndurance * 100)}</div>
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
                      className="w-full h-1 bg-white/5 appearance-none cursor-pointer accent-white/20"
                    />
                  </div>

                  {/* Anxiety Sensitivity */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-xs text-white/60 uppercase tracking-wider">Anxiety Sensitivity</div>
                      <div className="text-xs text-white/40 font-mono">{Math.round(intent.anxietySensitivity * 100)}</div>
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
                      className="w-full h-1 bg-white/5 appearance-none cursor-pointer accent-white/20"
                    />
                  </div>
                </div>
              </div>

              {/* Right: Pre-Roll Stack Visualization */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="flex flex-col items-center">
                  <div className="mb-8">
                    <h2 className="text-lg font-medium text-white mb-1">GO Line — Resolved Composition</h2>
                    <div className="text-xs text-white/30">
                      {stackSegments.length === 1
                        ? 'Single cultivar recommendation'
                        : `${stackSegments.length}-cultivar blend`}
                    </div>
                  </div>

                  {/* Pre-Roll Stack (Primary Visualization) */}
                  <PreRollStack segments={stackSegments} height={400} />

                  {/* Composition Breakdown (Collapsible) */}
                  {breakdownComponents.length > 0 && (
                    <div className="mt-12 w-full max-w-2xl">
                      <button
                        onClick={() => setShowBreakdown(!showBreakdown)}
                        className="w-full flex items-center justify-between p-4 bg-[#111216] border border-white/10 rounded-sm hover:bg-[#1a1c20] transition-colors"
                      >
                        <span className="text-sm font-medium text-white">View composition breakdown</span>
                        <span className="text-white/60 text-sm">{showBreakdown ? '−' : '+'}</span>
                      </button>
                      {showBreakdown && (
                        <div className="mt-4 p-6 bg-[#111216] border border-white/10 rounded-sm">
                          <CompositionBreakdown components={breakdownComponents} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Initial State: Show input area only */}
          {conversationState === 'active' && (
            <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
              <div className="text-center">
                <div className="text-white/60 text-sm mb-2">Enter your desired outcome above</div>
                {isProcessing && (
                  <div className="flex items-center gap-2 text-white/40 text-xs justify-center mt-4">
                    <span className="animate-pulse">●</span>
                    <span>Processing...</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Disclaimer */}
      <div className="mt-16 pt-8 border-t border-white/10 px-4 sm:px-6 lg:px-8 pb-8">
        <div className="max-w-[900px] mx-auto">
          <p className="text-xs text-white/40 leading-relaxed text-center">
            This prototype uses canonical terpene distributions derived from commonly reported profiles.
            Live GO systems operate exclusively on QR-verified batch data from accredited testing laboratories.
            <span className="block mt-2 font-mono text-[9px] text-[#C5A065]/50">v2.1 (Math-Spec Enforced)</span>
          </p>
          <div className="text-xs text-white/40 mt-2 text-center">
            Deterministic result — identical inputs will always resolve to the same composition.
          </div>
        </div>
      </div>

      {/* Secret Inventory Portal */}
      <SecretInventoryPortal
        isOpen={showInventoryPortal}
        onClose={() => setShowInventoryPortal(false)}
        onSave={(items) => {
          setInventory(items);
          // In production, this would constrain the deterministic engine
          console.log('Inventory saved:', items);
        }}
      />
    </main>
  );
}
