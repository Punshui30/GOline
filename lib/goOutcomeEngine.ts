/**
 * GO Outcome Intelligence Engine (v3 · Retail-Aware · Blend-First)
 * 
 * Constraint-based composition engine that resolves desired outcomes using
 * strategic blending as the default resolution approach, with single-cultivar
 * recommendations used only when demonstrably optimal.
 * 
 * Core principles:
 * - Blending is the default strategy
 * - Single cultivar only when demonstrably optimal (rare)
 * - Explicit composition strategy selection (single_cultivar, homogeneous_blend, layered_stack)
 * - CBD/CBG for correction, not enhancement
 * - Three resolution tiers: Optimal, Balanced, Simplified
 * - Clear, real-world mixing instructions
 */

import { canonicalChemotypes, type CanonicalChemotype } from '@/data/canonicalChemotypes';

/**
 * Outcome input constraints (directional, not goals)
 */
export interface OutcomeIntent {
  activationTarget: number; // 0-1: directional constraint
  anxietySensitivity: number; // 0-1: sensitivity to anxiety-inducing compounds
  cognitiveEndurance: number; // 0-1: need for sustained focus vs intensity
  overshootTolerance: number; // 0-1: tolerance for terpene overshoot
  temporalProfile?: "single-phase" | "multi-phase";
  phases?: {
    phase: "Primary / Early" | "Later / Wind-Down";
    activationTarget: number;
    anxietySensitivity: number;
    cognitiveEndurance: number;
    overshootTolerance: number;
  }[];
}

/**
 * Composition strategy selection (decided before cultivar selection)
 */
export type CompositionStrategy = 'single_cultivar' | 'homogeneous_blend' | 'layered_stack';

/**
 * Resolution type classification
 */
export type ResolutionType = 'SINGLE_CULTIVAR' | 'CORRECTIVE_BLEND' | 'COMPOSITIONAL_BLEND';

/**
 * Terpene profile parameters for biphasic response curves
 */
interface TerpeneProfile {
  name: string;
  baseOptimalMin: number;
  baseOptimalMax: number;
  basePenaltySlope: number;
  activationWeight: number;
  sedationWeight: number;
  anxietyRiskWeight: number;
}

const TERPENE_PROFILES: TerpeneProfile[] = [
  {
    name: 'pinene',
    baseOptimalMin: 0.10,
    baseOptimalMax: 0.25,
    basePenaltySlope: 3.0,
    activationWeight: 0.25,
    sedationWeight: -0.15,
    anxietyRiskWeight: 0.10,
  },
  {
    name: 'limonene',
    baseOptimalMin: 0.12,
    baseOptimalMax: 0.28,
    basePenaltySlope: 2.5,
    activationWeight: 0.20,
    sedationWeight: -0.10,
    anxietyRiskWeight: 0.15,
  },
  {
    name: 'myrcene',
    baseOptimalMin: 0.15,
    baseOptimalMax: 0.30,
    basePenaltySlope: 2.0,
    activationWeight: -0.10,
    sedationWeight: 0.30,
    anxietyRiskWeight: -0.05,
  },
  {
    name: 'linalool',
    baseOptimalMin: 0.08,
    baseOptimalMax: 0.22,
    basePenaltySlope: 3.5,
    activationWeight: -0.15,
    sedationWeight: 0.25,
    anxietyRiskWeight: -0.20,
  },
  {
    name: 'caryophyllene',
    baseOptimalMin: 0.12,
    baseOptimalMax: 0.25,
    basePenaltySlope: 2.0,
    activationWeight: 0.05,
    sedationWeight: 0.05,
    anxietyRiskWeight: -0.15,
  },
  {
    name: 'humulene',
    baseOptimalMin: 0.05,
    baseOptimalMax: 0.15,
    basePenaltySlope: 3.0,
    activationWeight: -0.05,
    sedationWeight: 0.10,
    anxietyRiskWeight: -0.10,
  },
  {
    name: 'terpinolene',
    baseOptimalMin: 0.02,
    baseOptimalMax: 0.12,
    basePenaltySlope: 4.0,
    activationWeight: 0.15,
    sedationWeight: -0.05,
    anxietyRiskWeight: 0.20,
  },
  {
    name: 'ocimene',
    baseOptimalMin: 0.01,
    baseOptimalMax: 0.08,
    basePenaltySlope: 4.0,
    activationWeight: 0.10,
    sedationWeight: -0.05,
    anxietyRiskWeight: 0.10,
  },
];

/**
 * Biphasic scoring function
 */
function biphasicScore(
  concentration: number,
  optimalMin: number,
  optimalMax: number,
  penaltySlope: number
): number {
  if (concentration < optimalMin) return 0;
  if (concentration <= optimalMax) return 1;
  return Math.max(0, 1 - (concentration - optimalMax) * penaltySlope);
}

function getAdjustedRanges(
  profile: TerpeneProfile,
  intent: OutcomeIntent
): { optimalMin: number; optimalMax: number; penaltySlope: number } {
  const optimalMaxAdjustment = intent.anxietySensitivity * 0.15;
  const optimalMax = Math.max(
    profile.baseOptimalMin + 0.05,
    profile.baseOptimalMax - optimalMaxAdjustment
  );
  const penaltySlope = profile.basePenaltySlope * (1.5 - intent.overshootTolerance * 0.5);
  return {
    optimalMin: profile.baseOptimalMin,
    optimalMax,
    penaltySlope,
  };
}

