/**
 * Netlify Function: Intent Parser
 * 
 * LLM-REQUIRED MODE
 * This function requires live LLM-based intent extraction.
 * No fallbacks. No defaults. No silent failures.
 * 
 * Returns explicit success or failure responses.
 */

import { Handler } from '@netlify/functions';
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

CLARIFICATION DETECTION:
If you detect ambiguity, add clarification questions:
- Temporal: "Is this mostly about how you feel at the start, later, or both?" → ["Start", "Later", "Both"]
- Tradeoff: "If there's a tradeoff, which matters more?" → ["Feeling energized", "Avoiding anxiety"]
- Tolerance: "Do you prefer a gentle, steady effect or a stronger peak?" → ["Gentle & steady", "Stronger peak"]

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
function validateGuidance(parsed: any): any {
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

export const handler: Handler = async (event, context) => {
  // 1️⃣ Function entry
  console.log('[INTENT] Function invoked');
  console.log('[INTENT] Function invoked:', {
    method: event.httpMethod,
    path: event.path,
    hasBody: !!event.body,
  });

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    console.log('[INTENT] Returning OPTIONS response');
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json',
      },
      body: '',
    };
  }

  // Only allow POST
  if (event.httpMethod !== 'POST') {
    console.log('[INTENT] Returning 405 - method not allowed:', event.httpMethod);
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ok: false,
        error: 'METHOD_NOT_ALLOWED',
        message: 'Only POST requests are allowed',
      }),
    };
  }

  // 2️⃣ Environment visibility (runtime only)
  console.log('[INTENT] process.env.OPEN_AI_KEY present:', Boolean(process.env.OPEN_AI_KEY));
  console.log('[INTENT] process.env.OPENAI_API_KEY present:', Boolean(process.env.OPENAI_API_KEY));
  console.log('[INTENT] process.env keys:', Object.keys(process.env).filter(k => k.includes('OPEN') || k.includes('AI') || k.includes('NETLIFY')));


  // Ensure all errors are caught
  try {
    // 3️⃣ Request payload verification
    console.log('[INTENT] Raw request body:', event.body);

    let body;
    try {
      body = JSON.parse(event.body || '{}');
      console.log('[INTENT] Parsed body:', { hasText: !!body.text, textLength: body.text?.length || 0 });
    } catch (parseError) {
      console.error('[INTENT] Failed to parse request body:', parseError);
      console.log('[INTENT] Returning response', { ok: false, source: 'error' });
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          ok: false,
          error: 'INVALID_INPUT',
          message: 'Invalid JSON in request body',
        }),
      };
    }
    
    const { text } = body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      console.log('[INTENT] Skipping OpenAI call because: No text input provided');
      console.log('[INTENT] Returning response', { ok: false, source: 'error' });
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          ok: false,
          error: 'INVALID_INPUT',
          message: 'Text input is required',
        }),
      };
    }

    // Determine LLM provider
    const llmProvider = (process.env.LLM_PROVIDER || 'openai').toLowerCase();
    console.log('[INTENT] LLM Provider:', llmProvider);

    const messages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      { role: 'user' as const, content: text },
    ];

    let responseText: string | null = null;

    if (llmProvider === 'ollama') {
      // Ollama provider
      const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
      const ollamaModel = process.env.OLLAMA_MODEL || 'llama3.2';
      console.log('[INTENT] Using Ollama:', { baseUrl: ollamaBaseUrl, model: ollamaModel });

      try {
        const ollamaResponse = await fetch(`${ollamaBaseUrl}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: ollamaModel,
            messages: messages,
            options: {
              temperature: 0.3,
              num_predict: 400,
            },
            stream: false,
          }),
        });

        if (!ollamaResponse.ok) {
          throw new Error(`Ollama API error: ${ollamaResponse.status} ${ollamaResponse.statusText}`);
        }

        const ollamaData = await ollamaResponse.json();
        responseText = ollamaData.message?.content || null;

        if (!responseText) {
          throw new Error('Empty response from Ollama');
        }

        console.log('[INTENT] Ollama response received, length:', responseText.length);
      } catch (ollamaError: any) {
        console.error('[INTENT] Ollama error', {
          message: ollamaError?.message,
          stack: ollamaError?.stack,
        });
        return {
          statusCode: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({
            ok: false,
            error: 'LLM_UNAVAILABLE',
            message: 'Unable to interpret intent at this time. Ollama request failed.',
          }),
        };
      }
    } else {
      // OpenAI provider (default)
      const apiKey = process.env.OPEN_AI_KEY || process.env.OPENAI_API_KEY;
      if (!apiKey) {
        console.log('[INTENT] Skipping OpenAI call because: API key not found');
        console.log('[INTENT] Returning response', { ok: false, source: 'error' });
        return {
          statusCode: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({
            ok: false,
            error: 'LLM_UNAVAILABLE',
            message: 'Unable to interpret intent at this time.',
          }),
        };
      }

      console.log('[INTENT] API key found, length:', apiKey?.length || 0);
      console.log('[INTENT] Initializing OpenAI client');

      const openai = new OpenAI({
        apiKey: apiKey,
      });

      console.log('[INTENT] About to call OpenAI');

      try {
        console.log('[INTENT] Calling OpenAI API...');
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: messages,
          temperature: 0.3,
          max_tokens: 400,
        });

        responseText = completion.choices[0]?.message?.content || null;

        if (!responseText) {
          throw new Error('Empty response from OpenAI');
        }

        console.log('[INTENT] OpenAI response received, length:', responseText.length);
      } catch (apiError: any) {
        console.error('[INTENT] OpenAI error', {
          name: apiError?.name,
          message: apiError?.message,
          status: apiError?.status || apiError?.response?.status,
          code: apiError?.code,
          type: apiError?.constructor?.name,
        });
        return {
          statusCode: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({
            ok: false,
            error: 'LLM_UNAVAILABLE',
            message: 'Unable to interpret intent at this time.',
          }),
        };
      }
    }

    if (!responseText) {
      console.error('[INTENT] Empty response from LLM');
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          ok: false,
          error: 'LLM_UNAVAILABLE',
          message: 'Unable to interpret intent at this time.',
        }),
      };
    }

    console.log('[INTENT] Response text received, length:', responseText.length);

    // Extract and parse JSON
    let parsed;
    try {
      console.log('[INTENT] Extracting JSON from response');
      const jsonStr = extractJSON(responseText);
      parsed = JSON.parse(jsonStr);
      console.log('[INTENT] JSON parsed successfully');
    } catch (parseError) {
      console.error('[INTENT] JSON parse error:', parseError);
      console.log('[INTENT] Returning response', { ok: false, source: 'error' });
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          ok: false,
          error: 'LLM_UNAVAILABLE',
          message: 'Unable to interpret intent at this time.',
        }),
      };
    }

    // Validate strategic guidance
    let validatedGuidance;
    try {
      console.log('[INTENT] Validating strategic guidance');
      validatedGuidance = validateGuidance(parsed);
      console.log('[INTENT] Guidance validated successfully');
    } catch (validationError: any) {
      console.error('[INTENT] Guidance validation error:', validationError);
      console.log('[INTENT] Returning response', { ok: false, source: 'error' });
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          ok: false,
          error: 'LLM_UNAVAILABLE',
          message: 'Unable to interpret intent at this time.',
        }),
      };
    }

    // 7️⃣ Final return path (success)
    console.log('[INTENT] Returning response', { ok: true, source: 'llm' });
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        ok: true,
        guidance: validatedGuidance,
      }),
    };
  } catch (err: any) {
    console.error('[INTENT] RAW ERROR OBJECT:', err);
    console.error('[INTENT] RAW ERROR STRING:', String(err));
    console.error('[INTENT] RAW ERROR JSON:', JSON.stringify(err, Object.getOwnPropertyNames(err)));
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        ok: false,
        error: 'LLM_UNAVAILABLE',
        debug: String(err),
      }),
    };
  }
};
