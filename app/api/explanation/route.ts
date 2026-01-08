/**
 * API Route: Generate Explanation
 * 
 * Generates a dynamic explanation for why a blend was selected.
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateExplanation } from '@/lib/llm/explanations';

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
    const { userIntent, blend, constraints, userAge, dominantTerpenes, alternates } = body;

    if (!userIntent || !blend || !Array.isArray(blend)) {
      return NextResponse.json(
        { ok: false, error: 'INVALID_INPUT', message: 'userIntent and blend array are required' },
        { status: 400 }
      );
    }

    // IMPORTANT: LLM must not choose strains. It only explains math-selected blends.
    const explanation = await generateExplanation({
      userIntent,
      blend,
      constraints: constraints || [],
      userAge: userAge ?? null,
      dominantTerpenes: dominantTerpenes ?? undefined,
      alternates: alternates ?? undefined,
    });

    return NextResponse.json(
      { ok: true, explanation },
      {
        status: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
      }
    );
  } catch (error: any) {
    console.error('[API/EXPLANATION] Error:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'GENERATION_FAILED',
        message: error.message || 'Failed to generate explanation',
      },
      { status: 500 }
    );
  }
}

