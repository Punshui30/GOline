/**
 * Composition-Level Effects
 * 
 * When blending cultivars, apply:
 * - Diminishing returns for overlapping dominant terpenes
 * - Anxiety compounding across layers
 * - Smoothing bonuses when bridge cultivars are present
 * - Recalculate vectors at the blend level
 */

import { CanonicalChemotype } from '@/data/canonicalChemotypes';
import { computeEffectVectors, type EffectVectors } from './terpeneEffectVectors';

export interface BlendComposition {
  cultivars: CanonicalChemotype[];
  ratios: number[]; // Percentages (0-100)
}

/**
 * Compute blend-level effect vectors from individual cultivar vectors
 * Applies composition-level effects
 */
export function computeBlendEffectVectors(composition: BlendComposition): EffectVectors {
  const { cultivars, ratios } = composition;
  
  // Weighted average of individual vectors
  const weightedVectors: EffectVectors = {
    energy: 0,
    clarity: 0,
    bodyRelaxation: 0,
    anxietyRisk: 0,
    duration: 0,
    moodElevation: 0,
    sedationRisk: 0,
  };

  // Compute individual vectors and apply ratios
  for (let i = 0; i < cultivars.length; i++) {
    const cultivar = cultivars[i];
    const ratio = ratios[i] / 100;
    const vectors = computeEffectVectors(cultivar);

    weightedVectors.energy += vectors.energy * ratio;
    weightedVectors.clarity += vectors.clarity * ratio;
    weightedVectors.bodyRelaxation += vectors.bodyRelaxation * ratio;
    weightedVectors.anxietyRisk += vectors.anxietyRisk * ratio;
    weightedVectors.duration += vectors.duration * ratio;
    weightedVectors.moodElevation += vectors.moodElevation * ratio;
    weightedVectors.sedationRisk += vectors.sedationRisk * ratio;
  }

  // Apply composition-level effects
  const dominantTerpeneOverlap = computeDominantTerpeneOverlap(cultivars);
  const anxietyCompounding = computeAnxietyCompounding(cultivars, ratios);
  const bridgeSmoothing = computeBridgeSmoothing(cultivars);

  // Diminishing returns for overlapping dominant terpenes
  const overlapPenalty = dominantTerpeneOverlap * 0.15; // Max 15% penalty
  weightedVectors.energy *= (1 - overlapPenalty);
  weightedVectors.clarity *= (1 - overlapPenalty);
  weightedVectors.moodElevation *= (1 - overlapPenalty);

  // Anxiety compounding (anxiety risk increases non-linearly with multiple high-anxiety cultivars)
  weightedVectors.anxietyRisk = Math.min(1, weightedVectors.anxietyRisk + anxietyCompounding);

  // Bridge smoothing (reduces anxiety and improves balance)
  weightedVectors.anxietyRisk = Math.max(0, weightedVectors.anxietyRisk - bridgeSmoothing);
  weightedVectors.clarity = Math.min(1, weightedVectors.clarity + bridgeSmoothing * 0.1);

  // Clamp all vectors
  return {
    energy: Math.max(0, Math.min(1, weightedVectors.energy)),
    clarity: Math.max(0, Math.min(1, weightedVectors.clarity)),
    bodyRelaxation: Math.max(0, Math.min(1, weightedVectors.bodyRelaxation)),
    anxietyRisk: Math.max(0, Math.min(1, weightedVectors.anxietyRisk)),
    duration: Math.max(0, Math.min(1, weightedVectors.duration)),
    moodElevation: Math.max(0, Math.min(1, weightedVectors.moodElevation)),
    sedationRisk: Math.max(0, Math.min(1, weightedVectors.sedationRisk)),
  };
}

/**
 * Compute dominant terpene overlap penalty
 * High overlap = diminishing returns
 */
function computeDominantTerpeneOverlap(cultivars: CanonicalChemotype[]): number {
  if (cultivars.length < 2) return 0;

  // Find dominant terpene for each cultivar
  const dominantTerpenes = cultivars.map(cv => {
    const terpenes = Object.entries(cv.terpenes);
    if (terpenes.length === 0) return null;
    return terpenes.reduce((max, [name, value]) => 
      value > (max[1] || 0) ? [name, value] : max
    )[0];
  });

  // Count overlaps
  const overlapCount = dominantTerpenes.filter((t, i, arr) => 
    t !== null && arr.filter(x => x === t).length > 1
  ).length;

  return Math.min(1, overlapCount / cultivars.length);
}

/**
 * Compute anxiety compounding effect
 * Multiple high-anxiety cultivars compound risk
 */
function computeAnxietyCompounding(cultivars: CanonicalChemotype[], ratios: number[]): number {
  let compounding = 0;
  const anxietyThreshold = 0.6; // High anxiety threshold

  for (let i = 0; i < cultivars.length; i++) {
    const vectors = computeEffectVectors(cultivars[i]);
    const ratio = ratios[i] / 100;
    
    if (vectors.anxietyRisk > anxietyThreshold) {
      // Compounding increases with number of high-anxiety cultivars
      compounding += (vectors.anxietyRisk - anxietyThreshold) * ratio * 0.2;
    }
  }

  return Math.min(0.3, compounding); // Cap at 30% additional risk
}

/**
 * Compute bridge cultivar smoothing bonus
 * Bridge cultivars (balanced hybrids) smooth out extremes
 */
function computeBridgeSmoothing(cultivars: CanonicalChemotype[]): number {
  let smoothing = 0;

  for (const cv of cultivars) {
    const vectors = computeEffectVectors(cv);
    
    // Bridge cultivars have moderate values across all vectors
    const isBridge = 
      vectors.energy > 0.3 && vectors.energy < 0.7 &&
      vectors.bodyRelaxation > 0.3 && vectors.bodyRelaxation < 0.7 &&
      vectors.anxietyRisk < 0.5;

    if (isBridge) {
      smoothing += 0.1; // Each bridge adds 10% smoothing
    }
  }

  return Math.min(0.3, smoothing); // Cap at 30% smoothing
}

