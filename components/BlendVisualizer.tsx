'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ResolvedBlend, getRoleDisplayName } from './ResolutionPanel';

interface BlendVisualizerProps {
    blend: ResolvedBlend;
    isAnimating?: boolean;
    mode?: 'blend' | 'stack';
}

export default function BlendVisualizer({ blend, isAnimating = true, mode = 'blend' }: BlendVisualizerProps) {
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
        <div className="w-full mb-12 overflow-visible">
            {mode === 'stack' ? (
                // Stack Mode: Vertical Sequence
                <div className="flex flex-col w-full gap-4 relative">
                    {/* Connecting Line running through background */}
                    {sortedStrains.length > 1 && (
                        <div className="absolute left-8 top-8 bottom-8 w-px bg-go-border z-0 hidden lg:block" />
                    )}

                    {sortedStrains.map((strain, index) => (
                        <motion.div
                            key={strain.id || index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: visible ? 1 : 0, x: visible ? 0 : -20 }}
                            transition={{ delay: index * 0.15 }}
                            className="relative z-10 flex items-center gap-6 p-4 bg-glass border border-go rounded-xl"
                        >
                            {/* Seq Number */}
                            <div
                                className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono border bg-nearblack"
                                style={{ borderColor: getPercentageTextSize(strain.percentage).includes('text-4') ? '#D4AF37' : '#94A3B8' }} // Approximate color logic
                            >
                                {index + 1}
                            </div>

                            <div className="flex-1">
                                <div className="flex items-baseline justify-between mb-1">
                                    <h4 className="text-lg font-serif text-white">{strain.name}</h4>
                                    <span className="text-xl font-light text-energy">{Math.round(strain.percentage)}%</span>
                                </div>
                                <div className="text-xs uppercase tracking-wider text-go-subtle">{getRoleDisplayName(strain.role)}</div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            ) : isSingleCultivar ? (
                // Single cultivar: card with vertical flex stack
                <div className="w-full border border-energy bg-bg-glass p-8 lg:p-10 rounded-2xl shadow-amber-md">
                    <div className="flex flex-col gap-4 items-center text-center">
                        <div className={`font-serif font-light text-energy ${getPercentageTextSize(100)}`}>
                            100%
                        </div>
                        <div className="text-sm font-sans text-go-muted uppercase tracking-wider">
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
                // BLEND Mode: Proportional Bar (Concurrent/Simultaneous)
                <div className="flex w-full border border-go min-h-[140px] lg:min-h-[160px] items-stretch overflow-hidden rounded-2xl shadow-lg">
                    {sortedStrains.map((strain, index) => {
                        const animatedWidth = animatedPercentages[strain.id || index] || 0;
                        const displayWidth = isAnimating ? animatedWidth : strain.percentage;

                        return (
                            <div
                                key={strain.id || index}
                                className="flex flex-col justify-center items-center border-r border-go-border last:border-r-0 bg-glass transition-all duration-300 p-5 lg:p-6 backdrop-blur-md"
                                style={{
                                    width: `${displayWidth}%`,
                                    minWidth: displayWidth > 0 ? (sortedStrains.length > 3 ? '100px' : '120px') : '0px',
                                    opacity: visible && displayWidth > 0 ? 1 : 0,
                                }}
                            >
                                {/* Vertical flex stack: percentage (most prominent), role, name */}
                                <div className="flex flex-col gap-3 items-center text-center">
                                    <div className={`font-serif font-light ${getPercentageTextSize(strain.percentage)} leading-tight ${
                                        // Use accent color for dominant contributor (highest percentage)
                                        strain.percentage === Math.max(...sortedStrains.map(s => s.percentage))
                                            ? 'text-energy'
                                            : 'text-white'
                                        }`}>
                                        {Math.round(strain.percentage)}%
                                    </div>
                                    <div className="text-[10px] font-sans font-medium uppercase tracking-wider text-go-subtle">
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
                                        className="text-sm lg:text-base font-serif font-light text-white break-words px-2"
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
