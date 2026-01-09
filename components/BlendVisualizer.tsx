'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ResolvedBlend, getRoleDisplayName } from './ResolutionPanel';

interface BlendVisualizerProps {
    blend: ResolvedBlend;
    isAnimating?: boolean;
    mode?: 'blend' | 'stack';
}

// Role-based functional colors
const ROLE_COLORS = {
    // Legacy support
    driver: "#D4AF37",
    modulator: "#94A3B8",
    anchor: "#4A5D23",
    // Strict roles
    primary: "#D4AF37",
    secondary: "#94A3B8",
    supporting: "#4A5D23",
    // Fallback
    corrective: "#94A3B8"
};

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;

    return {
        x: centerX + (radius * Math.cos(angleInRadians)),
        y: centerY + (radius * Math.sin(angleInRadians))
    };
}

function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number) {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);

    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

    const d = [
        "M", start.x, start.y,
        "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
    ].join(" ");

    return d;
}

export default function BlendVisualizer({ blend, isAnimating = true, mode = 'blend' }: BlendVisualizerProps) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        setVisible(false);
        const timer = setTimeout(() => setVisible(true), 100);
        return () => clearTimeout(timer);
    }, [blend]);

    const sortedStrains = blend.primaryBlend;
    const isStack = mode === 'stack';

    // Radial Calculation
    let currentAngle = 0;
    const segments = sortedStrains.map((strain) => {
        const percentage = strain.percentage;
        const angle = (percentage / 100) * 360;
        const startAngle = currentAngle;
        const endAngle = currentAngle + angle;
        currentAngle += angle;

        // Normalize role to lowercase for color mapping if type mismatch
        const roleKey = (strain.role || 'driver').toLowerCase() as keyof typeof ROLE_COLORS;
        const color = ROLE_COLORS[roleKey] || ROLE_COLORS.driver;
        const dominance = Math.max(0.4, percentage / 100); // Minimum opacity 0.4 for visibility

        return {
            ...strain,
            startAngle,
            endAngle,
            color,
            dominance
        };
    });

    // Determine Blend Name safely
    const label = blend.rationaleSummary;

    return (
        <div className="w-full flex justify-center items-center min-h-[300px]">
            {isStack ? (
                // Stack Mode: Vertical Sequence with preserved logic
                <div className="flex flex-col w-full gap-4 relative max-w-2xl">
                    {/* Connecting Line */}
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
                            <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono border bg-nearblack border-go-border text-white">
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
            ) : (
                // RADIAL MODE (SVG)
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: visible ? 1 : 0, scale: visible ? 1 : 0.95 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="relative w-[300px] h-[300px] lg:w-[400px] lg:h-[400px]"
                >
                    <svg
                        viewBox="0 0 400 400"
                        className="w-full h-full drop-shadow-2xl"
                        style={{ overflow: 'visible' }}
                    >
                        <defs>
                            <filter id="softGlow">
                                <feGaussianBlur stdDeviation="4" result="blur" />
                                <feMerge>
                                    <feMergeNode in="blur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                        </defs>

                        {/* Contribution Ring */}
                        <g transform="translate(0, 0)">
                            {/* SVG coordinates are 0-400, center is 200,200 */}
                            {segments.map((seg, i) => (
                                <g key={seg.id || i}>
                                    <path
                                        d={describeArc(200, 200, 140, seg.startAngle, seg.endAngle - 2)} // -2 for small gap between segments
                                        fill="none"
                                        stroke={seg.color}
                                        strokeWidth={28}
                                        strokeLinecap="round"
                                        filter="url(#softGlow)"
                                        opacity={0.9}
                                    />
                                    {/* Optional: Add percentage label near segment? Only if large enough */}
                                    {seg.percentage > 15 && (
                                        <text
                                            x={polarToCartesian(200, 200, 175, seg.startAngle + (seg.endAngle - seg.startAngle) / 2).x}
                                            y={polarToCartesian(200, 200, 175, seg.startAngle + (seg.endAngle - seg.startAngle) / 2).y}
                                            textAnchor="middle"
                                            dominantBaseline="middle"
                                            fill="white"
                                            fontSize="14"
                                            className="font-mono opacity-80"
                                        >
                                            {Math.round(seg.percentage)}%
                                        </text>
                                    )}
                                </g>
                            ))}
                        </g>

                        {/* Inner Field */}
                        <circle
                            cx="200"
                            cy="200"
                            r="90"
                            fill="rgba(255,255,255,0.02)"
                            stroke="rgba(255,255,255,0.1)"
                            strokeWidth="1"
                        />

                        {/* Label - Center */}
                        <foreignObject x="110" y="110" width="180" height="180">
                            <div className="w-full h-full flex flex-col items-center justify-center text-center p-2">
                                <span className="text-xs uppercase tracking-widest text-[#94A3B8] mb-2 block">
                                    Blend ID
                                </span>
                                <h3 className="text-xl lg:text-2xl font-serif text-[#E2E8F0] leading-tight">
                                    {label}
                                </h3>
                            </div>
                        </foreignObject>
                    </svg>
                </motion.div>
            )}
        </div>
    );
}
