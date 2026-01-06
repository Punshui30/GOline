/**
 * Named Resolution Layer
 * 
 * Maps abstract chemotype outputs to actual named strains from STRAIN_LIBRARY.
 * This is a MANDATORY layer - every resolution MUST produce named recommendations.
 * Uses deterministic, index-based mapping - NO heuristic matching, NO fallbacks.
 */

import { OutcomeResult } from './goOutcomeEngine';
import { STRAIN_LIBRARY, mapCultivarIdToStrain, type Strain } from './strainLibrary';

/**
 * Named strain component (maps abstract chemotype to inventory strain)
 */
export interface NamedStrainComponent {
  strainName: string; // Actual strain name from DEMO_MENU
  strainId: string; // DEMO_MENU id
  percentage: number; // 0-100, must sum to 100 for blend
  role: "primary" | "corrective" | "supporting";
  rationale?: string; // Why this strain was chosen
}

/**
 * Stack segment for layered consumption
 */
export interface StackSegment {
  position: "tip" | "middle" | "end"; // Where in the pre-roll/joint
  strainName: string;
  strainId: string;
  purpose: string; // e.g., "anxiety buffering", "pain relief + creativity"
  percentage: number; // Percentage of total consumption
}

/**
 * Stacking plan for temporal consumption
 */
export interface StackingPlan {
  name: string; // e.g., "Calm Entry → Social Peak → Soft Landing"
  segments: StackSegment[];
  rationale: string; // Why this stacking arrangement
}

/**
 * Named resolution result (final output with actual strain names)
 */
export interface NamedResolutionResult {
  // Primary recommendation (always present)
  primaryBlend: NamedStrainComponent[];
  
  // Stacking options (generated for every blend)
  stackingOptions: StackingPlan[];
  
  // Metadata
  confidenceScore: number; // 0-1
  tradeoffs: string[];
  rationaleSummary: string;
  
  // Original resolution mode
  resolutionMode: "BLENDED" | "STACKED";
  
  // Stacked phases (if resolutionMode is STACKED)
  stackedPhases?: Array<{
    phase: string;
    strains: NamedStrainComponent[];
    purpose?: string;
    whatYoullFeel?: string;
  }>;
  
  // Stack structure for UI display (derived from stackingOptions)
  stack?: {
    bottom: string;
    middle?: string;
    top?: string;
  };
}

/**
 * Map cultivarId to Strain from STRAIN_LIBRARY
 * Deterministic, index-based mapping - NO heuristic matching, NO fallbacks
 */
function mapCultivarIdToStrainName(cultivarId: string): Strain | null {
  // Log the mapping attempt for debugging
  if (process.env.NODE_ENV === 'development') {
    console.debug(`[NAMED_RESOLUTION] Attempting to map cultivarId: "${cultivarId}"`);
    console.debug(`[NAMED_RESOLUTION] STRAIN_LIBRARY has ${STRAIN_LIBRARY.length} strains`);
    console.debug(`[NAMED_RESOLUTION] Available IDs (first 5): ${STRAIN_LIBRARY.slice(0, 5).map(s => s.id).join(', ')}`);
  }
  
  // Use deterministic mapping function from strainLibrary
  const strain = mapCultivarIdToStrain(cultivarId);
  
  if (!strain) {
    console.error(`[NAMED_RESOLUTION] Failed to map cultivarId "${cultivarId}" to STRAIN_LIBRARY`);
    console.error(`[NAMED_RESOLUTION] Available strain IDs: ${STRAIN_LIBRARY.map(s => s.id).join(', ')}`);
    return null;
  }
  
  if (process.env.NODE_ENV === 'development') {
    console.debug(`[NAMED_RESOLUTION] Successfully mapped "${cultivarId}" to "${strain.name}"`);
  }
  
  return strain;
}

/**
 * Generate stacking plan for a blend
 * Creates temporal consumption layout: tip → middle → end
 */
