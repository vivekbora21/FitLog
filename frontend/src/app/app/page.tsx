'use client';

import type { CSSProperties } from 'react';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Droplets,
  Dumbbell,
  Ruler,
  Scale,
  SlidersHorizontal,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
} from 'lucide-react';
import { api } from '@/lib/api';
import { JourneyPacingData, DashboardAdherence } from '@/lib/types';
import { DashboardCharts, DashboardTrends } from '@/components/DashboardCharts';
import { Card } from '@/components/ui/Card';
import { RightPathCard } from '@/components/RightPathCard';
import { PlanSelectorModal } from '@/components/PlanSelectorModal';
import styles from './page.module.css';

type DashboardStats = {
  workouts_this_week?: number;
  workouts_this_month?: number;
  weekly_workouts_target?: number;
  total_volume_kg_week?: number;
  nutrition?: Record<string, number>;
  recent_prs?: Array<{ exercise: string; max_weight_kg: number; reps: number; estimated_1rm: number }>;
  journey?: Record<string, any>;
  journey_pacing?: JourneyPacingData;
  adherence?: DashboardAdherence;
  daily_log?: {
    steps?: number;
    sleep_hours?: number;
    sleep_quality?: number | null;
    energy_level?: number | null;
    recovery_notes?: string;
  };
  weekly_review?: any[];
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

type MetricTone = 'neutral' | 'up' | 'down' | 'warn';

const TONE_CLASS: Record<MetricTone, { tone: string; TrendIcon: typeof TrendingUp | null }> = {
  neutral: { tone: styles.toneNeutral, TrendIcon: null },
  up: { tone: styles.toneUp, TrendIcon: TrendingUp },
  down: { tone: styles.toneDown, TrendIcon: TrendingDown },
  warn: { tone: styles.toneWarn, TrendIcon: TrendingUp },
};

function MetricTile({
  icon: Icon,
  label,
  value,
  note,
  tone = 'neutral',
}: {
  icon: typeof Scale;
  label: string;
  value: string;
  note?: string;
  tone?: MetricTone;
}) {
  const { tone: toneClass, TrendIcon } = TONE_CLASS[tone];
  return (
    <Card hoverable className={styles.tile}>
      <div className={`${styles.tileIcon} ${toneClass}`}>
        <Icon size={19} />
      </div>
      <div className={styles.tileBody}>
        <div className={styles.tileLabel}>{label}</div>
        <div className={`${styles.tileValue} ${toneClass}`}>
          {TrendIcon && <TrendIcon size={15} />}
          {value}
        </div>
        {note && <div className={styles.tileNote}>{note}</div>}
      </div>
    </Card>
  );
}

function SkeletonBlock({ width, height, style }: { width?: string | number; height?: string | number; style?: CSSProperties }) {
  return <div className="skeleton" style={{ width: width ?? '100%', height: height ?? 14, ...style }} />;
}

function DashboardSkeleton() {
  return (
    <div className={styles.page}>
      <section className={styles.headerRow}>
        <div className={styles.skeletonHeaderCol}>
          <SkeletonBlock width={150} height={12} />
          <SkeletonBlock width={220} height={30} />
          <SkeletonBlock width={280} height={14} />
        </div>
        <div className={styles.headerActions}>
          <SkeletonBlock width={110} height={40} />
          <SkeletonBlock width={130} height={40} />
        </div>
      </section>

      <section className={styles.metricGrid}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className={styles.skeletonMetricTile}>
            <SkeletonBlock width={38} height={38} style={{ borderRadius: 10, flexShrink: 0 }} />
            <div className={styles.skeletonMetricBody}>
              <SkeletonBlock width="60%" height={10} />
              <SkeletonBlock width="45%" height={22} />
              <SkeletonBlock width="70%" height={10} />
            </div>
          </Card>
        ))}
      </section>

      <section>
        <Card className={styles.cardPad}>
          <SkeletonBlock height={260} />
        </Card>
      </section>

      <section className={styles.twoColSection}>
        <Card className={styles.cardPad}>
          <div className={styles.todayHeaderRow}>
            <div className={styles.skeletonHeaderCol}>
              <SkeletonBlock width={60} height={10} />
              <SkeletonBlock width={180} height={22} />
              <SkeletonBlock width={220} height={12} />
            </div>
            <SkeletonBlock width={100} height={36} />
          </div>
          <div className={styles.skeletonRowsCard}>
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonBlock key={i} height={58} />
            ))}
          </div>
        </Card>

        <Card className={styles.skeletonSideCard}>
          <div className={styles.skeletonHeaderCol}>
            <SkeletonBlock width={110} height={10} />
            <SkeletonBlock width={90} height={20} />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={styles.skeletonProgressItem}>
              <div className={styles.skeletonProgressRow}>
                <SkeletonBlock width={70} height={12} />
                <SkeletonBlock width={90} height={12} />
              </div>
              <SkeletonBlock height={8} />
            </div>
          ))}
        </Card>
      </section>

      <section className={styles.threeColSection}>
        <Card className={styles.cardPad}>
          <SkeletonBlock width={260} height={20} style={{ marginBottom: '0.9rem' }} />
          <div className={styles.skeletonAnchorGrid}>
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className={styles.skeletonAnchorCard}>
                <SkeletonBlock width="70%" height={14} />
                <SkeletonBlock width="55%" height={20} />
                <SkeletonBlock width="90%" height={12} />
              </Card>
            ))}
          </div>
        </Card>

        <Card className={styles.skeletonNextCard}>
          <SkeletonBlock width={60} height={18} />
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonBlock key={i} height={16} width="85%" />
          ))}
          <div className={styles.skeletonNextFooter}>
            <SkeletonBlock width={140} height={14} />
          </div>
        </Card>
      </section>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  message,
  actionHref,
  actionLabel,
}: {
  icon: typeof Scale;
  title: string;
  message: string;
  actionHref: string;
  actionLabel: string;
}) {
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyStateIcon}>
        <Icon size={22} />
      </div>
      <div className={styles.emptyStateTitle}>{title}</div>
      <p className={styles.emptyStateMessage}>{message}</p>
      <Link href={actionHref} className={styles.emptyStateAction}>
        {actionLabel} <ArrowRight size={14} />
      </Link>
    </div>
  );
}

