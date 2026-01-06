'use client';

import { Clip, Track } from '@/types/daw';
import Waveform from './Waveform';

interface TimelineRegionProps {
  clip: Clip;
  track: Track;
  left: number;
  width: number;
  height: number;
  onDragStart: (e: React.MouseEvent) => void;
  onResizeStart: (edge: 'left' | 'right', e: React.MouseEvent) => void;
  isAudio: boolean;
  isMidi: boolean;
}

export default function TimelineRegion({
  clip,
  track,
  left,
  width,
  height,
  onDragStart,
  onResizeStart,
  isAudio,
  isMidi,
}: TimelineRegionProps) {
  const getRegionColor = () => {
    if (isAudio) return 'bg-[#00FF88] bg-opacity-20 border-[#00FF88]';
    if (track.instrumentType === 'drumMachine') return 'bg-[#F97316] bg-opacity-30 border-[#F97316]';
    return 'bg-[#8B5CF6] bg-opacity-30 border-[#8B5CF6]';
  };

  return (
    <div
      className={`absolute top-2 bottom-2 border rounded cursor-move hover:opacity-80 transition-opacity ${getRegionColor()}`}
      style={{
        left: `${left}%`,
        width: `${width}%`,
        minWidth: '20px',
      }}
      onMouseDown={onDragStart}
    >
      {/* Resize Handles */}
      <div
        className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white hover:bg-opacity-20"
        onMouseDown={(e) => {
          e.stopPropagation();
          onResizeStart('left', e);
        }}
      />
      <div
        className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white hover:bg-opacity-20"
        onMouseDown={(e) => {
          e.stopPropagation();
          onResizeStart('right', e);
        }}
      />

      {/* Clip Content */}
      <div className="p-2 h-full flex flex-col">
        <div className="text-xs text-white truncate mb-1">{clip.name || 'Clip'}</div>
        {isAudio && clip.audioBuffer && (
          <div className="flex-1 overflow-hidden">
            <Waveform audioBuffer={clip.audioBuffer} width={width * 10} height={height - 40} />
          </div>
        )}
        {isMidi && (
          <div className="flex-1 bg-white bg-opacity-10 rounded text-xs text-gray-300 flex items-center justify-center">
            MIDI
          </div>
        )}
      </div>
    </div>
  );
}


















