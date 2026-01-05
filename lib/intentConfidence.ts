/**
 * Intent Confidence Computation
 * 
 * Hard clarification gate - computes confidence scores and enforces threshold.
 * No heuristics, no vibes - only hard numbers.
 */

import { StrategicGuidance, ClarificationQuestion } from './strategicGuidance';

export interface IntentConfidence {
  energy: number;      // 0–1
  intensity: number;  // 0–1
  anxiety: number;    // 0–1
  duration: number;   // 0–1
  overall: number;    // 0–1
}

// HARD THRESHOLD: Only ask if confidence is genuinely low
// If energy AND anxiety are known (most critical), proceed regardless
const CLARIFICATION_THRESHOLD = 0.70;

/**
 * Compute intent confidence from strategic guidance
 * STRICT MODE: If ANY indicator is present, mark axis as known (1.0)
 * Only mark as unknown if truly absent
 */
export function computeIntentConfidence(guidance: StrategicGuidance): IntentConfidence {
  // Energy confidence: based on clear energy/calm indicators
  // Expanded keywords to catch more expressions
  const energyKeywords = [
    'energy', 'energizing', 'stimulation', 'alert', 'active', 'upbeat', 'social', 
    'creative', 'chatty', 'focused', 'clear-headed', 'mental clarity', 'clarity',
    'sharp', 'awake', 'engaged', 'conversational', 'talkative'
  ];
  const calmKeywords = [
    'calm', 'relaxed', 'chill', 'wind down', 'rest', 'sleep', 'sedation',
    'mellow', 'peaceful', 'tranquil', 'soothing', 'gentle'
  ];
  
  // Check both priorities and avoidances (e.g., "don't want to feel dumb" = cognitive clarity need)
  const allText = [
    ...guidance.dominantPriorities,
    ...guidance.strictAvoidances,
    ...guidance.acceptableTradeoffs,
  ].join(' ').toLowerCase();
  
  const hasEnergy = energyKeywords.some(k => allText.includes(k));
  const hasCalm = calmKeywords.some(k => allText.includes(k));
  
  // If user expressed either energy or calm preference, mark as known
  const energyKnown = hasEnergy || hasCalm ? 1.0 : 0.2; // Very low if neither
  
  // Intensity confidence: based on endurance vs intensity indicators
  const intensityKeywords = ['intensity', 'peak', 'strong', 'powerful', 'potent', 'heavy'];
  const enduranceKeywords = ['endurance', 'sustained', 'stability', 'consistent', 'steady', 'duration', 'long'];
  const gentleKeywords = ['gentle', 'subtle', 'light', 'mild', 'moderate'];
  
  const hasIntensity = intensityKeywords.some(k => allText.includes(k));
  const hasEndurance = enduranceKeywords.some(k => allText.includes(k));
  const hasGentle = gentleKeywords.some(k => allText.includes(k));
  
  // If user expressed any intensity preference, mark as known
  const intensityKnown = hasIntensity || hasEndurance || hasGentle ? 1.0 : 0.3;
  
  // Anxiety confidence: based on explicit anxiety avoidance OR cognitive clarity needs
  const anxietyKeywords = [
    'anxiety', 'paranoia', 'overwhelming', 'too strong', 'jittery', 'nervous',
    'worried', 'uncomfortable'
  ];
  const cognitiveClarityKeywords = [
    'dumb', 'can\'t get words out', 'mental fog', 'brain fog', 'fuzzy',
    'clear-headed', 'mental clarity', 'sharp', 'focused', 'cognitive',
    'verbal', 'conversational', 'articulate'
  ];
  
  const hasAnxietyAvoidance = anxietyKeywords.some(k => allText.includes(k));
  const hasCognitiveClarityNeed = cognitiveClarityKeywords.some(k => allText.includes(k));
  
  // If user expressed anxiety avoidance OR cognitive clarity need, mark as known
  const anxietyKnown = hasAnxietyAvoidance || hasCognitiveClarityNeed ? 1.0 : 0.4;
  
  // Duration confidence: based on temporal profile and duration indicators
  const durationKeywords = ['duration', 'long', 'short', 'quick', 'sustained', 'hours', 'minutes'];
  const temporalKeywords = ['start', 'beginning', 'later', 'end', 'after', 'during', 'throughout'];
  const hasDuration = durationKeywords.some(k => allText.includes(k));
  const hasTemporal = temporalKeywords.some(k => allText.includes(k));
  const hasTemporalProfile = guidance.temporalProfile === 'multi-phase';
  
  // Duration is less critical - if not specified, we can proceed with default
  const durationKnown = hasDuration || hasTemporal || hasTemporalProfile ? 1.0 : 0.7; // Higher default
  
  // Overall confidence: weighted average (anxiety and energy are most critical)
  // If energy AND anxiety are known, we have enough to proceed
  const criticalAxesKnown = (energyKnown >= 0.8 && anxietyKnown >= 0.8) ? 1.0 : 0.0;
  const overall = criticalAxesKnown > 0 
    ? Math.max(criticalAxesKnown, (energyKnown + intensityKnown + anxietyKnown + durationKnown) / 4)
    : (energyKnown + intensityKnown + anxietyKnown + durationKnown) / 4;
  
  return {
    energy: energyKnown,
    intensity: intensityKnown,
    anxiety: anxietyKnown,
    duration: durationKnown,
    overall,
  };
}

