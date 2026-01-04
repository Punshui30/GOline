/**
 * These profiles represent commonly reported terpene distributions aggregated from public lab data.
 * They are used only for prototype demonstration.
 * Live GO systems operate exclusively on QR-verified batch data.
 */

/**
 * Chemical vector representation of a cultivar/batch
 * All calculations operate on ratios and distributions, never presence alone
 */
export interface CanonicalCultivar {
  id: string;
  displayName: string;
  cannabinoids: {
    THC: number;
    CBD?: number;
    [minor: string]: number | undefined;
  };
  terpenes: {
    [terpene: string]: number; // Normalized percentage (0-1) of total terpene profile
  };
  totalTerpeneLoad: number; // Total terpene percentage by weight (typically 1-4%)
  dataConfidence: "canonical";
}

/**
 * Reference cultivar profiles based on commonly observed terpene distributions.
 * Terpene values are normalized percentages (0-1) of total terpene profile.
 */
export const canonicalCultivars: CanonicalCultivar[] = [
  {
    id: "ref-blue-dream",
    displayName: "Blue Dream (Reference)",
    cannabinoids: {
      THC: 18.5,
      CBD: 0.2,
    },
    terpenes: {
      myrcene: 0.35,
      pinene: 0.12,
      limonene: 0.18,
      caryophyllene: 0.15,
      linalool: 0.08,
      humulene: 0.07,
      terpinolene: 0.03,
      ocimene: 0.02,
    },
    totalTerpeneLoad: 2.1,
    dataConfidence: "canonical",
  },
  {
    id: "ref-sour-diesel",
    displayName: "Sour Diesel (Reference)",
    cannabinoids: {
      THC: 21.2,
      CBD: 0.1,
    },
    terpenes: {
      myrcene: 0.18,
      pinene: 0.22,
      limonene: 0.28,
      caryophyllene: 0.12,
      linalool: 0.05,
      humulene: 0.08,
      terpinolene: 0.04,
      ocimene: 0.03,
    },
    totalTerpeneLoad: 2.4,
    dataConfidence: "canonical",
  },
  {
    id: "ref-girl-scout-cookies",
    displayName: "Girl Scout Cookies (Reference)",
    cannabinoids: {
      THC: 19.8,
      CBD: 0.15,
    },
    terpenes: {
      myrcene: 0.22,
      pinene: 0.10,
      limonene: 0.15,
      caryophyllene: 0.25,
      linalool: 0.12,
      humulene: 0.10,
      terpinolene: 0.04,
      ocimene: 0.02,
    },
    totalTerpeneLoad: 2.2,
    dataConfidence: "canonical",
  },
  {
    id: "ref-lavender",
    displayName: "Lavender (Reference)",
    cannabinoids: {
      THC: 16.5,
      CBD: 0.3,
    },
    terpenes: {
      myrcene: 0.20,
      pinene: 0.08,
      limonene: 0.12,
      caryophyllene: 0.15,
      linalool: 0.28,
      humulene: 0.10,
      terpinolene: 0.04,
      ocimene: 0.03,
    },
    totalTerpeneLoad: 1.9,
    dataConfidence: "canonical",
  },
  {
    id: "ref-jack-herer",
    displayName: "Jack Herer (Reference)",
    cannabinoids: {
      THC: 20.1,
      CBD: 0.1,
    },
    terpenes: {
      myrcene: 0.15,
      pinene: 0.28,
      limonene: 0.25,
      caryophyllene: 0.12,
      linalool: 0.08,
      humulene: 0.07,
      terpinolene: 0.03,
      ocimene: 0.02,
    },
    totalTerpeneLoad: 2.6,
    dataConfidence: "canonical",
  },
  {
    id: "ref-northern-lights",
    displayName: "Northern Lights (Reference)",
    cannabinoids: {
      THC: 17.3,
      CBD: 0.2,
    },
    terpenes: {
      myrcene: 0.24,
      pinene: 0.14,
      limonene: 0.16,
      caryophyllene: 0.18,
      linalool: 0.12,
      humulene: 0.10,
      terpinolene: 0.04,
      ocimene: 0.02,
    },
    totalTerpeneLoad: 2.0,
    dataConfidence: "canonical",
  },
  {
    id: "ref-durban-poison",
    displayName: "Durban Poison (Reference)",
    cannabinoids: {
      THC: 22.4,
      CBD: 0.05,
    },
    terpenes: {
      myrcene: 0.10,
      pinene: 0.18,
      limonene: 0.20,
      caryophyllene: 0.12,
      linalool: 0.05,
      humulene: 0.08,
      terpinolene: 0.22,
      ocimene: 0.05,
    },
    totalTerpeneLoad: 2.8,
    dataConfidence: "canonical",
  },
  {
    id: "ref-granddaddy-purple",
    displayName: "Granddaddy Purple (Reference)",
    cannabinoids: {
      THC: 18.7,
      CBD: 0.2,
    },
    terpenes: {
      myrcene: 0.32,
      pinene: 0.10,
      limonene: 0.12,
      caryophyllene: 0.18,
      linalool: 0.20,
      humulene: 0.05,
      terpinolene: 0.02,
      ocimene: 0.01,
    },
    totalTerpeneLoad: 2.1,
    dataConfidence: "canonical",
  },
  {
    id: "ref-og-kush",
    displayName: "OG Kush (Reference)",
    cannabinoids: {
      THC: 19.5,
      CBD: 0.15,
    },
    terpenes: {
      myrcene: 0.20,
      pinene: 0.14,
      limonene: 0.18,
      caryophyllene: 0.22,
      linalool: 0.10,
      humulene: 0.11,
      terpinolene: 0.03,
      ocimene: 0.02,
    },
    totalTerpeneLoad: 2.3,
    dataConfidence: "canonical",
  },
  {
    id: "ref-white-widow",
    displayName: "White Widow (Reference)",
    cannabinoids: {
      THC: 18.9,
      CBD: 0.2,
    },
    terpenes: {
      myrcene: 0.22,
      pinene: 0.20,
      limonene: 0.18,
      caryophyllene: 0.16,
      linalool: 0.12,
      humulene: 0.08,
      terpinolene: 0.03,
      ocimene: 0.01,
    },
    totalTerpeneLoad: 2.0,
    dataConfidence: "canonical",
  },
  // CBD-dominant cultivars for corrective blending
  {
    id: "ref-cbd-harlequin",
    displayName: "CBD Harlequin (Reference)",
    cannabinoids: {
      THC: 6.5,
      CBD: 10.2,
    },
    terpenes: {
      myrcene: 0.18,
      pinene: 0.22,
      limonene: 0.20,
      caryophyllene: 0.18,
      linalool: 0.12,
      humulene: 0.08,
      terpinolene: 0.01,
      ocimene: 0.01,
    },
    totalTerpeneLoad: 1.8,
    dataConfidence: "canonical",
  },
  {
    id: "ref-cbd-acdc",
    displayName: "CBD ACDC (Reference)",
    cannabinoids: {
      THC: 1.2,
      CBD: 18.5,
    },
    terpenes: {
      myrcene: 0.15,
      pinene: 0.20,
      limonene: 0.25,
      caryophyllene: 0.20,
      linalool: 0.12,
      humulene: 0.06,
      terpinolene: 0.01,
      ocimene: 0.01,
    },
    totalTerpeneLoad: 1.6,
    dataConfidence: "canonical",
  },
  // CBG-dominant cultivar for corrective blending
  {
    id: "ref-cbg-white",
    displayName: "CBG White (Reference)",
    cannabinoids: {
      THC: 0.8,
      CBG: 15.3,
      CBD: 1.2,
    },
    terpenes: {
      myrcene: 0.16,
      pinene: 0.24,
      limonene: 0.22,
      caryophyllene: 0.18,
      linalool: 0.10,
      humulene: 0.07,
      terpinolene: 0.02,
      ocimene: 0.01,
    },
    totalTerpeneLoad: 1.7,
    dataConfidence: "canonical",
  },
];
