/**
 * Optional preset entry points for GO Line calculator.
 * 
 * Presets pre-fill baseline calibration and initial intent context.
 * They do NOT bypass StrategicGuidance inference - they are starting conditions only.
 */

export interface BaselineCalibration {
  thcTolerance?: 'low' | 'moderate' | 'high';
  anxietySensitivity?: 'low' | 'moderate' | 'high';
  experienceLevel?: 'occasional' | 'regular' | 'experienced';
}

export interface Preset {
  id: string;
  name: string;
  description: string;
  baselineCalibration: BaselineCalibration;
  initialIntentText: string;
}

export const presets: Preset[] = [
  {
    id: 'social-no-anxiety',
    name: 'Social / No Anxiety',
    description: 'Energizing for social settings, avoiding anxiety triggers',
    baselineCalibration: {
      anxietySensitivity: 'high',
      experienceLevel: 'regular',
    },
    initialIntentText: 'I need something energizing for social settings, but I\'m sensitive to anxiety. I want to feel alert and engaged without feeling overwhelmed or paranoid.',
  },
  {
    id: 'creative-focus',
    name: 'Creative Focus',
    description: 'Sustained mental clarity for creative work, avoiding sedation',
    baselineCalibration: {
      thcTolerance: 'moderate',
      experienceLevel: 'regular',
    },
    initialIntentText: 'I need sustained focus and mental clarity for creative work. I want to avoid sedation and maintain cognitive endurance throughout the session. Something that supports associative thinking and flow state.',
  },
  {
    id: 'end-of-day-calm',
    name: 'End-of-Day Calm',
    description: 'Relaxation and tension release, avoiding overstimulation',
    baselineCalibration: {
      thcTolerance: 'moderate',
      anxietySensitivity: 'low',
    },
    initialIntentText: 'I need something for end-of-day relaxation. I want calm and tension release, mental quiet, without feeling sedated or overstimulated. Something that helps transition from active state to rest.',
  },
  {
    id: 'physical-relief',
    name: 'Physical Relief',
    description: 'Support for physical comfort, maintaining mental clarity',
    baselineCalibration: {
      thcTolerance: 'moderate',
      experienceLevel: 'regular',
    },
    initialIntentText: 'I\'m looking for physical relief and comfort. I want to maintain mental clarity and avoid heavy sedation. Something that supports physical ease without clouding cognition.',
  },
  {
    id: 'energy-endurance',
    name: 'Energy Endurance',
    description: 'Functional energy for extended activity, avoiding peak intensity',
    baselineCalibration: {
      thcTolerance: 'moderate',
      anxietySensitivity: 'moderate',
    },
    initialIntentText: 'I need functional energy for extended activity. I want steady, sustained energy rather than a strong peak. Something that supports physical readiness and alertness without intensity spikes or crashes.',
  },
];

