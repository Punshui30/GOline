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
  // If outcome has a failure, pass it through
  if (outcome?.failure) {
    return {
      cultivars: [],
      failure: outcome.failure,
    };
  }
  
  // Map role from "primary" | "corrective" | "supporting" to "foundation" | "modulator" | "accent"
  const mapRole = (role: string): CultivarRole => {
    if (role === 'primary') return 'foundation';
    if (role === 'corrective') return 'modulator';
    return 'accent';
  };
  
  const cultivars: ResolvedCultivar[] = named.primaryBlend.map(strain => ({
    name: strain.strainName,
    percentage: strain.percentage,
    role: mapRole(strain.role),
  }));
  
  return {
    cultivars,
    stack: named.stack,
  };
}



