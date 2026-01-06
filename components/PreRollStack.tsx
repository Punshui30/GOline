'use client';

/**
 * PreRollStack Component
 * 
 * Vertical segmented stack visualization for pre-roll composition.
 * Primary recommendation output - shows strain name, percentage, and role.
 * 
 * Visual rules:
 * - No photos
 * - No novelty icons
 * - Muted gold / amber / charcoal palette
 * - Clean geometry only
 */

export type CultivarRole = 'foundation' | 'modulator' | 'accent';

export interface StackSegment {
  name: string;
  percentage: number;
  role: CultivarRole;
}

interface PreRollStackProps {
  segments: StackSegment[];
  height?: number; // Total height in pixels (default: 400px)
}

const ROLE_COLORS: Record<CultivarRole, string> = {
  foundation: '#D4AF37', // Muted gold
  modulator: '#B8860B', // Darker gold/amber
  accent: '#8B6914', // Dark amber
};

const ROLE_LABELS: Record<CultivarRole, string> = {
  foundation: 'Foundation',
  modulator: 'Modulator',
  accent: 'Accent',
};

export default function PreRollStack({ segments, height = 400 }: PreRollStackProps) {
  // Validate: segments must have names
  if (segments.length === 0) {
    throw new Error('PreRollStack requires at least one segment');
  }

  const hasUnnamedSegments = segments.some(s => !s.name || s.name.trim() === '');
  if (hasUnnamedSegments) {
    throw new Error('PreRollStack contains unnamed segments - invalid resolution');
  }

  // Validate percentages sum to 100
  const totalPercentage = segments.reduce((sum, s) => sum + s.percentage, 0);
  if (Math.abs(totalPercentage - 100) > 0.1) {
    console.warn(`PreRollStack percentages sum to ${totalPercentage}%, expected 100%`);
  }

  return (
    <div className="flex flex-col items-center">
      <div 
        className="w-32 border-2 border-[#3A3A3A] rounded-sm overflow-hidden bg-[#1A1A1A] shadow-lg"
        style={{ height: `${height}px` }}
      >
        {segments.map((segment, index) => {
          const segmentHeight = (segment.percentage / 100) * height;
          const isLast = index === segments.length - 1;
          
          return (
            <div
              key={`${segment.name}-${index}`}
              className="flex flex-col items-center justify-center border-b border-[#2A2A2A] relative transition-all duration-300 ease-out"
              style={{
                height: `${segmentHeight}px`,
                backgroundColor: ROLE_COLORS[segment.role],
                minHeight: segmentHeight < 40 ? '40px' : undefined,
              }}
            >
              {/* Strain Name */}
              <div className="text-[#1A1A1A] font-semibold text-sm px-2 text-center leading-tight mb-1">
                {segment.name}
              </div>
              
              {/* Percentage */}
              <div className="text-[#2A2A2A] font-mono text-xs mb-1">
                {segment.percentage}%
              </div>
              
              {/* Role Label */}
              <div className="text-[#3A3A3A] text-xs uppercase tracking-wider">
                {ROLE_LABELS[segment.role]}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}






