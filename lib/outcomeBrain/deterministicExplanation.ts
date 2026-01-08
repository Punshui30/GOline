import { OutcomeIntent, OutcomeResult } from "@/lib/goOutcomeEngine";
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
  // Handle new format with primary + alternates
  const primaryCandidate = result.primary;
  const strains = primaryCandidate.selectedCultivars
    .map((c) => STRAIN_LIBRARY[c.id])
    .filter(Boolean);

  const primaryStrain = strains[0];
  const isBlend = strains.length > 1;

  // Use primary candidate's ratios for calculations
  const ratios = primaryCandidate.ratios;
  
  const axes = [
    { key: "activation", label: "energy / alertness", value: intent.activation },
    { key: "cognitiveEndurance", label: "mental endurance", value: intent.cognitiveEndurance },
    { key: "anxietySensitivity", label: "anxiety control", value: intent.anxietySensitivity },
    { key: "bodyLoadPreference", label: "body vs head effect", value: intent.bodyLoadPreference ?? 0.5 },
  ];

  const dominantAxis =
    axes
      .filter((a) => typeof a.value === "number")
      .sort(
        (a, b) =>
          Math.abs((b.value ?? 0) - 0.5) - Math.abs((a.value ?? 0) - 0.5)
      )[0] || axes[0];

  const bullets: string[] = [];

  if (isBlend) {
    bullets.push(
      `This result uses a ${strains.length}-cultivar blend to more closely match your desired ${dominantAxis.label}.`
    );
    bullets.push(
      "No single cultivar minimized the distance across all requested dimensions, so a blend produced a tighter overall fit."
    );
  } else if (primaryStrain) {
    bullets.push(
      `${primaryStrain.name} alone already aligns closely with your requested ${dominantAxis.label}.`
    );
    bullets.push(
      "Introducing additional cultivars would have increased deviation from your target profile."
    );
  }

  if (intent.anxietySensitivity > 0.6) {
    bullets.push(
      "Strains with higher anxiety risk were penalized heavily based on your sensitivity setting."
    );
  }

  if (intent.activation > 0.7 && primaryStrain && primaryStrain.effects.calm > 60) {
    bullets.push(
      "A small amount of calming effect was accepted to preserve mental clarity and functional control."
    );
  }

  let confidenceNote: string | undefined;
  if (primaryCandidate.confidenceScore < 0.65) {
    confidenceNote =
      "This intent required balancing competing goals, so the result is an optimized compromise rather than a perfect match.";
  }

  return {
    headline: isBlend ? "Why this blend was selected" : "Why this strain was selected",
    bullets,
    confidenceNote,
  };
}


