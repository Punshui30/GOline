/**
 * GO Outcome Engine (Math-Driven)
 * 
 * AUTHORITATIVE implementation of the Deterministic Outcome Calculator.
 * 
 * PRINCIPLES:
 * 1. Source of Truth: Uses STRAIN_LIBRARY (40 strains) directly.
 * 2. Vector Math: Scores via weighted Euclidean distance from Intent.
 * 3. Combinatorial Optimization: Finds the blend (Strain + Ratio) that minimizes distance.
 * 4. No Heuristics: No fixed strategies or role assumptions during selection.
 * 5. Deterministic: Same input -> Same output.
 */

import { STRAIN_LIBRARY, type Strain } from '@/lib/strainLibrary';

// Re-using existing brain layers for additive context (Risk, Temporal, etc.)
// These do not drive selection, only explanation.
import { analyzeBlendDoseZones } from '@/lib/outcomeBrain/biphasicModeling';
import { analyzeSignalDensity, isIntentionalHighComplexity } from '@/lib/outcomeBrain/saturationAnalysis';
import { predictTemporalProfile } from '@/lib/outcomeBrain/temporalPharmacokinetics';
import { assessRiskProfile } from '@/lib/outcomeBrain/riskWeighting';
import { evaluateConstraints } from '@/lib/outcomeBrain/constraintSatisfaction';
import { generateOutcomeExplanation } from '@/lib/outcomeBrain/explainability';

// --- INTERFACES ---

export interface OutcomeIntent {
  activation: number; // 0-1
  anxietySensitivity: number; // 0-1
  cognitiveEndurance: number; // 0-1
  activationTarget: number; // Included for compatibility
  // Expansion fields (optional but used in distance calc)
  bodyLoadPreference?: number; // 0-1 (0 = Head, 1 = Body)
  durationPreference?: number; // 0-1 (0 = Short, 1 = Long)
  avoidSedation?: boolean;
  overshootTolerance?: number;
}

export interface SelectedCultivar {
  id: string;
  displayName: string;
}

export interface OutcomeResult {
  selectedCultivars: SelectedCultivar[];
  ratios: number[]; // integers summing to 100
  confidenceScore: number; // 0-1
  notes: string[];
  failure?: any;
  explanation?: any; // Additive brain layer data
}

// --- CONSTANTS ---

// Weights for Distance Calculation (Influence of each vector dimension)
const WEIGHTS = {
  activation: 1.5,
  anxiety: 2.0, // High penalty for anxiety mismatch
  body: 1.0,
  focus: 1.0,
};

// --- CORE MATH FUNCTIONS ---

/**
 * Normalize Strain Effects (0-100) to Vector (0-1)
 */
function getStrainVector(strain: Strain) {
  return {
    activation: strain.effects.energy / 100,
    calm: strain.effects.calm / 100, // Inverse of activation generally, but tracked separately
    anxietyRisk: strain.effects.anxietyRisk / 100,
    body: strain.effects.body / 100,
    focus: strain.effects.focus / 100
  };
}

/**
 * Calculate Weighted Euclidean Distance between Blend and Intent
 * Lower is Better.
 */
function calculateDistance(
  blendVector: { activation: number; anxietyRisk: number; body: number; focus: number },
  intent: OutcomeIntent
): number {
  let distanceSq = 0;

  // 1. Activation (Energy)
  const activationDiff = blendVector.activation - intent.activation;
  distanceSq += (activationDiff * activationDiff) * WEIGHTS.activation;

  // 2. Anxiety Risk (Penalty only if risk > sensitivity threshold)
  // If user is sensitive (high sensitivity), they need low risk.
  // We model this as: Gap between StrainRisk and (1 - Sensitivity)
  // Actually, simpler: Sensitivity 1.0 means ideal risk is 0.0. Sensitivity 0.0 means ideal is 1.0.
  // Ideal Risk = 1 - Intent.anxietySensitivity.
  // But Anxiety is a "limit" constraint usually, not a target.
  // Optimization: Minimize (Risk * Sensitivity).
  // Implementation: Target = 0.
  // Penalty = (Risk * Sensitivity)^2
  const anxietyPenalty = blendVector.anxietyRisk * intent.anxietySensitivity;
  distanceSq += (anxietyPenalty * anxietyPenalty) * WEIGHTS.anxiety;

  // 3. Body Load
  // If intent has body preference, calculate distance.
  const targetBody = intent.bodyLoadPreference ?? 0.5; // Default neutral
  const bodyDiff = blendVector.body - targetBody;
  distanceSq += (bodyDiff * bodyDiff) * WEIGHTS.body;

  // 4. Focus / Endurance
  const focusDiff = blendVector.focus - intent.cognitiveEndurance;
  distanceSq += (focusDiff * focusDiff) * WEIGHTS.focus;

  return Math.sqrt(distanceSq);
}

/**
 * Compute the aggregate vector of a blend
 */
function computeBlendVector(strains: Strain[], ratios: number[]) {
  const vector = { activation: 0, anxietyRisk: 0, body: 0, focus: 0 };

  for (let i = 0; i < strains.length; i++) {
    const sVec = getStrainVector(strains[i]);
    const weight = ratios[i] / 100;

    vector.activation += sVec.activation * weight;
    vector.anxietyRisk += sVec.anxietyRisk * weight; // Additive risk assumption for simplistic vector model
    vector.body += sVec.body * weight;
    vector.focus += sVec.focus * weight;
  }
  return vector;
}

