'use client';

import { Track } from '@/types/daw';

interface TrackItemProps {
  track: Track;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
}

export default function TrackItem({ track, isSelected, onSelect, onRemove }: TrackItemProps) {
  return (
    <div
      className={`p-3 border-b border-gray-700 cursor-pointer transition-colors ${
        isSelected ? 'bg-blue-600' : 'hover:bg-gray-700'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="text-sm font-medium truncate">{track.name}</div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="text-red-400 hover:text-red-300 text-xs"
        >
          ×
        </button>
      </div>
      <div className="text-xs text-gray-400">
        {track.type === 'instrument' && track.instrumentType}
        {track.type === 'audio' && `${track.clips.length} clips`}
      </div>
      <div className="flex items-center gap-2 mt-2">
        {track.mute && (
          <span className="text-xs bg-yellow-600 px-1 rounded">M</span>
        )}
        {track.solo && (
          <span className="text-xs bg-green-600 px-1 rounded">S</span>
        )}
      </div>
    </div>
  );
}


















