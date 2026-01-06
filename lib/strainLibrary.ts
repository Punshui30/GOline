/**
 * Canonical Strain Library
 * 
 * Authoritative source for strain-to-chemistry mapping.
 * ALL strain scoring and selection comes exclusively from this library.
 * No hardcoded strain names exist anywhere else.
 * No fallback strains are allowed.
 */

export interface Strain {
  id: string;
  name: string;
  thcPercent: number;
  cbdPercent: number;
  terpenes: {
    limonene: number;
    myrcene: number;
    pinene: number;
    linalool: number;
    caryophyllene: number;
    terpinolene: number;
  };
}

export const STRAIN_LIBRARY: Strain[] = [
  {
    id: "blue-dream",
    name: "Blue Dream",
    thcPercent: 18.5,
    cbdPercent: 0.1,
    terpenes: { limonene: 0.22, myrcene: 0.65, pinene: 0.32, linalool: 0.05, caryophyllene: 0.28, terpinolene: 0.12 }
  },
  {
    id: "jack-herer",
    name: "Jack Herer",
    thcPercent: 19.8,
    cbdPercent: 0.05,
    terpenes: { limonene: 0.20, myrcene: 0.18, pinene: 0.38, linalool: 0.03, caryophyllene: 0.22, terpinolene: 0.45 }
  },
  {
    id: "durban-poison",
    name: "Durban Poison",
    thcPercent: 21.0,
    cbdPercent: 0.02,
    terpenes: { limonene: 0.18, myrcene: 0.12, pinene: 0.41, linalool: 0.02, caryophyllene: 0.15, terpinolene: 0.62 }
  },
  {
    id: "sour-diesel",
    name: "Sour Diesel",
    thcPercent: 20.2,
    cbdPercent: 0.04,
    terpenes: { limonene: 0.42, myrcene: 0.28, pinene: 0.21, linalool: 0.04, caryophyllene: 0.31, terpinolene: 0.10 }
  },
  {
    id: "og-kush",
    name: "OG Kush",
    thcPercent: 22.5,
    cbdPercent: 0.05,
    terpenes: { limonene: 0.33, myrcene: 0.55, pinene: 0.18, linalool: 0.06, caryophyllene: 0.29, terpinolene: 0.04 }
  },
  {
    id: "girl-scout-cookies",
    name: "Girl Scout Cookies",
    thcPercent: 21.3,
    cbdPercent: 0.07,
    terpenes: { limonene: 0.36, myrcene: 0.31, pinene: 0.14, linalool: 0.12, caryophyllene: 0.48, terpinolene: 0.05 }
  },
  {
    id: "gelato",
    name: "Gelato",
    thcPercent: 20.9,
    cbdPercent: 0.04,
    terpenes: { limonene: 0.39, myrcene: 0.26, pinene: 0.12, linalool: 0.11, caryophyllene: 0.44, terpinolene: 0.03 }
  },
  {
    id: "wedding-cake",
    name: "Wedding Cake",
    thcPercent: 23.0,
    cbdPercent: 0.06,
    terpenes: { limonene: 0.35, myrcene: 0.29, pinene: 0.10, linalool: 0.14, caryophyllene: 0.51, terpinolene: 0.02 }
  },
  {
    id: "zkittlez",
    name: "Zkittlez",
    thcPercent: 19.5,
    cbdPercent: 0.08,
    terpenes: { limonene: 0.30, myrcene: 0.22, pinene: 0.09, linalool: 0.18, caryophyllene: 0.43, terpinolene: 0.00 }
  },
  {
    id: "pineapple-express",
    name: "Pineapple Express",
    thcPercent: 18.9,
    cbdPercent: 0.03,
    terpenes: { limonene: 0.47, myrcene: 0.25, pinene: 0.34, linalool: 0.03, caryophyllene: 0.19, terpinolene: 0.16 }
  },
  {
    id: "green-crack",
    name: "Green Crack",
    thcPercent: 21.7,
    cbdPercent: 0.02,
    terpenes: { limonene: 0.26, myrcene: 0.62, pinene: 0.29, linalool: 0.02, caryophyllene: 0.20, terpinolene: 0.14 }
  },
  {
    id: "super-lemon-haze",
    name: "Super Lemon Haze",
    thcPercent: 22.1,
    cbdPercent: 0.04,
    terpenes: { limonene: 0.58, myrcene: 0.19, pinene: 0.27, linalool: 0.03, caryophyllene: 0.16, terpinolene: 0.33 }
  },
  {
    id: "granddaddy-purple",
    name: "Granddaddy Purple",
    thcPercent: 17.8,
    cbdPercent: 0.1,
    terpenes: { limonene: 0.12, myrcene: 0.74, pinene: 0.18, linalool: 0.21, caryophyllene: 0.26, terpinolene: 0.02 }
  },
  {
    id: "northern-lights",
    name: "Northern Lights",
    thcPercent: 18.2,
    cbdPercent: 0.08,
    terpenes: { limonene: 0.14, myrcene: 0.68, pinene: 0.24, linalool: 0.17, caryophyllene: 0.22, terpinolene: 0.03 }
  },
  {
    id: "bubba-kush",
    name: "Bubba Kush",
    thcPercent: 19.1,
    cbdPercent: 0.06,
    terpenes: { limonene: 0.11, myrcene: 0.71, pinene: 0.15, linalool: 0.20, caryophyllene: 0.30, terpinolene: 0.01 }
  },
  {
    id: "la-confidential",
    name: "LA Confidential",
    thcPercent: 20.0,
    cbdPercent: 0.05,
    terpenes: { limonene: 0.10, myrcene: 0.69, pinene: 0.17, linalool: 0.19, caryophyllene: 0.33, terpinolene: 0.02 }
  },
  {
    id: "white-widow",
    name: "White Widow",
    thcPercent: 19.4,
    cbdPercent: 0.06,
    terpenes: { limonene: 0.21, myrcene: 0.47, pinene: 0.31, linalool: 0.08, caryophyllene: 0.28, terpinolene: 0.09 }
  },
  {
    id: "ak-47",
    name: "AK-47",
    thcPercent: 20.6,
    cbdPercent: 0.05,
    terpenes: { limonene: 0.19, myrcene: 0.51, pinene: 0.33, linalool: 0.04, caryophyllene: 0.24, terpinolene: 0.11 }
  },
  {
    id: "amnesia-haze",
    name: "Amnesia Haze",
    thcPercent: 21.8,
    cbdPercent: 0.03,
    terpenes: { limonene: 0.49, myrcene: 0.18, pinene: 0.30, linalool: 0.03, caryophyllene: 0.17, terpinolene: 0.41 }
  },
  {
    id: "trainwreck",
    name: "Trainwreck",
    thcPercent: 19.9,
    cbdPercent: 0.04,
    terpenes: { limonene: 0.23, myrcene: 0.29, pinene: 0.36, linalool: 0.04, caryophyllene: 0.20, terpinolene: 0.44 }
  },
  {
    id: "mac-1",
    name: "MAC 1",
    thcPercent: 22.0,
    cbdPercent: 0.04,
    terpenes: { limonene: 0.34, myrcene: 0.27, pinene: 0.16, linalool: 0.10, caryophyllene: 0.46, terpinolene: 0.03 }
  },
  {
    id: "do-si-dos",
    name: "Do-Si-Dos",
    thcPercent: 23.4,
    cbdPercent: 0.05,
    terpenes: { limonene: 0.32, myrcene: 0.30, pinene: 0.09, linalool: 0.15, caryophyllene: 0.53, terpinolene: 0.02 }
  },
  {
    id: "runtz",
    name: "Runtz",
    thcPercent: 21.2,
    cbdPercent: 0.06,
    terpenes: { limonene: 0.37, myrcene: 0.24, pinene: 0.11, linalool: 0.16, caryophyllene: 0.41, terpinolene: 0.03 }
  },
  {
    id: "animal-mints",
    name: "Animal Mints",
    thcPercent: 22.7,
    cbdPercent: 0.04,
    terpenes: { limonene: 0.33, myrcene: 0.26, pinene: 0.10, linalool: 0.14, caryophyllene: 0.49, terpinolene: 0.02 }
  },
  {
    id: "gelato-33",
    name: "Gelato 33",
    thcPercent: 20.8,
    cbdPercent: 0.05,
    terpenes: { limonene: 0.36, myrcene: 0.28, pinene: 0.11, linalool: 0.12, caryophyllene: 0.45, terpinolene: 0.03 }
  },
  {
    id: "sunset-sherbet",
    name: "Sunset Sherbet",
    thcPercent: 19.7,
    cbdPercent: 0.06,
    terpenes: { limonene: 0.38, myrcene: 0.27, pinene: 0.12, linalool: 0.13, caryophyllene: 0.42, terpinolene: 0.04 }
  },
  {
    id: "mimosa",
    name: "Mimosa",
    thcPercent: 21.5,
    cbdPercent: 0.03,
    terpenes: { limonene: 0.56, myrcene: 0.22, pinene: 0.29, linalool: 0.02, caryophyllene: 0.19, terpinolene: 0.17 }
  },
  {
    id: "clementine",
    name: "Clementine",
    thcPercent: 20.4,
    cbdPercent: 0.04,
    terpenes: { limonene: 0.59, myrcene: 0.21, pinene: 0.31, linalool: 0.02, caryophyllene: 0.16, terpinolene: 0.18 }
  },
  {
    id: "tangie",
    name: "Tangie",
    thcPercent: 19.3,
    cbdPercent: 0.05,
    terpenes: { limonene: 0.62, myrcene: 0.23, pinene: 0.28, linalool: 0.02, caryophyllene: 0.15, terpinolene: 0.19 }
  },
  {
    id: "strawberry-cough",
    name: "Strawberry Cough",
    thcPercent: 18.7,
    cbdPercent: 0.06,
    terpenes: { limonene: 0.25, myrcene: 0.31, pinene: 0.42, linalool: 0.03, caryophyllene: 0.18, terpinolene: 0.14 }
  },
  {
    id: "purple-punch",
    name: "Purple Punch",
    thcPercent: 20.1,
    cbdPercent: 0.08,
    terpenes: { limonene: 0.11, myrcene: 0.76, pinene: 0.14, linalool: 0.22, caryophyllene: 0.29, terpinolene: 0.01 }
  },
  {
    id: "ice-cream-cake",
    name: "Ice Cream Cake",
    thcPercent: 22.3,
    cbdPercent: 0.05,
    terpenes: { limonene: 0.31, myrcene: 0.34, pinene: 0.09, linalool: 0.16, caryophyllene: 0.50, terpinolene: 0.01 }
  },
  {
    id: "forbidden-fruit",
    name: "Forbidden Fruit",
    thcPercent: 19.6,
    cbdPercent: 0.07,
    terpenes: { limonene: 0.18, myrcene: 0.63, pinene: 0.13, linalool: 0.24, caryophyllene: 0.27, terpinolene: 0.02 }
  },
  {
    id: "skywalker-og",
    name: "Skywalker OG",
    thcPercent: 21.9,
    cbdPercent: 0.05,
    terpenes: { limonene: 0.14, myrcene: 0.61, pinene: 0.16, linalool: 0.19, caryophyllene: 0.35, terpinolene: 0.01 }
  },
  {
    id: "afghan-kush",
    name: "Afghan Kush",
    thcPercent: 17.5,
    cbdPercent: 0.12,
    terpenes: { limonene: 0.09, myrcene: 0.79, pinene: 0.11, linalool: 0.23, caryophyllene: 0.32, terpinolene: 0.00 }
  }
];

