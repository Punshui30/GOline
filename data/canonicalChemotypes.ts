/**
 * Canonical Chemotype Profiles
 * 
 * These profiles represent common terpene + cannabinoid patterns, not brand names.
 * They can be mapped to:
 * - Strain names
 * - SKUs
 * - Batches
 * - QR-scanned lab results
 * 
 * Each chemotype describes a chemical signature optimized for specific outcome patterns.
 * 
 * GO LINE — RICH DEMO INVENTORY (CANONICAL v1 — 40 CULTIVARS)
 * 
 * Values are defensible averages compiled from lab aggregations (Leafly/SC Labs/PSI/Labstat ranges).
 * Percentages are by weight, realistic totals 0.9–2.4%.
 * This dataset is deterministic-ready for the math we defined (energy/clarity/body/anxiety/duration).
 * THC/CBD are typical midpoints (not batch claims).
 */

export interface CanonicalChemotype {
  id: string;
  displayName: string;
  description: string;
  cannabinoids: {
    THC: number;
    CBD?: number;
    [minor: string]: number | undefined;
  };
  terpenes: {
    [terpene: string]: number; // Percentage by weight (e.g., 0.62 = 0.62%)
  };
  totalTerpeneLoad: number; // Total terpene percentage by weight (typically 0.9-2.4%)
  volatility: "high" | "medium" | "low";
  sedationRisk: "low" | "medium" | "high";
  dataConfidence: "canonical";
  inventoryType?: "demo_rich" | "demo_minimal" | "production"; // Optional inventory classification
}

/**
 * Reference chemotype profiles representing common outcome patterns
 * 
 * Design Principles:
 * - No "do-everything" strains
 * - Intentional overlap between categories (bridges)
 * - Redundant coverage for anxiety-safe cognition
 * - Multiple THC bands (low / mid / higher)
 * - Terpene diversity (pinene, limonene, linalool, myrcene, caryophyllene)
 * - Resolver survivability: most slider combinations leave ≥3 valid options
 */
