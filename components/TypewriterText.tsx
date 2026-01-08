'use client';

import { useEffect, useState } from 'react';

type Props = {
  text: string;
  speed?: number;
  onComplete?: () => void;
};

/**
 * TypewriterText Component
 * 
 * Renders text progressively using safe slice-based reveal to create a typewriter effect.
 * Used for LLM-generated explanations and instructions to make them feel alive and intentional.
 */
export default function TypewriterText({ text, speed = 20, onComplete }: Props) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(0);

    if (!text) return;

    const interval = setInterval(() => {
      setCount(prev => {
        if (prev >= text.length) {
          clearInterval(interval);
          if (onComplete) {
            onComplete();
          }
          return prev;
        }
        return prev + 1;
      });
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed, onComplete]);

  return (
    <p className="whitespace-pre-line">
      {text.slice(0, count)}
    </p>
  );
}

