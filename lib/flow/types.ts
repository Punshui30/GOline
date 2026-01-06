/**
 * Core types for the Navigator flow engine
 */

export type SessionId = string;
export type RouteId = string;
export type CaseId = string;

export type SessionState = 
  | 'idle'
  | 'collecting'
  | 'clarifying'
  | 'routing'
  | 'presenting';

export type CaseState =
  | 'initial'
  | 'questions'
  | 'action_card'
  | 'complete'
  | 'fallback';

export interface Session {
  id: SessionId;
  state: SessionState;
  caseId?: string;
  createdAt: number;
  lastActivityAt: number;
  clarifyCount: number;
  context: ConversationContext;
}

export interface ConversationContext {
  userMessages: string[];
  assistantMessages: string[];
  extractedFacts: Record<string, string | number | boolean>;
  crisisFlags: string[];
  currentQuestion?: string;
}

export interface Case {
  id: string;
  routeId: RouteId;
  state: CaseState;
  stepIndex: number;
  facts: Record<string, string | number | boolean>;
  questions: Question[];
  createdAt: number;
}

export interface Question {
  id: string;
  text: string;
  type: 'open' | 'multiple_choice' | 'yes_no';
  options?: string[];
  required: boolean;
}

export interface RouterResult {
  confidence: number; // 0..1
  candidate_routes: { id: string; score: number }[];
  extracted_facts: Record<string, string | number | boolean>;
  crisis_flags: string[];
  rationale_short: string;
}

export interface ActionCard {
  title: string;
  do_today: string[];
  say_this_script: string;
  bring_this: string[];
  if_they_stall: string[];
  local_resources: {
    name: string;
    phone?: string;
    address?: string;
  }[];
  disclaimers: string[];
}

export interface RouteDefinition {
  id: RouteId;
  name: string;
  description: string;
  playbookId: string;
  factKeys: string[];
  questions: Question[];
  crisisFlags?: string[];
}

export interface RespondResult {
  type: 'question' | 'action_card' | 'clarify';
  question?: Question;
  actionCard?: ActionCard;
  clarifyPrompt?: string;
  sessionState: SessionState;
  caseState?: CaseState;
}

