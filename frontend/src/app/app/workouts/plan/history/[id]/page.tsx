'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  Flag,
  Play,
  Circle,
  ChevronDown,
  HeartPulse,
  Dumbbell,
  Clock,
  Scale,
  Flame,
  Award,
  Ruler,
  Utensils,
  Trophy,
} from 'lucide-react';
import { api } from '@/lib/api';
import { JourneyDetail, JourneyDay, JourneyMeasurementEntry } from '@/lib/types';
import { getModeMeta } from '@/lib/journeyModes';
import { RightPathCard } from '@/components/RightPathCard';
import { MetricChart } from '@/components/MetricChart';
import styles from './detail.module.css';

const MEASUREMENT_FIELDS: { key: keyof JourneyMeasurementEntry; label: string }[] = [
  { key: 'waist_cm', label: 'Waist' },
  { key: 'chest_cm', label: 'Chest' },
  { key: 'hips_cm', label: 'Hips' },
  { key: 'arms_cm', label: 'Arms' },
  { key: 'thighs_cm', label: 'Thighs' },
];

function measurementDelta(log: JourneyMeasurementEntry[], key: keyof JourneyMeasurementEntry) {
  const readings = log
    .map((m) => ({ date: m.date, value: m[key] as number | null | undefined }))
    .filter((r) => r.value != null) as { date: string; value: number }[];
  if (readings.length === 0) return null;
  const start = readings[0].value;
  const current = readings[readings.length - 1].value;
  return { start, current, delta: Math.round((current - start) * 10) / 10 };
}

function dayStatusTone(day: JourneyDay, currentDay: number) {
  if (day.status === 'COMPLETED') return { icon: <CheckCircle2 size={14} />, color: 'var(--color-primary)', label: 'Completed' };
  if (day.status === 'MISSED') return { icon: <Flag size={14} />, color: 'var(--color-amber)', label: 'Missed' };
  if (day.day_number === currentDay) return { icon: <Play size={14} />, color: '#0EA5E9', label: 'Today' };
  return { icon: <Circle size={14} />, color: 'var(--text-muted)', label: 'Upcoming' };
}

