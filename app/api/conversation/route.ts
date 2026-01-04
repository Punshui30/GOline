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

const SYSTEM_PROMPT = `You are a helpful assistant helping someone find the right cannabis product for their needs.

IMPORTANT - DEMO MENU CONSTRAINTS:
- For demo purposes, use the static dispensary menu provided in DEMO_MENU.
- All strain suggestions and blends must be derived exclusively from this menu.
- You may reference known strains conversationally.
- You may suggest 2-4 strain blends with percentages.
- Explain why each strain was chosen relative to the user's stated outcome.
- NEVER suggest strains outside of the DEMO_MENU list.

Available menu:
${JSON.stringify(DEMO_MENU.map(item => ({
  name: item.name,
  category: item.category,
  thc: item.thc,
  terpenes: item.terpenes,
  effects: item.effects,
  commonUses: item.commonUses
})), null, 2)}

Your role:
- Listen to what the user wants
- Ask clarifying questions when needed
- Summarize what you understand
- Respond naturally and conversationally
- Suggest strain blends from the DEMO_MENU

You should:
- Be calm, precise, and confident
- Ask one question at a time when clarification is needed
- Summarize understanding before asking new questions
- Respond in natural language (not JSON)
- Reference strains from the DEMO_MENU by name
- Suggest blends with 2-4 strains and percentages when appropriate

You should NOT:
- Suggest strains outside the DEMO_MENU
- Make claims about effects not listed in the menu
- Output structured data (no JSON)
- Output numeric intent parameters
- Hallucinate strain names

Keep responses concise and helpful. Always end responses with this disclaimer:
"[Demo uses a static snapshot of a dispensary menu for illustrative purposes only.]"`;

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

    // Ensure disclaimer is appended (in case model didn't include it)
    const finalMessage = responseText.trim();
    const hasDisclaimer = finalMessage.includes('Demo uses a static snapshot');
    const messageWithDisclaimer = hasDisclaimer 
      ? finalMessage 
      : `${finalMessage}\n\n[Demo uses a static snapshot of a dispensary menu for illustrative purposes only.]`;

    // Return natural language response (no validation needed)
    return NextResponse.json(
      {
        ok: true,
        message: messageWithDisclaimer,
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