function computeInteractionPenalty(
  terpeneA: string,
  terpeneB: string,
  concA: number,
  concB: number,
  totalLoad: number
): number {
  if (concA < 0.1 && concB < 0.1) return 0;
  const ratio = Math.max(concA, concB) / (Math.min(concA, concB) + 0.01);
  if (ratio > 5 && Math.min(concA, concB) > 0.05) {
    return 0.05 * Math.min(1, ratio / 10);
  }
  if (totalLoad > 0.03 && concA > 0.2 && concB > 0.2) {
    return 0.03;
  }
  return 0;
}

function computeBalanceScore(terpeneDistribution: { [key: string]: number }): number {
  const values = Object.values(terpeneDistribution);
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  if (mean === 0) return 0;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  const cv = stdDev / mean;
  const maxTerpene = Math.max(...values);
  const dominancePenalty = maxTerpene > 0.4 ? 0.15 : 0;
  return Math.max(0, 1.0 - cv * 0.5 - dominancePenalty);
}

/**
 * Check if chemotype is CBD/CBG dominant (used only for correction)
 */
function isNonPsychoactive(chemotype: CanonicalChemotype): boolean {
  const thc = chemotype.cannabinoids.THC || 0;
  const cbd = chemotype.cannabinoids.CBD || 0;
  const cbg = chemotype.cannabinoids.CBG || 0;
  return thc < 8 && (cbd > 8 || cbg > 8);
}

/**
 * Score chemotype with cannabinoid awareness
 */
function scoreCultivar(
  chemotype: CanonicalChemotype,
  intent: OutcomeIntent
): {
  score: number;
  terpeneScore: number;
  intentAlignment: number;
  interactionPenalty: number;
  cannabinoidScore: number;
} {
  let activationScore = 0;
  let sedationScore = 0;
  let anxietyRiskScore = 0;
  let terpeneScore = 1.0;
  let interactionPenalty = 0;

  const terpeneValues: { [key: string]: number } = {};
  for (const profile of TERPENE_PROFILES) {
    terpeneValues[profile.name] = chemotype.terpenes[profile.name] || 0;
  }

  const terpeneNames = Object.keys(terpeneValues);
  for (let i = 0; i < terpeneNames.length; i++) {
    const terpeneName = terpeneNames[i];
    const profile = TERPENE_PROFILES.find(p => p.name === terpeneName);
    if (!profile) continue;

    const concentration = terpeneValues[terpeneName];
    const { optimalMin, optimalMax, penaltySlope } = getAdjustedRanges(profile, intent);
    
    const biphasic = biphasicScore(concentration, optimalMin, optimalMax, penaltySlope);
    terpeneScore *= (0.3 + 0.7 * biphasic);

    activationScore += concentration * profile.activationWeight;
    sedationScore += concentration * profile.sedationWeight;
    anxietyRiskScore += concentration * profile.anxietyRiskWeight;

    for (let j = i + 1; j < terpeneNames.length; j++) {
      const otherName = terpeneNames[j];
      const otherConcentration = terpeneValues[otherName];
      const penalty = computeInteractionPenalty(
        terpeneName,
        otherName,
        concentration,
        otherConcentration,
        chemotype.totalTerpeneLoad / 100
      );
      interactionPenalty += penalty;
    }
  }

  activationScore = Math.max(0, Math.min(1, (activationScore + 1) / 2));
  sedationScore = Math.max(0, Math.min(1, (sedationScore + 1) / 2));
  anxietyRiskScore = Math.max(0, Math.min(1, (anxietyRiskScore + 1) / 2));

  const activationAlignment = 1.0 - Math.abs(activationScore - intent.activationTarget);
  const anxietyAlignment = 1.0 - (anxietyRiskScore * intent.anxietySensitivity);
  const enduranceAlignment = 1.0 - Math.abs(sedationScore - (1 - intent.cognitiveEndurance));

  const intentAlignment = (
    activationAlignment * 0.4 +
    anxietyAlignment * 0.4 +
    enduranceAlignment * 0.2
  );

  const finalTerpeneScore = terpeneScore * (1 - Math.min(interactionPenalty, 0.3));

  // Cannabinoid scoring: penalize THC overshoot relative to anxiety sensitivity
  const thc = chemotype.cannabinoids.THC || 0;
  const cbd = chemotype.cannabinoids.CBD || 0;
  const cbg = chemotype.cannabinoids.CBG || 0;
  
  // High THC with high anxiety sensitivity → penalty
  const thcRisk = intent.anxietySensitivity > 0.5 && thc > 20 ? 
    (thc - 20) / 20 * intent.anxietySensitivity : 0;
  
  // CBD/CBG reduce anxiety risk multiplicatively
  const cannabinoidScore = 1.0 - thcRisk * (1 - Math.min((cbd + cbg) / 30, 0.5));

  return {
    score: finalTerpeneScore * intentAlignment * cannabinoidScore,
    terpeneScore: finalTerpeneScore,
    intentAlignment,
    interactionPenalty,
    cannabinoidScore,
  };
}

type BlendRole = "primary" | "corrective" | "supporting";

interface BlendComponent {
  cultivarId: string;
  displayName: string;
  role: BlendRole;
  ratio: number;
}

interface ResolutionTier {
  tierLabel: "Optimal" | "Balanced" | "Simplified";
  compositionStrategy: CompositionStrategy;
  resolutionType: ResolutionType;
  composition: BlendComponent[];
  compositionFit: number;
  systemNotes: string[];
  whyChosen: string[];
  tradeoffs: string[];
  instructions: string; // Real-world mixing instructions
}

export type ResolutionMode = "BLENDED" | "STACKED";

interface StackedPhase {
  phase: "Primary / Early" | "Later / Wind-Down";
  intentFocus: string;
  composition: BlendComponent[];
  compositionFit: number;
  systemNotes: string[];
  instructions: string; // Real-world mixing/timing instructions
}

