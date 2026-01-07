'use client';
import { motion } from 'framer-motion';

export default function ResultPhase() {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-8 w-full"
        >
            <div className="text-center space-y-2">
                <h2 className="text-xl font-medium text-neutral-400 uppercase tracking-widest">Result</h2>
                <div className="text-5xl font-serif text-gold-gradient mt-4 shadow-gold-glow">$1,250.00</div>
            </div>

            <div className="w-full bg-[#1A1A1A] p-6 rounded-xl border border-white/5 space-y-0 divide-y divide-white/5">
                <div className="flex justify-between items-center py-4">
                    <span className="text-neutral-400">Base Rate</span>
                    <span className="font-mono text-neutral-200">$1,000.00</span>
                </div>
                <div className="flex justify-between items-center py-4">
                    <span className="text-neutral-400">Multiplier</span>
                    <span className="font-mono text-[#C5A065]">1.25x</span>
                </div>
                <div className="flex justify-between items-center py-4">
                    <span className="text-neutral-400">Confidence</span>
                    <span className="font-mono text-green-400">98.5%</span>
                </div>
            </div>

            <button className="text-neutral-500 hover:text-neutral-300 transition-colors text-sm uppercase tracking-widest border-b border-transparent hover:border-neutral-500 pb-1">
                Start New Calculation
            </button>
        </motion.div>
    );
}