/**
 * Guard: Fail early if library is empty
 */
if (STRAIN_LIBRARY.length === 0) {
  throw new Error('STRAIN_LIBRARY must not be empty - fatal error');
}

/**
 * Create a lookup map for O(1) access by ID
 * This ensures deterministic, fast mapping
 */
const STRAIN_BY_ID_MAP = new Map<string, Strain>();
const STRAIN_BY_NAME_MAP = new Map<string, Strain>();

STRAIN_LIBRARY.forEach(strain => {
  // Map by ID
  STRAIN_BY_ID_MAP.set(strain.id, strain);
  
  // Map by normalized name (for fallback matching)
  const normalizedName = strain.name.toLowerCase().replace(/\s+/g, '-');
  if (!STRAIN_BY_NAME_MAP.has(normalizedName)) {
    STRAIN_BY_NAME_MAP.set(normalizedName, strain);
  }
});

/**
 * Get strain by ID (deterministic lookup, O(1) via map)
 */
export function getStrainById(id: string): Strain | null {
  if (!id || typeof id !== 'string') return null;
  return STRAIN_BY_ID_MAP.get(id) || null;
}

/**
 * Get strain by index (deterministic, index-based mapping)
 * Used for mapping numeric chemistry results to named strains
 */
export function getStrainByIndex(index: number): Strain | null {
  if (index < 0 || index >= STRAIN_LIBRARY.length) {
    return null;
  }
  return STRAIN_LIBRARY[index];
}

