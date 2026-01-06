/**
 * Guidance to Intent Translator
 * 
 * Converts StrategicGuidance (from LLM) into OutcomeIntent (for deterministic engine).
 * This is where strategic reasoning is translated into numeric constraints.
 * 
 * The LLM provides strategy and priorities.
 * This function translates that into bounded numeric ranges for the engine.
 */

import { StrategicGuidance, ClarificationQuestion } from './strategicGuidance';
import { OutcomeIntent } from './goOutcomeEngine';

/**
 * Convert strategic guidance to numeric intent constraints
 * This is a deterministic translation layer - no LLM involved
 */
export function translateGuidanceToIntent(
  guidance: StrategicGuidance,
  clarifications?: Record<string, string | string[]>
): OutcomeIntent {
  // Helper: Map priority strings to numeric ranges
  const getActivationFromPriorities = (priorities: string[]): number => {
    const energyKeywords = ['energy', 'energizing', 'stimulation', 'alert', 'active', 'upbeat', 'social'];
    const calmKeywords = ['calm', 'relaxed', 'chill', 'wind down', 'rest'];
    
    const hasEnergy = priorities.some(p => energyKeywords.some(k => p.toLowerCase().includes(k)));
    const hasCalm = priorities.some(p => calmKeywords.some(k => p.toLowerCase().includes(k)));
    
    if (hasEnergy && !hasCalm) return 0.75;
    if (hasCalm && !hasEnergy) return 0.35;
    if (hasEnergy && hasCalm) return 0.55;
    return 0.5; // balanced default
  };

  const getAnxietySensitivityFromAvoidances = (avoidances: string[]): number => {
    const anxietyKeywords = ['anxiety', 'paranoia', 'overwhelming', 'too strong'];
    const hasAnxietyAvoidance = avoidances.some(a => anxietyKeywords.some(k => a.toLowerCase().includes(k)));
    return hasAnxietyAvoidance ? 0.65 : 0.4;
  };

  const getCognitiveEnduranceFromPriorities = (priorities: string[]): number => {
    const enduranceKeywords = ['endurance', 'sustained', 'stability', 'consistent', 'steady'];
    const intensityKeywords = ['peak', 'intense', 'strong', 'powerful'];
    
    const hasEndurance = priorities.some(p => enduranceKeywords.some(k => p.toLowerCase().includes(k)));
    const hasIntensity = priorities.some(p => intensityKeywords.some(k => p.toLowerCase().includes(k)));
    
    if (hasEndurance && !hasIntensity) return 0.7;
    if (hasIntensity && !hasEndurance) return 0.3;
    return 0.5;
  };

  // Apply clarifications if provided
  let resolvedPriorities = [...guidance.dominantPriorities];
  let resolvedAvoidances = [...guidance.strictAvoidances];

  if (clarifications) {
    // Handle temporal clarification
    const temporal = clarifications.temporal;
    if (temporal) {
      const temporalValue = Array.isArray(temporal) ? temporal[0] : temporal;
      if (temporalValue === 'Later' || temporalValue === 'Both') {
        resolvedPriorities.push('later phase focus');
      }
    }

    // Handle tradeoff clarification (can be string or string[])
    const tradeoff = clarifications.tradeoff;
    if (tradeoff) {
      const tradeoffArray = Array.isArray(tradeoff) ? tradeoff : [tradeoff];
      if (tradeoffArray.some(t => t.includes('energized') || t.includes('energy'))) {
        resolvedPriorities.push('energy');
      } else if (tradeoffArray.some(t => t.includes('anxiety'))) {
        resolvedAvoidances.push('anxiety');
      }
    }

    // Handle tolerance clarification
    const tolerance = clarifications.tolerance;
    if (tolerance) {
      const toleranceArray = Array.isArray(tolerance) ? tolerance : [tolerance];
      if (toleranceArray.some(t => t.includes('Gentle') || t.includes('gentle'))) {
        resolvedPriorities.push('endurance');
      } else if (toleranceArray.some(t => t.includes('Stronger') || t.includes('stronger'))) {
        resolvedPriorities.push('peak');
      }
    }
  }

  // Generate numeric constraints from strategic guidance
  const activation = getActivationFromPriorities(resolvedPriorities);
  const anxietySensitivity = getAnxietySensitivityFromAvoidances(resolvedAvoidances);
  const cognitiveEndurance = getCognitiveEnduranceFromPriorities(resolvedPriorities);
  
  // Determine avoidSedation from avoidances and priorities
  const sedationKeywords = ['sedation', 'sleepy', 'drowsy', 'tired'];
  const alertKeywords = ['alert', 'awake', 'focused', 'energizing'];
  const hasSedationAvoidance = resolvedAvoidances.some(a => 
    sedationKeywords.some(k => a.toLowerCase().includes(k))
  );
  const hasAlertPriority = resolvedPriorities.some(p => 
    alertKeywords.some(k => p.toLowerCase().includes(k))
  );
  const avoidSedation = hasSedationAvoidance || hasAlertPriority;

  // Expanded dimensions: physical relief, cognitive clarity, functional energy, temporal profile
  const getPhysicalReliefFromPriorities = (priorities: string[]): number | undefined => {
    const physicalKeywords = ['physical', 'relief', 'comfort', 'body', 'ache', 'pain', 'tension', 'soreness'];
    const hasPhysical = priorities.some(p => physicalKeywords.some(k => p.toLowerCase().includes(k)));
    if (hasPhysical) return 0.7; // Moderate-high physical relief preference
    return undefined; // Not specified
  };

  const getCognitiveClarityFromPriorities = (priorities: string[]): number | undefined => {
    const clarityKeywords = ['clarity', 'clear', 'focus', 'mental', 'sharp', 'alert', 'brain fog'];
    const hasClarity = priorities.some(p => clarityKeywords.some(k => p.toLowerCase().includes(k)));
    if (hasClarity) return 0.75; // High cognitive clarity preference
    return undefined; // Not specified
  };

  const getFunctionalEnergyFromPriorities = (priorities: string[]): number | undefined => {
    const functionalKeywords = ['functional', 'sustained', 'productive', 'work', 'task', 'endurance', 'steady'];
    const intensityKeywords = ['peak', 'intense', 'strong', 'powerful', 'rush'];
    const hasFunctional = priorities.some(p => functionalKeywords.some(k => p.toLowerCase().includes(k)));
    const hasIntensity = priorities.some(p => intensityKeywords.some(k => p.toLowerCase().includes(k)));
    if (hasFunctional && !hasIntensity) return 0.7; // Prefer functional energy
    if (hasIntensity && !hasFunctional) return 0.3; // Prefer peak intensity
    return undefined; // Not specified or balanced
  };

  const getTemporalFromGuidance = (guidance: StrategicGuidance): { onset?: number; duration?: number } => {
    // Temporal profile from guidance (if multi-phase, prefer slower onset, longer duration)
    if (guidance.temporalProfile === 'multi-phase') {
      return { onset: 0.6, duration: 0.7 }; // Slower onset, longer duration for multi-phase
    }
    // Check priorities for temporal hints
    const onsetKeywords = ['fast', 'quick', 'immediate', 'rapid'];
    const durationKeywords = ['long', 'sustained', 'endurance', 'extended'];
    const hasFastOnset = guidance.dominantPriorities.some(p => 
      onsetKeywords.some(k => p.toLowerCase().includes(k))
    );
    const hasLongDuration = guidance.dominantPriorities.some(p => 
      durationKeywords.some(k => p.toLowerCase().includes(k))
    );
    return {
      onset: hasFastOnset ? 0.3 : undefined, // Faster onset preference
      duration: hasLongDuration ? 0.7 : undefined, // Longer duration preference
    };
  };

  const temporal = getTemporalFromGuidance(guidance);

  // Calculate overshootTolerance based on anxiety sensitivity and intensity preferences
  // Higher anxiety sensitivity = lower tolerance for overshooting
  // Preference for intensity/peak = higher tolerance
  const intensityKeywords = ['peak', 'intense', 'strong', 'powerful', 'rush'];
  const hasIntensityPreference = resolvedPriorities.some(p => 
    intensityKeywords.some(k => p.toLowerCase().includes(k))
  );
  const overshootTolerance = hasIntensityPreference 
    ? Math.max(0.4, 0.7 - (anxietySensitivity * 0.3)) // Higher tolerance if intensity preferred
    : Math.max(0.3, 0.6 - (anxietySensitivity * 0.4)); // Lower tolerance if balanced/gentle

  return {
    activation,
    activationTarget: activation, // Set activationTarget equal to activation
    anxietySensitivity,
    cognitiveEndurance,
    overshootTolerance,
    avoidSedation,
    physicalRelief: getPhysicalReliefFromPriorities(resolvedPriorities),
    cognitiveClarity: getCognitiveClarityFromPriorities(resolvedPriorities),
    functionalEnergy: getFunctionalEnergyFromPriorities(resolvedPriorities),
    temporalOnset: temporal.onset,
    temporalDuration: temporal.duration,
  };
}

