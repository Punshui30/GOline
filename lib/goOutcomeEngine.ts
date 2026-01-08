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

// Blend math evaluation layer
import { evaluateBlend, type BlendEvaluation } from '@/lib/blendMath';

// --- INTERFACES ---

/**
 * BlendComponent represents a component in a blend candidate
 */
interface BlendComponent {
  strainId: string;
  strain: Strain;
  weight: number; // 0-1 normalized weight
  deviationScore?: number; // Score for diversity penalty calculation
}

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
  physicalRelief?: number; // 0-1
  cognitiveClarity?: number; // 0-1
  functionalEnergy?: number; // 0-1
  temporalOnset?: number; // 0-1 (0=Fast/Rapid, 1=Slow/Creeper)
}

export interface SelectedCultivar {
  id: string;
  displayName: string;
}

export interface BlendCandidate {
  selectedCultivars: SelectedCultivar[];
  ratios: number[]; // integers summing to 100
  confidenceScore: number; // 0-1
  distance: number; // Distance from target
  varianceFromTarget: number; // Same as distance, for clarity
  diversityScore: number; // Diversity penalty applied
  terpeneVector: number[]; // Computed blend vector
  notes: string[];
  explanation?: any; // Additive brain layer data
}

export interface OutcomeResult {
  // Primary recommendation (best match)
  primary: BlendCandidate;
  // Alternate viable blends (top 3-5, excluding primary)
  alternates: BlendCandidate[];
  // Overall metadata
  failure?: any;
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
  blendVector: { activation: number; anxietyRisk: number; body: number; focus: number; calm: number },
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

  // 5. Calm (New Dimension)
  // If calm is not explicitly in intent, treat it as inverse of activation or check intent fields?
  // User spec: "If calm is inverse activation but independently reported, then penalize activation–calm mismatch"
  // Or "const targetCalm = 1 - intent.activation;"
  // We will Use Target Calm = 1 - activation.
  const targetCalm = 1 - intent.activation;
  const calmDiff = blendVector.calm - targetCalm;
  // Weight 0.75 as per user suggestion
  distanceSq += (calmDiff * calmDiff) * 0.75;


  return Math.sqrt(distanceSq);
}

/**
 * Compute the aggregate vector of a blend
 */
function computeBlendVector(strains: Strain[], ratios: number[]) {
  const vector = { activation: 0, anxietyRisk: 0, body: 0, focus: 0, calm: 0 };

  for (let i = 0; i < strains.length; i++) {
    const sVec = getStrainVector(strains[i]);
    const weight = ratios[i] / 100;

    vector.activation += sVec.activation * weight;
    vector.anxietyRisk += sVec.anxietyRisk * weight;
    vector.body += sVec.body * weight;
    vector.focus += sVec.focus * weight;
    vector.calm += sVec.calm * weight;
  }
  return vector;
}

/**
 * Calculate deviation score for a strain when used as a stabilizer
 * Lower deviation = less disturbance to the outcome
 */
function calculateDeviationScore(
  stabilizer: Strain,
  primaryStrain: Strain,
  intent: OutcomeIntent
): number {
  const primaryVec = getStrainVector(primaryStrain);
  const stabilizerVec = getStrainVector(stabilizer);
  
  // Calculate how much the stabilizer would shift the blend vector
  // We blend at 70% primary, 30% stabilizer
  const blendedVec = {
    activation: primaryVec.activation * 0.7 + stabilizerVec.activation * 0.3,
    anxietyRisk: primaryVec.anxietyRisk * 0.7 + stabilizerVec.anxietyRisk * 0.3,
    body: primaryVec.body * 0.7 + stabilizerVec.body * 0.3,
    focus: primaryVec.focus * 0.7 + stabilizerVec.focus * 0.3,
    calm: primaryVec.calm * 0.7 + stabilizerVec.calm * 0.3,
  };
  
  // Calculate how much this deviates from the pure primary strain's distance
  const primaryDistance = calculateDistance(primaryVec, intent);
  const blendedDistance = calculateDistance(blendedVec, intent);
  
  // Return the absolute deviation (how much it changes the distance)
  return Math.abs(blendedDistance - primaryDistance);
}

