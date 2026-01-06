'use client';

import { Track, EffectType } from '@/types/daw';
import { useDAWStore } from '@/state/useDAWStore';
import EffectItem from './EffectItem';

interface EffectsChainProps {
  track: Track;
}

const AVAILABLE_EFFECTS: { type: EffectType; label: string }[] = [
  { type: 'eq', label: 'EQ' },
  { type: 'compressor', label: 'Compressor' },
  { type: 'reverb', label: 'Reverb' },
  { type: 'delay', label: 'Delay' },
];

export default function EffectsChain({ track }: EffectsChainProps) {
  const { addEffect, removeEffect, reorderEffects } = useDAWStore();

  const handleAddEffect = (effectType: EffectType) => {
    addEffect(track.id, effectType);
  };

  const handleRemoveEffect = (index: number) => {
    removeEffect(track.id, index);
  };

  const handleReorder = (fromIndex: number, toIndex: number) => {
    reorderEffects(track.id, fromIndex, toIndex);
  };

  return (
    <div className="p-4 bg-gray-800 text-white rounded-lg">
      <h3 className="text-lg font-bold mb-4">Effects</h3>
      
      {/* Effects List */}
      <div className="space-y-2 mb-4">
        {track.effects.map((effect, index) => (
          <EffectItem
            key={index}
            effect={effect}
            index={index}
            onRemove={() => handleRemoveEffect(index)}
            onMoveUp={index > 0 ? () => handleReorder(index, index - 1) : undefined}
            onMoveDown={
              index < track.effects.length - 1
                ? () => handleReorder(index, index + 1)
                : undefined
            }
          />
        ))}
      </div>

      {/* Add Effect Dropdown */}
      <div className="flex flex-wrap gap-2">
        {AVAILABLE_EFFECTS.map(({ type, label }) => (
          <button
            key={type}
            onClick={() => handleAddEffect(type)}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors"
          >
            + {label}
          </button>
        ))}
      </div>
    </div>
  );
}


















