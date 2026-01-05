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
}

interface ResolutionPanelProps {
  blend: ResolvedBlend;
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
 * StackedConsumptionView Component
 * Visual blocks for temporal consumption layout
 * Must be visual blocks, not text
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
 * ResolutionPanel Component
 * Main panel for structured resolution output
 */
export default function ResolutionPanel({ blend, intent, onAdjust }: ResolutionPanelProps) {
  // Enforce naming rule: Every resolution MUST have cultivar names
  if (!blend.cultivars || blend.cultivars.length === 0) {
    throw new Error('Resolution without cultivar names is invalid');
  }
  
  // Validate all cultivars have names
  const hasUnnamedCultivars = blend.cultivars.some(c => !c.name || c.name.trim() === '');
  if (hasUnnamedCultivars) {
    throw new Error('Resolution contains unnamed cultivars - invalid resolution');
  }
  
  return (
    <div className="border-t border-white/10 pt-12 pb-8 mb-16">
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
      
      <BlendBars cultivars={blend.cultivars} />
      
      {blend.cultivars.length > 1 && <StackedConsumptionView stack={blend.stack} />}
      
      <AdjustmentControls intent={intent} onAdjust={onAdjust} />
    </div>
  );
}

