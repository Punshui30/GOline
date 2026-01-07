'use client';

import { useEffect, useState } from 'react';
import { ResolvedBlend } from './ResolutionPanel';

interface BlendVisualizerProps {
    blend: ResolvedBlend;
}

export default function BlendVisualizer({ blend }: BlendVisualizerProps) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // Trigger animation on mount
        const timer = setTimeout(() => setVisible(true), 100);
        return () => clearTimeout(timer); // Cleanup
    }, [blend]); // Re-run if blend changes

    // Sort by percentage descent for visual hierarchy
    // (Optional: keep original order if semantic, but visual sorting often looks better)
    const sortedStrains = [...blend.primaryBlend].sort((a, b) => b.percentage - a.percentage);

    return (
        <div className="w-full mb-16 overflow-hidden">
            <div className="flex flex-col gap-1">
                {sortedStrains.map((strain, index) => (
                    <div
                        key={strain.id || index}
                        className="relative h-16 lg:h-24 w-full flex items-center"
                    >
                        {/* 
              Background/Context Track (Subtle) 
              Acts as the "Grid" line 
            */}
                        <div className="absolute inset-0 border-b border-white/5" />

                        {/* 
              The Bar / Visual Block 
              - Proportional Width: Based on percentage
              - Entry Animation: Slide in from right (Swiss modernist motion)
              - Delays: Staggered by index
            */}
                        <div
                            className={`
                h-full bg-zinc-900 border-l-2 border-[#D6A84A] relative overflow-hidden
                transition-all duration-1000 cubic-bezier(0.2, 0.8, 0.2, 1)
              `}
                            style={{
                                width: `${strain.percentage}%`,
                                transform: visible ? 'translateX(0%)' : 'translateX(100%)',
                                opacity: visible ? 1 : 0,
                                transitionDelay: `${index * 150}ms`
                            }}
                        >
                            {/* Texture/Noise overlay for depth (optional) */}
                            <div className="absolute inset-0 opacity-20 bg-[url('/noise.png')] mix-blend-overlay" />

                            {/* Percentage Label inside the bar (Swiss Typography) */}
                            <span className={`
                absolute bottom-2 right-4 text-[4rem] leading-none font-bold text-white/5 select-none
                transition-opacity duration-1000 delay-500
                ${visible ? 'opacity-100' : 'opacity-0'}
              `}>
                                {Math.round(strain.percentage)}
                            </span>
                        </div>

                        {/* 
              Labeling (Outside the bar for clarity) 
              Fades in after bars settle
            */}
                        <div
                            className={`
                ml-6 flex flex-col justify-center
                transition-all duration-1000
              `}
                            style={{
                                opacity: visible ? 1 : 0,
                                transform: visible ? 'translateX(0)' : 'translateX(20px)',
                                transitionDelay: `${(index * 150) + 600}ms`
                            }}
                        >
                            <span className="text-xs font-bold uppercase tracking-widest text-[#D6A84A]">
                                {strain.role}
                            </span>
                            <span className="text-xl lg:text-3xl font-light text-white leading-tight">
                                {strain.name}
                            </span>
                        </div>

                    </div>
                ))}
            </div>
        </div>
    );
}
