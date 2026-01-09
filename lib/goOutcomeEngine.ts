/**
 * GO Outcome Engine (Role-Based)
 * 
 * AUTHORITATIVE implementation of the Role-Based Outcome Calculator.
 * 
 * LOGIC PIPELINE:
 * 1. Compute Strain Vectors (normalized effects).
 * 2. Calculate Base Match (Cosine Similarity to Intent).
 * 3. Calculate Specialization Score (Max/Avg ratio of effects).
 * 4. Assign Roles (Driver, Modulator, Anchor) based on specialized scoring functions.
 * 5. Greedy Selection: Driver -> Modulator -> Anchor (with Diversity Penalty).
 * 6. Normalize Ratios based on role scores.
 */

import { STRAIN_LIBRARY, type Strain } from '@/lib/strainLibrary';
import { inventoryStore } from '@/lib/inventoryStore';
import { usageHistoryStore } from '@/lib/usageHistoryStore';

// --- INTERFACES ---

export interface OutcomeIntent {
  activation: number; // 0-1
  anxietySensitivity: number; // 0-1
  cognitiveEndurance: number; // 0-1
  activationTarget: number; // Included for compatibility
  // Expansion fields
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
  role: 'driver' | 'modulator' | 'anchor';
}

export interface BlendCandidate {
  selectedCultivars: SelectedCultivar[];
  ratios: number[]; // integers summing to 100
  confidenceScore: number; // 0-1
  distance: number; // Distance from target (inverted similarity)
  notes: string[];
}

export interface OutcomeResult {
  primary: BlendCandidate;
  alternates: BlendCandidate[];
  failure?: any;
}

// --- CORE MATH FUNCTIONS ---

function getStrainVector(strain: Strain) {
  return [
    strain.effects.energy / 100,
    strain.effects.calm / 100,
    strain.effects.anxietyRisk / 100,
    strain.effects.body / 100,
    strain.effects.focus / 100
  ];
}

function getOutcomeVector(intent: OutcomeIntent) {
  // Map intent to the same 5 dimensions: [Energy, Calm, AnxietyRisk, Body, Focus]
  // Note: AnxietyRisk in intent is usually "Low Risk Preference".
  // Strain vectors have "Risk Magnitude".
  // Intent: User wants 0 Risk. So target for Risk dimension is 0.
  // Calm is 1 - activation usually, but we use explicit intent values if available.

  // We prioritize explicit intent signals if present, otherwise infer from activation.
  // Anxiety Sensitivity 1.0 -> Risk Target 0.0. Sensitivity 0.0 -> Risk Target 1.0? 
  // No, generally we want 0 Risk. Risk is a penalty dimension. Target is always 0.

  return [
    intent.activation,
    1 - intent.activation, // Approx Calm
    0, // Target Risk is 0
    intent.bodyLoadPreference ?? 0.5,
    intent.cognitiveEndurance
  ];
}

