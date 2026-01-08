/**
 * Blend Mathematics Module
 * 
 * Pure mathematical functions for advanced blend evaluation:
 * - Biphasic compound response modeling
 * - Entourage modulation effects
 * - Vector-based blending with compound vectors
 * - Constraint-based evaluation (stability, risk, confidence)
 * 
 * This module strengthens the deterministic outcome logic by providing
 * additional evaluation layers that break ties and penalize unstable blends.
 */

import { STRAIN_LIBRARY, type Strain } from '@/lib/strainLibrary';

// --- TYPES ---

/**
 * CompoundVector represents a strain's compound profile as a normalized vector
 */
export interface CompoundVector {
  thc: number; // 0-1 normalized
  cbd: number; // 0-1 normalized
  myrcene: number; // 0-1 normalized
  limonene: number; // 0-1 normalized
  caryophyllene: number; // 0-1 normalized
  pinene: number; // 0-1 normalized
  humulene: number; // 0-1 normalized
  linalool: number; // 0-1 normalized
  terpinolene: number; // 0-1 normalized
}

/**
 * Biphasic window defines a dose range where a compound exhibits specific effects
 */
export interface BiphasicWindow {
  compound: string;
  min: number;
  max: number;
  effectType: 'primary' | 'secondary' | 'paradoxical';
  stability: number; // 0-1, how stable this window is
}

/**
 * EntourageModulation represents how compounds interact
 */
export interface EntourageModulation {
  compounds: string[];
  modulationType: 'synergistic' | 'antagonistic' | 'neutral';
  strength: number; // 0-1, how strong the modulation is
}

/**
 * BlendEvaluation result from constraint-based evaluation
 */
export interface BlendEvaluation {
  confidence: number; // 0-1, confidence in the blend's predictability
  stability: number; // 0-1, how stable the blend's effects will be
  risk: number; // 0-1, risk of adverse effects or unpredictability
  biphasicIssues: string[]; // Descriptions of any problematic dose zones
  entourageEffects: string[]; // Descriptions of notable entourage modulations
}

// --- CORE FUNCTIONS ---

/**
 * Convert a Strain to a CompoundVector
 * Normalizes all compound values to 0-1 range
 */
export function strainToCompoundVector(strain: Strain): CompoundVector {
  // Normalize THC and CBD (assuming max is around 30% and 25% respectively)
  const maxTHC = 30;
  const maxCBD = 25;
  
  return {
    thc: Math.min(strain.thc / maxTHC, 1),
    cbd: Math.min(strain.cbd / maxCBD, 1),
    myrcene: strain.terpenes.myrcene,
    limonene: strain.terpenes.limonene,
    caryophyllene: strain.terpenes.caryophyllene,
    pinene: strain.terpenes.pinene,
    humulene: strain.terpenes.humulene,
    linalool: strain.terpenes.linalool,
    terpinolene: strain.terpenes.terpinolene,
  };
}

/**
 * Blend multiple CompoundVectors using weighted averages
 */
export function blendCompoundVectors(
  vectors: CompoundVector[],
  weights: number[] // Should sum to 1.0 or will be normalized
): CompoundVector {
  // Normalize weights if needed
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  const normalizedWeights = totalWeight > 0 
    ? weights.map(w => w / totalWeight)
    : weights.map(() => 1 / weights.length);

  const blended: CompoundVector = {
    thc: 0,
    cbd: 0,
    myrcene: 0,
    limonene: 0,
    caryophyllene: 0,
    pinene: 0,
    humulene: 0,
    linalool: 0,
    terpinolene: 0,
  };

  for (let i = 0; i < vectors.length; i++) {
    const weight = normalizedWeights[i];
    blended.thc += vectors[i].thc * weight;
    blended.cbd += vectors[i].cbd * weight;
    blended.myrcene += vectors[i].myrcene * weight;
    blended.limonene += vectors[i].limonene * weight;
    blended.caryophyllene += vectors[i].caryophyllene * weight;
    blended.pinene += vectors[i].pinene * weight;
    blended.humulene += vectors[i].humulene * weight;
    blended.linalool += vectors[i].linalool * weight;
    blended.terpinolene += vectors[i].terpinolene * weight;
  }

  return blended;
}

/**
 * Evaluate biphasic compound response windows
 * Checks if blended compounds fall within problematic dose zones
 */
