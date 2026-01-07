'use client';
import { motion } from 'framer-motion';

export default function ResolvingPhase() {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center p-12 space-y-8 w-full"
        >
            <div className="relative w-24 h-24">
                <div className="absolute inset-0 border-4 border-white/5 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-[#C5A065] rounded-full border-t-transparent animate-spin"></div>
            </div>
            <div className="space-y-2 text-center">
                <p className="text-gold-gradient font-serif text-xl animate-pulse">Resolving Blend...</p>
                <p className="text-neutral-500 text-sm">Calculating vectors</p>
            </div>
        </motion.div>
    );
}
