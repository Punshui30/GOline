import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { type Strain } from '@/lib/strainLibrary';

interface StrainInsightCardProps {
    strain: Strain;
    percentage: number;
    role: string;
    index: number;
}

export default function StrainInsightCard({ strain, percentage, role, index }: StrainInsightCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    // Extract and sort terpenes for display
    const sortedTerpenes = Object.entries(strain.terpenes)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3); // Top 3 only

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.4 }}
            className={`
                relative w-full cursor-pointer
                bg-[#111216]/80 backdrop-blur-md border border-white/10 
                hover:border-[#D4AF37]/50 transition-colors
                rounded-sm overflow-hidden
                ${isExpanded ? 'z-20 ring-1 ring-[#D4AF37]/30' : 'z-auto'}
            `}
            onClick={() => setIsExpanded(!isExpanded)}
        >
            {/* Header / Collapsed State */}
            <div className="p-4 flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] font-mono text-white/40 uppercase tracking-wider">
                            {role}
                        </span>
                        {role === 'driver' && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                        )}
                    </div>
                    <h3 className="text-sm font-bold text-white leading-tight">
                        {strain.name}
                    </h3>
                </div>
                <div className="text-right">
                    <span className="text-lg font-light text-[#D4AF37]">
                        {Math.round(percentage * 100)}%
                    </span>
                </div>
            </div>

            {/* Expanded Content */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-4 pb-4 border-t border-white/5 bg-black/20"
                    >
                        {/* Cannabinoids */}
                        <div className="flex gap-4 mb-4 pt-3">
                            <div>
                                <span className="block text-[9px] text-white/30 uppercase tracking-widest mb-1">THC</span>
                                <span className="text-xs font-mono text-white">{strain.thc}%</span>
                            </div>
                            <div>
                                <span className="block text-[9px] text-white/30 uppercase tracking-widest mb-1">CBD</span>
                                <span className="text-xs font-mono text-white">{strain.cbd}%</span>
                            </div>
                        </div>

                        {/* Terpenes */}
                        <div className="space-y-2">
                            <span className="block text-[9px] text-white/30 uppercase tracking-widest mb-2">Dominant Terpenes</span>
                            {sortedTerpenes.map(([name, value]) => (
                                <div key={name} className="flex items-center text-[10px]">
                                    <span className="w-20 text-white/60 capitalize truncate">{name}</span>
                                    <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden mx-2">
                                        <div
                                            className="h-full bg-white/40"
                                            style={{ width: `${(value / 1) * 100}%` }} // Scale roughly 0-1% -> 0-100% width visibility
                                        />
                                    </div>
                                    <span className="w-8 text-right font-mono text-white/30">{value}%</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
