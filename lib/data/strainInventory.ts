// lib/data/strainInventory.ts
// Canonical v1 strain inventory for GO Line
// Percentages represent common lab-reported averages (not max claims)

import { type CanonicalChemotype } from '@/data/canonicalChemotypes';

export interface StrainInventoryItem {
  name: string;
  thc: number;
  cbd: number;
  terpenes: {
    myrcene?: number;
    limonene?: number;
    pinene?: number;
    linalool?: number;
    caryophyllene?: number;
    humulene?: number;
    terpinolene?: number;
  };
}

export const STRAIN_INVENTORY: StrainInventoryItem[] = [
  {
    name: "Blue Dream",
    thc: 18.5,
    cbd: 0.1,
    terpenes: { myrcene: 0.65, pinene: 0.32, caryophyllene: 0.28, limonene: 0.22, linalool: 0.05, terpinolene: 0.12 }
  },
  {
    name: "Jack Herer",
    thc: 19.8,
    cbd: 0.05,
    terpenes: { terpinolene: 0.45, pinene: 0.38, caryophyllene: 0.22, myrcene: 0.18, limonene: 0.20, linalool: 0.03 }
  },
  {
    name: "Durban Poison",
    thc: 21.0,
    cbd: 0.02,
    terpenes: { terpinolene: 0.62, pinene: 0.41, myrcene: 0.12, limonene: 0.18, caryophyllene: 0.15, linalool: 0.02 }
  },
  {
    name: "Sour Diesel",
    thc: 20.2,
    cbd: 0.04,
    terpenes: { limonene: 0.42, caryophyllene: 0.31, myrcene: 0.28, pinene: 0.21, terpinolene: 0.10, linalool: 0.04 }
  },
  {
    name: "OG Kush",
    thc: 22.5,
    cbd: 0.05,
    terpenes: { myrcene: 0.55, limonene: 0.33, caryophyllene: 0.29, pinene: 0.18, linalool: 0.06, terpinolene: 0.04 }
  },
  {
    name: "Girl Scout Cookies",
    thc: 21.3,
    cbd: 0.07,
    terpenes: { caryophyllene: 0.48, limonene: 0.36, myrcene: 0.31, linalool: 0.12, pinene: 0.14, terpinolene: 0.05 }
  },
  {
    name: "Gelato",
    thc: 20.9,
    cbd: 0.04,
    terpenes: { caryophyllene: 0.44, limonene: 0.39, myrcene: 0.26, linalool: 0.11, pinene: 0.12, terpinolene: 0.03 }
  },
  {
    name: "Wedding Cake",
    thc: 23.0,
    cbd: 0.06,
    terpenes: { caryophyllene: 0.51, limonene: 0.35, myrcene: 0.29, linalool: 0.14, pinene: 0.10, terpinolene: 0.02 }
  },
  {
    name: "Zkittlez",
    thc: 19.5,
    cbd: 0.08,
    terpenes: { caryophyllene: 0.43, humulene: 0.21, limonene: 0.30, linalool: 0.18, myrcene: 0.22, pinene: 0.09 }
  },
  {
    name: "Pineapple Express",
    thc: 18.9,
    cbd: 0.03,
    terpenes: { limonene: 0.47, pinene: 0.34, myrcene: 0.25, caryophyllene: 0.19, terpinolene: 0.16, linalool: 0.03 }
  },
  {
    name: "Green Crack",
    thc: 21.7,
    cbd: 0.02,
    terpenes: { myrcene: 0.62, pinene: 0.29, limonene: 0.26, caryophyllene: 0.20, terpinolene: 0.14, linalool: 0.02 }
  },
  {
    name: "Super Lemon Haze",
    thc: 22.1,
    cbd: 0.04,
    terpenes: { limonene: 0.58, terpinolene: 0.33, pinene: 0.27, myrcene: 0.19, caryophyllene: 0.16, linalool: 0.03 }
  },
  {
    name: "Granddaddy Purple",
    thc: 17.8,
    cbd: 0.1,
    terpenes: { myrcene: 0.74, pinene: 0.18, caryophyllene: 0.26, linalool: 0.21, limonene: 0.12, terpinolene: 0.02 }
  },
  {
    name: "Northern Lights",
    thc: 18.2,
    cbd: 0.08,
    terpenes: { myrcene: 0.68, pinene: 0.24, caryophyllene: 0.22, linalool: 0.17, limonene: 0.14, terpinolene: 0.03 }
  },
  {
    name: "Bubba Kush",
    thc: 19.1,
    cbd: 0.06,
    terpenes: { myrcene: 0.71, caryophyllene: 0.30, pinene: 0.15, linalool: 0.20, limonene: 0.11, terpinolene: 0.01 }
  },
  {
    name: "LA Confidential",
    thc: 20.0,
    cbd: 0.05,
    terpenes: { myrcene: 0.69, caryophyllene: 0.33, pinene: 0.17, linalool: 0.19, limonene: 0.10, terpinolene: 0.02 }
  },
  {
    name: "White Widow",
    thc: 19.4,
    cbd: 0.06,
    terpenes: { myrcene: 0.47, pinene: 0.31, caryophyllene: 0.28, limonene: 0.21, linalool: 0.08, terpinolene: 0.09 }
  },
  {
    name: "AK-47",
    thc: 20.6,
    cbd: 0.05,
    terpenes: { myrcene: 0.51, pinene: 0.33, caryophyllene: 0.24, limonene: 0.19, terpinolene: 0.11, linalool: 0.04 }
  },
  {
    name: "Amnesia Haze",
    thc: 21.8,
    cbd: 0.03,
    terpenes: { limonene: 0.49, terpinolene: 0.41, pinene: 0.30, myrcene: 0.18, caryophyllene: 0.17, linalool: 0.03 }
  },
  {
    name: "Trainwreck",
    thc: 19.9,
    cbd: 0.04,
    terpenes: { terpinolene: 0.44, pinene: 0.36, myrcene: 0.29, limonene: 0.23, caryophyllene: 0.20, linalool: 0.04 }
  },

  // --- balanced / hybrid leaning ---
  {
    name: "MAC 1",
    thc: 22.0,
    cbd: 0.04,
    terpenes: { caryophyllene: 0.46, limonene: 0.34, myrcene: 0.27, pinene: 0.16, linalool: 0.10, terpinolene: 0.03 }
  },
  {
    name: "Do-Si-Dos",
    thc: 23.4,
    cbd: 0.05,
    terpenes: { caryophyllene: 0.53, limonene: 0.32, myrcene: 0.30, linalool: 0.15, pinene: 0.09, terpinolene: 0.02 }
  },
  {
    name: "Runtz",
    thc: 21.2,
    cbd: 0.06,
    terpenes: { caryophyllene: 0.41, limonene: 0.37, linalool: 0.16, myrcene: 0.24, pinene: 0.11, terpinolene: 0.03 }
  },
  {
    name: "Animal Mints",
    thc: 22.7,
    cbd: 0.04,
    terpenes: { caryophyllene: 0.49, limonene: 0.33, myrcene: 0.26, linalool: 0.14, pinene: 0.10, terpinolene: 0.02 }
  },
  {
    name: "Gelato 33",
    thc: 20.8,
    cbd: 0.05,
    terpenes: { caryophyllene: 0.45, limonene: 0.36, myrcene: 0.28, linalool: 0.12, pinene: 0.11, terpinolene: 0.03 }
  },
  {
    name: "Sunset Sherbet",
    thc: 19.7,
    cbd: 0.06,
    terpenes: { caryophyllene: 0.42, limonene: 0.38, myrcene: 0.27, linalool: 0.13, pinene: 0.12, terpinolene: 0.04 }
  },
  {
    name: "Mimosa",
    thc: 21.5,
    cbd: 0.03,
    terpenes: { limonene: 0.56, pinene: 0.29, myrcene: 0.22, caryophyllene: 0.19, terpinolene: 0.17, linalool: 0.02 }
  },
  {
    name: "Clementine",
    thc: 20.4,
    cbd: 0.04,
    terpenes: { limonene: 0.59, pinene: 0.31, myrcene: 0.21, terpinolene: 0.18, caryophyllene: 0.16, linalool: 0.02 }
  },
  {
    name: "Tangie",
    thc: 19.3,
    cbd: 0.05,
    terpenes: { limonene: 0.62, myrcene: 0.23, pinene: 0.28, terpinolene: 0.19, caryophyllene: 0.15, linalool: 0.02 }
  },
  {
    name: "Strawberry Cough",
    thc: 18.7,
    cbd: 0.06,
    terpenes: { pinene: 0.42, myrcene: 0.31, limonene: 0.25, terpinolene: 0.14, caryophyllene: 0.18, linalool: 0.03 }
  },

  // --- calming / evening ---
  {
    name: "Purple Punch",
    thc: 20.1,
    cbd: 0.08,
    terpenes: { myrcene: 0.76, linalool: 0.22, caryophyllene: 0.29, pinene: 0.14, limonene: 0.11, terpinolene: 0.01 }
  },
  {
    name: "Ice Cream Cake",
    thc: 22.3,
    cbd: 0.05,
    terpenes: { caryophyllene: 0.50, myrcene: 0.34, limonene: 0.31, linalool: 0.16, pinene: 0.09, terpinolene: 0.01 }
  },
  {
    name: "Forbidden Fruit",
    thc: 19.6,
    cbd: 0.07,
    terpenes: { myrcene: 0.63, linalool: 0.24, caryophyllene: 0.27, limonene: 0.18, pinene: 0.13, terpinolene: 0.02 }
  },
  {
    name: "Skywalker OG",
    thc: 21.9,
    cbd: 0.05,
    terpenes: { myrcene: 0.61, caryophyllene: 0.35, pinene: 0.16, linalool: 0.19, limonene: 0.14, terpinolene: 0.01 }
  },
  {
    name: "Afghan Kush",
    thc: 17.5,
    cbd: 0.12,
    terpenes: { myrcene: 0.79, caryophyllene: 0.32, pinene: 0.11, linalool: 0.23, limonene: 0.09, terpinolene: 0.00 }
  }
];

