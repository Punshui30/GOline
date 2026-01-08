/**
 * Age Tone Utility
 * 
 * Maps user age to communication tone for age-aware content generation.
 */

export type AgeTone = 'playful' | 'modern' | 'grounded' | 'reassuring';

/**
 * Get age-appropriate tone for content generation
 */
export function getAgeTone(age: number): AgeTone {
  if (age >= 21 && age <= 25) {
    return 'playful';
  } else if (age >= 26 && age <= 35) {
    return 'modern';
  } else if (age >= 36 && age <= 50) {
    return 'grounded';
  } else {
    return 'reassuring';
  }
}

