'use client';

import { useDAWStore } from '@/state/useDAWStore';
import TrackHeader from './TrackHeader';

export default function TrackSidebar() {
  const { tracks, addTrack, selectedTrackId } = useDAWStore();

  const handleAddAudioTrack = () => {
    addTrack('audio');
  };

  const handleAddSynthTrack = () => {
    addTrack('instrument', 'synth');
  };

  const handleAddDrumTrack = () => {
    addTrack('instrument', 'drumMachine');
  };

  return (
    <div className="w-64 bg-[#1A1A1D] border-r border-[#2F2F34] flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-[#2F2F34]">
        <h2 className="text-sm font-semibold text-white">Tracks</h2>
      </div>

      {/* Track List */}
      <div className="flex-1 overflow-y-auto">
        {tracks.map((track) => (
          <TrackHeader
            key={track.id}
            track={track}
            isSelected={track.id === selectedTrackId}
          />
        ))}
      </div>

      {/* Add Track Button */}
      <div className="p-3 border-t border-[#2F2F34]">
        <div className="flex flex-col gap-2">
          <button
            onClick={handleAddAudioTrack}
            className="w-full px-3 py-2 bg-[#2F2F34] hover:bg-[#3A3A40] rounded text-sm text-white transition-colors flex items-center gap-2"
          >
            <span className="text-lg">🎤</span>
            <span>Audio Track</span>
          </button>
          <button
            onClick={handleAddSynthTrack}
            className="w-full px-3 py-2 bg-[#2F2F34] hover:bg-[#3A3A40] rounded text-sm text-white transition-colors flex items-center gap-2"
          >
            <span className="text-lg">🎹</span>
            <span>Software Instrument</span>
          </button>
          <button
            onClick={handleAddDrumTrack}
            className="w-full px-3 py-2 bg-[#2F2F34] hover:bg-[#3A3A40] rounded text-sm text-white transition-colors flex items-center gap-2"
          >
            <span className="text-lg">🥁</span>
            <span>Drum Machine</span>
          </button>
        </div>
      </div>
    </div>
  );
}


















