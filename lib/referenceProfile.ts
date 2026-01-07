/**
 * Reference Profile Comparison
 * 
 * Stateless, session-only chemistry profile comparison.
 * No persistence, no memory, no saved preferences.
 */

import { OutcomeIntent } from './goOutcomeEngine';
import { computeEffectVectors } from './terpeneEffectVectors';
import { type CanonicalChemotype } from '@/data/canonicalChemotypes';

/**
 * Reference Profile Input
 * Temporary chemistry profile provided by user for comparison
 */
export interface ReferenceProfile {
  thc: number; // THC percentage
  cbd: number; // CBD percentage
  terpenes: {
    myrcene?: number;
    limonene?: number;
    pinene?: number;
    linalool?: number;
    caryophyllene?: number;
    terpinolene?: number;
    humulene?: number;
  };
}

/**
 * Convert Reference Profile to OutcomeIntent
 * 
 * Normalizes the reference chemistry into effect vectors,
 * then derives intent constraints from those vectors.
 * 
 * This treats the reference profile as a target effect/chemistry.
 */
export function referenceProfileToIntent(reference: ReferenceProfile): OutcomeIntent {
  // Create a temporary chemotype-like object for effect vector computation
  const tempChemotype: CanonicalChemotype = {
    id: 'reference',
    displayName: 'Reference Profile',
    description: 'User-provided reference chemistry',
    cannabinoids: {
      THC: reference.thc,
      CBD: reference.cbd,
    },
    terpenes: {
      myrcene: reference.terpenes.myrcene || 0,
      limonene: reference.terpenes.limonene || 0,
      pinene: reference.terpenes.pinene || 0,
      linalool: reference.terpenes.linalool || 0,
      caryophyllene: reference.terpenes.caryophyllene || 0,
      terpinolene: reference.terpenes.terpinolene || 0,
      humulene: reference.terpenes.humulene || 0,
    },
    totalTerpeneLoad: Object.values(reference.terpenes).reduce((sum, val) => sum + (val || 0), 0),
    volatility: 'medium',
    sedationRisk: 'medium',
    dataConfidence: 'canonical' as const,
  };

  // Compute effect vectors from reference chemistry
  const vectors = computeEffectVectors(tempChemotype);

  // Derive intent constraints from effect vectors
  // Higher energy vector → higher activation target
  // Higher anxiety risk → higher anxiety sensitivity
  // Higher clarity → higher cognitive endurance
  // Lower overshoot tolerance for high-intensity profiles

  const activationTarget = Math.max(0.1, Math.min(0.9, vectors.energy * 0.8 + (1 - vectors.bodyRelaxation) * 0.2));
  const anxietySensitivity = Math.max(0.1, Math.min(0.9, vectors.anxietyRisk * 0.7 + (reference.thc > 20 ? 0.2 : 0)));
  const cognitiveEndurance = Math.max(0.1, Math.min(0.9, vectors.clarity * 0.6 + vectors.duration * 0.4));
  const overshootTolerance = Math.max(0.1, Math.min(0.9, 0.5 - (vectors.anxietyRisk * 0.3)));

  return {
    activation: activationTarget, // Map activationTarget to activation
    activationTarget,
    anxietySensitivity,
    cognitiveEndurance,
    overshootTolerance,
    avoidSedation: false, // Default to false for reference profiles
    physicalRelief: vectors.bodyRelaxation > 0.6 ? 0.7 : undefined,
    cognitiveClarity: vectors.clarity > 0.6 ? 0.75 : undefined,
    functionalEnergy: vectors.energy > 0.5 && vectors.energy < 0.8 ? 0.6 : undefined,
    temporalOnset: vectors.duration > 0.5 ? 'moderate' : 'fast',
    durationPreference: vectors.duration > 0.5 ? 0.7 : 0.4,
  };
}

/**
 * Compute chemical similarity between reference profile and a chemotype
 * Returns a similarity score (0-1) based on terpene and cannabinoid alignment
 */
export function computeChemicalSimilarity(
  reference: ReferenceProfile,
  chemotype: {
    cannabinoids: { THC: number; CBD?: number };
    terpenes: { [key: string]: number };
  }
): number {
  // THC similarity (weighted 30%)
  const thcDiff = Math.abs(reference.thc - chemotype.cannabinoids.THC);
  const thcSimilarity = Math.max(0, 1 - (thcDiff / 30)); // 30% THC range tolerance

  // CBD similarity (weighted 10%)
  const cbdDiff = Math.abs((reference.cbd || 0) - (chemotype.cannabinoids.CBD || 0));
  const cbdSimilarity = Math.max(0, 1 - (cbdDiff / 10)); // 10% CBD range tolerance

  // Terpene similarity (weighted 60%)
  const terpeneKeys = ['myrcene', 'limonene', 'pinene', 'linalool', 'caryophyllene', 'terpinolene', 'humulene'];
  let terpeneSimilaritySum = 0;
  let terpeneCount = 0;

  terpeneKeys.forEach(key => {
    const refValue = reference.terpenes[key as keyof typeof reference.terpenes] || 0;
    const chemValue = chemotype.terpenes[key] || 0;

    if (refValue > 0 || chemValue > 0) {
      const diff = Math.abs(refValue - chemValue);
      const maxValue = Math.max(refValue, chemValue, 0.1); // Avoid division by zero
      const similarity = Math.max(0, 1 - (diff / maxValue));
      terpeneSimilaritySum += similarity;
      terpeneCount++;
    }
  });

  const terpeneSimilarity = terpeneCount > 0 ? terpeneSimilaritySum / terpeneCount : 0.5;

  // Weighted combination
  return (thcSimilarity * 0.3) + (cbdSimilarity * 0.1) + (terpeneSimilarity * 0.6);
}

