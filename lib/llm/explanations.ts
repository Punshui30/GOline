/**
 * LLM Explanation Generation
 * 
 * Generates dynamic explanations and usage instructions via LLM calls.
 * These are separate from the deterministic resolver and render progressively.
 */

import OpenAI from 'openai';
import { getAgeTone, type AgeTone } from '@/lib/ageTone';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface BlendComponent {
  name: string;
  percentage: number;
  role: string;
}

/**
 * Generate explanation for why this blend was selected
 */
export async function generateExplanation({
  userIntent,
  blend,
  constraints,
  userAge,
  dominantTerpenes,
  alternates,
}: {
  userIntent: string;
  blend: BlendComponent[];
  constraints: string[];
  userAge?: number | null;
  dominantTerpenes?: Array<{ name: string; percentage: number }>;
  alternates?: BlendComponent[][];
}): Promise<string> {
  // IMPORTANT: LLM must not choose strains. It only explains math-selected blends.
  // The blend parameter contains strains that were already selected by the deterministic engine.
  
  const blendDescription = blend
    .map((c) => `${c.name} (${c.percentage}% - ${c.role})`)
    .join(', ');

  const constraintsText = constraints.length > 0 
    ? `Key considerations: ${constraints.join(', ')}`
    : '';

  const ageTone = userAge ? getAgeTone(userAge) : 'modern';
  const toneInstructions: Record<AgeTone, string> = {
    playful: 'Use casual, energetic language with light enthusiasm. Avoid being too formal.',
    modern: 'Use contemporary, straightforward language that feels current and approachable.',
    grounded: 'Use clear, practical language with a measured tone. Prioritize clarity over excitement.',
    reassuring: 'Use calm, confident language that feels supportive and trustworthy.'
  };

  const terpeneText = dominantTerpenes && dominantTerpenes.length > 0
    ? `Dominant terpene signals: ${dominantTerpenes.slice(0, 5).map(t => `${t.name} (${(t.percentage * 100).toFixed(1)}%)`).join(', ')}`
    : '';

  const alternatesText = alternates && alternates.length > 0
    ? `\n\nAlternate viable blends (for context only - do not recommend, only explain differences if relevant):\n${alternates.map((alt, idx) => `Alternate ${idx + 1}: ${alt.map(c => `${c.name} (${c.percentage}%)`).join(' + ')}`).join('\n')}`
    : '';

  const prompt = `You are explaining why a cannabis blend was selected for a user.

CRITICAL: This blend was already selected by a deterministic math engine. Your job is ONLY to explain why it works, not to select or recommend strains.

User's request: "${userIntent}"
User age: ${userAge ? userAge : 'not provided'}
Communication tone: ${ageTone} - ${toneInstructions[ageTone]}

Selected blend (already chosen by math engine): ${blendDescription}
${constraintsText}
${terpeneText}${alternatesText}

Generate a clear, natural explanation (2-3 sentences) that:
- References what the user said they wanted
- Explains why this specific blend (already selected) matches their needs
- Uses ${ageTone} tone: ${toneInstructions[ageTone]}
- Uses plain, consumer-friendly language
- Does NOT mention internal risk models, technical terms, or medical claims unless the user explicitly mentioned them
- Does NOT use slang or stoner-coded language
- Does NOT reuse strain names in the explanation (focus on effects, not cultivar names)
- Does NOT invent strain logic or reference strain stereotypes
- Does NOT assume conditions not stated by the user

Return ONLY the explanation text. No markdown, no formatting, no quotes.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a helpful cannabis advisor who explains blend selections in plain, clear language.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.4,
      max_tokens: 300,
    });

    return completion.choices[0]?.message?.content?.trim() || '';
  } catch (error) {
    console.error('Error generating explanation:', error);
    return '';
  }
}

/**
 * Generate usage instructions for this blend
 */
export async function generateUsageInstructions({
  blend,
  intensity,
  duration,
  userAge,
}: {
  blend: BlendComponent[];
  intensity: number; // 0-1
  duration: number; // 0-1 (how long effects should last)
  userAge?: number | null;
}): Promise<string> {
  // Build precise blend description with exact percentages
  const blendDescription = blend
    .map((c) => `${c.name} (${c.percentage}%)`)
    .join(' + ');
  
  // Check if all percentages are equal
  const allEqual = blend.length > 0 && blend.every(c => c.percentage === blend[0].percentage);
  
  const intensityLevel = intensity > 0.7 ? 'higher' : intensity > 0.4 ? 'moderate' : 'gentle';
  const durationLevel = duration > 0.7 ? 'longer-lasting' : duration > 0.4 ? 'moderate duration' : 'shorter duration';

  const ageTone = userAge ? getAgeTone(userAge) : 'modern';
  const toneInstructions: Record<AgeTone, string> = {
    playful: 'Use casual, friendly language with light enthusiasm.',
    modern: 'Use contemporary, straightforward language.',
    grounded: 'Use clear, practical language with a measured tone.',
    reassuring: 'Use calm, confident language that feels supportive.'
  };

  const prompt = `Generate simple, practical usage instructions for a cannabis blend.

User age: ${userAge ? userAge : 'not provided'}
Communication tone: ${ageTone} - ${toneInstructions[ageTone]}

EXACT BLEND RATIOS: ${blendDescription}
Intensity: ${intensityLevel}
Duration expectation: ${durationLevel}

CRITICAL: Use the EXACT percentages provided above. ${allEqual ? 'All components are equal parts.' : 'The ratios are NOT equal - reference the specific percentages.'} Do NOT suggest "equal parts" unless all percentages are identical. Do NOT contradict or approximate the provided ratios.

Provide clear, actionable guidance (3-4 sentences) covering:
- How to mix and consume this blend using the exact ratios provided
- Recommended pacing (start slow, wait before more)
- What to expect (onset time, peak, duration)
- Tips for best experience

Use plain language. Assume the user is not an expert.
Avoid medical claims.
Focus on practical, consumer-friendly advice.
Reference the specific percentages when describing the blend.

Return ONLY the instructions text. No markdown, no formatting, no quotes.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a helpful cannabis advisor providing practical usage guidance.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.4,
      max_tokens: 400,
    });

    return completion.choices[0]?.message?.content?.trim() || '';
  } catch (error) {
    console.error('Error generating usage instructions:', error);
    return '';
  }
}

