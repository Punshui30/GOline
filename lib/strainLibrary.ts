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
  linalool: number;
  humulene: number;
};

export type Strain = {
  id: string;
  displayName: string;
  thc: number;
  cbd: number;
  terpenes: TerpeneProfile;
  effects: {
    energy: number;
    calm: number;
    focus: number;
    appetite: number;
    anxietyRisk: number;
  };
};

export const STRAIN_LIBRARY: Record<string, Strain> = {
  "blue-dream": {
    id: "blue-dream",
    displayName: "Blue Dream",
    thc: 18,
    cbd: 0.1,
    terpenes: { myrcene: 0.6, pinene: 0.3, caryophyllene: 0.2, limonene: 0.2, linalool: 0.05, humulene: 0.05 },
    effects: { energy: 70, calm: 40, focus: 65, appetite: 45, anxietyRisk: 35 }
  },

  "jack-herer": {
    id: "jack-herer",
    displayName: "Jack Herer",
    thc: 20,
    cbd: 0,
    terpenes: { pinene: 0.5, limonene: 0.25, caryophyllene: 0.25, myrcene: 0.1, linalool: 0.05, humulene: 0.05 },
    effects: { energy: 80, calm: 30, focus: 75, appetite: 30, anxietyRisk: 45 }
  },

  "durban-poison": {
    id: "durban-poison",
    displayName: "Durban Poison",
    thc: 21,
    cbd: 0,
    terpenes: { pinene: 0.4, limonene: 0.3, myrcene: 0.15, caryophyllene: 0.15, linalool: 0.05, humulene: 0.05 },
    effects: { energy: 90, calm: 20, focus: 85, appetite: 25, anxietyRisk: 55 }
  },

  "sour-diesel": {
    id: "sour-diesel",
    displayName: "Sour Diesel",
    thc: 22,
    cbd: 0,
    terpenes: { limonene: 0.4, caryophyllene: 0.3, myrcene: 0.2, pinene: 0.1, linalool: 0.05, humulene: 0.05 },
    effects: { energy: 85, calm: 25, focus: 70, appetite: 30, anxietyRisk: 50 }
  },

  "og-kush": {
    id: "og-kush",
    displayName: "OG Kush",
    thc: 20,
    cbd: 0,
    terpenes: { myrcene: 0.5, limonene: 0.3, caryophyllene: 0.2, pinene: 0.1, linalool: 0.1, humulene: 0.1 },
    effects: { energy: 55, calm: 70, focus: 50, appetite: 65, anxietyRisk: 40 }
  },

  "girl-scout-cookies": {
    id: "girl-scout-cookies",
    displayName: "Girl Scout Cookies",
    thc: 23,
    cbd: 0,
    terpenes: { caryophyllene: 0.4, limonene: 0.3, myrcene: 0.2, humulene: 0.1, pinene: 0.1, linalool: 0.05 },
    effects: { energy: 60, calm: 65, focus: 55, appetite: 70, anxietyRisk: 35 }
  },

  "gelato": {
    id: "gelato",
    displayName: "Gelato",
    thc: 24,
    cbd: 0,
    terpenes: { caryophyllene: 0.35, limonene: 0.25, myrcene: 0.25, linalool: 0.15, humulene: 0.1, pinene: 0.05 },
    effects: { energy: 60, calm: 70, focus: 55, appetite: 65, anxietyRisk: 30 }
  },

  "wedding-cake": {
    id: "wedding-cake",
    displayName: "Wedding Cake",
    thc: 25,
    cbd: 0,
    terpenes: { caryophyllene: 0.4, limonene: 0.3, linalool: 0.2, myrcene: 0.15, humulene: 0.1, pinene: 0.05 },
    effects: { energy: 50, calm: 80, focus: 45, appetite: 75, anxietyRisk: 25 }
  },

  "zkittlez": {
    id: "zkittlez",
    displayName: "Zkittlez",
    thc: 19,
    cbd: 0.1,
    terpenes: { limonene: 0.5, myrcene: 0.25, caryophyllene: 0.15, linalool: 0.1, humulene: 0.05, pinene: 0.05 },
    effects: { energy: 55, calm: 75, focus: 50, appetite: 80, anxietyRisk: 20 }
  },

  "pineapple-express": {
    id: "pineapple-express",
    displayName: "Pineapple Express",
    thc: 18,
    cbd: 0,
    terpenes: { limonene: 0.45, pinene: 0.3, myrcene: 0.2, caryophyllene: 0.15, linalool: 0.05, humulene: 0.05 },
    effects: { energy: 75, calm: 45, focus: 65, appetite: 55, anxietyRisk: 35 }
  },

  "green-crack": {
    id: "green-crack",
    displayName: "Green Crack",
    thc: 20,
    cbd: 0,
    terpenes: { myrcene: 0.4, pinene: 0.3, limonene: 0.2, caryophyllene: 0.1, linalool: 0.05, humulene: 0.05 },
    effects: { energy: 90, calm: 20, focus: 80, appetite: 40, anxietyRisk: 60 }
  },

  "super-lemon-haze": {
    id: "super-lemon-haze",
    displayName: "Super Lemon Haze",
    thc: 22,
    cbd: 0,
    terpenes: { limonene: 0.6, pinene: 0.2, myrcene: 0.15, caryophyllene: 0.15, linalool: 0.05, humulene: 0.05 },
    effects: { energy: 85, calm: 30, focus: 75, appetite: 35, anxietyRisk: 50 }
  },

  "granddaddy-purple": {
    id: "granddaddy-purple",
    displayName: "Granddaddy Purple",
    thc: 19,
    cbd: 0,
    terpenes: { myrcene: 0.6, caryophyllene: 0.25, pinene: 0.1, limonene: 0.1, linalool: 0.15, humulene: 0.1 },
    effects: { energy: 30, calm: 85, focus: 35, appetite: 80, anxietyRisk: 15 }
  },

  "northern-lights": {
    id: "northern-lights",
    displayName: "Northern Lights",
    thc: 18,
    cbd: 0,
    terpenes: { myrcene: 0.55, caryophyllene: 0.2, pinene: 0.15, limonene: 0.1, linalool: 0.15, humulene: 0.1 },
    effects: { energy: 35, calm: 80, focus: 40, appetite: 75, anxietyRisk: 20 }
  },

  "bubba-kush": {
    id: "bubba-kush",
    displayName: "Bubba Kush",
    thc: 20,
    cbd: 0,
    terpenes: { myrcene: 0.5, caryophyllene: 0.3, pinene: 0.1, limonene: 0.1, linalool: 0.1, humulene: 0.1 },
    effects: { energy: 30, calm: 85, focus: 35, appetite: 80, anxietyRisk: 20 }
  },

  "la-confidential": {
    id: "la-confidential",
    displayName: "LA Confidential",
    thc: 21,
    cbd: 0,
    terpenes: { myrcene: 0.45, caryophyllene: 0.25, limonene: 0.15, pinene: 0.15, linalool: 0.1, humulene: 0.1 },
    effects: { energy: 40, calm: 75, focus: 45, appetite: 70, anxietyRisk: 25 }
  },

  "white-widow": {
    id: "white-widow",
    displayName: "White Widow",
    thc: 20,
    cbd: 0,
    terpenes: { myrcene: 0.35, pinene: 0.3, caryophyllene: 0.2, limonene: 0.2, linalool: 0.05, humulene: 0.05 },
    effects: { energy: 65, calm: 55, focus: 60, appetite: 50, anxietyRisk: 40 }
  },

  "ak-47": {
    id: "ak-47",
    displayName: "AK-47",
    thc: 21,
    cbd: 0,
    terpenes: { myrcene: 0.4, pinene: 0.25, limonene: 0.2, caryophyllene: 0.15, linalool: 0.05, humulene: 0.05 },
    effects: { energy: 70, calm: 50, focus: 65, appetite: 55, anxietyRisk: 45 }
  },

  "amnesia-haze": {
    id: "amnesia-haze",
    displayName: "Amnesia Haze",
    thc: 22,
    cbd: 0,
    terpenes: { limonene: 0.45, pinene: 0.25, myrcene: 0.15, caryophyllene: 0.15, linalool: 0.05, humulene: 0.05 },
    effects: { energy: 85, calm: 30, focus: 80, appetite: 35, anxietyRisk: 55 }
  },

  "trainwreck": {
    id: "trainwreck",
    displayName: "Trainwreck",
    thc: 20,
    cbd: 0,
    terpenes: { myrcene: 0.4, pinene: 0.3, limonene: 0.2, caryophyllene: 0.15, linalool: 0.05, humulene: 0.05 },
    effects: { energy: 80, calm: 35, focus: 70, appetite: 45, anxietyRisk: 50 }
  },

  "mac-1": {
    id: "mac-1",
    displayName: "MAC-1",
    thc: 23,
    cbd: 0,
    terpenes: { caryophyllene: 0.35, limonene: 0.3, myrcene: 0.2, linalool: 0.15, humulene: 0.1, pinene: 0.05 },
    effects: { energy: 60, calm: 65, focus: 55, appetite: 65, anxietyRisk: 30 }
  },

  "do-si-dos": {
    id: "do-si-dos",
    displayName: "Do-Si-Dos",
    thc: 24,
    cbd: 0,
    terpenes: { caryophyllene: 0.4, limonene: 0.25, myrcene: 0.2, linalool: 0.15, humulene: 0.1, pinene: 0.05 },
    effects: { energy: 55, calm: 75, focus: 50, appetite: 70, anxietyRisk: 25 }
  },

  "runtz": {
    id: "runtz",
    displayName: "Runtz",
    thc: 22,
    cbd: 0,
    terpenes: { limonene: 0.4, caryophyllene: 0.3, myrcene: 0.2, linalool: 0.1, humulene: 0.05, pinene: 0.05 },
    effects: { energy: 65, calm: 65, focus: 55, appetite: 70, anxietyRisk: 30 }
  },

  "animal-mints": {
    id: "animal-mints",
    displayName: "Animal Mints",
    thc: 24,
    cbd: 0,
    terpenes: { caryophyllene: 0.45, limonene: 0.25, myrcene: 0.15, linalool: 0.15, humulene: 0.1, pinene: 0.05 },
    effects: { energy: 55, calm: 75, focus: 50, appetite: 70, anxietyRisk: 25 }
  },

  "gelato-33": {
    id: "gelato-33",
    displayName: "Gelato #33",
    thc: 24,
    cbd: 0,
    terpenes: { caryophyllene: 0.35, limonene: 0.3, myrcene: 0.2, linalool: 0.15, humulene: 0.1, pinene: 0.05 },
    effects: { energy: 60, calm: 70, focus: 55, appetite: 65, anxietyRisk: 30 }
  },

  "sunset-sherbet": {
    id: "sunset-sherbet",
    displayName: "Sunset Sherbet",
    thc: 20,
    cbd: 0,
    terpenes: { limonene: 0.4, caryophyllene: 0.25, myrcene: 0.2, linalool: 0.15, humulene: 0.1, pinene: 0.05 },
    effects: { energy: 60, calm: 65, focus: 55, appetite: 65, anxietyRisk: 30 }
  },

  "mimosa": {
    id: "mimosa",
    displayName: "Mimosa",
    thc: 21,
    cbd: 0,
    terpenes: { limonene: 0.5, pinene: 0.25, myrcene: 0.15, caryophyllene: 0.1, linalool: 0.05, humulene: 0.05 },
    effects: { energy: 80, calm: 40, focus: 75, appetite: 45, anxietyRisk: 45 }
  },

  "clementine": {
    id: "clementine",
    displayName: "Clementine",
    thc: 19,
    cbd: 0,
    terpenes: { limonene: 0.55, pinene: 0.25, myrcene: 0.1, caryophyllene: 0.1, linalool: 0.05, humulene: 0.05 },
    effects: { energy: 85, calm: 35, focus: 80, appetite: 40, anxietyRisk: 50 }
  },

  "tangie": {
    id: "tangie",
    displayName: "Tangie",
    thc: 18,
    cbd: 0,
    terpenes: { limonene: 0.6, pinene: 0.2, myrcene: 0.1, caryophyllene: 0.1, linalool: 0.05, humulene: 0.05 },
    effects: { energy: 90, calm: 30, focus: 85, appetite: 35, anxietyRisk: 55 }
  },

  "strawberry-cough": {
    id: "strawberry-cough",
    displayName: "Strawberry Cough",
    thc: 20,
    cbd: 0,
    terpenes: { myrcene: 0.4, pinene: 0.3, limonene: 0.2, caryophyllene: 0.1, linalool: 0.05, humulene: 0.05 },
    effects: { energy: 75, calm: 45, focus: 65, appetite: 50, anxietyRisk: 45 }
  },

  "purple-punch": {
    id: "purple-punch",
    displayName: "Purple Punch",
    thc: 19,
    cbd: 0,
    terpenes: { myrcene: 0.5, caryophyllene: 0.25, limonene: 0.15, pinene: 0.1, linalool: 0.15, humulene: 0.1 },
    effects: { energy: 35, calm: 85, focus: 40, appetite: 80, anxietyRisk: 15 }
  },

  "ice-cream-cake": {
    id: "ice-cream-cake",
    displayName: "Ice Cream Cake",
    thc: 23,
    cbd: 0,
    terpenes: { caryophyllene: 0.4, limonene: 0.25, myrcene: 0.2, linalool: 0.15, humulene: 0.1, pinene: 0.05 },
    effects: { energy: 45, calm: 80, focus: 45, appetite: 75, anxietyRisk: 20 }
  },

  "forbidden-fruit": {
    id: "forbidden-fruit",
    displayName: "Forbidden Fruit",
    thc: 21,
    cbd: 0,
    terpenes: { limonene: 0.4, myrcene: 0.25, caryophyllene: 0.2, linalool: 0.15, humulene: 0.1, pinene: 0.05 },
    effects: { energy: 50, calm: 75, focus: 50, appetite: 70, anxietyRisk: 25 }
  },

  "skywalker-og": {
    id: "skywalker-og",
    displayName: "Skywalker OG",
    thc: 22,
    cbd: 0,
    terpenes: { myrcene: 0.45, caryophyllene: 0.25, limonene: 0.2, pinene: 0.15, linalool: 0.1, humulene: 0.1 },
    effects: { energy: 40, calm: 80, focus: 45, appetite: 75, anxietyRisk: 20 }
  },

  "afghan-kush": {
    id: "afghan-kush",
    displayName: "Afghan Kush",
    thc: 18,
    cbd: 0,
    terpenes: { myrcene: 0.6, caryophyllene: 0.25, pinene: 0.15, limonene: 0.1, linalool: 0.15, humulene: 0.1 },
    effects: { energy: 30, calm: 90, focus: 35, appetite: 85, anxietyRisk: 10 }
  }
};

// HARD ENFORCEMENT: Must have exactly 40 strains
if (Object.keys(STRAIN_LIBRARY).length !== 40) {
  throw new Error(`STRAIN_LIBRARY MUST CONTAIN EXACTLY 40 STRAINS. Found: ${Object.keys(STRAIN_LIBRARY).length}`);
}
