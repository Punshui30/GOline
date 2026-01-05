/**
 * Diagnostic function: Minimal OpenAI test
 * 
 * This isolates the OpenAI SDK/runtime/API key issue from app logic.
 * Hit this directly: /.netlify/functions/ping-openai
 */

import { Handler } from '@netlify/functions';
import OpenAI from 'openai';

export const handler: Handler = async () => {
  try {
    const apiKey = process.env.OPEN_AI_KEY || process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ok: false,
          error: 'NO_API_KEY',
          message: 'API key not found in environment',
        }),
      };
    }

    const client = new OpenAI({ apiKey });

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'user', content: 'Say hello' },
      ],
      max_tokens: 10,
    });

    const text = completion.choices[0]?.message?.content || '';

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ok: true,
        text: text,
      }),
    };
  } catch (err: any) {
    console.error('[PING-OPENAI] RAW ERROR OBJECT:', err);
    console.error('[PING-OPENAI] RAW ERROR STRING:', String(err));
    console.error('[PING-OPENAI] RAW ERROR JSON:', JSON.stringify(err, Object.getOwnPropertyNames(err)));

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ok: false,
        error: 'OPENAI_ERROR',
        debug: String(err),
      }),
    };
  }
};









