'use client';

/**
 * ResolutionPanel Component
 * 
 * Renders ONLY structured resolution data from the deterministic engine.
 * No prose. No chat. No free-form text.
 */

import { useState, useRef } from 'react';

/**
 * Single source of truth for resolution output
 * Must be populated only by the deterministic engine, never by free-form LLM text
 */
export type CultivarRole = 'foundation' | 'modulator' | 'accent';

export interface ResolvedCultivar {
  name: string;
  percentage: number;
  role: CultivarRole;
}

export interface ResolvedStack {
  bottom: string;
  middle?: string;
  top?: string;
}

export interface ResolvedBlend {
  cultivars: ResolvedCultivar[];
  stack?: ResolvedStack;
  failure?: {
    status: 'invalid';
    reason: 'INSUFFICIENT_DISTINCT_CULTIVARS' | 'INVENTORY_TOO_NARROW' | 'CONSTRAINT_CONFLICT' | 'PERCENTAGE_INVALID' | 'SYSTEM_ERROR';
    details?: string;
    excludedBy?: Array<{
      cultivarId: string;
      constraint: string;
      numericValue: number;
    }>;
  };
}

interface ResolutionPanelProps {
  blend: ResolvedBlend | null;
  intent: {
    activationTarget: number;
    cognitiveEndurance: number;
    anxietySensitivity: number;
  } | null;
  isComputing?: boolean; // True when resolver is actively evaluating candidates
}

/**
 * Blend Summary Component
 * Cultivar names, percentages, one-sentence purpose
 */
function BlendSummary({ cultivars, intent }: { cultivars: ResolvedCultivar[]; intent: { activationTarget: number; cognitiveEndurance: number; anxietySensitivity: number } }) {
  // Derive purpose from outcome vectors (deterministic, not prose)
  const getPurpose = () => {
    const duration = intent.cognitiveEndurance > 0.6 ? '4-hour' : intent.cognitiveEndurance > 0.4 ? '3-hour' : '2-hour';
    
    if (intent.anxietySensitivity < 0.4 && intent.activationTarget > 0.5) {
      return `Balanced Social Calm (${duration} window). Designed to reduce anxiety while maintaining verbal clarity and light mood elevation.`;
    } else if (intent.activationTarget > 0.6) {
      return `Mental Activation (${duration} window). Designed for sustained focus and cognitive clarity without overstimulation.`;
    } else if (intent.activationTarget < 0.4) {
      return `Calm Relaxation (${duration} window). Designed for physical comfort and mental ease without sedation.`;
    } else {
      return `Balanced Effect (${duration} window). Designed for stable mood and moderate energy throughout the session.`;
    }
  };

  return (
    <div className="mb-8">
      <div className="text-xs uppercase tracking-wider text-[#A1A1AA] mb-4 font-medium">
        Blend Summary
      </div>
      <div className="space-y-3 mb-4">
        {cultivars.map((cultivar, index) => (
          <div key={index} className="flex items-center gap-6">
            <div className="flex-1">
              <div className="text-lg font-medium text-[#EDEDED]" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                {cultivar.name}
              </div>
            </div>
            <div className="text-base font-light text-[#A1A1AA] tabular-nums w-16 text-right">
              {cultivar.percentage}%
            </div>
          </div>
        ))}
      </div>
      <div className="text-sm text-[#A1A1AA] leading-relaxed" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
        {getPurpose()}
      </div>
    </div>
  );
}

/**
 * Mixing Instructions Component
 * Procedural steps for combining cultivars
 */
function MixingInstructions() {
  return (
    <div className="mb-8 pt-6 border-t border-[rgba(255,255,255,0.06)]">
      <div className="text-xs uppercase tracking-wider text-[#A1A1AA] mb-4 font-medium">
        How to prepare
      </div>
      <div className="space-y-2 text-sm text-[#A1A1AA] leading-relaxed" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div>1. Grind each cultivar separately.</div>
        <div>2. Combine according to the ratios below.</div>
        <div>3. Mix thoroughly before rolling or packing.</div>
      </div>
    </div>
  );
}

