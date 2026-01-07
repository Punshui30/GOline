// ResolutionPanel: Represents the "Monitor Surface" | "Presented Response"
// Design Philosophy: Swiss Style, International Typographic Style
// Strict Grid, Scaling Typography, No Decoration.

'use client';

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
        <div className="w-8 h-1 bg-[#D6A84A] mb-8" />
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
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D6A84A]">Resolved Output</span>
          <h2 className="text-2xl lg:text-3xl font-normal leading-snug tracking-tight text-white/90">
            {blend.rationaleSummary}
          </h2>
        </div>
      </section>

      {/* 2. Composition (The Blend) */}
      <section className="animate-in fade-in slide-in-from-bottom-2 duration-700 delay-100">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600 mb-12">Composition Structure</h3>

        <div className="grid grid-cols-1 gap-12">
          {blend.primaryBlend.map((cultivar, idx) => (
            <div key={cultivar.id || idx} className="relative group">
              {/* Massive Typographic Percentage */}
              <div className="text-[6rem] lg:text-[8rem] xl:text-[10rem] font-bold text-white leading-[0.8] tracking-tighter -ml-2 mb-4">
                {Math.round(cultivar.percentage)}<span className="text-2xl lg:text-4xl align-top text-zinc-700 font-normal">%</span>
              </div>

              <div className="flex flex-col gap-2 pl-2 border-l-2 border-[#D6A84A] ml-2">
                <h4 className="text-xl font-medium text-white tracking-tight">{cultivar.name}</h4>
                <div className="flex items-center gap-4 text-xs font-mono tracking-wide text-zinc-500">
                  <span className="uppercase text-[#D6A84A]">{cultivar.role}</span>
                  <span>{cultivar.weightGrams?.toFixed(2)}g</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Metrics (Editorial Grid) */}
      <section className="animate-in fade-in slide-in-from-bottom-2 duration-700 delay-200">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600 mb-12">Signal Architecture</h3>

        <div className="grid grid-cols-2 gap-x-12 gap-y-16">
          <div>
            <span className="block text-[9px] uppercase tracking-widest text-zinc-600 mb-2">Confidence</span>
            <div className="text-5xl font-light text-white tracking-tighter">
              {(blend.confidenceScore * 100).toFixed(0)}<span className="text-lg text-zinc-700">%</span>
            </div>
          </div>

          {intent && (
            <>
              <div>
                <span className="block text-[9px] uppercase tracking-widest text-zinc-600 mb-2">Activation</span>
                <div className="text-5xl font-light text-white tracking-tighter">
                  {(intent.activationTarget * 10).toFixed(1)}
                </div>
              </div>
              <div>
                <span className="block text-[9px] uppercase tracking-widest text-zinc-600 mb-2">Endurance</span>
                <div className="text-5xl font-light text-white tracking-tighter">
                  {(intent.cognitiveEndurance * 10).toFixed(1)}
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* 4. Tradeoffs (Minimal List) */}
      {blend.tradeoffs.length > 0 && (
        <section className="animate-in fade-in slide-in-from-bottom-2 duration-700 delay-300">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600 mb-8">Variances</h3>
          <ul className="space-y-4">
            {blend.tradeoffs.map((tradeoff, i) => (
              <li key={i} className="text-sm text-zinc-400 font-light flex gap-3">
                <span className="text-[#D6A84A]">•</span> {tradeoff}
              </li>
            ))}
          </ul>
        </section>
      )}

    </div>
  );
}
