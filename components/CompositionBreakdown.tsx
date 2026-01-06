'use client';

/**
 * CompositionBreakdown Component
 * 
 * Horizontal bar visualization for composition breakdown.
 * Collapsible section - moved from primary to secondary visualization.
 */

export type CultivarRole = 'foundation' | 'modulator' | 'accent';

export interface BlendComponent {
  name: string;
  percentage: number;
  role: CultivarRole;
}

interface CompositionBreakdownProps {
  components: BlendComponent[];
}

const ROLE_LABELS: Record<CultivarRole, string> = {
  foundation: 'Foundation',
  modulator: 'Modulator',
  accent: 'Accent',
};

export default function CompositionBreakdown({ components }: CompositionBreakdownProps) {
  if (components.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {components.map((component, index) => (
        <div key={`${component.name}-${index}`} className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-sm font-medium text-white">
                {component.name}
              </div>
              <div className="text-xs uppercase tracking-wider text-white/40">
                {ROLE_LABELS[component.role]}
              </div>
            </div>
            <div className="text-sm text-white/50 font-mono">
              {component.percentage}%
            </div>
          </div>
          <div className="relative h-2 bg-white/5 overflow-hidden rounded-sm">
            <div
              className="h-full bg-white/20 transition-all duration-300"
              style={{ width: `${component.percentage}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}






