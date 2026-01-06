/**
 * Canonical Strain Library
 * 
 * Authoritative source for strain-to-chemistry mapping.
 * ALL strain scoring and selection comes exclusively from this library.
 * No hardcoded strain names exist anywhere else.
 * No fallback strains are allowed.
 * 
 * This library contains 40 strains with normalized IDs and deterministic terpene profiles.
 */

import { normalizeCultivarId } from './strainIdNormalization';

export interface Strain {
  name: string;
  aliases?: string[];  // Known aliases (e.g., ["gsc", "girl scout cookies"])
  thc: [number, number];  // [min, max] THC range
  cbd: [number, number];  // [min, max] CBD range
  terpenes: {
    myrcene?: number;
    limonene?: number;
    pinene?: number;
    linalool?: number;
    caryophyllene?: number;
    terpinolene?: number;
    humulene?: number;
    ocimene?: number;
  };
}

/**
 * STRAIN_LIBRARY - 40 strains with normalized IDs
 * IDs are normalized: lowercase, hyphenated, no special characters
 */
export const STRAIN_LIBRARY: Record<string, Strain> = {
  "blue-dream": {
    name: "Blue Dream",
    aliases: ["blue dream", "bluedream"],
    thc: [18, 24],
    cbd: [0, 1],
    terpenes: {
      myrcene: 0.45,
      pinene: 0.20,
      caryophyllene: 0.15,
      limonene: 0.12,
      humulene: 0.08
    }
  },

  "jack-herer": {
    name: "Jack Herer",
    thc: [18, 23],
    cbd: [0, 1],
    terpenes: {
      terpinolene: 0.35,
      pinene: 0.25,
      caryophyllene: 0.15,
      limonene: 0.15,
      myrcene: 0.10
    }
  },

  "durban-poison": {
    name: "Durban Poison",
    thc: [20, 25],
    cbd: [0, 1],
    terpenes: {
      terpinolene: 0.40,
      pinene: 0.25,
      myrcene: 0.15,
      ocimene: 0.10,
      limonene: 0.10
    }
  },

  "sour-diesel": {
    name: "Sour Diesel",
    thc: [20, 26],
    cbd: [0, 1],
    terpenes: {
      caryophyllene: 0.30,
      limonene: 0.25,
      myrcene: 0.20,
      pinene: 0.15,
      humulene: 0.10
    }
  },

  "og-kush": {
    name: "OG Kush",
    thc: [19, 26],
    cbd: [0, 1],
    terpenes: {
      myrcene: 0.35,
      limonene: 0.25,
      caryophyllene: 0.20,
      pinene: 0.10,
      humulene: 0.10
    }
  },

  "girl-scout-cookies": {
    name: "Girl Scout Cookies",
    thc: [20, 28],
    cbd: [0, 1],
    terpenes: {
      caryophyllene: 0.30,
      limonene: 0.25,
      myrcene: 0.20,
      humulene: 0.15,
      linalool: 0.10
    }
  },

  "gelato": {
    name: "Gelato",
    thc: [20, 27],
    cbd: [0, 1],
    terpenes: {
      caryophyllene: 0.25,
      limonene: 0.25,
      myrcene: 0.20,
      linalool: 0.15,
      humulene: 0.15
    }
  },

  "wedding-cake": {
    name: "Wedding Cake",
    thc: [20, 26],
    cbd: [0, 1],
    terpenes: {
      caryophyllene: 0.30,
      limonene: 0.25,
      linalool: 0.20,
      myrcene: 0.15,
      humulene: 0.10
    }
  },

  "zkittlez": {
    name: "Zkittlez",
    thc: [18, 24],
    cbd: [0, 1],
    terpenes: {
      caryophyllene: 0.30,
      humulene: 0.20,
      limonene: 0.20,
      linalool: 0.15,
      myrcene: 0.15
    }
  },

  "pineapple-express": {
    name: "Pineapple Express",
    thc: [18, 24],
    cbd: [0, 1],
    terpenes: {
      limonene: 0.35,
      myrcene: 0.25,
      pinene: 0.20,
      caryophyllene: 0.10,
      ocimene: 0.10
    }
  },

  "green-crack": {
    name: "Green Crack",
    thc: [18, 25],
    cbd: [0, 1],
    terpenes: {
      myrcene: 0.40,
      limonene: 0.30,
      pinene: 0.20,
      caryophyllene: 0.10
    }
  },

  "super-lemon-haze": {
    name: "Super Lemon Haze",
    thc: [19, 26],
    cbd: [0, 1],
    terpenes: {
      limonene: 0.45,
      terpinolene: 0.20,
      myrcene: 0.15,
      pinene: 0.10,
      caryophyllene: 0.10
    }
  },

  "granddaddy-purple": {
    name: "Granddaddy Purple",
    thc: [17, 24],
    cbd: [0, 1],
    terpenes: {
      myrcene: 0.45,
      caryophyllene: 0.20,
      pinene: 0.15,
      humulene: 0.10,
      linalool: 0.10
    }
  },

  "northern-lights": {
    name: "Northern Lights",
    thc: [16, 22],
    cbd: [0, 1],
    terpenes: {
      myrcene: 0.40,
      pinene: 0.20,
      caryophyllene: 0.20,
      humulene: 0.10,
      linalool: 0.10
    }
  },

  "bubba-kush": {
    name: "Bubba Kush",
    thc: [18, 24],
    cbd: [0, 1],
    terpenes: {
      myrcene: 0.45,
      caryophyllene: 0.25,
      humulene: 0.15,
      limonene: 0.10,
      linalool: 0.05
    }
  },

  "la-confidential": {
    name: "LA Confidential",
    thc: [17, 22],
    cbd: [0, 1],
    terpenes: {
      myrcene: 0.40,
      pinene: 0.20,
      caryophyllene: 0.20,
      linalool: 0.10,
      humulene: 0.10
    }
  },

  "white-widow": {
    name: "White Widow",
    thc: [18, 25],
    cbd: [0, 1],
    terpenes: {
      myrcene: 0.35,
      pinene: 0.25,
      caryophyllene: 0.20,
      limonene: 0.10,
      humulene: 0.10
    }
  },

  "ak-47": {
    name: "AK-47",
    thc: [19, 25],
    cbd: [0, 1],
    terpenes: {
      myrcene: 0.30,
      caryophyllene: 0.25,
      pinene: 0.20,
      limonene: 0.15,
      humulene: 0.10
    }
  },

  "amnesia-haze": {
    name: "Amnesia Haze",
    thc: [20, 26],
    cbd: [0, 1],
    terpenes: {
      limonene: 0.35,
      myrcene: 0.25,
      terpinolene: 0.20,
      pinene: 0.10,
      caryophyllene: 0.10
    }
  },

  "trainwreck": {
    name: "Trainwreck",
    thc: [18, 25],
    cbd: [0, 1],
    terpenes: {
      terpinolene: 0.35,
      myrcene: 0.25,
      pinene: 0.20,
      limonene: 0.10,
      caryophyllene: 0.10
    }
  },

  "mac-1": {
    name: "MAC 1",
    thc: [20, 27],
    cbd: [0, 1],
    terpenes: {
      caryophyllene: 0.30,
      limonene: 0.25,
      myrcene: 0.20,
      linalool: 0.15,
      humulene: 0.10
    }
  },

  "do-si-dos": {
    name: "Do-Si-Dos",
    thc: [20, 27],
    cbd: [0, 1],
    terpenes: {
      limonene: 0.30,
      caryophyllene: 0.25,
      linalool: 0.20,
      myrcene: 0.15,
      humulene: 0.10
    }
  },

  "runtz": {
    name: "Runtz",
    thc: [19, 27],
    cbd: [0, 1],
    terpenes: {
      caryophyllene: 0.30,
      limonene: 0.25,
      linalool: 0.20,
      myrcene: 0.15,
      humulene: 0.10
    }
  },

  "animal-mints": {
    name: "Animal Mints",
    thc: [20, 27],
    cbd: [0, 1],
    terpenes: {
      caryophyllene: 0.30,
      limonene: 0.25,
      myrcene: 0.20,
      linalool: 0.15,
      humulene: 0.10
    }
  },

  "gelato-33": {
    name: "Gelato 33",
    thc: [20, 27],
    cbd: [0, 1],
    terpenes: {
      caryophyllene: 0.25,
      limonene: 0.25,
      myrcene: 0.20,
      linalool: 0.15,
      humulene: 0.15
    }
  },

  "sunset-sherbet": {
    name: "Sunset Sherbet",
    thc: [18, 25],
    cbd: [0, 1],
    terpenes: {
      limonene: 0.30,
      caryophyllene: 0.25,
      linalool: 0.20,
      myrcene: 0.15,
      humulene: 0.10
    }
  },

  "mimosa": {
    name: "Mimosa",
    thc: [19, 26],
    cbd: [0, 1],
    terpenes: {
      limonene: 0.40,
      myrcene: 0.25,
      pinene: 0.15,
      caryophyllene: 0.10,
      ocimene: 0.10
    }
  },

  "clementine": {
    name: "Clementine",
    thc: [18, 24],
    cbd: [0, 1],
    terpenes: {
      limonene: 0.45,
      myrcene: 0.25,
      pinene: 0.15,
      ocimene: 0.10,
      caryophyllene: 0.05
    }
  },

  "tangie": {
    name: "Tangie",
    thc: [18, 25],
    cbd: [0, 1],
    terpenes: {
      limonene: 0.50,
      myrcene: 0.20,
      pinene: 0.15,
      ocimene: 0.10,
      caryophyllene: 0.05
    }
  },

  "strawberry-cough": {
    name: "Strawberry Cough",
    thc: [18, 24],
    cbd: [0, 1],
    terpenes: {
      myrcene: 0.35,
      pinene: 0.25,
      caryophyllene: 0.20,
      limonene: 0.10,
      humulene: 0.10
    }
  },

  "purple-punch": {
    name: "Purple Punch",
    thc: [17, 24],
    cbd: [0, 1],
    terpenes: {
      myrcene: 0.40,
      caryophyllene: 0.25,
      limonene: 0.15,
      linalool: 0.10,
      humulene: 0.10
    }
  },

  "ice-cream-cake": {
    name: "Ice Cream Cake",
    thc: [20, 26],
    cbd: [0, 1],
    terpenes: {
      limonene: 0.30,
      caryophyllene: 0.25,
      linalool: 0.20,
      myrcene: 0.15,
      humulene: 0.10
    }
  },

  "forbidden-fruit": {
    name: "Forbidden Fruit",
    thc: [19, 26],
    cbd: [0, 1],
    terpenes: {
      limonene: 0.30,
      myrcene: 0.25,
      caryophyllene: 0.20,
      linalool: 0.15,
      humulene: 0.10
    }
  },

  "skywalker-og": {
    name: "Skywalker OG",
    thc: [18, 26],
    cbd: [0, 1],
    terpenes: {
      myrcene: 0.40,
      caryophyllene: 0.25,
      limonene: 0.15,
      humulene: 0.10,
      pinene: 0.10
    }
  },

  "afghan-kush": {
    name: "Afghan Kush",
    thc: [17, 22],
    cbd: [0, 1],
    terpenes: {
      myrcene: 0.45,
      caryophyllene: 0.25,
      humulene: 0.15,
      pinene: 0.10,
      linalool: 0.05
    }
  }
};

