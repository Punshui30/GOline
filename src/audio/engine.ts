/**
 * Core audio engine using Tone.js and Web Audio API
 * Manages Transport, tracks, effects, and synchronization
 */

import * as Tone from 'tone';
import { useDAWStore } from '@/state/useDAWStore';
import { Track, Clip } from '@/types/daw';

class AudioEngine {
  private masterGain: Tone.Gain;
  private masterCompressor: Tone.Compressor;
  private tracks: Map<string, TrackAudioNode> = new Map();
  private recordingDestination: MediaRecorder | null = null;
  private recordingStream: MediaStreamAudioDestinationNode | null = null;
  private isInitialized = false;

  constructor() {
    // Master chain
    this.masterGain = new Tone.Gain(1);
    this.masterCompressor = new Tone.Compressor({
      threshold: -24,
      ratio: 4,
      attack: 0.003,
      release: 0.1,
    });
    
    this.masterGain.connect(this.masterCompressor);
    this.masterCompressor.toDestination();
  }

  /**
   * Initialize Tone.js context (must be called after user interaction)
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    await Tone.start();
    this.isInitialized = true;
    
    // Set up Transport
    Tone.Transport.bpm.value = useDAWStore.getState().bpm;
    
    // Update Transport position callback using requestAnimationFrame
    const updatePosition = () => {
      if (Tone.Transport.state === 'started') {
        const position = Tone.Transport.position.toString();
        const bars = this.transportPositionToBars(position);
        useDAWStore.getState().setCurrentTime(bars);
      }
      requestAnimationFrame(updatePosition);
    };
    updatePosition();
  }

  /**
   * Convert Transport position string to bars
   */
  private transportPositionToBars(position: string): number {
    const [bars, beats, sixteenths] = position.split(':').map(Number);
    return bars + beats / 4 + sixteenths / 16;
  }

  /**
   * Get or create audio node for a track
   */
  getTrackNode(trackId: string): TrackAudioNode {
    if (!this.tracks.has(trackId)) {
      const track = useDAWStore.getState().tracks.find((t) => t.id === trackId);
      if (!track) {
        throw new Error(`Track ${trackId} not found`);
      }
      
      const node = new TrackAudioNode(track, this.masterGain);
      this.tracks.set(trackId, node);
    }
    
    return this.tracks.get(trackId)!;
  }

  /**
   * Remove track audio node
   */
  removeTrackNode(trackId: string): void {
    const node = this.tracks.get(trackId);
    if (node) {
      node.dispose();
      this.tracks.delete(trackId);
    }
  }

  /**
   * Update track audio node when track state changes
   */
  updateTrackNode(trackId: string): void {
    const node = this.tracks.get(trackId);
    if (node) {
      const track = useDAWStore.getState().tracks.find((t) => t.id === trackId);
      if (track) {
        node.updateTrack(track);
      }
    }
  }

  /**
   * Start playback
   */
  async start(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    const state = useDAWStore.getState();
    const startTime = state.isLooping ? state.loopStart : 0;
    
    // Convert bars to Transport position
    const bars = Math.floor(startTime);
    const beats = Math.floor((startTime - bars) * 4);
    const sixteenths = Math.floor(((startTime - bars) * 4 - beats) * 4);
    
    Tone.Transport.position = `${bars}:${beats}:${sixteenths}`;
    
    // Schedule all clips
    this.scheduleClips();
    
    Tone.Transport.start();
    useDAWStore.getState().setPlaying(true);
  }

  /**
   * Stop playback
   */
  stop(): void {
    Tone.Transport.stop();
    Tone.Transport.cancel();
    Tone.Transport.position = '0:0:0';
    useDAWStore.getState().setPlaying(false);
    useDAWStore.getState().setCurrentTime(0);
  }

  /**
   * Pause playback
   */
  pause(): void {
    Tone.Transport.pause();
    useDAWStore.getState().setPlaying(false);
  }

  /**
   * Update BPM
   */
  setBPM(bpm: number): void {
    Tone.Transport.bpm.value = bpm;
  }

  /**
   * Schedule all clips for playback
   */
  private scheduleClips(): void {
    const state = useDAWStore.getState();
    
    state.tracks.forEach((track) => {
      const node = this.getTrackNode(track.id);
      node.scheduleClips(track.clips, state.bpm);
    });
  }

  /**
   * Start recording
   */
  async startRecording(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    try {
      // Create MediaStreamDestination from Tone.js context
      const context = Tone.getContext();
      if (context instanceof AudioContext) {
        this.recordingStream = context.createMediaStreamDestination();
        
        // Connect master output to recording stream
        this.masterCompressor.connect(this.recordingStream);
        
        this.recordingDestination = new MediaRecorder(this.recordingStream.stream);
        this.recordingDestination.start();
        
        useDAWStore.getState().setRecording(true);
      } else {
        throw new Error('AudioContext not available');
      }
    } catch (error) {
      console.error('Failed to start recording:', error);
      throw error;
    }
  }

