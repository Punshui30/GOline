import { create } from 'zustand';
import { Track, Clip, EffectType, InstrumentType } from '@/types/daw';

export interface DAWState {
  // Transport state
  isPlaying: boolean;
  isRecording: boolean;
  currentTime: number;
  loopStart: number;
  loopEnd: number;
  isLooping: boolean;
  
  // Tempo
  bpm: number;
  quantization: '1/4' | '1/8' | '1/16' | '1/32';
  
  // Tracks
  tracks: Track[];
  selectedTrackId: string | null;
  
  // Actions
  setBPM: (bpm: number) => void;
  setQuantization: (quantization: '1/4' | '1/8' | '1/16' | '1/32') => void;
  setPlaying: (playing: boolean) => void;
  setRecording: (recording: boolean) => void;
  setCurrentTime: (time: number) => void;
  setLooping: (looping: boolean) => void;
  setLoopRange: (start: number, end: number) => void;
  
  // Track management
  addTrack: (type: 'audio' | 'instrument', instrumentType?: InstrumentType) => Track;
  removeTrack: (trackId: string) => void;
  selectTrack: (trackId: string | null) => void;
  updateTrack: (trackId: string, updates: Partial<Track>) => void;
  
  // Clip management
  addClip: (trackId: string, clip: Clip) => void;
  removeClip: (trackId: string, clipId: string) => void;
  updateClip: (trackId: string, clipId: string, updates: Partial<Clip>) => void;
  
  // Effects
  addEffect: (trackId: string, effectType: EffectType) => void;
  removeEffect: (trackId: string, effectIndex: number) => void;
  reorderEffects: (trackId: string, fromIndex: number, toIndex: number) => void;
}

let trackIdCounter = 0;
let clipIdCounter = 0;

export const useDAWStore = create<DAWState>((set, get) => ({
  // Initial state
  isPlaying: false,
  isRecording: false,
  currentTime: 0,
  loopStart: 0,
  loopEnd: 16, // 16 bars default
  isLooping: false,
  bpm: 120,
  quantization: '1/16',
  tracks: [],
  selectedTrackId: null,
  
  // Transport actions
  setBPM: (bpm) => set({ bpm }),
  setQuantization: (quantization) => set({ quantization }),
  setPlaying: (playing) => set({ isPlaying: playing }),
  setRecording: (recording) => set({ isRecording: recording }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setLooping: (looping) => set({ isLooping: looping }),
  setLoopRange: (start, end) => set({ loopStart: start, loopEnd: end }),
  
  // Track management
  addTrack: (type, instrumentType) => {
    const track: Track = {
      id: `track-${++trackIdCounter}`,
      name: type === 'audio' ? `Audio ${trackIdCounter}` : `${instrumentType || 'Synth'} ${trackIdCounter}`,
      type,
      instrumentType: type === 'instrument' ? (instrumentType || 'synth') : undefined,
      volume: 0, // dB, 0 = unity
      pan: 0, // -1 to 1
      mute: false,
      solo: false,
      clips: [],
      effects: [],
    };
    set((state) => ({ tracks: [...state.tracks, track] }));
    return track;
  },
  
  removeTrack: (trackId) => {
    set((state) => ({
      tracks: state.tracks.filter((t) => t.id !== trackId),
      selectedTrackId: state.selectedTrackId === trackId ? null : state.selectedTrackId,
    }));
  },
  
  selectTrack: (trackId) => set({ selectedTrackId: trackId }),
  
  updateTrack: (trackId, updates) => {
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === trackId ? { ...t, ...updates } : t
      ),
    }));
  },
  
  // Clip management
  addClip: (trackId, clip) => {
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === trackId
          ? { ...t, clips: [...t.clips, { ...clip, id: clip.id || `clip-${++clipIdCounter}` }] }
          : t
      ),
    }));
  },
  
  removeClip: (trackId, clipId) => {
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === trackId
          ? { ...t, clips: t.clips.filter((c) => c.id !== clipId) }
          : t
      ),
    }));
  },
  
  updateClip: (trackId, clipId, updates) => {
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === trackId
          ? { ...t, clips: t.clips.map((c) => (c.id === clipId ? { ...c, ...updates } : c)) }
          : t
      ),
    }));
  },
  
  // Effects
  addEffect: (trackId, effectType) => {
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === trackId
          ? { ...t, effects: [...t.effects, { type: effectType, enabled: true }] }
          : t
      ),
    }));
  },
  
  removeEffect: (trackId, effectIndex) => {
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === trackId
          ? { ...t, effects: t.effects.filter((_, i) => i !== effectIndex) }
          : t
      ),
    }));
  },
  
  reorderEffects: (trackId, fromIndex, toIndex) => {
    set((state) => {
      const track = state.tracks.find((t) => t.id === trackId);
      if (!track) return state;
      
      const newEffects = [...track.effects];
      const [moved] = newEffects.splice(fromIndex, 1);
      newEffects.splice(toIndex, 0, moved);
      
      return {
        tracks: state.tracks.map((t) =>
          t.id === trackId ? { ...t, effects: newEffects } : t
        ),
      };
    });
  },
}));


















