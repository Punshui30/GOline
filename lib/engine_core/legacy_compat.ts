
import { Intent, EngineMode } from './go_calc_engine_strict';

// Legacy Type Stub for UI compatibility (OutcomeIntent is used heavily in UI and Explore)
export interface OutcomeIntent {
    activation: number;
    anxietySensitivity: number;
    cognitiveEndurance: number;
    bodyLoadPreference: number;
    temporalOnset: number;
    activationTarget?: number;
    physicalRelief?: number;
    cognitiveClarity?: number;
    functionalEnergy?: number;
    avoidSedation?: boolean;
    overshootTolerance?: 'low' | 'moderate' | 'high';
    durationPreference?: 'impulse' | 'sustained' | 'extended';
}

// BlendCandidate stub (matching expected usage in components)
export interface BlendCandidate {
    cultivars: {
        id: string;
        name: string;
        ratio: number;
    }[];
    metrics: {
        score: number;
        // Add other expected metrics if build fails
    };
}

// Helper: Map UI Intent to Strict Engine Intent
export const mapLegacyIntentToStrict = (uiIntent: OutcomeIntent): Intent => {
    // Mapping logic (Centralized):

    // activation -> energy (-1 to range?)
    // UI activation is 0-1. 0.5 neutral.
    // Strict energy: -1.0 to 1.0.
    const energy = (uiIntent.activation - 0.5) * 2.0;

    // focus? cognitiveClarity + cognitiveEndurance?
    const focus = uiIntent.cognitiveClarity ?? 0.5;

    // mood?
    const mood = uiIntent.functionalEnergy ? (uiIntent.functionalEnergy - 0.5) * 2 : 0.0;

    // body? bodyLoadPreference
    const body = uiIntent.bodyLoadPreference ?? 0.5;

    // creativity?
    const creativity = 0.5; // Default

    // maxAnxiety
    // anxietySensitivity (0-1). 1=High Sensitivity -> Lower MaxAnxiety.
    // 0.5 = 0.3 defaults.
    // If sens=1.0 -> maxAnxiety=0.1. If sens=0.0 -> maxAnxiety=0.6.
    const maxAnxiety = 0.6 - ((uiIntent.anxietySensitivity ?? 0.5) * 0.5);

    return {
        targetEffects: { energy, focus, mood, body, creativity },
        constraints: { maxAnxiety },
        context: {
            timeOfDay: undefined,
            tolerance: undefined,
            experience: undefined
        }
    };
};

export const getTopTerpenes = (chemotype: any, limit?: number) => [] as any[]; // Stub function usage
