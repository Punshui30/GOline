'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ResolvedBlend, getRoleDisplayName } from './ResolutionPanel';

interface BlendVisualizerProps {
    blend: ResolvedBlend;
    isAnimating?: boolean;
}

export default function BlendVisualizer({ blend, isAnimating = true }: BlendVisualizerProps) {
    const [animatedPercentages, setAnimatedPercentages] = useState<Record<string, number>>({});
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // Reset animation state when blend changes
        setVisible(false);
        setAnimatedPercentages({});
        
        if (isAnimating) {
            // Start animation sequence
            const timer = setTimeout(() => {
                setVisible(true);
                
                // Animate each cultivar sequentially
                blend.primaryBlend.forEach((strain, index) => {
                    setTimeout(() => {
                        setAnimatedPercentages(prev => ({
                            ...prev,
                            [strain.id || index]: 0
                        }));
                        
                        // Animate from 0 to target percentage over 600ms
                        const startTime = Date.now();
                        const duration = 600;
                        const target = strain.percentage;
                        
                        const animate = () => {
                            const elapsed = Date.now() - startTime;
                            const progress = Math.min(elapsed / duration, 1);
                            // Ease-out curve
                            const eased = 1 - Math.pow(1 - progress, 3);
                            const current = target * eased;
                            
                            setAnimatedPercentages(prev => ({
                                ...prev,
                                [strain.id || index]: current
                            }));
                            
                            if (progress < 1) {
                                requestAnimationFrame(animate);
                            }
                        };
                        
                        requestAnimationFrame(animate);
                    }, index * 150); // Stagger by 150ms
                });
            }, 100);
            
            return () => clearTimeout(timer);
        } else {
            // Instant render if not animating
            setVisible(true);
            const instant: Record<string, number> = {};
            blend.primaryBlend.forEach((strain, index) => {
                instant[strain.id || index] = strain.percentage;
            });
            setAnimatedPercentages(instant);
        }
    }, [blend, isAnimating]);

    const sortedStrains = blend.primaryBlend;
    const isSingleCultivar = sortedStrains.length === 1;

    // Calculate text size based on percentage (larger % → larger text)
    const getPercentageTextSize = (percentage: number): string => {
        if (percentage >= 50) return 'text-4xl lg:text-5xl';
        if (percentage >= 30) return 'text-3xl lg:text-4xl';
        if (percentage >= 15) return 'text-2xl lg:text-3xl';
        return 'text-xl lg:text-2xl';
    };

    return (
        <div className="w-full mb-16 overflow-visible">
            {isSingleCultivar ? (
                // Single cultivar: card with vertical flex stack
                <div className="w-full border border-[#C5A065] bg-zinc-900 p-6">
                    <div className="flex flex-col gap-3 items-center text-center">
                        <div className={`font-serif font-light text-white ${getPercentageTextSize(100)}`}>
                            100%
                        </div>
                        <div className="text-sm font-sans text-zinc-400 uppercase tracking-wider">
                            {getRoleDisplayName(sortedStrains[0].role)}
                        </div>
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ 
                                delay: 0.3,
                                duration: 0.4,
                                ease: 'easeOut'
                            }}
                            className="text-xl lg:text-3xl font-serif font-light text-white"
                        >
                            {sortedStrains[0].name}
                        </motion.div>
                    </div>
                </div>
            ) : (
                // Multiple cultivars: proportional visualization with cards
                <div className="flex w-full border border-zinc-800 min-h-[120px] items-stretch">
                    {sortedStrains.map((strain, index) => {
                        const animatedWidth = animatedPercentages[strain.id || index] || 0;
                        const displayWidth = isAnimating ? animatedWidth : strain.percentage;
                        
                        return (
                            <div
                                key={strain.id || index}
                                className="flex flex-col justify-center items-center border-r border-zinc-800 last:border-r-0 bg-zinc-900 transition-all duration-300 p-4"
                                style={{
                                    width: `${displayWidth}%`,
                                    minWidth: displayWidth > 0 ? '120px' : '0px',
                                    opacity: visible && displayWidth > 0 ? 1 : 0,
                                }}
                            >
                                {/* Vertical flex stack: percentage, role, name */}
                                <div className="flex flex-col gap-2 items-center text-center">
                                    <div className={`font-serif font-light text-white ${getPercentageTextSize(strain.percentage)}`}>
                                        {Math.round(strain.percentage)}%
                                    </div>
                                    <div className="text-[10px] font-sans font-medium uppercase tracking-wider text-zinc-400">
                                        {getRoleDisplayName(strain.role)}
                                    </div>
                                    <motion.div
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ 
                                            delay: index * 0.15 + 0.2,
                                            duration: 0.4,
                                            ease: 'easeOut'
                                        }}
                                        className="text-sm lg:text-base font-serif font-light text-white break-words"
                                    >
                                        {strain.name}
                                    </motion.div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
