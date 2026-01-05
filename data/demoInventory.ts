/**
 * GO LINE — 40-STRAIN DEMO INVENTORY (NUMERIC, AVERAGED, PLAUSIBLE)
 * 
 * Deterministic inventory with numeric terpene data per strain.
 * All terpene values are % by weight and intentionally sum to realistic totals (≈1–3%).
 * 
 * Schema:
 * - id: string (unique identifier)
 * - name: string (display name)
 * - thc: number (%)
 * - cbd: number (%)
 * - terpenes: object with numeric values for each terpene (% by weight)
 */

export type Cultivar = {
  id: string;
  name: string;
  thc: number;        // %
  cbd: number;        // %
  terpenes: {
    myrcene: number;
    limonene: number;
    caryophyllene: number;
    pinene: number;
    linalool: number;
    humulene: number;
    terpinolene: number;
  };
};

export const demoInventory: Cultivar[] = [
  { "id":"blue-dream","name":"Blue Dream","thc":18,"cbd":0.1,
    "terpenes":{"myrcene":0.45,"limonene":0.28,"caryophyllene":0.12,"pinene":0.22,"linalool":0.05,"humulene":0.08,"terpinolene":0.30}},
  { "id":"zkittlez","name":"Zkittlez","thc":16,"cbd":0.2,
    "terpenes":{"myrcene":0.32,"limonene":0.40,"caryophyllene":0.18,"pinene":0.06,"linalool":0.12,"humulene":0.10,"terpinolene":0.15}},
  { "id":"sour-diesel","name":"Sour Diesel","thc":20,"cbd":0.1,
    "terpenes":{"myrcene":0.25,"limonene":0.45,"caryophyllene":0.15,"pinene":0.30,"linalool":0.03,"humulene":0.05,"terpinolene":0.60}},
  { "id":"gelato","name":"Gelato","thc":19,"cbd":0.1,
    "terpenes":{"myrcene":0.38,"limonene":0.22,"caryophyllene":0.25,"pinene":0.08,"linalool":0.14,"humulene":0.12,"terpinolene":0.10}},
  { "id":"jack-herer","name":"Jack Herer","thc":18,"cbd":0,
    "terpenes":{"myrcene":0.20,"limonene":0.35,"caryophyllene":0.18,"pinene":0.32,"linalool":0.02,"humulene":0.05,"terpinolene":0.55}},
  { "id":"og-kush","name":"OG Kush","thc":21,"cbd":0.1,
    "terpenes":{"myrcene":0.48,"limonene":0.18,"caryophyllene":0.22,"pinene":0.10,"linalool":0.06,"humulene":0.15,"terpinolene":0.08}},
  { "id":"durban-poison","name":"Durban Poison","thc":17,"cbd":0,
    "terpenes":{"myrcene":0.15,"limonene":0.30,"caryophyllene":0.12,"pinene":0.35,"linalool":0.01,"humulene":0.04,"terpinolene":0.75}},
  { "id":"granddaddy-purple","name":"Granddaddy Purple","thc":17,"cbd":0.1,
    "terpenes":{"myrcene":0.60,"limonene":0.12,"caryophyllene":0.20,"pinene":0.05,"linalool":0.18,"humulene":0.10,"terpinolene":0.05}},
  { "id":"wedding-cake","name":"Wedding Cake","thc":22,"cbd":0,
    "terpenes":{"myrcene":0.42,"limonene":0.20,"caryophyllene":0.30,"pinene":0.07,"linalool":0.10,"humulene":0.15,"terpinolene":0.05}},
  { "id":"pineapple-express","name":"Pineapple Express","thc":19,"cbd":0.1,
    "terpenes":{"myrcene":0.30,"limonene":0.38,"caryophyllene":0.14,"pinene":0.20,"linalool":0.04,"humulene":0.08,"terpinolene":0.45}},

  { "id":"white-widow","name":"White Widow","thc":18,"cbd":0.1,
    "terpenes":{"myrcene":0.35,"limonene":0.25,"caryophyllene":0.20,"pinene":0.15,"linalool":0.05,"humulene":0.10,"terpinolene":0.20}},
  { "id":"green-crack","name":"Green Crack","thc":20,"cbd":0,
    "terpenes":{"myrcene":0.18,"limonene":0.40,"caryophyllene":0.10,"pinene":0.30,"linalool":0.02,"humulene":0.05,"terpinolene":0.60}},
  { "id":"trainwreck","name":"Trainwreck","thc":19,"cbd":0,
    "terpenes":{"myrcene":0.25,"limonene":0.35,"caryophyllene":0.15,"pinene":0.28,"linalool":0.03,"humulene":0.06,"terpinolene":0.50}},
  { "id":"ak-47","name":"AK-47","thc":17,"cbd":0.1,
    "terpenes":{"myrcene":0.40,"limonene":0.22,"caryophyllene":0.25,"pinene":0.12,"linalool":0.06,"humulene":0.10,"terpinolene":0.08}},
  { "id":"lemon-haze","name":"Lemon Haze","thc":18,"cbd":0,
    "terpenes":{"myrcene":0.20,"limonene":0.55,"caryophyllene":0.10,"pinene":0.18,"linalool":0.02,"humulene":0.04,"terpinolene":0.65}},
  { "id":"super-silver-haze","name":"Super Silver Haze","thc":19,"cbd":0,
    "terpenes":{"myrcene":0.22,"limonene":0.38,"caryophyllene":0.14,"pinene":0.30,"linalool":0.02,"humulene":0.05,"terpinolene":0.70}},
  { "id":"do-si-dos","name":"Do-Si-Dos","thc":21,"cbd":0,
    "terpenes":{"myrcene":0.44,"limonene":0.18,"caryophyllene":0.32,"pinene":0.06,"linalool":0.12,"humulene":0.14,"terpinolene":0.04}},
  { "id":"runtz","name":"Runtz","thc":19,"cbd":0,
    "terpenes":{"myrcene":0.35,"limonene":0.33,"caryophyllene":0.22,"pinene":0.08,"linalool":0.10,"humulene":0.12,"terpinolene":0.06}},
  { "id":"slurricane","name":"Slurricane","thc":20,"cbd":0,
    "terpenes":{"myrcene":0.50,"limonene":0.15,"caryophyllene":0.30,"pinene":0.05,"linalool":0.14,"humulene":0.12,"terpinolene":0.03}},
  { "id":"mimosa","name":"Mimosa","thc":18,"cbd":0,
    "terpenes":{"myrcene":0.28,"limonene":0.45,"caryophyllene":0.12,"pinene":0.20,"linalool":0.04,"humulene":0.06,"terpinolene":0.55}},

  { "id":"animal-mints","name":"Animal Mints","thc":22,"cbd":0,
    "terpenes":{"myrcene":0.46,"limonene":0.16,"caryophyllene":0.34,"pinene":0.06,"linalool":0.10,"humulene":0.15,"terpinolene":0.02}},
  { "id":"tangie","name":"Tangie","thc":17,"cbd":0,
    "terpenes":{"myrcene":0.22,"limonene":0.60,"caryophyllene":0.08,"pinene":0.18,"linalool":0.02,"humulene":0.04,"terpinolene":0.80}},
  { "id":"purple-punch","name":"Purple Punch","thc":18,"cbd":0.1,
    "terpenes":{"myrcene":0.55,"limonene":0.14,"caryophyllene":0.28,"pinene":0.04,"linalool":0.20,"humulene":0.10,"terpinolene":0.02}},
  { "id":"mac-1","name":"MAC 1","thc":21,"cbd":0,
    "terpenes":{"myrcene":0.36,"limonene":0.26,"caryophyllene":0.24,"pinene":0.12,"linalool":0.08,"humulene":0.14,"terpinolene":0.07}},
  { "id":"strawberry-cough","name":"Strawberry Cough","thc":17,"cbd":0,
    "terpenes":{"myrcene":0.30,"limonene":0.34,"caryophyllene":0.16,"pinene":0.22,"linalool":0.04,"humulene":0.06,"terpinolene":0.50}},
  { "id":"chemdawg","name":"Chemdawg","thc":20,"cbd":0,
    "terpenes":{"myrcene":0.40,"limonene":0.20,"caryophyllene":0.30,"pinene":0.10,"linalool":0.05,"humulene":0.14,"terpinolene":0.06}},
  { "id":"banana-kush","name":"Banana Kush","thc":18,"cbd":0,
    "terpenes":{"myrcene":0.48,"limonene":0.22,"caryophyllene":0.20,"pinene":0.08,"linalool":0.10,"humulene":0.12,"terpinolene":0.04}},
  { "id":"gsc","name":"Girl Scout Cookies","thc":19,"cbd":0,
    "terpenes":{"myrcene":0.42,"limonene":0.20,"caryophyllene":0.32,"pinene":0.06,"linalool":0.12,"humulene":0.15,"terpinolene":0.03}}
];

