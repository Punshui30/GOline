# Kiwi Garage Band

A fully functional browser-based digital audio workstation similar to GarageBand, built with React, TypeScript, Tone.js, and Web Audio API.

## Features

### ✅ Core Functionality

- **Multi-track Timeline**: Add multiple audio and instrument tracks with waveform visualization
- **Audio Recording**: Record audio from microphone and add as clips to tracks
- **Playback Engine**: Synchronized playback using Tone.js Transport
- **Robust Tempo Control**:
  - Global BPM slider (60-200 BPM)
  - Tap tempo button
  - Quantization settings (1/4, 1/8, 1/16, 1/32 notes)
  - Grid snapping for clips
  - Real-time BPM changes without clicks or drift

### 🎹 Instruments

- **PolySynth**: Polyphonic synthesizer with piano-style keyboard interface
- **Drum Machine**: 16-step sequencer with kick, snare, hihat, and openhat samples

### 🎛️ Effects

Per-track effects chain with:
- EQ
- Compressor
- Reverb
- Delay

Effects can be toggled, reordered, and removed.

### 🎚️ Mixer

- Volume fader per track (dB control)
- Pan control (-1 to 1)
- Mute/Solo buttons
- Visual feedback for track states

### 📤 Export

- Export entire project to WAV file
- Offline rendering of master output

## Tech Stack

- **React + TypeScript**: UI framework
- **Tone.js**: Audio synthesis, sequencing, Transport, tempo control
- **Web Audio API**: Low-level audio processing
- **Zustand**: Fast state management
- **Next.js**: Framework and routing

## Getting Started

### Installation

Dependencies are already installed. If you need to reinstall:

```bash
pnpm install
```

### Running the DAW

1. Start the development server:
```bash
pnpm run dev
```

2. Navigate to `/daw` in your browser

3. **Important**: Audio context requires user interaction. Click the Play button to initialize the audio engine.

## Usage Guide

### Adding Tracks

- Click "+ Audio Track" to add an audio track for recording
- Click "+ Synth" to add a polyphonic synthesizer track
- Click "+ Drums" to add a drum machine track

### Recording Audio

1. Select or create an audio track
2. Click the "⏺ Record" button
3. Speak or play into your microphone
4. Click "⏹ Stop Recording" when done
5. The recording will appear as a clip on the selected track

### Playing Instruments

- **Synth**: Click the piano keys to play notes. Multiple keys can be played simultaneously.
- **Drum Machine**: Click the step buttons to create a pattern. The sequencer will loop when playback is active.

### Transport Controls

- **Play/Pause**: Start or pause playback
- **Stop**: Stop playback and return to beginning
- **Loop**: Enable/disable looping
- **BPM**: Adjust tempo (60-200 BPM)
- **Tap Tempo**: Click repeatedly to set BPM from tap intervals
- **Grid**: Select quantization (1/4, 1/8, 1/16, 1/32)

### Timeline

- **Grid Lines**: Visual guide for timing (blue lines on beats)
- **Playhead**: Red line showing current playback position
- **Clips**: Drag clips to reposition (they snap to grid)
- **Waveforms**: Audio clips show waveform visualization

### Mixer

- **Volume**: Vertical fader controls track volume in dB
- **Pan**: Horizontal slider controls stereo panning
- **Mute (M)**: Silences the track
- **Solo (S)**: Isolates the track (others muted)

### Effects

1. Select a track
2. Click "+ [Effect Name]" to add an effect
3. Effects process in order (top to bottom)
4. Use ↑/↓ buttons to reorder effects
5. Click × to remove an effect

### Exporting

1. Click "📥 Export WAV" button
2. The project will be rendered and downloaded as a WAV file
3. File name includes timestamp

## Architecture

### File Structure

```
src/
├── audio/
│   └── engine.ts          # Core audio engine with Tone.js
├── components/
│   ├── DAW/
│   │   └── DAW.tsx        # Main DAW component
│   ├── Transport/
│   │   └── TransportControls.tsx
│   ├── Timeline/
│   │   ├── Timeline.tsx
│   │   └── WaveformView.tsx
│   ├── Tracks/
│   │   ├── TrackList.tsx
│   │   └── TrackItem.tsx
│   ├── Instruments/
│   │   ├── PolySynth.tsx
│   │   └── DrumMachine.tsx
│   ├── Effects/
│   │   ├── EffectsChain.tsx
│   │   └── EffectItem.tsx
│   ├── Mixer/
│   │   ├── Mixer.tsx
│   │   └── MixerChannel.tsx
│   ├── Recording/
│   │   └── RecordingControls.tsx
│   └── Export/
│       └── ExportButton.tsx
├── state/
│   └── useDAWStore.ts     # Zustand store
├── types/
│   └── daw.ts             # TypeScript types
└── utils/
    └── tempo.ts           # Tempo and quantization utilities
```

### Key Concepts

#### Audio Engine

The `AudioEngine` class manages:
- Tone.js Transport synchronization
- Track audio nodes (gain, pan, effects)
- Clip scheduling
- Recording
- Export rendering

#### State Management

Zustand store (`useDAWStore`) manages:
- Transport state (playing, recording, current time)
- Tempo (BPM, quantization)
- Tracks and clips
- Effects chains
- Mixer settings

#### Tempo Synchronization

All audio is synchronized through Tone.js Transport:
- BPM changes update Transport in real-time
- Clips are scheduled using Transport time notation
- Grid snapping uses quantization settings
- Playhead position tracks Transport position

## Future Enhancements

Potential additions for a full GarageBand-level DAW:

- **MIDI Import/Export**: Load and save MIDI files
- **Time-Stretching**: WASM-based pitch-independent tempo adjustment (RubberBand.js, SoundTouch.js)
- **More Instruments**: Additional synth types, sampler
- **Piano Roll Editor**: Visual MIDI editing
- **Automation**: Parameter automation curves
- **Live Loops**: Loop recording and playback
- **AI Stem Separation**: Separate audio into stems
- **Collaboration**: Real-time collaboration features
- **Plugin Support**: VST/AU plugin hosting (via WebAssembly)

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (may require user gesture for audio)

## Notes

- Audio context requires user interaction (browser security)
- Microphone permissions required for recording
- Export functionality uses offline rendering (may take time for long projects)
- All audio processing happens in the browser (no server required)

## About

**Kiwi Garage Band** - A browser-based DAW that brings professional music production capabilities to the web. Built with modern web technologies for low-latency audio processing and real-time tempo synchronization.

## License

Part of the Daniel Simmonds Portfolio project.