/**
 * Weight Breakdown Component
 * Math-exact weight calculations based on total weight
 */
function WeightBreakdown({ cultivars, totalWeight = 3.5 }: { cultivars: ResolvedCultivar[]; totalWeight?: number }) {
  // Calculate weights: weight = totalWeight × (percentage / 100)
  const weights = cultivars.map(c => ({
    name: c.name,
    percentage: c.percentage,
    weight: totalWeight * (c.percentage / 100),
  }));

  // Round to 0.01g for display
  const roundedWeights = weights.map(w => ({
    ...w,
    weight: Math.round(w.weight * 100) / 100,
  }));

  // Calculate checksum
  const totalCalculated = roundedWeights.reduce((sum, w) => sum + w.weight, 0);
  const variance = Math.abs(totalCalculated - totalWeight);

  return (
    <div className="mb-8 pt-6 border-t border-[rgba(255,255,255,0.06)]">
      <div className="text-xs uppercase tracking-wider text-[#A1A1AA] mb-4 font-medium">
        Weight breakdown ({totalWeight} g total)
      </div>
      <div className="space-y-2 mb-4">
        {roundedWeights.map((w, idx) => (
          <div key={idx} className="flex items-center justify-between text-sm text-[#EDEDED]" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
            <span>
              {w.name} ({w.percentage}%)
            </span>
            <span className="tabular-nums font-light text-[#A1A1AA]">
              → {w.weight.toFixed(2)} g
            </span>
          </div>
        ))}
      </div>
      <div className="text-xs text-[#A1A1AA] font-light" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
        Total: {totalCalculated.toFixed(2)} g {variance > 0.01 ? `(rounding variance ±${variance.toFixed(2)} g)` : ''}
      </div>
    </div>
  );
}

/**
 * Consumption Guidance Component
 * Derived from outcome vectors (anxiety sensitivity, duration, cognitive endurance)
 */
function ConsumptionGuidance({ intent }: { intent: { activationTarget: number; cognitiveEndurance: number; anxietySensitivity: number } }) {
  // Derive duration estimate
  const getDuration = () => {
    if (intent.cognitiveEndurance > 0.7) return '~4 hours';
    if (intent.cognitiveEndurance > 0.4) return '~3 hours';
    return '~2 hours';
  };

  // Derive pacing guidance
  const getPacing = () => {
    if (intent.anxietySensitivity > 0.6) {
      return 'Take 1–2 draws, then wait 10–15 minutes before continuing.';
    } else if (intent.anxietySensitivity > 0.4) {
      return 'Take 2–3 draws, then wait 5–10 minutes before continuing.';
    } else {
      return 'Take 2–4 draws, then wait 5–10 minutes before continuing.';
    }
  };

  // Derive stop conditions
  const getStopConditions = () => {
    const conditions: string[] = [];
    
    if (intent.anxietySensitivity > 0.5) {
      conditions.push('anxiety increases');
    }
    
    if (intent.cognitiveEndurance < 0.5) {
      conditions.push('mental clarity drops');
    }
    
    if (intent.activationTarget < 0.4) {
      conditions.push('physical heaviness becomes noticeable');
    }
    
    if (conditions.length === 0) {
      conditions.push('desired effect plateaus');
    }
    
    return conditions.join(' or ');
  };

  return (
    <div className="mb-8 pt-6 border-t border-[rgba(255,255,255,0.06)]">
      <div className="text-xs uppercase tracking-wider text-[#A1A1AA] mb-4 font-medium">
        Suggested use
      </div>
      <div className="space-y-2 text-sm text-[#A1A1AA] leading-relaxed" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div>Best consumed over {getDuration()}.</div>
        <div>{getPacing()}</div>
        <div>Stop if {getStopConditions()}.</div>
      </div>
    </div>
  );
}

/**
 * Pre-roll Stacking Instructions Component
 * For stacked blends only
 */
