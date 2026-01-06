/**
 * Strain Resolution - NO SKIPPING
 * 
 * MANDATORY: All strain IDs must map to STRAIN_LIBRARY.
 * If a strain cannot be mapped, throw an error immediately.
 * No silent skipping, no defensive fallbacks.
 */

import { STRAIN_LIBRARY, type Strain } from './strainLibrary';

/**
 * Resolve strain ID to Strain object
 * 
 * @param id - Strain ID (may have ref- prefix)
 * @returns Strain object from STRAIN_LIBRARY
 * @throws Error if strain is not found
 */
export function resolveStrain(id: string): Strain {
  if (!id || typeof id !== 'string') {
    throw new Error(`Invalid strain ID: ${id}`);
  }
  
  // Strip ref- prefix if present
  const canonical = id.replace(/^ref-/, '').toLowerCase().trim();
  
  // Direct lookup in STRAIN_LIBRARY
  const strain = STRAIN_LIBRARY[canonical];
  
  if (!strain) {
    const availableIds = Object.keys(STRAIN_LIBRARY).slice(0, 10).join(', ');
    throw new Error(
      `Unmapped strain: ${id} (canonical: ${canonical})\n` +
      `  STRAIN_LIBRARY contains ${Object.keys(STRAIN_LIBRARY).length} strains.\n` +
      `  Available IDs (first 10): ${availableIds}`
    );
  }
  
  return strain;
}

