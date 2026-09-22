'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import styles from './daily.module.css';

export default function DailyLogPage() {
  const router = useRouter();
  const [nutrition, setNutrition] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);

  // Form State
  const [steps, setSteps] = useState('');
  const [sleepHours, setSleepHours] = useState('');
  const [sleepQuality, setSleepQuality] = useState<number | null>(null);
  const [energyLevel, setEnergyLevel] = useState<number | null>(null);
  const [recoveryNotes, setRecoveryNotes] = useState('');
  const [water, setWater] = useState('');
  const [cardioMinutes, setCardioMinutes] = useState('');
  const [cardioModality, setCardioModality] = useState('TREADMILL');

  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  const todayStr = new Date().toISOString().slice(0, 10);

  const loadData = async () => {
    try {
      const [n, s, dl] = await Promise.all([
        api.getNutrition(),
        api.getDashboardStats(),
        api.getDailyLogForDate(todayStr),
      ]);
      setNutrition(n);
      setStats(s);
      setWater(String(n?.day?.water_consumed_ml || ''));

      if (dl) {
        if (dl.steps != null) setSteps(String(dl.steps));
        if (dl.sleep_hours != null) setSleepHours(String(dl.sleep_hours));
        if (dl.sleep_quality != null) setSleepQuality(dl.sleep_quality);
        if (dl.energy_level != null) setEnergyLevel(dl.energy_level);
        if (dl.recovery_notes) setRecoveryNotes(dl.recovery_notes);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  async function save() {
    setSaving(true);
    setSavedNotice(false);
    try {
      await Promise.all([
        api.logDaily({
          date: todayStr,
          steps: steps !== '' ? Number(steps) : null,
          sleep_hours: sleepHours !== '' ? Number(sleepHours) : null,
          sleep_quality: sleepQuality,
          energy_level: energyLevel,
          recovery_notes: recoveryNotes,
        }),
        api.updateWater('today', Number(water) || 0),
        Number(cardioMinutes) > 0
          ? api.logCardio({
              date: todayStr,
              modality: cardioModality,
              duration_minutes: Number(cardioMinutes),
              intensity: 'Zone 2',
            })
          : Promise.resolve(),
      ]);

      await loadData();
      setCardioMinutes('');
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  const stats_cards: [string, string, string][] = [
    [
      'Morning weight',
      stats?.journey?.current_weight ? `${stats.journey.current_weight} kg` : 'Not logged',
      '/app/progress',
    ],
    [
      'Steps (Today)',
      steps ? `${Number(steps).toLocaleString()} / 10,000` : 'Not logged',
      '/app/daily',
    ],
    [
      'Sleep (Nightly)',
      sleepHours ? `${sleepHours} / 8.0 hrs` : 'Not logged',
      '/app/daily',
    ],
    [
      'Calories',
      `${nutrition?.day?.total_calories || 0} / ${nutrition?.targets?.daily_calories || 0}`,
      '/app/nutrition',
    ],
    [
      'Protein',
      `${nutrition?.day?.total_protein || 0} / ${nutrition?.targets?.protein_g || 0} g`,
      '/app/nutrition',
    ],
    [
      'Workouts',
      stats?.workouts_this_week != null ? `${stats.workouts_this_week} this week` : '0',
      '/app/workouts/active',
    ],
  ];

  const ratingOptions = [
    { value: 1, label: '1 Low' },
    { value: 2, label: '2' },
    { value: 3, label: '3 Mid' },
    { value: 4, label: '4' },
    { value: 5, label: '5 High' },
  ];

  return (
    <div className={styles.page}>
      <header>
        <div className={styles.eyebrow}>DAILY LOG · 1–2 MINUTES</div>
        <h1 className={styles.title}>Record the essentials</h1>
        <p className={styles.subtitle}>
          Steps and sleep feed recovery-aware pacing and the weekly review. Weight lives in Progress; meals in Nutrition.
        </p>
      </header>

      <section className={styles.statGrid}>
        {stats_cards.map(([label, value, href]) => (
          <Card key={label} className={styles.statCard} onClick={() => router.push(href)}>
            <small className={styles.statLabel}>{label}</small>
            <strong className={styles.statValue}>{value}</strong>
          </Card>
        ))}
      </section>

      <Card className={styles.formCard}>
        <div className={styles.formHeader}>
          <div>
            <h2 className={styles.formTitle}>Daily Check-In &amp; Lifestyle Tracking</h2>
            <p className={styles.formHint}>
              Core inputs to the automated weekly review, fatigue debt detection, and adaptive decision protocol.
            </p>
          </div>
          <span className={styles.dateChip}>Today · {todayStr}</span>
        </div>

        {/* 1. Steps & Activity */}
        <div className={styles.sectionBlock}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>
              1. NEAT Steps &amp; Cardio Activity
            </span>
            <span className={styles.targetBadge}>Pillar 9 Target: 8,000–10,000 Steps</span>
          </div>
          <div className={styles.inputGrid}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Daily Steps</span>
              <input
                className={styles.input}
                value={steps}
                onChange={(e) => setSteps(e.target.value)}
                type="number"
                placeholder="e.g. 8500"
              />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Cardio Duration (minutes)</span>
              <input
                className={styles.input}
                value={cardioMinutes}
                onChange={(e) => setCardioMinutes(e.target.value)}
                type="number"
                placeholder="Optional (e.g. 25)"
              />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Cardio Modality</span>
              <select
                className={styles.select}
                value={cardioModality}
                onChange={(e) => setCardioModality(e.target.value)}
              >
                <option value="TREADMILL">Incline Treadmill Walk</option>
                <option value="CYCLING">Stationary Bike</option>
                <option value="CROSS_TRAINER">Cross Trainer / Elliptical</option>
                <option value="ROWING">Rowing Ergometer</option>
                <option value="OTHER">Outdoor Brisk Walk / Other</option>
              </select>
            </label>
          </div>
        </div>

        {/* 2. Sleep & Systemic Recovery */}
        <div className={styles.sectionBlock}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>
              2. Sleep &amp; Systemic Recovery
            </span>
            <span className={styles.targetBadge}>Pillar 7 Target: 7.5–8.5 Hours</span>
          </div>
          <div className={styles.inputGrid}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Sleep Duration (hours)</span>
              <input
                className={styles.input}
                value={sleepHours}
                onChange={(e) => setSleepHours(e.target.value)}
                type="number"
                step="0.5"
                placeholder="e.g. 8.0"
              />
            </label>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Energy &amp; Readiness (1–5)</span>
              <div className={styles.ratingGroup}>
                {ratingOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`${styles.ratingBtn} ${energyLevel === opt.value ? styles.ratingBtnActive : ''}`}
                    onClick={() => setEnergyLevel(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Sleep Quality (1–5)</span>
              <div className={styles.ratingGroup}>
                {ratingOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`${styles.ratingBtn} ${sleepQuality === opt.value ? styles.ratingBtnActive : ''}`}
                    onClick={() => setSleepQuality(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 3. Hydration & Daily Notes */}
        <div className={styles.sectionBlock}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>
              3. Hydration &amp; Subjective Notes
            </span>
            <span className={styles.targetBadge}>Pillar 8 Target: 3.5–4.0 Litres</span>
          </div>
          <div className={styles.inputGrid}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Water Consumed (ml)</span>
              <input
                className={styles.input}
                value={water}
                onChange={(e) => setWater(e.target.value)}
                type="number"
                placeholder="e.g. 3500"
              />
            </label>
            <label className={`${styles.field} ${styles.fieldFullWidth}`}>
              <span className={styles.fieldLabel}>Recovery Notes &amp; Fatigue Feedback</span>
              <textarea
                className={styles.textarea}
                value={recoveryNotes}
                onChange={(e) => setRecoveryNotes(e.target.value)}
                placeholder="Note soreness, energy levels, training sensations or fatigue debt..."
              />
            </label>
          </div>
        </div>

        <div className={styles.actionRow}>
          <div>
            {savedNotice && (
              <span className={styles.saveNotice}>✓ Daily log successfully recorded!</span>
            )}
          </div>
          <Button onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save daily log'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
