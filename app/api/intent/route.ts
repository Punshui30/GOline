/**
 * Next.js API Route: Intent Parser
 * 
 * OpenAI-only endpoint. No fallbacks. No Ollama. No mocks.
 * 
 * Returns StrategicGuidance JSON for client-side processing.
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { StrategicGuidance } from '@/lib/strategicGuidance';

const SYSTEM_PROMPT = `You are a strategic reasoning system for a constrained outcome-composition engine.

MACHINE-TO-MACHINE CONTRACT: You must output ONLY valid JSON. No explanatory text, no markdown, no commentary, no conversational responses. If you do not follow this format exactly, the response will be rejected.

TONE & CULTURE DIRECTIVE:
You are an expert sommelier of physiological states. Your language must be:
- Sophisticated but accessible (like high-end wine or wellness).
- Grounded in sensory experience and outcome ("clarity", "release", "flow").
- Devoid of confusing slang ("zooted", "dank").
- Confident and precise.

YOU MUST:
- Infer priorities based on desired *outcome* (e.g., "I want to paint" -> prioritize 'focus' and 'flow', avoid 'sedation').
- Detect conflicts (e.g., "Sleepy but focused" is a tension to resolve).
- Suggest resolution strategies.
- Flag risk zones (e.g., high anxiety sensitivity).
- Identify when clarification is needed to ensure a precise match.
- Avoid experiential language that sounds recreational/stoner-coded.
- Avoid loose medical claims.

YOU MUST NEVER:
- Compute terpene ratios or blend percentages (the deterministic engine does this).
- Override safety rules.

STRATEGIC ANALYSIS:
1. Determine dominant priorities (energy, calm, clarity, endurance, social, focus, physical relief, etc.).
2. Identify strict avoidances (anxiety, early sedation, volatility, etc.).
3. Suggest resolution strategies: "single_cultivar", "corrective_blend", "compositional_blend", "stacked_preferred".
4. Flag risk zones: "terpene_overshoot_sensitive", "thc_anxiety_sensitive".
5. Determine temporal structure: "single-phase" or "multi-phase".

CLARIFICATION DETECTION:
If ambiguity prevents a high-confidence resolution, ask for clarification.
Questions must be framed as *preference refinement*, not generic queries.
- GOOD: "Do you prefer a sharp, crystalline onset or a gradual, warm immersion?"
- GOOD: "In social contexts, is your priority maintaining conversational thread or general relaxation?"
- BAD: "Do you want Sativa or Indica?" (Cliché/Inaccurate)
- BAD: "How high do you want to get?" (Stoner-coded)

REQUIRED OUTPUT FORMAT:
You must return ONLY a JSON object matching this exact schema. All keys are required. Use empty arrays [] if a field has no values.

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

RULES:
- Output JSON only
- No extra text before or after the JSON
- No markdown code blocks (no \`\`\`json)
- No explanations or commentary
- Use empty arrays [] if no values exist for array fields
`;

/**
 * Extract JSON from LLM response (handles markdown code blocks, extra text)
 */
function extractJSON(response: string): string {
  let jsonStr = response.trim();

  // Remove markdown code blocks if present
  if (jsonStr.includes('```')) {
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }
  }

  // Locate the first '{' and the last '}' to handle potential preamble/postamble
  const firstOpen = jsonStr.indexOf('{');
  const lastClose = jsonStr.lastIndexOf('}');

  if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
    return jsonStr.substring(firstOpen, lastClose + 1);
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

  // Validate arrays (with fallback to empty arrays if missing)
  const arrayFields = ['dominantPriorities', 'strictAvoidances', 'acceptableTradeoffs', 'suggestedStrategies', 'riskFlags'];
  for (const field of arrayFields) {
    if (parsed[field] === undefined || parsed[field] === null) {
      parsed[field] = []; // Default to empty array if missing
    } else if (!Array.isArray(parsed[field])) {
      // Relaxed check: if it's a string, wrap it in array? No, just warn and use empty.
      console.warn(`[Guidance Validation] Field ${field} is not an array, resetting to empty. Got:`, typeof parsed[field]);
      parsed[field] = [];
    }
  }

  // Validate clarification questions if present
  if (parsed.clarificationNeeded !== undefined && parsed.clarificationNeeded !== null) {
    if (!Array.isArray(parsed.clarificationNeeded)) {
      parsed.clarificationNeeded = []; // Reset if invalid
    } else {
      // Filter out invalid items instead of throwing
      parsed.clarificationNeeded = parsed.clarificationNeeded.filter((q: any) =>
        q &&
        typeof q.question === 'string' &&
        Array.isArray(q.options) &&
        q.options.length > 0
      );
    }
  } else {
    parsed.clarificationNeeded = [];
  }

  return {
    temporalProfile: (parsed.temporalProfile === 'single-phase' || parsed.temporalProfile === 'multi-phase') ? parsed.temporalProfile : 'single-phase', // Default to single-phase
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

  // Check for OpenAI API key - fail hard if missing
  if (!process.env.OPENAI_API_KEY) {
    console.error('[API/INTENT] OPENAI_API_KEY missing');
    return NextResponse.json(
      {
        ok: false,
        error: 'OPENAI_API_KEY_MISSING',
        message: 'OpenAI API key is not configured',
      },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { text, baselineCalibration } = body;

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

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Build messages for OpenAI
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: SYSTEM_PROMPT },
    ];

    // Include baseline calibration as contextual bias if provided
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
        messages.push({
          role: 'system',
          content: `Baseline calibration (use as contextual bias, not hard constraints):\n${calibrationContext.join('\n')}`,
        });
      }
    }

    messages.push({ role: 'user', content: text });

    // Call OpenAI
    let responseText: string | null = null;
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: messages,
        temperature: 0.3,
        max_tokens: 1000,
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
          error: 'OPENAI_REQUEST_FAILED',
          message: 'OpenAI request failed. Unable to interpret intent.',
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
          message: 'OpenAI response could not be parsed as JSON',
          debug: process.env.NODE_ENV === 'development' ? String(parseError) : undefined,
        },
        { status: 500 }
      );
    }

    // Log raw response for debugging
    console.log('[API/INTENT] Raw OpenAI response:', JSON.stringify(responseText, null, 2));
    console.log('[API/INTENT] Parsed object:', JSON.stringify(parsed, null, 2));

    // Validate guidance structure
    let validatedGuidance: StrategicGuidance;
    try {
      validatedGuidance = validateGuidance(parsed);
      console.log('[API/INTENT] Validation successful:', JSON.stringify(validatedGuidance, null, 2));
    } catch (validationError: any) {
      console.error('[API/INTENT] Validation error', {
        message: validationError?.message,
        parsed: JSON.stringify(parsed, null, 2),
        rawResponse: responseText?.substring(0, 500),
      });

      return NextResponse.json(
        {
          ok: false,
          error: 'INVALID_GUIDANCE',
          message: 'OpenAI response did not match expected schema',
          debug: process.env.NODE_ENV === 'development' ? {
            validationError: validationError?.message,
            parsed: parsed,
            rawResponse: responseText?.substring(0, 500),
          } : undefined,
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
