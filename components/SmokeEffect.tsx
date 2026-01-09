
import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export const SmokeEffect = () => {
    return (
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden flex items-center justify-center">
            {/* Container aligned to center */}
            <div className="relative w-full h-full max-w-[600px] max-h-[600px] flex items-center justify-center">
                {/* Multiple smoke layers */}
                <SmokePuff delay={0} scale={1} x={0} />
                <SmokePuff delay={0.5} scale={1.2} x={-20} />
                <SmokePuff delay={1.2} scale={0.8} x={30} />
                <SmokePuff delay={2.0} scale={1.5} x={10} />
            </div>
        </div>
    );
};

const SmokePuff = ({ delay, scale, x }: { delay: number; scale: number; x: number }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.5, filter: 'blur(20px)' }}
            animate={{
                opacity: [0, 0.4, 0],
                y: -300,
                scale: scale * 2,
                filter: ['blur(20px)', 'blur(40px)', 'blur(60px)']
            }}
            transition={{
                duration: 8,
                ease: "easeOut",
                delay: delay,
                repeat: 0 // Play once per cycle logic, handled by parent if needed reset, but user asked for "after circle takes shape"
            }}
            className="absolute w-64 h-64 rounded-full bg-gradient-to-t from-gray-500/20 to-gray-400/5 mix-blend-screen"
            style={{ left: `calc(50% + ${x}px)`, top: '60%' }}
        />
    );
};

export default SmokeEffect;