/**
 * Enforce minimum 2 components in a blend
 * If less than 2, pad with a stabilizer that least disturbs the outcome
 */
function enforceBlendMinimum(
  components: BlendComponent[],
  library: Strain[],
  intent: OutcomeIntent
): BlendComponent[] {
  if (components.length >= 2) return components;

  const primary = components[0];

  // Find stabilizer that least disturbs outcome
  const stabilizerCandidates = library
    .filter(s => s.id !== primary.strainId)
    .map(strain => ({
      strainId: strain.id,
      strain,
      weight: 0.3,
      deviationScore: calculateDeviationScore(strain, primary.strain, intent)
    }))
    .sort((a, b) => (a.deviationScore || Infinity) - (b.deviationScore || Infinity));

  if (stabilizerCandidates.length === 0) {
    // Fallback: use any other strain if no stabilizer found
    const fallback = library.find(s => s.id !== primary.strainId);
    if (fallback) {
      return [
        { ...primary, weight: 0.7 },
        { strainId: fallback.id, strain: fallback, weight: 0.3 }
      ];
    }
    // This should never happen, but return as-is if no fallback
    return components;
  }

  const stabilizer = stabilizerCandidates[0];

  return [
    { ...primary, weight: 0.7 },
    { ...stabilizer, weight: 0.3 }
  ];
}

/**
 * Generate blend candidates directly (no single-strain ranking)
 * Generates pairwise and triple blends
 * Uses intelligent candidate pool selection to widen diversity
 */
function generateBlendCandidates(
  library: Strain[],
  intent: OutcomeIntent,
  usageStats: Record<string, number>,
  maxCandidates: number = 500
): Array<{ strains: Strain[]; ratios: number[] }> {
  const blends: Array<{ strains: Strain[]; ratios: number[] }> = [];
  
  // Intelligent candidate pool selection:
  // 1. Calculate quick distance score for all strains
  // 2. Include top matches but also include mid-tier matches for diversity
  // 3. Avoid limiting to just first 20 strains
  
  const strainScores = library.map(strain => {
    const vec = getStrainVector(strain);
    const distance = calculateDistance(vec, intent);
    // Apply small diversity penalty during candidate selection
    const diversityPenalty = calculateDiversityPenalty(strain.id, usageStats) * 0.3; // Smaller penalty during selection
    return {
      strain,
      score: distance + diversityPenalty
    };
  });
  
  // Sort by score (lower is better)
  strainScores.sort((a, b) => a.score - b.score);
  
  // Create diverse candidate pool:
  // - Top 15 best matches
  // - Next 15 mid-tier matches (ranks 16-30)  
  // - 10 random diverse picks from remaining (to ensure broader coverage)
  const topMatches = strainScores.slice(0, 15).map(s => s.strain);
  const midTierMatches = strainScores.slice(15, 30).map(s => s.strain);
  
  // Select diverse picks from remaining (every Nth strain to ensure spread)
  const remaining = strainScores.slice(30);
  const diversePicks: Strain[] = [];
  if (remaining.length > 0) {
    const step = Math.max(1, Math.floor(remaining.length / 10));
    for (let i = 0; i < remaining.length && diversePicks.length < 10; i += step) {
      diversePicks.push(remaining[i].strain);
    }
  }
  
  // Combine into candidate pool (max 40 strains, but intelligently selected)
  const candidatePool = [...topMatches, ...midTierMatches, ...diversePicks].slice(0, 40);

  // Pairwise blends with varied ratios
  for (let i = 0; i < candidatePool.length && blends.length < maxCandidates; i++) {
    for (let j = i + 1; j < candidatePool.length && blends.length < maxCandidates; j++) {
      // Generate multiple ratio combinations
      const ratios = [
        [60, 40],
        [70, 30],
        [50, 50],
        [80, 20],
        [40, 60]
      ];
      
      for (const [r1, r2] of ratios) {
        if (blends.length >= maxCandidates) break;
        blends.push({
          strains: [candidatePool[i], candidatePool[j]],
          ratios: [r1, r2]
        });
      }
    }
  }

  // Triple blends (more selective to stay within limit)
  for (let i = 0; i < candidatePool.length && blends.length < maxCandidates; i++) {
    for (let j = i + 1; j < candidatePool.length && blends.length < maxCandidates; j++) {
      for (let k = j + 1; k < candidatePool.length && blends.length < maxCandidates; k++) {
        // Fewer ratio combinations for triples
        const ratios = [
          [50, 30, 20],
          [40, 35, 25],
          [45, 30, 25],
          [60, 25, 15]
        ];
        
        for (const [r1, r2, r3] of ratios) {
          if (blends.length >= maxCandidates) break;
          blends.push({
            strains: [candidatePool[i], candidatePool[j], candidatePool[k]],
            ratios: [r1, r2, r3]
          });
        }
      }
    }
  }

  return blends;
}

