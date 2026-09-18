'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Scale, Dumbbell, Flame, TrendingDown, TrendingUp, Target, ArrowRight } from 'lucide-react';
import { MetricChart, DataPoint } from './MetricChart';

export interface WeightTrendPoint {
  date: string;
  label: string;
  weight_kg: number;
  waist_cm?: number | null;
}

export interface VolumeTrendPoint {
  date: string;
  label: string;
  title: string;
  volume_kg: number;
}

export interface NutritionTrendPoint {
  date: string;
  label: string;
  calories: number;
  calories_target: number;
  protein: number;
  protein_target: number;
}

export interface DashboardTrends {
  weight?: WeightTrendPoint[];
  volume?: VolumeTrendPoint[];
  nutrition?: NutritionTrendPoint[];
}

interface DashboardChartsProps {
  trends?: DashboardTrends;
  targetWeight?: number;
  dailyCaloriesTarget?: number;
}

export function DashboardCharts({
  trends,
  targetWeight = 74.0,
  dailyCaloriesTarget = 2160,
}: DashboardChartsProps) {
  const [activeTab, setActiveTab] = useState<'weight' | 'volume' | 'nutrition'>('weight');

  const weightPoints = trends?.weight || [];
  const volumePoints = trends?.volume || [];
  const nutritionPoints = trends?.nutrition || [];

  // Weight metrics calculations
  const weightMetrics = useMemo(() => {
    if (!weightPoints.length) return null;
    const latest = weightPoints[weightPoints.length - 1];
    const initial = weightPoints[0];
    const netChange = (latest.weight_kg - initial.weight_kg).toFixed(2);
    const toGoal = (latest.weight_kg - targetWeight).toFixed(1);
    const latestWaist = [...weightPoints].reverse().find((p) => p.waist_cm !== undefined && p.waist_cm !== null)?.waist_cm;

    return {
      current: latest.weight_kg,
      initial: initial.weight_kg,
      netChange: Number(netChange),
      toGoal: Number(toGoal),
      latestWaist,
    };
  }, [weightPoints, targetWeight]);

  // Volume metrics calculations
  const volumeMetrics = useMemo(() => {
    if (!volumePoints.length) return null;
    const totalVolume = volumePoints.reduce((acc, p) => acc + p.volume_kg, 0);
    const avgVolume = Math.round(totalVolume / volumePoints.length);
    const maxVolume = Math.max(...volumePoints.map((p) => p.volume_kg));
    const latest = volumePoints[volumePoints.length - 1];

    return {
      latest: latest.volume_kg,
      avg: avgVolume,
      max: maxVolume,
      sessionsCount: volumePoints.length,
      total: totalVolume,
    };
  }, [volumePoints]);

  // Nutrition metrics calculations
  const nutritionMetrics = useMemo(() => {
    if (!nutritionPoints.length) return null;
    const loggedDays = nutritionPoints.filter((p) => p.calories > 0);
    const avgCalories = loggedDays.length
      ? Math.round(loggedDays.reduce((acc, p) => acc + p.calories, 0) / loggedDays.length)
      : 0;
    const latest = nutritionPoints[nutritionPoints.length - 1];

    return {
      latestCalories: latest.calories,
      latestProtein: latest.protein,
      avgCalories,
      targetCalories: dailyCaloriesTarget,
      adherencePct: avgCalories ? Math.min(100, Math.round((avgCalories / dailyCaloriesTarget) * 100)) : 0,
    };
  }, [nutritionPoints, dailyCaloriesTarget]);

  // Formatted chart series
  const weightChartData: DataPoint[] = useMemo(() => {
    return weightPoints.map((p) => ({
      label: p.label,
      value: p.weight_kg,
      sublabel: p.waist_cm ? `Waist: ${p.waist_cm} cm` : undefined,
    }));
  }, [weightPoints]);

  const volumeChartData: DataPoint[] = useMemo(() => {
    return volumePoints.map((p) => ({
      label: p.label,
      value: p.volume_kg,
      sublabel: p.title,
    }));
  }, [volumePoints]);

  const nutritionChartData: DataPoint[] = useMemo(() => {
    return nutritionPoints.map((p) => ({
      label: p.label,
      value: p.calories,
      sublabel: p.protein ? `Protein: ${p.protein}g` : undefined,
    }));
  }, [nutritionPoints]);

  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        padding: '1.25rem',
        display: 'grid',
        gap: '1.25rem',
      }}
    >
      {/* Top Header & Tab Controls */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '0.9rem',
        }}
      >
        <div>
          <div
            style={{
              fontSize: '0.7rem',
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--color-primary)',
            }}
          >
            Analytics & Progression
          </div>
          <h2 style={{ fontSize: '1.3rem', margin: '0.2rem 0 0' }}>Performance Trends</h2>
        </div>

        {/* View Switcher Tabs */}
        <div
          style={{
            display: 'flex',
            background: 'var(--bg-surface-elevated)',
            padding: '3px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            gap: '3px',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('weight')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              fontSize: '0.8rem',
              fontWeight: 700,
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              cursor: 'pointer',
              background: activeTab === 'weight' ? 'var(--bg-surface)' : 'transparent',
              color: activeTab === 'weight' ? 'var(--color-primary)' : 'var(--text-secondary)',
              boxShadow: activeTab === 'weight' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all var(--transition-fast)',
            }}
          >
            <Scale size={14} />
            <span>Weight & Waist</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('volume')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              fontSize: '0.8rem',
              fontWeight: 700,
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              cursor: 'pointer',
              background: activeTab === 'volume' ? 'var(--bg-surface)' : 'transparent',
              color: activeTab === 'volume' ? 'var(--color-cyan)' : 'var(--text-secondary)',
              boxShadow: activeTab === 'volume' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all var(--transition-fast)',
            }}
          >
            <Dumbbell size={14} />
            <span>Workout Volume</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('nutrition')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              fontSize: '0.8rem',
              fontWeight: 700,
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              cursor: 'pointer',
              background: activeTab === 'nutrition' ? 'var(--bg-surface)' : 'transparent',
              color: activeTab === 'nutrition' ? 'var(--color-amber)' : 'var(--text-secondary)',
              boxShadow: activeTab === 'nutrition' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all var(--transition-fast)',
            }}
          >
            <Flame size={14} />
            <span>Calorie Intake</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Badges Row */}
      {activeTab === 'weight' && weightMetrics && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '0.65rem',
          }}
        >
          <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.65rem 0.85rem', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>Current Weight</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 850, color: 'var(--text-primary)', marginTop: '2px' }}>
              {weightMetrics.current} <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>kg</span>
            </div>
          </div>

          <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.65rem 0.85rem', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>Net Change</div>
            <div
              style={{
                fontSize: '1.25rem',
                fontWeight: 850,
                color: weightMetrics.netChange <= 0 ? 'var(--color-primary)' : 'var(--color-amber)',
                marginTop: '2px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              {weightMetrics.netChange <= 0 ? <TrendingDown size={15} /> : <TrendingUp size={15} />}
              {weightMetrics.netChange > 0 ? `+${weightMetrics.netChange}` : weightMetrics.netChange} kg
            </div>
          </div>

          <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.65rem 0.85rem', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>60-Day Goal</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 850, color: 'var(--color-primary)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Target size={15} />
              {targetWeight} kg
            </div>
          </div>

          <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.65rem 0.85rem', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>Current Waist</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 850, color: 'var(--color-cyan)', marginTop: '2px' }}>
              {weightMetrics.latestWaist ? `${weightMetrics.latestWaist} cm` : '--'}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'volume' && volumeMetrics && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '0.65rem',
          }}
        >
          <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.65rem 0.85rem', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>Latest Session</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 850, color: 'var(--color-cyan)', marginTop: '2px' }}>
              {volumeMetrics.latest.toLocaleString()} <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>kg</span>
            </div>
          </div>

          <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.65rem 0.85rem', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>Avg / Session</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 850, color: 'var(--text-primary)', marginTop: '2px' }}>
              {volumeMetrics.avg.toLocaleString()} <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>kg</span>
            </div>
          </div>

          <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.65rem 0.85rem', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>Sessions Tracked</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 850, color: 'var(--color-primary)', marginTop: '2px' }}>
              {volumeMetrics.sessionsCount} <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>workouts</span>
            </div>
          </div>

          <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.65rem 0.85rem', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>Total Volume</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 850, color: 'var(--color-primary)', marginTop: '2px' }}>
              {Math.round(volumeMetrics.total).toLocaleString()} <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>kg</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'nutrition' && nutritionMetrics && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '0.65rem',
          }}
        >
          <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.65rem 0.85rem', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>Daily Target</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 850, color: 'var(--color-amber)', marginTop: '2px' }}>
              {nutritionMetrics.targetCalories} <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>kcal</span>
            </div>
          </div>

          <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.65rem 0.85rem', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>Latest Intake</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 850, color: 'var(--text-primary)', marginTop: '2px' }}>
              {nutritionMetrics.latestCalories} <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>kcal</span>
            </div>
          </div>

          <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.65rem 0.85rem', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>Latest Protein</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 850, color: 'var(--color-primary)', marginTop: '2px' }}>
              {nutritionMetrics.latestProtein} <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>g</span>
            </div>
          </div>

          <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.65rem 0.85rem', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>Adherence</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 850, color: 'var(--color-primary)', marginTop: '2px' }}>
              {nutritionMetrics.adherencePct}%
            </div>
          </div>
        </div>
      )}

      {/* Main Chart Canvas */}
      <div style={{ minHeight: 220 }}>
        {activeTab === 'weight' && (
          weightChartData.length > 0 ? (
            <MetricChart
              data={weightChartData}
              title="Bodyweight Recomposition Trend"
              subtitle="Daily scale weight logged fasted vs 60-day goal trajectory"
              unit="kg"
              type="line"
              color="#059669"
              height={220}
              targetValue={targetWeight}
              targetLabel="60-Day Goal"
              targetColor="#0284C7"
            />
          ) : (
            <div
              style={{
                height: 200,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--bg-surface-elevated)',
                gap: '0.75rem',
              }}
            >
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No weight logs found yet.</div>
              <Link
                href="/app/daily"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '6px 12px',
                  background: 'var(--color-primary)',
                  color: '#052b20',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                }}
              >
                Log Morning Weight <ArrowRight size={14} />
              </Link>
            </div>
          )
        )}

        {activeTab === 'volume' && (
          volumeChartData.length > 0 ? (
            <MetricChart
              data={volumeChartData}
              title="Training Volume Progression (kg)"
              subtitle="Total tonnage lifted per session across completed workouts"
              unit="kg"
              type="bar"
              color="#0284C7"
              height={220}
              targetValue={volumeMetrics ? volumeMetrics.avg : undefined}
              targetLabel="Avg Volume"
              targetColor="#D97706"
            />
          ) : (
            <div
              style={{
                height: 200,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--bg-surface-elevated)',
                gap: '0.75rem',
              }}
            >
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No workout sessions completed yet.</div>
              <Link
                href="/app/workouts/active"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '6px 12px',
                  background: 'var(--color-cyan)',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                }}
              >
                Start Workout Session <ArrowRight size={14} />
              </Link>
            </div>
          )
        )}

        {activeTab === 'nutrition' && (
          nutritionChartData.length > 0 ? (
            <MetricChart
              data={nutritionChartData}
              title="Daily Caloric Intake vs Target"
              subtitle="Daily calories consumed vs 2,160 kcal fat loss deficit target"
              unit="kcal"
              type="bar"
              color="#D97706"
              height={220}
              targetValue={dailyCaloriesTarget}
              targetLabel="Target"
              targetColor="#059669"
            />
          ) : (
            <div
              style={{
                height: 200,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--bg-surface-elevated)',
                gap: '0.75rem',
              }}
            >
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No nutrition logs recorded this week.</div>
              <Link
                href="/app/daily"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '6px 12px',
                  background: 'var(--color-amber)',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                }}
              >
                Log Today&apos;s Meals <ArrowRight size={14} />
              </Link>
            </div>
          )
        )}
      </div>
    </div>
  );
}