  /**
   * Stop recording and return audio blob
   */
  async stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.recordingDestination) {
        reject(new Error('Not recording'));
        return;
      }
      
      this.recordingDestination.ondataavailable = (event) => {
        if (event.data.size > 0) {
          resolve(event.data);
        }
      };
      
      this.recordingDestination.onstop = () => {
        if (this.recordingStream) {
          this.masterCompressor.disconnect(this.recordingStream);
          this.recordingStream = null;
        }
        this.recordingDestination = null;
        useDAWStore.getState().setRecording(false);
      };
      
      this.recordingDestination.stop();
    });
  }

  /**
   * Export project to WAV
   */
  async exportToWAV(duration: number): Promise<Blob> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    // Create offline context for rendering
    const sampleRate = Tone.getContext().sampleRate;
    const offlineContext = new OfflineAudioContext(
      2, // stereo
      duration * sampleRate,
      sampleRate
    );
    
    // Recreate audio graph in offline context
    // This is a simplified version - full implementation would need to
    // recreate all tracks, effects, and clips in the offline context
    
    const offlineDestination = offlineContext.destination;
    const offlineGain = offlineContext.createGain();
    offlineGain.connect(offlineDestination);
    
    // Render
    const audioBuffer = await offlineContext.startRendering();
    
    // Convert to WAV
    return this.audioBufferToWAV(audioBuffer);
  }

  /**
   * Convert AudioBuffer to WAV Blob
   */
  private audioBufferToWAV(buffer: AudioBuffer): Blob {
    const length = buffer.length;
    const numberOfChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
    const view = new DataView(arrayBuffer);
    
    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * numberOfChannels * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numberOfChannels * 2, true);
    view.setUint16(32, numberOfChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * numberOfChannels * 2, true);
    
    // Convert float samples to 16-bit PCM
    let offset = 44;
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        offset += 2;
      }
    }
    
    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }

  /**
   * Dispose of all resources
   */
  dispose(): void {
    this.tracks.forEach((node) => node.dispose());
    this.tracks.clear();
    this.masterGain.dispose();
    this.masterCompressor.dispose();
  }
}

/**
 * Audio node for a single track
 */
class TrackAudioNode {
  private gain: Tone.Gain;
  private pan: Tone.Panner;
  private effects: Tone.ToneAudioNode[] = [];
  private scheduledEvents: Tone.ToneEvent[] = [];
  private track: Track;

  constructor(track: Track, masterGain: Tone.Gain) {
    this.track = track;
    this.gain = new Tone.Gain(Tone.dbToGain(track.volume));
    this.pan = new Tone.Panner(track.pan);
    
    // Connect chain: gain -> effects -> pan -> master
    this.gain.connect(this.pan);
    this.pan.connect(masterGain);
    
    this.updateTrack(track);
  }

  updateTrack(track: Track): void {
    this.track = track;
    this.gain.gain.value = Tone.dbToGain(track.volume);
    this.pan.pan.value = track.pan;
    
    // Update mute/solo (simplified - would need master routing for solo)
    if (track.mute) {
      this.gain.gain.value = 0;
    }
  }

  scheduleClips(clips: Clip[], bpm: number): void {
    // Cancel existing events
    this.scheduledEvents.forEach((event) => event.dispose());
    this.scheduledEvents = [];
    
    clips.forEach((clip) => {
      if (clip.audioBuffer) {
        const player = new Tone.Player(clip.audioBuffer);
        // Connect through track's gain/pan chain
        player.connect(this.gain);
        
        // Convert bars to Transport time notation
        const startBars = Math.floor(clip.start);
        const startBeats = Math.floor((clip.start - startBars) * 4);
        const startSixteenths = Math.floor(((clip.start - startBars) * 4 - startBeats) * 4);
        const startTime = `${startBars}:${startBeats}:${startSixteenths}`;
        
        const durationBars = clip.duration;
        const durationBeats = durationBars * 4;
        
        // Schedule with Transport
        player.start(startTime);
        player.stop(`+${durationBeats}n`);
        
        // Store for cleanup
        const stopEvent = new Tone.ToneEvent(() => {
          player.dispose();
        });
        stopEvent.start(`+${durationBeats}n`);
        this.scheduledEvents.push(stopEvent);
      }
    });
  }

  dispose(): void {
    this.scheduledEvents.forEach((event) => event.dispose());
    this.gain.dispose();
    this.pan.dispose();
    this.effects.forEach((effect) => effect.dispose());
  }
}

// Singleton instance
export const audioEngine = new AudioEngine();

