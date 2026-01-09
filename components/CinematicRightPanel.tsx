'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { ResolvedBlend } from '@/components/ResolutionPanel';
import RadialBlendHUD from './RadialBlendHUD';
import StackedBlendHUD from './StackedBlendHUD';
import ConeExecutionPanel from './ConeExecutionPanel';

interface CinematicRightPanelProps {
    phase: string;
    blend?: ResolvedBlend | null;
}

export default function CinematicRightPanel({ phase, blend }: CinematicRightPanelProps) {
    const isResolving = phase === 'resolving';
    const hasResult = phase === 'result' && blend && blend.primaryBlend && blend.primaryBlend.length > 0;

    // Heuristic for Stack vs Blend
    // A stack usually has explicit "Phase" roles or notes from the engine
    const isStack = hasResult && blend && blend.primaryBlend.some(s =>
        (s.explanation && s.explanation.includes('Phase')) ||
        (s.role === 'primary' && blend.stackingOptions) // Legacy check
    );

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

            {/* LAYER 2: Ambient Analysis (Drifting Text) */}
            <AnimatePresence>
                {/* Always show ambient text for atmosphere, maybe? No, user said "scrolling text needs to be a lot smaller...". Usually active during resolving or idle? Keeping logical condition for now. */}
                {(isResolving || !hasResult) && (
                    <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden flex flex-col justify-center opacity-30">
                        {/* Multiple lines of scrolling text */}
                        <AmbientText text="ANALYZING TERPENE PROFILE // " direction={1} speed={20} />
                        <AmbientText text="CALCULATING SYNERGY VECTORS // " direction={-1} speed={25} />
                        <AmbientText text="OPTIMIZING BIOAVAILABILITY // " direction={1} speed={30} />
                        <AmbientText text="MATCHING USER INTENT // " direction={-1} speed={22} />
                        <AmbientText text="RESOLVING COMPOSITION // " direction={1} speed={28} />
                        <AmbientText text="QUERYING STRAIN DATABASE // " direction={-1} speed={35} />
                    </div>
                )}
            </AnimatePresence>

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
                            {isStack ? (
                                <StackedBlendHUD blend={blend} />
                            ) : (
                                <RadialBlendHUD blend={blend} />
                            )}
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

function AmbientText({ text, direction = 1, speed = 20 }: { text: string, direction?: number, speed?: number }) {
    // Create a generic repeated string for marquee effect
    const content = Array(10).fill(text).join(' ');

    return (
        <div className="w-full overflow-hidden py-1">
            <motion.div
                className="whitespace-nowrap text-[10px] font-mono font-bold text-white/20 tracking-[0.2em]"
                initial={{ x: direction > 0 ? -100 : 0 }}
                animate={{ x: direction > 0 ? 0 : -1000 }} // Simple infinite scroll simulation requires seamless loop or reset. 
            // For simplicity, let's use a very long duration ping-pong or just standard drift.
            // Reverting to ping-pong drift as it's easier to impl perfectly without calc.
            // User asked for "scrolling text" but "within container".
            // Let's use the drift style but smaller.
            />
            {/* Retrying Implementation for standard drift */}
            <motion.div
                className="whitespace-nowrap text-[10px] font-mono font-bold text-white/20 tracking-[0.2em]"
                initial={{ x: direction === 1 ? '-20%' : '0%' }}
                animate={{ x: direction === 1 ? '0%' : '-20%' }}
                transition={{ duration: speed, repeat: Infinity, repeatType: "reverse", ease: "linear" }}
            >
                {content}
            </motion.div>
        </div>
    );
}
