
import React from 'react';
import { motion } from 'framer-motion';

export const FloatingSymbols = () => {
    const symbols = ['π', '%', '∆', '∑', '√', '∞', '≈', '×'];

    // Generate random starting positions
    const elements = Array.from({ length: 12 }, (_, i) => ({
        id: i,
        x: Math.random() * 80 - 40, // -40 to 40 offset from center
        y: Math.random() * 80 - 40,
        symbol: symbols[i % symbols.length],
        delay: Math.random() * 2
    }));

    return (
        <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center overflow-hidden">
            {elements.map((el) => (
                <motion.div
                    key={el.id}
                    className="absolute text-emerald-500/40 text-2xl font-light font-mono"
                    initial={{
                        x: el.x * 5, // Spread out pixels
                        y: el.y * 5,
                        opacity: 0,
                        scale: 0.5
                    }}
                    animate={{
                        y: [el.y * 5, el.y * 5 - 100], // Float up
                        opacity: [0, 0.8, 0],
                        scale: [0.5, 1.2, 0.8]
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: el.delay
                    }}
                >
                    {el.symbol}
                </motion.div>
            ))}
            {/* Central Pulse/Text */}
            <div className="absolute top-[60%] flex flex-col items-center">
                <motion.div
                    className="text-emerald-500/60 text-xs tracking-[0.2em] uppercase font-bold"
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                >
                    Synthesizing
                </motion.div>
            </div>
        </div>
    );
};

export default FloatingSymbols;
