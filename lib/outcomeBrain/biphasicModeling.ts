/**
 * Biphasic & Hormetic Modeling Layer
 * 
 * Explicit dose-dependent effect modeling for terpenes and cannabinoids.
 * Tracks inflection points where effects reverse or destabilize.
 * 
 * This is an additive layer on top of existing terpene scoring.
 */

import { CanonicalCultivar } from '@/data/canonicalCultivars';
import { OutcomeIntent } from '../engine_core/legacy_compat';

export interface DoseZone {
  name: string;
  min: number;
  max: number;
  effectType: 'primary' | 'secondary' | 'paradoxical';
  description: string;
}

export interface TerpeneDoseModel {
  terpeneName: string;
  zones: DoseZone[];
  inflectionPoint: number; // Point where effects shift
}

export interface BlendDoseAnalysis {
  aggregateTerpenes: { [terpeneName: string]: number };
  zoneCrossings: Array<{
    terpene: string;
    fromZone: string;
    toZone: string;
    aggregateValue: number;
  }>;
  paradoxicalZones: string[];
  secondaryZones: string[];
}

/**
 * Define dose-dependent zones for key terpenes
 * These are explicit, not hidden in scoring functions
 */
const TERPENE_DOSE_MODELS: TerpeneDoseModel[] = [
  {
    terpeneName: 'myrcene',
    inflectionPoint: 0.35,
    zones: [
      { name: 'low', min: 0, max: 0.15, effectType: 'primary', description: 'Subtle calming, minimal sedation' },
      { name: 'mid', min: 0.15, max: 0.30, effectType: 'primary', description: 'Moderate relaxation, body ease' },
      { name: 'high', min: 0.30, max: 0.40, effectType: 'secondary', description: 'Strong sedation, couch-lock potential' },
      { name: 'paradoxical', min: 0.40, max: 1.0, effectType: 'paradoxical', description: 'Sedation may reverse or destabilize' },
    ],
  },
  {
    terpeneName: 'limonene',
    inflectionPoint: 0.30,
    zones: [
      { name: 'low', min: 0, max: 0.12, effectType: 'primary', description: 'Subtle mood lift' },
      { name: 'mid', min: 0.12, max: 0.28, effectType: 'primary', description: 'Energizing, focused activation' },
      { name: 'high', min: 0.28, max: 0.40, effectType: 'secondary', description: 'Intense stimulation, potential anxiety' },
      { name: 'paradoxical', min: 0.40, max: 1.0, effectType: 'paradoxical', description: 'Overstimulation risk, potential reversal' },
    ],
  },
  {
    terpeneName: 'pinene',
    inflectionPoint: 0.28,
    zones: [
      { name: 'low', min: 0, max: 0.10, effectType: 'primary', description: 'Subtle alertness' },
      { name: 'mid', min: 0.10, max: 0.25, effectType: 'primary', description: 'Clear focus, mental clarity' },
      { name: 'high', min: 0.25, max: 0.35, effectType: 'secondary', description: 'Intense focus, potential tension' },
      { name: 'paradoxical', min: 0.35, max: 1.0, effectType: 'paradoxical', description: 'Cognitive overload, potential reversal' },
    ],
  },
  {
    terpeneName: 'linalool',
    inflectionPoint: 0.25,
    zones: [
      { name: 'low', min: 0, max: 0.08, effectType: 'primary', description: 'Subtle calming' },
      { name: 'mid', min: 0.08, max: 0.22, effectType: 'primary', description: 'Relaxation, stress relief' },
      { name: 'high', min: 0.22, max: 0.35, effectType: 'secondary', description: 'Strong sedation, drowsiness' },
      { name: 'paradoxical', min: 0.35, max: 1.0, effectType: 'paradoxical', description: 'Sedation may reverse or destabilize' },
    ],
  },
  {
    terpeneName: 'caryophyllene',
    inflectionPoint: 0.30,
    zones: [
      { name: 'low', min: 0, max: 0.12, effectType: 'primary', description: 'Subtle physical comfort' },
      { name: 'mid', min: 0.12, max: 0.25, effectType: 'primary', description: 'Physical relief, anti-inflammatory' },
      { name: 'high', min: 0.25, max: 0.40, effectType: 'secondary', description: 'Strong body effects, potential heaviness' },
      { name: 'paradoxical', min: 0.40, max: 1.0, effectType: 'paradoxical', description: 'Effects may destabilize' },
    ],
  },
  {
    terpeneName: 'terpinolene',
    inflectionPoint: 0.15,
    zones: [
      { name: 'low', min: 0, max: 0.05, effectType: 'primary', description: 'Subtle energizing' },
      { name: 'mid', min: 0.05, max: 0.12, effectType: 'primary', description: 'Uplifting, creative activation' },
      { name: 'high', min: 0.12, max: 0.25, effectType: 'secondary', description: 'Intense stimulation, potential anxiety' },
      { name: 'paradoxical', min: 0.25, max: 1.0, effectType: 'paradoxical', description: 'Overstimulation, potential reversal' },
    ],
  },
];

/**
 * Analyze aggregate terpene exposure in a blend
 * Identifies zone crossings and paradoxical regions
 */
export function analyzeBlendDoseZones(
  cultivars: CanonicalCultivar[],
  ratios: number[]
): BlendDoseAnalysis {
  // Compute aggregate terpene percentages
  const aggregateTerpenes: { [terpeneName: string]: number } = {};
  
  for (let i = 0; i < cultivars.length; i++) {
    const cultivar = cultivars[i];
    const ratio = ratios[i] / 100;
    
    for (const terpeneName of Object.keys(cultivar.terpenePercentages)) {
      if (!aggregateTerpenes[terpeneName]) {
        aggregateTerpenes[terpeneName] = 0;
      }
      aggregateTerpenes[terpeneName] += cultivar.terpenePercentages[terpeneName] * ratio;
    }
  }
  
  // Detect zone crossings
  const zoneCrossings: BlendDoseAnalysis['zoneCrossings'] = [];
  const paradoxicalZones: string[] = [];
  const secondaryZones: string[] = [];
  
  for (const model of TERPENE_DOSE_MODELS) {
    const aggregateValue = aggregateTerpenes[model.terpeneName] || 0;
    
    // Find which zone the aggregate value falls into
    let currentZone: DoseZone | null = null;
    for (const zone of model.zones) {
      if (aggregateValue >= zone.min && aggregateValue < zone.max) {
        currentZone = zone;
        break;
      }
    }
    
    if (currentZone) {
      if (currentZone.effectType === 'paradoxical') {
        paradoxicalZones.push(`${model.terpeneName} (${currentZone.name})`);
      } else if (currentZone.effectType === 'secondary') {
        secondaryZones.push(`${model.terpeneName} (${currentZone.name})`);
      }
      
      // Check if we crossed inflection point (from primary to secondary/paradoxical)
      if (aggregateValue >= model.inflectionPoint && currentZone.effectType !== 'primary') {
        zoneCrossings.push({
          terpene: model.terpeneName,
          fromZone: 'primary',
          toZone: currentZone.name,
          aggregateValue,
        });
      }
    }
  }
  
  return {
    aggregateTerpenes,
    zoneCrossings,
    paradoxicalZones,
    secondaryZones,
  };
}

/**
 * Get dose zone for a specific terpene value
 */
export function getDoseZone(terpeneName: string, value: number): DoseZone | null {
  const model = TERPENE_DOSE_MODELS.find(m => m.terpeneName === terpeneName);
  if (!model) return null;
  
  for (const zone of model.zones) {
    if (value >= zone.min && value < zone.max) {
      return zone;
    }
  }
  
  return null;
}










