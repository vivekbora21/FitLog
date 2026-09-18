'use client';

import React, { useState } from 'react';

export interface DataPoint {
  label: string;
  value: number;
  sublabel?: string;
  extra?: string;
}

export interface MetricChartProps {
  data: DataPoint[];
  title?: string;
  subtitle?: string;
  unit?: string;
  type?: 'line' | 'bar';
  color?: string;
  height?: number;
  targetValue?: number;
  targetLabel?: string;
  targetColor?: string;
  emptyMessage?: string;
}

export const MetricChart: React.FC<MetricChartProps> = ({
  data,
  title,
  subtitle,
  unit = '',
  type = 'line',
  color = '#10B981',
  height = 220,
  targetValue,
  targetLabel,
  targetColor = '#F59E0B',
  emptyMessage = 'No data logged yet',
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div style={{ height, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: '0.5rem', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)' }}>
        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{emptyMessage}</span>
      </div>
    );
  }

  const values = data.map((d) => d.value);
  if (targetValue !== undefined && !isNaN(targetValue)) {
    values.push(targetValue);
  }

  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const paddingLeft = 36;
  const paddingRight = 36;
  const paddingTop = 24;
  const paddingBottom = 32;
  const chartWidth = 580;
  const chartHeight = height - paddingTop - paddingBottom;

  const yMin = type === 'bar' ? 0 : Math.floor(minVal * 0.985);
  const yMax = Math.ceil(maxVal * 1.015) || 10;
  const yRange = yMax - yMin || 1;

  const getY = (val: number) => height - paddingBottom - ((val - yMin) / yRange) * chartHeight;

  const points = data.map((d, index) => {
    const x = paddingLeft + (index / (data.length - 1 || 1)) * (chartWidth - paddingLeft - paddingRight);
    const y = getY(d.value);
    return { x, y, ...d };
  });

  const pathD = points.reduce((acc, curr, idx) => {
    return idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
  }, '');

  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`
    : '';

  const targetY = targetValue !== undefined ? getY(targetValue) : null;
  const activePoint = hoverIndex !== null ? points[hoverIndex] : null;

  return (
    <div style={{ width: '100%', position: 'relative' }}>
      {(title || subtitle || activePoint) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            {title && <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{title}</h4>}
            {subtitle && <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>{subtitle}</p>}
          </div>
          {activePoint ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', padding: '4px 10px', borderRadius: '6px' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{activePoint.label}:</span>
              <span style={{ fontSize: '0.95rem', fontWeight: 850, color }}>{activePoint.value} {unit}</span>
              {activePoint.sublabel && (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', borderLeft: '1px solid var(--border-subtle)', paddingLeft: '8px' }}>
                  {activePoint.sublabel}
                </span>
              )}
            </div>
          ) : targetValue !== undefined && targetLabel ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              <span style={{ width: 14, height: 2, background: targetColor, display: 'inline-block', borderTop: '2px dashed ' + targetColor }} />
              <span>{targetLabel}: <strong>{targetValue} {unit}</strong></span>
            </div>
          ) : null}
        </div>
      )}

      <div style={{ width: '100%', overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${chartWidth} ${height}`} style={{ width: '100%', height, overflow: 'visible', display: 'block' }}>
          <defs>
            <linearGradient id={`grad-${color.replace(/[^a-zA-Z0-9]/g, '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.25" />
              <stop offset="100%" stopColor={color} stopOpacity="0.01" />
            </linearGradient>
            <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor={color} floodOpacity="0.3" />
            </filter>
          </defs>

          {/* Grid lines */}
          <line x1={paddingLeft} y1={paddingTop} x2={chartWidth - paddingRight} y2={paddingTop} stroke="rgba(0,0,0,0.05)" strokeDasharray="3 3" />
          <line x1={paddingLeft} y1={(paddingTop + height - paddingBottom) / 2} x2={chartWidth - paddingRight} y2={(paddingTop + height - paddingBottom) / 2} stroke="rgba(0,0,0,0.05)" strokeDasharray="3 3" />
          <line x1={paddingLeft} y1={height - paddingBottom} x2={chartWidth - paddingRight} y2={height - paddingBottom} stroke="#E2E8F0" strokeWidth="1.5" />

          {/* Target Reference Line */}
          {targetY !== null && targetY >= paddingTop && targetY <= height - paddingBottom && (
            <g>
              <line
                x1={paddingLeft}
                y1={targetY}
                x2={chartWidth - paddingRight}
                y2={targetY}
                stroke={targetColor}
                strokeWidth="1.75"
                strokeDasharray="4 4"
                opacity="0.85"
              />
              <text
                x={chartWidth - paddingRight + 4}
                y={targetY + 3.5}
                fontSize="9"
                fill={targetColor}
                fontWeight="700"
              >
                {targetValue}
              </text>
            </g>
          )}

          {type === 'line' ? (
            <>
              {/* Gradient fill */}
              <path d={areaD} fill={`url(#grad-${color.replace(/[^a-zA-Z0-9]/g, '')})`} />
              {/* Main Line */}
              <path
                d={pathD}
                fill="none"
                stroke={color}
                strokeWidth="2.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#shadow)"
              />
              {/* Hover guide vertical line */}
              {activePoint && (
                <line
                  x1={activePoint.x}
                  y1={paddingTop}
                  x2={activePoint.x}
                  y2={height - paddingBottom}
                  stroke={color}
                  strokeWidth="1.25"
                  strokeDasharray="2 2"
                  opacity="0.6"
                />
              )}
              {/* Data points */}
              {points.map((p, idx) => (
                <g key={idx}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={hoverIndex === idx ? 6.5 : 3.75}
                    fill="#FFFFFF"
                    stroke={color}
                    strokeWidth={hoverIndex === idx ? 3.5 : 2.2}
                    style={{ cursor: 'pointer', transition: 'all 150ms ease' }}
                    onMouseEnter={() => setHoverIndex(idx)}
                    onMouseLeave={() => setHoverIndex(null)}
                  />
                </g>
              ))}
            </>
          ) : (
            /* Bar Chart */
            points.map((p, idx) => {
              const availableWidth = chartWidth - paddingLeft - paddingRight;
              const barWidth = Math.min(36, Math.max(16, (availableWidth / (points.length * 1.5))));
              const barHeight = Math.max(4, height - paddingBottom - p.y);
              const isHovered = hoverIndex === idx;

              return (
                <g key={idx}>
                  <rect
                    x={p.x - barWidth / 2}
                    y={p.y}
                    width={barWidth}
                    height={barHeight}
                    rx="5"
                    fill={isHovered ? color : `${color}dd`}
                    style={{ cursor: 'pointer', transition: 'all 150ms ease' }}
                    onMouseEnter={() => setHoverIndex(idx)}
                    onMouseLeave={() => setHoverIndex(null)}
                  />
                  {isHovered && (
                    <text
                      x={p.x}
                      y={p.y - 6}
                      textAnchor="middle"
                      fontSize="10"
                      fill={color}
                      fontWeight="800"
                    >
                      {p.value}
                    </text>
                  )}
                </g>
              );
            })
          )}

          {/* X Axis Labels */}
          {points.map((p, idx) => {
            const showLabel = points.length <= 8 || idx % Math.ceil(points.length / 7) === 0 || idx === points.length - 1;
            if (!showLabel) return null;
            return (
              <text
                key={idx}
                x={p.x}
                y={height - paddingBottom + 18}
                textAnchor="middle"
                fontSize="11"
                fill={hoverIndex === idx ? 'var(--text-primary)' : 'var(--text-muted)'}
                fontWeight={hoverIndex === idx ? '700' : '500'}
              >
                {p.label}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

