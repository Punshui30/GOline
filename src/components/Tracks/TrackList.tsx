'use client';

import { useDAWStore } from '@/state/useDAWStore';
import TrackItem from './TrackItem';

export default function TrackList() {
  const { tracks, selectedTrackId, selectTrack, addTrack, removeTrack } = useDAWStore();

  const handleAddAudioTrack = () => {
    const track = addTrack('audio');
    selectTrack(track.id);
  };

  const handleAddSynthTrack = () => {
    const track = addTrack('instrument', 'synth');
    selectTrack(track.id);
  };

  const handleAddDrumTrack = () => {
    const track = addTrack('instrument', 'drumMachine');
    selectTrack(track.id);
  };

  return (
    <div className="w-48 bg-gray-800 text-white flex flex-col h-full">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-bold mb-2">Tracks</h2>
        <div className="flex flex-col gap-2">
          <button
            onClick={handleAddAudioTrack}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors"
          >
            + Audio Track
          </button>
          <button
            onClick={handleAddSynthTrack}
            className="px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded text-sm transition-colors"
          >
            + Synth
          </button>
          <button
            onClick={handleAddDrumTrack}
            className="px-3 py-2 bg-green-600 hover:bg-green-700 rounded text-sm transition-colors"
          >
            + Drums
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {tracks.map((track) => (
          <TrackItem
            key={track.id}
            track={track}
            isSelected={track.id === selectedTrackId}
            onSelect={() => selectTrack(track.id)}
            onRemove={() => removeTrack(track.id)}
          />
        ))}
      </div>
    </div>
  );
}


















