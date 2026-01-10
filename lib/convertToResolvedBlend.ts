import { NamedResolutionResult } from '@/lib/namedResolution';
import { ResolvedBlend, ResolvedCultivar, CultivarRole } from '@/components/ResolutionPanel';
import { OutcomeResult, BlendCandidate } from '@/lib/engine_core/legacy_compat';

/**
 * Helper to enforce Phase A1 "Single Primary" rule.
 * 1. Sort by percentage descending.
 * 2. Rank 1 = Primary, Rank 2 = Secondary, others = Supporting.
 */
function applyStrictRanking(
  items: { id: string; name: string; percentage: number; explanation?: string; chemotypeId?: string }[]
): ResolvedCultivar[] {
  // Sort: Weight Descending, then Name Ascending (Determinism)
  const sorted = [...items].sort((a, b) => {
    if (b.percentage !== a.percentage) return b.percentage - a.percentage;
    return a.name.localeCompare(b.name);
  });

  return sorted.map((item, index) => {
    const rank = index + 1;
    let role: CultivarRole = 'supporting';
    if (rank === 1) role = 'primary';
    else if (rank === 2) role = 'secondary';

    return {
      id: item.id,
      name: item.name,
      role,
      rank,
      percentage: item.percentage,
      weight: item.percentage / 100,
      explanation: item.explanation || '',
      chemotypeId: item.chemotypeId || item.id,
      weightGrams: (item.percentage / 100) * 1.0,
    };
  });
}

/**
 * Convert NamedResolutionResult to ResolvedBlend format
 * Enforces strict ranking and role assignment.
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

  // 1. Process Primary Blend
  const primaryInputs = named.primaryBlend.map(strain => ({
    id: strain.strainId,
    name: strain.strainName,
    percentage: strain.percentage,
    explanation: strain.rationale,
    chemotypeId: strain.strainId
  }));

  const cultivars = applyStrictRanking(primaryInputs);

  // 2. Process Alternates
  const alternates: ResolvedBlend[] = [];

  if (outcome && 'alternates' in outcome && outcome.alternates) {
    for (const altCandidate of outcome.alternates) {
      const altInputs = altCandidate.selectedCultivars.map((c, i) => ({
        id: c.id,
        name: c.displayName,
        percentage: altCandidate.ratios[i],
        chemotypeId: c.id
      }));

      const altCultivars = applyStrictRanking(altInputs);

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
  }

  const result: ResolvedBlend = {
    resolutionMode: (named.resolutionMode === 'STACKED' ? 'BLENDED' : 'SINGLE_TARGET') as 'BLENDED' | 'SINGLE_TARGET' | 'FALLBACK',
    confidenceScore: named.confidenceScore,
    primaryBlend: cultivars,
    tradeoffs: named.tradeoffs,
    rationaleSummary: named.rationaleSummary,
    stackingOptions: named.stackingOptions.map(s => ({
      type: s.name,
      efficiencyScore: 0.9
    })),
    cultivars: cultivars,
    stack: named.stack ? [named.stack] : [],
    // Map stack segments strictly
    stackSegments: named.stackingOptions?.[0]?.segments.map(s => {
      const original = cultivars.find(c => c.name === s.strainName);
      return {
        id: s.strainId,
        name: s.strainName,
        role: original?.role || 'supporting',
        rank: original?.rank || 99,
        percentage: s.percentage,
        weight: s.percentage / 100,
        explanation: s.purpose,
        chemotypeId: s.strainId,
        weightGrams: (s.percentage / 100) * 1.0
      };
    }),
    alternates: alternates.length > 0 ? alternates : undefined,
  };

  return result;
}
