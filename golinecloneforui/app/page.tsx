'use client';
import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import InputPhase from '@/components/InputPhase';
import ResolvingPhase from '@/components/ResolvingPhase';
import ResultPhase from '@/components/ResultPhase';

export default function Home() {
  const [phase, setPhase] = useState<'input' | 'resolving' | 'result'>('input');

  const handleResolve = () => {
    setPhase('resolving');
    setTimeout(() => {
      setPhase('result');
    }, 1200);
  };

  return (
    <main className="flex-1 flex flex-col h-full bg-[#111111]">
      <header className="fixed top-0 left-0 right-0 h-20 flex items-center justify-center border-b border-white/5 bg-[#111111]/80 backdrop-blur-md z-50">
        <h1 className="font-serif text-gold-gradient text-2xl tracking-wide">GOline</h1>
      </header>

      <div className="flex-1 overflow-y-auto pt-20 pb-10 px-4 min-h-0 flex flex-col items-center justify-center">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            {phase === 'input' && <InputPhase onResolve={handleResolve} key="input" />}
            {phase === 'resolving' && <ResolvingPhase key="resolving" />}
            {phase === 'result' && <ResultPhase key="result" />}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
