/**
 * In-memory session cache with TTL
 */

import { Session, SessionId, Case, CaseId } from './types';

const SESSION_TTL = 15 * 60 * 1000; // 15 minutes
const INACTIVITY_LOCK = 2 * 60 * 1000; // 2 minutes
const CLEANUP_INTERVAL = 60 * 1000; // 1 minute

class SessionCache {
  private sessions: Map<SessionId, Session> = new Map();
  private cases: Map<CaseId, Case> = new Map();

  constructor() {
    // Cleanup expired sessions periodically
    setInterval(() => this.cleanup(), CLEANUP_INTERVAL);
  }

  createSession(sessionId: SessionId): Session {
    const now = Date.now();
    const session: Session = {
      id: sessionId,
      state: 'idle',
      createdAt: now,
      lastActivityAt: now,
      clarifyCount: 0,
      context: {
        userMessages: [],
        assistantMessages: [],
        extractedFacts: {},
        crisisFlags: [],
      },
    };
    this.sessions.set(sessionId, session);
    return session;
  }

  getSession(sessionId: SessionId): Session | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;

    // Check if expired
    if (Date.now() - session.createdAt > SESSION_TTL) {
      this.sessions.delete(sessionId);
      return undefined;
    }

    return session;
  }

  updateSession(session: Session): void {
    session.lastActivityAt = Date.now();
    this.sessions.set(session.id, session);
  }

  createCase(caseId: CaseId, routeId: string, facts: Record<string, any>): Case {
    const case_: Case = {
      id: caseId,
      routeId,
      state: 'initial',
      stepIndex: 0,
      facts,
      questions: [],
      createdAt: Date.now(),
    };
    this.cases.set(caseId, case_);
    return case_;
  }

  getCase(caseId: CaseId): Case | undefined {
    return this.cases.get(caseId);
  }

  updateCase(case_: Case): void {
    this.cases.set(case_.id, case_);
  }

  isSessionLocked(sessionId: SessionId): boolean {
    const session = this.getSession(sessionId);
    if (!session) return false;
    return Date.now() - session.lastActivityAt > INACTIVITY_LOCK;
  }

  resetSession(sessionId: SessionId): Session {
    // Remove old session and create new one
    this.sessions.delete(sessionId);
    return this.createSession(sessionId);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [id, session] of this.sessions.entries()) {
      if (now - session.createdAt > SESSION_TTL) {
        this.sessions.delete(id);
        // Also clean up associated case if exists
        if (session.caseId) {
          this.cases.delete(session.caseId);
        }
      }
    }
  }
}

export const sessionCache = new SessionCache();

