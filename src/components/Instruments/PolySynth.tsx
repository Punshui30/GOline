'use client';

import { useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { Track } from '@/types/daw';

interface PolySynthProps {
  track: Track;
}

export default function PolySynth({ track }: PolySynthProps) {
  const synthRef = useRef<Tone.PolySynth | null>(null);

  useEffect(() => {
    if (!synthRef.current) {
      synthRef.current = new Tone.PolySynth(Tone.Synth, {
        oscillator: {
          type: 'sawtooth',
        },
        envelope: {
          attack: 0.1,
          decay: 0.2,
          sustain: 0.5,
          release: 1,
        },
      }).toDestination();
    }

    return () => {
      synthRef.current?.dispose();
    };
  }, []);

  const playNote = (note: string, duration: string = '8n') => {
    if (synthRef.current) {
      synthRef.current.triggerAttackRelease(note, duration);
    }
  };

  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octaves = [3, 4, 5];

  return (
    <div className="p-4 bg-gray-800 text-white rounded-lg">
      <h3 className="text-lg font-bold mb-4">{track.name}</h3>
      <div className="space-y-2">
        {octaves.map((octave) => (
          <div key={octave} className="flex gap-1">
            {notes.map((note) => {
              const isBlack = note.includes('#');
              return (
                <button
                  key={`${note}${octave}`}
                  onClick={() => playNote(`${note}${octave}`, '8n')}
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
  );
}


