function DayRow({ day, currentDay }: { day: JourneyDay; currentDay: number }) {
  const tone = dayStatusTone(day, currentDay);
  const session = day.completed_session;
  const isCurrent = day.day_number === currentDay;

  return (
    <details className={`${styles.dayRow} ${isCurrent ? styles.dayRowCurrent : ''}`}>
      <summary className={styles.daySummary}>
        <span className={styles.dayNum}>Day {day.day_number}</span>
        <span className={styles.dayStatus} style={{ color: tone.color }}>{tone.icon} {tone.label}</span>
        <span className={styles.dayLabel}>{day.label}{day.is_optional ? ' · Optional' : ''}</span>
        {session ? (
          <span className={styles.dayVolume}>{session.total_volume_kg.toLocaleString()} kg</span>
        ) : <span />}
        <ChevronDown size={16} className={styles.chevron} />
      </summary>

      <div className={styles.dayDetail}>
        {session ? (
          <>
            <div className={styles.sessionMeta}>
              Completed {new Date(session.completed_at || session.started_at).toLocaleString()}
              {' · '}{Math.round(session.duration_seconds / 60)} min
              {session.overall_rpe ? ` · RPE ${session.overall_rpe}/10` : ''}
            </div>
            {session.notes && <p className={styles.sessionNotes}>&ldquo;{session.notes}&rdquo;</p>}
            <table className={styles.exerciseTable}>
              <thead>
                <tr><th>Exercise</th><th>Sets logged</th></tr>
              </thead>
              <tbody>
                {session.exercises.map((ex) => (
                  <tr key={ex.id}>
                    <td><strong>{ex.exercise_name}</strong><br /><small className={styles.exerciseMuscle}>{ex.primary_muscle}</small></td>
                    <td>
                      {ex.sets.map((s, idx) => (
                        <span key={s.id || idx} className={styles.setPill}>
                          {s.weight_kg}kg &times; {s.reps}{s.rpe ? ` @${s.rpe}` : ''}
                        </span>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : day.routine_details ? (
          <div className={styles.plannedGroup}>
            <span className={styles.plannedLabel}>Prescribed: {day.routine_details.name}</span>
            <ul className={styles.plannedList}>
              {(day.routine_details.exercises || []).map((ex) => (
                <li key={ex.id}>{ex.exercise_name} &mdash; {ex.target_sets} &times; {ex.target_reps}</li>
              ))}
            </ul>
          </div>
        ) : (
          <span className={styles.noRoutine}>No routine attached to this day.</span>
        )}
      </div>
    </details>
  );
}

type DayFilter = 'ALL' | 'COMPLETED' | 'MISSED' | 'UPCOMING';

export default function JourneyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [data, setData] = useState<JourneyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [dayFilter, setDayFilter] = useState<DayFilter>('ALL');

  useEffect(() => {
    if (!id) return;
    api.getJourneyDetail(id)
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  const filteredDays = useMemo(() => {
    if (!data) return [];
    if (dayFilter === 'ALL') return data.days;
    return data.days.filter((d) => d.status === dayFilter);
  }, [data, dayFilter]);

  if (loading) return <div className={styles.loading}>Loading journey...</div>;

  if (error || !data) {
    return (
      <div className={styles.loading}>
        <strong>Journey not found.</strong>
        <button type="button" className={styles.backBtn} onClick={() => router.push('/app/workouts/plan/history')}>
          <ArrowLeft size={16} /> Back to Plan History
        </button>
      </div>
    );
  }

  const { program, pacing, summary, personal_records, volume_trend, days, weight_log, measurements_log, cardio_log, nutrition_summary } = data;
  const meta = getModeMeta(program.mode);
  const Icon = meta.icon;
  const completionPct = Math.min(100, Math.round((program.completed_days / Math.max(program.duration_days, 1)) * 100));

  const weightDirectionGood = meta.weightDirection === 'loss' ? (summary.weight_change_kg ?? 0) <= 0
    : meta.weightDirection === 'gain' ? (summary.weight_change_kg ?? 0) >= 0
    : Math.abs(summary.weight_change_kg ?? 0) <= 0.5;

  const trainingHours = Math.floor(summary.total_training_minutes / 60);
  const trainingMins = summary.total_training_minutes % 60;

  const weightChartData = weight_log.map((w) => ({
    label: new Date(w.date).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }),
    value: w.weight_kg,
  }));

  const volumeChartData = volume_trend.map((v) => ({
    label: new Date(v.date).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }),
    value: v.volume_kg,
    sublabel: v.title,
  }));

  const maxMuscleSets = Math.max(1, ...summary.muscle_breakdown.map((m) => m.sets));

  const measurementDeltas = MEASUREMENT_FIELDS
    .map((f) => ({ ...f, delta: measurementDelta(measurements_log, f.key) }))
    .filter((f) => f.delta !== null);

  const cardioTotalsByModality = cardio_log.reduce<Record<string, number>>((acc, c) => {
    if (c.completed) acc[c.modality] = (acc[c.modality] || 0) + c.duration_minutes;
    return acc;
  }, {});

  const dayCounts = {
    ALL: days.length,
    COMPLETED: days.filter((d) => d.status === 'COMPLETED').length,
    MISSED: days.filter((d) => d.status === 'MISSED').length,
    UPCOMING: days.filter((d) => d.status === 'UPCOMING').length,
  };

  return (
    <div className={styles.page}>
      <button type="button" className={styles.backBtn} onClick={() => router.push('/app/workouts/plan/history')}>
        <ArrowLeft size={16} /> Back to Plan History
      </button>

      <header className={styles.header}>
        <div>
          <div className={styles.badgeRow}>
            <span className={styles.modeBadge} style={{ background: `${meta.color}15`, color: meta.color }}>
              <Icon size={13} /> {program.mode_label}
            </span>
            <span className={`${styles.statusTag} ${program.active ? styles.statusActive : styles.statusArchived}`}>
              {program.active ? 'Active' : 'Archived'}
            </span>
          </div>
          <h1 className={styles.title}>{program.name}</h1>
          <p className={styles.subtitle}>
            {program.start_date} &rarr; {program.end_date} · {program.duration_days} days · Goal: {meta.focus}
            {program.focus_exercise_name && <> · Focus lift: {program.focus_exercise_name}{program.target_focus_1rm ? ` (target ${program.target_focus_1rm}kg 1RM)` : ''}</>}
            {program.archived_at && !program.active && <> · Archived {program.archived_at.slice(0, 10)}</>}
          </p>
        </div>
      </header>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statIcon} style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#047857' }}><CheckCircle2 size={18} /></span>
          <span className={styles.statBody}>
            <span className={styles.statLabel}>Completion</span>
            <span className={styles.statValue}>{completionPct}%</span>
            <span className={styles.statSub}>{program.completed_days}/{program.duration_days} days · {program.missed_days} missed</span>
          </span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statIcon} style={{ background: 'rgba(2, 132, 199, 0.12)', color: '#0369a1' }}><Dumbbell size={18} /></span>
          <span className={styles.statBody}>
            <span className={styles.statLabel}>Volume Lifted</span>
            <span className={styles.statValue}>{summary.total_volume_kg.toLocaleString()} kg</span>
            <span className={styles.statSub}>{summary.total_sets} sets · {summary.total_workouts} workouts</span>
          </span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statIcon} style={{ background: 'rgba(139, 92, 246, 0.12)', color: '#6d28d9' }}><Clock size={18} /></span>
          <span className={styles.statBody}>
            <span className={styles.statLabel}>Training Time</span>
            <span className={styles.statValue}>{trainingHours}h {trainingMins}m</span>
            <span className={styles.statSub}>Avg RPE {summary.avg_session_rpe ?? '--'}</span>
          </span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statIcon} style={{ background: weightDirectionGood ? 'rgba(16, 185, 129, 0.12)' : 'rgba(217, 119, 6, 0.12)', color: weightDirectionGood ? '#047857' : '#b45309' }}><Scale size={18} /></span>
          <span className={styles.statBody}>
            <span className={styles.statLabel}>Weight Change</span>
            <span className={styles.statValue}>
              {summary.weight_change_kg != null ? `${summary.weight_change_kg > 0 ? '+' : ''}${summary.weight_change_kg} kg` : '--'}
            </span>
            <span className={styles.statSub}>
              {summary.start_weight_kg != null && summary.current_weight_kg != null
                ? `${summary.start_weight_kg}kg → ${summary.current_weight_kg}kg`
                : 'No weigh-ins yet'}
            </span>
          </span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statIcon} style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#b91c1c' }}><HeartPulse size={18} /></span>
          <span className={styles.statBody}>
            <span className={styles.statLabel}>Cardio Logged</span>
            <span className={styles.statValue}>{summary.total_cardio_minutes} min</span>
            <span className={styles.statSub}>{summary.total_cardio_sessions} sessions</span>
          </span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statIcon} style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#b45309' }}><Flame size={18} /></span>
          <span className={styles.statBody}>
            <span className={styles.statLabel}>{program.active ? 'Current Day' : 'Reached Day'}</span>
            <span className={styles.statValue}>{program.current_day}/{program.duration_days}</span>
            <span className={styles.statSub}>{summary.best_session ? `Best: ${summary.best_session.title}` : 'No sessions logged yet'}</span>
          </span>
        </div>
      </div>

      <RightPathCard pacing={pacing} />

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}><Ruler size={18} />Body Composition Progress</h2>
        </div>
        <div className={styles.reportGrid}>
          <div className={styles.chartCard}>
            <MetricChart
              data={weightChartData}
              title="Weight Log During This Journey"
              unit="kg"
              type="line"
              color={meta.color}
              targetValue={program.target_weight_kg ?? undefined}
              targetLabel="Target"
              emptyMessage="No weigh-ins recorded during this journey."
            />
          </div>
          <aside className={styles.sidePanel}>
            <h3 className={styles.sidePanelTitle}>Body Measurements</h3>
            {measurementDeltas.length === 0 ? (
              <div className={styles.emptyNote}>No measurements logged during this journey.</div>
            ) : measurementDeltas.map((m) => (
              <div key={m.key} className={styles.deltaCard}>
                <span className={styles.deltaLabel}>{m.label}</span>
                <span
                  className={styles.deltaValue}
                  style={{ color: (m.delta!.delta) < 0 ? 'var(--color-primary)' : (m.delta!.delta) > 0 ? 'var(--color-amber)' : 'var(--text-secondary)' }}
                >
                  {m.delta!.start}cm &rarr; {m.delta!.current}cm ({m.delta!.delta > 0 ? '+' : ''}{m.delta!.delta})
                </span>
              </div>
            ))}
          </aside>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}><Trophy size={18} />Training Performance</h2>
        </div>
        <div className={styles.perfGrid}>
          <div className={styles.chartCard}>
            <MetricChart
              data={volumeChartData}
              title="Session Volume Trend"
              unit="kg"
              type="bar"
              color={meta.color}
              emptyMessage="No workouts logged during this journey."
            />
          </div>
          <aside className={styles.sidePanel}>
            <h3 className={styles.sidePanelTitle}>Muscle Group Focus</h3>
            {summary.muscle_breakdown.length === 0 ? (
              <div className={styles.emptyNote}>No completed sets logged yet.</div>
            ) : (
              <div className={styles.muscleList}>
                {summary.muscle_breakdown.map((m) => (
                  <div key={m.muscle} className={styles.muscleRow}>
                    <span className={styles.muscleName}>{m.muscle}</span>
                    <span className={styles.muscleBarTrack}>
                      <span className={styles.muscleBarFill} style={{ width: `${Math.round((m.sets / maxMuscleSets) * 100)}%`, background: meta.color }} />
                    </span>
                    <span className={styles.muscleCount}>{m.sets}</span>
                  </div>
                ))}
              </div>
            )}
          </aside>
        </div>

        <div>
          <h3 className={styles.sidePanelTitle}><Award size={13} className={styles.sidePanelTitleIcon} /> Personal Records Set This Journey</h3>
          {personal_records.length === 0 ? (
            <div className={styles.emptyNote}>No new personal records achieved yet during this journey.</div>
          ) : (
            <div className={styles.prGrid}>
              {personal_records.map((pr) => (
                <div key={pr.exercise} className={styles.prCard}>
                  <div className={styles.prTop}>
                    <div>
                      <div className={styles.prExercise}>{pr.exercise}</div>
                      {pr.primary_muscle && <div className={styles.prMuscle}>{pr.primary_muscle}</div>}
                    </div>
                    <Award size={18} color={meta.color} />
                  </div>
                  <div className={styles.pr1rm}>{pr.estimated_one_rep_max}kg <small className={styles.prUnit}>est. 1RM</small></div>
                  <div className={styles.prMeta}>{pr.max_weight_kg}kg &times; {pr.reps} · {pr.achieved_at}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {nutrition_summary && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}><Utensils size={18} />Nutrition Adherence</h2>
            <span className={styles.sectionMeta}>{nutrition_summary.days_logged} of {nutrition_summary.days_in_range} days logged</span>
          </div>
          <div className={styles.nutritionGrid}>
            <div className={styles.nutritionCard}>
              <div className={styles.nutritionTop}><span>Avg Daily Calories</span><span>Target {nutrition_summary.calories_target}</span></div>
              <div className={styles.nutritionValue}>{nutrition_summary.avg_calories} kcal</div>
              <div className={styles.progressBarTrackLocal}>
                <div className={styles.progressBarFillLocal} style={{ width: `${Math.min(100, Math.round((nutrition_summary.avg_calories / nutrition_summary.calories_target) * 100))}%`, background: meta.color }} />
              </div>
            </div>
            <div className={styles.nutritionCard}>
              <div className={styles.nutritionTop}><span>Avg Daily Protein</span><span>Target {nutrition_summary.protein_target_g}g</span></div>
              <div className={styles.nutritionValue}>{nutrition_summary.avg_protein_g} g</div>
              <div className={styles.progressBarTrackLocal}>
                <div className={styles.progressBarFillLocal} style={{ width: `${Math.min(100, Math.round((nutrition_summary.avg_protein_g / nutrition_summary.protein_target_g) * 100))}%`, background: meta.color }} />
              </div>
            </div>
          </div>
        </section>
      )}

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Day-by-Day Training Log</h2>
          <div className={styles.filterTabs}>
            {(['ALL', 'COMPLETED', 'MISSED', 'UPCOMING'] as DayFilter[]).map((f) => (
              <button
                key={f}
                type="button"
                className={`${styles.filterTab} ${dayFilter === f ? styles.filterTabActive : ''}`}
                onClick={() => setDayFilter(f)}
              >
                {f.charAt(0) + f.slice(1).toLowerCase()} ({dayCounts[f]})
              </button>
            ))}
          </div>
        </div>
        <div className={styles.dayList}>
          {filteredDays.map((day) => (
            <DayRow key={day.id} day={day} currentDay={program.current_day} />
          ))}
          {filteredDays.length === 0 && <div className={styles.emptyNote}>No days match this filter.</div>}
        </div>
      </section>

      {cardio_log.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}><HeartPulse size={18} />Cardio Log</h2>
            <div className={styles.cardioTotals}>
              {Object.entries(cardioTotalsByModality).map(([modality, minutes]) => (
                <span key={modality} className={styles.cardioTotalChip}>{modality}: {minutes} min</span>
              ))}
            </div>
          </div>
          <div className={styles.cardioList}>
            {cardio_log.map((c) => (
              <div key={c.id} className={styles.cardioRow}>
                <span>{c.date}</span>
                <span>{c.modality}</span>
                <span>{c.duration_minutes} min</span>
                <span>{c.intensity}{c.target_zone ? ` · ${c.target_zone}` : ''}</span>
                <span>{c.heart_rate ? `${c.heart_rate} bpm` : '--'}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
