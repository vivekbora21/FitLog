'use client';

import React from 'react';

interface MacroRingProps {
  label: string;
  current: number;
  target: number;
  unit?: string;
  color?: string;
  glowColor?: string;
  size?: number;
  strokeWidth?: number;
}

export const MacroRing: React.FC<MacroRingProps> = ({
  label,
  current,
  target,
  unit = 'g',
  color = '#10B981',
  glowColor = 'rgba(16, 185, 129, 0.3)',
  size = 120,
  strokeWidth = 9,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(0, 0, 0, 0.07)"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress fill */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
              filter: `drop-shadow(0 0 6px ${glowColor})`,
            }}
          />
        </svg>
        {/* Center Text */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
          }}
        >
          <span style={{ fontSize: size > 110 ? '1.25rem' : '1rem', fontWeight: 800, fontFamily: 'Outfit, sans-serif' }}>
            {current}
          </span>
          <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>
            / {target}{unit}
          </span>
        </div>
      </div>
      <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </span>
    </div>
  );
};
