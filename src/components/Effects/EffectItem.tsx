'use client';

import { Effect } from '@/types/daw';

interface EffectItemProps {
  effect: Effect;
  index: number;
  onRemove: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

const EFFECT_LABELS: Record<string, string> = {
  eq: 'EQ',
  compressor: 'Compressor',
  reverb: 'Reverb',
  delay: 'Delay',
};

export default function EffectItem({
  effect,
  index,
  onRemove,
  onMoveUp,
  onMoveDown,
}: EffectItemProps) {
  return (
    <div className="flex items-center gap-2 p-2 bg-gray-700 rounded">
      <div className="flex-1">
        <div className="text-sm font-medium">{EFFECT_LABELS[effect.type]}</div>
        <div className="text-xs text-gray-400">Effect {index + 1}</div>
      </div>
      
      <div className="flex items-center gap-1">
        {onMoveUp && (
          <button
            onClick={onMoveUp}
            className="px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-xs"
          >
            ↑
          </button>
        )}
        {onMoveDown && (
          <button
            onClick={onMoveDown}
            className="px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-xs"
          >
            ↓
          </button>
        )}
        <button
          onClick={onRemove}
          className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs"
        >
          ×
        </button>
      </div>
    </div>
  );
}


















