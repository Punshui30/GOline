export type InstrumentType = 'synth' | 'drumMachine';
export type EffectType = 'eq' | 'compressor' | 'reverb' | 'delay';

export interface Effect {
  type: EffectType;
  enabled: boolean;
  params?: Record<string, number>;
}

export interface Clip {
  id: string;
  start: number; // in bars/beats
  duration: number; // in bars/beats
  audioBuffer?: AudioBuffer;
  audioUrl?: string;
  name?: string;
}

export interface Track {
  id: string;
  name: string;
  type: 'audio' | 'instrument';
  instrumentType?: InstrumentType;
  volume: number; // dB, 0 = unity
  pan: number; // -1 to 1
  mute: boolean;
  solo: boolean;
  clips: Clip[];
  effects: Effect[];
}


















