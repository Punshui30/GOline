/**
 * LLM adapter layer - Two-step pipeline: normalize → route
 * OpenAI-only implementation
 */

import OpenAI from 'openai';
import {
  NormalizerResultSchema,
  NormalizerResultSchemaType,
  RouterResultSchema,
  RouterResultSchemaType,
} from './schema';
import {
  getNormalizerPrompt,
  getRouterPrompt,
  getClarifyPrompt,
  getRepairPrompt,
} from './prompts';
import { ConversationContext } from '../flow/types';

export class LLMAdapter {
  private openai: OpenAI;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Generate text using OpenAI
   */
  private async generate(prompt: string): Promise<string> {
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 1000,
    });

    return completion.choices[0]?.message?.content || '';
  }

  /**
   * Step 1: Normalize raw user input (handles slang, fragments, profanity)
   */
  async normalize(userText: string): Promise<NormalizerResultSchemaType> {
    const prompt = getNormalizerPrompt(userText);
    const response = await this.generate(prompt);

    const jsonStr = this.extractJSON(response);
    
    // Try to parse and validate
    try {
      const parsed = JSON.parse(jsonStr);
      return NormalizerResultSchema.parse(parsed);
    } catch (error) {
      // Repair attempt 1
      console.warn('Normalizer: First JSON parse failed, attempting repair...', error);
      const repairPrompt = getRepairPrompt(
        response,
        '{"normalized_text": "string", "signals": ["string"], "questions_needed": ["string"]}'
      );
      const repairResponse = await this.generate(repairPrompt);
      const repairJsonStr = this.extractJSON(repairResponse);
      
      try {
        const parsed = JSON.parse(repairJsonStr);
        return NormalizerResultSchema.parse(parsed);
      } catch (retryError) {
        console.error('Normalizer: Repair attempt failed:', retryError);
        // Fallback: return minimal valid result
        return {
          normalized_text: userText,
          signals: [],
          questions_needed: ['Can you tell me more about what you need help with?'],
        };
      }
    }
  }

  /**
   * Step 2: Route normalized text to determine which playbook/route to use
   */
  async route(
    normalizedText: string,
    signals: string[],
    context?: ConversationContext
  ): Promise<RouterResultSchemaType> {
    const contextStr = context
      ? `Previous conversation:\n${context.userMessages.slice(-2).join('\n')}\n`
      : '';

    const prompt = getRouterPrompt(normalizedText, signals, contextStr);
    const response = await this.generate(prompt);

    const jsonStr = this.extractJSON(response);

    // Try to parse and validate
    try {
      const parsed = JSON.parse(jsonStr);
      return RouterResultSchema.parse(parsed);
    } catch (error) {
      // Repair attempt 1
      console.warn('Router: First JSON parse failed, attempting repair...', error);
      const repairPrompt = getRepairPrompt(
        response,
        '{"confidence": 0.0-1.0, "candidate_routes": [{"id": "string", "score": 0.0-1.0}], "extracted_facts": {}, "crisis_flags": ["string"], "rationale_short": "string"}'
      );
      const repairResponse = await this.generate(repairPrompt);
      const repairJsonStr = this.extractJSON(repairResponse);
      
      try {
        const parsed = JSON.parse(repairJsonStr);
        return RouterResultSchema.parse(parsed);
      } catch (retryError) {
        console.error('Router: Repair attempt failed:', retryError);
        // Fallback: route to META_UNKNOWN
        return {
          confidence: 0.3,
          candidate_routes: [{ id: 'META_UNKNOWN', score: 1.0 }],
          extracted_facts: {} as Record<string, string | number | boolean>,
          crisis_flags: [],
          rationale_short: 'Routing failed, using fallback',
        };
      }
    }
  }

  /**
   * Full pipeline: normalize then route
   */
  async normalizeAndRoute(
    userText: string,
    context?: ConversationContext
  ): Promise<{
    normalized: NormalizerResultSchemaType;
    routed: RouterResultSchemaType;
  }> {
    const normalized = await this.normalize(userText);
    const routed = await this.route(normalized.normalized_text, normalized.signals, context);
    return { normalized, routed };
  }

  /**
   * Generate clarification question
   */
  async clarify(userText: string, clarificationNeeded: string): Promise<string> {
    const prompt = getClarifyPrompt(userText, clarificationNeeded);
    const response = await this.generate(prompt);
    return response.trim().replace(/^["']|["']$/g, ''); // Remove quotes if present
  }

  /**
   * Extract JSON from response (handles markdown code blocks, extra text, etc.)
   */
  private extractJSON(response: string): string {
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
}
