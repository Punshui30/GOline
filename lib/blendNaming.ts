import { OutcomeIntent } from './engine_core/legacy_compat';

/**
 * Deterministically generates a blend name based on intent.
 * Focuses on effect direction rather than ingredients.
 */
export function generateBlendName(intent: OutcomeIntent | null): string {
    if (!intent) return "Custom Blend";

    // Factors
    const energy = intent.activation ?? 0.5;
    const focus = (intent.cognitiveClarity ?? 0.5) + (intent.cognitiveEndurance ?? 0.5); // 0-2 range effectively
    const body = intent.bodyLoadPreference ?? 0.5;
    const anxiety = intent.anxietySensitivity ?? 0.5;

    // 1. Determine Prefix (Energy/Vibe)
    let prefix = "";
    if (energy > 0.7) prefix = "Alert";
    else if (energy > 0.55) prefix = "Active";
    else if (energy < 0.3) prefix = "Deep";
    else if (energy < 0.45) prefix = "Calm";
    else prefix = "Balanced";

    // 2. Determine Core (Function)
    let core = "Flow";
    if (focus > 1.4) core = "Focus";
    else if (body > 0.7) core = "Relief";
    else if (intent.physicalRelief && intent.physicalRelief > 0.7) core = "Repair";
    else if (intent.functionalEnergy && intent.functionalEnergy > 0.7) core = "Drive";
    else if (anxiety > 0.7) core = "Comfort"; // High sensitivity -> comfort

    // 3. Determine Suffix (Structure)
    let suffix = "Blend";
    if (energy > 0.8 && focus > 1.5) suffix = "Matrix";
    else if (body > 0.8) suffix = "Extract"; // Sounds heavy
    else if (energy < 0.3 && body > 0.7) suffix = "Rest";
    else if (energy > 0.6 && body < 0.4) suffix = "Lift";

    // Combinations overrides
    if (prefix === "Balanced" && core === "Flow") return "Equilibrium Blend";
    if (prefix === "Deep" && core === "Relief") return "Sedation Stack";

    return `${prefix} ${core} ${suffix}`;
}
