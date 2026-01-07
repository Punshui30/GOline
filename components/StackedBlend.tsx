/**
 * Stacked Blend Component
 * 
 * Renders stacked consumption plan visualization.
 * Each layer represents a position in the consumption stack.
 */

'use client';

interface StackLayer {
  strain: {
    id: string;
    displayName: string;
  };
  percent: number;
  position?: 'top' | 'middle' | 'bottom';
}

interface StackedBlendProps {
  stack: StackLayer[];
}

export function StackedBlend({ stack }: StackedBlendProps) {
  if (!stack || stack.length === 0) {
    return null;
  }

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {stack.map((layer, i) => (
        <div key={i} style={{ marginBottom: '8px' }}>
          <strong style={{ color: '#f2f2f2' }}>{layer.strain.displayName}</strong>
          {' — '}
          <span style={{ color: '#9a9a9a' }}>{layer.percent}%</span>
        </div>
      ))}
    </div>
  );
}


