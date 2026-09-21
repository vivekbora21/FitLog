'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Circle, Flag, Play, SlidersHorizontal, Flame, Dumbbell, Target, Zap, Activity } from 'lucide-react';
import { api } from '@/lib/api';
import { PlanSelectorModal } from '@/components/PlanSelectorModal';

type ProgramDay = {
  id: string;
  day_number: number;
  label: string;
  is_optional: boolean;
  status: 'UPCOMING' | 'COMPLETED' | 'MISSED';
  routine_details?: {
    id: string;
    name: string;
    description?: string;
    exercises?: Array<{
      id: string;
      exercise_name: string;
      primary_muscle: string;
      focus?: string;
      target_sets: number;
      target_reps: string;
      rest_seconds: number;
      target_rpe?: number;
      suggested_weight_kg?: number;
      notes?: string;
    }>;
  };
};

type WorkoutPlanPayload = {
  program: {
    id: string;
    name: string;
    mode?: string;
    mode_label?: string;
    start_date: string;
    current_day: number;
    duration_days: number;
    start_weight_kg?: number;
    target_weight_kg?: number;
    target_weekly_rate_kg?: number;
    target_cardio_minutes_early?: number;
    target_cardio_minutes_later?: number;
  } | null;
  days: ProgramDay[];
};

function statusTone(day: ProgramDay, currentDay: number) {
  if (day.status === 'COMPLETED') return { icon: <CheckCircle2 size={14} />, color: 'var(--color-primary)', label: 'Completed' };
  if (day.status === 'MISSED') return { icon: <Flag size={14} />, color: '#D97706', label: 'Resume' };
  if (day.day_number === currentDay) return { icon: <Play size={14} />, color: '#0EA5E9', label: 'Today' };
  return { icon: <Circle size={14} />, color: 'var(--text-muted)', label: 'Upcoming' };
}

