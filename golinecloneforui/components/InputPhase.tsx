'use client';
import { motion } from 'framer-motion';

export default function InputPhase({ onResolve }: { onResolve: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center gap-8 w-full"
        >
            <div className="text-center space-y-2">
                <h2 className="text-3xl font-serif text-gold-gradient">Calculate Line</h2>
                <p className="text-neutral-400">Enter your details below</p>
            </div>

            <div className="w-full bg-[#1A1A1A] p-6 rounded-xl border border-white/5 space-y-6 shadow-2xl shadow-black/50">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-300 uppercase tracking-wider text-xs">Input Value</label>
                    <input type="text" className="w-full bg-black/40 border border-white/10 rounded-lg p-4 text-white focus:ring-1 focus:ring-[#C5A065] outline-none transition-all placeholder:text-neutral-700" placeholder="Enter value..." />
                </div>
                <button
                    onClick={onResolve}
                    className="w-full py-4 bg-gradient-to-r from-[#C5A065] to-[#E5C590] text-[#111] font-bold tracking-wide rounded-lg hover:opacity-90 transition-opacity shadow-lg shadow-[#C5A065]/20"
                >
                    RESOLVE BLEND
                </button>
            </div>
        </motion.div>
    );
}