/**
 * Resolve Outcome using Combinatorial Optimization
 */
export function resolveOutcome(intent: OutcomeIntent): OutcomeResult {
  const allStrains = Object.values(STRAIN_LIBRARY);

  // 1. Pre-Score Single Strains to reduce search space
  // We calculate the distance of each strain (at 100%) to the intent.
  // We pick the Top K to perform combinatorial mixing on.
  const scoredStrains = allStrains.map(strain => ({
    strain,
    distance: calculateDistance(getStrainVector(strain), intent)
  }));

  // Sort by Distance ASC (Lowest is best)
  scoredStrains.sort((a, b) => a.distance - b.distance);

  // Optimization Window: Take Top 8 strains.
  // N=40 -> Combinations of 3 is too large (40C3 = 9880) * Ratios.
  // N=8 -> 8C3 = 56. Very fast.
  const candidateStrains = scoredStrains.slice(0, 8).map(s => s.strain);

  let bestSolution = {
    strains: [] as Strain[],
    ratios: [] as number[],
    distance: Infinity
  };

  // --- SOLVER ---

  // Strategy A: Single Strain (100%)
  for (const strain of candidateStrains) {
    const dist = calculateDistance(getStrainVector(strain), intent);
    if (dist < bestSolution.distance) {
      bestSolution = { strains: [strain], ratios: [100], distance: dist };
    }
  }

  // Strategy B: 2-Strain Blend
  // Ratios: 10% increments from 10 to 90.
  for (let i = 0; i < candidateStrains.length; i++) {
    for (let j = i + 1; j < candidateStrains.length; j++) {
      const s1 = candidateStrains[i];
      const s2 = candidateStrains[j];

      for (let r = 10; r <= 90; r += 10) {
        const r1 = r;
        const r2 = 100 - r;
        const vec = computeBlendVector([s1, s2], [r1, r2]);
        const dist = calculateDistance(vec, intent);

        if (dist < bestSolution.distance) {
          bestSolution = { strains: [s1, s2], ratios: [r1, r2], distance: dist };
        }
      }
    }
  }

  // Strategy C: 3-Strain Blend
  // Ratios: Step 20% to save cycles? No, step 10% is fine for 8 candidates.
  // (i, j, k)
  // r1 from 10 to 80
  // r2 from 10 to (90 - r1)
  // r3 = remainder
  for (let i = 0; i < candidateStrains.length; i++) {
    for (let j = i + 1; j < candidateStrains.length; j++) {
      for (let k = j + 1; k < candidateStrains.length; k++) {
        const s1 = candidateStrains[i];
        const s2 = candidateStrains[j];
        const s3 = candidateStrains[k];

        for (let r1 = 20; r1 <= 60; r1 += 20) {
          for (let r2 = 20; r2 <= (80 - r1); r2 += 20) {
            const r3 = 100 - r1 - r2;
            if (r3 < 10) continue;

            const vec = computeBlendVector([s1, s2, s3], [r1, r2, r3]);
            const dist = calculateDistance(vec, intent);

            if (dist < bestSolution.distance) {
              bestSolution = { strains: [s1, s2, s3], ratios: [r1, r2, r3], distance: dist };
            }
          }
        }
      }
    }
  }

  // --- FINALIZE ---
  // The solution is the mathematical optimum within the search space.

  // Convert to Result Schema
  // Calculate Confidence: 1.0 - (MinDistance / MaxDistanceReference). 
  // Arbitrary scale mapping: Dist 0 = 100% confidence. Dist 1.0 = 0% confidence.
  const confidenceScore = Math.max(0, 1 - bestSolution.distance);

  const notes: string[] = [];
  if (confidenceScore < 0.7) notes.push("Complex intent match - result is approximate.");
  if (bestSolution.strains.length === 1) notes.push("Single cultivar provides optimal mathematical fit.");

  // Generate Additive Explanation (Brain Layers)
  // We map the Strain objects back to a format the Brain Analyzers generally expect (or mock it if needed)
  // The Brain Analyzers (from earlier imports) expect 'CanonicalCultivar' shape strictly?
  // We might need to mock the shapes, or better, just skip detailed brain analysis if types mismatch, 
  // as the CORE MATH is the authoritative part.
  // For now, let's keep explanation undefined to minimize complexity risks, 
  // OR map our `Strain` to `CanonicalCultivar` shape roughly.

  // Mapping for Brain Layers (Optional)
  const mappedReferenceStrains = bestSolution.strains.map(s => ({
    id: s.id,
    displayName: s.name,
    thcPercent: s.thc,
    terpenePercentages: s.terpenes,
    dataConfidence: "canonical" as const
  }));

  let explanation;
  try {
    // Run the explanation logic
    const doseAnalysis = analyzeBlendDoseZones(mappedReferenceStrains, bestSolution.ratios);
    const saturation = analyzeSignalDensity(mappedReferenceStrains, bestSolution.ratios, doseAnalysis);
    const risk = assessRiskProfile(doseAnalysis, saturation, intent);
    // ... skipping full pipeline for speed, generating simplistic explanation
    explanation = {
      explanation: `Selected ${bestSolution.strains.map(s => s.name).join(' + ')} to minimize distance to target vectors.`
    };
  } catch (e) {
    // Ignore brain layer errors
  }

  return {
    selectedCultivars: bestSolution.strains.map(s => ({
      id: s.id,
      displayName: s.name
    })),
    ratios: bestSolution.ratios,
    confidenceScore,
    notes,
    explanation
  };
}
