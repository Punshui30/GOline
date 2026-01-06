'use client';

import { Track } from '@/types/daw';
import { useDAWStore } from '@/state/useDAWStore';
import { audioEngine } from '@/audio/engine';

interface MixerChannelProps {
  track: Track;
}

export default function MixerChannel({ track }: MixerChannelProps) {
  const { updateTrack } = useDAWStore();

  const handleVolumeChange = (volume: number) => {
    // Convert slider value (0-100) to dB (-60 to 12)
    const db = (volume / 100) * 72 - 60;
    updateTrack(track.id, { volume: db });
    audioEngine.updateTrackNode(track.id);
  };

  const handlePanChange = (pan: number) => {
    // Convert slider value (0-100) to pan (-1 to 1)
    const panValue = (pan / 100) * 2 - 1;
    updateTrack(track.id, { pan: panValue });
    audioEngine.updateTrackNode(track.id);
  };

  const handleMute = () => {
    updateTrack(track.id, { mute: !track.mute });
    audioEngine.updateTrackNode(track.id);
  };

  const handleSolo = () => {
    updateTrack(track.id, { solo: !track.solo });
    audioEngine.updateTrackNode(track.id);
  };

  // Convert dB to slider value (0-100)
  const volumeSliderValue = ((track.volume + 60) / 72) * 100;
  const panSliderValue = ((track.pan + 1) / 2) * 100;

  return (
    <div className="flex flex-col items-center gap-2 min-w-[80px] p-3 bg-gray-700 rounded">
      <div className="text-sm font-medium truncate w-full text-center">
        {track.name}
      </div>

      {/* Volume Fader */}
      <div className="flex flex-col items-center gap-1">
        <label className="text-xs text-gray-400">Vol</label>
        <div className="h-32 flex items-center">
          <input
            type="range"
            min="0"
            max="100"
            value={volumeSliderValue}
            onChange={(e) => handleVolumeChange(Number(e.target.value))}
            className="w-32 accent-blue-600 transform -rotate-90"
          />
        </div>
        <div className="text-xs text-gray-400">
          {track.volume.toFixed(1)} dB
        </div>
      </div>

      {/* Pan Knob */}
      <div className="flex flex-col items-center gap-1">
        <label className="text-xs text-gray-400">Pan</label>
        <input
          type="range"
          min="0"
          max="100"
          value={panSliderValue}
          onChange={(e) => handlePanChange(Number(e.target.value))}
          className="w-24 accent-purple-600"
        />
        <div className="text-xs text-gray-400">
          {track.pan > 0 ? `R ${track.pan.toFixed(1)}` : track.pan < 0 ? `L ${Math.abs(track.pan).toFixed(1)}` : 'C'}
        </div>
      </div>

      {/* Mute/Solo */}
      <div className="flex gap-2 mt-2">
        <button
          onClick={handleMute}
          className={`px-3 py-1 rounded text-xs transition-colors ${
            track.mute
              ? 'bg-yellow-600 hover:bg-yellow-700'
              : 'bg-gray-600 hover:bg-gray-500'
          }`}
        >
          M
        </button>
        <button
          onClick={handleSolo}
          className={`px-3 py-1 rounded text-xs transition-colors ${
            track.solo
              ? 'bg-green-600 hover:bg-green-700'
              : 'bg-gray-600 hover:bg-gray-500'
          }`}
        >
          S
        </button>
      </div>
    </div>
  );
}

