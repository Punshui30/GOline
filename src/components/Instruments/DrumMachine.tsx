'use client';

import { useEffect, useRef, useState } from 'react';
import * as Tone from 'tone';
import { Track } from '@/types/daw';
import { useDAWStore } from '@/state/useDAWStore';

interface DrumMachineProps {
  track: Track;
}

const DRUM_SAMPLES = {
  kick: 'https://tonejs.github.io/audio/drum-samples/kick.mp3',
  snare: 'https://tonejs.github.io/audio/drum-samples/snare.mp3',
  hihat: 'https://tonejs.github.io/audio/drum-samples/hihat.mp3',
  openhat: 'https://tonejs.github.io/audio/drum-samples/openhat.mp3',
};

const STEPS = 16;

export default function DrumMachine({ track }: DrumMachineProps) {
  const samplerRef = useRef<Tone.Sampler | null>(null);
  const [steps, setSteps] = useState<Record<string, boolean[]>>({
    kick: new Array(STEPS).fill(false),
    snare: new Array(STEPS).fill(false),
    hihat: new Array(STEPS).fill(false),
    openhat: new Array(STEPS).fill(false),
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

    // Update sequence when steps or BPM change
    if (sequenceRef.current) {
      sequenceRef.current.dispose();
    }

    const sequence = new Tone.Sequence(
      (time, step) => {
        setCurrentStep(step);
        
        Object.entries(steps).forEach(([drum, pattern]) => {
          if (pattern[step] && samplerRef.current) {
            samplerRef.current.triggerAttackRelease(drum, '8n', time);
          }
        });
      },
      Array.from({ length: STEPS }, (_, i) => i),
      '16n'
    );

    sequenceRef.current = sequence;

    // Sync with Transport
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
  }, [steps, isPlaying, bpm]);

  const toggleStep = (drum: string, step: number) => {
    setSteps((prev) => ({
      ...prev,
      [drum]: prev[drum].map((active, i) => (i === step ? !active : active)),
    }));
  };

  return (
    <div className="p-4 bg-gray-800 text-white rounded-lg">
      <h3 className="text-lg font-bold mb-4">{track.name}</h3>
      <div className="space-y-3">
        {Object.entries(steps).map(([drum, pattern]) => (
          <div key={drum} className="flex items-center gap-2">
            <div className="w-20 text-sm font-medium capitalize">{drum}</div>
            <div className="flex gap-1">
              {pattern.map((active, step) => (
                <button
                  key={step}
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
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

