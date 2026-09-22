import React from 'react';

interface ProgressBarProps {
  value: number;
  max?: number;
  color?: string;
  height?: number;
  showLabel?: boolean;
  className?: string;
}

export default function ProgressBar({
  value,
  max = 100,
  color = '#B8623A',
  height = 8,
  showLabel = false,
  className = '',
}: ProgressBarProps) {
  const pct = Math.min(100, Math.round((value / max) * 100));

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between text-xs text-brand-primary/60 mb-1">
          <span>{value}</span>
          <span>{pct}%</span>
        </div>
      )}
      <div
        className="w-full rounded-full overflow-hidden"
        style={{ height, backgroundColor: '#2a2520' }}
      >
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