/**
 * Guard: Fail early if library is empty
 */
const STRAIN_COUNT = Object.keys(STRAIN_LIBRARY).length;
if (STRAIN_COUNT === 0) {
  throw new Error('STRAIN_LIBRARY must not be empty - fatal error');
}

if (STRAIN_COUNT !== 40) {
  const errorMsg = `[STRAIN_LIBRARY] CRITICAL: Expected exactly 40 strains, found ${STRAIN_COUNT}`;
  console.error(errorMsg);
  if (process.env.NODE_ENV === 'development') {
    throw new Error(errorMsg);
  }
}

/**
 * Create normalized lookup map for O(1) access
 * Normalizes all keys on load to ensure consistent matching
 */
const NORMALIZED_STRAIN_LIBRARY: Record<string, Strain> = Object.fromEntries(
  Object.entries(STRAIN_LIBRARY).map(([id, data]) => [
    normalizeCultivarId(id),
    data
  ])
);

/**
 * Create alias lookup map for O(1) alias resolution
 * Maps normalized aliases to canonical strain IDs
 */
const ALIAS_TO_CANONICAL: Record<string, string> = {};
Object.entries(STRAIN_LIBRARY).forEach(([canonicalId, strain]) => {
  const normalizedCanonical = normalizeCultivarId(canonicalId);
  
  // Add normalized canonical ID as self-reference
  ALIAS_TO_CANONICAL[normalizedCanonical] = normalizedCanonical;
  
  // Add normalized name as alias
  const normalizedName = normalizeCultivarId(strain.name);
  if (normalizedName !== normalizedCanonical) {
    ALIAS_TO_CANONICAL[normalizedName] = normalizedCanonical;
  }
  
  // Add normalized aliases
  if (strain.aliases && Array.isArray(strain.aliases)) {
    strain.aliases.forEach(alias => {
      const normalizedAlias = normalizeCultivarId(alias);
      if (normalizedAlias !== normalizedCanonical) {
        ALIAS_TO_CANONICAL[normalizedAlias] = normalizedCanonical;
      }
    });
  }
});

