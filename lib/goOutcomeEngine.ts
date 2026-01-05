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
    phase: "Top / Opening" | "Middle / Core" | "End / Landing" | "Primary / Early" | "Later / Wind-Down"; // Support both 2-phase and 3-phase models
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
  phase: "Top / Opening" | "Middle / Core" | "End / Landing" | "Primary / Early" | "Later / Wind-Down"; // Support both 2-phase and 3-phase models
  intentFocus: string;
  composition: BlendComponent[];
  compositionFit: number;
  systemNotes: string[];
  instructions: string; // Real-world mixing/timing instructions
  purpose?: string; // User-friendly purpose description (e.g., "social lift, focus, creativity")
  whatYoullFeel?: string; // User-friendly outcome description (e.g., "upbeat, clear, energized")
}

/**
 * Resolution failure contract
 * Returned when resolver cannot produce a valid blend
 */
export type ResolutionFailure = {
  status: 'invalid';
  reason:
    | 'INSUFFICIENT_DISTINCT_CULTIVARS'
    | 'INVENTORY_TOO_NARROW'
    | 'CONSTRAINT_CONFLICT'
    | 'PERCENTAGE_INVALID';
  details?: string;
};

/**
 * Formal output contract for GO Line deterministic engine
 * 
 * This is the SINGLE SOURCE OF TRUTH for all recommendations.
 * No other path may generate recommendations.
 */
export interface OutcomeResult {
  resolutionMode?: ResolutionMode;
  tiers?: ResolutionTier[];
  phases?: StackedPhase[];
  refused?: boolean;
  
  // Formal contract fields (canonical schema)
  confidenceScore?: number; // 0-1: How well the resolution matches intent
  tradeoffs?: string[]; // Explicit tradeoffs made in this resolution
  rationaleSummary?: string; // Human-readable explanation (non-secret methodology)
  
  // Failure state (mutually exclusive with tiers/phases)
  failure?: ResolutionFailure;
}

/**
 * Validate blend composition according to PART 1 rules
 * Returns null if valid, ResolutionFailure if invalid
 */