// Validation: Ensure all cultivars have required terpenes
demoInventory.forEach((cultivar, idx) => {
  const requiredTerpenes = ['myrcene', 'limonene', 'caryophyllene', 'pinene', 'linalool', 'humulene', 'terpinolene'];
  const missing = requiredTerpenes.filter(t => !(t in cultivar.terpenes));
  if (missing.length > 0) {
    console.warn(`[DEMO_INVENTORY] Cultivar ${idx} (${cultivar.name}) missing terpenes: ${missing.join(', ')}`);
  }
});

console.debug(`[DEMO_INVENTORY] Loaded ${demoInventory.length} cultivars with numeric terpene data`);

/**
 * Convert Cultivar format to CanonicalChemotype format for resolver compatibility
 * This adapter allows the resolver to use the simpler Cultivar schema
 */
import { type CanonicalChemotype } from './canonicalChemotypes';

export function convertCultivarToChemotype(cultivar: Cultivar): CanonicalChemotype {
  // Calculate total terpene load
  const totalTerpeneLoad = Object.values(cultivar.terpenes).reduce((sum, val) => sum + val, 0);
  
  // Infer volatility and sedation risk from terpene profile
  // High terpinolene/limonene = high volatility
  // High myrcene/linalool = higher sedation risk
  const volatility = (cultivar.terpenes.terpinolene > 0.5 || cultivar.terpenes.limonene > 0.4) 
    ? "high" 
    : (cultivar.terpenes.pinene > 0.25 || cultivar.terpenes.limonene > 0.3)
    ? "medium"
    : "low";
  
  const sedationRisk = (cultivar.terpenes.myrcene > 0.5 || cultivar.terpenes.linalool > 0.15)
    ? "high"
    : (cultivar.terpenes.myrcene > 0.35 || cultivar.terpenes.linalool > 0.1)
    ? "medium"
    : "low";
  
  return {
    id: cultivar.id,
    displayName: cultivar.name,
    description: `${cultivar.name} - ${cultivar.thc}% THC, ${cultivar.cbd}% CBD`,
    cannabinoids: {
      THC: cultivar.thc,
      CBD: cultivar.cbd,
    },
    terpenes: {
      myrcene: cultivar.terpenes.myrcene,
      limonene: cultivar.terpenes.limonene,
      caryophyllene: cultivar.terpenes.caryophyllene,
      pinene: cultivar.terpenes.pinene,
      linalool: cultivar.terpenes.linalool,
      humulene: cultivar.terpenes.humulene,
      terpinolene: cultivar.terpenes.terpinolene,
    },
    totalTerpeneLoad: totalTerpeneLoad,
    volatility: volatility,
    sedationRisk: sedationRisk,
    dataConfidence: "canonical",
    inventoryType: "demo_rich",
  };
}

/**
 * Convert entire demo inventory to CanonicalChemotype array
 * This is the primary inventory source for the deterministic resolver
 */
export function getDemoInventoryAsChemotypes(): CanonicalChemotype[] {
  return demoInventory.map(convertCultivarToChemotype);
}

