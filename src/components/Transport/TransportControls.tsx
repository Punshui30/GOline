'use client';

import { useEffect, useState, useRef } from 'react';
import { useDAWStore } from '@/state/useDAWStore';
import { audioEngine } from '@/audio/engine';
import { calculateTapTempo } from '@/utils/tempo';

export default function TransportControls() {
  const {
    isPlaying,
    isRecording,
    bpm,
    quantization,
    isLooping,
    setBPM,
    setQuantization,
    setLooping,
  } = useDAWStore();
  
  const [tapTimes, setTapTimes] = useState<number[]>([]);
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync audio engine BPM with store
  useEffect(() => {
    audioEngine.setBPM(bpm);
  }, [bpm]);

  const handlePlay = async () => {
    if (isPlaying) {
      audioEngine.pause();
    } else {
      await audioEngine.start();
    }
  };

  const handleStop = () => {
    audioEngine.stop();
  };

  const handleBPMChange = (newBPM: number) => {
    setBPM(Math.max(60, Math.min(200, newBPM)));
  };

  const handleTapTempo = () => {
    const now = Date.now();
    const newTapTimes = [...tapTimes, now].slice(-4); // Keep last 4 taps
    setTapTimes(newTapTimes);
    
    if (newTapTimes.length >= 2) {
      const calculatedBPM = calculateTapTempo(newTapTimes);
      setBPM(calculatedBPM);
    }
    
    // Clear taps after 2 seconds of inactivity
    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current);
    }
    tapTimeoutRef.current = setTimeout(() => {
      setTapTimes([]);
    }, 2000);
  };

  return (
    <div className="flex items-center gap-4 p-4 bg-gray-800 text-white rounded-lg">
      {/* Playback Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={handlePlay}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
        >
          {isPlaying ? '⏸ Pause' : '▶ Play'}
        </button>
        <button
          onClick={handleStop}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded transition-colors"
        >
          ⏹ Stop
        </button>
        <button
          onClick={() => setLooping(!isLooping)}
          className={`px-4 py-2 rounded transition-colors ${
            isLooping
              ? 'bg-green-600 hover:bg-green-700'
              : 'bg-gray-600 hover:bg-gray-700'
          }`}
        >
          🔁 Loop
        </button>
      </div>

      {/* BPM Control */}
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">BPM:</label>
        <input
          type="number"
          min="60"
          max="200"
          value={bpm}
          onChange={(e) => handleBPMChange(Number(e.target.value))}
          className="w-20 px-2 py-1 bg-gray-700 rounded text-center"
        />
        <button
          onClick={handleTapTempo}
          className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-sm transition-colors"
        >
          Tap
        </button>
      </div>

      {/* Quantization */}
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">Grid:</label>
        <select
          value={quantization}
          onChange={(e) => setQuantization(e.target.value as any)}
          className="px-2 py-1 bg-gray-700 rounded"
        >
          <option value="1/4">1/4</option>
          <option value="1/8">1/8</option>
          <option value="1/16">1/16</option>
          <option value="1/32">1/32</option>
        </select>
      </div>

      {/* Recording Indicator */}
      {isRecording && (
        <div className="flex items-center gap-2 text-red-400">
          <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
          <span className="text-sm">Recording</span>
        </div>
      )}
    </div>
  );
}


















