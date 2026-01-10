/**
 * GO CALCULATOR - OUTCOME RESOLUTION ENGINE
 * Version: 1.0.0
 * 
 * Deterministic cannabis blend calculator
 * No AI, no randomness, pure mathematics
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface Intent {
  targetEffects: {
    energy: number;
    focus: number;
    mood: number;
    body: number;
    creativity: number;
  };
  constraints: {
    maxAnxiety: number;
    minTHC?: number;
    maxTHC?: number;
    minCBD?: number;
    maxCBD?: number;
  };
  context?: {
    timeOfDay?: "morning" | "afternoon" | "evening" | "night";
    tolerance?: "low" | "medium" | "high";
    experience?: "beginner" | "intermediate" | "expert";
  };
}

export interface Cultivar {
  id: string;
  name: string;
  thcPercent: number;
  cbdPercent: number;
  terpenes: Record<string, number>;
  available: boolean;
  grower?: string;
  batch?: string;
}

export interface Inventory {
  cultivars: Cultivar[];
  timestamp: string;
}

export interface EffectVector {
  energy: number;
  focus: number;
  mood: number;
  body: number;
  creativity: number;
  anxiety: number;
}

export interface BlendRecommendation {
  cultivars: Array<{
    id: string;
    name: string;
    ratio: number;
  }>;
  predictedEffects: EffectVector;
  cannabinoids: {
    thc: number;
    cbd: number;
  };
  score: number;
  confidence: number;
  metadata: {
    unknownTerpeneCount: number;
    constraintsViolated: string[];
  };
}

export interface EngineOutput {
  recommendations: BlendRecommendation[];
  intent: Intent;
  inventory_timestamp: string;
  calculation_timestamp: string;
  audit: {
    inputHash: string;
    configVersion: string;
    candidatesEvaluated: number;
    executionTimeMs: number;
  };
  error?: string;
  errorReason?: string;
}

// ============================================================================
// CONSTANTS - MODELED PARAMETERS
// ============================================================================

const CONFIG_VERSION = "1.0.0";
const TERPENE_MODEL_VERSION = "1.0.0";
const EPSILON = 0.0001;

// Terpene influence coefficients (MODELED, not measured)
const TERPENE_INFLUENCES: Record<string, EffectVector> = {
  limonene: { energy: 0.6, focus: 0.3, mood: 0.8, body: 0.0, creativity: 0.5, anxiety: -0.4 },
  pinene: { energy: 0.4, focus: 0.7, mood: 0.2, body: 0.0, creativity: 0.3, anxiety: -0.3 },
  myrcene: { energy: -0.7, focus: -0.3, mood: 0.1, body: 0.8, creativity: 0.0, anxiety: -0.5 },
  linalool: { energy: -0.4, focus: 0.0, mood: 0.3, body: 0.3, creativity: 0.2, anxiety: -0.7 },
  caryophyllene: { energy: 0.0, focus: 0.1, mood: 0.2, body: 0.5, creativity: 0.0, anxiety: -0.6 },
  humulene: { energy: -0.2, focus: 0.2, mood: 0.0, body: 0.3, creativity: 0.1, anxiety: 0.0 },
  terpinolene: { energy: 0.5, focus: 0.2, mood: 0.6, body: 0.1, creativity: 0.7, anxiety: 0.1 },
  ocimene: { energy: 0.3, focus: 0.1, mood: 0.5, body: 0.0, creativity: 0.4, anxiety: -0.2 },
  bisabolol: { energy: -0.3, focus: 0.0, mood: 0.2, body: 0.2, creativity: 0.0, anxiety: -0.5 },
  camphene: { energy: 0.2, focus: 0.3, mood: 0.0, body: 0.1, creativity: 0.0, anxiety: 0.0 },
  valencene: { energy: 0.3, focus: 0.2, mood: 0.4, body: 0.0, creativity: 0.3, anxiety: -0.1 },
  geraniol: { energy: 0.1, focus: 0.0, mood: 0.4, body: 0.1, creativity: 0.3, anxiety: -0.3 },
  nerolidol: { energy: -0.5, focus: -0.1, mood: 0.2, body: 0.4, creativity: 0.1, anxiety: -0.4 },
  borneol: { energy: -0.3, focus: 0.1, mood: 0.0, body: 0.3, creativity: 0.0, anxiety: -0.2 },
  eucalyptol: { energy: 0.3, focus: 0.5, mood: 0.1, body: 0.0, creativity: 0.2, anxiety: 0.0 },
  pulegone: { energy: 0.1, focus: 0.4, mood: 0.0, body: 0.0, creativity: 0.1, anxiety: 0.1 },
  sabinene: { energy: 0.2, focus: 0.2, mood: 0.1, body: 0.1, creativity: 0.1, anxiety: 0.0 },
  terpineol: { energy: -0.4, focus: 0.0, mood: 0.2, body: 0.3, creativity: 0.1, anxiety: -0.4 },
  carene: { energy: 0.1, focus: 0.3, mood: 0.0, body: 0.2, creativity: 0.0, anxiety: 0.0 },
  cymene: { energy: 0.2, focus: 0.1, mood: 0.1, body: 0.0, creativity: 0.1, anxiety: 0.1 },
  fenchol: { energy: -0.2, focus: 0.0, mood: 0.1, body: 0.2, creativity: 0.0, anxiety: -0.3 },
  guaiol: { energy: -0.3, focus: 0.0, mood: 0.1, body: 0.3, creativity: 0.0, anxiety: -0.2 },
  isopulegol: { energy: 0.0, focus: 0.2, mood: 0.0, body: 0.1, creativity: 0.0, anxiety: 0.0 },
  phellandrene: { energy: 0.3, focus: 0.2, mood: 0.3, body: 0.0, creativity: 0.2, anxiety: 0.0 },
  phytol: { energy: -0.4, focus: -0.1, mood: 0.0, body: 0.3, creativity: 0.0, anxiety: -0.3 },
};

const UNKNOWN_TERPENE_COEFFICIENTS: EffectVector = {
  energy: 0.0,
  focus: 0.0,
  mood: 0.0,
  body: 0.0,
  creativity: 0.0,
  anxiety: 0.15,
};

const UNKNOWN_TERPENE_CONFIDENCE_PENALTY = 0.1;

const THC_INTENSITY_FACTOR = 0.05;
const THC_MODIFIERS = {
  body: 0.02,
  anxiety: 0.03,
};

const CBD_ANXIETY_REDUCTION = -0.04;
const CBD_ENERGY_DAMPING = -0.01;
const CBD_THC_BUFFER_RATIO = 0.25;

const TIME_MODIFIERS: Record<string, Partial<EffectVector> & { maxAnxiety?: number }> = {
  morning: { energy: 0.2, focus: 0.1, maxAnxiety: -0.05 },
  afternoon: { energy: 0.0, focus: 0.05, maxAnxiety: 0.0 },
  evening: { energy: -0.1, body: 0.1, maxAnxiety: 0.05 },
  night: { energy: -0.3, body: 0.2, maxAnxiety: 0.1 },
};

const TOLERANCE_MODIFIERS = {
  low: { thcMultiplier: 0.7, anxietyPenalty: 0.15 },
  medium: { thcMultiplier: 1.0, anxietyPenalty: 0.0 },
  high: { thcMultiplier: 1.3, anxietyPenalty: -0.1 },
};

const EXPERIENCE_MODIFIERS = {
  beginner: { maxAnxiety: -0.1, complexityPenalty: 0.05 },
  intermediate: { maxAnxiety: 0.0, complexityPenalty: 0.0 },
  expert: { maxAnxiety: 0.05, complexityPenalty: -0.05 },
};

// Ratio search spaces
const TWO_CULTIVAR_RATIOS = [0.15, 0.20, 0.25, 0.30, 0.35, 0.40, 0.45, 0.50, 0.55, 0.60, 0.65, 0.70, 0.75, 0.80, 0.85];
const THREE_CULTIVAR_RATIOS = [0.15, 0.20, 0.25, 0.30, 0.35, 0.40, 0.50, 0.60, 0.70];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function normalizeTerpene(name: string): string {
  return name
    .toLowerCase()
    .replace(/[\s\-_]/g, "")
    .replace(/^β/, "")
    .replace(/^α/, "");
}

function simpleHash(obj: any): string {
  const str = JSON.stringify(obj);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

// ============================================================================
// VALIDATION
// ============================================================================

function validateIntent(intent: Intent): Intent {
  const validated = { ...intent };
  
  validated.targetEffects = {
    energy: clamp(intent.targetEffects.energy, -1.0, 1.0),
    focus: clamp(intent.targetEffects.focus, 0.0, 1.0),
    mood: clamp(intent.targetEffects.mood, -1.0, 1.0),
    body: clamp(intent.targetEffects.body, 0.0, 1.0),
    creativity: clamp(intent.targetEffects.creativity, 0.0, 1.0),
  };
  
  validated.constraints = {
    maxAnxiety: intent.constraints.maxAnxiety ?? 0.3,
    minTHC: intent.constraints.minTHC,
    maxTHC: intent.constraints.maxTHC,
    minCBD: intent.constraints.minCBD,
    maxCBD: intent.constraints.maxCBD,
  };
  
  return validated;
}

// ============================================================================
// CULTIVAR EFFECT CALCULATION
// ============================================================================

function calculateCultivarEffect(cultivar: Cultivar): { effect: EffectVector; unknownCount: number } {
  const effect: EffectVector = {
    energy: 0,
    focus: 0,
    mood: 0,
    body: 0,
    creativity: 0,
    anxiety: 0,
  };
  
  let unknownCount = 0;
  let totalTerpenePercent = 0;
  
  // Normalize terpene names and accumulate effects
  const normalizedTerpenes: Record<string, number> = {};
  for (const [name, percent] of Object.entries(cultivar.terpenes)) {
    const normalized = normalizeTerpene(name);
    normalizedTerpenes[normalized] = (normalizedTerpenes[normalized] || 0) + percent;
  }
  
  // Calculate weighted terpene effects
  for (const [terpene, percent] of Object.entries(normalizedTerpenes)) {
    totalTerpenePercent += percent;
    const influences = TERPENE_INFLUENCES[terpene] || UNKNOWN_TERPENE_COEFFICIENTS;
    
    if (!TERPENE_INFLUENCES[terpene]) {
      unknownCount++;
    }
    
    effect.energy += percent * influences.energy;
    effect.focus += percent * influences.focus;
    effect.mood += percent * influences.mood;
    effect.body += percent * influences.body;
    effect.creativity += percent * influences.creativity;
    effect.anxiety += percent * influences.anxiety;
  }
  
  // Normalize by total terpene percentage
  if (totalTerpenePercent > 0) {
    effect.energy /= totalTerpenePercent;
    effect.focus /= totalTerpenePercent;
    effect.mood /= totalTerpenePercent;
    effect.body /= totalTerpenePercent;
    effect.creativity /= totalTerpenePercent;
    effect.anxiety /= totalTerpenePercent;
  }
  
  // Apply cannabinoid modifiers
  effect.body += cultivar.thcPercent * THC_MODIFIERS.body;
  effect.anxiety += cultivar.thcPercent * THC_MODIFIERS.anxiety;
  effect.anxiety += cultivar.cbdPercent * CBD_ANXIETY_REDUCTION;
  effect.energy *= 1.0 - cultivar.cbdPercent * CBD_ENERGY_DAMPING * 0.01;
  
  // CBD:THC synergy
  if (cultivar.cbdPercent >= cultivar.thcPercent * CBD_THC_BUFFER_RATIO) {
    effect.anxiety *= 0.7;
  }
  
  return { effect, unknownCount };
}

// ============================================================================
// BLEND CALCULATION
// ============================================================================

interface BlendCandidate {
  cultivarIds: string[];
  ratios: number[];
  effect: EffectVector;
  thc: number;
  cbd: number;
  score: number;
  unknownCount: number;
  violations: string[];
}

function calculateBlendEffect(
  cultivars: Cultivar[],
  cultivarEffects: Map<string, { effect: EffectVector; unknownCount: number }>,
  ratios: number[]
): { effect: EffectVector; thc: number; cbd: number; unknownCount: number } {
  const effect: EffectVector = {
    energy: 0,
    focus: 0,
    mood: 0,
    body: 0,
    creativity: 0,
    anxiety: 0,
  };
  
  let thc = 0;
  let cbd = 0;
  let unknownCount = 0;
  
  for (let i = 0; i < cultivars.length; i++) {
    const c = cultivars[i];
    const r = ratios[i];
    const ce = cultivarEffects.get(c.id)!;
    
    effect.energy += r * ce.effect.energy;
    effect.focus += r * ce.effect.focus;
    effect.mood += r * ce.effect.mood;
    effect.body += r * ce.effect.body;
    effect.creativity += r * ce.effect.creativity;
    effect.anxiety += r * ce.effect.anxiety;
    
    thc += r * c.thcPercent;
    cbd += r * c.cbdPercent;
    unknownCount += ce.unknownCount;
  }
  
  return { effect, thc, cbd, unknownCount };
}

function scoreBlend(
  blend: { effect: EffectVector; thc: number; cbd: number; unknownCount: number },
  intent: Intent,
  cultivarCount: number
): { score: number; violations: string[] } {
  const violations: string[] = [];
  
  // Anxiety hard constraint
  if (blend.effect.anxiety > intent.constraints.maxAnxiety) {
    return { score: -Infinity, violations: ["anxiety_exceeded"] };
  }
  
  // Cannabinoid constraints
  let cannabinoidPenalty = 0;
  
  if (intent.constraints.minTHC !== undefined && blend.thc < intent.constraints.minTHC) {
    cannabinoidPenalty += (intent.constraints.minTHC - blend.thc) * 0.1;
    violations.push("thc_below_min");
  }
  
  if (intent.constraints.maxTHC !== undefined && blend.thc > intent.constraints.maxTHC) {
    cannabinoidPenalty += (blend.thc - intent.constraints.maxTHC) * 0.1;
    violations.push("thc_above_max");
  }
  
  if (intent.constraints.minCBD !== undefined && blend.cbd < intent.constraints.minCBD) {
    cannabinoidPenalty += (intent.constraints.minCBD - blend.cbd) * 0.1;
    violations.push("cbd_below_min");
  }
  
  if (intent.constraints.maxCBD !== undefined && blend.cbd > intent.constraints.maxCBD) {
    return { score: -Infinity, violations: ["cbd_above_max"] };
  }
  
  // Distance calculation
  const target = intent.targetEffects;
  const distSq =
    Math.pow(target.energy - blend.effect.energy, 2) +
    Math.pow(target.focus - blend.effect.focus, 2) +
    Math.pow(target.mood - blend.effect.mood, 2) +
    Math.pow(target.body - blend.effect.body, 2) +
    Math.pow(target.creativity - blend.effect.creativity, 2);
  
  const distance = Math.sqrt(distSq);
  
  // Penalties
  const confidencePenalty = blend.unknownCount * UNKNOWN_TERPENE_CONFIDENCE_PENALTY;
  const complexityPenalty =
    cultivarCount === 3 && intent.context?.experience === "beginner" ? 0.05 : 0.0;
  
  const score = -distance - cannabinoidPenalty - confidencePenalty - complexityPenalty;
  
  return { score, violations };
}

// ============================================================================
// CANDIDATE GENERATION
// ============================================================================

function generateCandidates(
  inventory: Inventory,
  intent: Intent
): BlendCandidate[] {
  const available = inventory.cultivars.filter((c) => c.available);
  
  if (available.length === 0) {
    return [];
  }
  
  // Pre-calculate cultivar effects
  const cultivarEffects = new Map<string, { effect: EffectVector; unknownCount: number }>();
  for (const c of available) {
    cultivarEffects.set(c.id, calculateCultivarEffect(c));
  }
  
  const candidates: BlendCandidate[] = [];
  
  // 2-cultivar blends
  for (let i = 0; i < available.length; i++) {
    for (let j = 0; j < available.length; j++) {
      if (i === j) continue;
      
      const c1 = available[i];
      const c2 = available[j];
      
      for (const r1 of TWO_CULTIVAR_RATIOS) {
        const r2 = 1.0 - r1;
        if (r2 < 0.15 - EPSILON) continue;
        
        const blend = calculateBlendEffect([c1, c2], cultivarEffects, [r1, r2]);
        const { score, violations } = scoreBlend(blend, intent, 2);
        
        if (score > -Infinity) {
          candidates.push({
            cultivarIds: [c1.id, c2.id],
            ratios: [r1, r2],
            effect: blend.effect,
            thc: blend.thc,
            cbd: blend.cbd,
            score,
            unknownCount: blend.unknownCount,
            violations,
          });
        }
      }
    }
  }
  
  // 3-cultivar blends
  for (let i = 0; i < available.length; i++) {
    for (let j = 0; j < available.length; j++) {
      if (i === j) continue;
      for (let k = 0; k < available.length; k++) {
        if (i === k || j === k) continue;
        
        const c1 = available[i];
        const c2 = available[j];
        const c3 = available[k];
        
        for (const r1 of THREE_CULTIVAR_RATIOS) {
          for (const r2 of THREE_CULTIVAR_RATIOS) {
            if (r1 + r2 > 0.85 + EPSILON) continue;
            
            const r3 = 1.0 - r1 - r2;
            if (r3 < 0.15 - EPSILON) continue;
            
            const blend = calculateBlendEffect([c1, c2, c3], cultivarEffects, [r1, r2, r3]);
            const { score, violations } = scoreBlend(blend, intent, 3);
            
            if (score > -Infinity) {
              candidates.push({
                cultivarIds: [c1.id, c2.id, c3.id],
                ratios: [r1, r2, r3],
                effect: blend.effect,
                thc: blend.thc,
                cbd: blend.cbd,
                score,
                unknownCount: blend.unknownCount,
                violations,
              });
            }
          }
        }
      }
    }
  }
  
  return candidates;
}

// ============================================================================
// SORTING AND SELECTION
// ============================================================================

function sortCandidates(candidates: BlendCandidate[]): BlendCandidate[] {
  return candidates.sort((a, b) => {
    // Primary: score descending
    if (Math.abs(a.score - b.score) > EPSILON) {
      return b.score - a.score;
    }
    
    // Tiebreaker 1: cultivar count ascending (prefer 2 over 3)
    if (a.cultivarIds.length !== b.cultivarIds.length) {
      return a.cultivarIds.length - b.cultivarIds.length;
    }
    
    // Tiebreaker 2: total THC ascending
    if (Math.abs(a.thc - b.thc) > EPSILON) {
      return a.thc - b.thc;
    }
    
    // Tiebreaker 3: lexicographic cultivar IDs
    const aIds = [...a.cultivarIds].sort().join(",");
    const bIds = [...b.cultivarIds].sort().join(",");
    return aIds.localeCompare(bIds);
  });
}

// ============================================================================
// MAIN ENGINE
// ============================================================================

export function calculateBlends(
  inventory: Inventory,
  rawIntent: Intent
): EngineOutput {
  const startTime = Date.now();
  
  // Validate inputs
  const intent = validateIntent(rawIntent);
  
  // Check inventory
  if (inventory.cultivars.length === 0) {
    return {
      recommendations: [],
      intent,
      inventory_timestamp: inventory.timestamp,
      calculation_timestamp: new Date().toISOString(),
      audit: {
        inputHash: simpleHash({ inventory, intent }),
        configVersion: CONFIG_VERSION,
        candidatesEvaluated: 0,
        executionTimeMs: Date.now() - startTime,
      },
      error: "NO_INVENTORY",
      errorReason: "Inventory contains no cultivars",
    };
  }
  
  const available = inventory.cultivars.filter((c) => c.available);
  if (available.length === 0) {
    return {
      recommendations: [],
      intent,
      inventory_timestamp: inventory.timestamp,
      calculation_timestamp: new Date().toISOString(),
      audit: {
        inputHash: simpleHash({ inventory, intent }),
        configVersion: CONFIG_VERSION,
        candidatesEvaluated: 0,
        executionTimeMs: Date.now() - startTime,
      },
      error: "NO_AVAILABLE_CULTIVARS",
      errorReason: "No cultivars are currently available",
    };
  }
  
  // Generate candidates
  const candidates = generateCandidates(inventory, intent);
  
  if (candidates.length === 0) {
    return {
      recommendations: [],
      intent,
      inventory_timestamp: inventory.timestamp,
      calculation_timestamp: new Date().toISOString(),
      audit: {
        inputHash: simpleHash({ inventory, intent }),
        configVersion: CONFIG_VERSION,
        candidatesEvaluated: candidates.length,
        executionTimeMs: Date.now() - startTime,
      },
      error: "NO_VALID_BLEND",
      errorReason: "No blend satisfies anxiety constraint",
    };
  }
  
  // Sort and select top 5
  const sorted = sortCandidates(candidates);
  const top5 = sorted.slice(0, 5);
  
  // Build recommendations
  const cultivarMap = new Map(inventory.cultivars.map((c) => [c.id, c]));
  
  const recommendations: BlendRecommendation[] = top5.map((candidate) => {
    const confidence = Math.max(0, 1.0 - candidate.unknownCount * UNKNOWN_TERPENE_CONFIDENCE_PENALTY);
    
    return {
      cultivars: candidate.cultivarIds.map((id, idx) => ({
        id,
        name: cultivarMap.get(id)!.name,
        ratio: Math.round(candidate.ratios[idx] * 1000) / 1000,
      })),
      predictedEffects: candidate.effect,
      cannabinoids: {
        thc: Math.round(candidate.thc * 100) / 100,
        cbd: Math.round(candidate.cbd * 100) / 100,
      },
      score: Math.round(candidate.score * 10000) / 10000,
      confidence: Math.round(confidence * 100) / 100,
      metadata: {
        unknownTerpeneCount: candidate.unknownCount,
        constraintsViolated: candidate.violations,
      },
    };
  });
  
  return {
    recommendations,
    intent,
    inventory_timestamp: inventory.timestamp,
    calculation_timestamp: new Date().toISOString(),
    audit: {
      inputHash: simpleHash({ inventory, intent }),
      configVersion: CONFIG_VERSION,
      candidatesEvaluated: candidates.length,
      executionTimeMs: Date.now() - startTime,
    },
  };
}