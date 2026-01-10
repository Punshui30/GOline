'use client';

import { motion } from 'framer-motion';
import type { ResolvedBlend } from '@/components/ResolutionPanel';
import type { BlendCandidate, OutcomeIntent } from '@/lib/engine_core/legacy_compat';
import { generateBlendName } from '@/lib/blendNaming';

interface RadialBlendHUDProps {
    blend: ResolvedBlend | BlendCandidate;
    intent?: OutcomeIntent;
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

export default function RadialBlendHUD({ blend, intent }: RadialBlendHUDProps) {
    // Config
    const size = 600;
    const center = size / 2;
    const radius = 200;
    const strokeWidth = 12; // Thin, technical

    // Data Mapping
    let strains: { id: string; name: string; role: string; percentage: number }[] = [];

    // Safe Type Guard
    if ('metrics' in blend) {
        // BlendCandidate (Strict Engine Output format)
        strains = blend.cultivars.map((c, i) => ({
            id: c.id,
            name: c.name,
            role: i === 0 ? 'primary' : i === 1 ? 'secondary' : 'tertiary',
            percentage: c.ratio * 100
        }));
    } else if ('primaryBlend' in blend) {
        // ResolvedBlend (UI format)
        strains = blend.primaryBlend.map((c, i) => ({
            id: c.id,
            name: c.name,
            role: c.role,
            percentage: c.percentage
        }));
    } else {
        // Fallback / Empty
        strains = [];
    }

    // Calculate start/end angles based on ratio (percentage of 360)
    let currentAngle = 0;

    // Ordered colors per spec: Primary (Gold), Secondary (Gray), Tertiary (Amber)
    const COLORS = ['#FFD700', '#808080', '#9F8C56'];
    const GLOWS = [
        'drop-shadow(0 0 10px rgba(255, 215, 0, 0.5))', // Gold Glow
        'none',                                         // Gray (Matte)
        'drop-shadow(0 0 5px rgba(159, 140, 86, 0.3))'  // Amber (Subtle)
    ];

    const arcs = strains.map((strain, i) => {
        // ratio is out of 100 usually
        const ratio = strain.percentage / 100;
        const sweep = ratio * 360;
        const start = currentAngle;
        const end = currentAngle + sweep - 4; // Gap of 4 degrees
        currentAngle += sweep;

        // Visual properties based on index
        const color = COLORS[i] || '#444';
        const glow = GLOWS[i] || 'none';
        const opacity = i === 1 ? 0.5 : 1.0; // Muted gray secondary

        return {
            ...strain,
            path: describeArc(center, center, radius, start, end),
            color,
            glow,
            opacity
        };
    });

    // Label Logic
    const blendName = (strains.length > 1 && intent)
        ? generateBlendName(intent) // Deterministic name
        : (strains[0]?.name.split(' ')[0] || "Unknown"); // Single strain fallback

    const subLabel = strains.length > 1 ? "Resolved Blend" : "Single Cultivar";

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
                <div className="text-[10px] text-amber tracking-[0.3em] font-bold uppercase mb-2">{subLabel}</div>
                <h2 className="text-3xl font-light text-white tracking-widest uppercase px-4 leading-tight">
                    {blendName}
                </h2>
            </motion.div>

        </div>
    );
}
