'use client';

import { motion } from 'framer-motion';
import type { ResolvedBlend } from '@/components/ResolutionPanel';
import type { BlendCandidate } from '@/lib/engine_core/legacy_compat';

interface RadialBlendHUDProps {
    blend: ResolvedBlend | BlendCandidate;
}

// Polar to Cartesian Helper
function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
    var angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
        x: centerX + (radius * Math.cos(angleInRadians)),
        y: centerY + (radius * Math.sin(angleInRadians))
    };
}

// SVG Arc Path Helper
function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number) {
    var start = polarToCartesian(x, y, radius, endAngle);
    var end = polarToCartesian(x, y, radius, startAngle);
    var largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

    var d = [
        "M", start.x, start.y,
        "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
    ].join(" ");

    return d;
}

export default function RadialBlendHUD({ blend }: RadialBlendHUDProps) {
    // Config
    const size = 600;
    const center = size / 2;
    const radius = 200;
    const strokeWidth = 12; // Thin, technical

    // Data Mapping
    const strains = 'selectedCultivars' in blend
        ? blend.selectedCultivars.map((c, i) => ({
            id: c.id,
            name: c.displayName,
            role: c.role,
            percentage: blend.ratios?.[i] || 0
        }))
        : blend.primaryBlend;
    // Calculate start/end angles based on ratio (percentage of 360)
    let currentAngle = 0;

    const arcs = strains.map(strain => {
        // ratio is out of 100 usually
        const ratio = strain.percentage / 100;
        const sweep = ratio * 360;
        const start = currentAngle;
        const end = currentAngle + sweep - 4; // Gap of 4 degrees
        currentAngle += sweep;

        const isPrimary = strain.role === 'primary' || strain.role === 'driver';

        return {
            ...strain,
            path: describeArc(center, center, radius, start, end),
            color: isPrimary ? '#FFD700' : 'rgba(255,255,255,0.4)', // Amber vs Dim
            glow: isPrimary ? 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.5))' : 'none',
            opacity: isPrimary ? 1 : 0.6
        };
    });

    return (
        <div className="relative flex items-center justify-center select-none" style={{ width: size, height: size }}>

            {/* 1. Inner Field (Unification Zone) */}
            <div
                className="absolute rounded-full pointer-events-none"
                style={{
                    width: radius * 1.5,
                    height: radius * 1.5,
                    background: 'radial-gradient(circle, rgba(255,215,0,0.05) 0%, rgba(0,0,0,0) 70%)',
                    backdropFilter: 'blur(2px)'
                }}
            >
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay animate-pulse" />
            </div>

            {/* 2. SVG Rings */}
            <svg width={size} height={size} className="absolute inset-0 rotate-180">
                {/* Rotate 180 to start from top? Actually -90 offset in helper works. */}
                {arcs.map((arc, i) => (
                    <motion.path
                        key={i}
                        d={arc.path}
                        fill="none"
                        stroke={arc.color}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        style={{ filter: arc.glow, opacity: arc.opacity }}
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: arc.opacity }}
                        transition={{ duration: 1.5, delay: 0.5 + (i * 0.2), ease: "circOut" }}
                    />
                ))}

                {/* Decor: Thin track ring */}
                <circle cx={center} cy={center} r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
                <circle cx={center} cy={center} r={radius - 20} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth={1} strokeDasharray="4 4" />
            </svg>

            {/* 3. Center Label */}
            <motion.div
                className="absolute text-center z-10"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.5, duration: 1 }}
            >
                <div className="text-[10px] text-amber tracking-[0.3em] font-bold uppercase mb-2">Resolved Blend</div>
                <h2 className="text-3xl font-light text-white tracking-widest uppercase">
                    {strains[0].name.split(' ')[0]}
                    <span className="text-white/30 text-lg align-top ml-1">+</span>
                </h2>
                {/* No percentages here, just identity */}
            </motion.div>

            {/* 4. Floating Labels (Optional, if we want them near arcs) */}
            {/* For now keeping it clean as per "Readout" mental model. 
          Detailed breakdown is in the tiles below/beside. */}

        </div>
    );
}
