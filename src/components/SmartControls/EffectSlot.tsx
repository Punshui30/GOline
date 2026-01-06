'use client';

import { Effect } from '@/types/daw';

interface EffectSlotProps {
  effect: Effect;
  index: number;
  onRemove: () => void;
  onToggle: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

const EFFECT_LABELS: Record<string, string> = {
  eq: 'EQ3',
  compressor: 'Compressor',
  reverb: 'Reverb',
  delay: 'Delay',
};

export default function EffectSlot({
  effect,
  index,
  onRemove,
  onToggle,
  onMoveUp,
  onMoveDown,
}: EffectSlotProps) {
  return (
    <div className="flex items-center gap-2 p-3 bg-[#202024] rounded border border-[#2F2F34]">
      <button
        onClick={onToggle}
        className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
          effect.enabled
            ? 'bg-green-600 border-green-500'
            : 'bg-[#2F2F34] border-gray-600'
        }`}
      >
        {effect.enabled && <span className="text-white text-xs">✓</span>}
      </button>
      
      <div className="flex-1">
        <div className="text-sm font-medium text-white">{EFFECT_LABELS[effect.type]}</div>
        <div className="text-xs text-gray-400">Insert {index + 1}</div>
      </div>
      
      <div className="flex items-center gap-1">
        {onMoveUp && (
          <button
            onClick={onMoveUp}
            className="px-2 py-1 bg-[#2F2F34] hover:bg-[#3A3A40] rounded text-xs text-white"
          >
            ↑
          </button>
        )}
        {onMoveDown && (
          <button
            onClick={onMoveDown}
            className="px-2 py-1 bg-[#2F2F34] hover:bg-[#3A3A40] rounded text-xs text-white"
          >
            ↓
          </button>
        )}
        <button
          onClick={onRemove}
          className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs text-white"
        >
          ×
        </button>
      </div>
    </div>
  );
}


















