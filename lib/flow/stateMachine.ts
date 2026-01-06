/**
 * State machine for session flow
 */

import { Session, Case, Question, RouteId, ActionCard, RespondResult, RouterResult } from './types';
import { sessionCache } from './cache';
import { loadRoute, selectBestRoute } from './router';
import { renderPlaybook } from './render';
import { shouldClarify, generateClarification } from './clarify';
import { LLMAdapter } from '../llm';
import { randomUUID } from 'crypto';

export async function processUserInput(
  sessionId: string,
  userText: string
): Promise<RespondResult> {
  let session = sessionCache.getSession(sessionId);
  
  if (!session) {
    session = sessionCache.createSession(sessionId);
  }

  // Update session activity
  session.context.userMessages.push(userText);
  session.lastActivityAt = Date.now();

  // Two-step pipeline: normalize → route
  const adapter = new LLMAdapter();
  const { normalized, routed: routerResult } = await adapter.normalizeAndRoute(
    userText,
    session.context
  );

  // Store normalized text for context
  session.context.userMessages[session.context.userMessages.length - 1] = normalized.normalized_text;

  // Merge extracted facts
  session.context.extractedFacts = {
    ...session.context.extractedFacts,
    ...routerResult.extracted_facts,
  } as Record<string, string | number | boolean>;
  session.context.crisisFlags = [
    ...new Set([...session.context.crisisFlags, ...routerResult.crisis_flags, ...normalized.signals]),
  ];

  const needsClarification = await shouldClarify(routerResult.confidence, session);

  if (needsClarification) {
    session.state = 'clarifying';
    session.clarifyCount += 1;
    const clarifyPrompt = await generateClarification(userText, session);
    session.context.assistantMessages.push(clarifyPrompt);
    sessionCache.updateSession(session);
    
    return {
      type: 'clarify',
      clarifyPrompt,
      sessionState: 'clarifying',
    };
  }

  // Select route
  const routeId = selectBestRoute(routerResult as RouterResult);
  const route = loadRoute(routeId);

  // Create or update case
  let case_ = session.caseId ? sessionCache.getCase(session.caseId) : undefined;
  
  if (!case_) {
    const caseId = randomUUID();
    case_ = sessionCache.createCase(caseId, routeId, session.context.extractedFacts);
    session.caseId = caseId;
  } else {
    // Merge new facts
    case_.facts = { ...case_.facts, ...routerResult.extracted_facts } as Record<string, string | number | boolean>;
    sessionCache.updateCase(case_);
  }

  // Check if we have enough information for action card
  const hasAllRequiredFacts = route.factKeys.every(key => 
    case_!.facts.hasOwnProperty(key)
  );

  if (hasAllRequiredFacts || route.questions.length === 0) {
    // Generate action card
    const actionCard = renderPlaybook(route.playbookId || routeId, case_.facts);
    session.state = 'presenting';
    case_.state = 'action_card';
    sessionCache.updateSession(session);
    sessionCache.updateCase(case_);

    return {
      type: 'action_card',
      actionCard,
      sessionState: 'presenting',
      caseState: 'action_card',
    };
  }

  // Ask next question
  const questionIndex = case_.stepIndex;
  if (questionIndex < route.questions.length) {
    const question = route.questions[questionIndex];
    session.state = 'collecting';
    case_.state = 'questions';
    case_.stepIndex = questionIndex + 1;
    session.context.assistantMessages.push(question.text);
    sessionCache.updateSession(session);
    sessionCache.updateCase(case_);

    return {
      type: 'question',
      question,
      sessionState: 'collecting',
      caseState: 'questions',
    };
  }

  // Fallback: show action card even if questions incomplete
  const actionCard = renderPlaybook(route.playbookId || routeId, case_.facts);
  session.state = 'presenting';
  case_.state = 'action_card';
  sessionCache.updateSession(session);
  sessionCache.updateCase(case_);

  return {
    type: 'action_card',
    actionCard,
    sessionState: 'presenting',
    caseState: 'action_card',
  };
}

