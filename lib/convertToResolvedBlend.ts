import { NamedResolutionResult } from '@/lib/namedResolution';
import { ResolvedBlend, ResolvedCultivar, CultivarRole } from '@/components/ResolutionPanel';
import { OutcomeResult, BlendCandidate } from '@/lib/goOutcomeEngine';

/**
 * Convert NamedResolutionResult to ResolvedBlend format
 * Also accepts OutcomeResult to pass through failure states
 */
export function convertToResolvedBlend(
  named: NamedResolutionResult,
  outcome?: OutcomeResult
): ResolvedBlend {
  // If outcome has a failure, pass it through with required propertes
  if (outcome?.failure) {
    return {
      resolutionMode: 'FALLBACK',
      confidenceScore: 0,
      primaryBlend: [],
      tradeoffs: [],
      rationaleSummary: outcome.failure.reason || 'Resolution failed',
      failure: outcome.failure,
      stackingOptions: [],
    };
  }

  // Map role from "primary" | "corrective" | "supporting" to "Anchor" | "Modifier" | "Synergist"
  const mapRole = (role: string): CultivarRole => {
    if (role === 'primary') return 'Anchor';
    if (role === 'corrective') return 'Modifier';
    return 'Synergist';
  };

  const cultivars: ResolvedCultivar[] = named.primaryBlend.map(strain => ({
    id: strain.strainId,
    name: strain.strainName,
    role: mapRole(strain.role),
    percentage: strain.percentage,
    explanation: strain.rationale || '',
    chemotypeId: strain.strainId, // Using strainId as fallback
    weightGrams: (strain.percentage / 100) * 1.0, // Assuming 1g total for display
  }));

  // Convert alternate candidates if available
  // IMPORTANT: LLM must not choose strains. It only explains math-selected blends.
  // Alternates are already selected by the deterministic engine.
  const alternates: ResolvedBlend[] = [];
  
  // CRITICAL: Log outcome structure for verification
  console.log('[CONVERT] Outcome structure:', {
    hasOutcome: !!outcome,
    hasAlternates: outcome && 'alternates' in outcome && !!outcome.alternates,
    alternateCount: outcome && 'alternates' in outcome ? outcome.alternates?.length : 0,
    hasPrimary: outcome && 'primary' in outcome && !!outcome.primary,
    hasFailure: outcome && 'failure' in outcome && !!outcome.failure,
  });
  
  // ASSERT: Verify alternates are present if outcome has them
  const expectedAlternates = outcome && 'alternates' in outcome ? outcome.alternates?.length || 0 : 0;
  
  if (outcome && 'alternates' in outcome && outcome.alternates) {
    for (const altCandidate of outcome.alternates) {
      // Convert BlendCandidate directly to ResolvedBlend format
      // Assign roles based on percentage (highest = Anchor, others = Modifier/Synergist)
      const sortedIndices = altCandidate.ratios
        .map((ratio, idx) => ({ ratio, idx }))
        .sort((a, b) => b.ratio - a.ratio)
        .map(item => item.idx);
      
      const altCultivars: ResolvedCultivar[] = altCandidate.selectedCultivars.map((cultivar, idx) => {
        let role: CultivarRole = 'Synergist';
        if (sortedIndices[0] === idx) role = 'Anchor';
        else if (sortedIndices[1] === idx) role = 'Modifier';
        
        return {
          id: cultivar.id,
          name: cultivar.displayName,
          role,
          percentage: altCandidate.ratios[idx],
          explanation: '',
          chemotypeId: cultivar.id,
          weightGrams: (altCandidate.ratios[idx] / 100) * 1.0,
        };
      });
      
      alternates.push({
        resolutionMode: 'BLENDED',
        confidenceScore: altCandidate.confidenceScore,
        primaryBlend: altCultivars,
        tradeoffs: altCandidate.notes || [],
        rationaleSummary: altCandidate.notes?.[0] || 'Alternate blend',
        stackingOptions: [],
        cultivars: altCultivars,
        stack: [],
      });
    }
    
    console.log(`[CONVERT] Converted ${alternates.length} alternate candidates`);
    
    // ASSERT: Alternates should not be dropped during conversion
    if (expectedAlternates > 0 && alternates.length === 0) {
      console.error('[CONVERT][ASSERT] Alternates dropped during conversion', {
        expected: expectedAlternates,
        actual: alternates.length,
        outcomeAlternates: outcome.alternates,
      });
    }
    
    // ASSERT: All alternates should be converted
    if (expectedAlternates > 0 && alternates.length !== expectedAlternates) {
      console.error('[CONVERT][ASSERT] Not all alternates were converted', {
        expected: expectedAlternates,
        actual: alternates.length,
        missing: expectedAlternates - alternates.length,
      });
    }
  } else {
    console.log('[CONVERT] WARNING: No alternates in outcome or outcome is missing');
  }

  const result = {
    resolutionMode: named.resolutionMode === 'STACKED' ? 'BLENDED' : 'SINGLE_TARGET', // Simplification for UI
    confidenceScore: named.confidenceScore,
    primaryBlend: cultivars,
    tradeoffs: named.tradeoffs,
    rationaleSummary: named.rationaleSummary,
    stackingOptions: named.stackingOptions.map(s => ({
      type: s.name,
      efficiencyScore: 0.9 // Mock score for now
    })),
    // Keep raw data available if needed
    cultivars: cultivars,
    stack: named.stack ? [named.stack] : [],
    alternates: alternates.length > 0 ? alternates : undefined,
  };
  
  console.log('[CONVERT] Final ResolvedBlend:', {
    primaryBlendCount: result.primaryBlend.length,
    primaryStrains: result.primaryBlend.map(c => c.name),
    hasAlternates: !!result.alternates,
    alternateCount: result.alternates?.length || 0,
  });
  
  // ASSERT: Final result should have alternates if they were in the outcome
  if (expectedAlternates > 0 && (!result.alternates || result.alternates.length === 0)) {
    console.error('[CONVERT][ASSERT] Alternates dropped during conversion', {
      expected: expectedAlternates,
      actual: result.alternates?.length || 0,
      outcomeHasAlternates: outcome && 'alternates' in outcome && !!outcome.alternates,
    });
  }
  
  // ASSERT: All alternates should be preserved
  if (expectedAlternates > 0 && result.alternates && result.alternates.length !== expectedAlternates) {
    console.error('[CONVERT][ASSERT] Not all alternates preserved in final result', {
      expected: expectedAlternates,
      actual: result.alternates.length,
      missing: expectedAlternates - result.alternates.length,
    });
  }
  
  return result;
}
