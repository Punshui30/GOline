import { NamedResolutionResult } from '@/lib/namedResolution';
import { ResolvedBlend, ResolvedCultivar, CultivarRole } from '@/components/ResolutionPanel';
import { OutcomeResult } from '@/lib/goOutcomeEngine';

/**
 * Convert NamedResolutionResult to ResolvedBlend format
 * Also accepts OutcomeResult to pass through failure states
 */
export function convertToResolvedBlend(
  named: NamedResolutionResult,
  outcome?: OutcomeResult
): ResolvedBlend {
  // If outcome has a failure, pass it through with required propertes
  if (outcome?.failure) {
    return {
      resolutionMode: 'FALLBACK',
      confidenceScore: 0,
      primaryBlend: [],
      tradeoffs: [],
      rationaleSummary: outcome.failure.reason || 'Resolution failed',
      failure: outcome.failure,
      stackingOptions: [],
    };
  }

  // Map role from "primary" | "corrective" | "supporting" to "Anchor" | "Modifier" | "Synergist"
  const mapRole = (role: string): CultivarRole => {
    if (role === 'primary') return 'Anchor';
    if (role === 'corrective') return 'Modifier';
    return 'Synergist';
  };

  const cultivars: ResolvedCultivar[] = named.primaryBlend.map(strain => ({
    id: strain.strainId,
    name: strain.strainName,
    role: mapRole(strain.role),
    percentage: strain.percentage,
    explanation: strain.rationale || '',
    chemotypeId: strain.strainId, // Using strainId as fallback
    weightGrams: (strain.percentage / 100) * 1.0, // Assuming 1g total for display
  }));

  return {
    resolutionMode: named.resolutionMode === 'STACKED' ? 'BLENDED' : 'SINGLE_TARGET', // Simplification for UI
    confidenceScore: named.confidenceScore,
    primaryBlend: cultivars,
    tradeoffs: named.tradeoffs,
    rationaleSummary: named.rationaleSummary,
    stackingOptions: named.stackingOptions.map(s => ({
      type: s.name,
      efficiencyScore: 0.9 // Mock score for now
    })),
    // Keep raw data available if needed
    cultivars: cultivars,
    stack: named.stack ? [named.stack] : [],
  };
}
