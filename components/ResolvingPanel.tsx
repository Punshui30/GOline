import { useState, useEffect } from 'react';
import HexagonalProgress from './HexagonalProgress';

/**
 * ResolvingPanel - Shows during calculation phase
 * 
 * This component creates a visual pause and cognitive separation
 * between input submission and result display.
 * 
 * CRITICAL: Must be visually undeniable - different background,
 * centered content, removes input entirely.
 */

export default function ResolvingPanel() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Linear, deterministic timing for the progress indicator
    // Targets ~1.5s total duration (matching sandbox simulation)
    const startTime = Date.now();
    const duration = 1500;

    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min(100, (elapsed / duration) * 100);
      setProgress(newProgress);

      if (newProgress < 100) {
        requestAnimationFrame(updateProgress);
      }
    };

    const animationId = requestAnimationFrame(updateProgress);
    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <div className="flex items-center justify-center min-h-[70vh] w-full">
      <div className="text-center space-y-8 flex flex-col items-center">
        <div className="text-xl lg:text-2xl font-sans text-white font-medium tracking-tight">Calculating your outcome</div>

        {/* Drop-in replacement for progress visualization */}
        <HexagonalProgress value={progress} size={120} color="#d4a259" />

        <div className="text-[10px] uppercase tracking-[0.3em] text-white/30 font-bold">
          Synthesizing Lab Vectors
        </div>
      </div>
    </div>
  );
}