export interface OutcomeResult {
  resolutionMode?: ResolutionMode;
  tiers?: ResolutionTier[];
  phases?: StackedPhase[];
  refused?: boolean;
}

function computeBlendMetrics(
  components: Array<{ cultivar: CanonicalChemotype; ratio: number }>
): {
  terpeneDistribution: { [key: string]: number };
  totalLoad: number;
  balanceScore: number;
  interactionPenalty: number;
  avgTHC: number;
  avgCBD: number;
  avgCBG: number;
} {
  const terpeneDistribution: { [key: string]: number } = {};
  let totalLoad = 0;
  let interactionPenalty = 0;
  let totalTHC = 0;
  let totalCBD = 0;
  let totalCBG = 0;
  let totalRatio = 0;

  for (const comp of components) {
    const weight = comp.ratio / 100;
    totalLoad += comp.cultivar.totalTerpeneLoad * weight;
    totalTHC += (comp.cultivar.cannabinoids.THC || 0) * weight;
    totalCBD += (comp.cultivar.cannabinoids.CBD || 0) * weight;
    totalCBG += (comp.cultivar.cannabinoids.CBG || 0) * weight;
    totalRatio += weight;

    for (const [terpene, concentration] of Object.entries(comp.cultivar.terpenes)) {
      if (!terpeneDistribution[terpene]) {
        terpeneDistribution[terpene] = 0;
      }
      terpeneDistribution[terpene] += concentration * weight;
    }
  }

  const terpeneNames = Object.keys(terpeneDistribution);
  for (let i = 0; i < terpeneNames.length; i++) {
    for (let j = i + 1; j < terpeneNames.length; j++) {
      const penalty = computeInteractionPenalty(
        terpeneNames[i],
        terpeneNames[j],
        terpeneDistribution[terpeneNames[i]],
        terpeneDistribution[terpeneNames[j]],
        totalLoad / 100
      );
      interactionPenalty += penalty;
    }
  }

  const balanceScore = computeBalanceScore(terpeneDistribution);

  return {
    terpeneDistribution,
    totalLoad,
    balanceScore,
    interactionPenalty,
    avgTHC: totalRatio > 0 ? totalTHC / totalRatio : 0,
    avgCBD: totalRatio > 0 ? totalCBD / totalRatio : 0,
    avgCBG: totalRatio > 0 ? totalCBG / totalRatio : 0,
  };
}

/**
 * Evaluate single chemotype resolution
 */
function evaluateSingleCultivar(
  chemotype: CanonicalChemotype,
  intent: OutcomeIntent,
  scored: ReturnType<typeof scoreCultivar>
): { compositionFit: number; notes: string[] } {
  const metrics = computeBlendMetrics([{ cultivar: chemotype, ratio: 100 }]);
  
  const compositionFit = Math.max(0, Math.min(1, (
    scored.score * 0.6 +
    metrics.balanceScore * 0.2 -
    Math.min(scored.interactionPenalty, 0.2) * 0.1 +
    scored.cannabinoidScore * 0.1
  )));

  const notes: string[] = [];
  if (scored.intentAlignment > 0.75) {
    notes.push('Single cultivar satisfies outcome constraints');
  }
  if (metrics.avgTHC > 20 && intent.anxietySensitivity > 0.5) {
    notes.push('THC level within acceptable range for sensitivity');
  }

  return { compositionFit, notes };
}

/**
 * Generate corrective blend (primary + CBD/CBG to reduce overshoot)
 */
function generateCorrectiveBlend(
  primary: { cultivar: CanonicalChemotype; score: number },
  intent: OutcomeIntent,
  scoredCultivars: Array<{ cultivar: CanonicalChemotype; score: number }>
): BlendComponent[] | null {
  const cbdCbgCultivars = scoredCultivars.filter(sc => isNonPsychoactive(sc.cultivar));
  if (cbdCbgCultivars.length === 0) return null;

  const corrective = cbdCbgCultivars[0];
  
  // CBD/CBG ratios: 5-25% depending on overshoot risk
  const correctiveRatios = [5, 10, 15, 20, 25];
  let bestBlend: BlendComponent[] | null = null;
  let bestFit = -1;

  for (const corrPct of correctiveRatios) {
    if (corrPct > 25) continue;
    const primaryPct = 100 - corrPct;
    
    const metrics = computeBlendMetrics([
      { cultivar: primary.cultivar, ratio: primaryPct },
      { cultivar: corrective.cultivar, ratio: corrPct },
    ]);

    const fit = Math.max(0, Math.min(1, (
      primary.score * (primaryPct / 100) * 0.7 +
      metrics.balanceScore * 0.2 -
      metrics.interactionPenalty * 0.1
    )));

    if (fit > bestFit) {
      bestFit = fit;
      bestBlend = [
        { cultivarId: primary.cultivar.id, displayName: primary.cultivar.displayName, role: 'primary', ratio: primaryPct },
        { cultivarId: corrective.cultivar.id, displayName: corrective.cultivar.displayName, role: 'corrective', ratio: corrPct },
      ];
    }
  }

  return bestBlend;
}

/**
 * Generate compositional blend (multiple components for balance)
 */
