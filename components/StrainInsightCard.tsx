import { motion, AnimatePresence } from 'framer-motion';
import { type Strain } from '@/lib/strainLibrary';

interface StrainInsightCardProps {
    strain: Strain;
    percentage: number;
    role: string;
    index: number;
    isExpanded: boolean;
    onToggle: () => void;
}

export default function StrainInsightCard({ strain, percentage, role, index, isExpanded, onToggle }: StrainInsightCardProps) {
    // 1. Process Terpenes (Sort & Assign Roles)
    const sortedTerpenes = Object.entries(strain.terpenes)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([name, value], i) => {
            // Simple heuristic for credible roles
            let roleLabel = 'Stabilizer';
            if (i === 0) roleLabel = 'Primary Driver';
            else if (i === 1) {
                roleLabel = 'Counterbalance';
            }
            return { name, value, role: roleLabel };
        });

    // 2. Dynamic Explanation Generator
    const generateExplanation = () => {
        const [t1, t2] = sortedTerpenes;
        if (!t1) return "Profile unavailable.";

        // Effect dictionary
        const effects: Record<string, string> = {
            myrcene: 'physical relaxation',
            limonene: 'mood elevation',
            caryophyllene: 'stress relief',
            pinene: 'mental clarity',
            humulene: 'comfort',
            linalool: 'calmness',
            terpinolene: 'active focus'
        };

        const t1Effect = effects[t1.name.toLowerCase()] || 'active effects';

        let text = `This strain contributes primarily through ${t1.name}, which supports ${t1Effect}.`;

        if (t2) {
            text += ` ${t2.name.charAt(0).toUpperCase() + t2.name.slice(1)} is present at a lower level to provide depth and keep the experience steady.`;
        }

        text += " The terpene profile is intentionally weighted to support the overall outcome without overpowering the blend.";
        return text;
    };


    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
            className={`
                relative w-full cursor-pointer
                bg-[#111216] border transition-colors overflow-hidden
                ${isExpanded ? 'border-[#D4AF37]/50 ring-1 ring-[#D4AF37]/10 z-10' : 'border-white/10 hover:border-white/20'}
                rounded-sm
            `}
            onClick={onToggle}
        >
            {/* Collapsed Header */}
            <div className="p-4 flex items-center justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                        <span className={`text-[9px] font-mono uppercase tracking-wider ${role === 'foundation' ? 'text-[#D4AF37]' : 'text-white/40'}`}>
                            {role}
                        </span>
                    </div>
                    <h3 className="text-sm font-bold text-white mb-1">{strain.name}</h3>
                    {/* Tags (Visible only when collapsed usually, or always? User said "Card: Collapsed State... Shows ... 1-2 dominant terpene tags") */}
                    {!isExpanded && (
                        <div className="flex gap-2">
                            {sortedTerpenes.slice(0, 2).map((t) => (
                                <span key={t.name} className="text-[9px] text-white/40 bg-white/5 px-1.5 py-0.5 rounded-sm capitalize">
                                    {t.name}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
                <div className="text-right pl-4">
                    <div className="text-lg font-light text-[#D4AF37]">{Math.round(percentage * 100)}%</div>
                    {!isExpanded && <div className="text-[9px] text-white/30 uppercase tracking-widest mt-1">View</div>}
                </div>
            </div>

            {/* Expanded Body */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-4 pb-4 border-t border-white/5 bg-black/20"
                    >
                        {/* Explanation */}
                        <div className="py-4">
                            <h4 className="text-[10px] text-white/40 uppercase tracking-widest mb-2">Why this strain is included</h4>
                            <p className="text-xs text-white/70 leading-relaxed font-sans">
                                {generateExplanation()}
                            </p>
                        </div>

                        {/* Terpene Table */}
                        <div className="mb-4">
                            <div className="flex border-b border-white/10 pb-1 mb-2">
                                <span className="w-1/3 text-[9px] text-white/30 uppercase">Terpene</span>
                                <span className="w-1/3 text-[9px] text-white/30 uppercase">Role</span>
                                <span className="w-1/3 text-[9px] text-white/30 uppercase text-right">Amount</span>
                            </div>
                            <div className="space-y-1.5">
                                {sortedTerpenes.map((t) => (
                                    <div key={t.name} className="flex items-center text-xs">
                                        <span className="w-1/3 text-white capitalize">{t.name}</span>
                                        <span className="w-1/3 text-white/50 text-[10px]">{t.role}</span>
                                        <span className="w-1/3 text-right text-white/50 font-mono">{t.value}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Cannabinoids */}
                        <div className="flex gap-6 pt-2 border-t border-white/5">
                            <div>
                                <span className="text-[9px] text-white/30 uppercase tracking-widest block mb-0.5">THC</span>
                                <span className="text-xs font-mono text-white">{strain.thc}%</span>
                            </div>
                            <div>
                                <span className="text-[9px] text-white/30 uppercase tracking-widest block mb-0.5">CBD</span>
                                <span className="text-xs font-mono text-white">{strain.cbd}%</span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
