/**
 * These profiles represent commonly reported terpene distributions aggregated from public lab data.
 * They are used only for prototype demonstration.
 * Live GO systems operate exclusively on QR-verified batch data.
 */

export interface CanonicalCultivar {
  id: string;
  displayName: string;
  thcPercent: number;
  terpenePercentages: {
    [terpeneName: string]: number;
  };
  dataConfidence: "canonical";
}

/**
 * Reference cultivar profiles based on commonly observed terpene distributions.
 * Values represent percentage of total terpene profile (normalized).
 */
export const canonicalCultivars: CanonicalCultivar[] = [
  // High myrcene, moderate limonene (indica-leaning profile)
  {
    id: "ref-blue-dream",
    displayName: "Blue Dream (Reference)",
    thcPercent: 18.5,
    terpenePercentages: {
      myrcene: 0.35,
      pinene: 0.12,
      limonene: 0.18,
      caryophyllene: 0.15,
      linalool: 0.08,
      humulene: 0.07,
      terpinolene: 0.03,
      ocimene: 0.02,
    },
    dataConfidence: "canonical",
  },
  
  // High limonene, moderate pinene (sativa-leaning profile)
  {
    id: "ref-sour-diesel",
    displayName: "Sour Diesel (Reference)",
    thcPercent: 21.2,
    terpenePercentages: {
      myrcene: 0.18,
      pinene: 0.22,
      limonene: 0.28,
      caryophyllene: 0.12,
      linalool: 0.05,
      humulene: 0.08,
      terpinolene: 0.04,
      ocimene: 0.03,
    },
    dataConfidence: "canonical",
  },
  
  // High caryophyllene, balanced profile
  {
    id: "ref-girl-scout-cookies",
    displayName: "Girl Scout Cookies (Reference)",
    thcPercent: 19.8,
    terpenePercentages: {
      myrcene: 0.22,
      pinene: 0.10,
      limonene: 0.15,
      caryophyllene: 0.25,
      linalool: 0.12,
      humulene: 0.10,
      terpinolene: 0.04,
      ocimene: 0.02,
    },
    dataConfidence: "canonical",
  },
  
  // High linalool, moderate myrcene (calming profile)
  {
    id: "ref-lavender",
    displayName: "Lavender (Reference)",
    thcPercent: 16.5,
    terpenePercentages: {
      myrcene: 0.20,
      pinene: 0.08,
      limonene: 0.12,
      caryophyllene: 0.15,
      linalool: 0.28,
      humulene: 0.10,
      terpinolene: 0.04,
      ocimene: 0.03,
    },
    dataConfidence: "canonical",
  },
  
  // High pinene, high limonene (energizing profile)
  {
    id: "ref-jack-herer",
    displayName: "Jack Herer (Reference)",
    thcPercent: 20.1,
    terpenePercentages: {
      myrcene: 0.15,
      pinene: 0.28,
      limonene: 0.25,
      caryophyllene: 0.12,
      linalool: 0.08,
      humulene: 0.07,
      terpinolene: 0.03,
      ocimene: 0.02,
    },
    dataConfidence: "canonical",
  },
  
  // Balanced, moderate across the board
  {
    id: "ref-northern-lights",
    displayName: "Northern Lights (Reference)",
    thcPercent: 17.3,
    terpenePercentages: {
      myrcene: 0.24,
      pinene: 0.14,
      limonene: 0.16,
      caryophyllene: 0.18,
      linalool: 0.12,
      humulene: 0.10,
      terpinolene: 0.04,
      ocimene: 0.02,
    },
    dataConfidence: "canonical",
  },
  
  // High terpinolene (unique profile)
  {
    id: "ref-durban-poison",
    displayName: "Durban Poison (Reference)",
    thcPercent: 22.4,
    terpenePercentages: {
      myrcene: 0.10,
      pinene: 0.18,
      limonene: 0.20,
      caryophyllene: 0.12,
      linalool: 0.05,
      humulene: 0.08,
      terpinolene: 0.22,
      ocimene: 0.05,
    },
    dataConfidence: "canonical",
  },
  
  // High myrcene, high linalool (sedating profile)
  {
    id: "ref-granddaddy-purple",
    displayName: "Granddaddy Purple (Reference)",
    thcPercent: 18.7,
    terpenePercentages: {
      myrcene: 0.32,
      pinene: 0.10,
      limonene: 0.12,
      caryophyllene: 0.18,
      linalool: 0.20,
      humulene: 0.05,
      terpinolene: 0.02,
      ocimene: 0.01,
    },
    dataConfidence: "canonical",
  },
  
  // Moderate-high caryophyllene, moderate limonene
  {
    id: "ref-og-kush",
    displayName: "OG Kush (Reference)",
    thcPercent: 19.5,
    terpenePercentages: {
      myrcene: 0.20,
      pinene: 0.14,
      limonene: 0.18,
      caryophyllene: 0.22,
      linalool: 0.10,
      humulene: 0.11,
      terpinolene: 0.03,
      ocimene: 0.02,
    },
    dataConfidence: "canonical",
  },
  
  // Balanced with moderate-high pinene
  {
    id: "ref-white-widow",
    displayName: "White Widow (Reference)",
    thcPercent: 18.9,
    terpenePercentages: {
      myrcene: 0.22,
      pinene: 0.20,
      limonene: 0.18,
      caryophyllene: 0.16,
      linalool: 0.12,
      humulene: 0.08,
      terpinolene: 0.03,
      ocimene: 0.01,
    },
    dataConfidence: "canonical",
  },
];