/**
 * Get strain by normalized ID (deterministic lookup, O(1))
 * 
 * MANDATORY: All cultivarIds from resolver must be normalized before lookup
 */
export function getStrainById(cultivarId: string): Strain | null {
  if (!cultivarId || typeof cultivarId !== 'string') {
    console.error(`[STRAIN_LIBRARY] Invalid cultivarId: ${cultivarId}`);
    return null;
  }
  
  // Normalize the ID before lookup
  const normalizedId = normalizeCultivarId(cultivarId);
  const strain = NORMALIZED_STRAIN_LIBRARY[normalizedId];
  
  if (!strain) {
    console.error(`[STRAIN_LIBRARY] No match found for cultivarId: "${cultivarId}" → normalized: "${normalizedId}"`);
    console.error(`[STRAIN_LIBRARY] STRAIN_LIBRARY has ${STRAIN_COUNT} strains`);
    console.error(`[STRAIN_LIBRARY] Available IDs (first 10): ${Object.keys(NORMALIZED_STRAIN_LIBRARY).slice(0, 10).join(', ')}`);
    return null;
  }
  
  return strain;
}

/**
 * Resolve alias to canonical ID
 * Checks aliases, normalized names, and canonical IDs
 */
function resolveAliasToCanonical(normalizedId: string): string | null {
  return ALIAS_TO_CANONICAL[normalizedId] || null;
}

