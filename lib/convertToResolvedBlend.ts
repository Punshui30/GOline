import { NamedResolutionResult } from '@/lib/namedResolution';
import { ResolvedBlend, ResolvedCultivar, CultivarRole } from '@/components/ResolutionPanel';

/**
 * Convert NamedResolutionResult to ResolvedBlend format
 */
export function convertToResolvedBlend(named: NamedResolutionResult): ResolvedBlend {
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


