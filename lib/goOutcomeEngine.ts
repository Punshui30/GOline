/**
 * GO Outcome Engine
 * 
 * Deterministic outcome resolution system that selects optimal cultivar blends
 * based on terpene profiles and structured intent parameters.
 * 
 * This engine implements:
 * - Biphasic terpene scoring (optimal ranges, overshoot penalties)
 * - Interaction dampening (non-additive stacking)
 * - Distribution balance preferences
 * - Quantitative ratio calculations
 */

import { canonicalCultivars, type CanonicalCultivar } from '@/data/canonicalCultivars';
import { analyzeBlendDoseZones } from '@/lib/outcomeBrain/biphasicModeling';
import { analyzeSignalDensity, isIntentionalHighComplexity } from '@/lib/outcomeBrain/saturationAnalysis';
import { predictTemporalProfile } from '@/lib/outcomeBrain/temporalPharmacokinetics';
import { assessRiskProfile } from '@/lib/outcomeBrain/riskWeighting';
import { evaluateConstraints } from '@/lib/outcomeBrain/constraintSatisfaction';
import { generateOutcomeExplanation } from '@/lib/outcomeBrain/explainability';

export interface OutcomeIntent {
  activation: number; // 0-1: desire for stimulation/energy
  anxietySensitivity: number; // 0-1: sensitivity to anxiety-inducing compounds
  cognitiveEndurance: number; // 0-1: need for sustained focus vs intensity
  avoidSedation: boolean; // avoid sedating profiles
  physicalRelief?: number; // 0-1: need for physical comfort/relief (optional, expanded dimension)
  cognitiveClarity?: number; // 0-1: need for mental clarity/sharpness (optional, expanded dimension)
  functionalEnergy?: number; // 0-1: need for functional energy vs intensity (optional, expanded dimension)
  temporalOnset?: number; // 0-1: preference for faster onset (0) vs slower onset (1) (optional, expanded dimension)
  temporalDuration?: number; // 0-1: preference for shorter duration (0) vs longer duration (1) (optional, expanded dimension)
}

export interface SelectedCultivar {
  id: string;
  displayName: string;
}

export interface OutcomeResult {
  selectedCultivars: SelectedCultivar[];
  ratios: number[]; // must sum to 100
  confidenceScore: number; // 0-1
  notes: string[]; // neutral, non-experiential notes
  // Additive brain layers (optional, for explainability)
  explanation?: {
    primaryChemicalDrivers: Array<{ compound: string; percentage: number; contribution: string }>;
    keyConstraintsSatisfied: string[];
    risksAccepted: Array<{ risk: string; severity: 'low' | 'moderate' | 'high'; justification: string }>;
    risksAvoided: string[];
    outcomeClassification: 'focused' | 'balanced' | 'layered' | 'emergent' | 'complex';
    complexityLevel: 'simple' | 'moderate' | 'high' | 'emergent';
    explanation: string;
  };
}

/**
 * Terpene scoring parameters for biphasic response curves
 */
interface TerpeneProfile {
  name: string;
  optimalMin: number; // minimum for productive range
  optimalMax: number; // maximum for productive range
  overshootPenaltySlope: number; // penalty per unit above optimalMax
  activationWeight: number; // contribution to activation scoring
  sedationWeight: number; // contribution to sedation scoring (negative for anti-sedation)
  anxietyRiskWeight: number; // contribution to anxiety risk (positive = risk)
}

/**
 * Reference terpene profiles with optimal ranges and interaction weights
 */
const TERPENE_PROFILES: TerpeneProfile[] = [
  {
    name: 'pinene',
    optimalMin: 0.10,
    optimalMax: 0.25,
    overshootPenaltySlope: 3.0,
    activationWeight: 0.25,
    sedationWeight: -0.15,
    anxietyRiskWeight: 0.10,
  },
  {
    name: 'limonene',
    optimalMin: 0.12,
    optimalMax: 0.28,
    overshootPenaltySlope: 2.5,
    activationWeight: 0.20,
    sedationWeight: -0.10,
    anxietyRiskWeight: 0.15,
  },
  {
    name: 'myrcene',
    optimalMin: 0.15,
    optimalMax: 0.30,
    overshootPenaltySlope: 2.0,
    activationWeight: -0.10,
    sedationWeight: 0.30,
    anxietyRiskWeight: -0.05,
  },
  {
    name: 'linalool',
    optimalMin: 0.08,
    optimalMax: 0.22,
    overshootPenaltySlope: 3.5,
    activationWeight: -0.15,
    sedationWeight: 0.25,
    anxietyRiskWeight: -0.20,
  },
  {
    name: 'caryophyllene',
    optimalMin: 0.12,
    optimalMax: 0.25,
    overshootPenaltySlope: 2.0,
    activationWeight: 0.05,
    sedationWeight: 0.05,
    anxietyRiskWeight: -0.15,
  },
  {
    name: 'humulene',
    optimalMin: 0.05,
    optimalMax: 0.15,
    overshootPenaltySlope: 3.0,
    activationWeight: -0.05,
    sedationWeight: 0.10,
    anxietyRiskWeight: -0.10,
  },
  {
    name: 'terpinolene',
    optimalMin: 0.02,
    optimalMax: 0.12,
    overshootPenaltySlope: 4.0,
    activationWeight: 0.15,
    sedationWeight: -0.05,
    anxietyRiskWeight: 0.20,
  },
  {
    name: 'ocimene',
    optimalMin: 0.01,
    optimalMax: 0.08,
    overshootPenaltySlope: 4.0,
    activationWeight: 0.10,
    sedationWeight: -0.05,
    anxietyRiskWeight: 0.10,
  },
];

