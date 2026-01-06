'use client';

import { useDAWStore } from '@/state/useDAWStore';
import MixerChannel from './MixerChannel';

export default function Mixer() {
  const { tracks } = useDAWStore();

  return (
    <div className="bg-gray-800 text-white p-4 rounded-lg">
      <h2 className="text-xl font-bold mb-4">Mixer</h2>
      <div className="flex gap-4 overflow-x-auto">
        {tracks.map((track) => (
          <MixerChannel key={track.id} track={track} />
        ))}
      </div>
    </div>
  );
}


















