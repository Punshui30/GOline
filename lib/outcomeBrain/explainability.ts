/**
 * Explainability Layer
 * 
 * Computes and stores explanation data for every recommendation:
 * - Primary chemical drivers
 * - Key constraints satisfied
 * - Risks intentionally accepted or avoided
 * - Outcome classification (focused/balanced/emergent/complex)
 * 
 * This is internal logic first; UI presentation can evolve later.
 */

import { BlendDoseAnalysis } from './biphasicModeling';
import { SignalDensityAnalysis } from './saturationAnalysis';
import { RiskAssessment } from './riskWeighting';
import { TemporalProfile } from './temporalPharmacokinetics';
import { ConstraintEvaluation } from './constraintSatisfaction';

export interface OutcomeExplanation {
  primaryChemicalDrivers: Array<{
    compound: string;
    percentage: number;
    contribution: string;
  }>;
  keyConstraintsSatisfied: string[];
  risksAccepted: Array<{
    risk: string;
    severity: 'low' | 'moderate' | 'high';
    justification: string;
  }>;
  risksAvoided: string[];
  outcomeClassification: 'focused' | 'balanced' | 'layered' | 'emergent' | 'complex';
  complexityLevel: 'simple' | 'moderate' | 'high' | 'emergent';
  explanation: string;
}

/**
 * Generate comprehensive explanation for an outcome
 * Internal logic for explainability
 */
export function generateOutcomeExplanation(
  doseAnalysis: BlendDoseAnalysis,
  saturationAnalysis: SignalDensityAnalysis,
  riskAssessment: RiskAssessment,
  temporalProfile: TemporalProfile,
  constraintEvaluation: ConstraintEvaluation,
  isHighComplexity: boolean
): OutcomeExplanation {
  const aggregateTerpenes = doseAnalysis.aggregateTerpenes;
  
  // Identify primary chemical drivers (top 3 terpenes)
  const primaryChemicalDrivers = saturationAnalysis.dominanceHierarchy
    .slice(0, 3)
    .map(({ terpene, percentage }) => {
      const zone = doseAnalysis.zoneCrossings.find(z => z.terpene === terpene);
      let contribution = '';
      if (terpene === 'myrcene') contribution = 'relaxation and body ease';
      else if (terpene === 'limonene') contribution = 'energizing and mood lift';
      else if (terpene === 'pinene') contribution = 'mental clarity and focus';
      else if (terpene === 'linalool') contribution = 'calm and stress relief';
      else if (terpene === 'caryophyllene') contribution = 'physical comfort';
      else if (terpene === 'terpinolene') contribution = 'uplifting activation';
      else contribution = 'terpene contribution';
      
      if (zone) {
        contribution += ` (${zone.toZone} zone)`;
      }
      
      return {
        compound: terpene,
        percentage: percentage * 100,
        contribution,
      };
    });
  
  // Key constraints satisfied
  const keyConstraintsSatisfied = constraintEvaluation.hardConstraints
    .filter(c => c.satisfied)
    .map(c => c.description);
  
  // Risks accepted (with justification)
  const risksAccepted: OutcomeExplanation['risksAccepted'] = [];
  if (riskAssessment.anxietyRisk > 0.5) {
    risksAccepted.push({
      risk: 'Anxiety/paranoia risk',
      severity: riskAssessment.anxietyRisk > 0.7 ? 'high' : 'moderate',
      justification: 'High activation terpenes present for energizing outcome',
    });
  }
  if (riskAssessment.overstimulationRisk > 0.5) {
    risksAccepted.push({
      risk: 'Overstimulation risk',
      severity: riskAssessment.overstimulationRisk > 0.7 ? 'high' : 'moderate',
      justification: 'Intense activation profile aligned with user intent',
    });
  }
  if (riskAssessment.sleepDisruptionRisk > 0.5) {
    risksAccepted.push({
      risk: 'Sleep disruption risk',
      severity: riskAssessment.sleepDisruptionRisk > 0.7 ? 'high' : 'moderate',
      justification: 'High activation with low sedation for sustained energy',
    });
  }
  
  // Risks avoided
  const risksAvoided: string[] = [];
  if (riskAssessment.anxietyRisk < 0.3) {
    risksAvoided.push('Anxiety risk minimized');
  }
  if (riskAssessment.overstimulationRisk < 0.3) {
    risksAvoided.push('Overstimulation risk minimized');
  }
  if (doseAnalysis.paradoxicalZones.length === 0) {
    risksAvoided.push('Paradoxical effect zones avoided');
  }
  
  // Outcome classification
  let outcomeClassification: OutcomeExplanation['outcomeClassification'];
  let complexityLevel: OutcomeExplanation['complexityLevel'];
  
  if (isHighComplexity) {
    outcomeClassification = 'emergent';
    complexityLevel = 'emergent';
  } else if (saturationAnalysis.saturationMode === 'focused') {
    outcomeClassification = 'focused';
    complexityLevel = 'simple';
  } else if (saturationAnalysis.saturationMode === 'balanced') {
    outcomeClassification = 'balanced';
    complexityLevel = 'moderate';
  } else if (saturationAnalysis.saturationMode === 'layered') {
    outcomeClassification = 'layered';
    complexityLevel = 'high';
  } else {
    outcomeClassification = 'complex';
    complexityLevel = 'high';
  }
  
  // Generate explanation text
  let explanation = '';
  if (outcomeClassification === 'focused') {
    explanation = `Single or dual terpene profile with clear dominant driver (${primaryChemicalDrivers[0]?.compound}). Effects are singular and predictable.`;
  } else if (outcomeClassification === 'balanced') {
    explanation = `Multiple terpenes with primary driver and supporting compounds. Effects are balanced and harmonious.`;
  } else if (outcomeClassification === 'layered') {
    explanation = `Complex blend with layered terpene interactions. Effects unfold across temporal phases: ${temporalProfile.onsetPhase.dominantEffects.join(', ')} → ${temporalProfile.peakPhase.dominantEffects.join(', ')} → ${temporalProfile.tailPhase.dominantEffects.join(', ')}.`;
  } else if (outcomeClassification === 'emergent') {
    explanation = `Emergent profile: many compounds contribute meaningfully, creating textural and multi-dimensional effects. This is an advanced outcome with complex interactions across ${saturationAnalysis.totalActiveTerpenes} active terpenes.`;
  } else {
    explanation = `Complex profile with multiple active compounds. Effects are multi-dimensional and may vary by individual.`;
  }
  
  if (doseAnalysis.paradoxicalZones.length > 0) {
    explanation += ` Note: This blend crosses into paradoxical effect zones for ${doseAnalysis.paradoxicalZones.join(', ')}, which may produce unexpected or reversed effects.`;
  }
  
  return {
    primaryChemicalDrivers,
    keyConstraintsSatisfied,
    risksAccepted,
    risksAvoided,
    outcomeClassification,
    complexityLevel,
    explanation,
  };
}










