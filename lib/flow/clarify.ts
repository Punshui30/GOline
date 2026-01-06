/**
 * Clarification logic
 */

import { Session, ConversationContext } from './types';
import { LLMAdapter } from '../llm';

const MAX_CLARIFICATIONS = 2;
const CONFIDENCE_THRESHOLD = 0.6;

export async function shouldClarify(
  confidence: number,
  session: Session
): Promise<boolean> {
  if (confidence >= CONFIDENCE_THRESHOLD) {
    return false;
  }

  if (session.clarifyCount >= MAX_CLARIFICATIONS) {
    return false; // Max clarifications reached, route to META_UNKNOWN
  }

  return true;
}

export async function generateClarification(
  userText: string,
  session: Session
): Promise<string> {
  const adapter = new LLMAdapter();
  
  // Determine what needs clarification based on low confidence
  const clarificationNeeded = 
    session.context.extractedFacts && Object.keys(session.context.extractedFacts).length === 0
      ? 'What specific problem are you facing?'
      : 'Can you tell me more about your situation?';

  // Use the normalized text if available (last message), otherwise raw
  const textToClarify = session.context.userMessages[session.context.userMessages.length - 1] || userText;
  
  return adapter.clarify(textToClarify, clarificationNeeded);
}

