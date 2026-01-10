import { OutcomeIntent } from './engine_core/legacy_compat';

export interface Preset {
  id: string;
  name: string;
  description: string;
  intent: OutcomeIntent;
}

export const presets: Preset[] = [
  {
    id: 'relaxed_alert',
    name: 'Relaxed but Alert',
    description: 'Calm body with a sharp mind. Good for working or reading.',
    intent: {
      activation: 0.6,          // Moderate energy
      anxietySensitivity: 0.3,  // Low anxiety concern
      cognitiveEndurance: 0.8,  // High focus
      bodyLoadPreference: 0.4,  // Light body load
      temporalOnset: 0.5,
      functionalEnergy: 0.7,    // Mood lift
      cognitiveClarity: 0.9,    // Very clear
      avoidSedation: true,
      overshootTolerance: 'moderate',
      durationPreference: 'sustained'
    }
  },
  {
    id: 'pain_relief_no_jitters',
    name: 'Pain Relief, No Jitters',
    description: 'Physical comfort without anxiety or racing thoughts.',
    intent: {
      activation: 0.3,          // Low energy/calm
      anxietySensitivity: 0.9,  // High anxiety sensitivity (avoid jitters)
      cognitiveEndurance: 0.4,  // Relaxed mind
      bodyLoadPreference: 0.9,  // Heavy body relief
      temporalOnset: 0.5,
      functionalEnergy: 0.4,
      physicalRelief: 1.0,      // Max relief
      avoidSedation: false,
      overshootTolerance: 'low',
      durationPreference: 'extended'
    }
  },
  {
    id: 'focused_creative',
    name: 'Focused + Creative',
    description: 'Stimulating and cerebral. Best for brainstorming and art.',
    intent: {
      activation: 0.8,          // High energy
      anxietySensitivity: 0.4,  // Moderate sensitivity
      cognitiveEndurance: 0.7,  // Sustained focus
      bodyLoadPreference: 0.2,  // Minimal body load
      temporalOnset: 0.2,       // Fast onset
      functionalEnergy: 0.9,    // High functionality
      cognitiveClarity: 0.7,    // Creative flow (some haze ok?)
      avoidSedation: true,
      overshootTolerance: 'high',
      durationPreference: 'impulse'
    }
  },
  {
    id: 'sleep_clean',
    name: 'Sleep (No Grogginess)',
    description: 'Deep sedation that clears up by morning.',
    intent: {
      activation: 0.1,          // Very low energy
      anxietySensitivity: 0.2,  // Low anxiety
      cognitiveEndurance: 0.1,  // Turn off brain
      bodyLoadPreference: 0.8,  // Heavy body
      temporalOnset: 0.5,
      functionalEnergy: 0.2,
      physicalRelief: 0.7,
      avoidSedation: false,
      overshootTolerance: 'moderate',
      durationPreference: 'sustained'
    }
  }
];