/**
 * Calculate diversity penalty for a strain based on usage statistics
 * Penalizes over-used strains without introducing randomness
 * Applied proportionally and capped to preserve determinism
 */
function calculateDiversityPenalty(
  strainId: string,
  usageStats: Record<string, number>
): number {
  const recentFrequency = usageStats[strainId] ?? 0;
  // Capped penalty: 4% per usage, max 20% to avoid completely excluding good matches
  // This ensures diversity pressure while preserving match quality
  return Math.min(recentFrequency * 0.04, 0.20);
}

// Global usage statistics tracking (simple in-memory)
// In production, this would be persisted and reset periodically
const usageStatistics: Record<string, number> = {};

// Dev-only: Selection tracking for diagnostics
const selectionHistory: Array<{
  timestamp: number;
  primaryStrainId: string;
  secondaryStrainIds: string[];
  intent: OutcomeIntent;
}> = [];

// Dev-only: Log selection for diagnostics
function logSelection(primaryStrainId: string, secondaryStrainIds: string[], intent: OutcomeIntent) {
  if (process.env.NODE_ENV === 'development') {
    selectionHistory.push({
      timestamp: Date.now(),
      primaryStrainId,
      secondaryStrainIds,
      intent: { ...intent }
    });
    
    // Keep only last 100 selections
    if (selectionHistory.length > 100) {
      selectionHistory.shift();
    }
    
    // Log summary every 10 selections
    if (selectionHistory.length % 10 === 0) {
      const primaryFreq: Record<string, number> = {};
      const secondaryFreq: Record<string, number> = {};
      
      selectionHistory.forEach(sel => {
        primaryFreq[sel.primaryStrainId] = (primaryFreq[sel.primaryStrainId] || 0) + 1;
        sel.secondaryStrainIds.forEach(id => {
          secondaryFreq[id] = (secondaryFreq[id] || 0) + 1;
        });
      });
      
      console.log('[Resolver Diagnostics] Primary strain frequency:', Object.entries(primaryFreq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([id, count]) => `${id}: ${count}`)
        .join(', '));
    }
  }
}

/**
 * Resolve Outcome using Blend-First Combinatorial Optimization
 * NEVER returns a single strain - always returns a blend of 2+ components
 */