/**
 * Compute biphasic penalty for a terpene value
 * Exact implementation as specified: under-expressed → 0, productive window → 1, overshoot → penalized
 */
function biphasicPenalty(
  value: number,
  optimalMin: number,
  optimalMax: number,
  penaltySlope: number
): number {
  if (value < optimalMin) return 0;
  if (value <= optimalMax) return 1;
  return Math.max(0, 1 - (value - optimalMax) * penaltySlope);
}

/**
 * Score a cultivar against the outcome intent
 */
function scoreCultivar(
  cultivar: CanonicalCultivar,
  intent: OutcomeIntent
): number {
  let activationScore = 0;
  let sedationScore = 0;
  let anxietyRiskScore = 0;
  let overallTerpeneScore = 1.0;
  
  // Compute terpene-based scores with biphasic penalties
  for (const terpeneProfile of TERPENE_PROFILES) {
    const terpeneValue = cultivar.terpenePercentages[terpeneProfile.name] || 0;
    
    // Apply biphasic penalty
    const penalty = biphasicPenalty(
      terpeneValue,
      terpeneProfile.optimalMin,
      terpeneProfile.optimalMax,
      terpeneProfile.overshootPenaltySlope
    );
    
    // Multiply overall score by penalty (multiplicative dampening)
    overallTerpeneScore *= (0.3 + 0.7 * penalty); // Soften penalty impact
    
    // Add weighted contributions
    activationScore += terpeneValue * terpeneProfile.activationWeight;
    sedationScore += terpeneValue * terpeneProfile.sedationWeight;
    anxietyRiskScore += terpeneValue * terpeneProfile.anxietyRiskWeight;
  }
  
  // Normalize scores to 0-1 range (rough approximation)
  activationScore = Math.max(0, Math.min(1, (activationScore + 1) / 2));
  sedationScore = Math.max(0, Math.min(1, (sedationScore + 1) / 2));
  anxietyRiskScore = Math.max(0, Math.min(1, (anxietyRiskScore + 1) / 2));
  
  // Compute alignment scores
  const activationAlignment = 1.0 - Math.abs(activationScore - intent.activation);
  const sedationAlignment = intent.avoidSedation 
    ? (1.0 - sedationScore) // Prefer lower sedation
    : 1.0; // No preference
  const anxietyAlignment = 1.0 - (anxietyRiskScore * intent.anxietySensitivity);
  
  // Combine scores with weighted importance
  const intentAlignment = (
    activationAlignment * 0.35 +
    sedationAlignment * 0.25 +
    anxietyAlignment * 0.40
  );
  
  // Final score: terpene health × intent alignment
  return overallTerpeneScore * intentAlignment;
}

/**
 * Compute distribution balance score (favor even distributions)
 */
function computeBalanceScore(cultivars: CanonicalCultivar[], ratios: number[]): number {
  if (cultivars.length === 0) return 0;
  
  // Compute variance in terpene distribution across blend
  const totalTerpenes: { [key: string]: number } = {};
  
  for (let i = 0; i < cultivars.length; i++) {
    const cultivar = cultivars[i];
    const ratio = ratios[i] / 100;
    
    for (const terpeneName of Object.keys(cultivar.terpenePercentages)) {
      if (!totalTerpenes[terpeneName]) {
        totalTerpenes[terpeneName] = 0;
      }
      totalTerpenes[terpeneName] += cultivar.terpenePercentages[terpeneName] * ratio;
    }
  }
  
  // Compute coefficient of variation (lower is more balanced)
  const values = Object.values(totalTerpenes);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  const cv = mean > 0 ? stdDev / mean : 1.0;
  
  // Convert to score (lower CV = higher score)
  return Math.max(0, 1.0 - cv * 0.5);
}

