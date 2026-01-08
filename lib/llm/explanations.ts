/**
 * LLM Explanation Generation
 * 
 * Generates dynamic explanations and usage instructions via LLM calls.
 * These are separate from the deterministic resolver and render progressively.
 */

import OpenAI from 'openai';

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
}: {
  userIntent: string;
  blend: BlendComponent[];
  constraints: string[];
}): Promise<string> {
  const blendDescription = blend
    .map((c) => `${c.name} (${c.percentage}% - ${c.role})`)
    .join(', ');

  const constraintsText = constraints.length > 0 
    ? `Key considerations: ${constraints.join(', ')}`
    : '';

  const prompt = `You are explaining why a cannabis blend was selected for a user.

User's request: "${userIntent}"

Selected blend: ${blendDescription}
${constraintsText}

Generate a clear, natural explanation (2-3 sentences) that:
- References what the user said they wanted
- Explains why this specific blend matches their needs
- Uses plain, consumer-friendly language
- Does NOT mention internal risk models, technical terms, or medical claims unless the user explicitly mentioned them
- Does NOT use slang or stoner-coded language

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
}: {
  blend: BlendComponent[];
  intensity: number; // 0-1
  duration: number; // 0-1 (how long effects should last)
}): Promise<string> {
  // Build precise blend description with exact percentages
  const blendDescription = blend
    .map((c) => `${c.name} (${c.percentage}%)`)
    .join(' + ');
  
  // Check if all percentages are equal
  const allEqual = blend.length > 0 && blend.every(c => c.percentage === blend[0].percentage);
  
  const intensityLevel = intensity > 0.7 ? 'higher' : intensity > 0.4 ? 'moderate' : 'gentle';
  const durationLevel = duration > 0.7 ? 'longer-lasting' : duration > 0.4 ? 'moderate duration' : 'shorter duration';

  const prompt = `Generate simple, practical usage instructions for a cannabis blend.

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