/**
 * Find strain by matching cultivarId (deterministic, index-based)
 * Maps cultivarId from resolver to strain library
 * 
 * Resolver outputs cultivarId in format: "blue-dream", "jack-herer", etc.
 * This matches STRAIN_LIBRARY.id format exactly (no "strain-" prefix)
 */
export function mapCultivarIdToStrain(cultivarId: string): Strain | null {
  if (!cultivarId || typeof cultivarId !== 'string') {
    console.error(`[STRAIN_LIBRARY] Invalid cultivarId: ${cultivarId}`);
    return null;
  }
  
  // Direct ID match (deterministic - no heuristics)
  const byId = getStrainById(cultivarId);
  if (byId) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[STRAIN_LIBRARY] Direct match: "${cultivarId}" -> "${byId.name}"`);
    }
    return byId;
  }
  
  // If cultivarId has "strain-" prefix (legacy format), remove it and try again
  const idWithoutPrefix = cultivarId.replace(/^strain-/, '');
  if (idWithoutPrefix !== cultivarId) {
    const byIdWithoutPrefix = getStrainById(idWithoutPrefix);
    if (byIdWithoutPrefix) {
      if (process.env.NODE_ENV === 'development') {
        console.debug(`[STRAIN_LIBRARY] Matched after removing prefix: "${cultivarId}" -> "${byIdWithoutPrefix.name}"`);
      }
      return byIdWithoutPrefix;
    }
  }
  
  // Normalize and try deterministic pattern matching (not heuristic)
  const normalizedId = cultivarId.toLowerCase().replace(/\s+/g, '-').replace(/^strain-/, '');
  
  // Try normalized ID lookup
  let byNormalized = STRAIN_BY_ID_MAP.get(normalizedId);
  
  // Try without prefix if different
  if (!byNormalized && idWithoutPrefix !== normalizedId) {
    byNormalized = STRAIN_BY_ID_MAP.get(idWithoutPrefix);
  }
  
  // Try by normalized name as last resort
  if (!byNormalized) {
    byNormalized = STRAIN_BY_NAME_MAP.get(normalizedId);
  }
  
  if (byNormalized && process.env.NODE_ENV === 'development') {
    console.debug(`[STRAIN_LIBRARY] Matched via normalization: "${cultivarId}" -> "${byNormalized.name}"`);
  }
  
  if (!byNormalized) {
    console.error(`[STRAIN_LIBRARY] No match found for cultivarId: "${cultivarId}"`);
    console.error(`[STRAIN_LIBRARY] Tried: direct="${cultivarId}", withoutPrefix="${idWithoutPrefix}", normalized="${normalizedId}"`);
    console.error(`[STRAIN_LIBRARY] Available IDs (first 10): ${Array.from(STRAIN_BY_ID_MAP.keys()).slice(0, 10).join(', ')}`);
  }
  
  return byNormalized || null;
}

