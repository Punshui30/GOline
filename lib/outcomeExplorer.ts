/**
 * Outcome Explorer
 * 
 * Evaluates fixed outcome set against user-provided inventory.
 * Uses deterministic resolver - no recommendations, only enumeration.
 */

import { CANONICAL_OUTCOMES, CanonicalOutcome } from './data/canonical_outcomes';
import { ParsedLabel, mapLabelToChemotype } from './labelParser';
import { canonicalChemotypes, type CanonicalChemotype } from '@/data/canonicalChemotypes';
import { ResolvedBlend, ResolvedCultivar } from '@/components/ResolutionPanel';
import { calculateBlends, EngineMode, Cultivar, Inventory } from './engine_core/go_calc_engine_strict';
import { mapLegacyIntentToStrict, OutcomeIntent } from './engine_core/legacy_compat';

export interface OutcomeEvaluation {
  outcome: CanonicalOutcome;
  status: 'achievable' | 'not_achievable';
  resolution?: ResolvedBlend;
  reason?: string;
}

/**
 * Build strict inventory from parsed labels
 */
function buildStrictInventory(labels: ParsedLabel[]): Inventory {
  const cultivars: Cultivar[] = [];

  labels.forEach((label, idx) => {
    const chemotype = mapLabelToChemotype(label, canonicalChemotypes);

    if (chemotype) {
      cultivars.push({
        id: chemotype.id || `temp_${idx}`,
        name: label.cultivarName,
        thcPercent: 20,
        cbdPercent: 0.1,
        terpenes: {
          myrcene: 0.5,
          limonene: 0.5,
          ...chemotype.terpenes
        } as any,
        available: true,
        dataFidelity: "PACKAGE_LABEL"
      });
    } else {
      cultivars.push({
        id: `manual_${idx}`,
        name: label.cultivarName,
        thcPercent: label.thc || 20,
        cbdPercent: label.cbd || 0,
        terpenes: {
          myrcene: label.terpenes?.includes('myrcene') ? 1.0 : 0,
          limonene: label.terpenes?.includes('limonene') ? 1.0 : 0,
          caryophyllene: label.terpenes?.includes('caryophyllene') ? 1.0 : 0,
        } as any,
        available: true,
        dataFidelity: "PACKAGE_LABEL"
      });
    }
  });

  return {
    timestamp: new Date().toISOString(),
    cultivars
  };
}

/**
 * Evaluate a single outcome against inventory
 */
function evaluateOutcome(
  outcome: CanonicalOutcome,
  inventory: Inventory
): OutcomeEvaluation {
  if (inventory.cultivars.length < 1) {
    return {
      outcome,
      status: 'not_achievable',
      reason: 'No valid cultivars in inventory',
    };
  }

  try {
    const strictIntent = mapLegacyIntentToStrict(outcome.intent);
    const result = calculateBlends(inventory, strictIntent, "DEMO");

    if (result.error || result.recommendations.length === 0) {
      return {
        outcome,
        status: 'not_achievable',
        reason: result.errorReason || result.error || 'Resolution failed',
      };
    }

    const primary = result.recommendations[0];

    // Construct ResolvedBlend matching ResolutionPanel interface
    const primaryBlend: ResolvedCultivar[] = primary.cultivars.map((c, idx) => ({
      id: c.id,
      name: c.name,
      role: idx === 0 ? 'primary' : 'secondary',
      rank: idx + 1,
      percentage: c.ratio * 100,
      weight: c.ratio,
      explanation: "Selected by strict engine.",
      chemotypeId: "unknown", // Stub
      weightGrams: 1.0 * c.ratio // Stub
    }));

    const blend: ResolvedBlend = {
      resolutionMode: "BLENDED",
      confidenceScore: 0.9,
      primaryBlend: primaryBlend,
      tradeoffs: [],
      rationaleSummary: "Strict engine selection based on available inventory.",
      alternates: undefined
    };

    return {
      outcome,
      status: 'achievable',
      resolution: blend,
    };

  } catch (err: any) {
    return {
      outcome,
      status: 'not_achievable',
      reason: err.message || 'Resolution failed',
    };
  }
}

/**
 * Evaluate all canonical outcomes against provided inventory
 */
export function exploreOutcomes(labels: ParsedLabel[]): OutcomeEvaluation[] {
  const strictInventory = buildStrictInventory(labels);

  if (strictInventory.cultivars.length === 0) {
    return CANONICAL_OUTCOMES.map(outcome => ({
      outcome,
      status: 'not_achievable' as const,
      reason: 'No valid cultivars found in labels',
    }));
  }

  return CANONICAL_OUTCOMES.map(outcome => evaluateOutcome(outcome, strictInventory));
}
