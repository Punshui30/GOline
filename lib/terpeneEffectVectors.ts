/**
 * Deterministic Terpene → Effect Vector Math
 * 
 * Canonical, auditable model for demo and production.
 * No vibes. No ML hand-waving. Pure deterministic equations.
 */

import { CanonicalChemotype } from '@/data/canonicalChemotypes';

/**
 * Terpene maximum caps (conservative, literature-aligned)
 * Used for normalization
 */
const TERPENE_MAX_CAPS: { [key: string]: number } = {
  myrcene: 1.0,      // 1.0%
  limonene: 0.8,     // 0.8%
  pinene: 0.6,       // 0.6%
  linalool: 0.4,     // 0.4%
  caryophyllene: 0.6, // 0.6%
  terpinolene: 0.7,  // 0.7%
  humulene: 0.3,     // 0.3% (estimated)
};

/**
 * Normalize terpene percentage by weight
 * norm(t) = min(t / terpeneMax[t], 1)
 */
function normalizeTerpene(terpeneName: string, value: number): number {
  const max = TERPENE_MAX_CAPS[terpeneName] || 1.0;
  return Math.min(value / max, 1.0);
}

/**
 * Get normalized terpene value from chemotype
 * Terpenes are stored as percentages by weight (e.g., 0.62 = 0.62%)
 */
function getNormalizedTerpene(chemotype: CanonicalChemotype, terpeneName: string): number {
  const percentage = chemotype.terpenes[terpeneName] || 0;
  // Terpenes are already stored as percentages, normalize by max cap
  return normalizeTerpene(terpeneName, percentage);
}

/**
 * Effect Vector: Energy
 * energy = 0.35 * norm(limonene) + 0.30 * norm(pinene) + 0.20 * norm(terpinolene) - 0.25 * norm(myrcene)
 */
export function computeEnergyVector(chemotype: CanonicalChemotype): number {
  const limonene = getNormalizedTerpene(chemotype, 'limonene');
  const pinene = getNormalizedTerpene(chemotype, 'pinene');
  const terpinolene = getNormalizedTerpene(chemotype, 'terpinolene');
  const myrcene = getNormalizedTerpene(chemotype, 'myrcene');
  
  const energy = (
    0.35 * limonene +
    0.30 * pinene +
    0.20 * terpinolene -
    0.25 * myrcene
  );
  
  return Math.max(0, Math.min(1, energy));
}

/**
 * Effect Vector: Cognitive Clarity
 * clarity = 0.40 * norm(pinene) + 0.25 * norm(limonene) - 0.20 * norm(myrcene) - 0.15 * norm(linalool) + interactions
 */
export function computeClarityVector(chemotype: CanonicalChemotype): number {
  const pinene = getNormalizedTerpene(chemotype, 'pinene');
  const limonene = getNormalizedTerpene(chemotype, 'limonene');
  const myrcene = getNormalizedTerpene(chemotype, 'myrcene');
  const linalool = getNormalizedTerpene(chemotype, 'linalool');
  
  const baseClarity = (
    0.40 * pinene +
    0.25 * limonene -
    0.20 * myrcene -
    0.15 * linalool
  );

  // Apply interaction effects
  const interactions = computeTerpeneInteractions(chemotype);
  const clarity = baseClarity + interactions.clarityModifier;
  
  return Math.max(0, Math.min(1, clarity));
}

/**
 * Effect Vector: Body Relaxation
 * body = 0.45 * norm(myrcene) + 0.30 * norm(linalool) + 0.15 * norm(caryophyllene)
 */
export function computeBodyRelaxationVector(chemotype: CanonicalChemotype): number {
  const myrcene = getNormalizedTerpene(chemotype, 'myrcene');
  const linalool = getNormalizedTerpene(chemotype, 'linalool');
  const caryophyllene = getNormalizedTerpene(chemotype, 'caryophyllene');
  
  const body = (
    0.45 * myrcene +
    0.30 * linalool +
    0.15 * caryophyllene
  );
  
  return Math.max(0, Math.min(1, body));
}

/**
 * Terpene Interaction Effects
 * Apply numeric interaction penalties and bonuses
 */
function computeTerpeneInteractions(chemotype: CanonicalChemotype): {
  anxietyModifier: number;
  clarityModifier: number;
  durationModifier: number;
} {
  const pinene = getNormalizedTerpene(chemotype, 'pinene');
  const myrcene = getNormalizedTerpene(chemotype, 'myrcene');
  const linalool = getNormalizedTerpene(chemotype, 'linalool');
  const caryophyllene = getNormalizedTerpene(chemotype, 'caryophyllene');
  const terpinolene = getNormalizedTerpene(chemotype, 'terpinolene');
  const thc = chemotype.cannabinoids.THC || 0;
  const normThc = Math.min(thc / 30, 1.0); // Normalize THC to 0-1 (30% = max)

  // Pinene ↔ Myrcene antagonism (reduces clarity when both are high)
  const pineneMyrceneAntagonism = -0.15 * Math.min(pinene, myrcene) * Math.min(pinene, myrcene);

  // Linalool + Caryophyllene anxiety dampening (synergy)
  const linaloolCaryoDampening = -0.20 * Math.min(linalool, caryophyllene);

  // Terpinolene + THC anxiety amplification (synergy)
  const terpinoleneThcAmplification = 0.25 * terpinolene * normThc;

  return {
    anxietyModifier: linaloolCaryoDampening + terpinoleneThcAmplification,
    clarityModifier: pineneMyrceneAntagonism,
    durationModifier: 0, // No interaction effects on duration currently
  };
}

