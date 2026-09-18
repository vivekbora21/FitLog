'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Activity, ArrowRight, CheckCircle2, Droplets, Scale, Trophy } from 'lucide-react';
import { api } from '@/lib/api';
import { DashboardCharts, DashboardTrends } from '@/components/DashboardCharts';

type DashboardStats = {
  workouts_this_week?: number;
  total_volume_kg_week?: number;
  nutrition?: Record<string, number>;
  recent_prs?: Array<{ exercise: string; max_weight_kg: number; reps: number; estimated_1rm: number }>;
  journey?: Record<string, number | null>;
  trends?: DashboardTrends;
};

type TodayPayload = {
  program?: { current_day: number; duration_days: number } | null;
  today?: {
    day_number: number;
    label: string;
    status: string;
    routine_details?: {
      id: string;
      name: string;
      exercises?: Array<{
        id: string;
        exercise_name: string;
        target_sets: number;
        target_reps: string;
        target_rpe?: number;
        suggested_weight_kg?: number;
      }>;
    };
  } | null;
};

const fmt = (value: unknown, suffix = '') => {
  if (value === null || value === undefined || value === '') return '--';
  return `${value}${suffix}`;
};

const pct = (actual = 0, target = 1) => Math.min(100, Math.round((actual / Math.max(target, 1)) * 100));

function MetricBlock({ label, value, note, tone = 'neutral' }: { label: string; value: string; note?: string; tone?: 'neutral' | 'up' | 'down' | 'warn' }) {
  const colors = {
    neutral: 'var(--text-primary)',
    up: 'var(--color-primary)',
    down: '#0EA5E9',
    warn: '#D97706',
  };
  return (
    <div style={{ border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', padding: '0.9rem 1rem', minHeight: 92 }}>
      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
      <div style={{ color: colors[tone], fontSize: '1.45rem', fontWeight: 850, marginTop: '0.35rem', lineHeight: 1.05 }}>{value}</div>
      {note && <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginTop: '0.35rem' }}>{note}</div>}
    </div>
  );
}

