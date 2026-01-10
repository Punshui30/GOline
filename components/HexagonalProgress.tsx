'use client';

import React, { useMemo } from 'react';

interface HexagonalProgressProps {
    value: number; // 0 to 100
    size?: number;
    color?: string;
    strokeWidth?: number;
}

/**
 * HexagonalProgress - Scientific Progress Indicator
 * 
 * STRICT REQUIREMENTS:
 * - Sequential edge-by-edge stroke drawing (6 segments)
 * - Linear, deterministic timing
 * - Subtle glow ONLY at the active drawing endpoint
 * - Gold accent color #d4a259
 */
export default function HexagonalProgress({
    value = 0,
    size = 120,
    color = '#d4a259',
    strokeWidth = 2
}: HexagonalProgressProps) {
    const normalizedValue = Math.min(100, Math.max(0, value));

    // Hexagon Geometry (Pointy-topped)
    // We want the hexagon centered in a square viewBox of 100x100 for easy scaling
    const center = 50;
    const r = 45; // Leave room for stroke and glow

    // Points of a regular hexagon (Pointy-topped)
    const points = useMemo(() => {
        const pts = [];
        for (let i = 0; i <= 6; i++) {
            // -90 degrees to start at the top
            const angleDeg = 60 * i - 90;
            const angleRad = (Math.PI / 180) * angleDeg;
            pts.push({
                x: center + r * Math.cos(angleRad),
                y: center + r * Math.sin(angleRad)
            });
        }
        return pts;
    }, [r, center]);

    // Create path data from points
    const pathData = useMemo(() => {
        return `M ${points[0].x} ${points[0].y} ` +
            points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
    }, [points]);

    // Calculate total length (6 edges)
    // Each edge length = r (for a regular hexagon)
    const totalLength = 6 * r;
    const progressLength = (normalizedValue / 100) * totalLength;

    // Active endpoint for the glow
    // We need to find which segment we are on and where in that segment
    const getGlowPosition = () => {
        if (normalizedValue <= 0) return null;
        if (normalizedValue >= 100) return null;

        const segmentLength = r;
        const currentProgress = (normalizedValue / 100) * 6; // float from 0 to 6
        const segmentIndex = Math.floor(currentProgress);
        const segmentProgress = currentProgress - segmentIndex;

        const pStart = points[segmentIndex];
        const pEnd = points[segmentIndex + 1] || points[0];

        return {
            x: pStart.x + (pEnd.x - pStart.x) * segmentProgress,
            y: pStart.y + (pEnd.y - pStart.y) * segmentProgress
        };
    };

    const glowPos = getGlowPosition();

    return (
        <div
            className="relative inline-block"
            style={{ width: size, height: size }}
        >
            <svg
                viewBox="0 0 100 100"
                className="w-full h-full -rotate-0"
                xmlns="http://www.w3.org/2000/svg"
            >
                {/* Track (Very subtle) */}
                <path
                    d={pathData}
                    fill="none"
                    stroke="rgba(212, 162, 89, 0.05)"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* Dynamic Progress Stroke */}
                <path
                    d={pathData}
                    fill="none"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                        strokeDasharray: totalLength,
                        strokeDashoffset: totalLength - progressLength,
                        transition: 'stroke-dashoffset 0.1s linear' // Linear, deterministic
                    }}
                />

                {/* Endpoint Glow */}
                {glowPos && (
                    <g>
                        {/* The core glow point */}
                        <circle
                            cx={glowPos.x}
                            cy={glowPos.y}
                            r={1.5}
                            fill={color}
                            filter="blur(1px)"
                        />
                        {/* Larger subtle halo */}
                        <circle
                            cx={glowPos.x}
                            cy={glowPos.y}
                            r={4}
                            fill={color}
                            className="opacity-40"
                            filter="blur(3px)"
                        />
                    </g>
                )}
            </svg>
        </div>
    );
}
