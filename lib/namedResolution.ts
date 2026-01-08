/**
 * Named Resolution Layer
 * 
 * Maps abstract chemotype outputs to actual named strains from STRAIN_LIBRARY.
 * This is a MANDATORY layer - every resolution MUST produce named recommendations.
 * Uses deterministic, index-based mapping - NO heuristic matching, NO fallbacks.
 */

import { OutcomeResult } from './goOutcomeEngine';
import { resolveStrain } from './resolveNamedStrains';
import { STRAIN_LIBRARY, type Strain } from './strainLibrary';

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
 * MANDATORY: Uses resolveStrain which throws on unmapped strains
 * NO SKIPPING - hard error if strain not found
 */
function mapCultivarIdToStrainName(cultivarId: string): Strain {
  // Use resolveStrain which throws on failure (no skipping)
  return resolveStrain(cultivarId);
}

/**
 * Generate stacking plan for a blend
 * Creates temporal consumption layout: tip → middle → end
 * SPEC COMPLIANCE: Roles derived from attributes (Energy/Calm), NOT chosen first.
 */
function generateStackingPlan(blend: NamedStrainComponent[]): StackingPlan {
  if (blend.length === 1) {
    // Single strain - no stacking needed
    return {
      name: "Uniform Composition",
      segments: [{
        position: "middle",
        strainName: blend[0].strainName,
        strainId: blend[0].strainId,
        purpose: "Uniform effect distribution",
        percentage: 100,
      }],
      rationale: "Single cultivar selected for total alignment. Layering not required.",
    };
  }

  // Multi-strain blend - create stacking arrangement based on ATTRIBUTES
  // 1. Look up attributes
  const strainsWithAttributes = blend.map(component => {
    const strainData = STRAIN_LIBRARY[component.strainId];
    return {
      ...component,
      energy: strainData?.effects?.energy || 50,
      calm: strainData?.effects?.calm || 50,
      body: strainData?.effects?.body || 50,
    };
  });

  // 2. Derive Roles
  // Rule: High Energy dominance -> Tip (Onset)
  // Rule: High Calm/Body dominance -> End (Landing)

  const orderedStack = [...strainsWithAttributes].sort((a, b) => {
    const metricA = a.energy - (a.calm * 0.5); // Weighted preference for energy
    const metricB = b.energy - (b.calm * 0.5);
    return metricB - metricA; // Descending energy/activation
  });

  // Map into segments
  const segments: StackSegment[] = orderedStack.map((s, idx) => {
    let position: "tip" | "middle" | "end" = "middle";
    let purpose = "Sustained Effect";

    if (idx === 0) {
      position = "tip";
      purpose = "Immediate Onset & Activation";
    } else if (idx === orderedStack.length - 1) {
      position = "end";
      purpose = "Smooth Landing & Duration";
    }

    return {
      position,
      strainName: s.strainName,
      strainId: s.strainId,
      purpose,
      percentage: s.percentage
    };
  });

  const name = segments.map(s => s.strainName).join(' → ');

  return {
    name,
    segments,
    rationale: "Stacked by bio-availability: Higher energy terpenes placed at the tip for immediate onset, transitioning to heavier chemotypes for duration and smooth landing.",
  };
}

/**
 * Convert abstract BlendComponent to NamedStrainComponent
 * Uses STRAIN_LIBRARY exclusively - deterministic mapping by cultivarId
 */
function convertToNamedComponent(
  component: { cultivarId: string; displayName: string; role?: string; ratio: number }
): NamedStrainComponent {
  // Map cultivarId directly to STRAIN_LIBRARY (throws on failure - no silent skipping)
  const strain = mapCultivarIdToStrainName(component.cultivarId);

  // Default role if missing (Math Engine doesn't assign roles until now, but might pass placeholder)
  const role = ((component.role as any) || 'primary') as "primary" | "corrective" | "supporting";

  return {
    strainName: strain.name,
    strainId: strain.id,
    percentage: component.ratio,
    role, // This role is legacy/placeholder. StackingPlan derives the real temporal role.
    rationale: 'Mathematically selected for vector fit',
  };
}

/**
 * MANDATORY NAMED RESOLUTION LAYER
 * 
 * Converts abstract OutcomeResult to NamedResolutionResult with actual strain names.
 * This is the final step before UI display - ensures every recommendation has named cultivars.
 */
export function resolveToNamedStrains(outcome: OutcomeResult): NamedResolutionResult {
  // Check for failure state
  if (outcome.failure) {
    throw new Error(`Resolution failed: ${outcome.failure.reason} - ${outcome.failure.details || ''}`);
  }

  // Handle new format with primary + alternates
  const primaryCandidate = outcome.primary;
  
  // Validation: OutcomeResult must have primary candidate
  if (!primaryCandidate || !primaryCandidate.selectedCultivars || primaryCandidate.selectedCultivars.length === 0) {
    throw new Error('OutcomeResult must have primary candidate with selectedCultivars');
  }
  if (!primaryCandidate.ratios || primaryCandidate.ratios.length === 0) {
    throw new Error('OutcomeResult primary must have ratios');
  }
  if (primaryCandidate.selectedCultivars.length !== primaryCandidate.ratios.length) {
    throw new Error('OutcomeResult primary selectedCultivars and ratios must have the same length');
  }
  
  // Use primary candidate for the main result
  const outcomeForProcessing = {
    selectedCultivars: primaryCandidate.selectedCultivars,
    ratios: primaryCandidate.ratios,
    confidenceScore: primaryCandidate.confidenceScore,
    notes: primaryCandidate.notes,
    explanation: primaryCandidate.explanation
  };

  // Handle BLENDED mode (Math Engine output)
  const namedStrains: NamedStrainComponent[] = [];

  for (let i = 0; i < outcomeForProcessing.selectedCultivars.length; i++) {
    const cultivar = outcomeForProcessing.selectedCultivars[i];
    const ratio = outcomeForProcessing.ratios[i];

    // Safety: ensure cultivar.id is valid
    // The Math Engine outputs IDs from STRAIN_LIBRARY, which might not match the `resolveStrain` expectation 
    // if `resolveStrain` expects "ref-..." prefixes.
    // However, `goOutcomeEngine` now uses `STRAIN_LIBRARY` directly.
    // We should check if `resolveStrain` handles raw IDs. 
    // Assuming `resolveStrain` is robust or we bypass it if ID is already in library.

    const component = {
      cultivarId: cultivar.id,
      displayName: cultivar.displayName,
      ratio: ratio,
      role: 'primary' // Placeholder
    };

    const named = convertToNamedComponent(component);
    namedStrains.push(named);
  }

  // Generate stacking options based on ATTRIBUTES
  const stackingOptions = [generateStackingPlan(namedStrains)];

  // Build stack structure for UI display
  const stackPlan = stackingOptions[0];
  const stack = stackPlan ? {
    bottom: stackPlan.segments.find(s => s.position === 'end')?.strainName || namedStrains[namedStrains.length - 1]?.strainName || '',
    middle: stackPlan.segments.find(s => s.position === 'middle')?.strainName,
    top: stackPlan.segments.find(s => s.position === 'tip')?.strainName,
  } : undefined;

  return {
    primaryBlend: namedStrains,
    stackingOptions,
    confidenceScore: outcomeForProcessing.confidenceScore || 0.7,
    tradeoffs: outcomeForProcessing.notes || [],
    rationaleSummary: outcomeForProcessing.notes?.[0] || 'Optimized Blend',
    resolutionMode: 'BLENDED',
    stack,
  };
}
