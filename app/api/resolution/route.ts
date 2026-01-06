/**
 * Next.js API Route: Resolution LLM
 * 
 * Schema-bound LLM that outputs validated StrategicGuidance JSON.
 * Only called when sufficient information is gathered and axes are closed.
 * 
 * This endpoint is explicitly triggered, not called on every user message.
 */

import { NextRequest, NextResponse } from 'next/server';
import { StrategicGuidance } from '@/lib/strategicGuidance';
import OpenAI from 'openai';

const SYSTEM_PROMPT = `You are a strategic reasoning system for a constrained outcome-composition engine.

MACHINE-TO-MACHINE CONTRACT: You must output ONLY valid JSON. No explanatory text, no markdown, no commentary, no conversational responses. If you do not follow this format exactly, the response will be rejected.

Your role is to analyze user intent and provide strategic guidance that shapes how the deterministic engine explores the solution space.

YOU DECIDE: What matters and how to approach the problem.
THE ENGINE DECIDES: What is allowed and what the final numbers are.

YOU MUST:
- Infer priorities, not compute ratios
- Detect conflicts and tradeoffs
- Suggest resolution strategies (hypotheses, not decisions)
- Flag risk zones
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
1. Determine dominant priorities (energy, calm, clarity, endurance, social, focus, physical relief, cognitive clarity, functional energy, etc.)
2. Identify strict avoidances (anxiety, early sedation, volatility, etc.)
3. Identify acceptable tradeoffs (lower peak intensity, slower onset, etc.)
4. Suggest resolution strategies: "single_cultivar", "corrective_blend", "compositional_blend", "stacked_preferred", "cbd_cbg_dampening"
5. Flag risk zones: "terpene_overshoot_sensitive", "thc_anxiety_sensitive", "conflicting_goals", "timing_conflicts"
6. Determine temporal structure: "single-phase" or "multi-phase"
7. Identify expanded outcome dimensions: physical relief, cognitive clarity, functional energy vs intensity, temporal profile (onset/duration)

REQUIRED OUTPUT FORMAT:
You must return ONLY a JSON object matching this exact schema. All keys are required. Use empty arrays [] if a field has no values.

{
  "temporalProfile": "single-phase" | "multi-phase",
  "dominantPriorities": string[],
  "strictAvoidances": string[],
  "acceptableTradeoffs": string[],
  "suggestedStrategies": string[],
  "riskFlags": string[],
  "clarificationNeeded": []
}

RULES:
- Output JSON only
- No extra text before or after the JSON
- No markdown code blocks (no \`\`\`json)
- No explanations
- No commentary
- Do not omit any keys
- Use empty arrays [] if no values exist for array fields
- clarificationNeeded must be [] (empty) - this endpoint is only called when clarification is complete

If you do not follow this format exactly, the response will be rejected.`;

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

  // Validate clarificationNeeded is empty array (resolution endpoint should never have clarification)
  if (parsed.clarificationNeeded !== undefined) {
    if (!Array.isArray(parsed.clarificationNeeded)) {
      throw new Error('Invalid guidance: clarificationNeeded must be an array');
    }
    // Resolution endpoint should always have empty clarificationNeeded
    if (parsed.clarificationNeeded.length > 0) {
      console.warn('[API/RESOLUTION] Warning: clarificationNeeded is not empty, clearing it');
      parsed.clarificationNeeded = [];
    }
  }

  return {
    temporalProfile: parsed.temporalProfile,
    dominantPriorities: parsed.dominantPriorities || [],
    strictAvoidances: parsed.strictAvoidances || [],
    acceptableTradeoffs: parsed.acceptableTradeoffs || [],
    suggestedStrategies: parsed.suggestedStrategies || [],
    riskFlags: parsed.riskFlags || [],
    clarificationNeeded: [], // Always empty for resolution endpoint
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
    const { contextSummary, baselineCalibration } = body;

    if (!contextSummary || typeof contextSummary !== 'string') {
      return NextResponse.json(
        {
          ok: false,
          error: 'INVALID_INPUT',
          message: 'Context summary is required',
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

    // Build user message with context summary and baseline calibration
    let userMessage = `User intent summary:\n${contextSummary}`;
    
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
        userMessage += `\n\nBaseline calibration (use as contextual bias, not hard constraints):\n${calibrationContext.join('\n')}`;
      }
    }

    // Call OpenAI API
    let responseText: string | null = null;
    try {
      // DO NOT CHANGE MODEL — gpt-3.5-turbo is deprecated and will 404
      const completion = await openai.chat.completions.create({
        model: 'gpt-4.1-mini',
        temperature: 0.4,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMessage },
        ],
      });

      responseText = completion.choices[0]?.message?.content || null;

      if (!responseText) {
        throw new Error('Empty response from OpenAI');
      }

      console.log('[API/RESOLUTION] OpenAI response received, length:', responseText.length);
    } catch (openaiError: any) {
      console.error('[API/RESOLUTION] OpenAI error', {
        message: openaiError?.message,
        stack: openaiError?.stack,
      });
      
      return NextResponse.json(
        {
          ok: false,
          error: 'LLM_UNAVAILABLE',
          message: 'Unable to resolve guidance at this time. OpenAI request failed.',
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
      console.error('[API/RESOLUTION] JSON parse error', {
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
      console.error('[API/RESOLUTION] Validation error', {
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
    console.error('[API/RESOLUTION] Unexpected error', {
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
