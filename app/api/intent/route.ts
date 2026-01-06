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

Your role is to analyze user intent and provide strategic guidance that shapes how the deterministic engine explores the solution space.

YOU DECIDE: What matters and how to approach the problem.
THE ENGINE DECIDES: What is allowed and what the final numbers are.

YOU MUST:
- Infer priorities, not compute ratios
- Detect conflicts and tradeoffs
- Suggest resolution strategies (hypotheses, not decisions)
- Flag risk zones
- Identify when clarification is needed
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

CLARIFICATION DETECTION:
If you detect ambiguity, add clarification questions. Questions must be:
- Neutral and optional (never force binary trade-offs)
- Include "none", "balanced", "unsure", or "neither" as valid options
- Prefer sensitivity checks, avoidance checks, or confirmation checks
- Never assume a trade-off exists before asking

Examples of GOOD clarification questions:
- Temporal: "Is this mostly about how you feel at the start, later, or both?" → ["Start", "Later", "Both", "Unsure"]
- Sensitivity: "Are there any effects you're especially sensitive to, or should I assume a balanced approach?" → ["Overstimulation", "Mental drift", "Anxiety", "None / Balanced"]
- Social: "In social settings, do you generally have more issues with overstimulation, losing conversational flow, both, or neither?" → ["Overstimulation", "Losing flow", "Both", "Neither"]
- Tolerance: "Do you prefer a gentle, steady effect, a stronger peak, or are you unsure?" → ["Gentle & steady", "Stronger peak", "Unsure"]

Examples of BAD clarification questions (DO NOT USE):
- "Which matters more: X or Y?" (forces trade-off)
- "Do you want A or B?" (binary choice without escape)
- Any question without a "none/balanced/unsure" option when appropriate

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
- No explanations
- No commentary
- Do not omit any keys
- Use empty arrays [] if no values exist for array fields
- clarificationNeeded is optional (may be omitted if empty, or use [])

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

  // Validate arrays (with fallback to empty arrays if missing)
  const arrayFields = ['dominantPriorities', 'strictAvoidances', 'acceptableTradeoffs', 'suggestedStrategies', 'riskFlags'];
  for (const field of arrayFields) {
    if (parsed[field] === undefined || parsed[field] === null) {
      parsed[field] = []; // Default to empty array if missing
    } else if (!Array.isArray(parsed[field])) {
      throw new Error(`Invalid guidance: ${field} must be an array, got ${typeof parsed[field]}`);
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
