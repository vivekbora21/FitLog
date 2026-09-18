'use client';

import React from 'react';

interface CalendarHeatmapProps {
  activityDates: Record<string, number>;
}

export const CalendarHeatmap: React.FC<CalendarHeatmapProps> = ({ activityDates }) => {
  // Generate past 77 days (11 weeks x 7 days)
  const today = new Date();
  const days: { dateStr: string; count: number; dayOfWeek: number }[] = [];

  for (let i = 76; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const count = activityDates[dateStr] || 0;
    days.push({
      dateStr,
      count,
      dayOfWeek: d.getDay(),
    });
  }

  const getColor = (count: number) => {
    if (count === 0) return '#E2E8F0';
    if (count === 1) return '#A7F3D0';
    if (count === 2) return '#34D399';
    return '#059669';
  };

  return (
    <div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(11, 1fr)',
          gap: '5px',
        }}
      >
        {days.map((d, idx) => (
          <div
            key={idx}
            title={`${d.dateStr}: ${d.count} workout(s)`}
            style={{
              aspectRatio: '1',
              borderRadius: '4px',
              backgroundColor: getColor(d.count),
              boxShadow: d.count > 0 ? '0 1px 3px rgba(5, 150, 105, 0.2)' : 'none',
              transition: 'transform 150ms ease',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.transform = 'scale(1.25)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
            }}
          />
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', marginTop: '10px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        <span>Less</span>
        <span style={{ width: 10, height: 10, borderRadius: 2, background: '#E2E8F0' }} />
        <span style={{ width: 10, height: 10, borderRadius: 2, background: '#A7F3D0' }} />
        <span style={{ width: 10, height: 10, borderRadius: 2, background: '#34D399' }} />
        <span style={{ width: 10, height: 10, borderRadius: 2, background: '#059669' }} />
        <span>More</span>
      </div>
    </div>
  );
};
