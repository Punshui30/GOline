/**
 * Chemotype Source Abstraction
 * 
 * Resolver MUST obtain chemotype data via explicit interface.
 * This ensures resolver logic is source-agnostic.
 */

import { CanonicalChemotype } from '@/data/canonicalChemotypes';

export interface ChemotypeData {
  thc: number;
  cbd: number;
  terpenes: Record<string, number>;
  totalTerpeneLoad: number;
}

export interface ChemotypeSource {
  getChemotype(cultivarId: string): ChemotypeData | null;
  getAllChemotypes(): ChemotypeData[];
}

/**
 * Canonical Numeric Chemotype Source (Demo)
 * Uses the canonical chemotype dataset with numeric terpene values
 */
export class CanonicalNumericChemotypeSource implements ChemotypeSource {
  private chemotypes: Map<string, ChemotypeData>;

  constructor(chemotypes: CanonicalChemotype[]) {
    this.chemotypes = new Map();
    
    for (const ct of chemotypes) {
      // Verify numeric data exists
      if (this.isValidNumericChemotype(ct)) {
        this.chemotypes.set(ct.id, {
          thc: ct.cannabinoids.THC || 0,
          cbd: ct.cannabinoids.CBD || 0,
          terpenes: { ...ct.terpenes },
          totalTerpeneLoad: ct.totalTerpeneLoad,
        });
      }
    }
  }

  private isValidNumericChemotype(ct: CanonicalChemotype): boolean {
    // Require numeric THC
    if (typeof ct.cannabinoids.THC !== 'number' || ct.cannabinoids.THC <= 0) {
      return false;
    }

    // Require at least one numeric terpene
    const hasNumericTerpenes = Object.values(ct.terpenes).some(
      v => typeof v === 'number' && v > 0
    );

    return hasNumericTerpenes;
  }

  getChemotype(cultivarId: string): ChemotypeData | null {
    return this.chemotypes.get(cultivarId) || null;
  }

  getAllChemotypes(): ChemotypeData[] {
    return Array.from(this.chemotypes.values());
  }
}

/**
 * Label-Derived Chemotype Source (User Input)
 * Parses user-provided label data into chemotype format
 */
export class LabelDerivedChemotypeSource implements ChemotypeSource {
  private chemotypes: Map<string, ChemotypeData>;

  constructor(labelData: Array<{ id: string; thc: number; cbd: number; terpenes: Record<string, number>; totalTerpenes: number }>) {
    this.chemotypes = new Map();
    
    for (const label of labelData) {
      this.chemotypes.set(label.id, {
        thc: label.thc,
        cbd: label.cbd || 0,
        terpenes: { ...label.terpenes },
        totalTerpeneLoad: label.totalTerpenes,
      });
    }
  }

  getChemotype(cultivarId: string): ChemotypeData | null {
    return this.chemotypes.get(cultivarId) || null;
  }

  getAllChemotypes(): ChemotypeData[] {
    return Array.from(this.chemotypes.values());
  }
}

/**
 * Get default chemotype source (canonical for demo)
 */
export function getDefaultChemotypeSource(): ChemotypeSource {
  // Import here to avoid circular dependency
  const { canonicalChemotypes } = require('@/data/canonicalChemotypes');
  return new CanonicalNumericChemotypeSource(canonicalChemotypes);
}