function ProgressRing({
  percent,
  size = 48,
  strokeWidth = 4,
  color = 'var(--color-primary)',
  children,
}: {
  percent: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  children?: React.ReactNode;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, percent));
  const offset = circumference - (clamped / 100) * circumference;
  return (
    <div className={styles.ring} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--border-subtle)" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className={styles.ringContent}>{children}</div>
    </div>
  );
}

function ProgressLine({
  label,
  actual,
  target,
  suffix = '',
  percent,
  note,
}: {
  label: string;
  actual: number;
  target: number;
  suffix?: string;
  percent?: number;
  note?: string;
}) {
  const displayPercent = typeof percent === 'number'
    ? Math.min(100, Math.max(0, Math.round(percent)))
    : pct(actual, target);
  const isGood = displayPercent >= 85;

  return (
    <div className={styles.progressItem}>
      <div className={styles.progressRow}>
        <span className={styles.progressLabel}>{label}</span>
        <div className={styles.progressValueWrap}>
          <span className={styles.progressValue}>
            {actual}{suffix} / {target}{suffix}
          </span>
          <span className={`${styles.progressPercent} ${isGood ? styles.progressPercentGood : styles.progressPercentWarn}`}>
            ({displayPercent}%)
          </span>
        </div>
      </div>
      <div className={styles.progressTrack}>
        <div
          className={`${styles.progressFill} ${isGood ? styles.progressFillGood : styles.progressFillWarn}`}
          style={{ width: `${displayPercent}%` }}
        />
      </div>
      {note && <div className={styles.progressNote}>{note}</div>}
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [today, setToday] = useState<TodayPayload | null>(null);
  const [pacingData, setPacingData] = useState<JourneyPacingData | null>(null);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [dashboard, current, pacing] = await Promise.all([
        api.getDashboardStats(),
        api.getTodaysWorkout(),
        api.getJourneyPacingStatus(),
      ]);
      setStats(dashboard);
      setToday(current);
      setPacingData(pacing);
      if (pacing && !pacing.has_program) {
        setIsPlanModalOpen(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const journey = stats?.journey || {};
  const nutrition = stats?.nutrition || {};
  const routine = today?.today?.routine_details;
  const anchorLifts = useMemo(() => (stats?.recent_prs || []).slice(0, 5), [stats]);
  const programDay = Number(pacingData?.current_day || journey.program_day || today?.program?.current_day || 1);
  const programLength = Number(pacingData?.duration_days || journey.program_length || today?.program?.duration_days || 60);
  const programPct = Number(pacingData ? Math.round(((programDay - 1) / Math.max(programLength, 1)) * 100) : (journey.program_completion_percent || pct(programDay - 1, programLength)));

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className={styles.page}>
      <section className={styles.headerRow}>
        <div>
          <div className={styles.eyebrow}>
            {pacingData?.mode_label || (journey as any)?.mode_label || 'FitLog'} · {programLength}-Day Journey
          </div>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.subtitle}>Plan, train, log, measure, review, progress.</p>
        </div>
        <div className={styles.headerActions}>
          <button
            type="button"
            onClick={() => setIsPlanModalOpen(true)}
            className={styles.actionSecondary}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}
          >
            <SlidersHorizontal size={15} /> Plan &amp; Mode
          </button>
          <Link href="/app/daily" className={styles.actionSecondary}>Log Daily</Link>
          <Link href="/app/workouts/active" className={styles.actionPrimary}>Start Today <ArrowRight size={15} /></Link>
        </div>
      </section>

      {/* Mission Control Right Path Card */}
      <section>
        <RightPathCard
          pacing={pacingData || (stats?.journey_pacing as any) || null}
          onOpenPlanSelector={() => setIsPlanModalOpen(true)}
        />
      </section>

      <section className={styles.metricGrid}>
        <MetricTile icon={Scale} label="Current weight" value={fmt(journey.current_weight, ' kg')} note={`Start ${fmt(journey.starting_weight, ' kg')}`} tone="neutral" />
        <MetricTile icon={TrendingDown} label="Weight change" value={fmt(journey.weight_change, ' kg')} note={`7-day avg ${fmt(journey.seven_day_average, ' kg')}`} tone={Number(journey.weight_change || 0) <= 0 ? 'down' : 'warn'} />
        <MetricTile icon={Activity} label="Weekly change" value={fmt(journey.weekly_weight_change, ' kg')} note="Rolling average basis" tone={Number(journey.weekly_weight_change || 0) <= 0 ? 'down' : 'warn'} />
        <MetricTile icon={Ruler} label="Current waist" value={fmt(journey.current_waist, ' cm')} note={`Change ${fmt(journey.waist_change, ' cm')}`} tone="down" />
        <MetricTile icon={Target} label="Program progress" value={`${programPct}%`} note={`Day ${programDay} of ${programLength}`} tone="up" />
      </section>

      <section>
        <DashboardCharts
          trends={stats?.trends}
          targetWeight={pacingData?.target_weight || pacingData?.velocity?.expected_final_weight || journey.target_weight || 74.0}
          dailyCaloriesTarget={Number(nutrition.calories_target || 2160)}
          programDuration={programLength}
          modeLabel={pacingData?.mode_label || journey.mode_label || 'Goal'}
        />
      </section>

      <section className={styles.twoColSection}>
        <Card className={styles.cardPad}>
          <div className={styles.todayHeaderRow}>
            <div>
              <div className={styles.panelEyebrow}>Today</div>
              <h2 className={styles.panelHeading}>{routine?.name || today?.today?.label || 'No active workout'}</h2>
              <p className={styles.todayLabel}>Program Day {today?.today?.day_number || programDay} · {today?.today?.status || 'UPCOMING'}</p>
            </div>
            <Link href="/app/workouts/plan" className={styles.viewPlanLink}>View Plan</Link>
          </div>

          <div className={styles.exerciseList}>
            {(routine?.exercises || []).slice(0, 7).map((exercise, index) => {
              const rpe = exercise.target_rpe || 8;
              const rpePct = Math.round((rpe / 10) * 100);
              const ringColor = rpe >= 9 ? 'var(--color-amber)' : 'var(--color-primary)';
              return (
                <div key={exercise.id} className={styles.exerciseCard}>
                  <div className={styles.exerciseRank}>{index + 1}</div>
                  <div className={styles.exerciseRingCol}>
                    <ProgressRing percent={rpePct} size={44} strokeWidth={4} color={ringColor}>
                      <span className={styles.ringValue}>{rpe}</span>
                    </ProgressRing>
                    <span className={styles.ringCaption}>RPE</span>
                  </div>
                  <div className={styles.exerciseInfo}>
                    <div className={styles.exerciseName}>{exercise.exercise_name}</div>
                    <div className={styles.exerciseMeta}>{exercise.target_sets} sets &times; {exercise.target_reps} reps</div>
                  </div>
                  <div className={styles.exerciseLoad}>
                    <div className={styles.exerciseLoadValue}>{exercise.suggested_weight_kg ? `${exercise.suggested_weight_kg} kg` : '--'}</div>
                    <div className={styles.exerciseLoadLabel}>Suggested</div>
                  </div>
                </div>
              );
            })}
            {!routine?.exercises?.length && (
              <EmptyState
                icon={CalendarDays}
                title="No program assigned yet"
                message="Start or select a journey program to see today's workout here."
                actionHref="/app/workouts/plan"
                actionLabel="View Plan"
              />
            )}
          </div>
        </Card>

        <Card className={styles.adherenceCard}>
          <div>
            <div className={styles.panelEyebrow}>Consistency &amp; Nutrition</div>
            <h2 className={styles.panelHeading}>Adherence Targets</h2>
          </div>

          <div className={styles.adherenceSubheader}>Today&apos;s Nutrition</div>
          <ProgressLine
            label="Calories"
            actual={Number(nutrition.calories_consumed || 0)}
            target={Number(nutrition.calories_target || 1)}
            percent={stats?.adherence?.calories?.percent}
          />
          <ProgressLine
            label="Protein"
            actual={Number(nutrition.protein_consumed || 0)}
            target={Number(nutrition.protein_target || 1)}
            suffix="g"
            percent={stats?.adherence?.protein?.percent}
          />
          <ProgressLine
            label="Water"
            actual={stats?.adherence?.water?.actual_cups ?? Math.round(Number(nutrition.water_consumed_ml || 0) / 250)}
            target={stats?.adherence?.water?.target_cups ?? Math.round(Number(nutrition.water_target_ml || 3000) / 250)}
            suffix=" cups"
            percent={stats?.adherence?.water?.percent}
          />

          <div className={styles.adherenceDivider} />
          <div className={styles.adherenceSubheader}>Journey &amp; Cardio Consistency</div>

          {pacingData?.has_program && (pacingData?.adherence || stats?.adherence?.workout) ? (
            <ProgressLine
              label="Workout Adherence"
              actual={pacingData?.adherence?.completed_sessions ?? stats?.adherence?.workout?.actual ?? 0}
              target={pacingData?.adherence?.scheduled_sessions ?? stats?.adherence?.workout?.target ?? 1}
              suffix=" sessions"
              percent={pacingData?.adherence?.adherence_pct ?? stats?.adherence?.workout?.percent}
              note={`Program pace · ${stats?.workouts_this_week || 0} of ${stats?.weekly_workouts_target || 5} logged this week`}
            />
          ) : (
            <ProgressLine
              label="Weekly Workouts"
              actual={Number(stats?.workouts_this_week || 0)}
              target={Number(stats?.weekly_workouts_target || 5)}
              suffix=" sessions"
              percent={stats?.adherence?.weekly_workouts?.percent}
              note="Weekly target frequency"
            />
          )}

          <ProgressLine
            label="Cardio (Weekly)"
            actual={Number(journey.cardio_minutes || 0)}
            target={Number(journey.cardio_target || 120)}
            suffix=" min"
            percent={stats?.adherence?.cardio?.percent}
            note="Rolling 7-day aerobic volume"
          />

          <div className={styles.adherenceDivider} />
          <div className={styles.adherenceSubheader}>Daily Lifestyle &amp; Recovery</div>

          <ProgressLine
            label="Daily Steps"
            actual={Number(stats?.daily_log?.steps || stats?.adherence?.steps?.actual || 0)}
            target={Number(stats?.adherence?.steps?.target || 10000)}
            suffix=" steps"
            percent={stats?.adherence?.steps?.percent}
            note="Pillar 9 NEAT standard (8,000–10,000)"
          />

          <ProgressLine
            label="Nightly Sleep"
            actual={Number(stats?.daily_log?.sleep_hours || stats?.adherence?.sleep?.actual || 0)}
            target={Number(stats?.adherence?.sleep?.target || 8.0)}
            suffix=" hrs"
            percent={stats?.adherence?.sleep?.percent}
            note="Pillar 7 recovery standard (7.5–8.5 hrs)"
          />
        </Card>

      </section>

      <section className={styles.threeColSection}>
        <Card className={styles.cardPad}>
          <div className={styles.sectionTitleRow}>
            <Trophy size={18} color="var(--color-primary)" />
            <h2>Key Compound Strength Progression Tracker</h2>
          </div>
          <div className={styles.anchorGrid}>
            {anchorLifts.map((lift) => {
              const intensityPct = lift.estimated_1rm ? Math.round((lift.max_weight_kg / lift.estimated_1rm) * 100) : 0;
              return (
                <Card key={lift.exercise} hoverable className={styles.anchorCard}>
                  <div className={styles.anchorCardHeader}>
                    <div className={styles.anchorName}>{lift.exercise}</div>
                    <TrendingUp size={15} color="var(--color-primary)" />
                  </div>
                  <div className={styles.anchorBody}>
                    <ProgressRing percent={intensityPct} size={54} strokeWidth={5}>
                      <span className={styles.anchorRingValue}>{intensityPct}%</span>
                    </ProgressRing>
                    <div>
                      <div className={styles.anchorValue}>{lift.max_weight_kg} kg &times; {lift.reps}</div>
                      <div className={styles.anchorNote}>Est. 1RM {Math.round(lift.estimated_1rm)} kg</div>
                    </div>
                  </div>
                </Card>
              );
            })}
            {!anchorLifts.length && (
              <EmptyState
                icon={Dumbbell}
                title="No lifts logged yet"
                message="Complete a workout to start building your strength progression."
                actionHref="/app/workouts/active"
                actionLabel="Start Today"
              />
            )}
          </div>
        </Card>

        <Card className={styles.nextCard}>
          <h2>Next</h2>
          <div className={styles.nextItem}><CheckCircle2 size={18} color="var(--color-primary)" /> Finish today&apos;s prescribed sets.</div>
          <div className={styles.nextItem}><Scale size={18} color="#0EA5E9" /> Log morning weight in Daily Log.</div>
          <div className={styles.nextItem}><Droplets size={18} color="#0EA5E9" /> Hit hydration before late evening.</div>
          <div className={styles.nextItem}><Activity size={18} color="#D97706" /> Review weekly trend before adjusting.</div>
          <div className={styles.nextFooter}>
            Weekly volume: <strong className={styles.nextFooterValue}>{fmt(stats?.total_volume_kg_week, ' kg')}</strong>
          </div>
        </Card>
      </section>

      <PlanSelectorModal
        isOpen={isPlanModalOpen}
        dismissible={Boolean(pacingData?.has_program)}
        onClose={() => {
          if (pacingData?.has_program) {
            setIsPlanModalOpen(false);
          }
        }}
        onSuccess={() => {
          loadData();
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('fitlog:journey-updated'));
          }
        }}
        initialWeight={pacingData?.velocity?.rolling_7_avg || Number(journey.current_weight) || pacingData?.velocity?.start_weight || 75.0}
      />
    </div>
  );
}
