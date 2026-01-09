import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface OnboardingModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md"
                >
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="max-w-2xl w-full p-12 bg-[#050505] border border-white/10 relative overflow-hidden"
                    >
                        {/* Aesthetic decorative touches */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/5 rounded-full blur-[100px] pointer-events-none" />

                        <div className="relative z-10 text-center">
                            <h2 className="text-xl font-medium text-[#D4AF37] tracking-widest uppercase mb-12">
                                Strains change. Feelings don't have to.
                            </h2>

                            <div className="space-y-6 text-sm text-white/70 font-light leading-relaxed max-w-lg mx-auto mb-16 text-left">
                                <p>Here’s the thing about cannabis.</p>

                                <p>The same strain name doesn’t always feel the same.</p>

                                <p>Even from the same grower, batches change. Terpenes shift. Potency varies. Inventory comes and goes. So chasing a strain you loved once can be frustrating — or impossible.</p>

                                <p>Instead of chasing names, this system focuses on what actually matters: <strong className="text-white font-medium">how you want to feel.</strong></p>

                                <p>Tell us the outcome you’re looking for, and we’ll match it using the strains that are available right now, based on their real terpene and cannabinoid profiles — not guesses or averages.</p>

                                <p className="pt-4 border-t border-white/10 text-white/90 italic">
                                    The goal is simple: recreate the feeling you remember, even when the strain changes.
                                </p>
                            </div>

                            <button
                                onClick={onClose}
                                className="px-10 py-4 bg-white text-black font-bold text-xs uppercase tracking-[0.2em] hover:bg-[#D4AF37] transition-all duration-300 transform hover:scale-105"
                            >
                                Continue to Calculator
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
