'use client';

export const dynamic = 'force-dynamic';

/**
 * GO Line — Guided Outcomes Calculator
 * 
 * STRICT 3-COLUMN GRID LAYOUT
 * - Left: Intent Capture & Presets
 * - Center: Visualization (Gauge/HUD)
 * - Right: Resolution Analysis (Cinematic)
 * 
 * No Scroll. No Landing Page. Immediate Immersion.
 */

import { useState, useEffect } from 'react';
import {
  Circle
} from 'lucide-react';

import { presets, type Preset } from '@/lib/presets';
import CinematicRightPanel from '@/components/CinematicRightPanel';
import AgeGate from '@/components/AgeGate';
import SecretInventoryPortalComponent, { type InventoryItem } from '@/components/SecretInventoryPortal';
import BlendExecutionCalculator from '@/components/BlendExecutionCalculator';

// STRICT ENGINE IMPORTS
import { calculateBlends, EngineMode, Intent as StrictIntent, EngineOutput as StrictEngineOutput } from '@/lib/engine_core/go_calc_engine_strict';
import { ACTIVE_INVENTORY } from '@/lib/data/active_inventory';
import { OutcomeIntent, mapLegacyIntentToStrict, BlendCandidate } from '@/lib/engine_core/legacy_compat';

// --- TYPES ---
// --- TYPES ---
// OutcomeResult type removed as it is deprecated. UI uses BlendCandidate.

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
    avoidSedation: intent.avoidSedation,
    overshootTolerance: intent.overshootTolerance,
    durationPreference: intent.durationPreference,
  };
}

// Helper: Convert Strict Output to UI BlendCandidate for HUD
function convertToBlendCandidate(output: StrictEngineOutput | null): BlendCandidate | null {
  if (!output || output.recommendations.length === 0) return null;
  const rec = output.recommendations[0];
  return {
    cultivars: rec.cultivars.map(c => ({
      id: c.id,
      name: c.name,
      ratio: c.ratio
    })),
    metrics: {
      score: rec.score
    }
  };
}