export function evaluateBiphasicResponse(blendedVector: CompoundVector): {
  windows: BiphasicWindow[];
  issues: string[];
  overallStability: number;
} {
  const windows: BiphasicWindow[] = [];
  const issues: string[] = [];
  let stabilitySum = 0;
  let stabilityCount = 0;

  // Myrcene: High levels (>0.35) can cause paradoxical sedation
  if (blendedVector.myrcene > 0.35) {
    windows.push({
      compound: 'myrcene',
      min: 0.35,
      max: 1.0,
      effectType: 'paradoxical',
      stability: 0.3, // Lower stability in paradoxical zone
    });
    issues.push(`Myrcene in paradoxical zone (${(blendedVector.myrcene * 100).toFixed(1)}%) - risk of excessive sedation`);
    stabilitySum += 0.3;
  } else if (blendedVector.myrcene > 0.15) {
    windows.push({
      compound: 'myrcene',
      min: 0.15,
      max: 0.35,
      effectType: 'primary',
      stability: 0.8,
    });
    stabilitySum += 0.8;
  } else {
    windows.push({
      compound: 'myrcene',
      min: 0,
      max: 0.15,
      effectType: 'primary',
      stability: 0.9,
    });
    stabilitySum += 0.9;
  }
  stabilityCount++;

  // Limonene: Very high levels (>0.50) can cause anxiety in sensitive individuals
  if (blendedVector.limonene > 0.50) {
    windows.push({
      compound: 'limonene',
      min: 0.50,
      max: 1.0,
      effectType: 'secondary',
      stability: 0.4,
    });
    issues.push(`Limonene in high-risk zone (${(blendedVector.limonene * 100).toFixed(1)}%) - may increase anxiety risk`);
    stabilitySum += 0.4;
  } else {
    windows.push({
      compound: 'limonene',
      min: 0,
      max: 0.50,
      effectType: 'primary',
      stability: 0.85,
    });
    stabilitySum += 0.85;
  }
  stabilityCount++;

  // Pinene: High levels can cause dry mouth and potential cognitive interference
  if (blendedVector.pinene > 0.45) {
    windows.push({
      compound: 'pinene',
      min: 0.45,
      max: 1.0,
      effectType: 'secondary',
      stability: 0.5,
    });
    issues.push(`Pinene in elevated zone (${(blendedVector.pinene * 100).toFixed(1)}%) - may cause discomfort`);
    stabilitySum += 0.5;
  } else {
    windows.push({
      compound: 'pinene',
      min: 0,
      max: 0.45,
      effectType: 'primary',
      stability: 0.85,
    });
    stabilitySum += 0.85;
  }
  stabilityCount++;

  // Linalool: Very high levels (>0.20) can cause excessive drowsiness
  if (blendedVector.linalool > 0.20) {
    windows.push({
      compound: 'linalool',
      min: 0.20,
      max: 1.0,
      effectType: 'secondary',
      stability: 0.45,
    });
    issues.push(`Linalool in high zone (${(blendedVector.linalool * 100).toFixed(1)}%) - risk of excessive sedation`);
    stabilitySum += 0.45;
  } else {
    windows.push({
      compound: 'linalool',
      min: 0,
      max: 0.20,
      effectType: 'primary',
      stability: 0.85,
    });
    stabilitySum += 0.85;
  }
  stabilityCount++;

  // Calculate overall stability as average
  const overallStability = stabilityCount > 0 ? stabilitySum / stabilityCount : 0.7;

  return { windows, issues, overallStability };
}

/**
 * Evaluate entourage modulation effects
 * Detects synergistic or antagonistic compound interactions
 */
export function evaluateEntourageModulation(blendedVector: CompoundVector): {
  modulations: EntourageModulation[];
  effects: string[];
} {
  const modulations: EntourageModulation[] = [];
  const effects: string[] = [];

  // Myrcene + Linalool: Synergistic sedative effect
  if (blendedVector.myrcene > 0.20 && blendedVector.linalool > 0.10) {
    const strength = Math.min((blendedVector.myrcene + blendedVector.linalool) / 0.6, 1);
    modulations.push({
      compounds: ['myrcene', 'linalool'],
      modulationType: 'synergistic',
      strength,
    });
    effects.push(`Synergistic sedative effect from myrcene + linalool combination`);
  }

  // Limonene + Pinene: Synergistic cognitive enhancement
  if (blendedVector.limonene > 0.25 && blendedVector.pinene > 0.25) {
    const strength = Math.min((blendedVector.limonene + blendedVector.pinene) / 0.8, 1);
    modulations.push({
      compounds: ['limonene', 'pinene'],
      modulationType: 'synergistic',
      strength,
    });
    effects.push(`Synergistic cognitive enhancement from limonene + pinene`);
  }

  // Caryophyllene + Humulene: Balanced anti-inflammatory, stable
  if (blendedVector.caryophyllene > 0.15 && blendedVector.humulene > 0.10) {
    modulations.push({
      compounds: ['caryophyllene', 'humulene'],
      modulationType: 'synergistic',
      strength: 0.7,
    });
    effects.push(`Stable anti-inflammatory profile from caryophyllene + humulene`);
  }

  // High THC + High Limonene: Potential antagonism for anxiety-sensitive users
  if (blendedVector.thc > 0.65 && blendedVector.limonene > 0.40) {
    modulations.push({
      compounds: ['thc', 'limonene'],
      modulationType: 'antagonistic',
      strength: 0.5,
    });
    effects.push(`High THC + limonene may increase anxiety risk`);
  }

  // CBD modulates THC effects (entourage)
  if (blendedVector.cbd > 0.1 && blendedVector.thc > 0.5) {
    const cbdRatio = blendedVector.cbd / (blendedVector.cbd + blendedVector.thc);
    if (cbdRatio > 0.15) {
      modulations.push({
        compounds: ['cbd', 'thc'],
        modulationType: 'synergistic',
        strength: Math.min(cbdRatio * 2, 1),
      });
      effects.push(`CBD moderates THC effects (CBD:THC ratio: ${(cbdRatio * 100).toFixed(0)}%)`);
    }
  }

  return { modulations, effects };
}

