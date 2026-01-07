// ResolutionPanel: Represents the "Monitor Surface" | "Presented Response"
// Design Philosophy: Swiss Style, International Typographic Style
// Strict Grid, Scaling Typography, No Decoration.

'use client';

import { OutcomeResult } from '@/lib/goOutcomeEngine';
import BlendVisualizer from './BlendVisualizer';

// Interfaces matching the new "Editorial" data structure
export type CultivarRole = 'Anchor' | 'Modifier' | 'Synergist';

export interface ResolvedCultivar {
  id: string;
  name: string;
  role: CultivarRole;
  percentage: number;
  explanation: string;
  chemotypeId: string;
  weightGrams?: number;
}

export interface ResolvedBlend {
  resolutionMode: 'SINGLE_TARGET' | 'BLENDED' | 'FALLBACK';
  confidenceScore: number;
  stackingOptions?: { // Made optional to prevent TS errors if missing
    type: string;
    efficiencyScore: number;
  }[];
  // Allow flexible property names if strict types were causing issues, but stick to intent
  primaryBlend: ResolvedCultivar[];
  tradeoffs: string[];
  rationaleSummary: string;
  // Previously missing props that might have caused errors:
  cultivars?: ResolvedCultivar[]; // Alias for primaryBlend if engine uses this name
  stack?: any[]; // Alias for stackingOptions
  failure?: any;
}

interface ResolutionPanelProps {
  blend: ResolvedBlend | null;
  intent?: {
    activationTarget: number;
    cognitiveEndurance: number;
    anxietySensitivity: number;
  } | null;
  isComputing?: boolean;
}

export default function ResolutionPanel({ blend, intent, isComputing }: ResolutionPanelProps) {

  // IDLE STATE (Presented as potential)
  if (!blend) {
    return (
      <div className="opacity-0 lg:opacity-100 transition-opacity duration-1000 delay-500 min-h-[50vh] flex flex-col justify-start pt-12">
        <div className="w-8 h-1 bg-[#C5A065] mb-8" />
        <p className="text-xs font-bold text-zinc-700 uppercase tracking-widest max-w-xs">
          System Ready
        </p>
      </div>
    );
  }

  // ACTIVE STATE
  return (
    <div className="flex flex-col gap-24 lg:gap-32 mb-32 text-[#E5E5E5]">

      {/* 1. Header: Primary Conclusion */}
      <section className="animate-in fade-in slide-in-from-bottom-2 duration-700">
        <div className="flex flex-col gap-6">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C5A065]">Tonights Selection</span>
          <h2 className="font-serif text-3xl lg:text-5xl font-normal leading-tight tracking-tight text-white">
            {blend.rationaleSummary}
          </h2>
        </div>
      </section>

      {/* 2. Composition (The Blend) - ANIMATED VISUALIZER */}
      <section className="animate-in fade-in slide-in-from-bottom-2 duration-700 delay-100">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600 mb-12">Composition Structure</h3>

        {/* Animated Visualizer Component */}
        <BlendVisualizer blend={blend} />

        {/* PRODUCT COMPLETION: Stack Justification (Educational) */}
        <div className="mt-12 p-6 border border-zinc-800/50 bg-white/[0.02]">
          <h4 className="font-serif text-lg text-[#C5A065] mb-2">Entourage Architecture</h4>
          <p className="text-sm font-light text-zinc-400 leading-relaxed max-w-xl">
            This blend is stacked to manage the duration of effect. The <span className="text-white">Anchor</span> strain provides the biochemical foundation, while the <span className="text-white">Modifier</span> shapes the initial onset. The <span className="text-white">Synergist</span> bridges the two, ensuring a smooth transition rather than a jagged peak.
          </p>
        </div>

      </section>

      {/* 3. Metrics (Editorial Grid) */}
      <section className="animate-in fade-in slide-in-from-bottom-2 duration-700 delay-200">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600 mb-12">Signal Architecture</h3>

        <div className="grid grid-cols-2 gap-x-12 gap-y-16">
          <div>
            <span className="block text-[9px] uppercase tracking-widest text-[#C5A065] mb-2">Confidence</span>
            <div className="text-5xl font-serif text-white tracking-tight">
              {(blend.confidenceScore * 100).toFixed(0)}<span className="text-lg font-sans text-zinc-700">%</span>
            </div>
          </div>

          {intent && (
            <>
              <div>
                <span className="block text-[9px] uppercase tracking-widest text-zinc-600 mb-2">Activation</span>
                <div className="text-5xl font-serif text-white tracking-tight">
                  {(intent.activationTarget * 10).toFixed(1)}
                </div>
              </div>
              <div>
                <span className="block text-[9px] uppercase tracking-widest text-zinc-600 mb-2">Endurance</span>
                <div className="text-5xl font-serif text-white tracking-tight">
                  {(intent.cognitiveEndurance * 10).toFixed(1)}
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* 4. Tradeoffs & Follow Up */}
      <section className="animate-in fade-in slide-in-from-bottom-2 duration-700 delay-300">
        {blend.tradeoffs.length > 0 && (
          <div className="mb-12">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600 mb-8">Notes</h3>
            <ul className="space-y-4">
              {blend.tradeoffs.map((tradeoff, i) => (
                <li key={i} className="text-sm text-zinc-400 font-light flex gap-3 italic">
                  <span className="text-[#C5A065] not-italic">•</span> {tradeoff}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* PRODUCT COMPLETION: Follow-Up Actions */}
        <div className="border-t border-zinc-800 pt-8 flex flex-col gap-4">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600">Next Steps</span>
          <div className="flex flex-wrap gap-4">
            <button className="px-6 py-3 border border-[#C5A065] text-[#C5A065] text-xs uppercase tracking-widest hover:bg-[#C5A065] hover:text-black transition-colors">
              Refine Outcome
            </button>
            <button className="px-6 py-3 border border-zinc-800 text-zinc-400 text-xs uppercase tracking-widest hover:border-white hover:text-white transition-colors">
              Usage Protocol
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}
