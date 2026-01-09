'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { type BlendCandidate } from '@/lib/goOutcomeEngine';

interface BlendExecutionCalculatorProps {
    blend: BlendCandidate;
}

const PRESET_SIZES = [0.5, 0.75, 1.0];

export default function BlendExecutionCalculator({ blend }: BlendExecutionCalculatorProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    // Inputs
    const [unitSize, setUnitSize] = useState<number>(0.75); // Grams per unit
    const [isCustomSize, setIsCustomSize] = useState(false);
    const [customSizeValue, setCustomSizeValue] = useState<string>('1.0');

    const [quantity, setQuantity] = useState<number>(1);

    // Inventory State: strainId -> available grams
    const [inventoryMap, setInventoryMap] = useState<Record<string, string>>({});

    // Toggle logic for size
    const handleSizeChange = (val: string) => {
        if (val === 'custom') {
            setIsCustomSize(true);
            setUnitSize(parseFloat(customSizeValue) || 1);
        } else {
            setIsCustomSize(false);
            setUnitSize(parseFloat(val));
        }
    };

    const handleCustomSizeBlur = () => {
        const val = parseFloat(customSizeValue);
        if (!isNaN(val) && val > 0) {
            setUnitSize(val);
        }
    };

    // Calculation Logic
    const executionData = useMemo(() => {
        if (!blend || !blend.selectedCultivars) return [];

        const totalTarget = unitSize * quantity;
        const totalRatio = blend.ratios.reduce((a, b) => a + b, 0);

        return blend.selectedCultivars.map((cultivar, idx) => {
            const ratio = blend.ratios[idx] || 0;
            const percentage = ratio / totalRatio;
            const requiredGrams = totalTarget * percentage;

            // Check inventory
            const availableStr = inventoryMap[cultivar.id] || '';
            const available = availableStr ? parseFloat(availableStr) : Infinity;

            const isInsufficient = available < requiredGrams;
            const maxPossibleUnits = availableStr
                ? Math.floor(available / (unitSize * percentage))
                : Infinity;

            return {
                id: cultivar.id,
                name: cultivar.displayName, // Or map from library if needed, but displayName usually exists
                percentage,
                requiredGrams,
                available,
                isInsufficient,
                maxPossibleUnits
            };
        });
    }, [blend, unitSize, quantity, inventoryMap, customSizeValue, isCustomSize]);

    // Aggregate Alerts
    const insufficientStrains = executionData.filter(d => d.isInsufficient);
    const maxPossibleTotal = useMemo(() => {
        if (insufficientStrains.length === 0) return null;
        return Math.min(...insufficientStrains.map(s => s.maxPossibleUnits));
    }, [insufficientStrains]);


    return (
        <div className="border-t border-white/5 bg-[#0a0b0e]">
            {/* Header / Toggle */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-4 group hover:bg-white/5 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-widest text-[#D4AF37]">Blend Execution</span>
                </div>
                <span className="text-white/40 text-[10px] font-mono group-hover:text-white/60">
                    {isExpanded ? '[-]' : '[+]'}
                </span>
            </button>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 pb-6 space-y-6">

                            {/* INPUTS ROW */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[9px] text-white/40 uppercase tracking-widest mb-2">Target Unit</label>
                                    <div className="flex gap-2">
                                        <select
                                            value={isCustomSize ? 'custom' : unitSize}
                                            onChange={(e) => handleSizeChange(e.target.value)}
                                            className="bg-[#111216] border border-white/10 text-xs text-white p-2 rounded-sm focus:border-[#D4AF37] outline-none flex-1"
                                        >
                                            {PRESET_SIZES.map(s => (
                                                <option key={s} value={s}>{s}g Cone</option>
                                            ))}
                                            <option value="custom">Custom</option>
                                        </select>

                                        {isCustomSize && (
                                            <div className="relative w-16">
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    value={customSizeValue}
                                                    onChange={(e) => {
                                                        setCustomSizeValue(e.target.value);
                                                    }}
                                                    onBlur={handleCustomSizeBlur}
                                                    className="w-full bg-[#111216] border border-white/10 text-xs text-white p-2 rounded-sm focus:border-[#D4AF37] outline-none text-right"
                                                />
                                                <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[9px] text-white/30 pointer-events-none">g</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[9px] text-white/40 uppercase tracking-widest mb-2">Quantity</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={quantity}
                                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 0))}
                                        className="w-full bg-[#111216] border border-white/10 text-xs text-white p-2 rounded-sm focus:border-[#D4AF37] outline-none"
                                    />
                                </div>
                            </div>

                            {/* RESULTS TABLE */}
                            <div className="border border-white/5 rounded-sm bg-[#111216]/50">
                                <div className="grid grid-cols-12 gap-2 p-3 border-b border-white/5 text-[9px] text-white/30 uppercase tracking-widest">
                                    <div className="col-span-5">Strain</div>
                                    <div className="col-span-3 text-right">Inventory (g)</div>
                                    <div className="col-span-4 text-right">Required</div>
                                </div>
                                <div className="divide-y divide-white/5">
                                    {executionData.map((item) => (
                                        <div key={item.id} className="grid grid-cols-12 gap-2 p-3 items-center hover:bg-white/[0.02] transition-colors relative">
                                            {/* Name */}
                                            <div className="col-span-5 text-xs text-white font-medium truncate pr-2">
                                                {item.name}
                                                <div className="text-[9px] text-white/30 font-mono">
                                                    {(item.percentage * 100).toFixed(0)}%
                                                </div>
                                            </div>

                                            {/* Inventory Input */}
                                            <div className="col-span-3">
                                                <input
                                                    type="number"
                                                    placeholder="-"
                                                    className={`
                                                        w-full bg-transparent border-b border-white/10 text-right text-xs py-1 outline-none focus:border-[#D4AF37] transition-colors
                                                        ${item.isInsufficient ? 'text-red-400 border-red-400/30' : 'text-white/60'}
                                                    `}
                                                    value={inventoryMap[item.id] || ''}
                                                    onChange={(e) => setInventoryMap(prev => ({
                                                        ...prev,
                                                        [item.id]: e.target.value
                                                    }))}
                                                />
                                            </div>

                                            {/* Required Result */}
                                            <div className="col-span-4 text-right">
                                                <div className="text-sm font-mono text-[#D4AF37] font-bold">
                                                    {item.requiredGrams.toFixed(2)}g
                                                </div>
                                                {item.isInsufficient && (
                                                    <div className="text-[9px] text-red-400 mt-1">
                                                        Max units: {item.maxPossibleUnits}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* TOTALS FOOTER */}
                                <div className="grid grid-cols-12 gap-2 p-3 border-t border-white/5 bg-white/[0.02]">
                                    <div className="col-span-8 text-right text-[9px] text-white/40 uppercase tracking-widest py-1">
                                        Total Batch Weight
                                    </div>
                                    <div className="col-span-4 text-right text-xs text-white font-mono">
                                        {(unitSize * quantity).toFixed(2)}g
                                    </div>
                                </div>
                            </div>

                            {/* WARNING ALERT */}
                            {insufficientStrains.length > 0 && (
                                <div className="p-3 border border-red-500/20 bg-red-500/10 rounded-sm flex gap-3 text-red-200 text-xs">
                                    <div className="text-lg">⚠</div>
                                    <div>
                                        <div className="font-bold mb-1">Insufficient Inventory</div>
                                        <p className="opacity-80 leading-relaxed text-[11px]">
                                            You need more material to create {quantity} units.
                                            Based on current inventory, you can produce a maximum of <span className="font-bold border-b border-red-400/30">{maxPossibleTotal} units</span>.
                                        </p>
                                    </div>
                                </div>
                            )}

                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
