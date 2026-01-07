/**
 * Canonical Strain Library
 * 
 * Authoritative source for strain-to-chemistry mapping.
 * ALL strain scoring and selection comes exclusively from this library.
 * 
 * MANDATORY: This library MUST contain at least 40 strains.
 * If count is below 40, the application will throw an error.
 */

export type TerpeneProfile = {
  myrcene: number;
  limonene: number;
  caryophyllene: number;
  pinene: number;
  humulene: number;
  linalool: number;
  terpinolene: number;
};

export type Strain = {
  id: string;
  name: string;
  thc: number;
  cbd: number;
  terpenes: TerpeneProfile;
  effects: {
    energy: number;      // 0-100: stimulation/activation
    calm: number;        // 0-100: relaxation/sedation
    focus: number;       // 0-100: mental clarity/concentration
    body: number;        // 0-100: physical relief/body load
    anxietyRisk: number; // 0-100: risk of anxiety (lower is better)
  };
};

export const STRAIN_LIBRARY: Record<string, Strain> = {
  "blue-dream": {
    id: "blue-dream",
    name: "Blue Dream",
    thc: 18,
    cbd: 0.1,
    terpenes: { myrcene: 0.6, limonene: 0.2, caryophyllene: 0.1, pinene: 0.15, humulene: 0.05, linalool: 0.05, terpinolene: 0.1 },
    effects: { energy: 65, calm: 60, focus: 60, body: 50, anxietyRisk: 35 }
  },

  "jack-herer": {
    id: "jack-herer",
    name: "Jack Herer",
    thc: 19,
    cbd: 0.1,
    terpenes: { myrcene: 0.2, limonene: 0.25, caryophyllene: 0.15, pinene: 0.3, humulene: 0.05, linalool: 0.02, terpinolene: 0.2 },
    effects: { energy: 80, calm: 35, focus: 80, body: 40, anxietyRisk: 40 }
  },

  "durban-poison": {
    id: "durban-poison",
    name: "Durban Poison",
    thc: 20,
    cbd: 0,
    terpenes: { myrcene: 0.15, limonene: 0.3, caryophyllene: 0.1, pinene: 0.25, humulene: 0.05, linalool: 0.02, terpinolene: 0.35 },
    effects: { energy: 90, calm: 20, focus: 85, body: 30, anxietyRisk: 55 }
  },

  "sour-diesel": {
    id: "sour-diesel",
    name: "Sour Diesel",
    thc: 21,
    cbd: 0,
    terpenes: { myrcene: 0.3, limonene: 0.3, caryophyllene: 0.2, pinene: 0.1, humulene: 0.1, linalool: 0.02, terpinolene: 0.05 },
    effects: { energy: 85, calm: 30, focus: 70, body: 45, anxietyRisk: 50 }
  },

  "og-kush": {
    id: "og-kush",
    name: "OG Kush",
    thc: 22,
    cbd: 0.1,
    terpenes: { myrcene: 0.45, limonene: 0.25, caryophyllene: 0.15, pinene: 0.1, humulene: 0.1, linalool: 0.05, terpinolene: 0.03 },
    effects: { energy: 55, calm: 70, focus: 55, body: 60, anxietyRisk: 40 }
  },

  "girl-scout-cookies": {
    id: "girl-scout-cookies",
    name: "Girl Scout Cookies",
    thc: 23,
    cbd: 0.1,
    terpenes: { myrcene: 0.4, limonene: 0.25, caryophyllene: 0.3, pinene: 0.05, humulene: 0.1, linalool: 0.05, terpinolene: 0.02 },
    effects: { energy: 60, calm: 70, focus: 55, body: 65, anxietyRisk: 30 }
  },

  "gelato": {
    id: "gelato",
    name: "Gelato",
    thc: 21,
    cbd: 0.1,
    terpenes: { myrcene: 0.35, limonene: 0.3, caryophyllene: 0.25, pinene: 0.05, humulene: 0.1, linalool: 0.05, terpinolene: 0.03 },
    effects: { energy: 60, calm: 70, focus: 55, body: 60, anxietyRisk: 30 }
  },

  "wedding-cake": {
    id: "wedding-cake",
    name: "Wedding Cake",
    thc: 24,
    cbd: 0.1,
    terpenes: { myrcene: 0.4, limonene: 0.2, caryophyllene: 0.3, pinene: 0.05, humulene: 0.15, linalool: 0.05, terpinolene: 0.02 },
    effects: { energy: 50, calm: 80, focus: 45, body: 70, anxietyRisk: 25 }
  },

  "zkittlez": {
    id: "zkittlez",
    name: "Zkittlez",
    thc: 20,
    cbd: 0.1,
    terpenes: { myrcene: 0.3, limonene: 0.35, caryophyllene: 0.15, pinene: 0.05, humulene: 0.05, linalool: 0.1, terpinolene: 0.05 },
    effects: { energy: 55, calm: 75, focus: 50, body: 55, anxietyRisk: 20 }
  },

  "pineapple-express": {
    id: "pineapple-express",
    name: "Pineapple Express",
    thc: 19,
    cbd: 0.1,
    terpenes: { myrcene: 0.25, limonene: 0.4, caryophyllene: 0.1, pinene: 0.15, humulene: 0.05, linalool: 0.03, terpinolene: 0.2 },
    effects: { energy: 75, calm: 45, focus: 65, body: 40, anxietyRisk: 35 }
  },

  "green-crack": {
    id: "green-crack",
    name: "Green Crack",
    thc: 20,
    cbd: 0,
    terpenes: { myrcene: 0.2, limonene: 0.3, caryophyllene: 0.1, pinene: 0.3, humulene: 0.05, linalool: 0.02, terpinolene: 0.25 },
    effects: { energy: 90, calm: 20, focus: 85, body: 35, anxietyRisk: 60 }
  },

  "super-lemon-haze": {
    id: "super-lemon-haze",
    name: "Super Lemon Haze",
    thc: 22,
    cbd: 0,
    terpenes: { myrcene: 0.15, limonene: 0.45, caryophyllene: 0.1, pinene: 0.15, humulene: 0.05, linalool: 0.03, terpinolene: 0.35 },
    effects: { energy: 85, calm: 30, focus: 80, body: 30, anxietyRisk: 55 }
  },

  "granddaddy-purple": {
    id: "granddaddy-purple",
    name: "Granddaddy Purple",
    thc: 18,
    cbd: 0.1,
    terpenes: { myrcene: 0.6, limonene: 0.1, caryophyllene: 0.15, pinene: 0.05, humulene: 0.1, linalool: 0.15, terpinolene: 0.02 },
    effects: { energy: 30, calm: 85, focus: 35, body: 80, anxietyRisk: 15 }
  },

  "northern-lights": {
    id: "northern-lights",
    name: "Northern Lights",
    thc: 18,
    cbd: 0.1,
    terpenes: { myrcene: 0.5, limonene: 0.1, caryophyllene: 0.15, pinene: 0.1, humulene: 0.1, linalool: 0.1, terpinolene: 0.02 },
    effects: { energy: 35, calm: 80, focus: 40, body: 75, anxietyRisk: 20 }
  },

  "white-widow": {
    id: "white-widow",
    name: "White Widow",
    thc: 19,
    cbd: 0.1,
    terpenes: { myrcene: 0.35, limonene: 0.2, caryophyllene: 0.25, pinene: 0.15, humulene: 0.1, linalool: 0.05, terpinolene: 0.05 },
    effects: { energy: 65, calm: 60, focus: 60, body: 55, anxietyRisk: 40 }
  },

  "ak-47": {
    id: "ak-47",
    name: "AK-47",
    thc: 20,
    cbd: 0.1,
    terpenes: { myrcene: 0.3, limonene: 0.2, caryophyllene: 0.2, pinene: 0.2, humulene: 0.1, linalool: 0.05, terpinolene: 0.1 },
    effects: { energy: 70, calm: 55, focus: 65, body: 50, anxietyRisk: 45 }
  },

  "amnesia-haze": {
    id: "amnesia-haze",
    name: "Amnesia Haze",
    thc: 22,
    cbd: 0,
    terpenes: { myrcene: 0.2, limonene: 0.35, caryophyllene: 0.1, pinene: 0.25, humulene: 0.05, linalool: 0.02, terpinolene: 0.3 },
    effects: { energy: 85, calm: 30, focus: 80, body: 35, anxietyRisk: 55 }
  },

  "trainwreck": {
    id: "trainwreck",
    name: "Trainwreck",
    thc: 21,
    cbd: 0,
    terpenes: { myrcene: 0.3, limonene: 0.25, caryophyllene: 0.2, pinene: 0.2, humulene: 0.1, linalool: 0.03, terpinolene: 0.15 },
    effects: { energy: 80, calm: 40, focus: 70, body: 45, anxietyRisk: 50 }
  },

  "mac-1": {
    id: "mac-1",
    name: "MAC 1",
    thc: 22,
    cbd: 0.1,
    terpenes: { myrcene: 0.25, limonene: 0.25, caryophyllene: 0.3, pinene: 0.1, humulene: 0.15, linalool: 0.05, terpinolene: 0.05 },
    effects: { energy: 60, calm: 70, focus: 55, body: 65, anxietyRisk: 30 }
  },

  "do-si-dos": {
    id: "do-si-dos",
    name: "Do-Si-Dos",
    thc: 23,
    cbd: 0.1,
    terpenes: { myrcene: 0.4, limonene: 0.2, caryophyllene: 0.3, pinene: 0.05, humulene: 0.15, linalool: 0.1, terpinolene: 0.03 },
    effects: { energy: 55, calm: 75, focus: 50, body: 70, anxietyRisk: 25 }
  },

  "runtz": {
    id: "runtz",
    name: "Runtz",
    thc: 21,
    cbd: 0.1,
    terpenes: { myrcene: 0.3, limonene: 0.35, caryophyllene: 0.2, pinene: 0.05, humulene: 0.1, linalool: 0.1, terpinolene: 0.05 },
    effects: { energy: 65, calm: 70, focus: 55, body: 60, anxietyRisk: 30 }
  },

  "animal-mints": {
    id: "animal-mints",
    name: "Animal Mints",
    thc: 22,
    cbd: 0.1,
    terpenes: { myrcene: 0.35, limonene: 0.2, caryophyllene: 0.35, pinene: 0.05, humulene: 0.15, linalool: 0.05, terpinolene: 0.02 },
    effects: { energy: 55, calm: 75, focus: 50, body: 70, anxietyRisk: 25 }
  },

  "gelato-33": {
    id: "gelato-33",
    name: "Gelato #33",
    thc: 22,
    cbd: 0.1,
    terpenes: { myrcene: 0.35, limonene: 0.3, caryophyllene: 0.25, pinene: 0.05, humulene: 0.1, linalool: 0.05, terpinolene: 0.03 },
    effects: { energy: 60, calm: 70, focus: 55, body: 60, anxietyRisk: 30 }
  },

  "sunset-sherbet": {
    id: "sunset-sherbet",
    name: "Sunset Sherbet",
    thc: 20,
    cbd: 0.1,
    terpenes: { myrcene: 0.3, limonene: 0.35, caryophyllene: 0.2, pinene: 0.05, humulene: 0.1, linalool: 0.1, terpinolene: 0.05 },
    effects: { energy: 60, calm: 70, focus: 55, body: 60, anxietyRisk: 30 }
  },

  "mimosa": {
    id: "mimosa",
    name: "Mimosa",
    thc: 21,
    cbd: 0,
    terpenes: { myrcene: 0.2, limonene: 0.45, caryophyllene: 0.1, pinene: 0.15, humulene: 0.05, linalool: 0.05, terpinolene: 0.25 },
    effects: { energy: 80, calm: 40, focus: 75, body: 40, anxietyRisk: 45 }
  },

  "clementine": {
    id: "clementine",
    name: "Clementine",
    thc: 19,
    cbd: 0,
    terpenes: { myrcene: 0.15, limonene: 0.5, caryophyllene: 0.1, pinene: 0.15, humulene: 0.05, linalool: 0.03, terpinolene: 0.25 },
    effects: { energy: 85, calm: 35, focus: 80, body: 35, anxietyRisk: 50 }
  },

  "tangie": {
    id: "tangie",
    name: "Tangie",
    thc: 19,
    cbd: 0,
    terpenes: { myrcene: 0.15, limonene: 0.55, caryophyllene: 0.05, pinene: 0.15, humulene: 0.05, linalool: 0.02, terpinolene: 0.35 },
    effects: { energy: 90, calm: 30, focus: 85, body: 30, anxietyRisk: 55 }
  },

  "strawberry-cough": {
    id: "strawberry-cough",
    name: "Strawberry Cough",
    thc: 18,
    cbd: 0,
    terpenes: { myrcene: 0.25, limonene: 0.25, caryophyllene: 0.15, pinene: 0.25, humulene: 0.05, linalool: 0.05, terpinolene: 0.15 },
    effects: { energy: 75, calm: 45, focus: 70, body: 40, anxietyRisk: 45 }
  },

  "purple-punch": {
    id: "purple-punch",
    name: "Purple Punch",
    thc: 20,
    cbd: 0.1,
    terpenes: { myrcene: 0.5, limonene: 0.15, caryophyllene: 0.2, pinene: 0.05, humulene: 0.1, linalool: 0.15, terpinolene: 0.02 },
    effects: { energy: 35, calm: 85, focus: 40, body: 80, anxietyRisk: 15 }
  },

  "ice-cream-cake": {
    id: "ice-cream-cake",
    name: "Ice Cream Cake",
    thc: 23,
    cbd: 0.1,
    terpenes: { myrcene: 0.45, limonene: 0.2, caryophyllene: 0.3, pinene: 0.05, humulene: 0.15, linalool: 0.1, terpinolene: 0.02 },
    effects: { energy: 45, calm: 80, focus: 45, body: 75, anxietyRisk: 20 }
  },

  "forbidden-fruit": {
    id: "forbidden-fruit",
    name: "Forbidden Fruit",
    thc: 21,
    cbd: 0.1,
    terpenes: { myrcene: 0.35, limonene: 0.35, caryophyllene: 0.2, pinene: 0.05, humulene: 0.1, linalool: 0.1, terpinolene: 0.05 },
    effects: { energy: 50, calm: 75, focus: 50, body: 65, anxietyRisk: 25 }
  },

  "skywalker-og": {
    id: "skywalker-og",
    name: "Skywalker OG",
    thc: 22,
    cbd: 0.1,
    terpenes: { myrcene: 0.45, limonene: 0.2, caryophyllene: 0.25, pinene: 0.05, humulene: 0.15, linalool: 0.1, terpinolene: 0.02 },
    effects: { energy: 40, calm: 80, focus: 45, body: 75, anxietyRisk: 20 }
  },

  "afghan-kush": {
    id: "afghan-kush",
    name: "Afghan Kush",
    thc: 17,
    cbd: 0.2,
    terpenes: { myrcene: 0.6, limonene: 0.1, caryophyllene: 0.2, pinene: 0.05, humulene: 0.15, linalool: 0.15, terpinolene: 0.01 },
    effects: { energy: 30, calm: 90, focus: 35, body: 85, anxietyRisk: 10 }
  },

  "chemdawg": {
    id: "chemdawg",
    name: "Chemdawg",
    thc: 22,
    cbd: 0,
    terpenes: { myrcene: 0.35, limonene: 0.25, caryophyllene: 0.3, pinene: 0.15, humulene: 0.1, linalool: 0.03, terpinolene: 0.05 },
    effects: { energy: 70, calm: 40, focus: 65, body: 55, anxietyRisk: 55 }
  },

  "gorilla-glue-4": {
    id: "gorilla-glue-4",
    name: "Gorilla Glue #4",
    thc: 24,
    cbd: 0.1,
    terpenes: { myrcene: 0.45, limonene: 0.2, caryophyllene: 0.35, pinene: 0.1, humulene: 0.15, linalool: 0.05, terpinolene: 0.02 },
    effects: { energy: 50, calm: 75, focus: 45, body: 80, anxietyRisk: 35 }
  },

  "lava-cake": {
    id: "lava-cake",
    name: "Lava Cake",
    thc: 23,
    cbd: 0,
    terpenes: { myrcene: 0.4, limonene: 0.2, caryophyllene: 0.35, pinene: 0.05, humulene: 0.15, linalool: 0.1, terpinolene: 0.02 },
    effects: { energy: 40, calm: 85, focus: 40, body: 80, anxietyRisk: 25 }
  },

  "slurricane": {
    id: "slurricane",
    name: "Slurricane",
    thc: 21,
    cbd: 0,
    terpenes: { myrcene: 0.5, limonene: 0.15, caryophyllene: 0.25, pinene: 0.05, humulene: 0.1, linalool: 0.15, terpinolene: 0.02 },
    effects: { energy: 35, calm: 90, focus: 35, body: 85, anxietyRisk: 20 }
  },

  "cherry-pie": {
    id: "cherry-pie",
    name: "Cherry Pie",
    thc: 20,
    cbd: 0,
    terpenes: { myrcene: 0.4, limonene: 0.25, caryophyllene: 0.2, pinene: 0.1, humulene: 0.1, linalool: 0.1, terpinolene: 0.05 },
    effects: { energy: 55, calm: 65, focus: 55, body: 60, anxietyRisk: 30 }
  },

  "headband": {
    id: "headband",
    name: "Headband",
    thc: 22,
    cbd: 0,
    terpenes: { myrcene: 0.3, limonene: 0.25, caryophyllene: 0.3, pinene: 0.15, humulene: 0.15, linalool: 0.03, terpinolene: 0.05 },
    effects: { energy: 60, calm: 55, focus: 65, body: 65, anxietyRisk: 45 }
  },

  "platinum-og": {
    id: "platinum-og",
    name: "Platinum OG",
    thc: 23,
    cbd: 0,
    terpenes: { myrcene: 0.45, limonene: 0.2, caryophyllene: 0.3, pinene: 0.05, humulene: 0.15, linalool: 0.1, terpinolene: 0.02 },
    effects: { energy: 40, calm: 85, focus: 40, body: 85, anxietyRisk: 25 }
  },

  // --- Added strains (non-overwriting additions) ---
  "alkaline": {
    id: "alkaline",
    name: "Alkaline",
    thc: 18,
    cbd: 0.1,
    terpenes: { myrcene: 0.25, limonene: 0.32, caryophyllene: 0.18, pinene: 0.3, humulene: 0.1, linalool: 0.05, terpinolene: 0.2 },
    effects: { energy: 72, calm: 45, focus: 68, body: 38, anxietyRisk: 28 }
  },

  "jack-the-ripper": {
    id: "jack-the-ripper",
    name: "Jack the Ripper",
    thc: 21,
    cbd: 0.05,
    terpenes: { myrcene: 0.22, limonene: 0.38, caryophyllene: 0.12, pinene: 0.42, humulene: 0.1, linalool: 0.04, terpinolene: 0.33 },
    effects: { energy: 88, calm: 32, focus: 80, body: 28, anxietyRisk: 38 }
  },

  "acapulco-gold": {
    id: "acapulco-gold",
    name: "Acapulco Gold",
    thc: 19,
    cbd: 0.1,
    terpenes: { myrcene: 0.3, limonene: 0.28, caryophyllene: 0.18, pinene: 0.32, humulene: 0.12, linalool: 0.05, terpinolene: 0.22 },
    effects: { energy: 75, calm: 50, focus: 70, body: 45, anxietyRisk: 25 }
  },

  "thai": {
    id: "thai",
    name: "Thai",
    thc: 18,
    cbd: 0.05,
    terpenes: { myrcene: 0.18, limonene: 0.3, caryophyllene: 0.1, pinene: 0.4, humulene: 0.08, linalool: 0.03, terpinolene: 0.45 },
    effects: { energy: 90, calm: 25, focus: 85, body: 20, anxietyRisk: 48 }
  },

  "banana-og": {
    id: "banana-og",
    name: "Banana OG",
    thc: 21,
    cbd: 0.05,
    terpenes: { myrcene: 0.45, limonene: 0.25, caryophyllene: 0.28, pinene: 0.12, humulene: 0.15, linalool: 0.1, terpinolene: 0.05 },
    effects: { energy: 50, calm: 65, focus: 48, body: 70, anxietyRisk: 30 }
  },

  "bubba-kush": {
    id: "bubba-kush",
    name: "Bubba Kush",
    thc: 18,
    cbd: 0.15,
    terpenes: { myrcene: 0.55, limonene: 0.14, caryophyllene: 0.32, pinene: 0.06, humulene: 0.18, linalool: 0.16, terpinolene: 0.02 },
    effects: { energy: 28, calm: 85, focus: 28, body: 90, anxietyRisk: 18 }
  },

  "purple-afghan": {
    id: "purple-afghan",
    name: "Purple Afghan",
    thc: 17,
    cbd: 0.2,
    terpenes: { myrcene: 0.58, limonene: 0.13, caryophyllene: 0.34, pinene: 0.05, humulene: 0.2, linalool: 0.17, terpinolene: 0.02 },
    effects: { energy: 25, calm: 90, focus: 25, body: 95, anxietyRisk: 14 }
  },

  "black-domina": {
    id: "black-domina",
    name: "Black Domina",
    thc: 20,
    cbd: 0.05,
    terpenes: { myrcene: 0.6, limonene: 0.1, caryophyllene: 0.4, pinene: 0.04, humulene: 0.25, linalool: 0.18, terpinolene: 0.01 },
    effects: { energy: 22, calm: 92, focus: 20, body: 96, anxietyRisk: 12 }
  },

  "critical-mass": {
    id: "critical-mass",
    name: "Critical Mass",
    thc: 16,
    cbd: 0.25,
    terpenes: { myrcene: 0.5, limonene: 0.15, caryophyllene: 0.3, pinene: 0.08, humulene: 0.15, linalool: 0.14, terpinolene: 0.03 },
    effects: { energy: 30, calm: 78, focus: 32, body: 82, anxietyRisk: 16 }
  },

  "blueberry": {
    id: "blueberry",
    name: "Blueberry",
    thc: 17,
    cbd: 0.15,
    terpenes: { myrcene: 0.48, limonene: 0.18, caryophyllene: 0.25, pinene: 0.1, humulene: 0.12, linalool: 0.16, terpinolene: 0.05 },
    effects: { energy: 38, calm: 75, focus: 40, body: 78, anxietyRisk: 20 }
  },

  "purple-kush": {
    id: "purple-kush",
    name: "Purple Kush",
    thc: 18,
    cbd: 0.1,
    terpenes: { myrcene: 0.6, limonene: 0.12, caryophyllene: 0.35, pinene: 0.04, humulene: 0.22, linalool: 0.18, terpinolene: 0.02 },
    effects: { energy: 25, calm: 90, focus: 22, body: 95, anxietyRisk: 14 }
  },

  "mendo-breath": {
    id: "mendo-breath",
    name: "Mendo Breath",
    thc: 21,
    cbd: 0.05,
    terpenes: { myrcene: 0.5, limonene: 0.2, caryophyllene: 0.4, pinene: 0.06, humulene: 0.2, linalool: 0.15, terpinolene: 0.03 },
    effects: { energy: 35, calm: 80, focus: 35, body: 88, anxietyRisk: 22 }
  },

  "golden-goat": {
    id: "golden-goat",
    name: "Golden Goat",
    thc: 19,
    cbd: 0.05,
    terpenes: { myrcene: 0.25, limonene: 0.35, caryophyllene: 0.15, pinene: 0.3, humulene: 0.1, linalool: 0.04, terpinolene: 0.45 },
    effects: { energy: 88, calm: 32, focus: 82, body: 28, anxietyRisk: 42 }
  },

  "ghost-train-haze": {
    id: "ghost-train-haze",
    name: "Ghost Train Haze",
    thc: 24,
    cbd: 0.05,
    terpenes: { myrcene: 0.2, limonene: 0.38, caryophyllene: 0.12, pinene: 0.42, humulene: 0.08, linalool: 0.03, terpinolene: 0.5 },
    effects: { energy: 95, calm: 20, focus: 88, body: 18, anxietyRisk: 55 }
  },

  "chocolope": {
    id: "chocolope",
    name: "Chocolope",
    thc: 18,
    cbd: 0.1,
    terpenes: { myrcene: 0.22, limonene: 0.3, caryophyllene: 0.12, pinene: 0.35, humulene: 0.1, linalool: 0.04, terpinolene: 0.48 },
    effects: { energy: 85, calm: 30, focus: 80, body: 25, anxietyRisk: 45 }
  },

  "jack-skellington": {
    id: "jack-skellington",
    name: "Jack Skellington",
    thc: 20,
    cbd: 0.05,
    terpenes: { myrcene: 0.28, limonene: 0.32, caryophyllene: 0.15, pinene: 0.38, humulene: 0.1, linalool: 0.04, terpinolene: 0.42 },
    effects: { energy: 90, calm: 28, focus: 85, body: 22, anxietyRisk: 48 }
  },

  "lemon-skunk": {
    id: "lemon-skunk",
    name: "Lemon Skunk",
    thc: 19,
    cbd: 0.1,
    terpenes: { myrcene: 0.25, limonene: 0.45, caryophyllene: 0.18, pinene: 0.3, humulene: 0.1, linalool: 0.04, terpinolene: 0.38 },
    effects: { energy: 85, calm: 35, focus: 75, body: 30, anxietyRisk: 40 }
  },

  "super-silver-haze": {
    id: "super-silver-haze",
    name: "Super Silver Haze",
    thc: 23,
    cbd: 0.05,
    terpenes: { myrcene: 0.2, limonene: 0.42, caryophyllene: 0.15, pinene: 0.4, humulene: 0.1, linalool: 0.03, terpinolene: 0.48 },
    effects: { energy: 92, calm: 25, focus: 88, body: 22, anxietyRisk: 55 }
  },

  "thai-lights": {
    id: "thai-lights",
    name: "Thai Lights",
    thc: 18,
    cbd: 0.05,
    terpenes: { myrcene: 0.15, limonene: 0.3, caryophyllene: 0.1, pinene: 0.5, humulene: 0.08, linalool: 0.03, terpinolene: 0.55 },
    effects: { energy: 93, calm: 20, focus: 90, body: 18, anxietyRisk: 60 }
  },

  "orange-creamsicle": {
    id: "orange-creamsicle",
    name: "Orange Creamsicle",
    thc: 20,
    cbd: 0.1,
    terpenes: { myrcene: 0.3, limonene: 0.5, caryophyllene: 0.2, pinene: 0.25, humulene: 0.1, linalool: 0.06, terpinolene: 0.3 },
    effects: { energy: 75, calm: 45, focus: 70, body: 40, anxietyRisk: 35 }
  },

  "pineapple-fields": {
    id: "pineapple-fields",
    name: "Pineapple Fields",
    thc: 19,
    cbd: 0.1,
    terpenes: { myrcene: 0.28, limonene: 0.4, caryophyllene: 0.15, pinene: 0.3, humulene: 0.1, linalool: 0.05, terpinolene: 0.35 },
    effects: { energy: 80, calm: 40, focus: 75, body: 35, anxietyRisk: 38 }
  }
};

// HARD ENFORCEMENT: Must have at least 40 strains
if (Object.keys(STRAIN_LIBRARY).length < 40) {
  throw new Error(`STRAIN_LIBRARY MUST CONTAIN AT LEAST 40 STRAINS. Found: ${Object.keys(STRAIN_LIBRARY).length}`);
}
