/**
 * API route: /api/route
 * Normalizes and routes user input (for testing/debugging)
 */

import { NextRequest, NextResponse } from 'next/server';
import { LLMAdapter } from '@/lib/llm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userText } = body;

    if (!userText || typeof userText !== 'string') {
      return NextResponse.json(
        { error: 'userText is required and must be a string' },
        { status: 400 }
      );
    }

    const adapter = new LLMAdapter();
    const result = await adapter.normalizeAndRoute(userText);

    return NextResponse.json({
      normalized: result.normalized,
      routed: result.routed,
    });
  } catch (error) {
    console.error('Route API error:', error);
    return NextResponse.json(
      { error: 'Failed to process route request' },
      { status: 500 }
    );
  }
}















