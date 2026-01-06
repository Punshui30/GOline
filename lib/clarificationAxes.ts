/**
 * Clarification Axis Tracking
 * 
 * Maps clarification questions to uncertainty axes and tracks which axes have been resolved.
 * This prevents the system from asking about the same axis twice and ensures resolution
 * occurs when all axes are resolved.
 */

export type ClarificationAxis = 'temporal' | 'tradeoff' | 'tolerance' | 'priority' | 'physical_relief' | 'cognitive_clarity' | 'functional_energy';

/**
 * Parse user reply to determine which clarification axes are resolved.
 * This is a deterministic parsing step - not an LLM call.
 * 
 * A single reply can resolve multiple axes (e.g., "intense but no panic attacks" resolves
 * both tolerance and tradeoff axes).
 */
export function parseResolvedAxes(userReply: string, openAxes: ClarificationAxis[]): ClarificationAxis[] {
  const resolved: ClarificationAxis[] = [];
  const reply = userReply.toLowerCase();

  // Temporal axis resolution
  if (openAxes.includes('temporal')) {
    const temporalKeywords = ['start', 'later', 'both', 'beginning', 'end', 'after', 'then', 'early', 'late'];
    if (temporalKeywords.some(kw => reply.includes(kw))) {
      resolved.push('temporal');
    }
  }

  // Tolerance/Intensity axis resolution
  if (openAxes.includes('tolerance')) {
    const intensityKeywords = ['intense', 'strong', 'gentle', 'mild', 'steady', 'peak', 'powerful', 'soft', 'calm', 'hard', 'light'];
    if (intensityKeywords.some(kw => reply.includes(kw))) {
      resolved.push('tolerance');
    }
  }

  // Tradeoff axis resolution (anxiety, stimulation, etc.)
  if (openAxes.includes('tradeoff')) {
    const tradeoffKeywords = ['anxiety', 'panic', 'overwhelming', 'stimulation', 'calm', 'relaxed', 'energized', 'balanced', 'attack', 'paranoid'];
    if (tradeoffKeywords.some(kw => reply.includes(kw))) {
      resolved.push('tradeoff');
    }
  }

  // Priority axis resolution
  if (openAxes.includes('priority')) {
    const priorityKeywords = ['priority', 'focus', 'important', 'mainly', 'mostly', 'especially', 'primarily'];
    const outcomeKeywords = ['energy', 'calm', 'clarity', 'relax', 'focus', 'creative'];
    if (priorityKeywords.some(kw => reply.includes(kw)) || 
        (outcomeKeywords.some(kw => reply.includes(kw)) && reply.length < 150)) {
      resolved.push('priority');
    }
  }

  return resolved;
}

/**
 * Get the axis type from a clarification question type
 */
export function getAxisFromQuestionType(type: string): ClarificationAxis {
  return type as ClarificationAxis;
}

