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

const CLARIFICATION_THRESHOLD = 0.75;

/**
 * Compute intent confidence from strategic guidance
 */
export function computeIntentConfidence(guidance: StrategicGuidance): IntentConfidence {
  // Energy confidence: based on clear energy/calm indicators
  const energyKeywords = ['energy', 'energizing', 'stimulation', 'alert', 'active', 'upbeat', 'social', 'creative', 'chatty'];
  const calmKeywords = ['calm', 'relaxed', 'chill', 'wind down', 'rest', 'sleep', 'sedation'];
  
  const hasEnergy = guidance.dominantPriorities.some(p => 
    energyKeywords.some(k => p.toLowerCase().includes(k))
  );
  const hasCalm = guidance.dominantPriorities.some(p => 
    calmKeywords.some(k => p.toLowerCase().includes(k))
  );
  
  const energyKnown = hasEnergy || hasCalm ? 1.0 : 0.3; // If neither, low confidence
  
  // Intensity confidence: based on endurance vs intensity indicators
  const intensityKeywords = ['intensity', 'peak', 'strong', 'powerful', 'potent'];
  const enduranceKeywords = ['endurance', 'sustained', 'stability', 'consistent', 'steady', 'duration'];
  
  const hasIntensity = guidance.dominantPriorities.some(p => 
    intensityKeywords.some(k => p.toLowerCase().includes(k))
  );
  const hasEndurance = guidance.dominantPriorities.some(p => 
    enduranceKeywords.some(k => p.toLowerCase().includes(k))
  );
  
  const intensityKnown = hasIntensity || hasEndurance ? 1.0 : 0.4;
  
  // Anxiety confidence: based on explicit anxiety avoidance
  const anxietyKeywords = ['anxiety', 'paranoia', 'overwhelming', 'too strong', 'jittery'];
  const hasAnxietyAvoidance = guidance.strictAvoidances.some(a => 
    anxietyKeywords.some(k => a.toLowerCase().includes(k))
  );
  
  const anxietyKnown = hasAnxietyAvoidance ? 1.0 : 0.5; // Moderate default if not specified
  
  // Duration confidence: based on temporal profile and duration indicators
  const durationKeywords = ['duration', 'long', 'short', 'quick', 'sustained', 'hours'];
  const hasDuration = guidance.dominantPriorities.some(p => 
    durationKeywords.some(k => p.toLowerCase().includes(k))
  );
  const hasTemporalProfile = guidance.temporalProfile === 'multi-phase';
  
  const durationKnown = hasDuration || hasTemporalProfile ? 1.0 : 0.6; // Higher default for duration
  
  // Overall confidence: average of all axes
  const requiredAxes = 4; // energy, intensity, anxiety, duration
  const overall = (energyKnown + intensityKnown + anxietyKnown + durationKnown) / requiredAxes;
  
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
 */
export function filterRedundantQuestions(
  questions: ClarificationQuestion[],
  confidence: IntentConfidence
): ClarificationQuestion[] {
  return questions.filter(question => {
    // Check if question axis already has high confidence
    switch (question.type) {
      case 'tradeoff':
        // If energy confidence is high, don't ask energy vs calm
        if (confidence.energy >= 0.6) {
          // Check if question is about energy/calm tradeoff
          const questionText = question.question.toLowerCase();
          if (questionText.includes('energy') && questionText.includes('calm')) {
            return false; // Redundant
          }
        }
        break;
      
      case 'tolerance':
        // If intensity confidence is high, don't ask about intensity preferences
        if (confidence.intensity >= 0.6) {
          const questionText = question.question.toLowerCase();
          if (questionText.includes('gentle') || questionText.includes('stronger') || questionText.includes('peak')) {
            return false; // Redundant
          }
        }
        break;
      
      case 'priority':
        // If overall confidence is high, don't ask priority questions
        if (confidence.overall >= 0.7) {
          return false; // Redundant
        }
        break;
      
      case 'temporal':
        // If duration confidence is high, don't ask temporal questions
        if (confidence.duration >= 0.6) {
          return false; // Redundant
        }
        break;
    }
    
    return true; // Keep question
  });
}

/**
 * Hard clarification gate
 * Returns true ONLY if confidence is below threshold
 */
export function shouldClarify(confidence: IntentConfidence): boolean {
  return confidence.overall < CLARIFICATION_THRESHOLD;
}

/**
 * Get clarification threshold (for display/debugging)
 */
export function getClarificationThreshold(): number {
  return CLARIFICATION_THRESHOLD;
}

