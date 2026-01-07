'use client';

import { useEffect, useRef } from 'react';

interface OutcomeIntentInputProps {
  value: string;
  placeholder?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

export default function OutcomeIntentInput({
  value,
  placeholder = 'Describe how you want to feel…',
  disabled = false,
  onChange,
  onSubmit,
}: OutcomeIntentInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Auto-resize height to content
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <div className="relative w-full">
      <textarea
        ref={textareaRef}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSubmit();
          }
        }}
        rows={1}
        className="
          w-full
          resize-none
          bg-transparent
          text-white
          placeholder-white/30
          text-base
          leading-relaxed
          focus:outline-none
          overflow-hidden
        "
      />

      {/* Bottom fade (visual only, no scroll clipping) */}
      <div
        aria-hidden
        className="
          pointer-events-none
          absolute
          bottom-0
          left-0
          right-0
          h-6
          bg-gradient-to-t
          from-[#0a0b0e]
          to-transparent
        "
      />
    </div>
  );
}