/**
 * Effect Vector: Anxiety Risk
 * anxietyRisk = 0.40 * norm(terpinolene) + 0.30 * norm(limonene) + 0.20 * norm(thcAboveBaseline) - 0.35 * norm(linalool) - 0.25 * norm(caryophyllene) + interactions
 */
export function computeAnxietyRiskVector(chemotype: CanonicalChemotype): number {
  const terpinolene = getNormalizedTerpene(chemotype, 'terpinolene');
  const limonene = getNormalizedTerpene(chemotype, 'limonene');
  const linalool = getNormalizedTerpene(chemotype, 'linalool');
  const caryophyllene = getNormalizedTerpene(chemotype, 'caryophyllene');
  
  // THC above baseline (assume baseline is 15%)
  const thc = chemotype.cannabinoids.THC || 0;
  const thcAboveBaseline = Math.max(0, (thc - 15) / 15); // Normalize: 15% = 0, 30% = 1
  const normThc = Math.min(thcAboveBaseline, 1.0);
  
  const baseAnxietyRisk = (
    0.40 * terpinolene +
    0.30 * limonene +
    0.20 * normThc -
    0.35 * linalool -
    0.25 * caryophyllene
  );

  // Apply interaction effects
  const interactions = computeTerpeneInteractions(chemotype);
  const anxietyRisk = baseAnxietyRisk + interactions.anxietyModifier;
  
  return Math.max(0, Math.min(1, anxietyRisk));
}

/**
 * Effect Vector: Duration
 * duration = 0.40 * norm(myrcene) + 0.30 * norm(caryophyllene) + 0.20 * norm(humulene)
 */
export function computeDurationVector(chemotype: CanonicalChemotype): number {
  const myrcene = getNormalizedTerpene(chemotype, 'myrcene');
  const caryophyllene = getNormalizedTerpene(chemotype, 'caryophyllene');
  const humulene = getNormalizedTerpene(chemotype, 'humulene');
  
  const duration = (
    0.40 * myrcene +
    0.30 * caryophyllene +
    0.20 * humulene
  );
  
  return Math.max(0, Math.min(1, duration));
}

/**
 * Effect Vector: Mood Elevation
 * mood = 0.35 * norm(limonene) + 0.25 * norm(caryophyllene) + 0.20 * norm(pinene) - 0.20 * norm(myrcene)
 */
export function computeMoodElevationVector(chemotype: CanonicalChemotype): number {
  const limonene = getNormalizedTerpene(chemotype, 'limonene');
  const caryophyllene = getNormalizedTerpene(chemotype, 'caryophyllene');
  const pinene = getNormalizedTerpene(chemotype, 'pinene');
  const myrcene = getNormalizedTerpene(chemotype, 'myrcene');
  
  const mood = (
    0.35 * limonene +
    0.25 * caryophyllene +
    0.20 * pinene -
    0.20 * myrcene
  );
  
  return Math.max(0, Math.min(1, mood));
}

/**
 * Effect Vector: Sedation Risk
 * sedation = 0.50 * norm(myrcene) + 0.30 * norm(linalool) + 0.20 * norm(humulene)
 */
export function computeSedationRiskVector(chemotype: CanonicalChemotype): number {
  const myrcene = getNormalizedTerpene(chemotype, 'myrcene');
  const linalool = getNormalizedTerpene(chemotype, 'linalool');
  const humulene = getNormalizedTerpene(chemotype, 'humulene');
  
  const sedation = (
    0.50 * myrcene +
    0.30 * linalool +
    0.20 * humulene
  );
  
  return Math.max(0, Math.min(1, sedation));
}

/**
 * Compute all effect vectors for a chemotype
 */
export interface EffectVectors {
  energy: number;
  clarity: number;
  bodyRelaxation: number;
  anxietyRisk: number;
  duration: number;
  moodElevation: number;
  sedationRisk: number;
}

export function computeEffectVectors(chemotype: CanonicalChemotype): EffectVectors {
  return {
    energy: computeEnergyVector(chemotype),
    clarity: computeClarityVector(chemotype),
    bodyRelaxation: computeBodyRelaxationVector(chemotype),
    anxietyRisk: computeAnxietyRiskVector(chemotype),
    duration: computeDurationVector(chemotype),
    moodElevation: computeMoodElevationVector(chemotype),
    sedationRisk: computeSedationRiskVector(chemotype),
  };
}

