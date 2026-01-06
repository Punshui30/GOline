'use client';

import { useEffect, useState, useRef } from 'react';
import { useDAWStore } from '@/state/useDAWStore';
import { audioEngine } from '@/audio/engine';
import { calculateTapTempo, formatBarsBeats } from '@/utils/tempo';
import * as Tone from 'tone';

export default function TopBar() {
  const {
    isPlaying,
    isRecording,
    bpm,
    quantization,
    isLooping,
    loopStart,
    loopEnd,
    currentTime,
    setBPM,
    setQuantization,
    setLooping,
    setLoopRange,
  } = useDAWStore();
  
  const [tapTimes, setTapTimes] = useState<number[]>([]);
  const [timeSignature, setTimeSignature] = useState('4/4');
  const [metronomeEnabled, setMetronomeEnabled] = useState(false);
  const [displayTime, setDisplayTime] = useState({ bars: 0, beats: 0, sixteenths: 0, seconds: 0 });
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const metronomeRef = useRef<Tone.MembraneSynth | null>(null);

  // Sync audio engine BPM
  useEffect(() => {
    audioEngine.setBPM(bpm);
  }, [bpm]);

  // Update display time
  useEffect(() => {
    const interval = setInterval(() => {
      if (isPlaying) {
        const bars = Math.floor(currentTime);
        const beats = Math.floor((currentTime - bars) * 4);
        const sixteenths = Math.floor(((currentTime - bars) * 4 - beats) * 4);
        const totalSeconds = (currentTime * 4 * 60) / bpm;
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = Math.floor(totalSeconds % 60);
        
        setDisplayTime({ bars, beats, sixteenths, seconds: hours * 3600 + minutes * 60 + seconds });
      }
    }, 50);
    return () => clearInterval(interval);
  }, [isPlaying, currentTime, bpm]);

  // Metronome
  useEffect(() => {
    if (!metronomeRef.current) {
      metronomeRef.current = new Tone.MembraneSynth().toDestination();
    }

    if (metronomeEnabled && isPlaying) {
      const click = new Tone.Sequence(
        (time) => {
          if (metronomeRef.current) {
            metronomeRef.current.triggerAttackRelease('C4', '8n', time);
          }
        },
        [0],
        '4n'
      );
      click.start(0);
      
      return () => {
        click.dispose();
      };
    }
  }, [metronomeEnabled, isPlaying]);

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

  const handleRecord = async () => {
    if (isRecording) {
      await audioEngine.stopRecording();
    } else {
      try {
        await audioEngine.startRecording();
      } catch (error) {
        console.error('Recording failed:', error);
      }
    }
  };

  const handleBPMChange = (newBPM: number) => {
    setBPM(Math.max(60, Math.min(200, newBPM)));
  };

  const handleTapTempo = () => {
    const now = Date.now();
    const newTapTimes = [...tapTimes, now].slice(-4);
    setTapTimes(newTapTimes);
    
    if (newTapTimes.length >= 2) {
      const calculatedBPM = calculateTapTempo(newTapTimes);
      setBPM(calculatedBPM);
    }
    
    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current);
    }
    tapTimeoutRef.current = setTimeout(() => {
      setTapTimes([]);
    }, 2000);
  };

  const formatTime = () => {
    const hours = Math.floor(displayTime.seconds / 3600);
    const minutes = Math.floor((displayTime.seconds % 3600) / 60);
    const secs = displayTime.seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-16 bg-[#1A1A1D] border-b border-[#2F2F34] flex items-center px-4 gap-4">
      {/* Transport Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={handlePlay}
          className={`w-10 h-10 rounded flex items-center justify-center transition-all ${
            isPlaying
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-[#2F2F34] hover:bg-[#3A3A40] text-white'
          }`}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button
          onClick={handleStop}
          className="w-10 h-10 rounded bg-[#2F2F34] hover:bg-[#3A3A40] text-white flex items-center justify-center transition-all"
        >
          ⏹
        </button>
        <button
          onClick={handleRecord}
          className={`w-10 h-10 rounded flex items-center justify-center transition-all ${
            isRecording
              ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
              : 'bg-[#2F2F34] hover:bg-[#3A3A40] text-white'
          }`}
        >
          ⏺
        </button>
      </div>

      {/* Time Display */}
      <div className="flex items-center gap-2 px-3 py-1 bg-[#202024] rounded text-sm font-mono">
        <span className="text-white">{formatTime()}</span>
        <span className="text-gray-400">|</span>
        <span className="text-gray-300">{formatBarsBeats(currentTime)}</span>
      </div>

      {/* BPM Control */}
      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-400">BPM</label>
        <input
          type="number"
          min="60"
          max="200"
          value={bpm}
          onChange={(e) => handleBPMChange(Number(e.target.value))}
          className="w-16 px-2 py-1 bg-[#202024] border border-[#2F2F34] rounded text-white text-sm"
        />
        <input
          type="range"
          min="60"
          max="200"
          value={bpm}
          onChange={(e) => handleBPMChange(Number(e.target.value))}
          className="w-24 accent-blue-600"
        />
        <button
          onClick={handleTapTempo}
          className="px-2 py-1 bg-[#2F2F34] hover:bg-[#3A3A40] rounded text-xs text-white transition-colors"
        >
          Tap
        </button>
      </div>

      {/* Time Signature */}
      <select
        value={timeSignature}
        onChange={(e) => setTimeSignature(e.target.value)}
        className="px-2 py-1 bg-[#202024] border border-[#2F2F34] rounded text-white text-sm"
      >
        <option value="4/4">4/4</option>
        <option value="3/4">3/4</option>
        <option value="2/4">2/4</option>
      </select>

      {/* Metronome */}
      <button
        onClick={() => setMetronomeEnabled(!metronomeEnabled)}
        className={`px-3 py-1 rounded text-xs transition-colors ${
          metronomeEnabled
            ? 'bg-blue-600 hover:bg-blue-700 text-white'
            : 'bg-[#2F2F34] hover:bg-[#3A3A40] text-white'
        }`}
      >
        ♪ Metronome
      </button>

      {/* Loop/Cycle */}
      <button
        onClick={() => setLooping(!isLooping)}
        className={`px-3 py-1 rounded text-xs transition-colors ${
          isLooping
            ? 'bg-green-600 hover:bg-green-700 text-white'
            : 'bg-[#2F2F34] hover:bg-[#3A3A40] text-white'
        }`}
      >
        🔁 Cycle
      </button>

      {/* Quantization */}
      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-400">Grid</label>
        <select
          value={quantization}
          onChange={(e) => setQuantization(e.target.value as any)}
          className="px-2 py-1 bg-[#202024] border border-[#2F2F34] rounded text-white text-sm"
        >
          <option value="1/4">1/4</option>
          <option value="1/8">1/8</option>
          <option value="1/16">1/16</option>
          <option value="1/32">1/32</option>
        </select>
      </div>
    </div>
  );
}


