function generateCompositionalBlend(
  scoredCultivars: Array<{ cultivar: CanonicalChemotype; score: number }>,
  intent: OutcomeIntent
): BlendComponent[] {
  const primary = scoredCultivars[0];
  const psychoactiveCultivars = scoredCultivars.filter(sc => !isNonPsychoactive(sc.cultivar));
  
  let bestBlend: BlendComponent[] = [
    { cultivarId: primary.cultivar.id, displayName: primary.cultivar.displayName, role: 'primary', ratio: 100 },
  ];
  let bestFit = -1;

  // Try 2-component blend
  if (psychoactiveCultivars.length >= 2) {
    const supporting = psychoactiveCultivars[1];
    const supportingRatios = [15, 20, 25, 30];
    
    for (const supPct of supportingRatios) {
      if (supPct > 30) continue;
      const primaryPct = 100 - supPct;
      
      const metrics = computeBlendMetrics([
        { cultivar: primary.cultivar, ratio: primaryPct },
        { cultivar: supporting.cultivar, ratio: supPct },
      ]);

      const fit = Math.max(0, Math.min(1, (
        primary.score * (primaryPct / 100) + supporting.score * (supPct / 100)
      ) * 0.6 + metrics.balanceScore * 0.3 - metrics.interactionPenalty * 0.1));

      if (fit > bestFit) {
        bestFit = fit;
        bestBlend = [
          { cultivarId: primary.cultivar.id, displayName: primary.cultivar.displayName, role: 'primary', ratio: primaryPct },
          { cultivarId: supporting.cultivar.id, displayName: supporting.cultivar.displayName, role: 'supporting', ratio: supPct },
        ];
      }
    }
  }

  // Try 3-component blend (only if overshoot tolerance allows)
  if (psychoactiveCultivars.length >= 3 && intent.overshootTolerance > 0.6) {
    const supporting = psychoactiveCultivars[1];
    const accent = psychoactiveCultivars[2];
    
    for (const supPct of [20, 25]) {
      for (const accPct of [5, 8, 10]) {
        const primaryPct = 100 - supPct - accPct;
        if (primaryPct < 60) continue;
        
        const metrics = computeBlendMetrics([
          { cultivar: primary.cultivar, ratio: primaryPct },
          { cultivar: supporting.cultivar, ratio: supPct },
          { cultivar: accent.cultivar, ratio: accPct },
        ]);

        const fit = Math.max(0, Math.min(1, (
          (primary.score * (primaryPct / 100) + 
           supporting.score * (supPct / 100) + 
           accent.score * (accPct / 100)) * 0.6 + 
          metrics.balanceScore * 0.3 - 
          metrics.interactionPenalty * 0.1
        )));

        if (fit > bestFit) {
          bestFit = fit;
          bestBlend = [
            { cultivarId: primary.cultivar.id, displayName: primary.cultivar.displayName, role: 'primary', ratio: primaryPct },
            { cultivarId: supporting.cultivar.id, displayName: supporting.cultivar.displayName, role: 'supporting', ratio: supPct },
            { cultivarId: accent.cultivar.id, displayName: accent.cultivar.displayName, role: 'supporting', ratio: accPct },
          ];
        }
      }
    }
  }

  // Normalize ratios
  const sum = bestBlend.reduce((s, c) => s + c.ratio, 0);
  if (sum > 0 && sum !== 100) {
    bestBlend = bestBlend.map(c => ({
      ...c,
      ratio: Math.round((c.ratio / sum) * 100),
    }));
    const newSum = bestBlend.reduce((s, c) => s + c.ratio, 0);
    if (newSum !== 100) {
      bestBlend[0].ratio += (100 - newSum);
    }
  }

  return bestBlend;
}

/**
 * Select composition strategy based on intent and temporal requirements
 * This decision happens BEFORE cultivar selection
 */
function selectCompositionStrategy(intent: OutcomeIntent): CompositionStrategy {
  // Multi-phase intent → layered_stack
  if (intent.temporalProfile === 'multi-phase' && intent.phases && intent.phases.length >= 2) {
    // Check if phases are sufficiently different to warrant stacking
    const phase1 = intent.phases[0];
    const phase2 = intent.phases[1];
    
    const activationDiff = Math.abs(phase1.activationTarget - phase2.activationTarget);
    const cognitiveDiff = Math.abs(phase1.cognitiveEndurance - phase2.cognitiveEndurance);
    
    // If phases are very different (e.g., energized now, calm later), use layered stack
    if (activationDiff > 0.3 || cognitiveDiff > 0.3) {
      return 'layered_stack';
    }
  }
  
  // Single-phase: prefer homogeneous_blend by default
  // Single cultivar will only be chosen if demonstrably optimal (see generateTiers)
  return 'homogeneous_blend';
}

/**
 * Generate real-world mixing instructions based on composition strategy and blend
 */
function generateInstructions(
  strategy: CompositionStrategy,
  composition: BlendComponent[],
  resolutionType: ResolutionType
): string {
  if (strategy === 'single_cultivar') {
    return `Use ${composition[0].displayName} as-is. No blending required.`;
  }
  
  if (strategy === 'homogeneous_blend') {
    const ratios = composition.map(c => `${c.displayName} (${c.ratio}%)`).join(', ');
    if (composition.length === 2) {
      return `Mix ${composition[0].displayName} (${composition[0].ratio}%) and ${composition[1].displayName} (${composition[1].ratio}%) evenly throughout. Combine in a single container and use the blend uniformly.`;
    } else if (composition.length === 3) {
      return `Mix ${ratios} evenly throughout. Combine all three in a single container and use the blend uniformly.`;
    } else {
      return `Mix ${ratios} evenly throughout. Combine all components in a single container and use the blend uniformly.`;
    }
  }
  
  if (strategy === 'layered_stack') {
    // Instructions for layered stacks are generated per-phase
    // This is a fallback; normally handled in generateStackedResolution
    const ratios = composition.map(c => `${c.displayName} (${c.ratio}%)`).join(', ');
    return `Use ${ratios} as a layered composition. Follow phase-specific timing guidance.`;
  }
  
  return `Mix ${composition.map(c => `${c.displayName} (${c.ratio}%)`).join(', ')} according to the composition strategy.`;
}