function validateBlendComposition(
  composition: BlendComponent[],
  isStacked: boolean = false
): ResolutionFailure | null {
  // Rule 1: Cultivar Uniqueness
  const uniqueIds = new Set(composition.map(c => c.cultivarId));
  const minRequired = isStacked ? 3 : 2;
  
  if (uniqueIds.size < minRequired) {
    return {
      status: 'invalid',
      reason: 'INSUFFICIENT_DISTINCT_CULTIVARS',
      details: `Blend requires at least ${minRequired} distinct cultivars, found ${uniqueIds.size}`,
    };
  }
  
  // Check for duplicate cultivars in different roles
  const cultivarIdsByRole = new Map<string, Set<string>>();
  for (const comp of composition) {
    if (!cultivarIdsByRole.has(comp.role)) {
      cultivarIdsByRole.set(comp.role, new Set());
    }
    cultivarIdsByRole.get(comp.role)!.add(comp.cultivarId);
  }
  
  // Ensure no cultivar appears in multiple roles
  const allCultivarIds = Array.from(uniqueIds);
  for (const id of allCultivarIds) {
    let roleCount = 0;
    for (const roleSet of cultivarIdsByRole.values()) {
      if (roleSet.has(id)) roleCount++;
    }
    if (roleCount > 1) {
      return {
        status: 'invalid',
        reason: 'INSUFFICIENT_DISTINCT_CULTIVARS',
        details: `Cultivar ${id} appears in multiple roles - invalid composition`,
      };
    }
  }
  
  // Rule 2: Percentage Integrity
  const totalPercentage = composition.reduce((sum, c) => sum + c.ratio, 0);
  if (Math.abs(totalPercentage - 100) > 0.01) {
    return {
      status: 'invalid',
      reason: 'PERCENTAGE_INVALID',
      details: `Percentages sum to ${totalPercentage}%, must be exactly 100%`,
    };
  }
  
  // Each cultivar must be >= 5%
  for (const comp of composition) {
    if (comp.ratio < 5) {
      return {
        status: 'invalid',
        reason: 'PERCENTAGE_INVALID',
        details: `Cultivar ${comp.cultivarId} has ${comp.ratio}%, minimum is 5%`,
      };
    }
    
    // No single cultivar may exceed 85% unless explicitly configured
    if (comp.ratio > 85 && composition.length > 1) {
      return {
        status: 'invalid',
        reason: 'PERCENTAGE_INVALID',
        details: `Cultivar ${comp.cultivarId} exceeds 85% in multi-cultivar blend`,
      };
    }
  }
  
  return null; // Valid
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
 * Detect when stacking is appropriate (PART 5.A)
 * Stacking should be considered when ANY of the following are true:
 * - User expresses multiple desired outcomes over time
 * - Desired outcome contains conflicting phases
 * - User wants multiple experiences in one session
 * - System detects that a single blend would require excessive compromise
 */
function shouldUseStacking(intent: OutcomeIntent): boolean {
  // Multi-phase intent explicitly requested
  if (intent.temporalProfile === 'multi-phase' && intent.phases && intent.phases.length >= 2) {
    return true;
  }
  
  // Check for conflicting single-phase goals that suggest stacking
  // If activation is high early but sedation is desired later, stacking may be better
  // This is detected at the strategic guidance level, so if we get here with single-phase,
  // trust the guidance layer and default to blending
  return false;
}

/**
 * Select composition strategy based on intent and temporal requirements
 * This decision happens BEFORE cultivar selection
 */
function selectCompositionStrategy(intent: OutcomeIntent): CompositionStrategy {
  // Enhanced stacking detection
  if (shouldUseStacking(intent)) {
    if (intent.phases && intent.phases.length >= 2) {
      // Check if phases are sufficiently different to warrant stacking
      const phase1 = intent.phases[0];
      const phase2 = intent.phases[intent.phases.length - 1]; // Compare first and last
      
      const activationDiff = Math.abs(phase1.activationTarget - phase2.activationTarget);
      const cognitiveDiff = Math.abs(phase1.cognitiveEndurance - phase2.cognitiveEndurance);
      
      // If phases are very different (e.g., energized now, calm later), use layered stack
      if (activationDiff > 0.3 || cognitiveDiff > 0.3 || intent.phases.length > 2) {
        return 'layered_stack';
      }
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
    // Validate blend before adding
    const validationError = validateBlendComposition(optimalBlend, false);
    if (validationError) {
      // Skip invalid blend - don't add to tiers
    } else {
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
      // Validate blend before adding
      const validationError = validateBlendComposition(compositional2, false);
      if (validationError) {
        // Skip invalid blend - don't add to tiers
      } else {
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
 * PART 5.C & 5.D: Each phase has its own terpene vector and CBD rules are applied:
 * - CBD may appear only in later phases
 * - CBD should be heavier in the end/landing phase
 * - CBD omitted entirely in early phases if activation is desired
 * - CBD rarely dominates opening phase unless calm onset is explicitly desired
 * 
 * Supports both 2-phase (Primary/Early, Later/Wind-Down) and 3-phase (Top/Opening, Middle/Core, End/Landing) models
 */
function generateStackedResolution(
  phase1: OutcomeIntent,
  phase2: OutcomeIntent,
  phase3?: OutcomeIntent
): StackedPhase[] {
  const phases: StackedPhase[] = [];
  const is3Phase = phase3 !== undefined;

  // Helper: Filter out CBD from composition for early phases (unless calm onset desired)
  const filterCBDForEarlyPhase = (composition: BlendComponent[], intent: OutcomeIntent): BlendComponent[] => {
    // CBD allowed in opening phase ONLY if calm onset is desired (activation < 0.4)
    if (intent.activationTarget >= 0.4) {
      return composition.filter(comp => {
        const chemotype = canonicalChemotypes.find(cv => cv.id === comp.cultivarId);
        return !chemotype || !isNonPsychoactive(chemotype);
      });
    }
    return composition;
  };

  // Helper: Enhance end phase with CBD if needed
  const enhanceEndPhaseWithCBD = (composition: BlendComponent[], intent: OutcomeIntent): BlendComponent[] => {
    // If end phase needs calming and doesn't already have CBD, consider adding it
    if (intent.activationTarget < 0.5) {
      const hasCBD = composition.some(comp => {
        const chemotype = canonicalChemotypes.find(cv => cv.id === comp.cultivarId);
        return chemotype && isNonPsychoactive(chemotype);
      });
      
      // If no CBD and calming is desired, try to add it (but don't force if composition is already good)
      if (!hasCBD) {
        // Find CBD cultivar
        const cbdCultivar = canonicalChemotypes.find(cv => isNonPsychoactive(cv));
        if (cbdCultivar) {
          // Add CBD as 15-25% of end phase
          const newComposition = [...composition];
          const cbdRatio = Math.min(25, 100 - newComposition.reduce((sum, c) => sum + c.ratio, 0));
          if (cbdRatio > 0) {
            // Reduce other components proportionally
            const otherTotal = newComposition.reduce((sum, c) => sum + c.ratio, 0);
            const scaleFactor = (100 - cbdRatio) / otherTotal;
            newComposition.forEach(c => c.ratio = Math.round(c.ratio * scaleFactor));
            newComposition.push({
              cultivarId: cbdCultivar.id,
              displayName: cbdCultivar.displayName || 'CBD Flower',
              role: 'corrective',
              ratio: cbdRatio,
            });
            return newComposition;
          }
        }
      }
    }
    return composition;
  };

  // Helper: Generate purpose and whatYoullFeel descriptions
  const generatePurpose = (intent: OutcomeIntent, phaseType: string): string => {
    if (phaseType === 'Top / Opening' || phaseType === 'Primary / Early') {
      if (intent.activationTarget > 0.6) return 'social lift, focus, creativity';
      if (intent.activationTarget < 0.4) return 'calm onset, gentle start';
      return 'balanced activation';
    }
    if (phaseType === 'Middle / Core') {
      if (intent.activationTarget > 0.6) return 'sustained energy, peak experience';
      if (intent.activationTarget < 0.4) return 'relaxed balance, steady calm';
      return 'main outcome delivery';
    }
    if (phaseType === 'End / Landing' || phaseType === 'Later / Wind-Down') {
      if (intent.activationTarget < 0.4) return 'calm, relief, sleep, closure';
      return 'smooth wind-down, gentle transition';
    }
    return 'optimized for this phase';
  };

  const generateWhatYoullFeel = (intent: OutcomeIntent, phaseType: string): string => {
    if (phaseType === 'Top / Opening' || phaseType === 'Primary / Early') {
      if (intent.activationTarget > 0.6) return 'upbeat, clear, energized';
      if (intent.activationTarget < 0.4) return 'gentle, calm, relaxed';
      return 'balanced, alert';
    }
    if (phaseType === 'Middle / Core') {
      if (intent.activationTarget > 0.6) return 'peak energy, focused, engaged';
      if (intent.activationTarget < 0.4) return 'balanced, relaxed, steady';
      return 'sustained, aligned with goals';
    }
    if (phaseType === 'End / Landing' || phaseType === 'Later / Wind-Down') {
      if (intent.activationTarget < 0.4) return 'smooth calm, no crash, easy wind-down';
      return 'gentle transition, balanced ending';
    }
    return 'aligned with this phase\'s goals';
  };

  // Phase 1: Opening/Top (or Primary/Early for 2-phase)
  // Ensure single-phase to avoid recursion
  const phase1SinglePhase: OutcomeIntent = {
    ...phase1,
    temporalProfile: 'single-phase',
    phases: undefined,
  };
  const phase1Result = resolveOutcome(phase1SinglePhase);
  if (phase1Result.tiers && phase1Result.tiers.length > 0) {
    const bestPhase1 = phase1Result.tiers[0];
    let phase1Composition = [...bestPhase1.composition];
    
    // PART 5.D: Apply CBD rules - filter CBD from early phases unless calm onset desired
    phase1Composition = filterCBDForEarlyPhase(phase1Composition, phase1);
    
    // Normalize ratios after filtering
    const phase1Total = phase1Composition.reduce((sum, c) => sum + c.ratio, 0);
    if (phase1Total > 0) {
      phase1Composition.forEach(c => c.ratio = Math.round((c.ratio / phase1Total) * 100));
    }
    
    const phase1PhaseLabel = is3Phase ? 'Top / Opening' : 'Primary / Early';
    const phase1IntentFocus = phase1.activationTarget > 0.6 ? 'alert / social / active' : 
                              phase1.activationTarget < 0.4 ? 'relaxed / calm' : 'balanced';
    
    const phase1Instructions = phase1Composition.length === 1
      ? `Use ${phase1Composition[0].displayName} for the ${phase1PhaseLabel.toLowerCase()} phase. Start with this composition.`
      : `Mix ${phase1Composition.map(c => `${c.displayName} (${c.ratio}%)`).join(', ')} for the ${phase1PhaseLabel.toLowerCase()} phase. Combine and use first.`;
    
    phases.push({
      phase: phase1PhaseLabel as any,
      intentFocus: phase1IntentFocus,
      composition: phase1Composition,
      compositionFit: bestPhase1.compositionFit,
      systemNotes: bestPhase1.systemNotes,
      instructions: phase1Instructions,
      purpose: generatePurpose(phase1, phase1PhaseLabel),
      whatYoullFeel: generateWhatYoullFeel(phase1, phase1PhaseLabel),
    });
  }

  // Phase 2: Core/Middle (or Later/Wind-Down for 2-phase)
  // Ensure single-phase to avoid recursion
  const phase2SinglePhase: OutcomeIntent = {
    ...phase2,
    temporalProfile: 'single-phase',
    phases: undefined,
  };
  const phase2Result = resolveOutcome(phase2SinglePhase);
  if (phase2Result.tiers && phase2Result.tiers.length > 0) {
    const bestPhase2 = phase2Result.tiers[0];
    let phase2Composition = [...bestPhase2.composition];
    
    // CBD allowed in middle/core phase but not required
    // Only filter if activation is high (activation > 0.6)
    if (phase2.activationTarget > 0.6) {
      phase2Composition = filterCBDForEarlyPhase(phase2Composition, phase2);
      const phase2Total = phase2Composition.reduce((sum, c) => sum + c.ratio, 0);
      if (phase2Total > 0) {
        phase2Composition.forEach(c => c.ratio = Math.round((c.ratio / phase2Total) * 100));
      }
    }
    
    const phase2PhaseLabel = is3Phase ? 'Middle / Core' : 'Later / Wind-Down';
    const phase2IntentFocus = phase2.activationTarget < 0.4 ? 
                              (is3Phase ? 'relaxed balance' : 'relaxation / recovery') :
                              phase2.activationTarget > 0.6 ? 'sustained energy' : 
                              (is3Phase ? 'main outcome delivery' : 'balanced transition');
    
    const phase2Instructions = phase2Composition.length === 1
      ? `Use ${phase2Composition[0].displayName} for the ${phase2PhaseLabel.toLowerCase()} phase. ${is3Phase ? 'Continue with this after the opening phase.' : 'Transition to this after the early phase.'}`
      : `Mix ${phase2Composition.map(c => `${c.displayName} (${c.ratio}%)`).join(', ')} for the ${phase2PhaseLabel.toLowerCase()} phase. ${is3Phase ? 'Use after the opening phase.' : 'Use after the early phase composition.'}`;
    
    phases.push({
      phase: phase2PhaseLabel as any,
      intentFocus: phase2IntentFocus,
      composition: phase2Composition,
      compositionFit: bestPhase2.compositionFit,
      systemNotes: bestPhase2.systemNotes,
      instructions: phase2Instructions,
      purpose: generatePurpose(phase2, phase2PhaseLabel),
      whatYoullFeel: generateWhatYoullFeel(phase2, phase2PhaseLabel),
    });
  }

  // Phase 3: End/Landing (only for 3-phase)
  if (phase3 && is3Phase) {
    // Ensure single-phase to avoid recursion
    const phase3SinglePhase: OutcomeIntent = {
      ...phase3,
      temporalProfile: 'single-phase',
      phases: undefined,
    };
    const phase3Result = resolveOutcome(phase3SinglePhase);
    if (phase3Result.tiers && phase3Result.tiers.length > 0) {
      const bestPhase3 = phase3Result.tiers[0];
      let phase3Composition = [...bestPhase3.composition];
      
      // PART 5.D: Enhance end phase with CBD (heavier in end phase)
      phase3Composition = enhanceEndPhaseWithCBD(phase3Composition, phase3);
      
      const phase3IntentFocus = phase3.activationTarget < 0.4 ? 'calm / relief / closure' :
                                phase3.activationTarget > 0.6 ? 'sustained energy' : 'balanced wind-down';
      
      const phase3Instructions = phase3Composition.length === 1
        ? `Use ${phase3Composition[0].displayName} for the end/landing phase. Transition to this for the final phase.`
        : `Mix ${phase3Composition.map(c => `${c.displayName} (${c.ratio}%)`).join(', ')} for the end/landing phase. Use for the final phase of your experience.`;
      
      phases.push({
        phase: 'End / Landing',
        intentFocus: phase3IntentFocus,
        composition: phase3Composition,
        compositionFit: bestPhase3.compositionFit,
        systemNotes: bestPhase3.systemNotes,
        instructions: phase3Instructions,
        purpose: generatePurpose(phase3, 'End / Landing'),
        whatYoullFeel: generateWhatYoullFeel(phase3, 'End / Landing'),
      });
    }
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

  // Validate phases if multi-phase (supports 2-phase and 3-phase models)
  if (intent.temporalProfile === 'multi-phase') {
    if (!intent.phases || !Array.isArray(intent.phases) || intent.phases.length < 2 || intent.phases.length > 3) {
      throw new Error('Invalid intent: multi-phase requires 2 or 3 phases');
    }
    const validPhaseLabels = ['Top / Opening', 'Middle / Core', 'End / Landing', 'Primary / Early', 'Later / Wind-Down'];
    for (const phase of intent.phases) {
      if (!phase.phase || !validPhaseLabels.includes(phase.phase)) {
        throw new Error(`Invalid intent: phase.phase must be one of: ${validPhaseLabels.join(', ')}`);
      }
      for (const field of requiredFields) {
        if (typeof (phase as any)[field] !== 'number' || (phase as any)[field] < 0 || (phase as any)[field] > 1) {
          throw new Error(`Invalid intent: phase.${field} must be a number between 0 and 1`);
        }
      }
    }
  }

  // Handle multi-phase intent (supports 2-phase and 3-phase models)
  if (intent.temporalProfile === 'multi-phase' && intent.phases && intent.phases.length >= 2) {
    const phase1 = intent.phases[0];
    const phase2 = intent.phases[1];
    const phase3 = intent.phases.length === 3 ? intent.phases[2] : undefined;

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

    // Filter eligible cultivars
    const eligibleCultivars = canonicalChemotypes.filter(
      cv => !isNonPsychoactive(cv) || cv.id.includes('cbd') || cv.id.includes('cbg')
    );
    
    // Log eligible cultivars count (dev-only)
    if (process.env.NODE_ENV === 'development') {
      console.log(`[RESOLVER] Eligible cultivars after constraints: ${eligibleCultivars.length}`);
    }

    const scoredCultivars = eligibleCultivars.map(cultivar => {
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
      // Stacked resolution required (3-phase support)
      const clampedIntent3 = phase3 ? {
        activationTarget: Math.max(0, Math.min(1, phase3.activationTarget)),
        anxietySensitivity: Math.max(0, Math.min(1, phase3.anxietySensitivity)),
        cognitiveEndurance: Math.max(0, Math.min(1, phase3.cognitiveEndurance)),
        overshootTolerance: Math.max(0, Math.min(1, phase3.overshootTolerance)),
      } : undefined;
      
      const phases = generateStackedResolution(clampedIntent1, clampedIntent2, clampedIntent3);
      
      // Validate all phases
      const validPhases = phases.filter(phase => {
        const validationError = validateBlendComposition(phase.composition, true);
        return validationError === null;
      });
      
      // Add explanation to first phase about why stacking was chosen
      if (validPhases.length > 0) {
        const is3Phase = validPhases.length === 3;
        validPhases[0].systemNotes.unshift(
          is3Phase 
            ? 'Your goal includes multiple phases: opening, core, and landing.'
            : 'Your goal included both an active phase and a later wind-down phase.',
          'Combining these into a single blend would require compromises that increase early-phase risk.',
          'Separating them allows each phase to be optimized safely.'
        );
      }
      
      // PART 7: Ensure phases never collapse - if we're stacking, we MUST return stacked mode
      // Never silently collapse stacked into blended
      const minRequiredPhases = phase3 ? 3 : 2;
      
      if (validPhases.length < minRequiredPhases) {
        return {
          resolutionMode: 'STACKED',
          phases: [],
          refused: true,
          tiers: undefined,
          failure: {
            status: 'invalid',
            reason: 'INSUFFICIENT_DISTINCT_CULTIVARS',
            details: `Stacked resolution requires ${minRequiredPhases} valid phases, but only ${validPhases.length} passed validation.`,
          },
        };
      }
      
      return {
        resolutionMode: 'STACKED',
        phases: validPhases,
        refused: false,
        tiers: undefined, // Explicitly undefined to ensure UI shows stacked mode
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

  // Filter eligible cultivars
  const eligibleCultivars = canonicalChemotypes.filter(
    cv => !isNonPsychoactive(cv) || cv.id.includes('cbd') || cv.id.includes('cbg')
  );
  
  // Log eligible cultivars count (dev-only)
  if (process.env.NODE_ENV === 'development') {
    console.log(`[RESOLVER] Eligible cultivars after constraints: ${eligibleCultivars.length}`);
  }

  const scoredCultivars = eligibleCultivars.map(chemotype => {
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
      failure: {
        status: 'invalid',
        reason: 'INVENTORY_TOO_NARROW',
        details: 'Unable to generate valid blend from available cultivars. Inventory may be too narrow or constraints too restrictive.',
      },
    };
  }

  // Validate all tiers before returning
  const validTiers = tiers.filter(tier => {
    const validationError = validateBlendComposition(tier.composition, false);
    return validationError === null;
  });

  if (validTiers.length === 0) {
    return {
      resolutionMode: 'BLENDED',
      tiers: [],
      refused: true,
      failure: {
        status: 'invalid',
        reason: 'INSUFFICIENT_DISTINCT_CULTIVARS',
        details: 'All generated blends failed validation - insufficient distinct cultivars or invalid composition.',
      },
    };
  }

  return {
    resolutionMode: 'BLENDED',
    tiers: validTiers,
    refused: false,
  };
}