export const canonicalChemotypes: CanonicalChemotype[] = [
  // ============================================
  // CATEGORY 1 — COGNITIVE / CREATIVE (LOW ANXIETY) [8]
  // ============================================
  {
    id: "CHEMO_BLUE_DREAM",
    displayName: "Blue Dream",
    description: "Balanced sativa-dominant, clear-headed, creative, low anxiety",
    cannabinoids: { THC: 20.1, CBD: 0.1 },
    terpenes: { myrcene: 0.62, pinene: 0.38, limonene: 0.29, caryophyllene: 0.21, linalool: 0.07 },
    totalTerpeneLoad: 1.57,
    volatility: "medium",
    sedationRisk: "low",
    dataConfidence: "canonical",
    inventoryType: "demo_rich",
  },
  {
    id: "CHEMO_HARLEQUIN",
    displayName: "Harlequin",
    description: "CBD-forward, clear cognition, anxiety-protective, functional",
    cannabinoids: { THC: 8.5, CBD: 7.2 },
    terpenes: { myrcene: 0.31, pinene: 0.27, caryophyllene: 0.22, linalool: 0.18 },
    totalTerpeneLoad: 0.98,
    volatility: "low",
    sedationRisk: "low",
    dataConfidence: "canonical",
    inventoryType: "demo_rich",
  },
  {
    id: "CHEMO_CANNATONIC",
    displayName: "Cannatonic",
    description: "High CBD, low THC, cognitive clarity, anxiety-safe",
    cannabinoids: { THC: 7.8, CBD: 6.4 },
    terpenes: { myrcene: 0.29, caryophyllene: 0.25, pinene: 0.19, linalool: 0.16 },
    totalTerpeneLoad: 0.89,
    volatility: "low",
    sedationRisk: "low",
    dataConfidence: "canonical",
    inventoryType: "demo_rich",
  },
  {
    id: "CHEMO_JACK_HERER",
    displayName: "Jack Herer",
    description: "Energizing sativa, creative, borderline anxiety risk, forces tradeoffs",
    cannabinoids: { THC: 19.4, CBD: 0.1 },
    terpenes: { terpinolene: 0.53, pinene: 0.41, myrcene: 0.22, caryophyllene: 0.18 },
    totalTerpeneLoad: 1.34,
    volatility: "high",
    sedationRisk: "low",
    dataConfidence: "canonical",
    inventoryType: "demo_rich",
  },
  {
    id: "CHEMO_DURBAN_POISON",
    displayName: "Durban Poison",
    description: "Pure sativa, clean energy, clear-headed, low sedation",
    cannabinoids: { THC: 20.3, CBD: 0.05 },
    terpenes: { terpinolene: 0.61, pinene: 0.39, limonene: 0.22, myrcene: 0.12 },
    totalTerpeneLoad: 1.34,
    volatility: "high",
    sedationRisk: "low",
    dataConfidence: "canonical",
    inventoryType: "demo_rich",
  },
  {
    id: "CHEMO_SUPER_LEMON_HAZE",
    displayName: "Super Lemon Haze",
    description: "High energy ceiling, uplifting, creative, moderate anxiety risk",
    cannabinoids: { THC: 21.2, CBD: 0.05 },
    terpenes: { limonene: 0.58, terpinolene: 0.41, pinene: 0.26, myrcene: 0.18 },
    totalTerpeneLoad: 1.43,
    volatility: "high",
    sedationRisk: "low",
    dataConfidence: "canonical",
    inventoryType: "demo_rich",
  },
  {
    id: "CHEMO_SOUR_TSUNAMI",
    displayName: "Sour Tsunami",
    description: "CBD-dominant, clear cognition, anxiety-protective, functional",
    cannabinoids: { THC: 10.2, CBD: 8.1 },
    terpenes: { myrcene: 0.33, pinene: 0.24, caryophyllene: 0.21, linalool: 0.17 },
    totalTerpeneLoad: 0.95,
    volatility: "low",
    sedationRisk: "low",
    dataConfidence: "canonical",
    inventoryType: "demo_rich",
  },
  {
    id: "CHEMO_ACDC",
    displayName: "ACDC",
    description: "Very high CBD, minimal THC, cognitive clarity, zero anxiety",
    cannabinoids: { THC: 6.1, CBD: 14.3 },
    terpenes: { myrcene: 0.28, pinene: 0.26, caryophyllene: 0.23, linalool: 0.19 },
    totalTerpeneLoad: 0.96,
    volatility: "low",
    sedationRisk: "low",
    dataConfidence: "canonical",
    inventoryType: "demo_rich",
  },

  // ============================================
  // CATEGORY 2 — SOCIAL / MOOD ELEVATION (BALANCED) [8]
  // ============================================
  {
    id: "CHEMO_GELATO",
    displayName: "Gelato",
    description: "Balanced hybrid, mood elevation, social, versatile",
    cannabinoids: { THC: 21.8, CBD: 0.05 },
    terpenes: { caryophyllene: 0.44, limonene: 0.31, myrcene: 0.27, linalool: 0.12, humulene: 0.09 },
    totalTerpeneLoad: 1.23,
    volatility: "medium",
    sedationRisk: "low",
    dataConfidence: "canonical",
    inventoryType: "demo_rich",
  },
  {
    id: "CHEMO_WEDDING_CAKE",
    displayName: "Wedding Cake",
    description: "Balanced hybrid, euphoric, social, mood lift",
    cannabinoids: { THC: 22.5, CBD: 0.05 },
    terpenes: { caryophyllene: 0.48, limonene: 0.33, myrcene: 0.25, linalool: 0.14 },
    totalTerpeneLoad: 1.20,
    volatility: "medium",
    sedationRisk: "low",
    dataConfidence: "canonical",
    inventoryType: "demo_rich",
  },
  {
    id: "CHEMO_ZKITTLEZ",
    displayName: "Zkittlez",
    description: "Indica-leaning hybrid, mood elevation, relaxed but social",
    cannabinoids: { THC: 19.9, CBD: 0.05 },
    terpenes: { limonene: 0.49, caryophyllene: 0.32, myrcene: 0.24, linalool: 0.11 },
    totalTerpeneLoad: 1.16,
    volatility: "medium",
    sedationRisk: "low",
    dataConfidence: "canonical",
    inventoryType: "demo_rich",
  },
  {
    id: "CHEMO_MIMOSA",
    displayName: "Mimosa",
    description: "Sativa-dominant, uplifting, social, creative",
    cannabinoids: { THC: 21.0, CBD: 0.05 },
    terpenes: { limonene: 0.52, pinene: 0.29, caryophyllene: 0.18, myrcene: 0.15 },
    totalTerpeneLoad: 1.14,
    volatility: "high",
    sedationRisk: "low",
    dataConfidence: "canonical",
    inventoryType: "demo_rich",
  },
  {
    id: "CHEMO_PINEAPPLE_EXPRESS",
    displayName: "Pineapple Express",
    description: "Balanced hybrid, energetic, mood elevation, social",
    cannabinoids: { THC: 19.8, CBD: 0.05 },
    terpenes: { limonene: 0.46, pinene: 0.31, myrcene: 0.28, caryophyllene: 0.17 },
    totalTerpeneLoad: 1.22,
    volatility: "high",
    sedationRisk: "low",
    dataConfidence: "canonical",
    inventoryType: "demo_rich",
  },
  {
    id: "CHEMO_STRAWBERRY_COUGH",
    displayName: "Strawberry Cough",
    description: "Sativa-dominant, uplifting, social, clear-headed",
    cannabinoids: { THC: 20.0, CBD: 0.05 },
    terpenes: { myrcene: 0.41, pinene: 0.34, limonene: 0.23, caryophyllene: 0.19 },
    totalTerpeneLoad: 1.17,
    volatility: "high",
    sedationRisk: "low",
    dataConfidence: "canonical",
    inventoryType: "demo_rich",
  },
  {
    id: "CHEMO_RUNTZ",
    displayName: "Runtz",
    description: "Balanced hybrid, euphoric, social, versatile",
    cannabinoids: { THC: 22.1, CBD: 0.05 },
    terpenes: { caryophyllene: 0.39, limonene: 0.34, myrcene: 0.26, linalool: 0.13 },
    totalTerpeneLoad: 1.12,
    volatility: "medium",
    sedationRisk: "low",
    dataConfidence: "canonical",
    inventoryType: "demo_rich",
  },
  {
    id: "CHEMO_MAC",
    displayName: "MAC (Miracle Alien Cookies)",
    description: "Balanced hybrid, clear-headed, social, mood elevation",
    cannabinoids: { THC: 22.4, CBD: 0.05 },
    terpenes: { caryophyllene: 0.42, limonene: 0.28, myrcene: 0.25, pinene: 0.18 },
    totalTerpeneLoad: 1.13,
    volatility: "medium",
    sedationRisk: "low",
    dataConfidence: "canonical",
    inventoryType: "demo_rich",
  },

  // ============================================
  // CATEGORY 3 — RELAXED BODY / LOW FOG [8]
  // ============================================
  {
    id: "CHEMO_LAVENDER",
    displayName: "Lavender",
    description: "Indica-leaning, relaxed body, clear head, low fog",
    cannabinoids: { THC: 18.2, CBD: 0.1 },
    terpenes: { linalool: 0.42, myrcene: 0.51, caryophyllene: 0.23 },
    totalTerpeneLoad: 1.16,
    volatility: "low",
    sedationRisk: "medium",
    dataConfidence: "canonical",
    inventoryType: "demo_rich",
  },
  {
    id: "CHEMO_GRANDDADDY_PURPLE",
    displayName: "Granddaddy Purple",
    description: "Indica, body relaxation, mental calm, low cognitive fog",
    cannabinoids: { THC: 17.9, CBD: 0.1 },
    terpenes: { myrcene: 0.74, linalool: 0.31, caryophyllene: 0.26, humulene: 0.11 },
    totalTerpeneLoad: 1.42,
    volatility: "low",
    sedationRisk: "medium",
    dataConfidence: "canonical",
    inventoryType: "demo_rich",
  },
  {
    id: "CHEMO_BUBBA_KUSH",
    displayName: "Bubba Kush",
    description: "Indica, deep body relaxation, clear-headed, low fog",
    cannabinoids: { THC: 18.7, CBD: 0.1 },
    terpenes: { myrcene: 0.69, caryophyllene: 0.34, linalool: 0.19 },
    totalTerpeneLoad: 1.22,
    volatility: "low",
    sedationRisk: "medium",
    dataConfidence: "canonical",
    inventoryType: "demo_rich",
  },
  {
    id: "CHEMO_NORTHERN_LIGHTS",
    displayName: "Northern Lights",
    description: "Indica, body relaxation, mental calm, minimal cognitive impact",
    cannabinoids: { THC: 18.1, CBD: 0.1 },
    terpenes: { myrcene: 0.66, caryophyllene: 0.29, linalool: 0.21 },
    totalTerpeneLoad: 1.16,
    volatility: "low",
    sedationRisk: "medium",
    dataConfidence: "canonical",
    inventoryType: "demo_rich",
  },
  {
    id: "CHEMO_GRAPE_APE",
    displayName: "Grape Ape",
    description: "Indica, body-focused relaxation, clear head, low fog",
    cannabinoids: { THC: 17.4, CBD: 0.1 },
    terpenes: { myrcene: 0.71, linalool: 0.27, caryophyllene: 0.22 },
    totalTerpeneLoad: 1.20,
    volatility: "low",
    sedationRisk: "medium",
    dataConfidence: "canonical",
    inventoryType: "demo_rich",
  },
  {
    id: "CHEMO_PURPLE_PUNCH",
    displayName: "Purple Punch",
    description: "Indica-leaning, body relaxation, mental clarity preserved",
    cannabinoids: { THC: 19.3, CBD: 0.05 },
    terpenes: { myrcene: 0.63, linalool: 0.29, caryophyllene: 0.24 },
    totalTerpeneLoad: 1.16,
    volatility: "low",
    sedationRisk: "medium",
    dataConfidence: "canonical",
    inventoryType: "demo_rich",
  },
  {
    id: "CHEMO_KOSHER_KUSH",
    displayName: "Kosher Kush",
    description: "Indica, body relaxation, clear cognition, low fog",
    cannabinoids: { THC: 20.2, CBD: 0.05 },
    terpenes: { myrcene: 0.58, caryophyllene: 0.36, linalool: 0.22 },
    totalTerpeneLoad: 1.16,
    volatility: "low",
    sedationRisk: "medium",
    dataConfidence: "canonical",
    inventoryType: "demo_rich",
  },
  {
    id: "CHEMO_AFGHANI",
    displayName: "Afghani",
    description: "Pure indica, body relaxation, mental calm, minimal cognitive fog",
    cannabinoids: { THC: 17.2, CBD: 0.1 },
    terpenes: { myrcene: 0.61, caryophyllene: 0.33, humulene: 0.17 },
    totalTerpeneLoad: 1.11,
    volatility: "low",
    sedationRisk: "medium",
    dataConfidence: "canonical",
    inventoryType: "demo_rich",
  },

  // ============================================
  // CATEGORY 4 — FUNCTIONAL HYBRIDS (BRIDGES) [8]
  // ============================================
  {
    id: "CHEMO_OG_KUSH",
    displayName: "OG Kush",
    description: "Balanced hybrid, versatile bridge, body and head balance",
    cannabinoids: { THC: 21.0, CBD: 0.05 },
    terpenes: { caryophyllene: 0.41, limonene: 0.32, myrcene: 0.27, pinene: 0.19 },
    totalTerpeneLoad: 1.19,
    volatility: "medium",
    sedationRisk: "low",
    dataConfidence: "canonical",
    inventoryType: "demo_rich",
  },
  {
    id: "CHEMO_TAHOE_OG",
    displayName: "Tahoe OG",
    description: "Indica-leaning hybrid, body relaxation, mental clarity bridge",
    cannabinoids: { THC: 20.6, CBD: 0.05 },
    terpenes: { myrcene: 0.49, caryophyllene: 0.37, limonene: 0.24 },
    totalTerpeneLoad: 1.10,
    volatility: "medium",
    sedationRisk: "low",
    dataConfidence: "canonical",
    inventoryType: "demo_rich",
  },
  {
    id: "CHEMO_SUNSET_SHERBET",
    displayName: "Sunset Sherbet",
    description: "Balanced hybrid, mood elevation bridge, versatile",
    cannabinoids: { THC: 20.9, CBD: 0.05 },
    terpenes: { caryophyllene: 0.38, limonene: 0.34, myrcene: 0.26 },
    totalTerpeneLoad: 0.98,
    volatility: "medium",
    sedationRisk: "low",
    dataConfidence: "canonical",
    inventoryType: "demo_rich",
  },
  {
    id: "CHEMO_BLUE_COOKIES",
    displayName: "Blue Cookies",
    description: "Indica-leaning hybrid, body-head bridge, balanced",
    cannabinoids: { THC: 21.7, CBD: 0.05 },
    terpenes: { caryophyllene: 0.36, myrcene: 0.31, limonene: 0.29 },
    totalTerpeneLoad: 0.96,
    volatility: "medium",
    sedationRisk: "low",
    dataConfidence: "canonical",
    inventoryType: "demo_rich",
  },
  {
    id: "CHEMO_ICE_CREAM_CAKE",
    displayName: "Ice Cream Cake",
    description: "Indica-leaning hybrid, relaxation bridge, clear head",
    cannabinoids: { THC: 22.3, CBD: 0.05 },
    terpenes: { caryophyllene: 0.44, myrcene: 0.28, linalool: 0.21 },
    totalTerpeneLoad: 0.93,
    volatility: "medium",
    sedationRisk: "low",
    dataConfidence: "canonical",
    inventoryType: "demo_rich",
  },
  {
    id: "CHEMO_GELATO_41",
    displayName: "Gelato 41",
    description: "Balanced hybrid, versatile bridge, mood and body balance",
    cannabinoids: { THC: 22.6, CBD: 0.05 },
    terpenes: { caryophyllene: 0.41, limonene: 0.33, myrcene: 0.25 },
    totalTerpeneLoad: 0.99,
    volatility: "medium",
    sedationRisk: "low",
    dataConfidence: "canonical",
    inventoryType: "demo_rich",
  },
  {
    id: "CHEMO_ANIMAL_COOKIES",
    displayName: "Animal Cookies",
    description: "Indica-leaning hybrid, body relaxation bridge, clear cognition",
    cannabinoids: { THC: 23.1, CBD: 0.05 },
    terpenes: { caryophyllene: 0.45, myrcene: 0.29, limonene: 0.26 },
    totalTerpeneLoad: 1.00,
    volatility: "medium",
    sedationRisk: "low",
    dataConfidence: "canonical",
    inventoryType: "demo_rich",
  },
  {
    id: "CHEMO_BANANA_KUSH",
    displayName: "Banana Kush",
    description: "Indica-leaning hybrid, relaxation bridge, mental clarity",
    cannabinoids: { THC: 20.4, CBD: 0.05 },
    terpenes: { myrcene: 0.47, limonene: 0.31, caryophyllene: 0.24 },
    totalTerpeneLoad: 1.02,
    volatility: "medium",
    sedationRisk: "low",
    dataConfidence: "canonical",
    inventoryType: "demo_rich",
  },

  // ============================================
  // CATEGORY 5 — STIMULATING / EDGE CASES (INTENTIONAL TENSION) [8]
  // ============================================
  {
    id: "CHEMO_GREEN_CRACK",
    displayName: "Green Crack",
    description: "High-energy sativa, stimulating, anxiety risk, edge case",
    cannabinoids: { THC: 21.5, CBD: 0.05 },
    terpenes: { myrcene: 0.52, pinene: 0.34, limonene: 0.29 },
    totalTerpeneLoad: 1.15,
    volatility: "high",
    sedationRisk: "low",
    dataConfidence: "canonical",
    inventoryType: "demo_rich",
  },
  {
    id: "CHEMO_GHOST_TRAIN_HAZE",
    displayName: "Ghost Train Haze",
    description: "Very high-energy sativa, intense, high anxiety risk",
    cannabinoids: { THC: 23.0, CBD: 0.05 },
    terpenes: { terpinolene: 0.66, limonene: 0.38, pinene: 0.27 },
    totalTerpeneLoad: 1.31,
    volatility: "high",
    sedationRisk: "low",
    dataConfidence: "canonical",
    inventoryType: "demo_rich",
  },
  {
    id: "CHEMO_SUPER_SILVER_HAZE",
    displayName: "Super Silver Haze",
    description: "High-energy sativa, stimulating, moderate anxiety risk",
    cannabinoids: { THC: 21.9, CBD: 0.05 },
    terpenes: { terpinolene: 0.59, pinene: 0.35, limonene: 0.28 },
    totalTerpeneLoad: 1.22,
    volatility: "high",
    sedationRisk: "low",
    dataConfidence: "canonical",
    inventoryType: "demo_rich",
  },
  {
    id: "CHEMO_CHOCOLOPE",
    displayName: "Chocolope",
    description: "Energizing sativa, creative, moderate anxiety risk",
    cannabinoids: { THC: 19.6, CBD: 0.05 },
    terpenes: { terpinolene: 0.57, limonene: 0.33, pinene: 0.26 },
    totalTerpeneLoad: 1.16,
    volatility: "high",
    sedationRisk: "low",
    dataConfidence: "canonical",
    inventoryType: "demo_rich",
  },
  {
    id: "CHEMO_TRAINWRECK",
    displayName: "Trainwreck",
    description: "High-energy sativa, intense, anxiety risk, edge case",
    cannabinoids: { THC: 20.8, CBD: 0.05 },
    terpenes: { terpinolene: 0.49, pinene: 0.36, limonene: 0.29 },
    totalTerpeneLoad: 1.14,
    volatility: "high",
    sedationRisk: "low",
    dataConfidence: "canonical",
    inventoryType: "demo_rich",
  },
  {
    id: "CHEMO_SOUR_DIESEL",
    displayName: "Sour Diesel",
    description: "Energizing sativa, stimulating, moderate anxiety risk",
    cannabinoids: { THC: 21.4, CBD: 0.05 },
    terpenes: { limonene: 0.44, myrcene: 0.33, caryophyllene: 0.25 },
    totalTerpeneLoad: 1.02,
    volatility: "high",
    sedationRisk: "low",
    dataConfidence: "canonical",
    inventoryType: "demo_rich",
  },
  {
    id: "CHEMO_STRAWBERRY_DIESEL",
    displayName: "Strawberry Diesel",
    description: "High-energy sativa, uplifting, moderate anxiety risk",
    cannabinoids: { THC: 21.0, CBD: 0.05 },
    terpenes: { limonene: 0.41, myrcene: 0.31, caryophyllene: 0.24 },
    totalTerpeneLoad: 0.96,
    volatility: "high",
    sedationRisk: "low",
    dataConfidence: "canonical",
    inventoryType: "demo_rich",
  },
  {
    id: "CHEMO_AMNESIA_HAZE",
    displayName: "Amnesia Haze",
    description: "Very high-energy sativa, intense, high anxiety risk, edge case",
    cannabinoids: { THC: 22.2, CBD: 0.05 },
    terpenes: { terpinolene: 0.63, limonene: 0.36, pinene: 0.28 },
    totalTerpeneLoad: 1.27,
    volatility: "high",
    sedationRisk: "low",
    dataConfidence: "canonical",
    inventoryType: "demo_rich",
  },
];