function ProgressLine({ label, actual, target, suffix = '' }: { label: string; actual: number; target: number; suffix?: string }) {
  const width = pct(actual, target);
  return (
    <div style={{ display: 'grid', gap: '0.4rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', fontSize: '0.82rem' }}>
        <span style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>{label}</span>
        <span style={{ color: 'var(--text-primary)', fontWeight: 800 }}>{actual}{suffix} / {target}{suffix}</span>
      </div>
      <div style={{ height: 8, background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)' }}>
        <div style={{ width: `${width}%`, height: '100%', background: width >= 85 ? 'var(--color-primary)' : '#F59E0B' }} />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [today, setToday] = useState<TodayPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getDashboardStats(), api.getTodaysWorkout()])
      .then(([dashboard, current]) => {
        setStats(dashboard);
        setToday(current);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const journey = stats?.journey || {};
  const nutrition = stats?.nutrition || {};
  const routine = today?.today?.routine_details;
  const anchorLifts = useMemo(() => (stats?.recent_prs || []).slice(0, 5), [stats]);
  const programDay = Number(journey.program_day || today?.program?.current_day || 1);
  const programLength = Number(journey.program_length || today?.program?.duration_days || 60);
  const programPct = Number(journey.program_completion_percent || pct(programDay - 1, programLength));

  if (loading) {
    return <div style={{ padding: '3rem 0', color: 'var(--text-secondary)' }}>Loading the journey dashboard...</div>;
  }

  return (
    <div style={{ display: 'grid', gap: '1.35rem' }}>
      <section style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <div style={{ color: 'var(--color-primary)', fontSize: '0.72rem', fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase' }}>FitLog 60-Day Journey</div>
          <h1 style={{ margin: '0.25rem 0 0', fontSize: '2rem', lineHeight: 1.05 }}>Dashboard</h1>
          <p style={{ margin: '0.45rem 0 0', color: 'var(--text-secondary)' }}>Plan, train, log, measure, review, progress.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <Link href="/app/daily" style={{ padding: '0.7rem 0.9rem', border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', fontWeight: 800 }}>Log Daily</Link>
          <Link href="/app/workouts/active" style={{ padding: '0.7rem 0.9rem', background: 'var(--color-primary)', color: '#052b20', fontWeight: 900 }}>Start Today <ArrowRight size={15} style={{ verticalAlign: 'middle' }} /></Link>
        </div>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.65rem' }}>
        <MetricBlock label="Current weight" value={fmt(journey.current_weight, ' kg')} note={`Start ${fmt(journey.starting_weight, ' kg')}`} tone="down" />
        <MetricBlock label="Weight change" value={fmt(journey.weight_change, ' kg')} note={`7-day avg ${fmt(journey.seven_day_average, ' kg')}`} tone={Number(journey.weight_change || 0) <= 0 ? 'down' : 'warn'} />
        <MetricBlock label="Weekly change" value={fmt(journey.weekly_weight_change, ' kg')} note="Rolling average basis" tone={Number(journey.weekly_weight_change || 0) <= 0 ? 'down' : 'warn'} />
        <MetricBlock label="Current waist" value={fmt(journey.current_waist, ' cm')} note={`Change ${fmt(journey.waist_change, ' cm')}`} tone="down" />
        <MetricBlock label="Program progress" value={`${programPct}%`} note={`Day ${programDay} of ${programLength}`} tone="up" />
      </section>

      <section>
        <DashboardCharts
          trends={stats?.trends}
          targetWeight={74.0}
          dailyCaloriesTarget={Number(nutrition.calories_target || 2160)}
        />
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.35fr) minmax(320px, 0.65fr)', gap: '1rem' }}>
        <div style={{ border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', padding: '1.1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.9rem' }}>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Today</div>
              <h2 style={{ margin: '0.25rem 0 0', fontSize: '1.25rem' }}>{routine?.name || today?.today?.label || 'No active workout'}</h2>
              <p style={{ margin: '0.35rem 0 0', color: 'var(--text-secondary)', fontSize: '0.86rem' }}>Program Day {today?.today?.day_number || programDay} · {today?.today?.status || 'UPCOMING'}</p>
            </div>
            <Link href="/app/workouts/plan" style={{ height: 'fit-content', padding: '0.6rem 0.75rem', border: '1px solid var(--border-subtle)', fontWeight: 800 }}>View Plan</Link>
          </div>

          <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
              <thead>
                <tr style={{ color: 'var(--text-muted)', textAlign: 'left', fontSize: '0.7rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.55rem 0' }}>Exercise</th>
                  <th>Sets</th>
                  <th>Target reps</th>
                  <th>RPE</th>
                  <th>Suggested</th>
                </tr>
              </thead>
              <tbody>
                {(routine?.exercises || []).slice(0, 7).map((exercise) => (
                  <tr key={exercise.id} style={{ borderTop: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '0.68rem 0', fontWeight: 800 }}>{exercise.exercise_name}</td>
                    <td>{exercise.target_sets}</td>
                    <td>{exercise.target_reps}</td>
                    <td>{exercise.target_rpe || 8}</td>
                    <td>{exercise.suggested_weight_kg ? `${exercise.suggested_weight_kg} kg` : '--'}</td>
                  </tr>
                ))}
                {!routine?.exercises?.length && (
                  <tr><td colSpan={5} style={{ padding: '1rem 0', color: 'var(--text-secondary)' }}>Seed or assign a 60-day program to populate today.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', padding: '1.1rem', display: 'grid', gap: '0.95rem' }}>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Daily Adherence</div>
            <h2 style={{ margin: '0.25rem 0 0', fontSize: '1.15rem' }}>Targets</h2>
          </div>
          <ProgressLine label="Calories" actual={Number(nutrition.calories_consumed || 0)} target={Number(nutrition.calories_target || 1)} />
          <ProgressLine label="Protein" actual={Number(nutrition.protein_consumed || 0)} target={Number(nutrition.protein_target || 1)} suffix="g" />
          <ProgressLine label="Water" actual={Math.round(Number(nutrition.water_consumed_ml || 0) / 250)} target={Math.round(Number(nutrition.water_target_ml || 3000) / 250)} suffix=" cups" />
          <ProgressLine label="Cardio" actual={Number(journey.cardio_minutes || 0)} target={Number(journey.cardio_target || 120)} suffix=" min" />
          <ProgressLine label="Workouts" actual={Number(stats?.workouts_this_week || 0)} target={5} />
        </div>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(280px, 0.42fr)', gap: '1rem' }}>
        <div style={{ border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', padding: '1.1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.9rem' }}>
            <Trophy size={18} color="var(--color-primary)" />
            <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Key Compound Strength Progression Tracker</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '0.65rem' }}>
            {anchorLifts.map((lift) => (
              <div key={lift.exercise} style={{ border: '1px solid var(--border-subtle)', padding: '0.85rem', background: 'var(--bg-surface-elevated)' }}>
                <div style={{ color: 'var(--text-primary)', fontWeight: 850 }}>{lift.exercise}</div>
                <div style={{ color: 'var(--color-primary)', fontWeight: 900, fontSize: '1.15rem', marginTop: '0.35rem' }}>{lift.max_weight_kg} kg x {lift.reps}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginTop: '0.35rem' }}>Estimated 1RM {Math.round(lift.estimated_1rm)} kg · progress next by reps first</div>
              </div>
            ))}
            {!anchorLifts.length && <div style={{ color: 'var(--text-secondary)' }}>Complete workouts to build the anchor lift tracker.</div>}
          </div>
        </div>

        <div style={{ border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', padding: '1.1rem', display: 'grid', gap: '0.75rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Next</h2>
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', color: 'var(--text-secondary)' }}><CheckCircle2 size={18} color="var(--color-primary)" /> Finish today&apos;s prescribed sets.</div>
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', color: 'var(--text-secondary)' }}><Scale size={18} color="#0EA5E9" /> Log morning weight in Daily Log.</div>
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', color: 'var(--text-secondary)' }}><Droplets size={18} color="#0EA5E9" /> Hit hydration before late evening.</div>
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', color: 'var(--text-secondary)' }}><Activity size={18} color="#D97706" /> Review weekly trend before adjusting.</div>
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
            Weekly volume: <strong style={{ color: 'var(--text-primary)' }}>{fmt(stats?.total_volume_kg_week, ' kg')}</strong>
          </div>
        </div>
      </section>
    </div>
  );
}
