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
 * BlendBars Component
 * Horizontal bars for each cultivar
 * Strain names = primary typography, percentages visually bound to names
 * No icons. No emojis. No chat bubbles.
 */
function BlendBars({ cultivars }: { cultivars: ResolvedCultivar[] }) {
  return (
    <div className="space-y-4 mb-8">
      {cultivars.map((cultivar, index) => (
        <div key={index} className="flex items-center gap-6">
          {/* Strain name - primary typography (H1) */}
          <div className="flex-1">
            <div className="text-xl font-medium text-[#EDEDED]" style={{ fontFamily: 'Inter, system-ui, sans-serif', letterSpacing: '-0.01em' }}>
              {cultivar.name}
            </div>
          </div>
          {/* Role - uppercase, subdued (Meta) */}
          <div className="text-xs uppercase tracking-wider text-[#A1A1AA] w-24 font-light">
            {cultivar.role === 'foundation' ? 'Foundation' : 
             cultivar.role === 'modulator' ? 'Modulator' : 'Accent'}
          </div>
          {/* Percentage - right-aligned (Meta) */}
          <div className="text-base font-light text-[#A1A1AA] tabular-nums w-16 text-right">
            {cultivar.percentage}%
          </div>
        </div>
      ))}
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
      
      {/* 1. PRIMARY: Physical Stack Visualization - Only renders if ResolutionPanel explicitly allows it */}
      <PhysicalStackVisualization cultivars={blend.cultivars} stack={blend.stack} />
      
      {/* 2. SECONDARY: Cultivar Breakdown - Strain names = primary typography */}
      <BlendBars cultivars={blend.cultivars} />
      
      {/* 3. Resolved Metrics - Read-only static bars */}
      {intent && <ResolvedMetrics intent={intent} />}
      
      {/* 4. Resolution Rationale - collapsed by default, lower contrast */}
      {intent && <ResolutionRationale intent={intent} />}
    </div>
  );
}

