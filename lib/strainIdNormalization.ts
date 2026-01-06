/**
 * Canonical strain ID normalization utility
 * 
 * MANDATORY: Use this function everywhere strain IDs are compared.
 * This ensures consistent ID matching across resolver output and STRAIN_LIBRARY keys.
 */

export function normalizeCultivarId(id: string): string {
  if (!id || typeof id !== 'string') {
    throw new Error(`Invalid cultivar ID: ${id}`);
  }
  
  return id
    .toLowerCase()
    .trim()
    .replace(/^ref-/, '')  // Remove ref- prefix (semantic guidance, not separate entity)
    .replace(/\s+/g, '-')  // Replace whitespace with hyphens
    .replace(/[^a-z0-9-]/g, '');  // Remove all non-alphanumeric characters except hyphens
}

