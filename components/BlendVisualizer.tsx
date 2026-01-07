'use client';

import { useEffect, useState } from 'react';
import { ResolvedBlend, getRoleDisplayName } from './ResolutionPanel';

interface BlendVisualizerProps {
    blend: ResolvedBlend;
}

export default function BlendVisualizer({ blend }: BlendVisualizerProps) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // Subtle fade-in animation
        const timer = setTimeout(() => setVisible(true), 50);
        return () => clearTimeout(timer);
    }, [blend]);

    // Sort by percentage descent for visual hierarchy
    // (Optional: keep original order if semantic, but visual sorting often looks better)
    // Spec Compliance: Do not reorder for aesthetics. Render exactly as derived.
    const sortedStrains = blend.primaryBlend;

    return (
        <div className="w-full mb-16 overflow-visible">
            <div className="flex flex-col gap-1">
                {sortedStrains.map((strain, index) => (
                    <div
                        key={strain.id || index}
                        className="relative h-20 lg:h-28 w-full flex items-center mb-2"
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
                h-full bg-zinc-900 border-l border-[#C5A065] relative overflow-visible
                transition-all duration-500 ease-out
              `}
                            style={{
                                width: `${strain.percentage}%`,
                                opacity: visible ? 1 : 0,
                                transitionDelay: `${index * 100}ms`,
                                minWidth: '80px'
                            }}
                        >
                            {/* Blend Ratio Label - Always visible and clearly labeled */}
                            {strain.percentage >= 10 && (
                              <span className={`
                  absolute top-2 left-3 text-xs font-sans font-medium text-white select-none
                  transition-opacity duration-500 whitespace-nowrap z-10
                  ${visible ? 'opacity-100' : 'opacity-0'}
                `} style={{ transitionDelay: `${(index * 100) + 300}ms` }}>
                                  Blend Ratio: {Math.round(strain.percentage)}%
                              </span>
                            )}
                        </div>

                        {/* 
              Labeling (Outside the bar for clarity) 
              Fades in after bars settle
            */}
                        <div
                            className={`
                ml-6 flex flex-col justify-center min-w-0 flex-1
                transition-opacity duration-500
              `}
                            style={{
                                opacity: visible ? 1 : 0,
                                transitionDelay: `${(index * 100) + 400}ms`
                            }}
                        >
                            <div className="flex items-baseline gap-3 mb-1">
                              <span className="text-xs font-sans font-medium uppercase tracking-wider text-zinc-400">
                                  {getRoleDisplayName(strain.role)}
                              </span>
                              {/* Show percentage here if bar is too small */}
                              {strain.percentage < 10 && (
                                <span className="text-xs font-sans font-medium text-white">
                                  Blend Ratio: {Math.round(strain.percentage)}%
                                </span>
                              )}
                            </div>
                            <span className="text-xl lg:text-3xl font-serif font-light text-white leading-tight">
                                {strain.name}
                            </span>
                        </div>

                    </div>
                ))}
            </div>
        </div>
    );
}
