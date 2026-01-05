'use client';

/**
 * ResolutionPanel Component
 * 
 * Renders ONLY structured resolution data from the deterministic engine.
 * No prose. No chat. No free-form text.
 */

import { useState, useRef } from 'react';
import Image from 'next/image';

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
  onAdjust?: (adjustments: {
    activationTarget: number;
    cognitiveEndurance: number;
    anxietySensitivity: number;
  }) => void;
  isComputing?: boolean; // True when resolver is actively evaluating candidates
}

/**
 * BlendBars Component
 * Horizontal bars for each cultivar
 * No icons. No emojis. No chat bubbles.
 */
function BlendBars({ cultivars }: { cultivars: ResolvedCultivar[] }) {
  return (
    <div className="space-y-8 mb-12">
      {cultivars.map((cultivar, index) => (
        <div key={index} className="blend-row">
          <div className="flex items-center justify-between mb-2">
            <div className="label">
              <div className="text-lg font-medium text-white tracking-tight mb-1">
                {cultivar.name}
              </div>
              <div className="text-xs uppercase tracking-wider text-white/40">
                {cultivar.role === 'foundation' ? 'Foundation' : 
                 cultivar.role === 'modulator' ? 'Modulator' : 'Accent'}
              </div>
            </div>
            <div className="text-base text-white/50 font-mono">
              {cultivar.percentage}%
            </div>
          </div>
          <div className="relative h-3 bg-white/5 overflow-hidden rounded-sm">
            <div
              className="bar h-full bg-white/25 transition-all duration-300"
              style={{ width: `${cultivar.percentage}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Physical Stack Visualization Component (PRIMARY)
 * Vertical pre-roll representation with color-coded layers
 */
function PhysicalStackVisualization({ cultivars, stack }: { cultivars: ResolvedCultivar[]; stack?: ResolvedStack }) {
  // Type for layer
  type Layer = { name: string; role: CultivarRole; height: number };
  
  // If we have a stack structure, use it; otherwise use blend order
  const layers: Layer[] = stack ? (() => {
    const stackLayers: (Layer | undefined)[] = [];
    if (stack.top) {
      stackLayers.push({ name: stack.top, role: 'accent' as CultivarRole, height: 25 });
    }
    if (stack.middle) {
      stackLayers.push({ name: stack.middle, role: 'foundation' as CultivarRole, height: 50 });
    }
    stackLayers.push({ name: stack.bottom, role: 'modulator' as CultivarRole, height: 25 });
    return stackLayers.filter((l): l is Layer => l !== undefined);
  })() : cultivars.map(c => ({
    name: c.name,
    role: c.role,
    height: c.percentage,
  }));

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

  return (
    <div className="mb-12">
      <div className="text-xs uppercase tracking-wider text-white/40 mb-6">
        Physical Stack Layout
      </div>
      
      {/* Vertical pre-roll representation */}
      <div className="flex items-end justify-center gap-2 mb-6" style={{ height: '300px' }}>
        <div className="flex flex-col-reverse items-center w-32">
          {layers.map((layer, idx) => (
            <div
              key={idx}
              className={`w-full ${getRoleColor(layer.role)} ${getRoleBorder(layer.role)} border-2 rounded-t-sm transition-all`}
              style={{ 
                height: `${layer.height}%`,
                minHeight: '40px',
              }}
            >
              <div className="h-full flex items-center justify-center p-2">
                <div className="text-center">
                  <div className="text-xs font-medium text-white mb-1">
                    {layer.name}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-white/50">
                    {layer.role === 'foundation' ? 'Foundation' : 
                     layer.role === 'modulator' ? 'Modulator' : 'Accent'}
                  </div>
                </div>
              </div>
            </div>
          ))}
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
    <div className="mb-12 pt-8 border-t border-white/5">
      <div className="text-xs uppercase tracking-wider text-white/40 mb-6">
        Stacked Consumption Layout
      </div>
      
      <div className="space-y-4">
        {stack.top && (
          <div className="p-5 bg-white/5 border border-white/10 rounded-sm">
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
          <div className="p-5 bg-white/5 border border-white/10 rounded-sm">
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
        
        <div className="p-5 bg-white/5 border border-white/10 rounded-sm">
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
 * AdjustmentControls Component
 * Sliders that re-run the engine
 */
function AdjustmentControls({
  intent,
  onAdjust,
}: {
  intent: {
    activationTarget: number;
    cognitiveEndurance: number;
    anxietySensitivity: number;
  };
  onAdjust: (adjustments: {
    activationTarget: number;
    cognitiveEndurance: number;
    anxietySensitivity: number;
  }) => void;
}) {
  const [localActivation, setLocalActivation] = useState(intent.activationTarget * 100);
  const [localEndurance, setLocalEndurance] = useState(intent.cognitiveEndurance * 100);
  const [localAnxiety, setLocalAnxiety] = useState(intent.anxietySensitivity * 100);
  
  const handleActivationChange = (value: number) => {
    setLocalActivation(value);
    onAdjust({
      activationTarget: value / 100,
      cognitiveEndurance: intent.cognitiveEndurance,
      anxietySensitivity: intent.anxietySensitivity,
    });
  };
  
  const handleEnduranceChange = (value: number) => {
    setLocalEndurance(value);
    onAdjust({
      activationTarget: intent.activationTarget,
      cognitiveEndurance: value / 100,
      anxietySensitivity: intent.anxietySensitivity,
    });
  };
  
  const handleAnxietyChange = (value: number) => {
    setLocalAnxiety(value);
    onAdjust({
      activationTarget: intent.activationTarget,
      cognitiveEndurance: intent.cognitiveEndurance,
      anxietySensitivity: value / 100,
    });
  };
  
  return (
    <div className="border-t border-white/5 pt-8 space-y-8">
      <div className="text-xs uppercase tracking-wider text-white/40 mb-6">
        Adjustment Controls
      </div>
      
      <div className="space-y-6">
        {/* Energy ↔ Calm */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs text-white/60 uppercase tracking-wider">Energy ↔ Calm</div>
            <div className="text-xs text-white/40 font-mono">{localActivation}</div>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={localActivation}
            onChange={(e) => handleActivationChange(parseInt(e.target.value))}
            className="w-full h-1 bg-white/5 appearance-none cursor-pointer accent-white/20"
          />
        </div>
        
        {/* Duration ↔ Intensity */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs text-white/60 uppercase tracking-wider">Duration ↔ Intensity</div>
            <div className="text-xs text-white/40 font-mono">{localEndurance}</div>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={localEndurance}
            onChange={(e) => handleEnduranceChange(parseInt(e.target.value))}
            className="w-full h-1 bg-white/5 appearance-none cursor-pointer accent-white/20"
          />
        </div>
        
        {/* Anxiety Sensitivity */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs text-white/60 uppercase tracking-wider">Anxiety Sensitivity</div>
            <div className="text-xs text-white/40 font-mono">{localAnxiety}</div>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={localAnxiety}
            onChange={(e) => handleAnxietyChange(parseInt(e.target.value))}
            className="w-full h-1 bg-white/5 appearance-none cursor-pointer accent-white/20"
          />
        </div>
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
  intent, 
  onAdjust 
}: { 
  failure: ResolvedBlend['failure'];
  intent?: {
    activationTarget: number;
    cognitiveEndurance: number;
    anxietySensitivity: number;
  };
  onAdjust?: (adjustments: {
    activationTarget: number;
    cognitiveEndurance: number;
    anxietySensitivity: number;
  }) => void;
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

  const adjustmentControlsRef = useRef<HTMLDivElement>(null);
  const [allowSingleCultivar, setAllowSingleCultivar] = useState(false);

  const handleAdjustConstraints = () => {
    // Scroll to adjustment controls
    if (adjustmentControlsRef.current) {
      adjustmentControlsRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Highlight the controls briefly
      adjustmentControlsRef.current.style.transition = 'background-color 0.3s';
      adjustmentControlsRef.current.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
      setTimeout(() => {
        if (adjustmentControlsRef.current) {
          adjustmentControlsRef.current.style.backgroundColor = '';
        }
      }, 1000);
    }
  };

  const handleChangeInventory = () => {
    // For now, show a message - in future this could open inventory panel
    alert('Inventory selection coming soon. For now, adjusting constraints may help.');
  };

  const handleAllowSingleCultivar = () => {
    setAllowSingleCultivar(true);
    // Re-run resolution with single cultivar allowed
    // This would need to be passed through to the resolver
    // For now, just set the flag and let user adjust constraints
    if (onAdjust && intent) {
      // Slightly relax constraints to increase chances
      onAdjust({
        activationTarget: intent.activationTarget,
        cognitiveEndurance: intent.cognitiveEndurance,
        anxietySensitivity: Math.max(0.1, intent.anxietySensitivity - 0.1),
      });
    }
  };

  // PART 6: Invalid resolutions show no stack, no cultivar list
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
      
      {/* Action Buttons - PART 2: Functional Buttons */}
      <div className="mb-12 flex flex-wrap gap-3">
        <button
          onClick={handleAdjustConstraints}
          className="px-4 py-2 bg-white/10 hover:bg-white/15 border border-white/20 rounded-sm text-sm text-white/80 transition-colors"
        >
          [ Adjust constraints ]
        </button>
        <button
          onClick={handleChangeInventory}
          className="px-4 py-2 bg-white/10 hover:bg-white/15 border border-white/20 rounded-sm text-sm text-white/80 transition-colors"
        >
          [ Change inventory ]
        </button>
        <button
          onClick={handleAllowSingleCultivar}
          className="px-4 py-2 bg-white/10 hover:bg-white/15 border border-white/20 rounded-sm text-sm text-white/80 transition-colors"
        >
          [ Allow single-cultivar blend ]
        </button>
      </div>

      {/* Adjustment Controls - Visually Muted - PART 2: Scrollable target */}
      {intent && onAdjust && (
        <div ref={adjustmentControlsRef} className="mb-12 opacity-40">
          <div className="text-xs uppercase tracking-wider text-white/40 mb-2">
            ────────────────────────
          </div>
          <div className="text-xs uppercase tracking-wider text-white/30 mb-6">
            Adjustment Controls
          </div>
          <div className="text-xs text-white/20 italic mb-4">
            (sliders active, visually muted)
          </div>
          <AdjustmentControls intent={intent} onAdjust={onAdjust} />
        </div>
      )}

      {/* Rejection / Invalid Candidate Asset - Above Resolution Rationale */}
      {failure && (
        <div className="mb-8">
          <Image
            src="/rejection-invalid-candidate.png"
            alt="Resolution rejected - invalid candidate"
            width={800}
            height={200}
            className="w-full h-auto"
            priority
          />
        </div>
      )}

      {/* Resolution Rationale - PART 7: Bullet-only, factual */}
      <div className="mb-8">
        <div className="text-xs uppercase tracking-wider text-white/40 mb-4">
          ────────────────────────
        </div>
        <div className="text-xs uppercase tracking-wider text-white/40 mb-4">
          Resolution Rationale
        </div>
        <div className="space-y-2">
          {getRationalePoints().map((point, idx) => (
            <div key={idx} className="text-xs text-white/50 leading-relaxed">
              • {point}
            </div>
          ))}
        </div>
      </div>

      {/* Single cultivar notice if allowed */}
      {allowSingleCultivar && (
        <div className="mt-4 text-xs text-white/40 italic">
          Single-cultivar composition (explicitly allowed)
        </div>
      )}
    </div>
  );
}

/**
 * ResolutionPanel Component
 * Main panel for structured resolution output
 */
export default function ResolutionPanel({ blend, intent, onAdjust }: ResolutionPanelProps) {
  // PART 4: Hard Guards - Check for failure state first
  if (blend.failure) {
    return <InvalidResolutionState failure={blend.failure} intent={intent} onAdjust={onAdjust} />;
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
      onAdjust={onAdjust}
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
      onAdjust={onAdjust}
    />;
  }
  
  // PART 4: Hard Guards - Check for duplicate cultivars
  const uniqueNames = new Set(blend.cultivars.map(c => c.name));
  if (uniqueNames.size < 2 && blend.cultivars.length > 1) {
    return <InvalidResolutionState 
      failure={{
        status: 'invalid',
        reason: 'INSUFFICIENT_DISTINCT_CULTIVARS',
        details: 'Blend contains duplicate cultivars - invalid composition',
      }}
      intent={intent}
      onAdjust={onAdjust}
    />;
  }
  
  // PART 4: Hard Guards - Check percentage integrity
  const totalPercentage = blend.cultivars.reduce((sum, c) => sum + c.percentage, 0);
  if (Math.abs(totalPercentage - 100) > 0.01) {
    return <InvalidResolutionState 
      failure={{
        status: 'invalid',
        reason: 'PERCENTAGE_INVALID',
        details: `Percentages sum to ${totalPercentage}%, must be exactly 100%`,
      }}
      intent={intent}
      onAdjust={onAdjust}
    />;
  }
  
  // PART 3: Visual-First Rendering Priority
  // Success confirmation: Only render when all validations pass
  const isValidResolution = 
    !blend.failure &&
    blend.cultivars.length > 0 &&
    blend.cultivars.every(c => c.name && c.name.trim() !== '') &&
    Math.abs(blend.cultivars.reduce((sum, c) => sum + c.percentage, 0) - 100) < 0.01;
  
  return (
    <div className="border-t border-white/10 pt-12 pb-8 mb-16">
      {/* Success Confirmation Asset - Non-modal, non-blocking header */}
      {isValidResolution && (
        <div className="mb-8">
          <Image
            src="/success-confirmation.png"
            alt="Resolution successful"
            width={800}
            height={200}
            className="w-full h-auto"
            priority
          />
        </div>
      )}
      
      <div className="mb-10">
        <h2 className="text-lg font-medium text-white mb-1">
          GO Line — Resolved Composition
        </h2>
        <div className="text-xs text-white/30">
          {blend.cultivars.length === 1 
            ? 'Single cultivar recommendation'
            : `${blend.cultivars.length}-cultivar blend`}
        </div>
      </div>
      
      {/* 1. PRIMARY: Physical Stack Visualization */}
      <PhysicalStackVisualization cultivars={blend.cultivars} stack={blend.stack} />
      
      {/* 2. SECONDARY: Cultivar Breakdown */}
      <BlendBars cultivars={blend.cultivars} />
      
      {/* 3. TERTIARY: Metadata (optional) */}
      {blend.stack && (
        <div className="mb-8 text-xs text-white/40">
          {blend.stack.top && blend.stack.middle ? '3-phase stacked consumption plan' : '2-phase stacked consumption plan'}
        </div>
      )}
      
      {/* Adjustment Controls - render exactly once */}
      <AdjustmentControls intent={intent} onAdjust={onAdjust} />
    </div>
  );
}

