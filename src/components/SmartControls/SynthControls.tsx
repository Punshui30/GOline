'use client';

import { useEffect, useRef, useState } from 'react';
import { Track } from '@/types/daw';
import * as Tone from 'tone';

export default function SynthControls({ track }: { track: Track }) {
  const [attack, setAttack] = useState(0.1);
  const [decay, setDecay] = useState(0.2);
  const [sustain, setSustain] = useState(0.5);
  const [release, setRelease] = useState(1);
  const [cutoff, setCutoff] = useState(20000);
  const [resonance, setResonance] = useState(1);
  const synthRef = useRef<Tone.PolySynth | null>(null);
  const filterRef = useRef<Tone.Filter | null>(null);

  useEffect(() => {
    if (!synthRef.current) {
      filterRef.current = new Tone.Filter({
        frequency: cutoff,
        Q: resonance,
        type: 'lowpass',
      }).toDestination();
      
      synthRef.current = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sawtooth' },
        envelope: {
          attack,
          decay,
          sustain,
          release,
        },
      }).connect(filterRef.current);
    }

    return () => {
      synthRef.current?.dispose();
      filterRef.current?.dispose();
    };
  }, []);

  useEffect(() => {
    if (synthRef.current) {
      synthRef.current.set({ envelope: { attack, decay, sustain, release } });
    }
  }, [attack, decay, sustain, release]);

  useEffect(() => {
    if (filterRef.current) {
      filterRef.current.frequency.value = cutoff;
      filterRef.current.Q.value = resonance;
    }
  }, [cutoff, resonance]);

  const playNote = (note: string) => {
    if (synthRef.current) {
      synthRef.current.triggerAttackRelease(note, '8n');
    }
  };

  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octaves = [3, 4, 5];

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold text-white mb-4">{track.name}</h3>
      
      {/* ADSR Envelope */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-300 mb-3">Envelope</h4>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Attack</label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.01"
              value={attack}
              onChange={(e) => setAttack(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
            <div className="text-xs text-gray-400 mt-1">{attack.toFixed(2)}s</div>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Decay</label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.01"
              value={decay}
              onChange={(e) => setDecay(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
            <div className="text-xs text-gray-400 mt-1">{decay.toFixed(2)}s</div>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Sustain</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={sustain}
              onChange={(e) => setSustain(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
            <div className="text-xs text-gray-400 mt-1">{sustain.toFixed(2)}</div>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Release</label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.01"
              value={release}
              onChange={(e) => setRelease(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
            <div className="text-xs text-gray-400 mt-1">{release.toFixed(2)}s</div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-300 mb-3">Filter</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Cutoff</label>
            <input
              type="range"
              min="20"
              max="20000"
              step="10"
              value={cutoff}
              onChange={(e) => setCutoff(Number(e.target.value))}
              className="w-full accent-purple-600"
            />
            <div className="text-xs text-gray-400 mt-1">{cutoff}Hz</div>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Resonance</label>
            <input
              type="range"
              min="0.1"
              max="10"
              step="0.1"
              value={resonance}
              onChange={(e) => setResonance(Number(e.target.value))}
              className="w-full accent-purple-600"
            />
            <div className="text-xs text-gray-400 mt-1">{resonance.toFixed(1)}</div>
          </div>
        </div>
      </div>

      {/* Piano */}
      <div>
        <h4 className="text-sm font-medium text-gray-300 mb-3">Piano</h4>
        <div className="space-y-2">
          {octaves.map((octave) => (
            <div key={octave} className="flex gap-1">
              {notes.map((note) => {
                const isBlack = note.includes('#');
                return (
                  <button
                    key={`${note}${octave}`}
                    onClick={() => playNote(`${note}${octave}`)}
                    className={`${
                      isBlack
                        ? 'bg-gray-900 text-white h-16 w-8 -ml-4 z-10'
                        : 'bg-white text-gray-900 h-20 w-10 border border-gray-300'
                    } rounded-b transition-transform active:scale-95`}
                  >
                    {!isBlack && (
                      <span className="text-xs mt-auto mb-1">{note}</span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


















