/**
 * Next.js API Route: Intent Parser
 * 
 * OpenAI API endpoint for strategic guidance generation.
 * Returns StrategicGuidance JSON for client-side processing.
 */

import { NextRequest, NextResponse } from 'next/server';
import { StrategicGuidance } from '@/lib/strategicGuidance';
import OpenAI from 'openai';

const SYSTEM_PROMPT = `You are a strategic reasoning system for a constrained outcome-composition engine.

Your role is to analyze user intent and provide strategic guidance that shapes how the deterministic engine explores the solution space.

YOU DECIDE: What matters and how to approach the problem.
THE ENGINE DECIDES: What is allowed and what the final numbers are.

YOU MUST:
- Infer priorities, not compute ratios
- Detect conflicts and tradeoffs
- Suggest resolution strategies (hypotheses, not decisions)
- Flag risk zones
- Identify when clarification is needed
- Output valid JSON only
- Avoid experiential language
- Avoid cannabis folklore
- Avoid terpene claims
- Avoid predictions

YOU MUST NEVER:
- Compute terpene ratios
- Compute blend percentages
- Decide cannabinoid quantities
- Select final cultivars
- Override safety rules

STRATEGIC ANALYSIS:
1. Determine dominant priorities (energy, calm, clarity, endurance, social, focus, etc.)
2. Identify strict avoidances (anxiety, early sedation, volatility, etc.)
3. Identify acceptable tradeoffs (lower peak intensity, slower onset, etc.)
4. Suggest resolution strategies: "single_cultivar", "corrective_blend", "compositional_blend", "stacked_preferred", "cbd_cbg_dampening"
5. Flag risk zones: "terpene_overshoot_sensitive", "thc_anxiety_sensitive", "conflicting_goals", "timing_conflicts"
6. Determine temporal structure: "single-phase" or "multi-phase"

CLARIFICATION DETECTION (PART 4 - NO DUMB QUESTIONS):
Only ask clarification questions when there is REAL ambiguity that prevents resolution.

DO NOT ask questions if:
- User intent is already clear from their input
- The question contradicts or restates what the user already said
- Confidence in intent is high (clear priorities, avoidances, and constraints are evident)

Examples of FORBIDDEN questions:
- User says "chatty, creative, for four hours" → DO NOT ask "Relaxation or energy?" (user already said energy/creative)
- User says "calm but alert" → DO NOT ask "Do you want calm or alert?" (user wants both)
- User provides specific duration → DO NOT ask about temporal profile (already specified)

Only ask when:
- Multiple valid interpretations exist
- Critical constraint is genuinely missing
- User input is truly ambiguous

Questions must be:
- Neutral and optional (never force binary trade-offs)
- Include "none", "balanced", "unsure", or "neither" as valid options
- Prefer sensitivity checks, avoidance checks, or confirmation checks
- Never assume a trade-off exists before asking
- Never contradict user's stated intent

Examples of GOOD clarification questions (only when truly needed):
- Temporal: "Is this mostly about how you feel at the start, later, or both?" → ["Start", "Later", "Both", "Unsure"]
- Sensitivity: "Are there any effects you're especially sensitive to, or should I assume a balanced approach?" → ["Overstimulation", "Mental drift", "Anxiety", "None / Balanced"]

Output schema (JSON only):

{
  "temporalProfile": "single-phase" | "multi-phase",
  "dominantPriorities": string[],
  "strictAvoidances": string[],
  "acceptableTradeoffs": string[],
  "suggestedStrategies": string[],
  "riskFlags": string[],
  "clarificationNeeded": [
    {
      "type": "temporal" | "tradeoff" | "tolerance" | "priority",
      "question": string,
      "options": string[]
    }
  ]
}

Do not include any other text.`;

/**
 * Extract JSON from LLM response (handles markdown code blocks, extra text)
 */
function extractJSON(response: string): string {
  let jsonStr = response.trim();
  
  // Remove markdown code blocks if present
  if (jsonStr.includes('```')) {
    const jsonMatch = jsonStr.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }
  }
  
  // Try to extract first JSON object
  const objectMatch = jsonStr.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    return objectMatch[0];
  }
  
  return jsonStr;
}

/**
 * Validate strategic guidance object structure
 * Throws if invalid
 */
