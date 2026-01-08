/**
 * API Route: Generate Blend Social Content
 * 
 * Generates age-aware blend nickname, hashtag, and share caption.
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateBlendSocial } from '@/lib/llm/blendSocial';

export async function POST(request: NextRequest) {
  if (request.method === 'OPTIONS') {
    return NextResponse.json(null, {
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
    const { userIntent, blend, userAge, dominantTerpenes } = body;

    if (!userIntent || !blend || !Array.isArray(blend)) {
      return NextResponse.json(
        { ok: false, error: 'INVALID_INPUT', message: 'userIntent and blend array are required' },
        { status: 400 }
      );
    }

    const social = await generateBlendSocial({
      userIntent,
      blend,
      userAge: userAge ?? null,
      dominantTerpenes: dominantTerpenes ?? undefined,
    });

    return NextResponse.json(
      { ok: true, ...social },
      {
        status: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
      }
    );
  } catch (error: any) {
    console.error('[API/BLEND-SOCIAL] Error:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'GENERATION_FAILED',
        message: error.message || 'Failed to generate social content',
      },
      { status: 500 }
    );
  }
}

