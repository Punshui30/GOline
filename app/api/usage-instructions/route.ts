/**
 * API Route: Generate Usage Instructions
 * 
 * Generates practical usage instructions for a blend.
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateUsageInstructions } from '@/lib/llm/explanations';

export async function POST(request: NextRequest) {
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
    });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { ok: false, error: 'OPENAI_API_KEY_MISSING', message: 'API key not configured' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { blend, intensity, duration, userAge } = body;

    if (!blend || !Array.isArray(blend)) {
      return NextResponse.json(
        { ok: false, error: 'INVALID_INPUT', message: 'blend array is required' },
        { status: 400 }
      );
    }

    const instructions = await generateUsageInstructions({
      blend,
      intensity: intensity ?? 0.5,
      duration: duration ?? 0.5,
      userAge: userAge ?? null,
    });

    return NextResponse.json(
      { ok: true, instructions },
      {
        status: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
      }
    );
  } catch (error: any) {
    console.error('[API/USAGE-INSTRUCTIONS] Error:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'GENERATION_FAILED',
        message: error.message || 'Failed to generate instructions',
      },
      { status: 500 }
    );
  }
}

