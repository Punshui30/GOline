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
    const db = (volume / 100) * 72 - 60;
    updateTrack(track.id, { volume: db });
    audioEngine.updateTrackNode(track.id);
  };

  const handlePanChange = (pan: number) => {
    const panValue = (pan / 50) - 1;
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

  const volumeSliderValue = ((track.volume + 60) / 72) * 100;
  const panSliderValue = ((track.pan + 1) / 2) * 100;

  return (
    <div className="w-20 flex flex-col items-center gap-2 p-3 bg-[#202024] rounded">
      <div className="text-xs text-white font-medium truncate w-full text-center mb-2">
        {track.name}
      </div>

      {/* Volume Fader */}
      <div className="flex flex-col items-center gap-1 flex-1">
        <div className="h-48 flex items-center">
          <input
            type="range"
            min="0"
            max="100"
            value={volumeSliderValue}
            onChange={(e) => handleVolumeChange(Number(e.target.value))}
            className="w-48 h-2 accent-blue-600 transform -rotate-90"
            orient="vertical"
          />
        </div>
        <div className="text-xs text-gray-400">
          {track.volume.toFixed(1)}dB
        </div>
      </div>

      {/* Pan Knob */}
      <div className="flex flex-col items-center gap-1 w-full">
        <label className="text-xs text-gray-400">Pan</label>
        <input
          type="range"
          min="0"
          max="100"
          value={panSliderValue}
          onChange={(e) => handlePanChange(Number(e.target.value))}
          className="w-full h-1 accent-purple-600"
        />
        <div className="text-xs text-gray-400">
          {track.pan > 0 ? `R${track.pan.toFixed(1)}` : track.pan < 0 ? `L${Math.abs(track.pan).toFixed(1)}` : 'C'}
        </div>
      </div>

      {/* Meter (placeholder) */}
      <div className="w-full h-2 bg-[#2F2F34] rounded mb-2">
        <div className="h-full bg-green-500 rounded" style={{ width: '60%' }}></div>
      </div>

      {/* Mute/Solo */}
      <div className="flex gap-2 w-full">
        <button
          onClick={handleMute}
          className={`flex-1 px-2 py-1 rounded text-xs transition-colors ${
            track.mute
              ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
              : 'bg-[#2F2F34] hover:bg-[#3A3A40] text-white'
          }`}
        >
          M
        </button>
        <button
          onClick={handleSolo}
          className={`flex-1 px-2 py-1 rounded text-xs transition-colors ${
            track.solo
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-[#2F2F34] hover:bg-[#3A3A40] text-white'
          }`}
        >
          S
        </button>
      </div>
    </div>
  );
}


















