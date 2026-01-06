/**
 * Interaction & Saturation Analysis Layer
 * 
 * Measures signal density, dominance hierarchy, and saturation states.
 * Does NOT penalize or discard saturated outcomes - classifies them as distinct modes.
 * 
 * This is an additive layer that identifies, not judges, complexity.
 */

import { CanonicalCultivar } from '@/data/canonicalCultivars';
import { BlendDoseAnalysis } from './biphasicModeling';
import { OutcomeIntent } from '../goOutcomeEngine';

export interface SignalDensityAnalysis {
  totalActiveTerpenes: number; // Count of terpenes above threshold
  dominanceHierarchy: Array<{ terpene: string; percentage: number; dominance: number }>;
  dominantDriver: string | null; // Single terpene if >40% of total
  saturationLevel: 'low' | 'moderate' | 'high' | 'diffuse';
  saturationMode: 'focused' | 'balanced' | 'layered' | 'diffuse' | 'emergent';
  saturationDescription: string;
}

/**
 * Analyze signal density and dominance in a blend
 * Classifies saturation without value judgment
 */
export function analyzeSignalDensity(
  cultivars: CanonicalCultivar[],
  ratios: number[],
  doseAnalysis: BlendDoseAnalysis
): SignalDensityAnalysis {
  const aggregateTerpenes = doseAnalysis.aggregateTerpenes;
  
  // Count active terpenes (above 2% threshold)
  const ACTIVE_THRESHOLD = 0.02;
  const activeTerpenes = Object.entries(aggregateTerpenes)
    .filter(([_, value]) => value >= ACTIVE_THRESHOLD)
    .map(([name, value]) => ({ name, value }));
  
  // Compute total terpene percentage
  const totalTerpenePercentage = Object.values(aggregateTerpenes).reduce((sum, val) => sum + val, 0);
  
  // Build dominance hierarchy
  const hierarchy = activeTerpenes
    .map(({ name, value }) => ({
      terpene: name,
      percentage: value,
      dominance: totalTerpenePercentage > 0 ? value / totalTerpenePercentage : 0,
    }))
    .sort((a, b) => b.dominance - a.dominance);
  
  // Identify dominant driver (if any single terpene >40% of total)
  const dominantDriver = hierarchy.length > 0 && hierarchy[0].dominance > 0.4
    ? hierarchy[0].terpene
    : null;
  
  // Classify saturation level
  let saturationLevel: SignalDensityAnalysis['saturationLevel'];
  let saturationMode: SignalDensityAnalysis['saturationMode'];
  let saturationDescription: string;
  
  if (activeTerpenes.length <= 2 && dominantDriver) {
    saturationLevel = 'low';
    saturationMode = 'focused';
    saturationDescription = 'Single or dual terpene profile with clear dominant driver';
  } else if (activeTerpenes.length <= 4 && hierarchy[0]?.dominance > 0.25) {
    saturationLevel = 'moderate';
    saturationMode = 'balanced';
    saturationDescription = 'Multiple terpenes with primary driver and supporting compounds';
  } else if (activeTerpenes.length <= 6 && hierarchy[0]?.dominance > 0.15) {
    saturationLevel = 'high';
    saturationMode = 'layered';
    saturationDescription = 'Complex blend with layered terpene interactions, no single dominant driver';
  } else {
    saturationLevel = 'diffuse';
    saturationMode = activeTerpenes.length > 6 ? 'emergent' : 'diffuse';
    saturationDescription = activeTerpenes.length > 6
      ? 'Emergent profile: many compounds contribute meaningfully, effects are textural and multi-dimensional'
      : 'Diffuse signal density: many active compounds without clear hierarchy';
  }
  
  return {
    totalActiveTerpenes: activeTerpenes.length,
    dominanceHierarchy: hierarchy,
    dominantDriver,
    saturationLevel,
    saturationMode,
    saturationDescription,
  };
}

/**
 * Determine if a blend represents an intentional high-complexity outcome
 * These are advanced, "level-up" states that emerge from computation
 */
export function isIntentionalHighComplexity(
  saturationAnalysis: SignalDensityAnalysis,
  doseAnalysis: BlendDoseAnalysis,
  intent: OutcomeIntent
): boolean {
  // High complexity requires:
  // 1. Emergent or diffuse saturation mode
  // 2. Multiple secondary or paradoxical zones (indicating intentional crossing)
  // 3. User intent that supports exploration (not avoidance-heavy)
  
  const hasEmergentSaturation = saturationAnalysis.saturationMode === 'emergent' || 
                                 saturationAnalysis.saturationMode === 'diffuse';
  const hasMultipleZones = doseAnalysis.secondaryZones.length > 1 || 
                          doseAnalysis.paradoxicalZones.length > 0;
  const supportsExploration = !intent.anxietySensitivity || intent.anxietySensitivity < 0.7;
  
  return hasEmergentSaturation && hasMultipleZones && supportsExploration;
}










