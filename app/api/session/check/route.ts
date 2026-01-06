/**
 * API route: /api/session/check
 * Checks if session is locked
 */

import { NextRequest, NextResponse } from 'next/server';
import { sessionCache } from '@/lib/flow/cache';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      );
    }

    const locked = sessionCache.isSessionLocked(sessionId);
    const session = sessionCache.getSession(sessionId);

    return NextResponse.json({
      sessionId,
      locked,
      exists: !!session,
    });
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json(
      { error: 'Failed to check session' },
      { status: 500 }
    );
  }
}