/**
 * Filter out redundant clarification questions
 * Removes questions that restate already-expressed preferences
 * 
 * STRICT FILTERING: If axis confidence >= 0.6, question is FORBIDDEN
 */
export function filterRedundantQuestions(
  questions: ClarificationQuestion[],
  confidence: IntentConfidence
): ClarificationQuestion[] {
  return questions.filter(question => {
    const questionText = question.question.toLowerCase();
    
    // Check if question axis already has high confidence
    switch (question.type) {
      case 'tradeoff':
        // If energy confidence is high, don't ask energy vs calm
        if (confidence.energy >= 0.6) {
          if (questionText.includes('energy') || questionText.includes('calm') || 
              questionText.includes('relaxation') || questionText.includes('energized')) {
            return false; // FORBIDDEN - redundant
          }
        }
        // If anxiety confidence is high, don't ask anxiety-related questions
        if (confidence.anxiety >= 0.6) {
          if (questionText.includes('anxiety') || questionText.includes('overwhelming') ||
              questionText.includes('mental') || questionText.includes('cognitive') ||
              questionText.includes('clear') || questionText.includes('fog')) {
            return false; // FORBIDDEN - redundant
          }
        }
        break;
      
      case 'tolerance':
        // If intensity confidence is high, don't ask about intensity preferences
        if (confidence.intensity >= 0.6) {
          if (questionText.includes('gentle') || questionText.includes('stronger') || 
              questionText.includes('peak') || questionText.includes('intensity') ||
              questionText.includes('steady') || questionText.includes('sustained')) {
            return false; // FORBIDDEN - redundant
          }
        }
        break;
      
      case 'priority':
        // If overall confidence is high, don't ask priority questions
        if (confidence.overall >= 0.65) {
          return false; // FORBIDDEN - redundant
        }
        break;
      
      case 'temporal':
        // If duration confidence is high, don't ask temporal questions
        if (confidence.duration >= 0.6) {
          if (questionText.includes('start') || questionText.includes('later') ||
              questionText.includes('beginning') || questionText.includes('end') ||
              questionText.includes('duration') || questionText.includes('when')) {
            return false; // FORBIDDEN - redundant
          }
        }
        break;
    }
    
    // Additional checks: filter questions that contradict expressed preferences
    // If user said "relaxed but clear", don't ask "relaxation or energy"
    if (confidence.energy >= 0.8 && confidence.anxiety >= 0.8) {
      // Both energy direction and anxiety avoidance are clear - no tradeoff questions
      if (question.type === 'tradeoff') {
        return false; // FORBIDDEN
      }
    }
    
    return true; // Keep question only if it passed all filters
  });
}

/**
 * Hard clarification gate
 * Returns true ONLY if confidence is below threshold
 * 
 * CRITICAL RULE: If energy AND anxiety are known (>= 0.8), NEVER ask questions
 * These are the two most critical axes - if both are clear, proceed immediately
 */
export function shouldClarify(confidence: IntentConfidence): boolean {
  // If critical axes (energy + anxiety) are known, proceed immediately
  if (confidence.energy >= 0.8 && confidence.anxiety >= 0.8) {
    return false; // DO NOT ASK - proceed to resolution
  }
  
  // Otherwise, check overall threshold
  return confidence.overall < CLARIFICATION_THRESHOLD;
}

/**
 * Get clarification threshold (for display/debugging)
 */
export function getClarificationThreshold(): number {
  return CLARIFICATION_THRESHOLD;
}