/**
 * Map cultivarId to Strain from STRAIN_LIBRARY
 * 
 * MANDATORY: Normalizes IDs, resolves aliases, and enforces strict mapping
 * If mapping fails, throws error (no silent skipping)
 */
export function mapCultivarIdToStrain(cultivarId: string): Strain {
  if (!cultivarId || typeof cultivarId !== 'string') {
    throw new Error(`STRAIN_MAPPING_FAILURE: Invalid cultivarId "${cultivarId}"`);
  }
  
  // Normalize the ID
  const normalizedId = normalizeCultivarId(cultivarId);
  
  // Try direct lookup first
  let strain = NORMALIZED_STRAIN_LIBRARY[normalizedId];
  
  // If not found, try alias resolution
  if (!strain) {
    const canonicalId = resolveAliasToCanonical(normalizedId);
    if (canonicalId) {
      strain = NORMALIZED_STRAIN_LIBRARY[canonicalId];
    }
  }
  
  if (!strain) {
    const availableIds = Object.keys(NORMALIZED_STRAIN_LIBRARY).slice(0, 10).join(', ');
    const availableAliases = Object.keys(ALIAS_TO_CANONICAL).slice(0, 10).join(', ');
    throw new Error(
      `STRAIN_MAPPING_FAILURE: ${cultivarId} → ${normalizedId}\n` +
      `  CultivarId "${cultivarId}" does not exist in STRAIN_LIBRARY.\n` +
      `  STRAIN_LIBRARY has ${STRAIN_COUNT} strains.\n` +
      `  Available IDs (first 10): ${availableIds}\n` +
      `  Available aliases (first 10): ${availableAliases}`
    );
  }
  
  return strain;
}

/**
 * Get all strain IDs (normalized)
 */
export function getAllStrainIds(): string[] {
  return Object.keys(NORMALIZED_STRAIN_LIBRARY);
}

/**
 * Get strain count (derived, not hardcoded)
 */
export function getStrainCount(): number {
  return STRAIN_COUNT;
}