function PreRollStacking({ stack, cultivars }: { stack?: ResolvedStack; cultivars: ResolvedCultivar[] }) {
  if (!stack) return null;

  return (
    <div className="mb-8 pt-6 border-t border-[rgba(255,255,255,0.06)]">
      <div className="text-xs uppercase tracking-wider text-[#A1A1AA] mb-4 font-medium">
        Pre-roll stacking
      </div>
      <div className="space-y-3 text-sm text-[#A1A1AA] leading-relaxed" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
        {stack.top && (
          <div>
            <span className="font-medium text-[#EDEDED]">Top (first third):</span> {stack.top} — energizing entry
          </div>
        )}
        {stack.middle && (
          <div>
            <span className="font-medium text-[#EDEDED]">Middle:</span> {stack.middle} — balanced transition
          </div>
        )}
        <div>
          <span className="font-medium text-[#EDEDED]">Bottom (final third):</span> {stack.bottom} — calming finish
        </div>
      </div>
    </div>
  );
}

/**
 * Physical Stack Visualization Component (PRIMARY)
 * Deterministic stacked pre-roll visualization using divs
 * Each layer's height is proportional to its resolved percentage
 * Ordered by stack position (bottom → middle → top)
 */
function PhysicalStackVisualization({ cultivars, stack }: { cultivars: ResolvedCultivar[]; stack?: ResolvedStack }) {
  // Type for layer with deterministic percentage
  type Layer = { 
    name: string; 
    role: CultivarRole; 
    percentage: number; // Actual resolved percentage (0-100)
    stackPosition: 'bottom' | 'middle' | 'top' | 'blend'; // Stack ordering
  };
  
  // Build layers deterministically from resolved blend data
  const layers: Layer[] = (() => {
    if (stack) {
      // Stacked resolution: order by stack position (bottom → middle → top)
      const stackLayers: Layer[] = [];
      
      // Bottom layer (always present in stack)
      const bottomCultivar = cultivars.find(c => c.name === stack.bottom);
      if (bottomCultivar) {
        stackLayers.push({
          name: bottomCultivar.name,
          role: bottomCultivar.role,
          percentage: bottomCultivar.percentage,
          stackPosition: 'bottom',
        });
      }
      
      // Middle layer (optional, 3-phase stack)
      if (stack.middle) {
        const middleCultivar = cultivars.find(c => c.name === stack.middle);
        if (middleCultivar) {
          stackLayers.push({
            name: middleCultivar.name,
            role: middleCultivar.role,
            percentage: middleCultivar.percentage,
            stackPosition: 'middle',
          });
        }
      }
      
      // Top layer (optional, 2-phase or 3-phase stack)
      if (stack.top) {
        const topCultivar = cultivars.find(c => c.name === stack.top);
        if (topCultivar) {
          stackLayers.push({
            name: topCultivar.name,
            role: topCultivar.role,
            percentage: topCultivar.percentage,
            stackPosition: 'top',
          });
        }
      }
      
      return stackLayers;
    } else {
      // Blended resolution: use cultivar order with actual percentages
      return cultivars.map(c => ({
        name: c.name,
        role: c.role,
        percentage: c.percentage,
        stackPosition: 'blend' as const,
      }));
    }
  })();

  // SYSTEM AUTHORITY RULE #2 & #3: PhysicalStackVisualization must NOT render if percentages invalid or duplicates exist
  // Remove all "warn but render" logic - replace with hard failure
  // If ResolutionPanel allows rendering, this component must still validate (defense in depth)
  const totalPercentage = layers.reduce((sum, l) => sum + l.percentage, 0);
  if (Math.abs(totalPercentage - 100) > 0.01) {
    // Hard fail - do not render anything
    return null;
  }
  
  // Check for duplicate names in layers
  const layerNames = layers.map(l => l.name);
  const uniqueLayerNames = new Set(layerNames);
  if (uniqueLayerNames.size !== layerNames.length) {
    // Hard fail - do not render anything
    return null;
  }

  const getRoleColor = (role: CultivarRole) => {
    if (role === 'foundation') return 'bg-white/30';
    if (role === 'modulator') return 'bg-white/20';
    return 'bg-white/15';
  };

  const getRoleBorder = (role: CultivarRole) => {
    if (role === 'foundation') return 'border-white/20';
    if (role === 'modulator') return 'border-white/15';
    return 'border-white/10';
  };

  // Fixed container height for deterministic rendering
  const CONTAINER_HEIGHT = 400; // pixels

  return (
    <div className="mb-12">
      <div className="text-xs uppercase tracking-wider text-[#A1A1AA] mb-6 font-medium">
        Stacked Consumption Visualization
      </div>
      
      {/* Deterministic vertical pre-roll representation */}
      {/* Uses flex-col-reverse to stack bottom-to-top visually */}
      <div className="flex items-end justify-center mb-6">
        <div 
          className="flex flex-col-reverse items-center w-40 relative"
          style={{ height: `${CONTAINER_HEIGHT}px` }}
        >
          {layers.map((layer, idx) => {
            // Calculate height in pixels from percentage
            const heightPx = (layer.percentage / 100) * CONTAINER_HEIGHT;
            const minHeightPx = 32; // Minimum readable height
            
            return (
              <div
                key={`${layer.name}-${idx}`}
                className={`w-full ${getRoleColor(layer.role)} ${getRoleBorder(layer.role)} border-2 flex-shrink-0`}
                style={{ 
                  height: `${Math.max(heightPx, minHeightPx)}px`,
                }}
              >
                <div className="h-full flex items-center justify-center p-2">
                  <div className="text-center">
                    <div className="text-xs font-medium text-[#EDEDED] mb-1 leading-tight" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                      {layer.name}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-[#A1A1AA] mb-1 font-light">
                      {layer.role === 'foundation' ? 'Foundation' : 
                       layer.role === 'modulator' ? 'Modulator' : 'Accent'}
                    </div>
                    <div className="text-[10px] text-[#A1A1AA] font-mono font-light">
                      {layer.percentage.toFixed(0)}%
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * StackedConsumptionView Component (LEGACY - kept for backward compatibility)
 * Visual blocks for temporal consumption layout
 */
function StackedConsumptionView({ stack }: { stack?: ResolvedStack }) {
  if (!stack) return null;
  
  return (
    <div className="mb-12 pt-8 border-t border-white/6">
      <div className="text-xs uppercase tracking-wider text-white/40 mb-6">
        Stacked Consumption Layout
      </div>
      
      <div className="space-y-4">
        {stack.top && (
          <div className="p-5 bg-white/5 border border-white/10">
            <div className="text-xs uppercase tracking-wider text-white/40 mb-2">
              Top Layer
            </div>
            <div className="text-base font-medium text-white mb-1">
              {stack.top}
            </div>
            <div className="text-xs text-white/50">
              Onset / Accent
            </div>
          </div>
        )}
        
        {stack.middle && (
          <div className="p-5 bg-white/5 border border-white/10">
            <div className="text-xs uppercase tracking-wider text-white/40 mb-2">
              Middle Layer
            </div>
            <div className="text-base font-medium text-white mb-1">
              {stack.middle}
            </div>
            <div className="text-xs text-white/50">
              Primary Effect
            </div>
          </div>
        )}
        
          <div className="p-5 bg-white/5 border border-white/10">
          <div className="text-xs uppercase tracking-wider text-white/40 mb-2">
            Bottom Layer
          </div>
          <div className="text-base font-medium text-white mb-1">
            {stack.bottom}
          </div>
          <div className="text-xs text-white/50">
            Duration / Body
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Resolved Metrics Component
 * Read-only static bars replacing sliders
 * No knobs, no hover affordance, thin horizontal bars
 */
function ResolvedMetrics({ 
  intent 
}: { 
  intent: {
    activationTarget: number;
    cognitiveEndurance: number;
    anxietySensitivity: number;
  };
}) {
  const metrics = [
    { label: 'Energy', value: intent.activationTarget },
    { label: 'Clarity', value: intent.cognitiveEndurance },
    { label: 'Anxiety Risk', value: intent.anxietySensitivity },
  ];

  return (
    <div className="mb-8 pt-6 border-t border-white/6">
      <div className="text-xs uppercase tracking-wider text-[#A1A1AA] mb-4 font-medium">
        Resolved Metrics
      </div>
      <div className="space-y-4">
        {metrics.map((metric, idx) => (
          <div key={idx} className="flex items-center gap-4">
            <div className="text-xs text-[#A1A1AA] w-24 uppercase tracking-wider font-light">
              {metric.label}
            </div>
            <div className="flex-1 h-1 bg-white/6">
              <div
                className="h-full bg-[#D6A84A]/40"
                style={{ width: `${metric.value * 100}%` }}
              />
            </div>
            <div className="text-xs text-[#A1A1AA] tabular-nums w-12 text-right font-light">
              {Math.round(metric.value * 100)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Resolution Rationale Component
 * Read-only explanation of why this composition was chosen
 * Collapsed by default, expandable on click
 * Lower contrast than resolved composition
 */
function ResolutionRationale({ 
  intent 
}: {
  intent: {
    activationTarget: number;
    cognitiveEndurance: number;
    anxietySensitivity: number;
  };
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  // Derive outcome alignment statements from intent
  const getOutcomeAlignment = () => {
    const alignments: string[] = [];
    
    if (intent.activationTarget > 0.6) {
      alignments.push('Mental stimulation without overstimulation');
    } else if (intent.activationTarget < 0.4) {
      alignments.push('Calm relaxation without sedation');
    } else {
      alignments.push('Balanced energy curve');
    }
    
    if (intent.anxietySensitivity < 0.4) {
      alignments.push('Low anxiety risk profile');
    } else if (intent.anxietySensitivity > 0.6) {
      alignments.push('Anxiety sensitivity constraints applied');
    }
    
    if (intent.cognitiveEndurance > 0.6) {
      alignments.push('Suitable for extended cognitive tasks');
    } else if (intent.cognitiveEndurance < 0.4) {
      alignments.push('Optimized for shorter duration');
    }
    
    if (intent.activationTarget > 0.5 && intent.anxietySensitivity < 0.5) {
      alignments.push('Suitable for social alertness');
    }
    
    return alignments;
  };
  
  // Derive composition logic from intent
  const getCompositionLogic = () => {
    const logic: string[] = [];
    
    if (intent.activationTarget > 0.6) {
      logic.push('Foundation strain establishes baseline mental clarity');
    } else {
      logic.push('Foundation strain provides stable base');
    }
    
    if (intent.anxietySensitivity < 0.4) {
      logic.push('Accent strain adds lift without increasing jitter');
    } else {
      logic.push('Modulator strain balances activation with anxiety mitigation');
    }
    
    logic.push('Overall ratio minimizes sympathetic nervous system activation');
    
    return logic;
  };
  
  const getUsageGuidance = () => {
    const guidance: string[] = [];
    
    // Recommended pacing based on cognitive endurance
    if (intent.cognitiveEndurance > 0.7) {
      guidance.push('Recommended pacing: Gradual onset, extended duration');
    } else if (intent.cognitiveEndurance < 0.4) {
      guidance.push('Recommended pacing: Quick onset, shorter session');
    } else {
      guidance.push('Recommended pacing: Moderate onset, balanced duration');
    }
    
    // When this blend is strongest
    if (intent.activationTarget > 0.6 && intent.anxietySensitivity < 0.4) {
      guidance.push('Peak window: 30-90 minutes after consumption');
    } else if (intent.anxietySensitivity > 0.6) {
      guidance.push('Peak window: Gradual onset, extended plateau');
    } else {
      guidance.push('Peak window: 45-120 minutes after consumption');
    }
    
    // When to stop
    if (intent.anxietySensitivity > 0.6) {
      guidance.push('When to stop: If anxiety increases or cognitive clarity decreases');
    } else if (intent.cognitiveEndurance < 0.4) {
      guidance.push('When to stop: If intensity peaks or mental drift begins');
    } else {
      guidance.push('When to stop: If desired effect plateaus or intensity exceeds comfort');
    }
    
    return guidance;
  };

  return (
    <div className="mt-8 pt-6 border-t border-white/6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left text-xs uppercase tracking-wider text-[#A1A1AA] hover:text-[#EDEDED] transition-colors font-medium"
        style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
      >
        <span>Why this works</span>
        <span className="text-[#A1A1AA]/50">{isExpanded ? '−' : '+'}</span>
      </button>
      
      {isExpanded && (
        <div className="mt-6 space-y-6 text-[#A1A1AA]" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
          {/* Outcome Alignment */}
          <div>
            <div className="text-xs text-[#A1A1AA] mb-2 font-medium">Outcome Alignment</div>
            <div className="space-y-1.5">
              {getOutcomeAlignment().map((alignment, idx) => (
                <div key={idx} className="text-xs text-[#A1A1AA] leading-relaxed font-light">
                  • {alignment}
                </div>
              ))}
            </div>
          </div>
          
          {/* Composition Logic */}
          <div>
            <div className="text-xs text-[#A1A1AA] mb-2 font-medium">Composition Logic</div>
            <div className="space-y-1.5">
              {getCompositionLogic().map((logic, idx) => (
                <div key={idx} className="text-xs text-[#A1A1AA] leading-relaxed font-light">
                  • {logic}
                </div>
              ))}
            </div>
          </div>
          
          {/* Usage Guidance */}
          <div>
            <div className="text-xs text-white/40 mb-2">Usage Guidance</div>
            <div className="space-y-1.5">
              {getUsageGuidance().map((guidance, idx) => (
                <div key={idx} className="text-xs text-white/50 leading-relaxed">
                  • {guidance}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Invalid Resolution State Component
 * Renders when resolution fails validation
 */
function InvalidResolutionState({ 
  failure, 
  intent
}: { 
  failure: ResolvedBlend['failure'];
  intent?: {
    activationTarget: number;
    cognitiveEndurance: number;
    anxietySensitivity: number;
  };
}) {
  const getFailureTitle = () => {
    return 'Unable to Resolve Blend';
  };

  const getFailureMessage = () => {
    if (!failure) return 'Unable to resolve a valid blend from the current inventory.';
    
    switch (failure.reason) {
      case 'INSUFFICIENT_DISTINCT_CULTIVARS':
      case 'INVENTORY_TOO_NARROW':
        return 'Only one strain in the current inventory meets all active constraints.';
      case 'CONSTRAINT_CONFLICT':
        return 'Current anxiety and intensity constraints conflict with available strains.';
      case 'PERCENTAGE_INVALID':
        return 'Blend composition percentages are invalid.';
      default:
        return 'Unable to resolve a valid blend from the current inventory.';
    }
  };

  const getSecondaryMessage = () => {
    if (!failure) return null;
    
    if (failure.reason === 'INSUFFICIENT_DISTINCT_CULTIVARS' || failure.reason === 'INVENTORY_TOO_NARROW') {
      return 'The current settings require multiple distinct cultivars.';
    }
    return null;
  };

  const getRationalePoints = () => {
    if (!failure) return [];
    
    switch (failure.reason) {
      case 'INSUFFICIENT_DISTINCT_CULTIVARS':
      case 'INVENTORY_TOO_NARROW':
        return [
          'Diversity requirement ≥ 2 cultivars',
          'Only one qualifying cultivar available',
          'No valid composition satisfies all invariants',
        ];
      case 'CONSTRAINT_CONFLICT':
        return [
          'Anxiety sensitivity constraints conflict with activation targets',
          'Available strains cannot satisfy all constraint requirements',
          'No valid composition satisfies all invariants',
        ];
      case 'PERCENTAGE_INVALID':
        return [
          'Blend percentages must sum to exactly 100%',
          'Each cultivar must be ≥ 5% and ≤ 85%',
          'No valid composition satisfies all invariants',
        ];
      default:
        return ['No valid composition satisfies all invariants'];
    }
  };

  const handleChangeInventory = () => {
    // For now, show a message - in future this could open inventory panel
    alert('Inventory selection coming soon. Please try a different outcome description.');
  };

  // PART 6: Invalid resolutions show no stack, no cultivar list
  // VISUAL CONTRACT: No decorative UI - only text and thin divider lines
  return (
    <div className="border-t border-white/10 pt-12 pb-8 mb-16">
      {/* Error Header - PART 7: Clean Failure Copy */}
      <div className="mb-8">
        <h2 className="text-lg font-medium text-white mb-3">
          {getFailureTitle()}
        </h2>
        <div className="text-sm text-white/70 leading-relaxed mb-2">
          {getFailureMessage()}
        </div>
        {getSecondaryMessage() && (
          <div className="text-sm text-white/50 leading-relaxed">
            {getSecondaryMessage()}
          </div>
        )}
      </div>
      
      {/* PART 6: No stack visualization, no cultivar breakdown in invalid state */}
      
      {/* Action Buttons */}
      <div className="mb-12 flex flex-wrap gap-3">
        <button
          onClick={handleChangeInventory}
          className="px-4 py-2 bg-[#0F1013] hover:bg-[#0F1013]/80 border border-white/6 hover:border-white/10 text-xs text-[#A1A1AA] uppercase tracking-wider transition-colors"
        >
          [ Change inventory ]
        </button>
          </div>

      {/* Resolution Rationale - PART 7: Bullet-only, factual */}
      <div className="mb-8">
        <div className="text-xs uppercase tracking-wider text-[#A1A1AA] mb-4 font-medium">
          Resolution Rationale
        </div>
        <div className="space-y-2">
          {getRationalePoints().map((point, idx) => (
            <div key={idx} className="text-xs text-[#A1A1AA] leading-relaxed" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
              • {point}
          </div>
          ))}
        </div>
      </div>

    </div>
  );
}

/**
 * Computing / Evaluation State Component
 * VISUAL CONTRACT: Text only, no decorative SVGs or cards
 * Shows while deterministic engine is actively evaluating candidates
 */
function ComputingState() {
  return (
    <div className="border-t border-white/10 pt-12 pb-8 mb-16">
      <div className="text-sm text-white/60 uppercase tracking-wider">
        Evaluating Candidates
      </div>
      <div className="text-xs text-white/40 mt-2">
        Deterministic resolver active
      </div>
    </div>
  );
}

/**
 * ResolutionPanel Component
 * Main panel for structured resolution output
 */
export default function ResolutionPanel({ blend, intent, isComputing }: ResolutionPanelProps) {
  // Computing / Evaluation State - Show when resolver is actively working
  // Timing rules:
  // - Display immediately when resolve action is initiated
  // - Remove instantly when resolver returns resolved or rejected
  // - Do not persist after resolution completes
  if (isComputing) {
    return <ComputingState />;
  }
  
  // PART 4: Hard Guards - Must have both blend and intent to render
  // If we have no blend/intent and not computing, don't render anything
  if (!blend || !intent) {
    return null; // No resolution data yet
  }
  
  // PART 4: Hard Guards - Check for failure state first
  if (blend.failure) {
    return <InvalidResolutionState failure={blend.failure} intent={intent} />;
  }
  
  // PART 4: Hard Guards - Enforce naming rule
  if (!blend.cultivars || blend.cultivars.length === 0) {
    return <InvalidResolutionState 
      failure={{
        status: 'invalid',
        reason: 'INSUFFICIENT_DISTINCT_CULTIVARS',
        details: 'Resolution without cultivar names is invalid',
      }}
      intent={intent}
    />;
  }
  
  // PART 4: Hard Guards - Validate all cultivars have names
  const hasUnnamedCultivars = blend.cultivars.some(c => !c.name || c.name.trim() === '');
  if (hasUnnamedCultivars) {
    return <InvalidResolutionState 
      failure={{
        status: 'invalid',
        reason: 'INSUFFICIENT_DISTINCT_CULTIVARS',
        details: 'Resolution contains unnamed cultivars - invalid resolution',
      }}
      intent={intent}
    />;
  }
  
  // PART 4: Hard Guards - Check for duplicate cultivars (SYSTEM AUTHORITY RULE #3)
  // Duplicate cultivars are illegal at render time - even if logic screws up upstream
  const uniqueNames = new Set(blend.cultivars.map(c => c.name));
  if (uniqueNames.size !== blend.cultivars.length) {
    return <InvalidResolutionState 
      failure={{
        status: 'invalid',
        reason: 'INSUFFICIENT_DISTINCT_CULTIVARS',
        details: 'Blend contains duplicate cultivars - invalid composition',
      }}
      intent={intent}
    />;
  }
  
  // PART 4: Hard Guards - Check percentage integrity (SYSTEM AUTHORITY RULE #2)
  // Percentages must hard-fail visually - if totalPercentage !== 100, nothing renders except failure state
  const totalPercentage = blend.cultivars.reduce((sum, c) => sum + c.percentage, 0);
  if (Math.abs(totalPercentage - 100) > 0.01) {
    return <InvalidResolutionState 
      failure={{
        status: 'invalid',
        reason: 'PERCENTAGE_INVALID',
        details: `Percentages sum to ${totalPercentage}%, must be exactly 100%`,
      }}
      intent={intent}
    />;
  }
  
  // SYSTEM AUTHORITY RULE #1: ResolutionPanel is the sole authority for whether any blend, stack, or cultivar data may render
  // All invariants have passed - safe to render
  // VISUAL CONTRACT: Render ONLY from resolvedOutput.cultivars[]
  // No success banners, checkmarks, or decorative UI
  // If blend.cultivars has N entries, render exactly N cultivars
  
  // State for total weight (default 3.5g)
  const [totalWeight, setTotalWeight] = useState(3.5);

  return (
    <div className="pt-8 pb-8 mb-16">
      {/* Resolved Composition - Visual anchor, no dividers above */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-2">
          GO Line — Resolved Composition
        </h2>
        <div className="text-xs text-white/40">
          Deterministic blend based on current inventory
        </div>
      </div>
      
      {/* A. Blend Summary (what + why) */}
      {intent && <BlendSummary cultivars={blend.cultivars} intent={intent} />}
      
      {/* B. Mixing Instructions (how to combine) */}
      <MixingInstructions />
      
      {/* C. Weight Breakdown (math-exact) */}
      <WeightBreakdown cultivars={blend.cultivars} totalWeight={totalWeight} />
      
      {/* Weight input (optional, hidden by default - can be made visible if needed) */}
      <div className="mb-8 pt-6 border-t border-[rgba(255,255,255,0.06)]">
        <div className="text-xs uppercase tracking-wider text-[#A1A1AA] mb-2 font-medium">
          Total weight
        </div>
        <input
          type="number"
          min="0.1"
          max="10"
          step="0.1"
          value={totalWeight}
          onChange={(e) => setTotalWeight(parseFloat(e.target.value) || 3.5)}
          className="w-32 px-3 py-2 bg-[#0F1013] border border-[rgba(255,255,255,0.06)] text-[#EDEDED] text-sm focus:outline-none focus:border-[#D6A84A]/40"
          style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
        />
        <span className="ml-2 text-sm text-[#A1A1AA]">g</span>
      </div>
      
      {/* D. Consumption Guidance (instructive, not advisory) */}
      {intent && <ConsumptionGuidance intent={intent} />}
      
      {/* Pre-roll Stacking Instructions (if stack exists) */}
      {blend.stack && <PreRollStacking stack={blend.stack} cultivars={blend.cultivars} />}
      
      {/* 1. PRIMARY: Physical Stack Visualization - Only renders if ResolutionPanel explicitly allows it */}
      <PhysicalStackVisualization cultivars={blend.cultivars} stack={blend.stack} />
      
      {/* 3. Resolved Metrics - Read-only static bars */}
      {intent && <ResolvedMetrics intent={intent} />}
      
      {/* 4. Resolution Rationale - collapsed by default, lower contrast */}
      {intent && <ResolutionRationale intent={intent} />}
    </div>
  );
}

