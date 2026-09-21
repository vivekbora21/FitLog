'use client';
import { useEffect, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { api } from '@/lib/api';
import { JourneyMode } from '@/lib/types';
import { PlanSelectorModal } from '@/components/PlanSelectorModal';
import { Button } from '@/components/ui/Button';

function addDays(iso: string, days: number) {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}
function fmtDate(d: Date) {
  return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', timeZone: 'UTC' });
}
function weekRange(startDateIso: string, weekIndex: number, duration: number) {
  const dayStart = weekIndex * 7;
  const dayEnd = Math.min(dayStart + 6, duration - 1);
  return `${fmtDate(addDays(startDateIso, dayStart))} – ${fmtDate(addDays(startDateIso, dayEnd))}`;
}
function weekNote(weekIndex: number, totalWeeks: number, duration: number, mode: JourneyMode): [string, string] {
  const dayStart = weekIndex * 7 + 1;
  const dayEnd = Math.min(dayStart + 6, duration);
  const contains = (d: number) => d >= dayStart && d <= dayEnd;
  const quarterDay = Math.round(duration * 0.25);
  const halfDay = Math.round(duration * 0.5);
  const threeQuarterDay = Math.round(duration * 0.75);

  if (weekIndex === 0) {
    return [
      'Return-to-training week; focus on clean form and consistent logging.',
      'Maintain current plan. Lock in daily logging habit and baseline adherence.',
    ];
  }
  if (weekIndex === totalWeeks - 1) {
    return [
      `Final days; prepare Day ${duration} measurements and photos.`,
      'Awaiting final days daily entries and concluding assessment.',
    ];
  }
  if (contains(quarterDay)) {
    return [
      `Day ${quarterDay} photo checkpoint; calibrate early trajectory.`,
      `Awaiting Week ${weekIndex + 1} daily entries`,
    ];
  }
  if (contains(halfDay)) {
    return [
      `Day ${halfDay} halfway checkpoint; assess strength and fatigue.`,
      `Awaiting Week ${weekIndex + 1} daily entries`,
    ];
  }
  if (contains(threeQuarterDay)) {
    return [
      `Day ${threeQuarterDay} milestone checkpoint; progressive adaptation check.`,
      `Awaiting Week ${weekIndex + 1} daily entries`,
    ];
  }
  return [
    mode === 'BULK' ? 'Progressive overload check on compound anchors.' : 'Adherence and velocity check against corridor.',
    `Awaiting Week ${weekIndex + 1} daily entries`,
  ];
}

function getDecisionRules(mode: JourneyMode): Array<[string, string, string]> {
  if (mode === 'BULK') {
    return [
      ['Rule 1', 'Weight increasing 0.20–0.35 kg/wk and strength climbing', 'Maintain current caloric surplus and progressive overload rate.'],
      ['Rule 2', 'Weight stable or dropping over ~2 consecutive weeks', 'Increase calories slightly (+150–200 kcal/day) to sustain clean surplus.'],
      ['Rule 3', 'Weight climbing >0.5 kg/wk with excessive waist expansion', 'Trim surplus slightly (-100–150 kcal/day); prioritize clean hypertrophy.'],
      ['Rule 4', 'Strength progressing with low systemic fatigue', 'Optimal stimulation; change nothing and protect recovery.'],
      ['Rule 5', 'Strength consistently declining across sessions', 'Do not add training volume. Assess sleep, calories, recovery and joint fatigue.'],
    ];
  }
  if (mode === 'FOCUS' || mode === 'HABIT') {
    return [
      ['Rule 1', 'Weight stable (±0.2 kg/wk) and workout attendance consistent', 'Maintain current intake; neurological/habit consistency on track.'],
      ['Rule 2', 'Weight drifting beyond maintenance corridor', 'Adjust daily intake slightly (±100 kcal) to return to maintenance.'],
      ['Rule 3', 'Bar speed and compound anchors progressing', 'Overload stimulus functioning cleanly; maintain working set quality.'],
      ['Rule 4', 'Persistent joint fatigue or missed sessions', 'Deload volume by 40% for 1 week and protect 8h nightly sleep.'],
      ['Rule 5', 'Strength consistently declining across sessions', 'Rule 5 takes precedence: assess sleep, recovery, stress, and fatigue.'],
    ];
  }
  // Default CUT / RECOMP
  return [
    ['Rule 1', 'Weight is gradually decreasing and waist is decreasing', 'Maintain current plan.'],
    ['Rule 2', 'Weight stable but waist decreasing and strength maintained/increasing', 'Maintain current plan — successful recomposition; do not force calorie cuts.'],
    ['Rule 3', 'Weight and waist both unchanged for ~2 consecutive weeks', 'Consider a small adjustment of ~100–150 kcal/day OR a modest increase in activity.'],
    ['Rule 4', 'Weight dropping >0.8 kg/wk and strength/recovery worsening', 'Increase calories slightly (+100–150 kcal) and/or reduce cardio.'],
    ['Rule 5', 'Strength consistently declining across sessions', 'Do not increase training volume. Assess sleep, calories, recovery and fatigue.'],
  ];
}

export default function ReviewPage() {
  const [s, setS] = useState<any>(null);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);

  const loadData = () => {
    api.getDashboardStats().then(setS).catch(console.error);
  };

  useEffect(() => {
    loadData();
  }, []);

  const j = s?.journey || {};
  const nutrition = s?.nutrition || {};
  const pacing = s?.journey_pacing;
  const mode = (pacing?.mode || j.mode || 'CUT') as JourneyMode;
  const duration = pacing?.duration_days || j.program_length || 60;
  const currentDay = pacing?.current_day || j.program_day || 1;
  const totalWeeks = Math.ceil(duration / 7);

  const startWeight = pacing?.velocity?.start_weight ?? j.starting_weight;
  const startWaist = pacing?.starting_waist ?? j.starting_waist;
  const weeklyWorkoutsTarget = s?.weekly_workouts_target || j.weekly_workouts_target || 5;

  const hasProgram = pacing?.has_program && pacing?.start_date;
  const currentWeekIndex = Math.min(totalWeeks - 1, Math.floor(Math.max(0, currentDay - 1) / 7));

  const weeks = hasProgram
    ? Array.from({ length: totalWeeks }, (_, i) => {
        const [note, action] = weekNote(i, totalWeeks, duration, mode);
        return [`Week ${i + 1}`, weekRange(pacing.start_date!, i, duration), note, action] as const;
      })
    : [];

  const pacingLabel = pacing?.pacing_status ? pacing.pacing_status.replace(/_/g, ' ') : 'Awaiting enough data';
  const insightText = pacing?.copilot_insight || 'Log daily weight, waist, training, nutrition and cardio. FitLog never changes calories or workouts automatically — all recommendations are advisory.';
  const decisionRules = getDecisionRules(mode);

  return (
    <div style={{ display: 'grid', gap: '1.25rem' }}>
      <header>
        <div style={{ fontSize: '.72rem', fontWeight: 800, letterSpacing: '.1em', color: 'var(--color-primary)' }}>
          AUTOMATED {duration}-DAY WEEKLY REVIEW &amp; ADAPTIVE DECISION PROTOCOL
        </div>
        <h1 style={{ margin: '.3rem 0' }}>Review the trend, then decide.</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Baseline: {startWeight != null ? `${startWeight} kg` : '—'} • {startWaist != null ? `${startWaist} cm waist` : '—'} &nbsp;|&nbsp; Nutrition: ~{nutrition.calories_target ?? '—'} kcal • {nutrition.protein_target ?? '—'}g protein anchor &nbsp;|&nbsp; Training: {weeklyWorkoutsTarget} days core &nbsp;|&nbsp; Cardio: {j.cardio_target ?? '—'} min target. Advisory only — no automatic calorie or training changes.
        </p>
      </header>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: '.6rem' }}>
        {[
          ['7-day avg', j.seven_day_average ? `${j.seven_day_average} kg` : '—'],
          ['Weekly weight change', j.weekly_weight_change == null ? '—' : `${j.weekly_weight_change} kg`],
          ['Current waist', j.current_waist ? `${j.current_waist} cm` : '—'],
          ['Cardio', `${j.cardio_minutes || 0} / ${j.cardio_target || 120} min`],
          ['Workouts', `${s?.workouts_this_week || 0} / ${weeklyWorkoutsTarget}`],
        ].map(([l, v]) => (
          <div key={l} style={{ padding: '1rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
            <small style={{ color: 'var(--text-secondary)' }}>{l}</small>
            <strong style={{ display: 'block', fontSize: '1.25rem', marginTop: '.3rem' }}>{v}</strong>
          </div>
        ))}
      </section>

      <section style={{ padding: '1.25rem', background: 'var(--bg-surface)', borderLeft: '4px solid var(--color-primary)', borderRadius: '0 var(--radius-md) var(--radius-md) 0' }}>
        <small style={{ fontWeight: 800, color: 'var(--color-primary)' }}>{pacingLabel.toUpperCase()}</small>
        <h2 style={{ margin: '.5rem 0' }}>{insightText}</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '.85rem' }}>
          Use two consecutive weeks before considering a calorie or activity adjustment. If strength declines across sessions, Rule 5 takes precedence: assess sleep, recovery and fatigue.
        </p>
      </section>

      <section>
        <h2 style={{ fontSize: '1rem' }}>Decision matrix (Rules 1–5) — {pacing?.mode_label || 'Current Mode'}</h2>
        <div style={{ display: 'grid', gap: '.45rem', marginTop: '.6rem' }}>
          {decisionRules.map((r) => (
            <div key={r[0]} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr', gap: '.5rem', padding: '.7rem', borderTop: '1px solid var(--border-subtle)', fontSize: '.85rem' }}>
              <strong>{r[0]}</strong>
              <span>{r[1]}</span>
              <span style={{ color: 'var(--text-secondary)' }}>{r[2]}</span>
            </div>
          ))}
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '.78rem', marginTop: '.6rem' }}>
          All recommendations are advisory guidance — no automatic or irreversible calorie/workout changes are ever made. Consult weekly averages, tape measurements and energy levels before making manual adjustments.
        </p>
      </section>

      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.6rem' }}>
          <h2 style={{ fontSize: '1rem', margin: 0 }}>Program timeline</h2>
          {hasProgram && (
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Day {currentDay} of {duration} (Week {currentWeekIndex + 1})
            </span>
          )}
        </div>

        {!hasProgram ? (
          <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
            <p style={{ color: 'var(--text-secondary)', margin: '0 0 1rem 0' }}>
              No active program timeline detected. Select or assign a journey plan to see your personalized weekly schedule.
            </p>
            <Button variant="primary" onClick={() => setIsPlanModalOpen(true)}>
              <SlidersHorizontal size={15} style={{ marginRight: '6px' }} />
              Select a Plan
            </Button>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 0, border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            {weeks.map(([w, range, note, action], idx) => {
              const isCurrentWeek = idx === currentWeekIndex;
              return (
                <div
                  key={w}
                  style={{
                    padding: '.7rem .85rem',
                    borderTop: idx > 0 ? '1px solid var(--border-subtle)' : 'none',
                    display: 'grid',
                    gridTemplateColumns: '110px 130px 1.4fr 1.4fr',
                    gap: '.75rem',
                    fontSize: '.83rem',
                    alignItems: 'baseline',
                    background: isCurrentWeek ? 'rgba(16, 185, 129, 0.05)' : undefined,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <strong>{w}</strong>
                    {isCurrentWeek && (
                      <span style={{ fontSize: '0.65rem', background: 'var(--color-primary)', color: '#FFFFFF', padding: '1px 5px', borderRadius: 4, fontWeight: 700 }}>
                        Current
                      </span>
                    )}
                  </div>
                  <span style={{ color: 'var(--text-muted)' }}>{range}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{note}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{action}</span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <PlanSelectorModal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        onSuccess={() => loadData()}
      />
    </div>
  );
}
