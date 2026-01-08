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
 * Renders text progressively character-by-character to create a typewriter effect.
 * Used for LLM-generated explanations and instructions to make them feel alive and intentional.
 */
export default function TypewriterText({ text, speed = 20, onComplete }: Props) {
  const [visible, setVisible] = useState('');

  useEffect(() => {
    if (!text) {
      setVisible('');
      return;
    }

    setVisible('');
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        setVisible(prev => prev + text[i]);
        i++;
      } else {
        clearInterval(interval);
        if (onComplete) {
          onComplete();
        }
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed, onComplete]);

  return <p className="whitespace-pre-line">{visible}</p>;
}

