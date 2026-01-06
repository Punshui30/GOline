'use client';

import { useDAWStore } from '@/state/useDAWStore';
import MixerChannel from './MixerChannel';

export default function MixerView() {
  const { tracks } = useDAWStore();

  return (
    <div className="p-4 h-full overflow-x-auto">
      <div className="flex gap-4 h-full">
        {tracks.map((track) => (
          <MixerChannel key={track.id} track={track} />
        ))}
      </div>
    </div>
  );
}


















