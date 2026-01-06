/**
 * Netlify Function: Intent Parser
 * 
 * Translates natural language into structured outcome intent parameters.
 * Uses OpenAI API for intent extraction. Falls back to default intent if:
 * - API key is missing
 * - LLM call fails
 * - JSON parsing fails
 */

import { Handler } from '@netlify/functions';
import OpenAI from 'openai';

const SYSTEM_PROMPT = `You are an intent extraction system for a constrained outcome-composition engine.

Your role is NOT to give advice, recommendations, or explanations.

Your ONLY task is to translate the user's natural language description into a structured intent object.

You MUST:
- Output valid JSON only
- Use numeric values between 0 and 1
- Avoid experiential language
- Avoid cannabis folklore
- Avoid terpene claims
- Avoid predictions

Interpret nuance carefully:
- Desire for stimulation vs fear of anxiety
- Need for endurance vs aversion to intensity
- Sensitivity to overshoot

If ambiguity remains, set clarificationNeeded = true.

Output schema (JSON only):

{
  "activation": number,
  "anxietySensitivity": number,
  "cognitiveEndurance": number,
  "avoidSedation": boolean,
  "clarificationNeeded": boolean
}

Do not include any other text.`;

/**
 * Default fallback intent (moderate, balanced parameters)
 */
const DEFAULT_INTENT = {
  activation: 0.5,
  anxietySensitivity: 0.5,
  cognitiveEndurance: 0.5,
  avoidSedation: false,
  clarificationNeeded: false,
};

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
 * Validate and normalize intent object
 */
function validateIntent(parsed: any): typeof DEFAULT_INTENT {
  return {
    activation: typeof parsed.activation === 'number' 
      ? Math.max(0, Math.min(1, parsed.activation)) 
      : DEFAULT_INTENT.activation,
    anxietySensitivity: typeof parsed.anxietySensitivity === 'number'
      ? Math.max(0, Math.min(1, parsed.anxietySensitivity))
      : DEFAULT_INTENT.anxietySensitivity,
    cognitiveEndurance: typeof parsed.cognitiveEndurance === 'number'
      ? Math.max(0, Math.min(1, parsed.cognitiveEndurance))
      : DEFAULT_INTENT.cognitiveEndurance,
    avoidSedation: typeof parsed.avoidSedation === 'boolean'
      ? parsed.avoidSedation
      : DEFAULT_INTENT.avoidSedation,
    clarificationNeeded: typeof parsed.clarificationNeeded === 'boolean'
      ? parsed.clarificationNeeded
      : DEFAULT_INTENT.clarificationNeeded,
  };
}

export const handler: Handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
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
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { text } = body;

    if (!text || typeof text !== 'string') {
      return {
        statusCode: 200, // Return 200 with fallback, don't error
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          intent: DEFAULT_INTENT,
          fallback: true,
        }),
      };
    }

    // Check for API key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.warn('OPENAI_API_KEY not found, using fallback intent');
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          intent: DEFAULT_INTENT,
          fallback: true,
        }),
      };
    }

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: apiKey,
    });

    // Call OpenAI API
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: text },
        ],
        temperature: 0.3,
        max_tokens: 200,
      });

      const responseText = completion.choices[0]?.message?.content;
      if (!responseText) {
        throw new Error('Empty response from OpenAI');
      }

      // Extract and parse JSON
      const jsonStr = extractJSON(responseText);
      const parsed = JSON.parse(jsonStr);
      const validatedIntent = validateIntent(parsed);

      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          intent: validatedIntent,
          fallback: false,
        }),
      };
    } catch (llmError) {
      console.error('LLM processing error:', llmError);
      // Return fallback, never throw
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          intent: DEFAULT_INTENT,
          fallback: true,
        }),
      };
    }
  } catch (error) {
    console.error('Intent function error:', error);
    // Always return valid response, never crash
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: DEFAULT_INTENT,
        fallback: true,
      }),
    };
  }
};

