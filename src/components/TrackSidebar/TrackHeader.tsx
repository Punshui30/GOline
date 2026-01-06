'use client';

import { Track } from '@/types/daw';
import { useDAWStore } from '@/state/useDAWStore';
import { audioEngine } from '@/audio/engine';
import * as Tone from 'tone';

interface TrackHeaderProps {
  track: Track;
  isSelected: boolean;
}

export default function TrackHeader({ track, isSelected }: TrackHeaderProps) {
  const { selectTrack, updateTrack, removeTrack } = useDAWStore();

  const handleVolumeChange = (volume: number) => {
    const db = (volume / 100) * 72 - 60;
    updateTrack(track.id, { volume: db });
    audioEngine.updateTrackNode(track.id);
  };

  const handlePanChange = (pan: number) => {
    const panValue = (pan / 50) - 1; // 0-100 to -1 to 1
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

  const handleRecordEnable = () => {
    // Toggle record enable (would need to add to track state)
    updateTrack(track.id, {});
  };

  const getTrackIcon = () => {
    if (track.type === 'instrument') {
      if (track.instrumentType === 'drumMachine') return '🥁';
      return '🎹';
    }
    return '🎤';
  };

  const volumeSliderValue = ((track.volume + 60) / 72) * 100;
  const panSliderValue = ((track.pan + 1) / 2) * 100;

  return (
    <div
      className={`border-b border-[#2F2F34] p-2 cursor-pointer transition-colors ${
        isSelected ? 'bg-[#2A2A30]' : 'bg-[#202024] hover:bg-[#252529]'
      }`}
      onClick={() => selectTrack(track.id)}
    >
      {/* Track Icon and Name */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{getTrackIcon()}</span>
        <input
          type="text"
          value={track.name}
          onChange={(e) => updateTrack(track.id, { name: e.target.value })}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 bg-transparent border-none text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1"
        />
        <button
          onClick={(e) => {
            e.stopPropagation();
            removeTrack(track.id);
          }}
          className="text-gray-400 hover:text-red-400 text-xs"
        >
          ×
        </button>
      </div>

      {/* Mini Volume Slider */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs text-gray-400 w-8">Vol</span>
        <input
          type="range"
          min="0"
          max="100"
          value={volumeSliderValue}
          onChange={(e) => handleVolumeChange(Number(e.target.value))}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 h-1 accent-blue-600"
        />
        <span className="text-xs text-gray-400 w-10 text-right">
          {track.volume.toFixed(0)}dB
        </span>
      </div>

      {/* Pan Knob (circular style) */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs text-gray-400 w-8">Pan</span>
        <div className="flex-1 flex items-center justify-center">
          <input
            type="range"
            min="0"
            max="100"
            value={panSliderValue}
            onChange={(e) => handlePanChange(Number(e.target.value))}
            onClick={(e) => e.stopPropagation()}
            className="w-full h-1 accent-purple-600"
          />
        </div>
        <span className="text-xs text-gray-400 w-10 text-right">
          {track.pan > 0 ? `R${track.pan.toFixed(1)}` : track.pan < 0 ? `L${Math.abs(track.pan).toFixed(1)}` : 'C'}
        </span>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center gap-1">
        {track.type === 'audio' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRecordEnable();
            }}
            className="w-6 h-6 rounded text-xs bg-[#2F2F34] hover:bg-[#3A3A40] text-white transition-colors"
            title="Record Enable"
          >
            R
          </button>
        )}
        {track.type === 'instrument' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRecordEnable();
            }}
            className="w-6 h-6 rounded text-xs bg-[#2F2F34] hover:bg-[#3A3A40] text-white transition-colors"
            title="Arm for MIDI"
          >
            A
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleMute();
          }}
          className={`w-6 h-6 rounded text-xs transition-colors ${
            track.mute
              ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
              : 'bg-[#2F2F34] hover:bg-[#3A3A40] text-white'
          }`}
          title="Mute"
        >
          M
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleSolo();
          }}
          className={`w-6 h-6 rounded text-xs transition-colors ${
            track.solo
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-[#2F2F34] hover:bg-[#3A3A40] text-white'
          }`}
          title="Solo"
        >
          S
        </button>
      </div>
    </div>
  );
}


















