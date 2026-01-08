/**
 * Blend Social Generation
 * 
 * Generates age-aware blend nickname, hashtag, and share caption.
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

export interface BlendSocialOutput {
  blendNickname: string;
  blendHashtag: string;
  shareCaption: string;
}

/**
 * Generate blend nickname, hashtag, and share caption
 */
export async function generateBlendSocial({
  userIntent,
  blend,
  userAge,
  dominantTerpenes,
}: {
  userIntent: string;
  blend: BlendComponent[];
  userAge?: number | null;
  dominantTerpenes?: Array<{ name: string; percentage: number }>;
}): Promise<BlendSocialOutput> {
  const blendDescription = blend
    .map((c) => `${c.name} (${c.percentage}%)`)
    .join(' + ');

  const ageTone = userAge ? getAgeTone(userAge) : 'modern';
  const toneInstructions: Record<AgeTone, string> = {
    playful: 'Casual, fun, energetic language. Can be slightly creative.',
    modern: 'Contemporary, fresh, straightforward language.',
    grounded: 'Practical, clear, measured language.',
    reassuring: 'Calm, confident, supportive language.'
  };

  const terpeneText = dominantTerpenes && dominantTerpenes.length > 0
    ? `Dominant terpene signals: ${dominantTerpenes.slice(0, 5).map(t => `${t.name} (${(t.percentage * 100).toFixed(1)}%)`).join(', ')}`
    : '';

  const prompt = `Generate a blend nickname, hashtag, and share caption for a cannabis blend.

User's request: "${userIntent}"
User age: ${userAge ? userAge : 'not provided'}
Communication tone: ${ageTone} - ${toneInstructions[ageTone]}

Selected blend: ${blendDescription}
${terpeneText}

Requirements:
1. blendNickname: A short, human, memorable name (2-3 words max). Do NOT reuse strain names. Make it descriptive of the effect or feeling.
2. blendHashtag: A social-safe hashtag (alphanumeric only, no spaces, max 20 chars). Do NOT reuse strain names.
3. shareCaption: A shareable caption (≤160 characters) that describes the blend and its intended effect. Use ${ageTone} tone.

Return as JSON only:
{
  "blendNickname": "...",
  "blendHashtag": "#...",
  "shareCaption": "..."
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a helpful assistant that generates age-appropriate social content for cannabis blends. Always return valid JSON only.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.6,
      max_tokens: 300,
    });

    const content = completion.choices[0]?.message?.content?.trim() || '';
    
    // Extract JSON from response (handle markdown code blocks if present)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate and truncate caption if needed
      if (parsed.shareCaption && parsed.shareCaption.length > 160) {
        parsed.shareCaption = parsed.shareCaption.substring(0, 157) + '...';
      }
      
      return {
        blendNickname: parsed.blendNickname || '',
        blendHashtag: parsed.blendHashtag || '',
        shareCaption: parsed.shareCaption || '',
      };
    }

    return {
      blendNickname: '',
      blendHashtag: '',
      shareCaption: '',
    };
  } catch (error) {
    console.error('Error generating blend social content:', error);
    return {
      blendNickname: '',
      blendHashtag: '',
      shareCaption: '',
    };
  }
}

