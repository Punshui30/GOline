'use client';

import { motion, AnimatePresence } from 'framer-motion';
import RobotScene from '@/components/RobotScene';
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
        <div className="relative w-full h-full overflow-hidden bg-black select-none">
            {/* LAYER 0: R3F Mesh (Base) */}
            <div className="absolute inset-0 z-0">
                <RobotScene modelUrl="/robot.glb" />
            </div>

            {/* LAYER 1: Post-Process / Vignette */}
            <div className="absolute inset-0 z-10 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/50" />
                <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(0,0,0,0.8)]" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] opacity-10" />
            </div>

            {/* LAYER 2: Ambient Analysis (Drifting Text) */}
            <AnimatePresence>
                {isResolving && (
                    <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden">
                        <AmbientText text="ANALYZING TERPENES" top="20%" duration={8} />
                        <AmbientText text="CALCULATING VECTORS" top="40%" left="60%" duration={12} delay={1} />
                        <AmbientText text="MATCHING PROFILE" top="70%" left="20%" duration={10} delay={2} />
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

function AmbientText({ text, top = '50%', left = '10%', duration, delay = 0 }: { text: string, top?: string, left?: string, duration: number, delay?: number }) {
    return (
        <motion.div
            className="absolute text-[100px] font-bold text-white/5 whitespace-nowrap pointer-events-none"
            style={{ top, left }}
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 100, opacity: 0.1 }}
            exit={{ opacity: 0 }}
            transition={{ duration, delay, repeat: Infinity, repeatType: "reverse" }}
        >
            {text}
        </motion.div>
    );
}
