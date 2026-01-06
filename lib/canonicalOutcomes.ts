/**
 * Canonical Outcome Set (Fixed)
 * 
 * Predefined outcome targets for label-driven exploration.
 * Each outcome has fixed vector ranges, not prose.
 */

import { OutcomeIntent } from './goOutcomeEngine';

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
      activationTarget: 0.7, // Energy ↑
      anxietySensitivity: 0.2, // Anxiety ↓
      cognitiveEndurance: 0.8, // Cognitive bias, sustained
      overshootTolerance: 0.6, // Moderate tolerance
    },
  },
  {
    id: 'social_creative',
    label: 'Social / Creative',
    description: 'Energy ↑, Cognitive lift ↑, Mood elevation, Moderate duration',
    intent: {
      activationTarget: 0.75, // Energy ↑
      anxietySensitivity: 0.3, // Low anxiety risk
      cognitiveEndurance: 0.6, // Moderate duration
      overshootTolerance: 0.7, // Higher tolerance for intensity
    },
  },
  {
    id: 'balanced_flexible',
    label: 'Balanced / Flexible',
    description: 'Even head/body, Moderate intensity, Broad compatibility',
    intent: {
      activationTarget: 0.5, // Balanced
      anxietySensitivity: 0.4, // Moderate sensitivity
      cognitiveEndurance: 0.5, // Balanced
      overshootTolerance: 0.6, // Moderate tolerance
    },
  },
  {
    id: 'calm_winddown',
    label: 'Calm / Wind-Down',
    description: 'Energy ↓, Anxiety ↓, Body relaxation bias',
    intent: {
      activationTarget: 0.3, // Energy ↓
      anxietySensitivity: 0.2, // Anxiety ↓
      cognitiveEndurance: 0.3, // Lower cognitive demand
      overshootTolerance: 0.5, // Moderate tolerance
    },
  },
  {
    id: 'sleep_leaning',
    label: 'Sleep-Leaning',
    description: 'Sedation ↑, Cognitive ↓, Duration ↑',
    intent: {
      activationTarget: 0.2, // Low activation (sedation ↑)
      anxietySensitivity: 0.2, // Low anxiety
      cognitiveEndurance: 0.2, // Cognitive ↓
      overshootTolerance: 0.4, // Lower tolerance (gentler)
    },
  },
];

