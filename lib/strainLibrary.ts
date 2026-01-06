/**
 * Canonical Strain Library
 * 
 * Authoritative source for strain-to-chemistry mapping.
 * ALL strain scoring and selection comes exclusively from this library.
 * 
 * MANDATORY: This library MUST contain exactly 40 strains.
 * If count is not 40, the application will throw an error.
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
  }
};

// HARD ENFORCEMENT: Must have exactly 40 strains
if (Object.keys(STRAIN_LIBRARY).length !== 40) {
  throw new Error(`STRAIN_LIBRARY MUST CONTAIN EXACTLY 40 STRAINS. Found: ${Object.keys(STRAIN_LIBRARY).length}`);
}