function generateStackingPlan(blend: NamedStrainComponent[]): StackingPlan {
  if (blend.length === 1) {
    // Single strain - no stacking needed, but provide option
    return {
      name: "Uniform Composition",
      segments: [{
        position: "middle",
        strainName: blend[0].strainName,
        strainId: blend[0].strainId,
        purpose: "Primary effect delivery",
        percentage: 100,
      }],
      rationale: "Single strain composition - use uniformly throughout.",
    };
  }
  
  // Multi-strain blend - create stacking arrangement
  const sortedByRole = [...blend].sort((a, b) => {
    // Order: primary first, then supporting, then corrective
    const roleOrder = { primary: 0, supporting: 1, corrective: 2 };
    return roleOrder[a.role] - roleOrder[b.role];
  });
  
  const primary = sortedByRole[0];
  const supporting = sortedByRole[1] || null;
  const corrective = sortedByRole.find(s => s.role === 'corrective') || null;
  
  const segments: StackSegment[] = [];
  
  // Tip (onset) - use primary or supporting for activation
  if (primary && primary.percentage >= 40) {
    segments.push({
      position: "tip",
      strainName: primary.strainName,
      strainId: primary.strainId,
      purpose: "Primary effect onset",
      percentage: Math.min(35, primary.percentage * 0.4),
    });
  } else if (supporting) {
    segments.push({
      position: "tip",
      strainName: supporting.strainName,
      strainId: supporting.strainId,
      purpose: "Activation and onset control",
      percentage: Math.min(30, supporting.percentage * 0.5),
    });
  }
  
  // Middle (core) - primary effect delivery
  if (primary) {
    segments.push({
      position: "middle",
      strainName: primary.strainName,
      strainId: primary.strainId,
      purpose: "Core experience and primary outcome",
      percentage: primary.percentage * 0.5,
    });
  }
  
  // End (landing) - corrective or calming
  if (corrective) {
    segments.push({
      position: "end",
      strainName: corrective.strainName,
      strainId: corrective.strainId,
      purpose: "Anxiety reduction and smooth comedown",
      percentage: corrective.percentage,
    });
  } else if (supporting && supporting.percentage < 30) {
    segments.push({
      position: "end",
      strainName: supporting.strainName,
      strainId: supporting.strainId,
      purpose: "Balance and duration extension",
      percentage: supporting.percentage * 0.6,
    });
  }
  
  // Normalize percentages to sum to 100
  const total = segments.reduce((sum, s) => sum + s.percentage, 0);
  if (total > 0) {
    segments.forEach(s => {
      s.percentage = Math.round((s.percentage / total) * 100);
    });
  }
  
  const name = segments.length === 1 
    ? "Uniform Composition"
    : `${segments[0]?.strainName || 'Primary'} → ${segments[1]?.strainName || 'Core'} → ${segments[2]?.strainName || 'Landing'}`;
  
  return {
    name,
    segments,
    rationale: segments.length > 1 
      ? "Layered consumption allows temporal control: onset, core experience, and smooth landing."
      : "Uniform blend - use consistently throughout.",
  };
}

/**
 * Convert abstract BlendComponent to NamedStrainComponent
 * Uses STRAIN_LIBRARY exclusively - deterministic mapping by cultivarId
 */
function convertToNamedComponent(
  component: { cultivarId: string; displayName: string; role: "primary" | "corrective" | "supporting"; ratio: number }
): NamedStrainComponent | null {
  // Map cultivarId directly to STRAIN_LIBRARY (deterministic, index-based)
  const strain = mapCultivarIdToStrainName(component.cultivarId);
  if (!strain) {
    console.error(`[NAMED_RESOLUTION] Cannot map cultivarId "${component.cultivarId}" - skipping component`);
    return null;
  }
  
  return {
    strainName: strain.name,
    strainId: strain.id,
    percentage: component.ratio,
    role: component.role,
    rationale: component.role === 'primary' 
      ? 'Primary driver for desired outcome'
      : component.role === 'corrective'
      ? 'Anxiety reduction and balance'
      : 'Supporting effect modulation',
  };
}

