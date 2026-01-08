/**
 * Generate dynamic, blend-specific notes
 * Notes must include strain names, ratios, path type, and why this blend was chosen
 */

import { BlendCandidate } from './goOutcomeEngine';
import { Strain } from './strainLibrary';

export interface BlendNotesInput {
  candidate: BlendCandidate;
  strains: Strain[];
  ratios: number[];
  isPrimary: boolean;
  primaryStrainName?: string;
  confidenceScore: number;
  distance: number;
  diversityInfluenced?: boolean;
  stability?: number;
  risk?: number;
  biphasicIssues?: string[];
}

/**
 * Generate dynamic notes that are specific to this blend
 * Notes include strain names, ratios, path type, and blend characteristics
 */
export function generateBlendNotes(input: BlendNotesInput): string[] {
  const { candidate, strains, ratios, isPrimary, confidenceScore, distance, diversityInfluenced, stability, risk, biphasicIssues } = input;
  
  const notes: string[] = [];
  
  // Path identification
  if (isPrimary) {
    notes.push(`Primary recommendation: ${strains.map((s, i) => `${s.name} (${ratios[i].toFixed(0)}%)`).join(' + ')}`);
  } else {
    notes.push(`Alternate path: ${strains.map((s, i) => `${s.name} (${ratios[i].toFixed(0)}%)`).join(' + ')}`);
  }
  
  // Confidence-based notes with blend context
  if (confidenceScore < 0.6) {
    const dominantStrain = strains[ratios.indexOf(Math.max(...ratios))];
    notes.push(`Lower confidence match (${(confidenceScore * 100).toFixed(0)}%) — ${dominantStrain.name} leads this blend but may require adjustment.`);
  } else if (confidenceScore >= 0.8) {
    const dominantStrain = strains[ratios.indexOf(Math.max(...ratios))];
    notes.push(`Strong match (${(confidenceScore * 100).toFixed(0)}%) — ${dominantStrain.name} aligns well with your intent.`);
  }
  
  // Blend composition insights
  if (strains.length === 2) {
    const [strain1, strain2] = strains;
    const [ratio1, ratio2] = ratios;
    notes.push(`Two-strain blend: ${strain1.name} (${ratio1.toFixed(0)}%) provides primary effects, ${strain2.name} (${ratio2.toFixed(0)}%) adds complementary balance.`);
  } else if (strains.length >= 3) {
    const dominantIndex = ratios.indexOf(Math.max(...ratios));
    const dominantStrain = strains[dominantIndex];
    const supportingStrains = strains.filter((_, i) => i !== dominantIndex);
    notes.push(`Multi-strain blend: ${dominantStrain.name} (${ratios[dominantIndex].toFixed(0)}%) anchors the blend, supported by ${supportingStrains.map((s, i) => {
      const idx = strains.indexOf(s);
      return `${s.name} (${ratios[idx].toFixed(0)}%)`;
    }).join(' and ')}.`);
  }
  
  // Diversity influence (subtle, without revealing mechanics)
  if (diversityInfluenced) {
    notes.push(`This blend balances optimal match with system diversity for consistent recommendations.`);
  }
  
  // Stability and risk notes with blend context
  if (stability !== undefined) {
    if (stability < 0.6) {
      const dominantStrain = strains[ratios.indexOf(Math.max(...ratios))];
      notes.push(`Moderate stability — effects from ${dominantStrain.name} may vary with individual response.`);
    } else if (stability >= 0.8) {
      notes.push(`High stability — blend composition should produce consistent effects.`);
    }
  }
  
  if (risk !== undefined && risk > 0.5) {
    const dominantStrain = strains[ratios.indexOf(Math.max(...ratios))];
    notes.push(`Higher intensity profile — start with lower doses, especially with ${dominantStrain.name} as the dominant component.`);
  }
  
  // Biphasic issues with strain context
  if (biphasicIssues && biphasicIssues.length > 0) {
    biphasicIssues.forEach(issue => {
      // Try to include strain name if mentioned in issue
      const relevantStrain = strains.find(s => issue.toLowerCase().includes(s.name.toLowerCase()));
      if (relevantStrain) {
        notes.push(`${relevantStrain.name}: ${issue}`);
      } else {
        notes.push(`Blend note: ${issue}`);
      }
    });
  }
  
  // Distance from target (if significantly off)
  if (distance > 0.3) {
    const dominantStrain = strains[ratios.indexOf(Math.max(...ratios))];
    notes.push(`This blend approximates your intent — ${dominantStrain.name} provides the closest available match.`);
  }
  
  return notes;
}
