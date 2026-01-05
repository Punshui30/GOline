/**
 * Named Resolution Layer
 * 
 * Maps abstract chemotype outputs to actual named strains from inventory.
 * This is a MANDATORY layer - every resolution MUST produce named recommendations.
 */

import { OutcomeResult } from './goOutcomeEngine';
import { DEMO_MENU, type DemoStrain } from '@/data/demoMenu';
import { canonicalChemotypes, type CanonicalChemotype } from '@/data/canonicalChemotypes';

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
}

/**
 * Map canonical chemotype to demo menu strain
 * Uses heuristic matching based on chemotype characteristics
 */
function mapChemotypeToStrain(chemotype: CanonicalChemotype): DemoStrain | null {
  const chemotypeId = chemotype.id.toLowerCase();
  const displayName = chemotype.displayName.toLowerCase();
  
  // Direct ID matching (if chemotype IDs match demo menu IDs)
  const directMatch = DEMO_MENU.find(strain => 
    strain.id.toLowerCase() === chemotypeId ||
    chemotypeId.includes(strain.id.toLowerCase()) ||
    strain.id.toLowerCase().includes(chemotypeId.replace('chemo_', '').replace('_', '-'))
  );
  
  if (directMatch) return directMatch;
  
  // Heuristic matching based on chemotype characteristics
  // Match by terpene profile and cannabinoid content
  
  // High pinene + limonene → sativa-leaning
  const hasHighPinene = (chemotype.terpenes.pinene || 0) > 0.2;
  const hasHighLimonene = (chemotype.terpenes.limonene || 0) > 0.2;
  const hasHighMyrcene = (chemotype.terpenes.myrcene || 0) > 0.25;
  const hasHighLinalool = (chemotype.terpenes.linalool || 0) > 0.15;
  const thcLevel = chemotype.cannabinoids.THC || 0;
  const cbdLevel = chemotype.cannabinoids.CBD || 0;
  
  // Match to demo menu based on characteristics
  if (hasHighPinene && hasHighLimonene && thcLevel > 18) {
    // Sativa-leaning energizing profile
    return DEMO_MENU.find(s => s.name === "Jack Herer") || 
           DEMO_MENU.find(s => s.name === "Sour Diesel") ||
           DEMO_MENU.find(s => s.name === "Green Crack") ||
           null;
  }
  
  if (hasHighMyrcene && thcLevel > 18 && !hasHighPinene) {
    // Indica-leaning sedating profile
    return DEMO_MENU.find(s => s.name === "Bubba Kush") ||
           DEMO_MENU.find(s => s.name === "Granddaddy Purple") ||
           DEMO_MENU.find(s => s.name === "Northern Lights") ||
           null;
  }
  
  if (hasHighLinalool || (cbdLevel > 5 && thcLevel < 20)) {
    // Calming/functional profile
    return DEMO_MENU.find(s => s.name === "Cannatonic") ||
           DEMO_MENU.find(s => s.name === "Harlequin") ||
           DEMO_MENU.find(s => s.name === "ACDC") ||
           null;
  }
  
  // Balanced hybrid profile
  return DEMO_MENU.find(s => s.name === "Gelato") ||
         DEMO_MENU.find(s => s.name === "Blue Dream") ||
         DEMO_MENU.find(s => s.name === "Wedding Cake") ||
         null;
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
 */
function convertToNamedComponent(
  component: { cultivarId: string; displayName: string; role: "primary" | "corrective" | "supporting"; ratio: number },
  chemotypes: CanonicalChemotype[]
): NamedStrainComponent | null {
  const chemotype = chemotypes.find(c => c.id === component.cultivarId);
  if (!chemotype) return null;
  
  const strain = mapChemotypeToStrain(chemotype);
  if (!strain) return null;
  
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
      
      for (const component of phase.composition) {
        const named = convertToNamedComponent(component, canonicalChemotypes);
        if (named) {
          namedStrains.push(named);
        }
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
    const stackingOptions = primaryBlend.length > 0 
      ? [generateStackingPlan(primaryBlend)]
      : [];
    
    return {
      primaryBlend,
      stackingOptions,
      confidenceScore: outcome.tiers?.[0]?.compositionFit || 0.7,
      tradeoffs: outcome.tiers?.[0]?.tradeoffs || [],
      rationaleSummary: outcome.tiers?.[0]?.whyChosen?.[0] || 'Stacked resolution for multi-phase outcome.',
      resolutionMode: 'STACKED',
      stackedPhases,
    };
  }
  
  // Handle BLENDED mode (single-phase)
  const bestTier = outcome.tiers?.[0];
  if (!bestTier || !bestTier.composition || bestTier.composition.length === 0) {
    throw new Error('OutcomeResult must have at least one tier with composition');
  }
  
  // Convert abstract components to named strains
  const namedStrains: NamedStrainComponent[] = [];
  for (const component of bestTier.composition) {
    const named = convertToNamedComponent(component, canonicalChemotypes);
    if (named) {
      namedStrains.push(named);
    }
  }
  
  // Ensure we have at least one named strain
  if (namedStrains.length === 0) {
    throw new Error('Failed to map chemotypes to named strains - no valid mapping found');
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
  
  return {
    primaryBlend: namedStrains,
    stackingOptions,
    confidenceScore: bestTier.compositionFit,
    tradeoffs: bestTier.tradeoffs,
    rationaleSummary: bestTier.whyChosen?.[0] || 'Blend optimized for stated outcome.',
    resolutionMode: 'BLENDED',
  };
}