/**
 * Classify resolution type (for backward compatibility)
 */
function classifyResolutionType(
  blend: BlendComponent[],
  primaryChemotype: CanonicalChemotype
): ResolutionType {
  if (blend.length === 1) return 'SINGLE_CULTIVAR';
  
  const hasCorrective = blend.some(c => 
    c.role === 'corrective' || 
    isNonPsychoactive(canonicalChemotypes.find(cv => cv.id === c.cultivarId)!)
  );
  
  if (hasCorrective) return 'CORRECTIVE_BLEND';
  return 'COMPOSITIONAL_BLEND';
}

/**
 * Generate resolution tiers (BLEND-FIRST)
 * 
 * Blending is the default strategy. Single cultivar is only chosen when:
 * - Single cultivar fit is exceptionally high (>0.85)
 * - Blends do not improve fit by at least 0.05
 * - Adding compounds would reduce outcome fidelity
 */
function generateTiers(
  scoredCultivars: Array<{ cultivar: CanonicalChemotype; score: number }>,
  intent: OutcomeIntent
): ResolutionTier[] {
  const primary = scoredCultivars[0];
  const primaryScored = scoreCultivar(primary.cultivar, intent);
  const singleResult = evaluateSingleCultivar(primary.cultivar, intent, primaryScored);
  
  const tiers: ResolutionTier[] = [];
  const strategy = selectCompositionStrategy(intent); // Strategy is homogeneous_blend for single-phase
  
  // BLEND-FIRST: Try blends first (Tier A: Optimal, Tier B: Balanced)
  
  // Tier A: Optimal (3-component blend or corrective blend)
  const correctiveBlend = generateCorrectiveBlend(primary, intent, scoredCultivars);
  const compositional3 = generateCompositionalBlend(scoredCultivars.slice(0, 4), intent);
  
  let optimalBlend = compositional3;
  let optimalFit = 0;
  let optimalResolutionType: ResolutionType = 'COMPOSITIONAL_BLEND';
  
  // Try 3-component compositional blend first
  if (compositional3.length === 3) {
    const metrics3 = computeBlendMetrics(
      compositional3.map(c => ({
        cultivar: canonicalChemotypes.find(cv => cv.id === c.cultivarId)!,
        ratio: c.ratio,
      }))
    );
    
    optimalFit = Math.max(0, Math.min(1, (
      compositional3.reduce((sum, c) => {
        const sc = scoredCultivars.find(sc => sc.cultivar.id === c.cultivarId)!;
        return sum + sc.score * (c.ratio / 100);
      }, 0) * 0.6 + metrics3.balanceScore * 0.3 - metrics3.interactionPenalty * 0.1
    )));
    optimalBlend = compositional3;
    optimalResolutionType = classifyResolutionType(compositional3, primary.cultivar);
  }
  
  // Try corrective blend if it improves fit
  if (correctiveBlend && correctiveBlend.length === 2) {
    const metricsCorr = computeBlendMetrics(
      correctiveBlend.map(c => ({
        cultivar: canonicalChemotypes.find(cv => cv.id === c.cultivarId)!,
        ratio: c.ratio,
      }))
    );
    
    const fitCorr = Math.max(0, Math.min(1, (
      primaryScored.score * (correctiveBlend[0].ratio / 100) * 0.7 +
      metricsCorr.balanceScore * 0.2 -
      metricsCorr.interactionPenalty * 0.1
    )));
    
    if (fitCorr > optimalFit && primaryScored.cannabinoidScore < 0.85) {
      optimalFit = fitCorr;
      optimalBlend = correctiveBlend;
      optimalResolutionType = classifyResolutionType(correctiveBlend, primary.cultivar);
    }
  }

  // Add Optimal tier if blend improves over single cultivar or is acceptable
  if (optimalFit > 0.4 && optimalBlend.length > 1) {
    const isCorrective = optimalBlend.some(c => c.role === 'corrective');
    tiers.push({
      tierLabel: 'Optimal',
      compositionStrategy: strategy,
      resolutionType: optimalResolutionType,
      composition: optimalBlend,
      compositionFit: optimalFit,
      systemNotes: [
        optimalBlend.length > 2 ? 
          'Multi-component blend for precise chemical control' :
          'Corrective blend to reduce overshoot risk',
        'Highest precision with additional components',
      ],
      whyChosen: [
        isCorrective 
          ? 'Corrective component reduces THC overshoot and anxiety risk while preserving terpene intent.'
          : 'Multiple components allow precise terpene ratio control for optimal outcome alignment.',
        'Highest chemical precision achievable within safety constraints.',
      ],
      tradeoffs: [
        'Increased component count adds complexity.',
        optimalBlend.length > 2 
          ? 'More components may introduce subtle interaction effects.'
          : 'Sedation constrained to avoid early-phase penalties.',
      ],
      instructions: generateInstructions(strategy, optimalBlend, optimalResolutionType),
    });
  }

  // Tier B: Balanced (2-component blend)
  const compositional2 = generateCompositionalBlend(scoredCultivars.slice(0, 3), intent);
  if (compositional2.length === 2) {
    const metrics2 = computeBlendMetrics(
      compositional2.map(c => ({
        cultivar: canonicalChemotypes.find(cv => cv.id === c.cultivarId)!,
        ratio: c.ratio,
      }))
    );
    
    const fit2 = Math.max(0, Math.min(1, (
      primaryScored.score * (compositional2[0].ratio / 100) +
      scoredCultivars.find(sc => sc.cultivar.id === compositional2[1].cultivarId)!.score * (compositional2[1].ratio / 100)
    ) * 0.6 + metrics2.balanceScore * 0.3 - metrics2.interactionPenalty * 0.1));
    
    const resolutionType2 = classifyResolutionType(compositional2, primary.cultivar);
    
    // Add Balanced tier if it's reasonable (fit > 0.35) and not worse than single by more than 0.1
    if (fit2 > 0.35 && fit2 >= singleResult.compositionFit - 0.1) {
      tiers.push({
        tierLabel: 'Balanced',
        compositionStrategy: strategy,
        resolutionType: resolutionType2,
        composition: compositional2,
        compositionFit: fit2,
        systemNotes: [
          'Two-component blend for improved balance',
          'Moderate precision with fewer components',
        ],
        whyChosen: [
          'Two-component blend provides better terpene balance than a single profile.',
          'Moderate complexity while improving chemical precision.',
        ],
        tradeoffs: [
          'Lower precision than optimal tier with more components.',
          'Fewer components means less fine-grained control.',
        ],
        instructions: generateInstructions(strategy, compositional2, resolutionType2),
      });
    }
  }

  // Tier C: Simplified (single cultivar) - ONLY if demonstrably optimal
  // Single cultivar is rare and must be justified:
  // - Exceptionally high fit (>0.85)
  // - Blends don't improve significantly (or single is actually better)
  const singleBlend: BlendComponent[] = [{
    cultivarId: primary.cultivar.id,
    displayName: primary.cultivar.displayName,
    role: 'primary',
    ratio: 100,
  }];
  
  const singleNotes = [
    'Single cultivar resolution',
    ...singleResult.notes,
  ];
  
  // Single cultivar only if:
  // 1. Fit is exceptionally high (>0.85), OR
  // 2. Fit is very good (>0.75) AND no blends improved it by at least 0.05
  const bestBlendFit = tiers.length > 0 ? Math.max(...tiers.map(t => t.compositionFit)) : 0;
  const singleIsOptimal = singleResult.compositionFit > 0.85 || 
                          (singleResult.compositionFit > 0.75 && singleResult.compositionFit >= bestBlendFit - 0.02);
  
  if (singleIsOptimal && singleResult.compositionFit > 0.35) {
    tiers.push({
      tierLabel: 'Simplified',
      compositionStrategy: 'single_cultivar',
      resolutionType: 'SINGLE_CULTIVAR',
      composition: singleBlend,
      compositionFit: singleResult.compositionFit,
      systemNotes: singleNotes,
      whyChosen: [
        'A single chemotype profile cleanly satisfies all outcome constraints.',
        'Adding compounds would not improve fidelity and may introduce unnecessary complexity.',
      ],
      tradeoffs: [
        'Single cultivar offers less precision than multi-component blends.',
        'Cannot fine-tune specific terpene ratios as precisely as blends.',
      ],
      instructions: generateInstructions('single_cultivar', singleBlend, 'SINGLE_CULTIVAR'),
    });
  }

  // Sort tiers by fit (descending) - blends first, single last if present
  tiers.sort((a, b) => {
    // If both are blends or both are single, sort by fit
    if ((a.compositionStrategy !== 'single_cultivar') === (b.compositionStrategy !== 'single_cultivar')) {
      return b.compositionFit - a.compositionFit;
    }
    // Blends come before single cultivar
    if (a.compositionStrategy !== 'single_cultivar') return -1;
    return 1;
  });

  return tiers;
}

