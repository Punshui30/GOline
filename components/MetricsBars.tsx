/**
 * Metrics Bars Component
 * 
 * Read-only metric visualization.
 * NO sliders, NO interactivity, NO knobs.
 * Thin horizontal bars only.
 */

'use client';

interface MetricsBarsProps {
  metrics: Record<string, number>;
}

export function MetricsBars({ metrics }: MetricsBarsProps) {
  if (!metrics || Object.keys(metrics).length === 0) {
    return null;
  }

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {Object.entries(metrics).map(([key, value]) => (
        <div key={key} style={{ marginBottom: '12px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#9a9a9a',
              marginBottom: '4px',
              fontWeight: 300
            }}
          >
            {key.toUpperCase()}
          </label>
          <div
            style={{
              width: `${Math.min(100, Math.max(0, value))}%`,
              height: '4px',
              background: '#f5b642'
            }}
          />
        </div>
      ))}
    </div>
  );
}

