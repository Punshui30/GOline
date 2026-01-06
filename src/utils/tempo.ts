/**
 * Tempo and quantization utilities for the DAW
 * Handles BPM calculations, grid snapping, and time conversions
 */

export type Quantization = '1/4' | '1/8' | '1/16' | '1/32';

/**
 * Convert quantization string to beats per bar
 */
export function quantizationToBeats(quantization: Quantization): number {
  const map: Record<Quantization, number> = {
    '1/4': 4,
    '1/8': 8,
    '1/16': 16,
    '1/32': 32,
  };
  return map[quantization];
}

/**
 * Convert bars to seconds based on BPM
 */
export function barsToSeconds(bars: number, bpm: number): number {
  const beatsPerBar = 4; // Standard 4/4 time
  const beats = bars * beatsPerBar;
  const secondsPerBeat = 60 / bpm;
  return beats * secondsPerBeat;
}

/**
 * Convert seconds to bars based on BPM
 */
export function secondsToBars(seconds: number, bpm: number): number {
  const beatsPerBar = 4;
  const secondsPerBeat = 60 / bpm;
  const beats = seconds / secondsPerBeat;
  return beats / beatsPerBar;
}

/**
 * Snap a time value to the nearest grid position
 */
export function snapToGrid(
  time: number,
  bpm: number,
  quantization: Quantization
): number {
  const beatsPerBar = 4;
  const gridDivision = quantizationToBeats(quantization);
  const gridSize = beatsPerBar / gridDivision; // in bars
  
  return Math.round(time / gridSize) * gridSize;
}

/**
 * Calculate the number of grid lines per bar
 */
export function getGridLinesPerBar(quantization: Quantization): number {
  return quantizationToBeats(quantization);
}

/**
 * Calculate grid positions for a given time range
 */
export function getGridPositions(
  startBar: number,
  endBar: number,
  quantization: Quantization
): number[] {
  const gridSize = 4 / quantizationToBeats(quantization);
  const positions: number[] = [];
  
  for (let pos = startBar; pos <= endBar; pos += gridSize) {
    positions.push(pos);
  }
  
  return positions;
}

/**
 * Format time in bars/beats notation
 */
export function formatBarsBeats(bars: number): string {
  const wholeBars = Math.floor(bars);
  const beats = (bars - wholeBars) * 4;
  const wholeBeats = Math.floor(beats);
  const sixteenths = Math.floor((beats - wholeBeats) * 4);
  
  return `${wholeBars}:${wholeBeats.toString().padStart(2, '0')}:${sixteenths.toString().padStart(2, '0')}`;
}

/**
 * Calculate tap tempo from tap intervals
 */
export function calculateTapTempo(tapTimes: number[]): number {
  if (tapTimes.length < 2) return 120;
  
  const intervals: number[] = [];
  for (let i = 1; i < tapTimes.length; i++) {
    intervals.push(tapTimes[i] - tapTimes[i - 1]);
  }
  
  const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const bpm = 60000 / avgInterval; // Convert ms to BPM
  
  // Clamp to reasonable range
  return Math.max(60, Math.min(200, Math.round(bpm)));
}


















