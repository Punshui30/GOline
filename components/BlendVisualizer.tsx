'use client';

import { useEffect, useState } from 'react';
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
                // Single cultivar: full-height single segment
                <div className="relative h-32 lg:h-40 w-full flex items-center justify-center border border-[#C5A065] bg-zinc-900">
                    <div className="text-center">
                        <div className={`font-serif font-light text-white ${getPercentageTextSize(100)} mb-2`}>
                            100%
                        </div>
                        <div className="text-sm font-sans text-zinc-400 uppercase tracking-wider mb-1">
                            {getRoleDisplayName(sortedStrains[0].role)}
                        </div>
                        <div className="text-xl lg:text-3xl font-serif font-light text-white">
                            {sortedStrains[0].name}
                        </div>
                    </div>
                </div>
            ) : (
                // Multiple cultivars: proportional visualization
                <div className="flex h-24 lg:h-32 w-full border border-zinc-800 overflow-hidden">
                    {sortedStrains.map((strain, index) => {
                        const animatedWidth = animatedPercentages[strain.id || index] || 0;
                        const displayWidth = isAnimating ? animatedWidth : strain.percentage;
                        
                        return (
                            <div
                                key={strain.id || index}
                                className="relative h-full flex items-center justify-center border-r border-zinc-800 last:border-r-0 bg-zinc-900 transition-all duration-300"
                                style={{
                                    width: `${displayWidth}%`,
                                    minWidth: displayWidth > 0 ? '60px' : '0px',
                                    opacity: visible && displayWidth > 0 ? 1 : 0,
                                }}
                            >
                                {/* Percentage text - scales with ratio */}
                                {displayWidth >= 5 && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className={`font-serif font-light text-white ${getPercentageTextSize(strain.percentage)}`}>
                                            {Math.round(strain.percentage)}%
                                        </span>
                                    </div>
                                )}
                                
                                {/* Label overlay - appears after animation */}
                                {displayWidth >= 10 && visible && (
                                    <div className="absolute bottom-2 left-2 right-2 text-center">
                                        <div className="text-[10px] font-sans font-medium uppercase tracking-wider text-zinc-400 mb-1 truncate">
                                            {getRoleDisplayName(strain.role)}
                                        </div>
                                        <div className="text-sm lg:text-base font-serif font-light text-white truncate">
                                            {strain.name}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
            
            {/* Labels for small segments */}
            {!isSingleCultivar && (
                <div className="mt-4 space-y-2">
                    {sortedStrains.map((strain, index) => {
                        const animatedWidth = animatedPercentages[strain.id || index] || 0;
                        const displayWidth = isAnimating ? animatedWidth : strain.percentage;
                        
                        if (displayWidth < 10) {
                            return (
                                <div key={strain.id || index} className="flex items-center gap-3 text-sm">
                                    <span className="text-zinc-400 font-sans uppercase tracking-wider">
                                        {getRoleDisplayName(strain.role)}:
                                    </span>
                                    <span className="text-white font-serif">
                                        {strain.name}
                                    </span>
                                    <span className="text-zinc-500 font-mono">
                                        {Math.round(strain.percentage)}%
                                    </span>
                                </div>
                            );
                        }
                        return null;
                    })}
                </div>
            )}
        </div>
    );
}
