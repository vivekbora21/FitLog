'use client';

import { useEffect, useMemo, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { api } from '@/lib/api';
import { getModeMeta } from '@/lib/journeyModes';
import { JourneyMode } from '@/lib/types';
import { PlanSelectorModal } from '@/components/PlanSelectorModal';
import styles from './guidelines.module.css';

type Program = {
  mode?: JourneyMode;
  mode_label?: string;
  duration_days: number;
  target_cardio_minutes_early?: number;
  target_cardio_minutes_later?: number;
  focus_exercise?: { name: string };
  target_focus_1rm?: number;
} | null;

function buildGuides(
  duration: number,
  cardioEarly: number,
  cardioLater: number,
  mode: JourneyMode,
  waterMl: number,
  proteinG: number,
  caloriesKcal: number
) {
  const photoDays = Array.from(
    new Set([1, Math.round(duration * 0.25), Math.round(duration * 0.5), Math.round(duration * 0.75), duration])
  ).sort((a, b) => a - b);
  const photoInterval = Math.max(7, Math.round(duration / (photoDays.length - 1)));

  const waterL = (waterMl / 1000).toFixed(1);
  const waterUpperL = ((waterMl + 500) / 1000).toFixed(1);

  const stepProtocol = mode === 'BULK'
    ? ['6,000–8,000 Steps Daily', 'Maintain baseline cardiovascular health and digestive motility without creating excessive caloric expenditure that opposes your muscle-building surplus.', 'Preserves surplus calories for muscle tissue accrual while sustaining insulin sensitivity.']
    : mode === 'FOCUS' || mode === 'HABIT'
    ? ['7,000–9,000 Steps Daily', 'Accumulate steady daily baseline activity via post-meal walks and stairs to improve systemic recovery and movement quality.', 'Maintains metabolic health without accumulating systemic fatigue.']
    : ['8,000–10,000 Steps Daily', 'Accumulate daily steps via post-meal walks, stairs, and regular standing breaks during desk hours. Log the daily step count in the Daily Log.', 'Burns non-fatiguing baseline energy without spiking appetite or interfering with gym recovery.'];

  const rirProtocol = mode === 'HABIT'
    ? ['RPE 6–7 (2–3 Reps in Reserve)', 'Prioritize showing up and building flawless movement patterns. Stop well short of muscular failure to minimize soreness and lock in training consistency.', 'Prevents excessive delayed-onset muscle soreness so workout frequency remains frictionless.']
    : ['RPE 8–9 (1–2 Reps in Reserve)', 'Finish compound sets with 1–2 clean reps in reserve. Avoid muscular failure on heavy spinal lifts (squat, deadlift). End the set immediately if form breaks down.', 'Maximizes muscle stimulation while minimizing excessive fatigue that compromises recovery.'];

  const overloadProtocol = mode === 'FOCUS'
    ? ['Compound Anchor Specialization', 'Prioritize technical bar speed and perfect setup on your target compound lifts. Add load only when bar path is crisp and all prescribed reps are clean.', 'Builds high-threshold motor unit recruitment and neurological coordination.']
    : ['Double Progression Logic', 'When all prescribed sets hit the top rep target with clean form, increase weight by 1.25–2.5 kg. If reps are not achieved, hold the weight and build reps. Never force weight.', 'Provides the mechanical-tension stimulus the body needs to build or preserve muscle.'];

  return [
    ['1. Morning Weigh-In Consistency', 'Daily Fasted Weigh-In', 'Step on the scale every morning after the bathroom, before food or water. Enter it in the Daily Log. Prioritize the 7-day average rather than reacting to daily fluctuations.', 'Filters out normal sodium and water shifts to reveal the true biological trend.'],
    ['2. Weekly Waist Measurement', 'Sunday Fasted Tape Check', 'Measure once per week at the navel on a relaxed breath. Keep the tape level and avoid pulling it tight. Log it in the Progress Tracker.', 'Provides evidence of body composition change that scale weight alone cannot show.'],
    [`3. Progress Photos Every ~${photoInterval} Days`, `Days ${photoDays.join(', ')}`, 'Take front, side, and back photos under consistent lighting and a relaxed posture. Store links in the Progress Tracker photo section.', 'Visual evidence of change that scale weight alone cannot show.'],
    ['4. Progressive Overload Framework', overloadProtocol[0], overloadProtocol[1], overloadProtocol[2]],
    ['5. RIR / RPE Set Intensity', rirProtocol[0], rirProtocol[1], rirProtocol[2]],
    ['6. Rest Periods Between Sets', '2–3m Compounds • 60–90s Isolations', 'Rest 2–3 minutes on heavy compound lifts (bench, deadlift, leg press) and 60–90 seconds on isolation and core movements.', 'Allows full muscular and neurological recovery so each working set stays high quality.'],
    ['7. Sleep & Physical Recovery', '7.5–8.5 Hours Nightly', 'Aim for 7.5–8.5 hours in a cool, dark room. Maintain a consistent bedtime routine. If unusually exhausted, prioritize extra sleep over pushing volume.', 'The foundational window for muscle repair, hormonal balance, appetite regulation, and energy.'],
    ['8. Hydration & Daily Fluids', `${waterL}–${waterUpperL} Litres Water Daily`, `Drink 500ml upon waking, sip steadily during workouts, and keep a water bottle nearby to reach your personalized ${waterMl.toLocaleString()}ml daily target.`, 'Supports cellular hydration, muscular stamina, nutrient transport, and efficient digestion.'],
    ['9. Nutrition & Protein Anchor', `~${proteinG}g Protein • ~${caloriesKcal.toLocaleString()} kcal`, `Anchor every main meal with 25–40g of high-quality complete protein (eggs, chicken, soy, curd, paneer) to protect or build muscle while honoring your calorie goal.`, 'Ensures adequate leucine threshold triggering muscle protein synthesis.'],
    ['10. Daily Steps & NEAT Activity', stepProtocol[0], stepProtocol[1], stepProtocol[2]],
    ['11. Cardio Progression Protocol', `${cardioEarly}min/wk (early) → ${cardioLater}min/wk (later)`, `Start at roughly ${cardioEarly} min/week of Zone 2 cardio (incline treadmill, bike, cross trainer). Gradually build toward ${cardioLater} min/week only if recovery and energy remain high.`, 'Builds aerobic base and recovery capacity without compromising strength or training recovery.'],
    ['12. Deload & Fatigue Management', 'Proactive Recovery Management', 'If strength drops across 2+ workouts or joints feel beat up: hold weights, halve volume, and assess calories/sleep. Do not force volume when recovery is poor.', 'Prevents overtraining and systemic burnout, resetting the body for sustainable progress.'],
  ] as const;
}

export default function GuidelinesPage() {
  const [program, setProgram] = useState<Program>(null);
  const [nutritionTarget, setNutritionTarget] = useState<{ water_ml: number; protein_g: number; daily_calories: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    Promise.all([
      api.getWorkoutPlan().catch(() => null),
      api.getNutrition('today').catch(() => null),
    ])
      .then(([planRes, nutRes]) => {
        if (planRes?.program) setProgram(planRes.program);
        if (nutRes?.targets) {
          setNutritionTarget({
            water_ml: nutRes.targets.water_ml || 3500,
            protein_g: nutRes.targets.protein_g || 150,
            daily_calories: nutRes.targets.daily_calories || 2160,
          });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const mode = (program?.mode || 'CUT') as JourneyMode;
  const meta = getModeMeta(mode);
  const duration = program?.duration_days || 60;
  const cardioEarly = program?.target_cardio_minutes_early ?? meta.defaultCardioEarly;
  const cardioLater = program?.target_cardio_minutes_later ?? meta.defaultCardioLater;
  const waterMl = nutritionTarget?.water_ml || 3500;
  const proteinG = nutritionTarget?.protein_g || 150;
  const caloriesKcal = nutritionTarget?.daily_calories || 2160;

  const guides = useMemo(
    () => buildGuides(duration, cardioEarly, cardioLater, mode, waterMl, proteinG, caloriesKcal),
    [duration, cardioEarly, cardioLater, mode, waterMl, proteinG, caloriesKcal]
  );

  if (loading) return <p style={{ color: 'var(--text-secondary)' }}>Loading guidelines...</p>;

  return (
    <div className={styles.page}>
      <header>
        <div className={styles.eyebrow} style={{ color: meta.color }}>
          {program ? `${duration}-DAY ${(program.mode_label || meta.label).toUpperCase()} EXECUTION GUIDELINES` : 'EXECUTION GUIDELINES'}
        </div>
        <h1 className={styles.title}>Core principles for training, nutrition, and recovery.</h1>
        {!program && (
          <div className={styles.emptyState} style={{ marginTop: '0.75rem' }}>
            <p style={{ margin: 0 }}>Start a plan to personalize cardio targets and photo cadence to your mode and duration.</p>
            <button type="button" className={styles.startBtn} onClick={() => setIsModalOpen(true)}>
              <SlidersHorizontal size={15} /> Select a Plan
            </button>
          </div>
        )}
      </header>

      <div className={styles.grid}>
        {guides.map(([pillar, protocol, instructions, why]) => (
          <details key={pillar} className={styles.item}>
            <summary className={styles.summary}>
              {pillar}
              <span className={styles.protocol}>{protocol}</span>
            </summary>
            <p className={styles.instructions}>{instructions}</p>
            <p className={styles.why}><strong className={styles.whyLabel}>Why: </strong>{why}</p>
          </details>
        ))}
      </div>

      <PlanSelectorModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={() => window.location.reload()} />
    </div>
  );
}
