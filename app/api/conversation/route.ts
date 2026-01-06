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

const SYSTEM_PROMPT = `You are a conversational interface for the GO Line outcome resolution system.

ARCHITECTURAL CONSTRAINT: You are NOT a recommendation engine. You are a conversation facilitator.

YOUR ONLY ALLOWED OUTPUTS:
1. Clarifying questions to understand user intent
2. Reflections or paraphrases of user statements
3. Requests for constraints (e.g., "Are there any effects you want to avoid?")
4. Explanations of already-generated outcomes (when provided to you)

ABSOLUTELY FORBIDDEN:
❌ NEVER name specific strains or cultivars
❌ NEVER propose blends
❌ NEVER assign percentages
❌ NEVER suggest stacking arrangements
❌ NEVER make any decision about what to recommend
❌ NEVER output anything that looks like a recommendation

HARD RULE:
If your output includes:
- A cultivar/strain name (e.g., "Gelato", "Bubba Kush")
- A percentage (e.g., "60%", "40%")
- A blend structure (e.g., "mix X and Y")
- Any decision about what to consume

Then you have violated the architectural constraint.

AVAILABLE STRAINS (for reference only, DO NOT recommend):
${DEMO_MENU.map(s => s.name).join(', ')}

YOUR ROLE:
- Help users articulate their desired outcomes
- Ask targeted questions to clarify constraints
- Reflect back what you understand
- Guide users toward providing enough information for the deterministic engine

TONE:
- Calm. Precise. Professional.
- No hype. No slang.
- This is a decision system interface, not a recommendation engine.`;

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
          error: 'OPENAI_REQUEST_FAILED',
          message: 'OpenAI request failed. Unable to process conversation.',
          debug: process.env.NODE_ENV === 'development' ? String(openaiError) : undefined,
        },
        { status: 500 }
      );
    }

    const finalMessage = responseText.trim();

    // RUNTIME GUARD: Reject any output that contains recommendations
    // Check for strain names (case-insensitive)
    const strainNames = DEMO_MENU.map(s => s.name.toLowerCase());
    const messageLower = finalMessage.toLowerCase();
    
    const containsStrainName = strainNames.some(strain => 
      messageLower.includes(strain.toLowerCase())
    );
    
    // Check for percentages (pattern: number followed by %)
    const containsPercentage = /\d+\s*%/.test(finalMessage);
    
    // Check for blend-like structures
    const containsBlendLanguage = /\b(blend|mix|combine|ratio|percent|percentage)\b/i.test(finalMessage);

    if (containsStrainName || containsPercentage || containsBlendLanguage) {
      console.error('[API/CONVERSATION] BLOCKED: Response contains recommendation', {
        containsStrainName,
        containsPercentage,
        containsBlendLanguage,
        preview: finalMessage.substring(0, 200),
      });
      
      return NextResponse.json(
        {
          ok: false,
          error: 'RECOMMENDATION_DETECTED',
          message: 'The conversation interface cannot provide recommendations. Please use the resolution system for outcomes.',
        },
        { status: 400 }
      );
    }

    // Return validated conversation response (no recommendations)
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