/**
 * MANDATORY NAMED RESOLUTION LAYER
 * 
 * Converts abstract OutcomeResult to NamedResolutionResult with actual strain names.
 * This is the final step before UI display - ensures every recommendation has named cultivars.
 */
export function resolveToNamedStrains(outcome: OutcomeResult): NamedResolutionResult {
  // Validation: OutcomeResult must have either tiers or phases
  if (!outcome.tiers && !outcome.phases) {
    throw new Error('OutcomeResult must have either tiers or phases');
  }
  
  // Handle STACKED mode
  if (outcome.resolutionMode === 'STACKED' && outcome.phases) {
    const stackedPhases = outcome.phases.map(phase => {
      const namedStrains: NamedStrainComponent[] = [];
      
      // Log all components being mapped
      if (process.env.NODE_ENV === 'development') {
        console.debug(`[NAMED_RESOLUTION] STACKED mode - Mapping ${phase.composition.length} components for phase: ${phase.phase}`);
        phase.composition.forEach((c, idx) => {
          console.debug(`  [${idx}] cultivarId: "${c.cultivarId}", displayName: "${c.displayName}"`);
        });
      }
      
      for (const component of phase.composition) {
        const named = convertToNamedComponent(component);
        if (named) {
          namedStrains.push(named);
        } else {
          // Log which component failed to map (ALWAYS log, not just dev)
          console.error(`[NAMED_RESOLUTION] STACKED mode - Failed to map component: cultivarId="${component.cultivarId}", displayName="${component.displayName}"`);
          console.error(`[NAMED_RESOLUTION] STRAIN_LIBRARY has ${STRAIN_LIBRARY.length} strains`);
          console.error(`[NAMED_RESOLUTION] STRAIN_LIBRARY IDs (first 10): ${STRAIN_LIBRARY.slice(0, 10).map(s => s.id).join(', ')}`);
        }
      }
      
      // Fail if no strains mapped for this phase
      if (namedStrains.length === 0) {
        const failedIds = phase.composition.map(c => c.cultivarId).join(', ');
        const availableIds = STRAIN_LIBRARY.map(s => s.id).join(', ');
        throw new Error(
          `Failed to map chemotypes to named strains (STACKED mode, phase: ${phase.phase}).\n` +
          `  CultivarIds from resolver: ${failedIds}\n` +
          `  STRAIN_LIBRARY size: ${STRAIN_LIBRARY.length}\n` +
          `  Available IDs: ${availableIds}`
        );
      }
      
      // Normalize percentages to sum to 100
      const total = namedStrains.reduce((sum, s) => sum + s.percentage, 0);
      if (total > 0) {
        namedStrains.forEach(s => {
          s.percentage = Math.round((s.percentage / total) * 100);
        });
      }
      
      return {
        phase: phase.phase,
        strains: namedStrains,
        purpose: phase.purpose,
        whatYoullFeel: phase.whatYoullFeel,
      };
    });
    
    // Use first phase as primary blend for stacking options
    const primaryBlend = stackedPhases[0]?.strains || [];
    
    // Fail if primary blend is empty
    if (primaryBlend.length === 0) {
      throw new Error(
        `Failed to map chemotypes to named strains (STACKED mode - no strains in primary phase).\n` +
        `  STRAIN_LIBRARY size: ${STRAIN_LIBRARY.length}`
      );
    }
    
    const stackingOptions = primaryBlend.length > 0 
      ? [generateStackingPlan(primaryBlend)]
      : [];
    
    // Build stack structure from stacked phases
    const stack: { bottom: string; middle?: string; top?: string } = {
      bottom: stackedPhases.find(p => p.phase.includes('End') || p.phase.includes('Landing'))?.strains[0]?.strainName || stackedPhases[stackedPhases.length - 1]?.strains[0]?.strainName || '',
      middle: stackedPhases.find(p => p.phase.includes('Middle') || p.phase.includes('Core'))?.strains[0]?.strainName,
      top: stackedPhases.find(p => p.phase.includes('Top') || p.phase.includes('Opening'))?.strains[0]?.strainName,
    };
    
    return {
      primaryBlend,
      stackingOptions,
      confidenceScore: outcome.phases?.[0]?.compositionFit || 0.7,
      tradeoffs: outcome.phases?.[0]?.systemNotes || [],
      rationaleSummary: outcome.phases?.[0]?.systemNotes?.[0] || 'Stacked resolution for multi-phase outcome.',
      resolutionMode: 'STACKED',
      stackedPhases,
      stack,
    };
  }
  
  // Handle BLENDED mode (single-phase)
  const bestTier = outcome.tiers?.[0];
  if (!bestTier || !bestTier.composition || bestTier.composition.length === 0) {
    throw new Error('OutcomeResult must have at least one tier with composition');
  }
  
  // Convert abstract components to named strains using STRAIN_LIBRARY
  const namedStrains: NamedStrainComponent[] = [];
  
  // Log all components being mapped
  if (process.env.NODE_ENV === 'development') {
    console.debug(`[NAMED_RESOLUTION] Mapping ${bestTier.composition.length} components:`);
    bestTier.composition.forEach((c, idx) => {
      console.debug(`  [${idx}] cultivarId: "${c.cultivarId}", displayName: "${c.displayName}"`);
    });
  }
  
  for (const component of bestTier.composition) {
    const named = convertToNamedComponent(component);
    if (named) {
      namedStrains.push(named);
    } else {
      // Log which component failed to map with full context (ALWAYS log, not just dev)
      console.error(`[NAMED_RESOLUTION] Failed to map component: cultivarId="${component.cultivarId}", displayName="${component.displayName}"`);
      console.error(`[NAMED_RESOLUTION] STRAIN_LIBRARY has ${STRAIN_LIBRARY.length} strains`);
      console.error(`[NAMED_RESOLUTION] STRAIN_LIBRARY IDs (first 10): ${STRAIN_LIBRARY.slice(0, 10).map(s => s.id).join(', ')}`);
    }
  }
  
  // Ensure we have at least one named strain - fail explicitly if mapping fails
  if (namedStrains.length === 0) {
    const failedIds = bestTier.composition.map(c => c.cultivarId).join(', ');
    const availableIds = STRAIN_LIBRARY.map(s => s.id).join(', ');
    throw new Error(
      `Failed to map chemotypes to named strains.\n` +
      `  CultivarIds from resolver: ${failedIds}\n` +
      `  STRAIN_LIBRARY size: ${STRAIN_LIBRARY.length}\n` +
      `  Available IDs: ${availableIds}`
    );
  }
  
  // Normalize percentages to sum to 100
  const total = namedStrains.reduce((sum, s) => sum + s.percentage, 0);
  if (total > 0 && total !== 100) {
    namedStrains.forEach(s => {
      s.percentage = Math.round((s.percentage / total) * 100);
    });
  }
  
  // Generate stacking options for the blend
  const stackingOptions = [generateStackingPlan(namedStrains)];
  
  // Build stack structure for UI display
  const stackPlan = stackingOptions[0];
  const stack = stackPlan ? {
    bottom: stackPlan.segments.find(s => s.position === 'end')?.strainName || namedStrains[0]?.strainName || '',
    middle: stackPlan.segments.find(s => s.position === 'middle')?.strainName,
    top: stackPlan.segments.find(s => s.position === 'tip')?.strainName,
  } : undefined;
  
  return {
    primaryBlend: namedStrains,
    stackingOptions,
    confidenceScore: bestTier.compositionFit,
    tradeoffs: bestTier.tradeoffs,
    rationaleSummary: bestTier.whyChosen?.[0] || 'Blend optimized for stated outcome.',
    resolutionMode: 'BLENDED',
    stack,
  };
}