export default function WorkoutPlanPage() {
  const [payload, setPayload] = useState<WorkoutPlanPayload | null>(null);
  const [selectedDay, setSelectedDay] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadPlan = () => {
    api.getWorkoutPlan()
      .then((plan) => {
        setPayload(plan);
        setSelectedDay(plan.program?.current_day || 1);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPlan();
  }, []);

  const days = useMemo(() => payload?.days || [], [payload]);
  const program = payload?.program;
  const duration = program?.duration_days || 60;
  const currentDay = program?.current_day || 1;
  const day = useMemo(() => days.find((item) => item.day_number === selectedDay), [days, selectedDay]);
  const routine = day?.routine_details;
  const completed = days.filter((item) => item.status === 'COMPLETED').length;
  const selectedTone = day ? statusTone(day, currentDay) : null;

  // Dynamic milestones
  const milestones = useMemo(() => {
    const arr = [1, Math.round(duration * 0.25), Math.round(duration * 0.5), Math.round(duration * 0.75), duration];
    return Array.from(new Set(arr)).sort((a, b) => a - b);
  }, [duration]);

  if (loading) return <div style={{ padding: '3rem 0', color: 'var(--text-secondary)' }}>Loading workout plan...</div>;

  return (
    <div style={{ display: 'grid', gap: '1.25rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '.72rem', fontWeight: 900, letterSpacing: '.1em', color: 'var(--color-primary)', textTransform: 'uppercase' }}>
              {program?.mode_label || 'Workout Plan'} · {duration} Days
            </span>
            {program?.start_weight_kg && program?.target_weight_kg && (
              <span style={{ fontSize: '.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                ({program.start_weight_kg}kg → {program.target_weight_kg}kg)
              </span>
            )}
          </div>
          <h1 style={{ margin: '.3rem 0 0', fontSize: '2rem' }}>Program Day {selectedDay}</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '.45rem 0 0' }}>
            Program day advances after completion. Calendar dates do not skip unfinished training.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '.45rem',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              padding: '.75rem .95rem',
              fontWeight: 800,
              cursor: 'pointer',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <SlidersHorizontal size={16} /> Mode &amp; Plan
          </button>
          <Link
            href="/app/workouts/active"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '.45rem',
              background: 'var(--color-primary)',
              color: '#052b20',
              padding: '.75rem .95rem',
              fontWeight: 900,
              borderRadius: 'var(--radius-md)',
              textDecoration: 'none',
            }}
          >
            <Play size={16} /> Start Current Day
          </Link>
        </div>
      </header>

      {!program ? (
        <section style={{ border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', padding: '1.25rem', borderRadius: 'var(--radius-lg)' }}>
          <h2 style={{ marginTop: 0 }}>No enrolled journey program</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Start a goal-oriented journey by selecting a mode (Cut, Bulk, Focus, Recomp) to schedule your training days.
          </p>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '.45rem',
              background: 'var(--color-primary)',
              color: '#052b20',
              padding: '.65rem 1rem',
              fontWeight: 800,
              cursor: 'pointer',
              border: 'none',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <SlidersHorizontal size={15} /> Select a Plan Now
          </button>
        </section>
      ) : (
        <>
          <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 260px', gap: '1rem' }}>
            <div style={{ border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', padding: '1rem', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: '.75rem', fontSize: '.82rem', color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--text-primary)' }}>{program.name}</strong>
                <span>{completed} completed / {program.duration_days} days</span>
              </div>
              <div style={{ height: 10, border: '1px solid var(--border-subtle)', background: 'var(--bg-surface-elevated)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.round((completed / Math.max(program.duration_days, 1)) * 100)}%`, background: 'var(--color-primary)' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${duration}, minmax(4px, 1fr))`, gap: 3, marginTop: '.85rem' }}>
                {days.map((item) => {
                  const milestone = milestones.includes(item.day_number);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      title={`Day ${item.day_number}: ${item.label}`}
                      onClick={() => setSelectedDay(item.day_number)}
                      style={{
                        height: milestone ? 18 : 12,
                        alignSelf: 'end',
                        border: item.day_number === selectedDay ? '2px solid var(--text-primary)' : '1px solid var(--border-subtle)',
                        background: item.status === 'COMPLETED' ? 'var(--color-primary)' : item.day_number === currentDay ? '#0EA5E9' : item.is_optional ? '#F59E0B' : 'var(--bg-surface-elevated)',
                        cursor: 'pointer',
                        padding: 0,
                        borderRadius: 2,
                      }}
                      aria-label={`Select day ${item.day_number}`}
                    />
                  );
                })}
              </div>
            </div>

            <aside style={{ border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', padding: '1rem', display: 'grid', gap: '.7rem', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', color: 'var(--text-secondary)' }}><CalendarDays size={17} /> Start {program.start_date}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', color: 'var(--text-secondary)' }}><Flag size={17} /> Milestones: {milestones.join(', ')}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '.85rem' }}>Dynamic plan cycle configured for {duration} days of programmed training and recovery.</div>
            </aside>
          </section>

          <section style={{ display: 'flex', gap: '.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => setSelectedDay(Math.max(1, selectedDay - 1))} style={{ display: 'inline-flex', alignItems: 'center', gap: '.35rem', padding: '.55rem .75rem', border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', fontWeight: 800, cursor: 'pointer', borderRadius: 'var(--radius-sm)' }}>
              <ChevronLeft size={15} /> Previous Day
            </button>
            <button onClick={() => setSelectedDay(currentDay)} style={{ padding: '.55rem .75rem', border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', fontWeight: 800, cursor: 'pointer', borderRadius: 'var(--radius-sm)' }}>Current Day</button>
            <button onClick={() => setSelectedDay(Math.min(program.duration_days, selectedDay + 1))} style={{ display: 'inline-flex', alignItems: 'center', gap: '.35rem', padding: '.55rem .75rem', border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', fontWeight: 800, cursor: 'pointer', borderRadius: 'var(--radius-sm)' }}>
              Next Day <ChevronRight size={15} />
            </button>
          </section>

          <section style={{ border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', padding: '1.15rem', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '.9rem' }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '.35rem', color: selectedTone?.color || 'var(--text-muted)', fontSize: '.76rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.07em' }}>
                  {selectedTone?.icon} {selectedTone?.label || 'Unavailable'} {day?.is_optional ? ' / Optional' : ''}
                </div>
                <h2 style={{ margin: '.35rem 0 0' }}>{day?.label || routine?.name || 'Plan day unavailable'}</h2>
                <p style={{ color: 'var(--text-secondary)', margin: '.35rem 0 0' }}>{routine?.description || 'This day does not have a routine attached yet.'}</p>
              </div>
              {day?.day_number === currentDay && (
                <Link
                  href="/app/workouts/active"
                  style={{
                    height: 'fit-content',
                    padding: '.65rem .85rem',
                    background: 'var(--color-primary)',
                    color: '#052b20',
                    fontWeight: 900,
                    borderRadius: 'var(--radius-sm)',
                    textDecoration: 'none',
                  }}
                >
                  Log this workout
                </Link>
              )}
            </div>

            <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.84rem' }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: 'var(--text-muted)', fontSize: '.7rem', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                    <th style={{ padding: '.55rem 0' }}>Exercise / focus</th>
                    <th>Sets</th>
                    <th>Target reps</th>
                    <th>Rest</th>
                    <th>RPE</th>
                    <th>Suggested load</th>
                    <th>Coaching note</th>
                  </tr>
                </thead>
                <tbody>
                  {(routine?.exercises || []).map((exercise) => (
                    <tr key={exercise.id} style={{ borderTop: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '.75rem 0' }}><strong>{exercise.exercise_name}</strong><br /><small style={{ color: 'var(--text-secondary)' }}>{exercise.focus || exercise.primary_muscle}</small></td>
                      <td>{exercise.target_sets}</td>
                      <td>{exercise.target_reps}</td>
                      <td>{exercise.rest_seconds}s</td>
                      <td>{exercise.target_rpe || 8}</td>
                      <td>{exercise.suggested_weight_kg ? `${exercise.suggested_weight_kg} kg` : '--'}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{exercise.notes || '--'}</td>
                    </tr>
                  ))}
                  {!routine?.exercises?.length && <tr><td colSpan={7} style={{ padding: '1rem 0', color: 'var(--text-secondary)' }}>No exercises configured for this day.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      <PlanSelectorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          loadPlan();
        }}
        initialWeight={program?.start_weight_kg || 75.0}
      />
    </div>
  );
}
