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
    [terpene: string]: number; // Normalized percentage (0-1) of total terpene profile
  };
  totalTerpeneLoad: number; // Total terpene percentage by weight (typically 1-4%)
  volatility: "high" | "medium" | "low";
  sedationRisk: "low" | "medium" | "high";
  dataConfidence: "canonical";
  inventoryType?: "demo_rich" | "demo_minimal" | "production"; // Optional inventory classification
}

/**
 * Reference chemotype profiles representing common outcome patterns
 * 
 * GO LINE — RICH DEMO INVENTORY (CANONICAL v2 — 40 CULTIVARS)
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
  // ALERT / SOCIAL PROFILES
  {
    id: "CHEMO_ALERT_CLEAR",
    displayName: "Alert / Clear",
    description: "High clarity, low sedation, low appetite bias",
    cannabinoids: {
      THC: 20.0,
      CBD: 0.2,
    },
    terpenes: {
      pinene: 0.35,
      limonene: 0.28,
      caryophyllene: 0.15,
      myrcene: 0.05,
      linalool: 0.08,
      humulene: 0.06,
      terpinolene: 0.02,
      ocimene: 0.01,
    },
    totalTerpeneLoad: 2.5,
    volatility: "high",
    sedationRisk: "low",
    dataConfidence: "canonical",
  },
  {
    id: "CHEMO_SOCIAL_UPBEAT",
    displayName: "Social / Upbeat",
    description: "Elevated mood, conversational, minimal couch-lock",
    cannabinoids: {
      THC: 19.5,
      CBD: 0.15,
    },
    terpenes: {
      limonene: 0.30,
      pinene: 0.20,
      caryophyllene: 0.18,
      myrcene: 0.12,
      linalool: 0.10,
      humulene: 0.08,
      terpinolene: 0.02,
    },
    totalTerpeneLoad: 2.4,
    volatility: "high",
    sedationRisk: "low",
    dataConfidence: "canonical",
  },
  {
    id: "CHEMO_FOCUS_SHARP",
    displayName: "Focus / Sharp",
    description: "Cognitive clarity, sustained attention, low distraction",
    cannabinoids: {
      THC: 21.0,
      CBD: 0.1,
    },
    terpenes: {
      pinene: 0.32,
      limonene: 0.25,
      caryophyllene: 0.20,
      myrcene: 0.08,
      linalool: 0.08,
      humulene: 0.05,
      terpinolene: 0.02,
    },
    totalTerpeneLoad: 2.6,
    volatility: "high",
    sedationRisk: "low",
    dataConfidence: "canonical",
  },

  // RELAXED / FUNCTIONAL PROFILES
  {
    id: "CHEMO_RELAXED_FUNCTIONAL",
    displayName: "Relaxed / Functional",
    description: "Calm without sedation, maintains task capability",
    cannabinoids: {
      THC: 18.5,
      CBD: 0.3,
    },
    terpenes: {
      caryophyllene: 0.28,
      linalool: 0.22,
      myrcene: 0.18,
      limonene: 0.15,
      pinene: 0.10,
      humulene: 0.05,
      terpinolene: 0.02,
    },
    totalTerpeneLoad: 2.2,
    volatility: "medium",
    sedationRisk: "low",
    dataConfidence: "canonical",
  },
  {
    id: "CHEMO_BALANCED_MODERATE",
    displayName: "Balanced / Moderate",
    description: "Even-keeled, neither over-stimulated nor sedated",
    cannabinoids: {
      THC: 17.5,
      CBD: 0.5,
    },
    terpenes: {
      myrcene: 0.20,
      caryophyllene: 0.20,
      limonene: 0.18,
      pinene: 0.15,
      linalool: 0.15,
      humulene: 0.10,
      terpinolene: 0.02,
    },
    totalTerpeneLoad: 2.0,
    volatility: "medium",
    sedationRisk: "low",
    dataConfidence: "canonical",
  },
  {
    id: "CHEMO_CHILL_FOCUSED",
    displayName: "Chill / Focused",
    description: "Relaxed state with maintained mental clarity",
    cannabinoids: {
      THC: 19.0,
      CBD: 0.4,
    },
    terpenes: {
      caryophyllene: 0.25,
      limonene: 0.22,
      pinene: 0.18,
      myrcene: 0.15,
      linalool: 0.12,
      humulene: 0.06,
      terpinolene: 0.02,
    },
    totalTerpeneLoad: 2.1,
    volatility: "medium",
    sedationRisk: "low",
    dataConfidence: "canonical",
  },

  // CREATIVE PROFILES
  {
    id: "CHEMO_CREATIVE_FLOW",
    displayName: "Creative / Flow",
    description: "Divergent thinking, associative connections, inspiration",
    cannabinoids: {
      THC: 20.5,
      CBD: 0.2,
    },
    terpenes: {
      pinene: 0.28,
      limonene: 0.25,
      terpinolene: 0.18,
      myrcene: 0.12,
      caryophyllene: 0.10,
      linalool: 0.05,
      humulene: 0.02,
    },
    totalTerpeneLoad: 2.7,
    volatility: "high",
    sedationRisk: "low",
    dataConfidence: "canonical",
  },
  {
    id: "CHEMO_IMAGINATIVE_OPEN",
    displayName: "Imaginative / Open",
    description: "Altered perspective, pattern recognition, novel associations",
    cannabinoids: {
      THC: 19.8,
      CBD: 0.15,
    },
    terpenes: {
      terpinolene: 0.24,
      limonene: 0.22,
      pinene: 0.20,
      myrcene: 0.15,
      caryophyllene: 0.12,
      linalool: 0.05,
      humulene: 0.02,
    },
    totalTerpeneLoad: 2.5,
    volatility: "high",
    sedationRisk: "low",
    dataConfidence: "canonical",
  },

  // HEAVY BODY PROFILES
  {
    id: "CHEMO_BODY_DEEP",
    displayName: "Body / Deep",
    description: "Strong physical sensation, muscle relaxation, body awareness",
    cannabinoids: {
      THC: 18.0,
      CBD: 0.3,
    },
    terpenes: {
      myrcene: 0.32,
      caryophyllene: 0.22,
      linalool: 0.20,
      limonene: 0.12,
      pinene: 0.08,
      humulene: 0.04,
      terpinolene: 0.02,
    },
    totalTerpeneLoad: 2.3,
    volatility: "low",
    sedationRisk: "medium",
    dataConfidence: "canonical",
  },
  {
    id: "CHEMO_SOOTHING_COMPLETE",
    displayName: "Soothing / Complete",
    description: "Full-body relaxation, tension release, physical comfort",
    cannabinoids: {
      THC: 17.5,
      CBD: 0.5,
    },
    terpenes: {
      myrcene: 0.30,
      linalool: 0.25,
      caryophyllene: 0.20,
      limonene: 0.12,
      pinene: 0.08,
      humulene: 0.04,
      terpinolene: 0.01,
    },
    totalTerpeneLoad: 2.1,
    volatility: "low",
    sedationRisk: "medium",
    dataConfidence: "canonical",
  },

  // ANXIOUS-PRONE PROFILES (low anxiety risk)
  {
    id: "CHEMO_GENTLE_STABLE",
    displayName: "Gentle / Stable",
    description: "Minimal anxiety risk, predictable onset, smooth curve",
    cannabinoids: {
      THC: 16.5,
      CBD: 1.2,
    },
    terpenes: {
      caryophyllene: 0.28,
      linalool: 0.22,
      limonene: 0.18,
      myrcene: 0.15,
      pinene: 0.12,
      humulene: 0.04,
      terpinolene: 0.01,
    },
    totalTerpeneLoad: 1.9,
    volatility: "low",
    sedationRisk: "low",
    dataConfidence: "canonical",
  },
  {
    id: "CHEMO_CALM_ANCHORED",
    displayName: "Calm / Anchored",
    description: "Grounding, anxiety-resistant, stable mood",
    cannabinoids: {
      THC: 15.0,
      CBD: 2.0,
    },
    terpenes: {
      caryophyllene: 0.30,
      humulene: 0.20,
      linalool: 0.18,
      limonene: 0.15,
      myrcene: 0.10,
      pinene: 0.06,
      terpinolene: 0.01,
    },
    totalTerpeneLoad: 1.8,
    volatility: "low",
    sedationRisk: "low",
    dataConfidence: "canonical",
  },
  {
    id: "CHEMO_SOFT_LANDING",
    displayName: "Soft / Landing",
    description: "Gradual onset, no spike, anxiety-protective",
    cannabinoids: {
      THC: 14.0,
      CBD: 2.5,
    },
    terpenes: {
      caryophyllene: 0.25,
      linalool: 0.22,
      myrcene: 0.18,
      limonene: 0.15,
      pinene: 0.12,
      humulene: 0.06,
      terpinolene: 0.02,
    },
    totalTerpeneLoad: 1.7,
    volatility: "low",
    sedationRisk: "low",
    dataConfidence: "canonical",
  },

  // APPETITE-HEAVY PROFILES
  {
    id: "CHEMO_APPETITE_ENHANCED",
    displayName: "Appetite / Enhanced",
    description: "Strong hunger signals, enhanced taste, food interest",
    cannabinoids: {
      THC: 19.5,
      CBD: 0.2,
    },
    terpenes: {
      myrcene: 0.35,
      caryophyllene: 0.22,
      humulene: 0.18,
      limonene: 0.12,
      pinene: 0.08,
      linalool: 0.04,
      terpinolene: 0.01,
    },
    totalTerpeneLoad: 2.4,
    volatility: "medium",
    sedationRisk: "medium",
    dataConfidence: "canonical",
  },
  {
    id: "CHEMO_MUNCHIES_STRONG",
    displayName: "Munchies / Strong",
    description: "Pronounced appetite stimulation, enhanced food enjoyment",
    cannabinoids: {
      THC: 18.5,
      CBD: 0.15,
    },
    terpenes: {
      myrcene: 0.38,
      humulene: 0.20,
      caryophyllene: 0.18,
      limonene: 0.12,
      pinene: 0.08,
      linalool: 0.03,
      terpinolene: 0.01,
    },
    totalTerpeneLoad: 2.2,
    volatility: "medium",
    sedationRisk: "medium",
    dataConfidence: "canonical",
  },

  // SLEEP-FORWARD PROFILES
  {
    id: "CHEMO_SLEEP_DEEP",
    displayName: "Sleep / Deep",
    description: "Strong sedative signals, body relaxation, sleep-ready",
    cannabinoids: {
      THC: 17.0,
      CBD: 0.8,
    },
    terpenes: {
      myrcene: 0.30,
      linalool: 0.28,
      caryophyllene: 0.20,
      limonene: 0.10,
      pinene: 0.07,
      humulene: 0.04,
      terpinolene: 0.01,
    },
    totalTerpeneLoad: 2.0,
    volatility: "low",
    sedationRisk: "high",
    dataConfidence: "canonical",
  },
  {
    id: "CHEMO_REST_FULL",
    displayName: "Rest / Full",
    description: "Complete relaxation, sleep promotion, body shutdown",
    cannabinoids: {
      THC: 16.0,
      CBD: 1.0,
    },
    terpenes: {
      linalool: 0.32,
      myrcene: 0.28,
      caryophyllene: 0.22,
      limonene: 0.10,
      pinene: 0.05,
      humulene: 0.02,
      terpinolene: 0.01,
    },
    totalTerpeneLoad: 1.9,
    volatility: "low",
    sedationRisk: "high",
    dataConfidence: "canonical",
  },
  {
    id: "CHEMO_WIND_DOWN",
    displayName: "Wind Down",
    description: "Evening transition, gradual sedation, sleep preparation",
    cannabinoids: {
      THC: 15.5,
      CBD: 1.5,
    },
    terpenes: {
      linalool: 0.28,
      myrcene: 0.25,
      caryophyllene: 0.22,
      limonene: 0.12,
      pinene: 0.08,
      humulene: 0.04,
      terpinolene: 0.01,
    },
    totalTerpeneLoad: 1.8,
    volatility: "low",
    sedationRisk: "high",
    dataConfidence: "canonical",
  },

  // CBD-DOMINANT STABILIZERS
  {
    id: "CHEMO_CBD_BALANCE",
    displayName: "CBD / Balance",
    description: "THC modulation, anxiety reduction, smooth curve",
    cannabinoids: {
      THC: 5.0,
      CBD: 12.0,
    },
    terpenes: {
      caryophyllene: 0.30,
      myrcene: 0.20,
      limonene: 0.18,
      pinene: 0.15,
      linalool: 0.10,
      humulene: 0.06,
      terpinolene: 0.01,
    },
    totalTerpeneLoad: 1.6,
    volatility: "low",
    sedationRisk: "low",
    dataConfidence: "canonical",
  },
  {
    id: "CHEMO_CBD_CALM",
    displayName: "CBD / Calm",
    description: "High CBD, low THC, anxiety protection, no intoxication",
    cannabinoids: {
      THC: 1.0,
      CBD: 18.0,
    },
    terpenes: {
      caryophyllene: 0.28,
      limonene: 0.22,
      myrcene: 0.18,
      pinene: 0.15,
      linalool: 0.12,
      humulene: 0.04,
      terpinolene: 0.01,
    },
    totalTerpeneLoad: 1.5,
    volatility: "low",
    sedationRisk: "low",
    dataConfidence: "canonical",
  },
  {
    id: "CHEMO_CBD_STABILIZER",
    displayName: "CBD / Stabilizer",
    description: "Corrective component, reduces overshoot, buffers anxiety",
    cannabinoids: {
      THC: 0.3,
      CBD: 15.0,
    },
    terpenes: {
      myrcene: 0.25,
      caryophyllene: 0.25,
      limonene: 0.20,
      pinene: 0.15,
      linalool: 0.10,
      humulene: 0.04,
      terpinolene: 0.01,
    },
    totalTerpeneLoad: 1.4,
    volatility: "low",
    sedationRisk: "low",
    dataConfidence: "canonical",
  },

  // CBG FOCUS TYPES
  {
    id: "CHEMO_CBG_FOCUS",
    displayName: "CBG / Focus",
    description: "CBG-dominant, clear-headed, no sedation, cognitive support",
    cannabinoids: {
      THC: 0.5,
      CBG: 14.0,
      CBD: 1.0,
    },
    terpenes: {
      pinene: 0.30,
      limonene: 0.25,
      caryophyllene: 0.20,
      myrcene: 0.12,
      linalool: 0.08,
      humulene: 0.04,
      terpinolene: 0.01,
    },
    totalTerpeneLoad: 1.5,
    volatility: "medium",
    sedationRisk: "low",
    dataConfidence: "canonical",
  },
  {
    id: "CHEMO_CBG_CLEAR",
    displayName: "CBG / Clear",
    description: "Non-intoxicating, mental clarity, minimal side effects",
    cannabinoids: {
      THC: 0.2,
      CBG: 12.0,
    },
    terpenes: {
      caryophyllene: 0.30,
      pinene: 0.22,
      limonene: 0.20,
      myrcene: 0.15,
      linalool: 0.08,
      humulene: 0.04,
      terpinolene: 0.01,
    },
    totalTerpeneLoad: 1.3,
    volatility: "medium",
    sedationRisk: "low",
    dataConfidence: "canonical",
  },

  // ADDITIONAL VARIETY PROFILES
  {
    id: "CHEMO_ELEVATED_MOOD",
    displayName: "Elevated / Mood",
    description: "Positive affect, mood lift, social readiness",
    cannabinoids: {
      THC: 20.0,
      CBD: 0.2,
    },
    terpenes: {
      limonene: 0.32,
      pinene: 0.22,
      caryophyllene: 0.18,
      myrcene: 0.12,
      linalool: 0.10,
      humulene: 0.05,
      terpinolene: 0.01,
    },
    totalTerpeneLoad: 2.5,
    volatility: "high",
    sedationRisk: "low",
    dataConfidence: "canonical",
  },
  {
    id: "CHEMO_ACTIVE_DAY",
    displayName: "Active / Day",
    description: "Daytime use, energy preservation, no crash",
    cannabinoids: {
      THC: 18.5,
      CBD: 0.4,
    },
    terpenes: {
      pinene: 0.28,
      limonene: 0.26,
      caryophyllene: 0.20,
      myrcene: 0.12,
      linalool: 0.10,
      humulene: 0.03,
      terpinolene: 0.01,
    },
    totalTerpeneLoad: 2.4,
    volatility: "high",
    sedationRisk: "low",
    dataConfidence: "canonical",
  },
  {
    id: "CHEMO_EVENING_SMOOTH",
    displayName: "Evening / Smooth",
    description: "Transitional, moderate relaxation, no heavy sedation",
    cannabinoids: {
      THC: 17.0,
      CBD: 0.6,
    },
    terpenes: {
      caryophyllene: 0.26,
      myrcene: 0.22,
      linalool: 0.20,
      limonene: 0.16,
      pinene: 0.12,
      humulene: 0.03,
      terpinolene: 0.01,
    },
    totalTerpeneLoad: 2.0,
    volatility: "medium",
    sedationRisk: "medium",
    dataConfidence: "canonical",
  },
  {
    id: "CHEMO_RELIEF_TARGETED",
    displayName: "Relief / Targeted",
    description: "Discomfort management, localized support, functional",
    cannabinoids: {
      THC: 16.5,
      CBD: 2.0,
    },
    terpenes: {
      caryophyllene: 0.30,
      myrcene: 0.22,
      linalool: 0.18,
      limonene: 0.15,
      pinene: 0.10,
      humulene: 0.04,
      terpinolene: 0.01,
    },
    totalTerpeneLoad: 2.0,
    volatility: "low",
    sedationRisk: "low",
    dataConfidence: "canonical",
  },
  {
    id: "CHEMO_MEDITATIVE_STATE",
    displayName: "Meditative / State",
    description: "Contemplative, inner focus, reduced external distraction",
    cannabinoids: {
      THC: 15.5,
      CBD: 1.2,
    },
    terpenes: {
      linalool: 0.26,
      caryophyllene: 0.24,
      myrcene: 0.20,
      limonene: 0.14,
      pinene: 0.10,
      humulene: 0.05,
      terpinolene: 0.01,
    },
    totalTerpeneLoad: 1.9,
    volatility: "low",
    sedationRisk: "medium",
    dataConfidence: "canonical",
  },
  // Additional energizing cultivars for better coverage
  {
    id: "CHEMO_ENERGIZING_PEAK",
    displayName: "Energizing Peak",
    description: "High activation, clear focus, social engagement",
    cannabinoids: {
      THC: 22.0,
      CBD: 0.3,
    },
    terpenes: {
      pinene: 0.32,
      limonene: 0.30,
      terpinolene: 0.15,
      caryophyllene: 0.12,
      myrcene: 0.06,
      linalool: 0.04,
      humulene: 0.01,
    },
    totalTerpeneLoad: 2.8,
    volatility: "high",
    sedationRisk: "low",
    dataConfidence: "canonical",
  },
  {
    id: "CHEMO_CLEAR_FOCUS",
    displayName: "Clear Focus",
    description: "Mental clarity, sustained attention, low sedation",
    cannabinoids: {
      THC: 19.5,
      CBD: 0.5,
    },
    terpenes: {
      limonene: 0.28,
      pinene: 0.25,
      caryophyllene: 0.18,
      myrcene: 0.12,
      linalool: 0.10,
      humulene: 0.05,
      terpinolene: 0.02,
    },
    totalTerpeneLoad: 2.4,
    volatility: "high",
    sedationRisk: "low",
    dataConfidence: "canonical",
  },
  // Additional balanced hybrid cultivars
  {
    id: "CHEMO_BALANCED_HARMONY",
    displayName: "Balanced Harmony",
    description: "Even-keeled, versatile, moderate effects",
    cannabinoids: {
      THC: 18.0,
      CBD: 1.0,
    },
    terpenes: {
      myrcene: 0.24,
      caryophyllene: 0.22,
      limonene: 0.20,
      pinene: 0.18,
      linalool: 0.10,
      humulene: 0.05,
      terpinolene: 0.01,
    },
    totalTerpeneLoad: 2.2,
    volatility: "medium",
    sedationRisk: "low",
    dataConfidence: "canonical",
  },
  {
    id: "CHEMO_VERSATILE_BLEND",
    displayName: "Versatile Blend",
    description: "Adaptable profile, works across contexts",
    cannabinoids: {
      THC: 17.5,
      CBD: 0.8,
    },
    terpenes: {
      limonene: 0.26,
      myrcene: 0.22,
      caryophyllene: 0.20,
      pinene: 0.18,
      linalool: 0.08,
      humulene: 0.04,
      terpinolene: 0.02,
    },
    totalTerpeneLoad: 2.1,
    volatility: "medium",
    sedationRisk: "low",
    dataConfidence: "canonical",
  },
  // Additional calming/body-leaning cultivars
  {
    id: "CHEMO_DEEP_RELAX",
    displayName: "Deep Relax",
    description: "Body-focused relaxation, gentle sedation",
    cannabinoids: {
      THC: 16.0,
      CBD: 1.5,
    },
    terpenes: {
      myrcene: 0.30,
      linalool: 0.24,
      caryophyllene: 0.20,
      limonene: 0.12,
      pinene: 0.08,
      humulene: 0.05,
      terpinolene: 0.01,
    },
    totalTerpeneLoad: 2.0,
    volatility: "low",
    sedationRisk: "medium",
    dataConfidence: "canonical",
  },
  {
    id: "CHEMO_CALM_BODY",
    displayName: "Calm Body",
    description: "Physical comfort, mental calm, low activation",
    cannabinoids: {
      THC: 15.0,
      CBD: 2.0,
    },
    terpenes: {
      linalool: 0.28,
      myrcene: 0.26,
      caryophyllene: 0.22,
      limonene: 0.12,
      pinene: 0.08,
      humulene: 0.03,
      terpinolene: 0.01,
    },
    totalTerpeneLoad: 1.9,
    volatility: "low",
    sedationRisk: "medium",
    dataConfidence: "canonical",
  },
];