/**
 * Select optimal cultivar blend
 * 
 * Variation logic: When multiple equivalent solutions exist (within score threshold),
 * prefer cultivars not recently used and with different terpene profiles.
 */
export function resolveOutcome(
  intent: OutcomeIntent,
  recentlyUsedCultivarIds: string[] = []
): OutcomeResult {
  // Score all cultivars
  const scoredCultivars = canonicalCultivars.map(cultivar => ({
    cultivar,
    score: scoreCultivar(cultivar, intent),
  }));
  
  // Sort by score (descending)
  scoredCultivars.sort((a, b) => b.score - a.score);
  
  // Variation logic: Define score threshold for "equivalent" solutions (within 5% of top score)
  const topScore = scoredCultivars.length > 0 ? scoredCultivars[0].score : 0;
  const equivalentThreshold = Math.max(0.05, topScore * 0.05); // At least 0.05 absolute, or 5% relative
  
  // Prefer anchor + modifier pattern: one anchor cultivar with 1-2 modifiers (10-25% each)
  // Try different combinations to find optimal blend
  let bestSelection: typeof scoredCultivars = [];
  let bestRatios: number[] = [];
  let bestScore = -1;
  const candidateSelections: Array<{ selection: typeof scoredCultivars; ratios: number[]; score: number }> = [];
  
  // Strategy 1: Single anchor with one modifier (75-25, 80-20, 85-15, 90-10)
  if (scoredCultivars.length >= 2) {
    const anchor = scoredCultivars[0];
    for (let i = 1; i < Math.min(4, scoredCultivars.length); i++) {
      const modifier = scoredCultivars[i];
      const modifierRatios = [15, 20, 25]; // Modifier percentages
      
      for (const modPct of modifierRatios) {
        const anchorPct = 100 - modPct;
        const ratios = [anchorPct, modPct];
        const selection = [anchor, modifier];
        
        const balanceScore = computeBalanceScore(
          selection.map(sc => sc.cultivar),
          ratios
        );
        
        const weightedScore = (anchor.score * anchorPct / 100) + (modifier.score * modPct / 100);
        const combinedScore = weightedScore * 0.7 + balanceScore * 0.3;
        
        // Collect all candidate selections within equivalent threshold
        if (combinedScore >= topScore - equivalentThreshold) {
          candidateSelections.push({ selection, ratios, score: combinedScore });
        }
        
        if (combinedScore > bestScore) {
          bestScore = combinedScore;
          bestSelection = selection;
          bestRatios = ratios;
        }
      }
    }
  }
  
  // Strategy 2: Single anchor with two modifiers (75-15-10, 70-20-10, 65-20-15)
  if (scoredCultivars.length >= 3) {
    const anchor = scoredCultivars[0];
    for (let i = 1; i < Math.min(4, scoredCultivars.length); i++) {
      for (let j = i + 1; j < Math.min(5, scoredCultivars.length); j++) {
        const mod1 = scoredCultivars[i];
        const mod2 = scoredCultivars[j];
        const twoModCombos = [[15, 10], [20, 10], [20, 15], [15, 15]];
        
        for (const [mod1Pct, mod2Pct] of twoModCombos) {
          const anchorPct = 100 - mod1Pct - mod2Pct;
          if (anchorPct < 60) continue; // Anchor must be at least 60%
          
          const ratios = [anchorPct, mod1Pct, mod2Pct];
          const selection = [anchor, mod1, mod2];
          
          const balanceScore = computeBalanceScore(
            selection.map(sc => sc.cultivar),
            ratios
          );
          
          const weightedScore = 
            (anchor.score * anchorPct / 100) +
            (mod1.score * mod1Pct / 100) +
            (mod2.score * mod2Pct / 100);
          const combinedScore = weightedScore * 0.7 + balanceScore * 0.3;
          
          // Collect all candidate selections within equivalent threshold
          if (combinedScore >= topScore - equivalentThreshold) {
            candidateSelections.push({ selection, ratios, score: combinedScore });
          }
          
          if (combinedScore > bestScore) {
            bestScore = combinedScore;
            bestSelection = selection;
            bestRatios = ratios;
          }
        }
      }
    }
  }
  
  // Fallback: If no good anchor+modifier found, use top 2 with balanced ratios
  if (bestSelection.length === 0 && scoredCultivars.length >= 2) {
    bestSelection = scoredCultivars.slice(0, 2);
    bestRatios = [70, 30]; // Prefer slight anchor preference even in fallback
  }
  
  // Variation logic: If multiple equivalent solutions exist, prefer ones not recently used
  if (candidateSelections.length > 1 && recentlyUsedCultivarIds.length > 0) {
    // Score candidates by: (1) score, (2) avoid recently used cultivars
    const scoredCandidates = candidateSelections.map(candidate => {
      const cultivarIds = candidate.selection.map(sc => sc.cultivar.id);
      const recentlyUsedCount = cultivarIds.filter(id => recentlyUsedCultivarIds.includes(id)).length;
      const variationBonus = (candidate.selection.length - recentlyUsedCount) / candidate.selection.length;
      // Prefer higher score, but bonus for variation (up to 10% boost)
      const adjustedScore = candidate.score * (1.0 + variationBonus * 0.1);
      return { ...candidate, adjustedScore };
    });
    
    // Sort by adjusted score (descending)
    scoredCandidates.sort((a, b) => b.adjustedScore - a.adjustedScore);
    
    // Use the best adjusted score candidate (only if it's within equivalent threshold)
    const bestCandidate = scoredCandidates[0];
    if (bestCandidate.score >= bestScore - equivalentThreshold && bestCandidate.adjustedScore > bestScore) {
      // Prefer variation when scores are equivalent (within threshold)
      bestSelection = bestCandidate.selection;
      bestRatios = bestCandidate.ratios;
      bestScore = bestCandidate.score;
    }
  }
  
  const topCultivars = bestSelection;
  
  // Ensure ratios sum to 100 (normalize and round)
  const sum = bestRatios.reduce((a, b) => a + b, 0);
  if (sum > 0) {
    bestRatios = bestRatios.map(r => Math.round((r / sum) * 100));
    // Fix rounding errors
    const newSum = bestRatios.reduce((a, b) => a + b, 0);
    if (newSum !== 100) {
      bestRatios[0] += (100 - newSum);
    }
  } else {
    // Final fallback: equal ratios (should not happen)
    bestRatios = new Array(topCultivars.length).fill(Math.floor(100 / topCultivars.length));
    bestRatios[0] += 100 - bestRatios.reduce((a, b) => a + b, 0);
  }
  
  // Compute confidence score (weighted by ratios)
  const weightedScore = topCultivars.reduce((sum, sc, i) => 
    sum + sc.score * (bestRatios[i] / 100), 0
  );
  const confidenceScore = Math.max(0, Math.min(1, weightedScore));
  
  // Generate neutral notes (existing logic preserved)
  const notes: string[] = [];
  if (confidenceScore < 0.6) {
    notes.push('Lower confidence outcome; consider refining intent parameters');
  }
  if (topCultivars.length === 2 && bestRatios[0] > 70) {
    notes.push('Blend dominated by single cultivar profile');
  }
  if (topCultivars.every(sc => sc.score < 0.5)) {
    notes.push('No cultivars strongly match intent profile');
  }
  
  // ADDITIVE BRAIN LAYERS (computed but not required for core functionality)
  // All existing logic above remains unchanged
  let explanation: OutcomeResult['explanation'] | undefined;
  
  try {
    // Run brain layers on the selected blend
    const selectedCultivarsList = topCultivars.map(sc => sc.cultivar);
    
    // 1. Biphasic & hormetic modeling
    const doseAnalysis = analyzeBlendDoseZones(selectedCultivarsList, bestRatios);
    
    // 2. Signal density & saturation analysis
    const saturationAnalysis = analyzeSignalDensity(selectedCultivarsList, bestRatios, doseAnalysis);
    
    // 3. Temporal pharmacokinetic reasoning
    const temporalProfile = predictTemporalProfile(selectedCultivarsList, bestRatios, doseAnalysis, intent);
    
    // 4. Risk assessment
    const riskAssessment = assessRiskProfile(doseAnalysis, saturationAnalysis, intent);
    
    // 5. Constraint evaluation
    const constraintEvaluation = evaluateConstraints(intent, doseAnalysis, saturationAnalysis, riskAssessment);
    
    // 6. High complexity detection
    const isHighComplexity = isIntentionalHighComplexity(saturationAnalysis, doseAnalysis, intent);
    
    // 7. Generate explanation
    explanation = generateOutcomeExplanation(
      doseAnalysis,
      saturationAnalysis,
      riskAssessment,
      temporalProfile,
      constraintEvaluation,
      isHighComplexity
    );
  } catch (error) {
    // Brain layers are additive - if they fail, system still works
    // Error is silently ignored to preserve existing behavior
    console.warn('Brain layer computation failed (non-critical):', error);
  }
  
  // Return result (existing structure preserved, explanation added optionally)
  return {
    selectedCultivars: topCultivars.map(sc => ({
      id: sc.cultivar.id,
      displayName: sc.cultivar.displayName,
    })),
    ratios: bestRatios,
    confidenceScore,
    notes: notes.length > 0 ? notes : ['Blend selected based on terpene profile alignment'],
    explanation, // Optional additive data
  };
}