function validateGuidance(parsed: any): StrategicGuidance {
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid guidance: not an object');
  }

  // Validate temporal profile
  if (!parsed.temporalProfile || (parsed.temporalProfile !== 'single-phase' && parsed.temporalProfile !== 'multi-phase')) {
    throw new Error('Invalid guidance: temporalProfile must be "single-phase" or "multi-phase"');
  }

  // Validate arrays
  const arrayFields = ['dominantPriorities', 'strictAvoidances', 'acceptableTradeoffs', 'suggestedStrategies', 'riskFlags'];
  for (const field of arrayFields) {
    if (!Array.isArray(parsed[field])) {
      throw new Error(`Invalid guidance: ${field} must be an array`);
    }
    if (!parsed[field].every((item: any) => typeof item === 'string')) {
      throw new Error(`Invalid guidance: ${field} must be an array of strings`);
    }
  }

  // Validate clarification questions if present
  if (parsed.clarificationNeeded !== undefined) {
    if (!Array.isArray(parsed.clarificationNeeded)) {
      throw new Error('Invalid guidance: clarificationNeeded must be an array');
    }
    for (const question of parsed.clarificationNeeded) {
      if (!question.type || !['temporal', 'tradeoff', 'tolerance', 'priority'].includes(question.type)) {
        throw new Error('Invalid guidance: clarification question type must be "temporal", "tradeoff", "tolerance", or "priority"');
      }
      if (typeof question.question !== 'string') {
        throw new Error('Invalid guidance: clarification question must be a string');
      }
      if (!Array.isArray(question.options) || question.options.length === 0) {
        throw new Error('Invalid guidance: clarification options must be a non-empty array');
      }
      if (!question.options.every((opt: any) => typeof opt === 'string')) {
        throw new Error('Invalid guidance: clarification options must be strings');
      }
    }
  }

  return {
    temporalProfile: parsed.temporalProfile,
    dominantPriorities: parsed.dominantPriorities || [],
    strictAvoidances: parsed.strictAvoidances || [],
    acceptableTradeoffs: parsed.acceptableTradeoffs || [],
    suggestedStrategies: parsed.suggestedStrategies || [],
    riskFlags: parsed.riskFlags || [],
    clarificationNeeded: parsed.clarificationNeeded || [],
  };
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
    const { text } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        {
          ok: false,
          error: 'INVALID_INPUT',
          message: 'Text input is required',
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

    // Call OpenAI API
    let responseText: string | null = null;
    try {
      // DO NOT CHANGE MODEL — gpt-3.5-turbo is deprecated and will 404
      const completion = await openai.chat.completions.create({
        model: 'gpt-4.1-mini',
        temperature: 0.4,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: text },
        ],
      });

      responseText = completion.choices[0]?.message?.content || null;

      if (!responseText) {
        throw new Error('Empty response from OpenAI');
      }

      console.log('[API/INTENT] OpenAI response received, length:', responseText.length);
    } catch (openaiError: any) {
      console.error('[API/INTENT] OpenAI error', {
        message: openaiError?.message,
        stack: openaiError?.stack,
      });
      
      return NextResponse.json(
        {
          ok: false,
          error: 'LLM_UNAVAILABLE',
          message: 'Unable to interpret intent at this time. OpenAI request failed.',
          debug: process.env.NODE_ENV === 'development' ? String(openaiError) : undefined,
        },
        { status: 500 }
      );
    }

    // Parse and validate response
    let parsed: any;
    try {
      const jsonStr = extractJSON(responseText);
      parsed = JSON.parse(jsonStr);
    } catch (parseError: any) {
      console.error('[API/INTENT] JSON parse error', {
        message: parseError?.message,
        responsePreview: responseText?.substring(0, 200),
      });
      
      return NextResponse.json(
        {
          ok: false,
          error: 'INVALID_RESPONSE',
          message: 'LLM response could not be parsed as JSON',
          debug: process.env.NODE_ENV === 'development' ? String(parseError) : undefined,
        },
        { status: 500 }
      );
    }

    // Validate guidance structure
    let validatedGuidance: StrategicGuidance;
    try {
      validatedGuidance = validateGuidance(parsed);
    } catch (validationError: any) {
      console.error('[API/INTENT] Validation error', {
        message: validationError?.message,
        parsed,
      });
      
      return NextResponse.json(
        {
          ok: false,
          error: 'INVALID_GUIDANCE',
          message: 'LLM response did not match expected schema',
          debug: process.env.NODE_ENV === 'development' ? String(validationError) : undefined,
        },
        { status: 500 }
      );
    }

    // Return success
    return NextResponse.json(
      {
        ok: true,
        guidance: validatedGuidance,
      },
      {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (err: any) {
    console.error('[API/INTENT] Unexpected error', {
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