/**
 * Attempt unified blended solution for multi-phase intent
 * Returns null if penalties increase or tradeoffs required
 */
function attemptUnifiedBlended(
  phase1: OutcomeIntent,
  phase2: OutcomeIntent,
  scoredCultivars: Array<{ cultivar: CanonicalChemotype; score: number; terpeneScore: number; intentAlignment: number; interactionPenalty: number; cannabinoidScore: number }>
): { blend: BlendComponent[]; fit: number; earlyPenalty: number; latePenalty: number } | null {
  // Score cultivars for both phases
  const phase1Scored = scoredCultivars.map(sc => ({
    ...sc,
    phase1Score: scoreCultivar(sc.cultivar, phase1).score,
  }));
  const phase2Scored = scoredCultivars.map(sc => ({
    ...sc,
    phase2Score: scoreCultivar(sc.cultivar, phase2).score,
  }));

  // Find cultivars that work well for both
  const combinedScored = phase1Scored.map(p1 => {
    const p2 = phase2Scored.find(p => p.cultivar.id === p1.cultivar.id)!;
    const combinedScore = (p1.phase1Score * 0.5 + p2.phase2Score * 0.5);
    return { ...p1, combinedScore, phase2Score: p2.phase2Score };
  });

  combinedScored.sort((a, b) => b.combinedScore - a.combinedScore);
  const primary = combinedScored[0];

  // Try single cultivar
  const singleCultivar = scoreCultivar(primary.cultivar, phase1);
  const singleCultivar2 = scoreCultivar(primary.cultivar, phase2);
  
  const earlyPenalty = 1.0 - singleCultivar.score;
  const latePenalty = 1.0 - singleCultivar2.score;

  // If single cultivar works well for both, it's acceptable
  if (earlyPenalty < 0.15 && latePenalty < 0.15) {
    return {
      blend: [{
        cultivarId: primary.cultivar.id,
        displayName: primary.cultivar.displayName,
        role: 'primary',
        ratio: 100,
      }],
      fit: (singleCultivar.score + singleCultivar2.score) / 2,
      earlyPenalty,
      latePenalty,
    };
  }

  // Try 2-component blend
  if (combinedScored.length >= 2) {
    const supporting = combinedScored[1];
    const blend = generateCompositionalBlend(
      combinedScored.slice(0, 3).map(sc => ({ cultivar: sc.cultivar, score: sc.combinedScore })),
      { ...phase1, activationTarget: (phase1.activationTarget + phase2.activationTarget) / 2 }
    );

    if (blend.length === 2) {
      const metrics = computeBlendMetrics(
        blend.map(c => ({
          cultivar: canonicalChemotypes.find(cv => cv.id === c.cultivarId)!,
          ratio: c.ratio,
        }))
      );

      // Score blend against both phases using weighted scores
      const blendComponents = blend.map(c => {
        const sc1 = phase1Scored.find(sc => sc.cultivar.id === c.cultivarId)!;
        const sc2 = phase2Scored.find(sc => sc.cultivar.id === c.cultivarId)!;
        return {
          phase1Score: sc1.phase1Score,
          phase2Score: sc2.phase2Score,
          ratio: c.ratio,
        };
      });

      const fit1 = blendComponents.reduce((sum, comp) => 
        sum + comp.phase1Score * (comp.ratio / 100), 0);
      const fit2 = blendComponents.reduce((sum, comp) => 
        sum + comp.phase2Score * (comp.ratio / 100), 0);

      const combinedFit = (fit1 + fit2) / 2;
      const newEarlyPenalty = 1.0 - fit1;
      const newLatePenalty = 1.0 - fit2;

      // Check if penalties increased
      if (newEarlyPenalty > earlyPenalty + 0.05 || newLatePenalty > latePenalty + 0.05) {
        return null; // Penalties increased, reject unified
      }

      return {
        blend,
        fit: combinedFit,
        earlyPenalty: newEarlyPenalty,
        latePenalty: newLatePenalty,
      };
    }
  }

  return null;
}

