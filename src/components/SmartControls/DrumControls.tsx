'use client';

import { useEffect, useRef, useState } from 'react';
import { Track } from '@/types/daw';
import { useDAWStore } from '@/state/useDAWStore';
import * as Tone from 'tone';

const DRUM_SAMPLES = {
  kick: 'https://tonejs.github.io/audio/drum-samples/kick.mp3',
  snare: 'https://tonejs.github.io/audio/drum-samples/snare.mp3',
  hihat: 'https://tonejs.github.io/audio/drum-samples/hihat.mp3',
  openhat: 'https://tonejs.github.io/audio/drum-samples/openhat.mp3',
};

const STEPS = 16;

export default function DrumControls({ track }: { track: Track }) {
  const samplerRef = useRef<Tone.Sampler | null>(null);
  const [steps, setSteps] = useState<Record<string, boolean[]>>({
    kick: new Array(STEPS).fill(false),
    snare: new Array(STEPS).fill(false),
    hihat: new Array(STEPS).fill(false),
    openhat: new Array(STEPS).fill(false),
  });
  const [velocities, setVelocities] = useState<Record<string, number[]>>({
    kick: new Array(STEPS).fill(100),
    snare: new Array(STEPS).fill(100),
    hihat: new Array(STEPS).fill(100),
    openhat: new Array(STEPS).fill(100),
  });
  const [currentStep, setCurrentStep] = useState(0);
  const sequenceRef = useRef<Tone.Sequence | null>(null);
  const { bpm, isPlaying } = useDAWStore();

  useEffect(() => {
    if (!samplerRef.current) {
      samplerRef.current = new Tone.Sampler({
        urls: DRUM_SAMPLES,
        release: 0.1,
      }).toDestination();
    }

    return () => {
      samplerRef.current?.dispose();
      sequenceRef.current?.dispose();
    };
  }, []);

  useEffect(() => {
    if (!samplerRef.current) return;

    if (sequenceRef.current) {
      sequenceRef.current.dispose();
    }

    const sequence = new Tone.Sequence(
      (time, step) => {
        setCurrentStep(step);
        
        Object.entries(steps).forEach(([drum, pattern]) => {
          if (pattern[step] && samplerRef.current) {
            const velocity = velocities[drum][step] / 100;
            samplerRef.current.triggerAttackRelease(drum, '8n', time, velocity);
          }
        });
      },
      Array.from({ length: STEPS }, (_, i) => i),
      '16n'
    );

    sequenceRef.current = sequence;

    if (isPlaying && Tone.Transport.state === 'started') {
      sequence.start(0);
    } else {
      sequence.stop();
    }

    return () => {
      if (sequenceRef.current) {
        sequenceRef.current.dispose();
      }
    };
  }, [steps, velocities, isPlaying, bpm]);

  const toggleStep = (drum: string, step: number) => {
    setSteps((prev) => ({
      ...prev,
      [drum]: prev[drum].map((active, i) => (i === step ? !active : active)),
    }));
  };

  const setVelocity = (drum: string, step: number, velocity: number) => {
    setVelocities((prev) => ({
      ...prev,
      [drum]: prev[drum].map((v, i) => (i === step ? velocity : v)),
    }));
  };

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold text-white mb-4">{track.name}</h3>
      
      <div className="space-y-4">
        {Object.entries(steps).map(([drum, pattern]) => (
          <div key={drum} className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-20 text-sm font-medium text-gray-300 capitalize">{drum}</div>
              <div className="flex gap-1 flex-1">
                {pattern.map((active, step) => (
                  <div key={step} className="flex flex-col items-center gap-1">
                    <button
                      onClick={() => toggleStep(drum, step)}
                      className={`w-8 h-8 rounded transition-colors ${
                        active
                          ? step === currentStep && isPlaying
                            ? 'bg-green-500'
                            : 'bg-blue-600'
                          : step === currentStep && isPlaying
                          ? 'bg-gray-600'
                          : 'bg-gray-700'
                      } hover:bg-opacity-80`}
                    />
                    {active && (
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={velocities[drum][step]}
                        onChange={(e) => setVelocity(drum, step, Number(e.target.value))}
                        className="w-8 h-1 accent-orange-600"
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


