export default function GOLineCalculator() {
  // --- STATE ---
  const [activeIntent, setActiveIntent] = useState<OutcomeIntent | null>(null);
  const [engineOutput, setEngineOutput] = useState<StrictEngineOutput | null>(null);
  const [blendCandidate, setBlendCandidate] = useState<BlendCandidate | null>(null); // For Center HUD

  const [inputMethod, setInputMethod] = useState<'preset' | 'manual'>('preset');
  const [userInput, setUserInput] = useState('');

  // UI State
  const [ageGateComplete, setAgeGateComplete] = useState(false);
  const [showInventoryPortal, setShowInventoryPortal] = useState(false);
  const [logoClickCount, setLogoClickCount] = useState(0);

  // --- LIFECYCLE ---
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedAge = localStorage.getItem('go_age_verified');
      if (storedAge) setAgeGateComplete(true);
    }
  }, []);

  // --- ACTIONS ---

  // 1. Handle Preset Click
  const handlePresetSelect = (preset: Preset) => {
    const intent = normalizeIntent(preset.intent);
    setActiveIntent(intent);
    setUserInput(preset.name); // Just for display context? Or clear it?
    runEngine(intent);
  };

  // 2. Run Engine (Deterministic)
  const runEngine = (intent: OutcomeIntent) => {
    const strictIntent = mapLegacyIntentToStrict(intent);
    const result = calculateBlends(ACTIVE_INVENTORY, strictIntent, "PRODUCTION");

    setEngineOutput(result);
    setBlendCandidate(convertToBlendCandidate(result));
  };

  // 3. Logo Secret
  const handleLogoClick = () => {
    setLogoClickCount(prev => prev + 1);
    if (logoClickCount + 1 >= 6) {
      setShowInventoryPortal(true);
      setLogoClickCount(0);
    }
    setTimeout(() => setLogoClickCount(0), 3000);
  };

  // --- RENDER ---

  if (!ageGateComplete) {
    return <AgeGate onComplete={() => {
      setAgeGateComplete(true);
      localStorage.setItem('go_age_verified', 'true');
    }} />;
  }

  return (
    <main className="w-screen h-screen bg-[#0a0b0e] text-white flex overflow-hidden font-sans selection:bg-[#D4AF37]/30">

      {/* --- LEFT PANEL: INTENT (400px) --- */}
      <section className="w-[400px] flex-shrink-0 flex flex-col border-r border-white/5 bg-black/20 backdrop-blur-xl relative z-10">
        {/* Header */}
        <div className="h-16 flex items-center px-6 border-b border-white/5">
          <button onClick={handleLogoClick} className="text-xs font-bold tracking-[0.2em] text-[#D4AF37] hover:text-white transition-colors">
            GO LINE // CALCULATOR
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">

          {/* Input Area */}
          <div>
            <label className="text-[10px] uppercase tracking-widest text-white/40 mb-3 block">Outcome Design</label>
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Describe the desired effect..."
              className="w-full bg-white/5 border border-white/10 rounded-sm p-4 text-sm text-white focus:outline-none focus:border-[#D4AF37]/50 transition-colors resize-none h-32 placeholder-white/20"
            />
          </div>

          {/* Presets Grid */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="text-[10px] uppercase tracking-widest text-[#D4AF37] block">Authoritative Presets</label>
              <span className="text-[10px] text-white/30">{presets.length} Options</span>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {presets.map(preset => (
                <button
                  key={preset.id}
                  onClick={() => handlePresetSelect(preset)}
                  className="group relative flex flex-col items-start p-4 bg-white/5 border border-white/5 hover:border-[#D4AF37]/40 hover:bg-white/10 transition-all duration-200 rounded-sm text-left"
                >
                  <div className="flex items-center w-full justify-between mb-1">
                    <span className="text-sm font-medium text-white/90 group-hover:text-[#D4AF37] transition-colors">{preset.name}</span>
                    <Circle className="w-2 h-2 text-white/20 group-hover:text-[#D4AF37] fill-current opacity-0 group-hover:opacity-100 transition-all" />
                  </div>
                  <p className="text-xs text-white/40 leading-relaxed font-light">{preset.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="h-12 border-t border-white/5 flex items-center px-6 text-[10px] text-white/20 justify-between">
          <span>V 1.0.0 STRICT</span>
          <span>ACTIVE</span>
        </div>
      </section>


      {/* --- CENTER PANEL: VISUALIZATION (Flex) --- */}
      <section className="flex-grow relative flex items-center justify-center bg-gradient-to-br from-[#0a0b0e] via-black to-[#050505]">
        {/* Background Decoration */}
        <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(circle_at_center,_transparent_0%,_#000_100%)]" />

        {/* The HUD / Gauge */}
        <div className="relative z-0 scale-90 md:scale-100 xl:scale-110 transition-transform duration-700">
          <BlendExecutionCalculator
            blend={blendCandidate || { cultivars: [], metrics: { score: 0 } }}
          />
        </div>

        {/* Lower Overlay Info */}
        {activeIntent && (
          <div className="absolute bottom-10 left-0 right-0 text-center pointer-events-none">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
              <span className="text-xs text-white/60 tracking-wider">RESOLVING TARGET VECTOR</span>
            </div>
          </div>
        )}
      </section>


      {/* --- RIGHT PANEL: ANALYSIS (450px) --- */}
      <section className="w-[450px] flex-shrink-0 border-l border-white/5 bg-black/40 backdrop-blur-xl relative z-10">
        {/* Uses the CinematicRightPanel, but we pass strict params */}
        {/* Note: CinematicRightPanel expects specific props. We map engineOutput. */}
        <CinematicRightPanel
          phase={blendCandidate ? 'resolved' : (activeIntent ? 'active' : 'idle')}
          blend={blendCandidate}
          intent={activeIntent || undefined}
          mode="blend"
        />
      </section>

      {/* Global Overlays */}
      <SecretInventoryPortalComponent
        isOpen={showInventoryPortal}
        onClose={() => setShowInventoryPortal(false)}
        onSave={() => { }} // No-op or reload logic
      />

    </main>
  );
}
