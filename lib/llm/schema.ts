/**
 * Zod schemas for LLM response validation
 */

import { z } from 'zod';

export const NormalizerResultSchema = z.object({
  normalized_text: z.string(),
  signals: z.array(z.string()),
  questions_needed: z.array(z.string()).optional(),
});

export type NormalizerResultSchemaType = z.infer<typeof NormalizerResultSchema>;

export const RouterResultSchema = z.object({
  confidence: z.number().min(0).max(1),
  candidate_routes: z.array(
    z.object({
      id: z.string(),
      score: z.number().min(0).max(1),
    })
  ),
  extracted_facts: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
  crisis_flags: z.array(z.string()),
  rationale_short: z.string(),
});

export type RouterResultSchemaType = z.infer<typeof RouterResultSchema>;

