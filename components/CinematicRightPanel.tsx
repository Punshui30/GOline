'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { BlendCandidate } from '@/lib/goOutcomeEngine';
import RadialBlendHUD from './RadialBlendHUD';
import SmokeEffect from './SmokeEffect';
import FloatingSymbols from './FloatingSymbols';

import ConeExecutionPanel from './ConeExecutionPanel';

interface CinematicRightPanelProps {
    phase: 'idle' | 'active' | 'resolved' | 'synthesizing';
    blend?: BlendCandidate | null;
    mode: 'blend' | 'stack' | 'pre-roll' | 'flower' | 'concentrate';
}

export default function CinematicRightPanel({ phase, blend, mode }: CinematicRightPanelProps) {
    // 'active' = idle/input. 'resolved' = result.
    const hasResult = phase === 'resolved' && blend && blend.selectedCultivars && blend.selectedCultivars.length > 0;
    const isIdle = phase === 'idle';
    const isSynthesizing = phase === 'synthesizing';

    return (
        <div className="relative w-full h-full overflow-hidden bg-black select-none border-l border-white/10">
            {/* LAYER 0: Background (Static Dark Aesthetic) */}
            <div className="absolute inset-0 z-0 bg-[#050505]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-900/20 via-black to-black opacity-80" />
                {/* Grid Overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" />
            </div>

            {/* LAYER 1: Post-Process / Vignette */}
            <div className="absolute inset-0 z-10 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/50" />
                <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(0,0,0,0.8)]" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] opacity-10" />
            </div>

            {/* LAYER 1.5: Smoke Animation (Behind HUD) */}
            <AnimatePresence>
                {phase === 'resolved' && (
                    <SmokeEffect />
                )}
            </AnimatePresence>

            {/* LAYER 1.6: Synthesis Animation (Floating Symbols) */}
            <AnimatePresence>
                {isSynthesizing && (
                    <FloatingSymbols />
                )}
            </AnimatePresence>

            {/* LAYER 2: IDLE STATE (Purely Visual - No Instructional Text) */}
            {isIdle && (
                <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                    {/* Pulsing Core - "System Ready" State Visual - Subtle Application */}
                    <div className="relative">
                        <div className="w-1 h-1 bg-white/20 rounded-full animate-ping absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                        <div className="w-32 h-32 rounded-full border border-white/5 flex items-center justify-center opacity-20">
                            <div className="w-24 h-24 rounded-full border border-white/5" />
                        </div>
                    </div>
                </div>
            )}

            {/* LAYER 3: HUD / Results (Overlay) */}
            <AnimatePresence>
                {hasResult && blend && (
                    <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
                        {/* Center HUD */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
                            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
                            transition={{ duration: 0.8, ease: "circOut" }}
                            className="relative"
                        >
                            <RadialBlendHUD blend={blend} />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* LAYER 4: Controls & Execution Calculator */}
            <div className="absolute inset-0 z-40 pointer-events-none">
                {hasResult && blend && (
                    <ConeExecutionPanel blend={blend} />
                )}
            </div>
        </div>
    );
}
