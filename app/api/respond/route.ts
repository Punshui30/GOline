/**
 * API route: /api/respond
 * Main endpoint: processes user input through state machine
 */

import { NextRequest, NextResponse } from 'next/server';
import { processUserInput } from '@/lib/flow/stateMachine';
import { sessionCache } from '@/lib/flow/cache';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, userText } = body;

    if (!userText || typeof userText !== 'string') {
      return NextResponse.json(
        { error: 'userText is required and must be a string' },
        { status: 400 }
      );
    }

    // Use provided sessionId or create new one
    let sid = sessionId || randomUUID();

    // Check if session is locked (inactivity)
    if (sessionCache.isSessionLocked(sid)) {
      return NextResponse.json({
        locked: true,
        sessionId: sid,
        message: 'Session locked due to inactivity',
      });
    }

    // Process user input through state machine
    const result = await processUserInput(sid, userText);

    return NextResponse.json({
      sessionId: sid,
      ...result,
    });
  } catch (error) {
    console.error('Respond API error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}















