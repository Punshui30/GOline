'use client';

import { Track, EffectType } from '@/types/daw';
import { useDAWStore } from '@/state/useDAWStore';
import EffectSlot from './EffectSlot';

const AVAILABLE_EFFECTS: { type: EffectType; label: string }[] = [
  { type: 'eq', label: 'EQ3' },
  { type: 'compressor', label: 'Compressor' },
  { type: 'reverb', label: 'Reverb' },
  { type: 'delay', label: 'Delay' },
];

export default function EffectsView({ track }: { track: Track }) {
  const { addEffect, removeEffect, reorderEffects, updateTrack } = useDAWStore();

  const handleAddEffect = (effectType: EffectType) => {
    addEffect(track.id, effectType);
  };

  const handleRemoveEffect = (index: number) => {
    removeEffect(track.id, index);
  };

  const handleToggleEffect = (index: number) => {
    const newEffects = [...track.effects];
    newEffects[index].enabled = !newEffects[index].enabled;
    updateTrack(track.id, { effects: newEffects });
  };

  const handleReorder = (fromIndex: number, toIndex: number) => {
    reorderEffects(track.id, fromIndex, toIndex);
  };

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold text-white mb-4">Effects Chain</h3>
      
      {/* Effects Slots */}
      <div className="space-y-2 mb-4">
        {track.effects.map((effect, index) => (
          <EffectSlot
            key={index}
            effect={effect}
            index={index}
            onRemove={() => handleRemoveEffect(index)}
            onToggle={() => handleToggleEffect(index)}
            onMoveUp={index > 0 ? () => handleReorder(index, index - 1) : undefined}
            onMoveDown={
              index < track.effects.length - 1
                ? () => handleReorder(index, index + 1)
                : undefined
            }
          />
        ))}
      </div>

      {/* Add Effect */}
      <div className="flex flex-wrap gap-2">
        {AVAILABLE_EFFECTS.map(({ type, label }) => (
          <button
            key={type}
            onClick={() => handleAddEffect(type)}
            className="px-3 py-2 bg-[#2F2F34] hover:bg-[#3A3A40] rounded text-sm text-white transition-colors"
          >
            + {label}
          </button>
        ))}
      </div>
    </div>
  );
}


















