'use client';

import { getGridPositions } from '@/utils/tempo';

interface TimelineGridProps {
  startBar: number;
  endBar: number;
  quantization: '1/4' | '1/8' | '1/16' | '1/32';
  bpm: number;
  zoom: number;
  isTrackGrid?: boolean;
}

export default function TimelineGrid({
  startBar,
  endBar,
  quantization,
  bpm,
  zoom,
  isTrackGrid = false,
}: TimelineGridProps) {
  const gridPositions = getGridPositions(startBar, endBar, quantization);

  return (
    <>
      {gridPositions.map((pos) => {
        const x = ((pos - startBar) / (endBar - startBar)) * 100;
        const isBeat = pos % 1 === 0;
        const isBar = pos % 4 === 0;
        
        return (
          <div
            key={pos}
            className={`absolute top-0 bottom-0 ${
              isBar
                ? 'border-l-2 border-blue-500'
                : isBeat
                ? 'border-l border-blue-400 opacity-50'
                : 'border-l border-[#2F2F34] opacity-30'
            } ${isTrackGrid ? 'opacity-20' : ''}`}
            style={{ left: `${x}%` }}
          >
            {!isTrackGrid && isBeat && (
              <span className="absolute top-1 left-1 text-xs text-gray-500">
                {Math.floor(pos)}
              </span>
            )}
          </div>
        );
      })}
    </>
  );
}


















