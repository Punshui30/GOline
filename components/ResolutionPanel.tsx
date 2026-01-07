'use client';

/**
 * ResolutionPanel Component
 * 
 * Renders ONLY structured resolution data from the deterministic engine.
 * No prose. No chat. No free-form text.
 */

import { useState } from 'react';

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
 * Blend Composition Table Component
 * Table-style layout: Cultivar | Role | % | Grams
 */
function BlendCompositionTable({ cultivars, totalWeight = 3.5 }: { cultivars: ResolvedCultivar[]; totalWeight?: number }) {
  const rows = cultivars.map(c => ({
    name: c.name,
    role: c.role,
    percentage: c.percentage,
    grams: Math.round((totalWeight * (c.percentage / 100)) * 100) / 100,
  }));

  const getRoleLabel = (role: CultivarRole) => {
    if (role === 'foundation') return 'Foundation';
    if (role === 'modulator') return 'Modulator';
    return 'Accent';
  };

  return (
    <div className="mb-8">
      <div className="text-xs uppercase tracking-wider text-[#A1A1AA] mb-4 font-medium">
        Blend Composition
      </div>
      <div className="border border-[rgba(255,255,255,0.06)]">
        <table className="w-full" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
          <thead>
            <tr className="border-b border-[rgba(255,255,255,0.06)]">
              <th className="text-left text-xs uppercase tracking-wider text-[#A1A1AA] font-medium px-4 py-3">Cultivar</th>
              <th className="text-left text-xs uppercase tracking-wider text-[#A1A1AA] font-medium px-4 py-3">Role</th>
              <th className="text-right text-xs uppercase tracking-wider text-[#A1A1AA] font-medium px-4 py-3">%</th>
              <th className="text-right text-xs uppercase tracking-wider text-[#A1A1AA] font-medium px-4 py-3">Grams</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx} className="border-b border-[rgba(255,255,255,0.06)] last:border-b-0">
                <td className="px-4 py-3 text-sm text-[#EDEDED] font-medium">{row.name}</td>
                <td className="px-4 py-3 text-xs text-[#A1A1AA] uppercase tracking-wider">{getRoleLabel(row.role)}</td>
                <td className="px-4 py-3 text-sm text-[#A1A1AA] tabular-nums text-right">{row.percentage}%</td>
                <td className="px-4 py-3 text-sm text-[#A1A1AA] tabular-nums text-right">{row.grams.toFixed(2)} g</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Visual Blend Bar Component
 * Horizontal stacked bar showing percentages visually
 */
function VisualBlendBar({ cultivars, totalWeight = 3.5 }: { cultivars: ResolvedCultivar[]; totalWeight?: number }) {
  const segments = cultivars.map(c => ({
    name: c.name,
    percentage: c.percentage,
    grams: Math.round((totalWeight * (c.percentage / 100)) * 100) / 100,
    role: c.role,
  }));

  const getRoleColor = (role: CultivarRole) => {
    if (role === 'foundation') return 'bg-[#D6A84A]/40';
    if (role === 'modulator') return 'bg-[#D6A84A]/30';
    return 'bg-[#D6A84A]/20';
  };

  return (
    <div className="mb-8">
      <div className="text-xs uppercase tracking-wider text-[#A1A1AA] mb-4 font-medium">
        Visual Blend
      </div>
      <div className="w-full h-16 border border-[rgba(255,255,255,0.06)] flex overflow-hidden">
        {segments.map((seg, idx) => (
          <div
            key={idx}
            className={`${getRoleColor(seg.role)} border-r border-[rgba(255,255,255,0.06)] last:border-r-0 flex flex-col items-center justify-center px-2 relative`}
            style={{ width: `${seg.percentage}%` }}
          >
            <div className="text-[10px] font-medium text-[#EDEDED] text-center leading-tight mb-0.5" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
              {seg.name}
            </div>
            <div className="text-[9px] text-[#A1A1AA] tabular-nums text-center">
              {seg.percentage}% / {seg.grams.toFixed(2)}g
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}



/**
 * Usage Instructions Component
 * Micro copy only - bullet points, max 1 line per bullet
 */
function UsageInstructions({ intent }: { intent: { activationTarget: number; cognitiveEndurance: number; anxietySensitivity: number } }) {
  const getDuration = () => {
    if (intent.cognitiveEndurance > 0.7) return '~4 hours';
    if (intent.cognitiveEndurance > 0.4) return '~3 hours';
    return '~2 hours';
  };

  const bullets: string[] = [
    'Grind strains separately',
    'Combine by weight',
    `Consume over ${getDuration()}`,
  ];

  return (
    <div className="mb-8 pt-6 border-t border-[rgba(255,255,255,0.06)]">
      <div className="text-xs uppercase tracking-wider text-[#A1A1AA] mb-3 font-medium">
        Usage Instructions
      </div>
      <ul className="space-y-1" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
        {bullets.map((bullet, idx) => (
          <li key={idx} className="text-xs text-[#A1A1AA]">
            • {bullet}
          </li>
        ))}
      </ul>
    </div>
  );
}


/**
 * Physical Stack Visualization Component (PRIMARY)
 * Deterministic stacked pre-roll visualization using divs
 * Each layer's height is proportional to its resolved percentage
 * Ordered by stack position (bottom → middle → top)
 * Includes gram weight calculations and instructional copy
 */
function PhysicalStackVisualization({ cultivars, stack, totalWeight = 3.5 }: { cultivars: ResolvedCultivar[]; stack?: ResolvedStack; totalWeight?: number }) {
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

  // Calculate gram weights for each layer
  const layersWithWeights = layers.map(layer => {
    const weight = totalWeight * (layer.percentage / 100);
    const roundedWeight = Math.round(weight * 100) / 100;
    return {
      ...layer,
      weight: roundedWeight,
    };
  });

  return (
    <div className="mb-12">
      <div className="text-xs uppercase tracking-wider text-[#A1A1AA] mb-4 font-medium">
        Stacked Consumption Visualization
      </div>

      {/* Instructional copy */}
      <div className="text-sm text-[#A1A1AA] mb-6 leading-relaxed" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
        If rolling a {totalWeight}g pre-roll, use:
      </div>

      {/* Deterministic vertical pre-roll representation */}
      {/* Uses flex-col-reverse to stack bottom-to-top visually */}
      <div className="flex items-end justify-center mb-6">
        <div
          className="flex flex-col-reverse items-center w-40 relative"
          style={{ height: `${CONTAINER_HEIGHT}px` }}
        >
          {layersWithWeights.map((layer, idx) => {
            // Calculate height in pixels from percentage
            const heightPx = (layer.percentage / 100) * CONTAINER_HEIGHT;
            const minHeightPx = 40; // Minimum readable height (increased to fit gram weight)

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
                    <div className="text-[10px] text-[#A1A1AA] font-mono font-light mb-0.5">
                      {layer.percentage.toFixed(0)}%
                    </div>
                    <div className="text-[10px] text-[#A1A1AA] font-mono font-light">
                      {layer.weight.toFixed(2)}g
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
    <div className="mb-8 pt-6 border-b border-white/6 pb-6">
      <div className="text-xs uppercase tracking-wider text-[#A1A1AA] mb-4 font-medium">
        Target Metrics
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
    <div className="pt-12 pb-8 mb-16 h-full flex flex-col justify-center">
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
    <div className="pt-12 pb-8 mb-16 h-full flex flex-col items-center justify-center opacity-70">
      <div className="text-sm text-white/60 uppercase tracking-wider animate-pulse">
        Evaluating Candidates
      </div>
      <div className="text-xs text-white/40 mt-2">
        Deterministic resolver active
      </div>
    </div>
  );
}

/**
 * Idle / Empty State Component
 * NEW: Persistent "Ghost" visualization indicating readiness
 */
function IdleState() {
  return (
    <div className="h-full flex flex-col items-center justify-center p-12 opacity-30 select-none">
      <div className="w-40 h-[400px] border-2 border-dashed border-white/20 flex flex-col items-center justify-center mb-6">
        <div className="text-xs uppercase tracking-wider text-white/40">
          Target Blend
        </div>
      </div>
      <div className="text-sm text-white/30 text-center max-w-xs">
        Describe outcome to resolve formulation
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

  // SUPPORT EMPTY/IDLE MODE
  // If no blend/intent, render the IdleState instead of null
  if (!blend || !intent) {
    return <IdleState />;
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
  // Note: We use a key to force re-render if needed, but here we can just let it persist
  // const [totalWeight, setTotalWeight] = useState(3.5); // Logic moved to parent or kept local? Keeping local for now

  return (
    <div className="h-full flex flex-col">
      {/* Resolved Metrics - Read-only static bars - MOVED TO TOP */}
      {intent && <ResolvedMetrics intent={intent} />}

      {/* A. Blend Composition Table */}
      <BlendCompositionTable cultivars={blend.cultivars} totalWeight={3.5} />

      {/* B. Visual Blend Bar */}
      <VisualBlendBar cultivars={blend.cultivars} totalWeight={3.5} />

      {/* C. Pre-Roll Stack Visualization (vertical) */}
      <PhysicalStackVisualization cultivars={blend.cultivars} stack={blend.stack} totalWeight={3.5} />

      {/* D. Usage Instructions (micro copy only) */}
      {intent && <UsageInstructions intent={intent} />}

    </div>
  );
}
