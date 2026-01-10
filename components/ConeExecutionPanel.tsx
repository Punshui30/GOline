'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ResolvedBlend } from '@/components/ResolutionPanel';
import type { BlendCandidate } from '@/lib/engine_core/legacy_compat';

interface ConeExecutionPanelProps {
    blend: ResolvedBlend | BlendCandidate;
}

export default function ConeExecutionPanel({ blend }: ConeExecutionPanelProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [targetWeight, setTargetWeight] = useState(1.0); // grams

    const presets = [0.5, 0.75, 1.0, 1.25];

    // Adapter for legacy ResolvedBlend (UI) vs new BlendCandidate (Engine)
    const steps = ('cultivars' in blend && Array.isArray(blend.cultivars))
        ? blend.cultivars.map(c => ({
            id: c.id,
            name: c.name,
            percentage: (c as any).percentage ?? ((c as any).ratio * 100)
        }))
        : (blend as any).primaryBlend || [];

    return (
        <div className="absolute bottom-8 right-8 z-50 flex flex-col items-end pointer-events-auto">

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="mb-4 bg-black/90 border border-amber/30 rounded-xl p-6 w-[320px] shadow-2xl backdrop-blur-xl"
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                            <h3 className="text-amber font-bold tracking-widest text-xs uppercase">Cone Calculator</h3>
                            <span className="text-white/40 text-[10px]">Exact Weights</span>
                        </div>

                        {/* Presets */}
                        <div className="flex gap-2 mb-6 justify-center">
                            {presets.map(w => (
                                <button
                                    key={w}
                                    onClick={() => setTargetWeight(w)}
                                    className={`px-3 py-1 text-xs font-mono rounded border transition-colors ${targetWeight === w
                                        ? 'bg-amber text-black border-amber'
                                        : 'bg-transparent text-white/60 border-white/20 hover:border-amber/50'
                                        }`}
                                >
                                    {w}g
                                </button>
                            ))}
                        </div>

                        {/* Calculation Display */}
                        <div className="space-y-4 mb-6">
                            {steps.map((strain: { id: string; name: string; percentage: number }) => {
                                const grams = (targetWeight * (strain.percentage / 100)); // Simple Math
                                return (
                                    <div key={strain.id} className="flex justify-between items-baseline">
                                        <span className="text-white font-bold text-lg leading-none">{strain.name}</span>
                                        <div className="text-right">
                                            <span className="text-amber font-mono text-2xl font-bold">{grams.toFixed(2)}</span>
                                            <span className="text-amber/50 text-xs ml-1">g</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Total Check */}
                        <div className="border-t border-white/10 pt-4 flex justify-between text-xs text-white/40 font-mono">
                            <span>TOTAL WEIGHT</span>
                            <span>{targetWeight.toFixed(2)} g</span>
                        </div>

                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute top-2 right-2 text-white/20 hover:text-white"
                        >
                            ✕
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                className="group flex items-center gap-3 bg-amber hover:bg-amber-light text-black px-6 py-3 rounded-full font-bold tracking-widest text-xs uppercase shadow-lg transition-all hover:scale-105 active:scale-95"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                <span>{isOpen ? 'Close Calculator' : 'Make This Blend'}</span>
                {!isOpen && (
                    <div className="w-2 h-2 rounded-full bg-black/30 animate-pulse" />
                )}
            </motion.button>

        </div>
    );
}
