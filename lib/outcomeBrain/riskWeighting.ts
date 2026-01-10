/**
 * Risk-Weighted Optimization Layer
 * 
 * Introduces risk-awareness as a weighting factor, not a blocker.
 * High-risk profiles bias toward stability but never silently remove valid outcomes.
 * 
 * This is an additive layer that influences selection, not a filter.
 */

import { OutcomeIntent } from '../engine_core/legacy_compat';
import { BlendDoseAnalysis } from './biphasicModeling';
import { SignalDensityAnalysis } from './saturationAnalysis';

export interface RiskAssessment {
  anxietyRisk: number; // 0-1: risk of anxiety/paranoia
  overstimulationRisk: number; // 0-1: risk of mania/overstimulation
  sleepDisruptionRisk: number; // 0-1: risk of sleep disruption
  overallRiskScore: number; // 0-1: weighted composite
  riskFactors: Array<{
    type: 'anxiety' | 'overstimulation' | 'sleep_disruption';
    severity: 'low' | 'moderate' | 'high';
    description: string;
    source: string; // Which terpene/compound contributes
  }>;
}

export interface RiskWeightedScore {
  baseScore: number;
  riskPenalty: number; // 0-1 penalty applied based on risk and user sensitivity
  adjustedScore: number;
  riskJustification: string; // Why this risk level is acceptable (if any)
}

/**
 * Assess risk profile for a blend
 * Identifies risks without value judgment
 */
export function assessRiskProfile(
  doseAnalysis: BlendDoseAnalysis,
  saturationAnalysis: SignalDensityAnalysis,
  intent: OutcomeIntent
): RiskAssessment {
  const aggregateTerpenes = doseAnalysis.aggregateTerpenes;
  const riskFactors: RiskAssessment['riskFactors'] = [];
  
  // Anxiety risk: high limonene, terpinolene, pinene (especially in high zones)
  let anxietyRisk = 0;
  if (aggregateTerpenes.limonene > 0.28) {
    const severity = aggregateTerpenes.limonene > 0.35 ? 'high' : 'moderate';
    anxietyRisk = Math.max(anxietyRisk, aggregateTerpenes.limonene * 1.5);
    riskFactors.push({
      type: 'anxiety',
      severity,
      description: `High limonene (${(aggregateTerpenes.limonene * 100).toFixed(1)}%) in stimulation zone`,
      source: 'limonene',
    });
  }
  if (aggregateTerpenes.terpinolene > 0.12) {
    const severity = aggregateTerpenes.terpinolene > 0.20 ? 'high' : 'moderate';
    anxietyRisk = Math.max(anxietyRisk, aggregateTerpenes.terpinolene * 2.0);
    riskFactors.push({
      type: 'anxiety',
      severity,
      description: `High terpinolene (${(aggregateTerpenes.terpinolene * 100).toFixed(1)}%) in stimulation zone`,
      source: 'terpinolene',
    });
  }
  if (aggregateTerpenes.pinene > 0.25) {
    anxietyRisk = Math.max(anxietyRisk, aggregateTerpenes.pinene * 1.2);
    riskFactors.push({
      type: 'anxiety',
      severity: 'moderate',
      description: `High pinene (${(aggregateTerpenes.pinene * 100).toFixed(1)}%) in intensity zone`,
      source: 'pinene',
    });
  }
  anxietyRisk = Math.min(1.0, anxietyRisk);
  
  // Overstimulation risk: combination of high activation terpenes
  let overstimulationRisk = 0;
  const activationTerpenes = (aggregateTerpenes.limonene || 0) + 
                             (aggregateTerpenes.terpinolene || 0) + 
                             (aggregateTerpenes.pinene || 0);
  if (activationTerpenes > 0.50) {
    overstimulationRisk = Math.min(1.0, (activationTerpenes - 0.50) * 2);
    riskFactors.push({
      type: 'overstimulation',
      severity: overstimulationRisk > 0.7 ? 'high' : 'moderate',
      description: `High combined activation terpenes (${(activationTerpenes * 100).toFixed(1)}%)`,
      source: 'limonene+pinene+terpinolene',
    });
  }
  
  // Sleep disruption risk: high activation with low sedation
  let sleepDisruptionRisk = 0;
  const sedationTerpenes = (aggregateTerpenes.myrcene || 0) + 
                           (aggregateTerpenes.linalool || 0);
  if (activationTerpenes > 0.40 && sedationTerpenes < 0.20) {
    sleepDisruptionRisk = Math.min(1.0, (activationTerpenes - 0.40) * 1.5);
    riskFactors.push({
      type: 'sleep_disruption',
      severity: sleepDisruptionRisk > 0.6 ? 'high' : 'moderate',
      description: `High activation (${(activationTerpenes * 100).toFixed(1)}%) with low sedation (${(sedationTerpenes * 100).toFixed(1)}%)`,
      source: 'activation-sedation imbalance',
    });
  }
  
  // Overall risk score (weighted)
  const overallRiskScore = Math.min(1.0, (
    anxietyRisk * 0.5 +
    overstimulationRisk * 0.3 +
    sleepDisruptionRisk * 0.2
  ));
  
  return {
    anxietyRisk,
    overstimulationRisk,
    sleepDisruptionRisk,
    overallRiskScore,
    riskFactors,
  };
}

/**
 * Apply risk weighting to a score
 * Higher risk + higher user sensitivity = higher penalty
 * But penalty is applied as weighting, not blocking
 */
export function applyRiskWeighting(
  baseScore: number,
  riskAssessment: RiskAssessment,
  intent: OutcomeIntent
): RiskWeightedScore {
  // Compute risk penalty based on user sensitivity
  const anxietyPenalty = riskAssessment.anxietyRisk * (intent.anxietySensitivity || 0.5);
  const overstimulationPenalty = riskAssessment.overstimulationRisk * 0.4; // Moderate sensitivity assumed
  const sleepPenalty = riskAssessment.sleepDisruptionRisk * 0.3; // Lower sensitivity
  
  // Combined penalty (0-1 scale)
  const riskPenalty = Math.min(1.0, (
    anxietyPenalty * 0.6 +
    overstimulationPenalty * 0.3 +
    sleepPenalty * 0.1
  ));
  
  // Apply penalty as multiplicative reduction (not subtraction)
  // High penalty reduces score more, but never to zero
  const penaltyMultiplier = 1.0 - (riskPenalty * 0.5); // Max 50% reduction
  const adjustedScore = baseScore * penaltyMultiplier;
  
  // Generate risk justification (explains why risk is acceptable, if any)
  let riskJustification = '';
  if (riskPenalty > 0.3) {
    // High penalty - check if user intent justifies the risk
    if (intent.activation > 0.7 && riskAssessment.overstimulationRisk > 0.5) {
      riskJustification = 'High activation intent justifies overstimulation risk';
    } else if (!intent.anxietySensitivity || intent.anxietySensitivity < 0.5) {
      riskJustification = 'Low anxiety sensitivity allows higher-risk profile';
    } else {
      riskJustification = 'Risk present but outcome aligns with user intent';
    }
  } else {
    riskJustification = 'Low to moderate risk profile';
  }
  
  return {
    baseScore,
    riskPenalty,
    adjustedScore,
    riskJustification,
  };
}










