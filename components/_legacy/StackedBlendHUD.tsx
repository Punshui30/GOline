'use client';

import { motion } from 'framer-motion';
import type { ResolvedBlend } from '@/components/ResolutionPanel';
import type { BlendCandidate } from '@/lib/goOutcomeEngine';

interface StackedBlendHUDProps {
    blend: ResolvedBlend | BlendCandidate;
}

export default function StackedBlendHUD({ blend }: StackedBlendHUDProps) {
    // Adapter: Start with empty, check type
    const steps = 'selectedCultivars' in blend
        ? blend.selectedCultivars.map((c, i) => ({
            id: c.id,
            name: c.displayName,
            role: c.role,
            percentage: blend.ratios?.[i] || 0
        }))
        : blend.primaryBlend;

    return (
        <div className="flex flex-col items-center justify-center p-8 space-y-8 select-none">
            {/* Header */}
            <motion.div
                className="text-center mb-4"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <div className="text-[10px] text-amber tracking-[0.3em] font-bold uppercase">Sequential Stack</div>
            </motion.div>

            {steps.map((step, i) => (
                <div key={step.id} className="relative flex flex-col items-center">
                    {/* Connector Line (above step 2+) */}
                    {i > 0 && (
                        <motion.div
                            className="h-12 w-[1px] bg-gradient-to-b from-amber/50 to-amber/0 mb-4"
                            initial={{ height: 0 }}
                            animate={{ height: 48 }} // 12 * 4 = 48px
                            transition={{ duration: 0.5, delay: i * 0.5 }}
                        />
                    )}

                    {/* Step Tile */}
                    <motion.div
                        className="relative border border-white/10 bg-black/40 backdrop-blur-sm p-6 rounded-lg min-w-[280px] text-center"
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 + (i * 0.4), ease: "backOut" }}
                    >
                        <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-1 h-8 bg-amber" />

                        <div className="text-[9px] text-white/40 uppercase tracking-widest mb-1">
                            Phase {i + 1} • {step.role.toUpperCase()}
                        </div>
                        <div className="text-xl font-bold text-white mb-2 tracking-wide">
                            {step.name}
                        </div>

                        {/* Note from Engine (e.g. "Phase 1 driven by Limonene") */}
                        {/* We need to find the specific note for this phase? 
                    Engine stores notes in `blend.primary.notes` array. 
                    It puts them primarily on the Blend object, not individual cultivars in `ResolvedBlend` interface yet.
                    But in `goOutcomeEngine`, `notes` is string[].
                    We can try to match usage or display the generic note. 
                    Or just omit detailed note here and rely on HUD tiles below.
                */}
                    </motion.div>

                    {/* Down Arrow Indicator */}
                    {i < steps.length - 1 && (
                        <motion.div
                            className="absolute -bottom-8 text-amber/50"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8 + i }}
                        >
                            ▼
                        </motion.div>
                    )}
                </div>
            ))}

        </div>
    );
}