/**
 * Generate stacked resolution for multi-phase intent (layered_stack strategy)
 * 
 * Each phase has its own composition optimized for that temporal window.
 * Ratios may differ by phase. Aggregate chemistry is evaluated across the full experience.
 */
function generateStackedResolution(
  phase1: OutcomeIntent,
  phase2: OutcomeIntent
): StackedPhase[] {
  const phases: StackedPhase[] = [];

  // Resolve Phase 1 (Early/Primary phase)
  const phase1Result = resolveOutcome(phase1);
  if (phase1Result.tiers && phase1Result.tiers.length > 0) {
    const bestPhase1 = phase1Result.tiers[0];
    const phase1IntentFocus = phase1.activationTarget > 0.6 ? 'alert / social / active' : 
                              phase1.activationTarget < 0.4 ? 'relaxed / calm' : 'balanced';
    
    // Generate instructions for early phase (top/base guidance)
    const phase1Instructions = bestPhase1.composition.length === 1
      ? `Use ${bestPhase1.composition[0].displayName} for the early/primary phase. Start with this composition.`
      : `Mix ${bestPhase1.composition.map(c => `${c.displayName} (${c.ratio}%)`).join(', ')} for the early/primary phase. Combine and use first.`;
    
    phases.push({
      phase: 'Primary / Early',
      intentFocus: phase1IntentFocus,
      composition: bestPhase1.composition,
      compositionFit: bestPhase1.compositionFit,
      systemNotes: bestPhase1.systemNotes,
      instructions: phase1Instructions,
    });
  }

  // Resolve Phase 2 (Later/Wind-down phase)
  const phase2Result = resolveOutcome(phase2);
  if (phase2Result.tiers && phase2Result.tiers.length > 0) {
    const bestPhase2 = phase2Result.tiers[0];
    const phase2IntentFocus = phase2.activationTarget < 0.4 ? 'relaxation / recovery' :
                              phase2.activationTarget > 0.6 ? 'sustained energy' : 'balanced transition';
    
    // Generate instructions for later phase (timing guidance)
    const phase2Instructions = bestPhase2.composition.length === 1
      ? `Use ${bestPhase2.composition[0].displayName} for the later/wind-down phase. Transition to this after the early phase.`
      : `Mix ${bestPhase2.composition.map(c => `${c.displayName} (${c.ratio}%)`).join(', ')} for the later/wind-down phase. Use after the early phase composition.`;
    
    phases.push({
      phase: 'Later / Wind-Down',
      intentFocus: phase2IntentFocus,
      composition: bestPhase2.composition,
      compositionFit: bestPhase2.compositionFit,
      systemNotes: bestPhase2.systemNotes,
      instructions: phase2Instructions,
    });
  }

  return phases;
}

/**
 * Resolve outcome with tiered resolutions or stacked phases
 * Throws if intent is invalid or missing
 */