/**
 * Constraint-based evaluation of a blended vector
 * Returns confidence, stability, and risk metrics
 */
export function evaluateBlendConstraints(
  blendedVector: CompoundVector,
  strains: Strain[],
  ratios: number[]
): BlendEvaluation {
  // Ensure we have at least 2 components (pad with stabilizers if needed)
  if (strains.length < 2) {
    // This should be handled by the caller, but we can still evaluate
  }

  // Evaluate biphasic response
  const biphasic = evaluateBiphasicResponse(blendedVector);

  // Evaluate entourage modulation
  const entourage = evaluateEntourageModulation(blendedVector);

  // Calculate overall confidence
  // Confidence is higher when:
  // - Stability is high
  // - No biphasic issues
  // - Beneficial entourage effects present
  let confidence = biphasic.overallStability;
  if (biphasic.issues.length === 0) {
    confidence = Math.min(confidence + 0.1, 1.0);
  }
  const beneficialMods = entourage.modulations.filter(m => 
    m.modulationType === 'synergistic' && m.strength > 0.5
  );
  if (beneficialMods.length > 0) {
    confidence = Math.min(confidence + 0.05 * beneficialMods.length, 1.0);
  }

  // Calculate risk
  // Risk is higher when:
  // - Biphasic issues exist
  // - Antagonistic modulations present
  // - Very high compound concentrations
  let risk = 1 - biphasic.overallStability;
  risk += biphasic.issues.length * 0.15;
  const antagonisticMods = entourage.modulations.filter(m => 
    m.modulationType === 'antagonistic'
  );
  risk += antagonisticMods.length * 0.1;
  risk = Math.min(risk, 1.0);

  // Blend diversity contributes to stability
  // More diverse blends (more components, balanced ratios) are generally more stable
  const ratioVariance = calculateRatioVariance(ratios);
  const diversityBonus = strains.length >= 2 
    ? Math.min(0.1 * (strains.length - 1), 0.2)
    : 0;
  const balanceBonus = ratioVariance < 0.15 ? 0.05 : 0; // Balanced ratios are more stable

  const stability = Math.min(
    biphasic.overallStability + diversityBonus + balanceBonus,
    1.0
  );

  return {
    confidence,
    stability,
    risk,
    biphasicIssues: biphasic.issues,
    entourageEffects: entourage.effects,
  };
}

/**
 * Helper: Calculate variance of ratios (lower = more balanced)
 */
function calculateRatioVariance(ratios: number[]): number {
  if (ratios.length === 0) return 0;
  const mean = ratios.reduce((sum, r) => sum + r, 0) / ratios.length;
  const variance = ratios.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / ratios.length;
  return Math.sqrt(variance);
}

/**
 * Main evaluation function: Convert strains to vectors, blend, and evaluate
 */
export function evaluateBlend(
  strains: Strain[],
  ratios: number[]
): BlendEvaluation {
  // Convert strains to compound vectors
  const vectors = strains.map(strainToCompoundVector);

  // Normalize ratios to 0-1 for blending
  const totalRatio = ratios.reduce((sum, r) => sum + r, 0);
  const normalizedRatios = totalRatio > 0 
    ? ratios.map(r => r / totalRatio)
    : ratios.map(() => 1 / ratios.length);

  // Blend vectors
  const blendedVector = blendCompoundVectors(vectors, normalizedRatios);

  // Evaluate constraints
  return evaluateBlendConstraints(blendedVector, strains, ratios);
}