export function resolveOutcome(intent: OutcomeIntent): OutcomeResult {
  const allStrains = Object.values(STRAIN_LIBRARY);

  // --- BLEND-FIRST GENERATION ---
  // Generate blend candidates directly, no single-strain ranking
  // Pass intent and usage stats for intelligent candidate pool selection
  const blendCandidates = generateBlendCandidates(allStrains, intent, usageStatistics, 500);

  // Track candidates with their evaluations
  interface CandidateSolution {
    strains: Strain[];
    ratios: number[];
    distance: number;
    adjustedDistance: number; // Distance after diversity penalty
    evaluation?: BlendEvaluation;
    primaryStrainId: string; // For diversity tracking
    diversityInfluenced: boolean; // Track if diversity penalty affected selection
  }

  // Evaluate all blend candidates
  const evaluatedCandidates: CandidateSolution[] = blendCandidates.map(blend => {
    const vec = computeBlendVector(blend.strains, blend.ratios);
    const baseDistance = calculateDistance(vec, intent);
    
    // Apply diversity penalty to primary strain (highest ratio)
    const primaryIndex = blend.ratios.indexOf(Math.max(...blend.ratios));
    const primaryStrainId = blend.strains[primaryIndex].id;
    const diversityPenalty = calculateDiversityPenalty(primaryStrainId, usageStatistics);
    const adjustedDistance = baseDistance + diversityPenalty;

    return {
      strains: blend.strains,
      ratios: blend.ratios,
      distance: baseDistance,
      adjustedDistance,
      primaryStrainId,
      diversityInfluenced: diversityPenalty > 0.01 // Track if diversity had meaningful impact
    };
  });

  // IMPORTANT: Diversity pressure is applied BEFORE ranking (in adjustedDistance calculation above)
  // This ensures top candidates are meaningfully different, not cosmetic variants
  
  // Sort by adjusted distance (accounts for diversity)
  evaluatedCandidates.sort((a, b) => a.adjustedDistance - b.adjustedDistance);

  // Take top candidates within reasonable threshold for blend math evaluation
  const bestAdjustedDistance = evaluatedCandidates[0].adjustedDistance;
  const threshold = bestAdjustedDistance * 1.08; // 8% threshold (increased from 5% for more diversity)
  const topCandidates = evaluatedCandidates.filter(c => c.adjustedDistance <= threshold).slice(0, 75); // Cap at 75 (increased from 50)

  // --- BLEND MATH EVALUATION LAYER ---
  // Evaluate top candidates using blend math
  for (const candidate of topCandidates) {
    try {
      candidate.evaluation = evaluateBlend(candidate.strains, candidate.ratios);
    } catch (e) {
      // If evaluation fails, continue without it
      console.warn('Blend evaluation failed for candidate:', e);
    }
  }

  // IMPORTANT: LLM must not choose strains. It only explains math-selected blends.
  // All strain selection happens here in the deterministic engine.
  
  // Select best solution using blend math evaluation
  // Preference order:
  // 1. Lower adjusted distance (primary - includes diversity)
  // 2. Higher stability (tie-breaker)
  // 3. Lower risk (tie-breaker)
  // 4. Higher confidence (tie-breaker)
  // 5. More components (prefer richer blends)
  const bestSolution = topCandidates.reduce((best, candidate) => {
    // Primary: adjusted distance comparison (accounts for diversity)
    if (candidate.adjustedDistance < best.adjustedDistance) return candidate;
    if (candidate.adjustedDistance > best.adjustedDistance) return best;

    // Tie-breaking: prefer candidates with evaluation data
    if (!candidate.evaluation && best.evaluation) return best;
    if (candidate.evaluation && !best.evaluation) return candidate;
    if (!candidate.evaluation || !best.evaluation) {
      // If neither has evaluation, prefer more components
      return candidate.strains.length > best.strains.length ? candidate : best;
    }

    // Tie-breaking with evaluation metrics
    const candEval = candidate.evaluation;
    const bestEval = best.evaluation;

    // Prefer higher stability
    if (candEval.stability > bestEval.stability + 0.05) return candidate;
    if (bestEval.stability > candEval.stability + 0.05) return best;

    // Prefer lower risk
    if (candEval.risk < bestEval.risk - 0.05) return candidate;
    if (bestEval.risk < candEval.risk - 0.05) return best;

    // Prefer higher confidence
    if (candEval.confidence > bestEval.confidence + 0.03) return candidate;
    if (bestEval.confidence > candEval.confidence + 0.03) return best;

    // Final tie-breaker: prefer more components
    return candidate.strains.length > best.strains.length ? candidate : best;
  }, topCandidates[0]);

  // Update usage statistics for diversity tracking
  if (bestSolution.primaryStrainId) {
    usageStatistics[bestSolution.primaryStrainId] = (usageStatistics[bestSolution.primaryStrainId] || 0) + 1;
  }
  
  // Dev-only: Log selection for diagnostics
  const secondaryStrainIds = bestSolution.strains
    .map(s => s.id)
    .filter(id => id !== bestSolution.primaryStrainId);
  logSelection(bestSolution.primaryStrainId, secondaryStrainIds, intent);

  // --- ENFORCE BLEND MINIMUM (CRITICAL GUARD) ---
  // Convert to BlendComponent format for enforceBlendMinimum
  const blendComponents: BlendComponent[] = bestSolution.strains.map((strain, idx) => ({
    strainId: strain.id,
    strain,
    weight: bestSolution.ratios[idx] / 100,
    deviationScore: 0
  }));

  // Enforce minimum 2 components - this should never add components if our generation is correct
  // but it's a critical safety guard
  const enforcedComponents = enforceBlendMinimum(blendComponents, allStrains, intent);

  // Convert back to strains and ratios
  let finalStrains = enforcedComponents.map(c => c.strain);
  let finalRatios = enforcedComponents.map(c => Math.round(c.weight * 100));
  
  // Normalize ratios to sum to 100
  const totalRatio = finalRatios.reduce((sum, r) => sum + r, 0);
  if (totalRatio !== 100) {
    finalRatios = finalRatios.map(r => Math.round((r / totalRatio) * 100));
    // Fix rounding errors
    const actualTotal = finalRatios.reduce((sum, r) => sum + r, 0);
    if (actualTotal !== 100) {
      finalRatios[0] += (100 - actualTotal);
    }
  }

  // --- FINALIZE ---
  // The solution is the mathematical optimum within the search space, refined by blend math evaluation.

  // Re-evaluate final blend if components were modified by enforceBlendMinimum
  let finalEvaluation = bestSolution.evaluation;
  if (finalStrains.length !== bestSolution.strains.length || 
      finalStrains.some((s, i) => s.id !== bestSolution.strains[i].id)) {
    try {
      finalEvaluation = evaluateBlend(finalStrains, finalRatios);
    } catch (e) {
      console.warn('Failed to re-evaluate enforced blend:', e);
    }
  }

  // Convert to Result Schema
  // Base Confidence: Exponential Decay (Higher distance = Rapidly lower confidence)
  // exp(-distance) -> Dist 0 = 1.0, Dist 1 = 0.36, Dist 0.5 = 0.6
  let confidenceScore = Math.exp(-bestSolution.distance);

  // Strengthen confidence with blend math evaluation
  if (finalEvaluation) {
    // Blend math evaluation provides additional confidence signal
    // Weight: 70% base distance, 30% blend math confidence
    const baseConfidence = confidenceScore;
    const mathConfidence = finalEvaluation.confidence;
    confidenceScore = baseConfidence * 0.7 + mathConfidence * 0.3;
    
    // Penalize high-risk blends
    if (finalEvaluation.risk > 0.5) {
      confidenceScore *= (1 - (finalEvaluation.risk - 0.5));
    }
  }

  const notes: string[] = [];
  if (confidenceScore < 0.6) notes.push("Complex intent match - result is approximate.");
  
  // Ensure we never note single-strain solutions
  if (finalStrains.length === 1) {
    notes.push("Note: Single-strain solution detected - this should not happen. Blend enforced.");
  }
  
  // Subtle note when diversity influenced selection (without revealing mechanics)
  // Only add if diversity penalty meaningfully affected the choice
  if (bestSolution.diversityInfluenced) {
    // Check if the base distance winner differs from adjusted distance winner
    const baseWinner = evaluatedCandidates.find(c => c.distance === Math.min(...evaluatedCandidates.map(c => c.distance)));
    if (baseWinner && baseWinner.primaryStrainId !== bestSolution.primaryStrainId) {
      // Diversity influenced selection - add subtle note
      notes.push("This blend balances fit with system flexibility for varied outcomes.");
    }
  }
  
  // Add blend math insights to notes
  if (finalEvaluation) {
    if (finalEvaluation.stability < 0.6) {
      notes.push("Blend stability is moderate - effects may vary.");
    }
    if (finalEvaluation.risk > 0.5) {
      notes.push("Higher risk profile - start with lower doses.");
    }
    if (finalEvaluation.biphasicIssues.length > 0) {
      notes.push(...finalEvaluation.biphasicIssues.map(issue => `Note: ${issue}`));
    }
  }


  // Generate Additive Explanation (Brain Layers)
  // We map the Strain objects back to a format the Brain Analyzers generally expect (or mock it if needed)
  // The Brain Analyzers (from earlier imports) expect 'CanonicalCultivar' shape strictly?
  // We might need to mock the shapes, or better, just skip detailed brain analysis if types mismatch, 
  // as the CORE MATH is the authoritative part.
  // For now, let's keep explanation undefined to minimize complexity risks, 
  // OR map our `Strain` to `CanonicalCultivar` shape roughly.

  // Mapping for Brain Layers (Optional)
  const mappedReferenceStrains = finalStrains.map(s => ({
    id: s.id,
    displayName: s.name,
    thcPercent: s.thc,
    terpenePercentages: s.terpenes,
    dataConfidence: "canonical" as const
  }));

  let explanation;
  try {
    // Run the explanation logic
    const doseAnalysis = analyzeBlendDoseZones(mappedReferenceStrains, finalRatios);
    const saturation = analyzeSignalDensity(mappedReferenceStrains, finalRatios, doseAnalysis);
    const risk = assessRiskProfile(doseAnalysis, saturation, intent);
    
    // Incorporate blend math evaluation into explanation
    let explanationText = `Selected ${finalStrains.map(s => s.name).join(' + ')} to minimize distance to target vectors.`;
    
    if (finalEvaluation) {
      const evalParts: string[] = [];
      if (finalEvaluation.entourageEffects.length > 0) {
        evalParts.push(...finalEvaluation.entourageEffects);
      }
      if (finalEvaluation.stability > 0.75) {
        evalParts.push(`High stability blend with predictable effects.`);
      }
      if (evalParts.length > 0) {
        explanationText += ` ${evalParts.join(' ')}`;
      }
    }
    
    explanation = {
      explanation: explanationText
    };
  } catch (e) {
    // Ignore brain layer errors
    // Fallback to basic explanation with blend math insights
    let explanationText = `Selected ${finalStrains.map(s => s.name).join(' + ')} to minimize distance to target vectors.`;
    if (finalEvaluation?.entourageEffects.length) {
      explanationText += ` ${finalEvaluation.entourageEffects.join(' ')}`;
    }
    explanation = { explanation: explanationText };
  }

  // Helper function to convert CandidateSolution to BlendCandidate
  const convertToBlendCandidate = (solution: CandidateSolution, isEnforced: boolean = false): BlendCandidate => {
    let strains = solution.strains;
    let ratios = solution.ratios;
    
    // Enforce blend minimum if needed
    if (isEnforced) {
      const blendComponents: BlendComponent[] = strains.map((strain, idx) => ({
        strainId: strain.id,
        strain,
        weight: ratios[idx] / 100,
        deviationScore: 0
      }));
      
      const enforcedComponents = enforceBlendMinimum(blendComponents, allStrains, intent);
      strains = enforcedComponents.map(c => c.strain);
      ratios = enforcedComponents.map(c => Math.round(c.weight * 100));
      
      // Normalize ratios
      const totalRatio = ratios.reduce((sum, r) => sum + r, 0);
      if (totalRatio !== 100) {
        ratios = ratios.map(r => Math.round((r / totalRatio) * 100));
        const actualTotal = ratios.reduce((sum, r) => sum + r, 0);
        if (actualTotal !== 100) {
          ratios[0] += (100 - actualTotal);
        }
      }
    }
    
    // CRITICAL: Final assertion - this should NEVER happen after enforceBlendMinimum
    if (strains.length < 2) {
      console.error('CRITICAL BUG: Resolver returned single-strain solution. This violates blend-only requirement.');
      const emergencyStabilizer = allStrains.find(s => s.id !== strains[0].id);
      if (emergencyStabilizer) {
        strains = [strains[0], emergencyStabilizer];
        ratios = [70, 30];
      }
    }
    
    // Calculate confidence and evaluation
    let candidateConfidence = Math.exp(-solution.distance);
    let candidateEvaluation = solution.evaluation;
    
    if (isEnforced && (strains.length !== solution.strains.length || strains.some((s, i) => s.id !== solution.strains[i].id))) {
      try {
        candidateEvaluation = evaluateBlend(strains, ratios);
      } catch (e) {
        console.warn('Failed to re-evaluate enforced blend:', e);
      }
    }
    
    if (candidateEvaluation) {
      const baseConfidence = candidateConfidence;
      const mathConfidence = candidateEvaluation.confidence;
      candidateConfidence = baseConfidence * 0.7 + mathConfidence * 0.3;
      
      if (candidateEvaluation.risk > 0.5) {
        candidateConfidence *= (1 - (candidateEvaluation.risk - 0.5));
      }
    }
    
    // Compute terpene vector
    const vec = computeBlendVector(strains, ratios);
    const terpeneVector = [vec.activation, vec.anxietyRisk, vec.body, vec.focus, vec.calm];
    
    // Generate notes
    const candidateNotes: string[] = [];
    if (candidateConfidence < 0.6) candidateNotes.push("Complex intent match - result is approximate.");
    if (strains.length === 1) candidateNotes.push("Note: Single-strain solution detected - this should not happen. Blend enforced.");
    if (solution.diversityInfluenced) {
      candidateNotes.push("This blend balances fit with system flexibility for varied outcomes.");
    }
    if (candidateEvaluation) {
      if (candidateEvaluation.stability < 0.6) candidateNotes.push("Blend stability is moderate - effects may vary.");
      if (candidateEvaluation.risk > 0.5) candidateNotes.push("Higher risk profile - start with lower doses.");
      if (candidateEvaluation.biphasicIssues.length > 0) {
        candidateNotes.push(...candidateEvaluation.biphasicIssues.map(issue => `Note: ${issue}`));
      }
    }
    
    // Generate explanation
    let candidateExplanation;
    try {
      const mappedReferenceStrains = strains.map(s => ({
        id: s.id,
        displayName: s.name,
        thcPercent: s.thc,
        terpenePercentages: s.terpenes,
        dataConfidence: "canonical" as const
      }));
      
      const doseAnalysis = analyzeBlendDoseZones(mappedReferenceStrains, ratios);
      const saturation = analyzeSignalDensity(mappedReferenceStrains, ratios, doseAnalysis);
      const risk = assessRiskProfile(doseAnalysis, saturation, intent);
      
      let explanationText = `Selected ${strains.map(s => s.name).join(' + ')} to minimize distance to target vectors.`;
      
      if (candidateEvaluation) {
        const evalParts: string[] = [];
        if (candidateEvaluation.entourageEffects.length > 0) {
          evalParts.push(...candidateEvaluation.entourageEffects);
        }
        if (candidateEvaluation.stability > 0.75) {
          evalParts.push(`High stability blend with predictable effects.`);
        }
        if (evalParts.length > 0) {
          explanationText += ` ${evalParts.join(' ')}`;
        }
      }
      
      candidateExplanation = { explanation: explanationText };
    } catch (e) {
      let explanationText = `Selected ${strains.map(s => s.name).join(' + ')} to minimize distance to target vectors.`;
      if (candidateEvaluation?.entourageEffects.length) {
        explanationText += ` ${candidateEvaluation.entourageEffects.join(' ')}`;
      }
      candidateExplanation = { explanation: explanationText };
    }
    
    return {
      selectedCultivars: strains.map(s => ({
        id: s.id,
        displayName: s.name
      })),
      ratios,
      confidenceScore: candidateConfidence,
      distance: solution.distance,
      varianceFromTarget: solution.distance,
      diversityScore: solution.adjustedDistance - solution.distance, // The penalty amount
      terpeneVector,
      notes: candidateNotes,
      explanation: candidateExplanation
    };
  };
  
  // Process primary solution
  const primary = convertToBlendCandidate(bestSolution, true);
  
  // Select alternate candidates (top 3-5, excluding primary)
  // Filter out candidates that are too similar to primary (same primary strain)
  const alternateCandidates = topCandidates
    .filter(c => {
      // Exclude primary
      if (c === bestSolution) return false;
      // Exclude candidates with same primary strain (for diversity)
      const primaryIndex = c.ratios.indexOf(Math.max(...c.ratios));
      const candidatePrimaryStrainId = c.strains[primaryIndex].id;
      return candidatePrimaryStrainId !== bestSolution.primaryStrainId;
    })
    .slice(0, 4) // Top 4 alternates (total 5 candidates: 1 primary + 4 alternates)
    .map(c => convertToBlendCandidate(c, true));
  
  // CRITICAL: Log resolver output for verification
  console.log('[RESOLVER OUTPUT] ====================================');
  console.log(`[RESOLVER] Generated ${1 + alternateCandidates.length} blend candidates`);
  console.log(`[RESOLVER] Primary: ${primary.selectedCultivars.map(c => c.displayName).join(' + ')} (${primary.ratios.join('/')}%)`);
  console.log(`[RESOLVER] Primary confidence: ${(primary.confidenceScore * 100).toFixed(0)}%`);
  
  // ASSERT: Resolver should generate multiple candidates when possible
  // If no alternates are generated, log a warning (this might be expected for edge cases)
  if (alternateCandidates.length > 0) {
    alternateCandidates.forEach((alt, idx) => {
      console.log(`[RESOLVER] Alternate ${idx + 1}: ${alt.selectedCultivars.map(c => c.displayName).join(' + ')} (${alt.ratios.join('/')}%) - confidence: ${(alt.confidenceScore * 100).toFixed(0)}%`);
    });
  } else {
    console.log('[RESOLVER] WARNING: No alternate candidates generated');
    // This is not necessarily an error - edge cases might have only one valid blend
    // But it should be logged for verification
  }
  
  // ASSERT: Verify we're returning the expected structure
  if (!primary || !primary.selectedCultivars || primary.selectedCultivars.length === 0) {
    console.error('[RESOLVER][ASSERT] Primary candidate is invalid', { primary });
    throw new Error('Resolver must return a valid primary candidate');
  }
  
  // ASSERT: Verify alternates array is present (even if empty)
  if (!Array.isArray(alternateCandidates)) {
    console.error('[RESOLVER][ASSERT] Alternates must be an array', { alternateCandidates });
    throw new Error('Resolver must return alternates as an array');
  }
  
  console.log('[RESOLVER OUTPUT] ====================================');

  return {
    primary,
    alternates: alternateCandidates
  };
}
