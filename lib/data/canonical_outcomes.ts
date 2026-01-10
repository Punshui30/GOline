/**
 * Canonical Outcome Set (Fixed)
 * 
 * Predefined outcome targets for label-driven exploration.
 * Each outcome has fixed vector ranges, not prose.
 */

import { OutcomeIntent } from '../engine_core/legacy_compat';

export interface CanonicalOutcome {
    id: string;
    label: string;
    description: string;
    intent: OutcomeIntent;
}

/**
 * Fixed outcome set for label-driven exploration
 */
export const CANONICAL_OUTCOMES: CanonicalOutcome[] = [
    {
        id: 'daytime_clear',
        label: 'Daytime / Clear-Headed',
        description: 'Energy ↑, Anxiety ↓, Intensity low–moderate, Cognitive bias',
        intent: {
            activation: 0.7,
            activationTarget: 0.7, // Energy ↑
            anxietySensitivity: 0.2, // Anxiety ↓
            cognitiveEndurance: 0.8, // Cognitive bias, sustained
            bodyLoadPreference: 0.3,
            temporalOnset: 0.5,
            overshootTolerance: 'moderate',
            avoidSedation: true,
        },
    },
    {
        id: 'social_creative',
        label: 'Social / Creative',
        description: 'Energy ↑, Cognitive lift ↑, Mood elevation, Moderate duration',
        intent: {
            activation: 0.75,
            activationTarget: 0.75, // Energy ↑
            anxietySensitivity: 0.3, // Low anxiety risk
            cognitiveEndurance: 0.6, // Moderate duration
            bodyLoadPreference: 0.4,
            temporalOnset: 0.5,
            overshootTolerance: 'high',
            avoidSedation: false,
        },
    },
    {
        id: 'balanced_flexible',
        label: 'Balanced / Flexible',
        description: 'Even head/body, Moderate intensity, Broad compatibility',
        intent: {
            activation: 0.5,
            activationTarget: 0.5, // Balanced
            anxietySensitivity: 0.4, // Moderate sensitivity
            cognitiveEndurance: 0.5, // Balanced
            bodyLoadPreference: 0.5,
            temporalOnset: 0.5,
            overshootTolerance: 'moderate',
            avoidSedation: false,
        },
    },
    {
        id: 'calm_winddown',
        label: 'Calm / Wind-Down',
        description: 'Energy ↓, Anxiety ↓, Body relaxation bias',
        intent: {
            activation: 0.3,
            activationTarget: 0.3, // Energy ↓
            anxietySensitivity: 0.2, // Anxiety ↓
            cognitiveEndurance: 0.3, // Lower cognitive demand
            bodyLoadPreference: 0.7,
            temporalOnset: 0.5,
            overshootTolerance: 'moderate',
            avoidSedation: false,
        },
    },
    {
        id: 'sleep_leaning',
        label: 'Sleep-Leaning',
        description: 'Sedation ↑, Cognitive ↓, Duration ↑',
        intent: {
            activation: 0.2,
            activationTarget: 0.2, // Low activation (sedation ↑)
            anxietySensitivity: 0.2, // Low anxiety
            cognitiveEndurance: 0.2, // Cognitive ↓
            bodyLoadPreference: 0.8,
            temporalOnset: 0.5,
            overshootTolerance: 'low',
            avoidSedation: false,
        },
    },
];
