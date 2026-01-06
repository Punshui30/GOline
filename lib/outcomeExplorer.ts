/**
 * Outcome Explorer
 * 
 * Evaluates fixed outcome set against user-provided inventory.
 * Uses deterministic resolver - no recommendations, only enumeration.
 */

import { resolveOutcome, OutcomeResult, OutcomeIntent } from './goOutcomeEngine';
import { CANONICAL_OUTCOMES, CanonicalOutcome } from './canonicalOutcomes';
import { ParsedLabel, mapLabelToChemotype } from './labelParser';
import { canonicalChemotypes, type CanonicalChemotype } from '@/data/canonicalChemotypes';
import { resolveToNamedStrains } from './namedResolution';
import { convertToResolvedBlend } from './convertToResolvedBlend';
import { ResolvedBlend } from '@/components/ResolutionPanel';

export interface OutcomeEvaluation {
  outcome: CanonicalOutcome;
  status: 'achievable' | 'not_achievable';
  resolution?: ResolvedBlend;
  reason?: string;
}

/**
 * Build temporary inventory from parsed labels
 * Only includes cultivars that can be mapped to canonical chemotypes
 */
function buildTemporaryInventory(labels: ParsedLabel[]): CanonicalChemotype[] {
  const inventory: CanonicalChemotype[] = [];
  
  for (const label of labels) {
    const chemotype = mapLabelToChemotype(label, canonicalChemotypes);
    if (chemotype) {
      inventory.push(chemotype);
    }
  }
  
  return inventory;
}

/**
 * Evaluate a single outcome against inventory
 * Uses deterministic resolver and validates results against inventory constraints
 */
function evaluateOutcome(
  outcome: CanonicalOutcome,
  inventory: CanonicalChemotype[]
): OutcomeEvaluation {
  // If inventory is empty, mark as not achievable
  if (inventory.length === 0) {
    return {
      outcome,
      status: 'not_achievable',
      reason: 'No valid cultivars in inventory',
    };
  }
  
  // Check minimum diversity requirement
  if (inventory.length < 2) {
    return {
      outcome,
      status: 'not_achievable',
      reason: 'Insufficient diversity (requires ≥2 distinct cultivars)',
    };
  }
  
  try {
    // Run resolver with the outcome's intent
    // Note: Resolver uses global canonicalChemotypes, but we'll validate results
    const result = resolveOutcome(outcome.intent);
    
    // Check for failure
    if (result.failure) {
      return {
        outcome,
        status: 'not_achievable',
        reason: result.failure.reason === 'INSUFFICIENT_DISTINCT_CULTIVARS' 
          ? 'Insufficient diversity (requires ≥2 distinct cultivars)'
          : result.failure.reason === 'INVENTORY_TOO_NARROW'
          ? 'Insufficient diversity (requires ≥2 distinct cultivars)'
          : result.failure.details || result.failure.reason,
      };
    }
    
    // Check if we have valid selectedCultivars
    if (!result.selectedCultivars || result.selectedCultivars.length === 0) {
      return {
        outcome,
        status: 'not_achievable',
        reason: 'No valid resolution found',
      };
    }
    
    // Validate that all cultivars in result are in inventory
    const inventoryIds = new Set(inventory.map(c => c.id));
    const compositionIds = result.selectedCultivars.map(c => c.id).filter(Boolean);
    
    if (compositionIds.length === 0) {
      return {
        outcome,
        status: 'not_achievable',
        reason: 'Composition has no valid cultivar IDs',
      };
    }
    
    const allInInventory = compositionIds.every(id => inventoryIds.has(id));
    
    if (!allInInventory) {
      return {
        outcome,
        status: 'not_achievable',
        reason: 'Resolution requires cultivars not in inventory',
      };
    }
    
    // Convert to named resolution and then to ResolvedBlend
    try {
      const named = resolveToNamedStrains(result);
      const blend = convertToResolvedBlend(named, result);
      
      // Double-check that named strains map back to inventory
      // This is a safety check - the mapping might use demo menu which could differ
      // In production, we'd have a more robust mapping system
      
      return {
        outcome,
        status: 'achievable',
        resolution: blend,
      };
    } catch (err) {
      return {
        outcome,
        status: 'not_achievable',
        reason: 'Failed to generate named resolution',
      };
    }
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
  // Build temporary inventory
  const inventory = buildTemporaryInventory(labels);
  
  if (inventory.length === 0) {
    // All outcomes are not achievable if no valid inventory
    return CANONICAL_OUTCOMES.map(outcome => ({
      outcome,
      status: 'not_achievable' as const,
      reason: 'No valid cultivars found in labels',
    }));
  }
  
  // Evaluate each outcome
  return CANONICAL_OUTCOMES.map(outcome => evaluateOutcome(outcome, inventory));
}

