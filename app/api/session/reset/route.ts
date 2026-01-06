/**
 * API route: /api/session/reset
 * Resets a session (for kiosk mode)
 */

import { NextRequest, NextResponse } from 'next/server';
import { sessionCache } from '@/lib/flow/cache';
import { randomUUID } from 'crypto';

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

    const newSession = sessionCache.resetSession(sessionId);

    return NextResponse.json({
      sessionId: newSession.id,
      message: 'Session reset',
    });
  } catch (error) {
    console.error('Session reset error:', error);
    return NextResponse.json(
      { error: 'Failed to reset session' },
      { status: 500 }
    );
  }
}















