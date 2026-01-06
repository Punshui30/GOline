/**
 * Constraint Satisfaction Framing
 * 
 * Treats outcome resolution as a constraint satisfaction problem.
 * Hard constraints (must/must not) vs soft preferences (optimize if possible).
 * Multiple valid solutions may exist.
 * 
 * This is an additive framing layer, not a replacement for existing logic.
 */

import { OutcomeIntent } from '../goOutcomeEngine';
import { BlendDoseAnalysis } from './biphasicModeling';
import { SignalDensityAnalysis } from './saturationAnalysis';
import { RiskAssessment } from './riskWeighting';

export interface Constraint {
  type: 'hard' | 'soft';
  category: 'activation' | 'sedation' | 'anxiety' | 'complexity' | 'temporal' | 'risk';
  description: string;
  satisfied: boolean;
  violationSeverity?: number; // 0-1: how severely violated (if not satisfied)
}

export interface ConstraintEvaluation {
  hardConstraints: Constraint[];
  softConstraints: Constraint[];
  allHardSatisfied: boolean;
  softSatisfactionScore: number; // 0-1: how well soft constraints are met
  solutionQuality: 'invalid' | 'valid' | 'preferred' | 'optimal';
}

/**
 * Evaluate constraints for a blend solution
 * Separates hard requirements from soft preferences
 */
export function evaluateConstraints(
  intent: OutcomeIntent,
  doseAnalysis: BlendDoseAnalysis,
  saturationAnalysis: SignalDensityAnalysis,
  riskAssessment: RiskAssessment
): ConstraintEvaluation {
  const hardConstraints: Constraint[] = [];
  const softConstraints: Constraint[] = [];
  
  // Hard constraint: avoid sedation if avoidSedation is true
  if (intent.avoidSedation) {
    const highSedation = (doseAnalysis.aggregateTerpenes.myrcene || 0) > 0.30 ||
                         (doseAnalysis.aggregateTerpenes.linalool || 0) > 0.25;
    hardConstraints.push({
      type: 'hard',
      category: 'sedation',
      description: 'Avoid sedating profiles',
      satisfied: !highSedation,
      violationSeverity: highSedation ? 0.8 : 0,
    });
  }
  
  // Hard constraint: respect anxiety sensitivity (if very high)
  if (intent.anxietySensitivity > 0.8) {
    const highAnxietyRisk = riskAssessment.anxietyRisk > 0.7;
    hardConstraints.push({
      type: 'hard',
      category: 'anxiety',
      description: 'Very high anxiety sensitivity - avoid high-risk profiles',
      satisfied: !highAnxietyRisk,
      violationSeverity: highAnxietyRisk ? 0.9 : 0,
    });
  }
  
  // Soft constraint: align with activation preference
  const activationTerpenes = (doseAnalysis.aggregateTerpenes.limonene || 0) +
                             (doseAnalysis.aggregateTerpenes.pinene || 0) +
                             (doseAnalysis.aggregateTerpenes.terpinolene || 0);
  const activationAlignment = 1.0 - Math.abs(activationTerpenes - intent.activation);
  softConstraints.push({
    type: 'soft',
    category: 'activation',
    description: `Align with activation preference (${(intent.activation * 100).toFixed(0)}%)`,
    satisfied: activationAlignment > 0.7,
    violationSeverity: 1.0 - activationAlignment,
  });
  
  // Soft constraint: prefer cognitive clarity (if specified)
  if (intent.cognitiveClarity !== undefined) {
    const clarityTerpenes = (doseAnalysis.aggregateTerpenes.pinene || 0) +
                            (doseAnalysis.aggregateTerpenes.limonene || 0);
    const clarityAlignment = 1.0 - Math.abs(clarityTerpenes - intent.cognitiveClarity);
    softConstraints.push({
      type: 'soft',
      category: 'activation',
      description: `Align with cognitive clarity preference`,
      satisfied: clarityAlignment > 0.6,
      violationSeverity: 1.0 - clarityAlignment,
    });
  }
  
  // Soft constraint: prefer physical relief (if specified)
  if (intent.physicalRelief !== undefined) {
    const reliefTerpenes = (doseAnalysis.aggregateTerpenes.caryophyllene || 0) +
                           (doseAnalysis.aggregateTerpenes.humulene || 0);
    const reliefAlignment = 1.0 - Math.abs(reliefTerpenes - intent.physicalRelief);
    softConstraints.push({
      type: 'soft',
      category: 'activation',
      description: `Align with physical relief preference`,
      satisfied: reliefAlignment > 0.6,
      violationSeverity: 1.0 - reliefAlignment,
    });
  }
  
  // Soft constraint: minimize risk (if user is risk-averse)
  if (intent.anxietySensitivity > 0.6) {
    const riskAlignment = 1.0 - riskAssessment.overallRiskScore;
    softConstraints.push({
      type: 'soft',
      category: 'risk',
      description: 'Minimize risk for anxiety-sensitive user',
      satisfied: riskAlignment > 0.7,
      violationSeverity: 1.0 - riskAlignment,
    });
  }
  
  // Check if all hard constraints are satisfied
  const allHardSatisfied = hardConstraints.every(c => c.satisfied);
  
  // Compute soft constraint satisfaction score
  const softSatisfactionScore = softConstraints.length > 0
    ? softConstraints.reduce((sum, c) => sum + (c.satisfied ? 1.0 : (1.0 - (c.violationSeverity || 0))), 0) / softConstraints.length
    : 1.0;
  
  // Determine solution quality
  let solutionQuality: ConstraintEvaluation['solutionQuality'];
  if (!allHardSatisfied) {
    solutionQuality = 'invalid';
  } else if (softSatisfactionScore > 0.8) {
    solutionQuality = 'optimal';
  } else if (softSatisfactionScore > 0.6) {
    solutionQuality = 'preferred';
  } else {
    solutionQuality = 'valid';
  }
  
  return {
    hardConstraints,
    softConstraints,
    allHardSatisfied,
    softSatisfactionScore,
    solutionQuality,
  };
}










