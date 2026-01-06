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

  const getOvershootToleranceFromFlags = (flags: string[], tradeoffs: string[]): number => {
    const overshootKeywords = ['overshoot', 'too much', 'overwhelming'];
    const gentleKeywords = ['gentle', 'gradual', 'subtle'];
    
    const hasOvershootRisk = flags.some(f => overshootKeywords.some(k => f.toLowerCase().includes(k)));
    const acceptsGentle = tradeoffs.some(t => gentleKeywords.some(k => t.toLowerCase().includes(k)));
    
    if (hasOvershootRisk) return 0.3;
    if (acceptsGentle) return 0.4;
    return 0.5;
  };

  // Apply clarifications if provided
  let resolvedPriorities = [...guidance.dominantPriorities];
  let resolvedAvoidances = [...guidance.strictAvoidances];
  let resolvedTradeoffs = [...guidance.acceptableTradeoffs];

  if (clarifications) {
    // Handle temporal clarification
    if (clarifications.temporal && guidance.temporalProfile === 'single-phase') {
      // If user clarified temporal intent, we may need to adjust
      if (clarifications.temporal === 'Later' || clarifications.temporal === 'Both') {
        // This would need multi-phase, but for now we'll adjust priorities
        resolvedPriorities.push('later phase focus');
      }
    }

    // Handle tradeoff clarification (sensitivities - multi-select array)
    if (clarifications.tradeoff) {
      const sensitivities = Array.isArray(clarifications.tradeoff) 
        ? clarifications.tradeoff 
        : [clarifications.tradeoff];
      
      // Apply cumulative penalties/weights for all selected sensitivities
      // Do NOT collapse, rank, or override - pass all through to resolver
      sensitivities.forEach(sensitivity => {
        if (sensitivity === 'Anxiety') {
          resolvedAvoidances.push('anxiety');
        } else if (sensitivity === 'Overstimulation') {
          resolvedAvoidances.push('overstimulation');
        } else if (sensitivity === 'Mental drift') {
          resolvedAvoidances.push('mental drift');
        } else if (sensitivity === 'energized') {
          resolvedPriorities.push('energy');
        }
        // "None / Balanced" is mutually exclusive - if present, don't add other avoidances
        // But we still process other sensitivities if they exist
      });
    }

    // Handle tolerance clarification
    if (clarifications.tolerance) {
      if (clarifications.tolerance.includes('Gentle')) {
        resolvedTradeoffs.push('gentle steady effect');
      } else if (clarifications.tolerance.includes('Stronger')) {
        resolvedPriorities.push('stronger peak');
      }
    }
  }

  // Generate numeric constraints from strategic guidance
  const baseIntent: OutcomeIntent = {
    activationTarget: getActivationFromPriorities(resolvedPriorities),
    anxietySensitivity: getAnxietySensitivityFromAvoidances(resolvedAvoidances),
    cognitiveEndurance: getCognitiveEnduranceFromPriorities(resolvedPriorities),
    overshootTolerance: getOvershootToleranceFromFlags(guidance.riskFlags, resolvedTradeoffs),
    temporalProfile: guidance.temporalProfile,
  };

  // Handle multi-phase if specified
  if (guidance.temporalProfile === 'multi-phase') {
    // For multi-phase, we generate separate intents for each phase
    // In a full implementation, the LLM would specify phase-specific guidance
    // For now, we create a balanced split
    baseIntent.phases = [
      {
        phase: 'Primary / Early',
        activationTarget: Math.min(1, baseIntent.activationTarget + 0.1),
        anxietySensitivity: baseIntent.anxietySensitivity,
        cognitiveEndurance: baseIntent.cognitiveEndurance,
        overshootTolerance: baseIntent.overshootTolerance,
      },
      {
        phase: 'Later / Wind-Down',
        activationTarget: Math.max(0, baseIntent.activationTarget - 0.2),
        anxietySensitivity: baseIntent.anxietySensitivity,
        cognitiveEndurance: baseIntent.cognitiveEndurance,
        overshootTolerance: baseIntent.overshootTolerance,
      },
    ];
  }

  return baseIntent;
}










