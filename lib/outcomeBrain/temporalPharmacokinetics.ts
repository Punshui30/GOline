/**
 * Temporal Pharmacokinetic Reasoning Layer
 * 
 * Extends resolution to explicitly consider onset, peak, and tail phases.
 * Allows blends to hand off dominant effects over time.
 * 
 * This interacts with biphasic modeling to predict temporal effects.
 */

import { CanonicalCultivar } from '@/data/canonicalCultivars';
import { OutcomeIntent } from '../engine_core/legacy_compat';
import { BlendDoseAnalysis } from './biphasicModeling';

export interface TemporalProfile {
  onsetPhase: {
    dominantEffects: string[];
    duration: 'fast' | 'moderate' | 'slow';
    estimatedMinutes: number;
  };
  peakPhase: {
    dominantEffects: string[];
    duration: 'short' | 'moderate' | 'long';
    estimatedMinutes: number;
  };
  tailPhase: {
    dominantEffects: string[];
    duration: 'short' | 'moderate' | 'long';
    estimatedMinutes: number;
  };
  transitionPoints: Array<{
    phase: 'onset-to-peak' | 'peak-to-tail';
    estimatedMinutes: number;
    effectShift: string;
  }>;
}

/**
 * Predict temporal pharmacokinetic profile for a blend
 * Considers terpene volatility, cannabinoid onset, and blend composition
 */
export function predictTemporalProfile(
  cultivars: CanonicalCultivar[],
  ratios: number[],
  doseAnalysis: BlendDoseAnalysis,
  intent: OutcomeIntent
): TemporalProfile {
  const aggregateTerpenes = doseAnalysis.aggregateTerpenes;

  // Terpene volatility ranking (lower = faster onset)
  const volatilityRanking: { [terpene: string]: number } = {
    'terpinolene': 1, // Fastest
    'limonene': 2,
    'pinene': 3,
    'ocimene': 4,
    'myrcene': 5,
    'caryophyllene': 6,
    'linalool': 7,
    'humulene': 8, // Slowest
  };

  // Compute weighted volatility (lower = faster overall onset)
  let weightedVolatility = 0;
  let totalTerpene = 0;
  for (const [terpene, value] of Object.entries(aggregateTerpenes)) {
    if (volatilityRanking[terpene]) {
      weightedVolatility += value * volatilityRanking[terpene];
      totalTerpene += value;
    }
  }
  const avgVolatility = totalTerpene > 0 ? weightedVolatility / totalTerpene : 5;

  // Determine onset speed
  let onsetDuration: TemporalProfile['onsetPhase']['duration'];
  let onsetMinutes: number;
  if (avgVolatility < 3) {
    onsetDuration = 'fast';
    onsetMinutes = 5;
  } else if (avgVolatility < 5) {
    onsetDuration = 'moderate';
    onsetMinutes = 15;
  } else {
    onsetDuration = 'slow';
    onsetMinutes = 30;
  }

  // Determine peak duration (based on blend complexity and saturation)
  const highMyrcene = aggregateTerpenes.myrcene > 0.25;
  const highLinalool = aggregateTerpenes.linalool > 0.20;
  const hasSedatingTerpenes = highMyrcene || highLinalool;

  let peakDuration: TemporalProfile['peakPhase']['duration'];
  let peakMinutes: number;
  if (hasSedatingTerpenes) {
    peakDuration = 'long';
    peakMinutes = 120;
  } else if (cultivars.length > 2) {
    peakDuration = 'moderate';
    peakMinutes = 90;
  } else {
    peakDuration = cultivars.length === 1 ? 'short' : 'moderate';
    peakMinutes = cultivars.length === 1 ? 60 : 90;
  }

  // Determine tail duration
  const tailDuration: TemporalProfile['tailPhase']['duration'] = hasSedatingTerpenes ? 'long' : 'moderate';
  const tailMinutes = hasSedatingTerpenes ? 180 : 120;

  // Identify dominant effects per phase
  // Onset: dominated by volatile terpenes (limonene, pinene, terpinolene)
  const onsetEffects: string[] = [];
  if (aggregateTerpenes.limonene > 0.15) onsetEffects.push('energizing');
  if (aggregateTerpenes.pinene > 0.15) onsetEffects.push('focus');
  if (aggregateTerpenes.terpinolene > 0.08) onsetEffects.push('uplifting');
  if (onsetEffects.length === 0) onsetEffects.push('subtle activation');

  // Peak: dominated by primary terpenes at mid/high zones
  const peakEffects: string[] = [];
  if (aggregateTerpenes.myrcene > 0.20) peakEffects.push('relaxation');
  if (aggregateTerpenes.linalool > 0.15) peakEffects.push('calm');
  if (aggregateTerpenes.caryophyllene > 0.18) peakEffects.push('physical ease');
  if (aggregateTerpenes.limonene > 0.20) peakEffects.push('sustained energy');
  if (peakEffects.length === 0) peakEffects.push('balanced');

  // Tail: dominated by slower, longer-lasting terpenes (myrcene, linalool, caryophyllene)
  const tailEffects: string[] = [];
  if (aggregateTerpenes.myrcene > 0.20 || aggregateTerpenes.linalool > 0.15) tailEffects.push('calm transition');
  if (aggregateTerpenes.caryophyllene > 0.18) tailEffects.push('body comfort');
  if (tailEffects.length === 0) tailEffects.push('gradual fade');

  // Handle multi-phase intent (inspired now, calm later)
  // Handle multi-phase intent (inspired now, calm later)
  if (intent.temporalOnset !== undefined && intent.temporalOnset < 0.5) {
    // Fast onset preference - emphasize volatile terpenes in onset
    if (aggregateTerpenes.limonene < 0.12 && aggregateTerpenes.pinene < 0.10) {
      onsetEffects.unshift('rapid activation');
    }
  }

  if (intent.durationPreference !== undefined && intent.durationPreference === 'extended') {
    // Long duration preference - emphasize sedating terpenes in tail
    if (!hasSedatingTerpenes) {
      tailEffects.push('extended relaxation');
    }
  }

  // Transition points
  const transitionPoints: TemporalProfile['transitionPoints'] = [
    {
      phase: 'onset-to-peak',
      estimatedMinutes: onsetMinutes,
      effectShift: `${onsetEffects.join(', ')} → ${peakEffects.join(', ')}`,
    },
    {
      phase: 'peak-to-tail',
      estimatedMinutes: onsetMinutes + peakMinutes,
      effectShift: `${peakEffects.join(', ')} → ${tailEffects.join(', ')}`,
    },
  ];

  return {
    onsetPhase: {
      dominantEffects: onsetEffects,
      duration: onsetDuration,
      estimatedMinutes: onsetMinutes,
    },
    peakPhase: {
      dominantEffects: peakEffects,
      duration: peakDuration,
      estimatedMinutes: peakMinutes,
    },
    tailPhase: {
      dominantEffects: tailEffects,
      duration: tailDuration,
      estimatedMinutes: tailMinutes,
    },
    transitionPoints,
  };
}