export function resolveOutcome(intent: OutcomeIntent): OutcomeResult {
  // Validate intent - refuse to execute if invalid
  if (!intent || typeof intent !== 'object') {
    throw new Error('Invalid intent: intent object is required');
  }

  const requiredFields: (keyof OutcomeIntent)[] = ['activationTarget', 'anxietySensitivity', 'cognitiveEndurance', 'overshootTolerance'];
  for (const field of requiredFields) {
    if (typeof intent[field] !== 'number') {
      throw new Error(`Invalid intent: ${field} must be a number`);
    }
    if (intent[field] < 0 || intent[field] > 1) {
      throw new Error(`Invalid intent: ${field} must be between 0 and 1`);
    }
  }

  // Validate temporal profile if present
  if (intent.temporalProfile && intent.temporalProfile !== 'single-phase' && intent.temporalProfile !== 'multi-phase') {
    throw new Error('Invalid intent: temporalProfile must be "single-phase" or "multi-phase"');
  }

  // Validate phases if multi-phase
  if (intent.temporalProfile === 'multi-phase') {
    if (!intent.phases || !Array.isArray(intent.phases) || intent.phases.length < 2) {
      throw new Error('Invalid intent: multi-phase requires at least 2 phases');
    }
    for (const phase of intent.phases) {
      if (!phase.phase || (phase.phase !== 'Primary / Early' && phase.phase !== 'Later / Wind-Down')) {
        throw new Error('Invalid intent: phase.phase must be "Primary / Early" or "Later / Wind-Down"');
      }
      for (const field of requiredFields) {
        if (typeof (phase as any)[field] !== 'number' || (phase as any)[field] < 0 || (phase as any)[field] > 1) {
          throw new Error(`Invalid intent: phase.${field} must be a number between 0 and 1`);
        }
      }
    }
  }

  // Handle multi-phase intent
  if (intent.temporalProfile === 'multi-phase' && intent.phases && intent.phases.length >= 2) {
    const phase1 = intent.phases[0];
    const phase2 = intent.phases[1];

    // Attempt unified blended solution
    const clampedIntent1: OutcomeIntent = {
      activationTarget: Math.max(0, Math.min(1, phase1.activationTarget)),
      anxietySensitivity: Math.max(0, Math.min(1, phase1.anxietySensitivity)),
      cognitiveEndurance: Math.max(0, Math.min(1, phase1.cognitiveEndurance)),
      overshootTolerance: Math.max(0, Math.min(1, phase1.overshootTolerance)),
    };
    const clampedIntent2: OutcomeIntent = {
      activationTarget: Math.max(0, Math.min(1, phase2.activationTarget)),
      anxietySensitivity: Math.max(0, Math.min(1, phase2.anxietySensitivity)),
      cognitiveEndurance: Math.max(0, Math.min(1, phase2.cognitiveEndurance)),
      overshootTolerance: Math.max(0, Math.min(1, phase2.overshootTolerance)),
    };

    const scoredCultivars = canonicalChemotypes
      .filter(cv => !isNonPsychoactive(cv) || cv.id.includes('cbd') || cv.id.includes('cbg'))
      .map(cultivar => {
        const scored = scoreCultivar(cultivar, clampedIntent1);
        return { cultivar, ...scored };
      });

    scoredCultivars.sort((a, b) => b.score - a.score);

    const unified = attemptUnifiedBlended(clampedIntent1, clampedIntent2, scoredCultivars);

    if (unified && unified.earlyPenalty < 0.2 && unified.latePenalty < 0.2) {
      // Unified blended solution acceptable (homogeneous blend strategy)
      const unifiedResolutionType = unified.blend.length === 1 ? 'SINGLE_CULTIVAR' : 
                         unified.blend.some(c => isNonPsychoactive(canonicalChemotypes.find(cv => cv.id === c.cultivarId)!)) ? 
                         'CORRECTIVE_BLEND' : 'COMPOSITIONAL_BLEND';
      return {
        resolutionMode: 'BLENDED',
        tiers: [{
          tierLabel: 'Optimal',
          compositionStrategy: unified.blend.length === 1 ? 'single_cultivar' : 'homogeneous_blend',
          resolutionType: unifiedResolutionType,
          composition: unified.blend,
          compositionFit: unified.fit,
          systemNotes: [
            'A single composition was able to support both phases without introducing early sedation or instability.',
            'Unified blend optimized for both early and later phases.',
          ],
          whyChosen: [
            'Single blend satisfies both early and later phase requirements without introducing penalties.',
            'Unified composition avoids the complexity of stacked resolutions.',
          ],
          tradeoffs: [
            'Requires finding a balance point that works for both temporal phases.',
            'May be less optimal than separate compositions for each phase.',
          ],
          instructions: generateInstructions(
            unified.blend.length === 1 ? 'single_cultivar' : 'homogeneous_blend',
            unified.blend,
            unifiedResolutionType
          ),
        }],
        refused: false,
      };
    } else {
      // Stacked resolution required
      const phases = generateStackedResolution(clampedIntent1, clampedIntent2);
      
      // Add explanation to first phase about why stacking was chosen
      if (phases.length > 0) {
        phases[0].systemNotes.unshift(
          'Your goal included both an active phase and a later wind-down phase.',
          'Combining these into a single blend would require compromises that increase early-phase risk.',
          'Separating them allows each phase to be optimized safely.'
        );
      }
      
      return {
        resolutionMode: 'STACKED',
        phases,
        refused: phases.length < 2,
        tiers: undefined,
      };
    }
  }

  // Single-phase intent: standard resolution
  const clampedIntent: OutcomeIntent = {
    activationTarget: Math.max(0, Math.min(1, intent.activationTarget)),
    anxietySensitivity: Math.max(0, Math.min(1, intent.anxietySensitivity)),
    cognitiveEndurance: Math.max(0, Math.min(1, intent.cognitiveEndurance)),
    overshootTolerance: Math.max(0, Math.min(1, intent.overshootTolerance)),
    temporalProfile: intent.temporalProfile || 'single-phase',
  };

  const scoredCultivars = canonicalChemotypes
    .filter(cv => !isNonPsychoactive(cv) || cv.id.includes('cbd') || cv.id.includes('cbg'))
    .map(chemotype => {
      const scored = scoreCultivar(chemotype, clampedIntent);
      return { cultivar: chemotype, ...scored };
    });

  scoredCultivars.sort((a, b) => b.score - a.score);

  const tiers = generateTiers(scoredCultivars, clampedIntent);

  if (tiers.length === 0) {
    return {
      resolutionMode: 'BLENDED',
      tiers: [],
      refused: true,
    };
  }

  return {
    resolutionMode: 'BLENDED',
    tiers,
    refused: false,
  };
}