function cosineSimilarity(vecA: number[], vecB: number[]): number {
  const dotProduct = vecA.reduce((sum, val, i) => sum + val * vecB[i], 0);
  const magA = Math.sqrt(vecA.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(vecB.reduce((sum, val) => sum + val * val, 0));
  if (magA === 0 || magB === 0) return 0;
  return dotProduct / (magA * magB);
}

function specializationScore(strain: Strain): number {
  const vec = getStrainVector(strain);
  const maxVal = Math.max(...vec);
  // Avoid division by zero
  const avgVal = (vec.reduce((a, b) => a + b, 0) / vec.length) || 0.001;
  // Broad, flat strains -> score ~1. Focused strains -> score > 1.5
  return maxVal / avgVal;
}

// Emulate availability score (0.8 - 1.0 randomish or fixed)
// We treat all library strains as available for now.
function getAvailabilityScore(strain: Strain): number {
  // Server-side safe fallback
  if (typeof window === 'undefined') return 1.0;

  const items = inventoryStore.getItems();
  // If inventory is empty, treat all library strains as available (Soft Mode)
  if (!items || items.length === 0) return 1.0;

  // Strict Mode: Only allow inventory matches
  const match = items.find(i =>
    i.active && i.strainName.toLowerCase() === strain.name.toLowerCase()
  );

  // If in inventory -> 1.0. If not -> 0.1 (strong penalty)
  return match ? 1.0 : 0.1;
}

function outcomeMatch(strain: Strain, outcomeVector: number[]): number {
  return cosineSimilarity(getStrainVector(strain), outcomeVector);
}

function roleScore(
  strain: Strain,
  role: 'driver' | 'modulator' | 'anchor',
  outcomeVector: number[]
): number {
  const match = outcomeMatch(strain, outcomeVector);
  const spec = specializationScore(strain);
  const avail = getAvailabilityScore(strain);

  switch (role) {
    case 'driver':
      // Rewards specialization and match
      return (match * 0.6) + (spec * 0.3) + (avail * 0.1);

    case 'modulator':
      // Rewards balance (lower spec) and match
      // Balance proxy: normalized inversion of specialization
      // Spec range typical: 1.0 to 3.0.
      // We want to reward values closer to 1.0.
      // Formula: 1 / spec is good, or (3 - spec) / 2.
      // User pseudocode uses (1 - spec), but spec > 1 usually. 
      // User intent: "Generalist strains (low spec) are penalized unless... modulators reward balance".
      // Let's use 1 / (spec * 0.5)? 
      // Let's stick to the spirit: "Balance" means Spec is low.
      // If Spec is 1.0, Balance is 1.0. If Spec is 3.0, Balance is 0.0.
      const balance = Math.max(0, 3.0 - spec) / 2.0;
      return (match * 0.5) + (balance * 0.3) + (avail * 0.2);

    case 'anchor':
      // Rewards Grounding (Calm/Body) and Match
      const vec = getStrainVector(strain);
      // Grounding bias: Average of Calm (index 1) and Body (index 3)
      const groundingBias = (vec[1] + vec[3]) / 2;
      return (match * 0.4) + (groundingBias * 0.4) + (avail * 0.2);
  }
}

function diversityPenalty(strain: Strain, selectedStrains: Strain[]): number {
  if (selectedStrains.length === 0) return 1.0;

  let overlap = 0;
  const strainVec = getStrainVector(strain);

  for (const s of selectedStrains) {
    const sVec = getStrainVector(s);
    overlap += cosineSimilarity(strainVec, sVec);
  }

  // "clamped 1 - overlap * 0.4"
  // If overlap is 1.0 (identical), penalty is 1 - 0.4 = 0.6.
  // We clamp between 0.6 and 1.
  return Math.max(0.6, Math.min(1, 1 - (overlap * 0.4)));
}

// --- RESOLVER ---

// A4.1: Frequency Map (Based on provided stats + estimates)
const TERPENE_FREQUENCY: Record<string, number> = {
  myrcene: 0.72,
  limonene: 0.55,
  caryophyllene: 0.40,
  pinene: 0.30,
  humulene: 0.20,
  linalool: 0.15,
  terpinolene: 0.12,
  ocimene: 0.12
};

// A4.2 Cap Influence
const MAX_TERPENE_INFLUENCE = 0.35;

// Helper: Get strictly ranked terpenes for explanation (A4.3)
export function getTopTerpenes(strain: Strain, limit = 3): { name: string, weight: number }[] {
  const profile = strain.terpenes as any;
  const adjusted = Object.keys(TERPENE_FREQUENCY).map(key => {
    const raw = profile[key] || 0;
    const freq = TERPENE_FREQUENCY[key] || 0.5;
    // A4.1: Rarity-weighted
    const weight = raw * (1 - freq);
    return { name: key, weight };
  });

  return adjusted
    .sort((a, b) => b.weight - a.weight)
    .slice(0, limit);
}

// A4.2: Target Terpene Construction
function getTargetTerpenes(intent: OutcomeIntent): Record<string, number> {
  const target: Record<string, number> = {
    myrcene: 0, limonene: 0, caryophyllene: 0, pinene: 0, humulene: 0, linalool: 0, terpinolene: 0
  };

  // Energy vs Calm
  if (intent.activation > 0.5) {
    target.limonene += intent.activation;
    target.terpinolene += intent.activation * 0.8;
    target.pinene += intent.activation * 0.6;
  } else {
    const calm = 1 - intent.activation;
    target.myrcene += calm;
    target.linalool += calm * 0.8;
    target.caryophyllene += calm * 0.5;
  }

  // Anxiety Sensitivity (Avoid stimulating terpenes)
  if (intent.anxietySensitivity > 0.5) {
    target.terpinolene *= 0.2; // Penalty
    target.pinene *= 0.5;
    target.linalool += 0.5; // Boost calming
  }

  // Body Load
  if (intent.bodyLoadPreference && intent.bodyLoadPreference > 0.5) {
    target.myrcene += 0.5;
    target.humulene += 0.5;
    target.caryophyllene += 0.5;
  }

  return target;
}

function getTerpeneScore(strain: Strain, target: Record<string, number>): number {
  let dot = 0;
  let magA = 0;
  let magB = 0;

  const strainProfile = strain.terpenes as any;

  for (const key of Object.keys(target)) {
    const freq = TERPENE_FREQUENCY[key] || 0.5;
    const rawVal = strainProfile[key] || 0;

    // A4.1 formula: raw * (1 - freq)
    // "Common terpene = baseline context. Rare terpene = differentiator."
    const adjustedVal = rawVal * (1 - freq);

    // A4.2 Cap Influence
    // "Effective contribution = Math.min(adjusted, 0.35)"
    const finalVal = Math.min(adjustedVal, MAX_TERPENE_INFLUENCE);

    const targetVal = target[key];

    dot += finalVal * targetVal;
    magA += finalVal * finalVal;
    magB += targetVal * targetVal;
  }

  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

function isEligible(strain: Strain, intent: OutcomeIntent): boolean {
  // Hard Gate 1: Anxiety Safety
  if (intent.anxietySensitivity > 0.7 && strain.effects.anxietyRisk > 40) return false;

  // Hard Gate 2: Sedation Avoidance
  if (intent.avoidSedation && strain.effects.calm > 70) return false;

  // Hard Gate 3: Energy Requirement
  if (intent.activation > 0.8 && strain.effects.energy < 30) return false;

  return true;
}

function transitionPenalty(prev: Strain, next: Strain): number {
  let penalty = 0;
  // Cost: Radical shift from Energy to Sedation (crash risk)
  if (prev.effects.energy > 60 && next.effects.calm > 60) penalty += 0.3;
  // Cost: Radical shift from Anxiety Risk to High Stimulation (panic risk)
  if (prev.effects.anxietyRisk > 40 && next.effects.energy > 70) penalty += 0.2;
  return penalty;
}

export function resolveOutcome(intent: OutcomeIntent, mode: 'blend' | 'stack' = 'blend'): OutcomeResult {
  const allStrains = Object.values(STRAIN_LIBRARY);
  const outcomeVec = getOutcomeVector(intent);
  const targetTerps = getTargetTerpenes(intent);

  // 1. Eligibility Filter & Base Scoring
  const candidates = allStrains
    .filter(s => isEligible(s, intent))
    .map(s => {
      const effectMatch = outcomeMatch(s, outcomeVec);
      const terpeneMatch = getTerpeneScore(s, targetTerps);
      const avail = getAvailabilityScore(s); // A1: 0.1 or 1.0 (Strict Inventory)

      // A4 Scoring: Weighted Mix
      // Terpenes (Signal) + Effects (Baseline)
      const compositeScore = (terpeneMatch * 0.55) + (effectMatch * 0.45);

      return {
        strain: s,
        baseScore: compositeScore * avail,
        effectMatch,
        terpeneMatch
      };
    })
    .sort((a, b) => b.baseScore - a.baseScore);

  // 2. Candidate Pool (Top 12)
  const pool = candidates.slice(0, 12);

  // 3. Freshness Application
  const freshCandidates = pool.map(c => {
    const penalty = usageHistoryStore.getFreshnessFactor(c.strain.id);
    return {
      ...c,
      freshness: penalty,
      adjustedScore: c.baseScore * penalty
    };
  }).sort((a, b) => b.adjustedScore - a.adjustedScore);

  // Debug Output
  console.log(`[Phase A2/A3/A4] Candidate Pool (${mode}):`, freshCandidates.map(c => ({
    name: c.strain.name,
    base: c.baseScore.toFixed(2),
    eff: c.effectMatch.toFixed(2),
    terp: c.terpeneMatch.toFixed(2),
    adj: c.adjustedScore.toFixed(2)
  })));

  // --- BRANCH LOGIC ---

  if (mode === 'stack') {
    // A3: Stack Specific Logic (Sequential)
    const selectedStrains: Strain[] = [];
    const assignedRoles: ('driver' | 'modulator' | 'anchor')[] = [];
    const stackNotes: string[] = [];

    // Phase 1: Best available starter
    if (freshCandidates.length > 0) {
      const phase1 = freshCandidates[0].strain;
      selectedStrains.push(phase1);
      assignedRoles.push('driver');
      usageHistoryStore.recordUsage(phase1.id);

      // A4.4 Role-Aware Explanation
      const topTerps = getTopTerpenes(phase1, 1);
      if (topTerps[0]) stackNotes.push(`Phase 1 driven by ${topTerps[0].name}`);
    }

    // Phase 2: Best Transition
    if (freshCandidates.length > 1) {
      const p1 = selectedStrains[0];
      // Re-rank remaining candidates based on Transition Penalty
      const bestNext = freshCandidates.slice(1).map(c => {
        const pen = transitionPenalty(p1, c.strain);
        return {
          ...c,
          stackScore: c.adjustedScore - (pen * 0.4) // Weighted penalty
        };
      }).sort((a, b) => b.stackScore - a.stackScore)[0];

      if (bestNext) {
        selectedStrains.push(bestNext.strain);
        assignedRoles.push('modulator');

        // A4.4 Secondary Role Explanation
        const topTerps = getTopTerpenes(bestNext.strain, 1);
        if (topTerps[0]) stackNotes.push(`Transitions to ${topTerps[0].name}`);
      }
    }

    return {
      primary: {
        selectedCultivars: selectedStrains.map((s, i) => ({
          id: s.id,
          displayName: s.name,
          role: assignedRoles[i]
        })),
        ratios: selectedStrains.length === 2 ? [50, 50] : [100],
        confidenceScore: 0.9,
        distance: 0,
        notes: stackNotes // Now dynamic based on rarity
      },
      alternates: []
    };
  }

  // --- BLEND MODE --- (Default)

  const selectedStrains: Strain[] = [];
  const assignedRoles: ('driver' | 'modulator' | 'anchor')[] = [];
  const blendNotes: string[] = [];

  // 1. Primary
  if (freshCandidates.length > 0) {
    const primary = freshCandidates[0].strain;
    selectedStrains.push(primary);
    assignedRoles.push('driver');
    usageHistoryStore.recordUsage(primary.id);

    // A4.3: Top Adjusted Terpenes for Primary
    const topTerps = getTopTerpenes(primary, 2);
    const terpNames = topTerps.map(t => t.name).join(' & ');
    blendNotes.push(`${terpNames} dominant profile`);
  }

  // 2. Secondary (Diversity Logic)
  // We want a strain that adds something new (Effect or Terpene)
  if (freshCandidates.length > 1) {
    const p1 = selectedStrains[0];

    // Re-rank remainder by Diversity Penalty 
    const bestSecondary = freshCandidates.slice(1).map(c => {
      const pen = diversityPenalty(c.strain, selectedStrains);
      // We want High Score AND High Diversity (Low Penalty? No, penalty reduces score)
      // diversityPenalty returns 0.6 to 1.0 multiplier.
      return {
        ...c,
        blendScore: c.adjustedScore * pen
      };
    }).sort((a, b) => b.blendScore - a.blendScore)[0];

    if (bestSecondary) {
      selectedStrains.push(bestSecondary.strain);
      assignedRoles.push('modulator');

      // A4.4 Secondary Explanation
      const topTerps = getTopTerpenes(bestSecondary.strain, 1);
      if (topTerps[0]) blendNotes.push(`Modulated by ${topTerps[0].name}`);
    }
  }

  // 3. Alternates
  // Just take the next best raw scores that aren't used
  const usedIds = new Set(selectedStrains.map(s => s.id));
  const alternates = freshCandidates
    .filter(c => !usedIds.has(c.strain.id))
    .slice(0, 3)
    .map(c => ({
      selectedCultivars: [{
        id: c.strain.id,
        displayName: c.strain.name,
        role: 'driver' as const
      }],
      ratios: [100],
      confidenceScore: c.baseScore * 0.8, // Slightly lower conf for alts
      distance: 0,
      notes: [`Alternative Option`]
    }));

  return {
    primary: {
      selectedCultivars: selectedStrains.map((s, i) => ({
        id: s.id,
        displayName: s.name,
        role: assignedRoles[i]
      })),
      ratios: selectedStrains.length === 2 ? [60, 40] : [100],
      confidenceScore: 0.95,
      distance: 0,
      notes: blendNotes
    },
    alternates,
    failure: selectedStrains.length === 0 ? { reason: "No eligible strains found." } : undefined
  };
}
