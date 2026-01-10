import { STRAIN_LIBRARY, type Strain, type TerpeneProfile } from '@/lib/strainLibrary';
import { type BlendCandidate } from '@/lib/engine_core/legacy_compat';

/**
 * Generate a credibility-building explanation for a recommended blend.
 * 
 * Rules:
 * 1. Name 2-3 specific terpenes max.
 * 2. Assign functional roles: Primary Driver, Counterbalance, Stabilizer.
 * 3. Explicitly mention when a terpene is limited/restrained to avoid side effects.
 * 4. Tone: Confident, neutral, non-marketing ("Show the work").
 */
export function generateEffectiveExplanation(blend: BlendCandidate): string {
    if (!blend || !blend.cultivars || blend.cultivars.length === 0) {
        return "This recommendation is based on your selected criteria.";
    }

    // 1. Calculate Aggregate Terpene Profile for the Blend
    const aggregateProfile: Record<keyof TerpeneProfile, number> = {
        myrcene: 0, limonene: 0, caryophyllene: 0, pinene: 0, humulene: 0, linalool: 0, terpinolene: 0
    };

    // Weights sum calculated from cultivar ratios
    const totalRatio = blend.cultivars.reduce((a, b) => a + (b.ratio || 0), 0);

    blend.cultivars.forEach((cultivar) => {
        const strain = STRAIN_LIBRARY[cultivar.id];
        if (!strain) return;

        // Convert ratio strength to 0-1
        const weight = totalRatio > 0 ? (cultivar.ratio || 0) / totalRatio : 0;

        // Add weighted terpenes
        Object.keys(aggregateProfile).forEach((key) => {
            const terpKey = key as keyof TerpeneProfile;
            aggregateProfile[terpKey] += (strain.terpenes[terpKey] || 0) * weight;
        });
    });

    // 2. Identify Top 3 Terpenes
    const sortedTerpenes = Object.entries(aggregateProfile)
        .sort(([, a], [, b]) => b - a)
        .map(([key, value]) => ({ name: key, value }));

    const [top1, top2, top3] = sortedTerpenes;

    // 3. Construct Narrative based on functional roles
    // We infer roles from the terpene identity itself known properties
    const getRoleDescription = (name: string, role: string, isDominant: boolean) => {
        switch (name) {
            case 'limonene':
                return isDominant ? "supports mood elevation and mental clarity" : "adds a layer of functional energy";
            case 'myrcene':
                return isDominant ? "provides deep physical relaxation" : "is included at lower levels to avoid heavy sedation";
            case 'caryophyllene':
                return "reduces physical tension and anxiety";
            case 'pinene':
                return "promotes alertness and focus";
            case 'linalool':
                return "counterbalances stimulation with calming properties";
            case 'terpinolene':
                return "systemic activation and complex cerebral effects";
            case 'humulene':
                return "suppresses appetite and provides anti-inflammatory grounding";
            default:
                return "contributes to the entourage effect";
        }
    };

    const primary = top1;
    const secondary = top2;
    const tertiary = top3;

    let text = `This recommendation is driven primarily by ${primary.name}, which ${getRoleDescription(primary.name, 'driver', true)}.`;

    if (secondary) {
        // Check if secondary is a counterbalance or support
        const isCounterbalance =
            (primary.name === 'limonene' && secondary.name === 'linalool') ||
            (primary.name === 'pinene' && secondary.name === 'myrcene') ||
            (primary.name === 'terpinolene' && secondary.name === 'caryophyllene');

        if (isCounterbalance) {
            text += ` To prevent overstimulation, ${secondary.name} is included to counterbalance and smooth the experience.`;
        } else {
            text += ` ${secondary.name.charAt(0).toUpperCase() + secondary.name.slice(1)} acts as a stabilizer, helping to ${getRoleDescription(secondary.name, 'stabilizer', false)}.`;
        }
    }

    // Handle Myrcene special case (Restraint explanation)
    // If myrcene is present but NOT dominant (e.g. pos 2 or 3, or even lower but significant), explain restraint
    if (primary.name !== 'myrcene' && aggregateProfile['myrcene'] > 0.1 && aggregateProfile['myrcene'] < 0.4) {
        text += ` A controlled amount of myrcene is present, but kept below dominant levels to avoid unwanted sedation, allowing the energizing components to remain functional.`;
    } else if (tertiary) {
        // Generic tertiary mention if not myrcene special case
        text += ` Finally, trace levels of ${tertiary.name} round out the profile for a sustained effect without a sharp crash.`;
    }

    return text;
}
