/**
 * Next.js API Route: Conversational LLM
 * 
 * Free-form conversational layer that responds in natural language.
 * No schema validation - enables natural conversation, summaries, and clarification questions.
 * 
 * This endpoint is called for every user message during the conversational phase.
 */

export const runtime = "nodejs";

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { DEMO_MENU } from '@/data/demoMenu';

const SYSTEM_PROMPT = `You are implementing the GO Line recommendation engine.

CORE RULE: GO Line is an outcome resolution system, not a strain picker.

DEMO MENU CONSTRAINT:
- All recommendations MUST use only the provided demo menu of 28 strains.
- Do not invent new cultivars.
- Available strains: ${DEMO_MENU.map(s => s.name).join(', ')}

RECOMMENDATION HIERARCHY:
1. Always evaluate blends first.
   - Blends are the default output because they allow precision tuning of:
     * sociability
     * mental energy
     * anxiety control
     * duration curve
   
2. Single-cultivar recommendations are provisional, never final.
   - When a single strain appears sufficient:
     * Present it as a candidate, not an answer
     * Immediately follow with a confirmation gate

CONFIRMATION GATE BEHAVIOR:
When proposing a single cultivar:
- Explicitly list 2-3 known tradeoffs
- Ask targeted outcome-based confirmation questions
- Example pattern: "Gelato aligns well with your goal. Before locking that in, I want to check a couple common characteristics…"
- If any tradeoff is undesirable → escalate to a blend.

OUTPUT FORMAT:
If blending:
- Name 2-4 strains from the demo menu
- Assign relative weight percentages (must sum to 100%)
- Explain what each component is correcting or amplifying

If provisional single:
- Clearly state it is provisional
- Ask confirmation questions
- Do NOT finalize without user confirmation

FORBIDDEN BEHAVIORS:
❌ Do NOT ask:
   - "Are you open to hybrids?"
   - "Do you want to try a different product?"
   - "Are you looking for a strain?"
❌ Do NOT explain cannabis basics.
❌ Do NOT default to education or category questions.

TONE:
- Calm. Precise. Confident.
- No hype. No slang. No "friendly assistant" language.
- This is a decision system interface, not a consumer cannabis app.`;

interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function POST(request: NextRequest) {
  // Handle CORS preflight
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

  try {
    const body = await request.json();
    const { messages, baselineCalibration } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: 'INVALID_INPUT',
          message: 'Messages array is required',
        },
        { status: 400 }
      );
    }

    // Validate OpenAI API key exists
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required but not set');
    }

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: apiKey,
    });

    // Build messages array for OpenAI (system + conversation history)
    const openaiMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: SYSTEM_PROMPT },
    ];

    // Include baseline calibration in system message if provided
    if (baselineCalibration) {
      const calibrationContext = [];
      if (baselineCalibration.thcTolerance) {
        calibrationContext.push(`User's THC tolerance: ${baselineCalibration.thcTolerance}`);
      }
      if (baselineCalibration.anxietySensitivity) {
        calibrationContext.push(`User's anxiety sensitivity: ${baselineCalibration.anxietySensitivity}`);
      }
      if (baselineCalibration.experienceLevel) {
        calibrationContext.push(`User's experience level: ${baselineCalibration.experienceLevel}`);
      }
      if (calibrationContext.length > 0) {
        openaiMessages[0].content += `\n\nUser context:\n${calibrationContext.join('\n')}`;
      }
    }

    // Add conversation history (last 10 messages to keep context manageable)
    const recentMessages = messages.slice(-10);
    for (const msg of recentMessages) {
      if (msg.role === 'user') {
        openaiMessages.push({ role: 'user', content: msg.content });
      } else if (msg.role === 'assistant') {
        openaiMessages.push({ role: 'assistant', content: msg.content });
      }
    }

    // Call OpenAI API
    let responseText: string | null = null;
    try {
      // DO NOT CHANGE MODEL — gpt-3.5-turbo is deprecated and will 404
      const completion = await openai.chat.completions.create({
        model: 'gpt-4.1-mini',
        temperature: 0.7,
        messages: openaiMessages,
      });

      responseText = completion.choices[0]?.message?.content || null;

      if (!responseText) {
        throw new Error('Empty response from OpenAI');
      }

      console.log('[API/CONVERSATION] OpenAI response received, length:', responseText.length);
    } catch (openaiError: any) {
      console.error('[API/CONVERSATION] OpenAI error', {
        message: openaiError?.message,
        stack: openaiError?.stack,
      });
      
      return NextResponse.json(
        {
          ok: false,
          error: 'LLM_UNAVAILABLE',
          message: 'Unable to process conversation at this time.',
          debug: process.env.NODE_ENV === 'development' ? String(openaiError) : undefined,
        },
        { status: 500 }
      );
    }

    // Return response without forced disclaimer (let model handle it naturally)
    const finalMessage = responseText.trim();

    // Return natural language response (no validation needed)
    return NextResponse.json(
      {
        ok: true,
        message: finalMessage,
      },
      {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (err: any) {
    console.error('[API/CONVERSATION] Unexpected error', {
      message: err?.message,
      stack: err?.stack,
    });
    
    return NextResponse.json(
      {
        ok: false,
        error: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        debug: process.env.NODE_ENV === 'development' ? String(err) : undefined,
      },
      { status: 500 }
    );
  }
}