/**
 * Convert STRAIN_INVENTORY to CanonicalChemotype format
 * This is the ONLY source of inventory data - no fallbacks, no demos
 */
export function getStrainInventoryAsChemotypes(): CanonicalChemotype[] {
  // Validation: Fail explicitly if inventory is too small
  if (STRAIN_INVENTORY.length < 10) {
    throw new Error(`STRAIN_INVENTORY must contain at least 10 strains. Found: ${STRAIN_INVENTORY.length}`);
  }

  return STRAIN_INVENTORY.map((strain, index) => {
    // Calculate total terpene load
    const terpeneValues = Object.values(strain.terpenes).filter(v => v !== undefined) as number[];
    const totalTerpeneLoad = terpeneValues.reduce((sum, val) => sum + val, 0);

    // Determine volatility based on dominant terpenes
    const hasHighVolatility = (strain.terpenes.limonene && strain.terpenes.limonene > 0.4) ||
                              (strain.terpenes.terpinolene && strain.terpenes.terpinolene > 0.4) ||
                              (strain.terpenes.pinene && strain.terpenes.pinene > 0.35);
    const volatility: "high" | "medium" | "low" = hasHighVolatility ? "high" : 
                                                    totalTerpeneLoad > 1.5 ? "medium" : "low";

    // Determine sedation risk based on myrcene and linalool
    const myrcene = strain.terpenes.myrcene || 0;
    const linalool = strain.terpenes.linalool || 0;
    const sedationRisk: "low" | "medium" | "high" = (myrcene + linalool) > 0.7 ? "high" :
                                                     (myrcene + linalool) > 0.4 ? "medium" : "low";

    // Use deterministic ID format that matches STRAIN_LIBRARY
    // Convert name to kebab-case to match library IDs (e.g., "Blue Dream" -> "blue-dream")
    const deterministicId = strain.name.toLowerCase().replace(/\s+/g, '-');
    
    return {
      id: deterministicId, // Matches STRAIN_LIBRARY.id format
      displayName: strain.name,
      description: `${strain.name} - ${strain.thc}% THC, ${strain.cbd}% CBD`,
      cannabinoids: {
        THC: strain.thc,
        CBD: strain.cbd,
      },
      terpenes: {
        myrcene: strain.terpenes.myrcene || 0,
        limonene: strain.terpenes.limonene || 0,
        pinene: strain.terpenes.pinene || 0,
        linalool: strain.terpenes.linalool || 0,
        caryophyllene: strain.terpenes.caryophyllene || 0,
        humulene: strain.terpenes.humulene || 0,
        terpinolene: strain.terpenes.terpinolene || 0,
      },
      totalTerpeneLoad,
      volatility,
      sedationRisk,
      dataConfidence: "canonical" as const,
      inventoryType: "production" as const,
    };
  });
}

