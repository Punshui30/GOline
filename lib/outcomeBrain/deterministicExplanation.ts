import { OutcomeIntent, OutcomeResult, getTopTerpenes } from '@/lib/engine_core/legacy_compat';
import { STRAIN_LIBRARY } from "@/lib/strainLibrary";

export type DeterministicExplanation = {
  headline: string;
  bullets: string[];
  confidenceNote?: string;
};

export function generateDeterministicExplanation(
  intent: OutcomeIntent,
  result: OutcomeResult
): DeterministicExplanation {
  const primaryCandidate = result.primary;
  const strains = primaryCandidate.selectedCultivars
    .map((c) => STRAIN_LIBRARY[c.id])
    .filter(Boolean);

  const primaryStrain = strains[0];
  const secondaryStrain = strains[1];
  const isBlend = strains.length > 1;

  const bullets: string[] = [];

  // A4.4 Role-Aware Explanation Logic

  // 1. Primary Driver Explanation
  if (primaryStrain) {
    // Get Rarity-Weighted Top Terpenes (A4.3)
    const topTerps = getTopTerpenes(primaryStrain, 2);
    const mainTerp = topTerps[0];

    if (mainTerp) {
      bullets.push(`${primaryStrain.name} was selected for its distinct ${mainTerp.name} profile.`);
      bullets.push(`The dominance of ${mainTerp.name} (weighted by rarity) aligns with your intent.`);
    } else {
      bullets.push(`${primaryStrain.name} offers the closest overall match to your effect targets.`);
    }
  }

  // 2. Secondary Modulator Explanation
  if (isBlend && secondaryStrain) {
    const modTerps = getTopTerpenes(secondaryStrain, 1);
    if (modTerps[0]) {
      bullets.push(`${secondaryStrain.name} modulates the experience by introducing ${modTerps[0].name}.`);
    } else {
      bullets.push(`${secondaryStrain.name} adds diversity to the chemical profile to prevent effect fatigue.`);
    }
  }

  // 3. User Constraints (Why we avoided things)
  if (intent.anxietySensitivity > 0.7) {
    bullets.push("High-stimulation terpenes were penalized to respect your anxiety sensitivity.");
  }
  if (intent.avoidSedation) {
    bullets.push("Heavily sedating profiles were filtered out.");
  }

  return {
    headline: isBlend ? "Why this blend works" : "Why this strain works",
    bullets,
    confidenceNote: primaryCandidate.confidenceScore < 0.8 ? "This result required balancing competing priorities." : undefined,
  };
}


