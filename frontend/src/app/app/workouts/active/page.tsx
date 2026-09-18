'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Plus, Trash2, Check, Trophy, X, Dumbbell, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';
import { Exercise, Routine } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { ExerciseModal } from '@/components/ExerciseModal';

interface ActiveSet {
  set_number: number;
  set_type: 'WARMUP' | 'NORMAL' | 'DROP' | 'FAILURE';
  weight_kg: number;
  reps: number;
  rpe?: number | null;
  completed: boolean;
}

interface ActiveExercise {
  exerciseId: string;
  name: string;
  primaryMuscle: string;
  restSeconds: number;
  notes: string;
  targetReps?: string;
  targetRpe?: number | null;
  suggestedWeight?: number | null;
  sets: ActiveSet[];
}

type RoutineExercisePayload = {
  exercise: string;
  exercise_name: string;
  primary_muscle: string;
  rest_seconds?: number;
  notes?: string;
  target_sets?: number;
  target_reps?: string;
  target_rpe?: number | null;
  suggested_weight_kg?: number | null;
};

type RoutinePayload = {
  id?: string;
  name: string;
  exercises?: RoutineExercisePayload[];
};

function ActiveWorkoutLoggerInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const routineId = searchParams.get('routine');
  const assignedId = searchParams.get('assigned');

  const [title, setTitle] = useState('Active Workout Session');
  const [exercises, setExercises] = useState<ActiveExercise[]>([]);
  const [routineExercises, setRoutineExercises] = useState<RoutineExercisePayload[]>([]);
  const startTimeRef = useRef<number>(Date.now());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [finishModalOpen, setFinishModalOpen] = useState(false);
  const [overallRpe, setOverallRpe] = useState<number>(8);
  const [workoutNotes, setWorkoutNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [activeRoutineId, setActiveRoutineId] = useState<string | null>(routineId);

  // Load routine details if available, but do NOT auto-populate active exercises.
  // Exercises are only shown after the user adds them.
  useEffect(() => {
    const handleRoutine = (routine: RoutinePayload) => {
      if (routine.name) setTitle(routine.name);
      setActiveRoutineId(routine.id || routineId || null);
      if (routine.exercises && routine.exercises.length > 0) {
        setRoutineExercises(routine.exercises);
      }
    };

    const loadWorkout = async () => {
      try {
        if (routineId) {
          const routines = await api.getRoutines();
          const list = routines.results || routines;
          const found = list.find((r: Routine) => r.id === routineId);
          if (found) handleRoutine(found);
          return;
        }
        const current = await api.getTodaysWorkout();
        const routine = current?.today?.routine_details;
        if (routine) {
          handleRoutine(routine);
        }
      } catch (error) {
        console.error('Failed to load active workout', error);
      }
    };

    loadWorkout();
  }, [routineId]);

  // Add exercise from the full catalog modal
  const addExercise = (ex: Exercise) => {
    setExercises((prev) => [
      ...prev,
      {
        exerciseId: ex.id,
        name: ex.name,
        primaryMuscle: ex.primary_muscle_name,
        restSeconds: 90,
        notes: '',
        sets: [
          { set_number: 1, set_type: 'NORMAL', weight_kg: 50, reps: 10, completed: false },
          { set_number: 2, set_type: 'NORMAL', weight_kg: 50, reps: 10, completed: false },
          { set_number: 3, set_type: 'NORMAL', weight_kg: 50, reps: 10, completed: false },
        ],
      },
    ]);
  };

  // Add a specific exercise prescribed by the routine
  const addRoutineExercise = (re: RoutineExercisePayload) => {
    const setsCount = re.target_sets || 3;
    const targetRepMatch = re.target_reps?.match(/\d+/);
    const defaultReps = targetRepMatch ? parseInt(targetRepMatch[0], 10) : 8;

    const newExercise: ActiveExercise = {
      exerciseId: re.exercise,
      name: re.exercise_name,
      primaryMuscle: re.primary_muscle,
      restSeconds: re.rest_seconds || 90,
      notes: re.notes || '',
      targetReps: re.target_reps,
      targetRpe: re.target_rpe,
      suggestedWeight: re.suggested_weight_kg,
      sets: Array.from({ length: setsCount }).map((_, sIdx) => ({
        set_number: sIdx + 1,
        set_type: 'NORMAL',
        weight_kg: re.suggested_weight_kg || 0,
        reps: defaultReps,
        rpe: re.target_rpe || null,
        completed: false,
      })),
    };

    setExercises((prev) => [...prev, newExercise]);
  };

  // Add all routine exercises at once
  const addAllRoutineExercises = () => {
    const unadded = routineExercises.filter(
      (re) => !exercises.some((ex) => ex.exerciseId === re.exercise)
    );

    const newItems: ActiveExercise[] = unadded.map((re) => {
      const setsCount = re.target_sets || 3;
      const targetRepMatch = re.target_reps?.match(/\d+/);
      const defaultReps = targetRepMatch ? parseInt(targetRepMatch[0], 10) : 8;

      return {
        exerciseId: re.exercise,
        name: re.exercise_name,
        primaryMuscle: re.primary_muscle,
        restSeconds: re.rest_seconds || 90,
        notes: re.notes || '',
        targetReps: re.target_reps,
        targetRpe: re.target_rpe,
        suggestedWeight: re.suggested_weight_kg,
        sets: Array.from({ length: setsCount }).map((_, sIdx) => ({
          set_number: sIdx + 1,
          set_type: 'NORMAL',
          weight_kg: re.suggested_weight_kg || 0,
          reps: defaultReps,
          rpe: re.target_rpe || null,
          completed: false,
        })),
      };
    });

    setExercises((prev) => [...prev, ...newItems]);
  };

  const removeExercise = (index: number) => {
    setExercises((prev) => prev.filter((_, i) => i !== index));
  };

  const addSet = (exIndex: number) => {
    setExercises((prev) =>
      prev.map((ex, i) => {
        if (i !== exIndex) return ex;
        const lastSet = ex.sets[ex.sets.length - 1];
        const nextNum = ex.sets.length + 1;
        return {
          ...ex,
          sets: [
            ...ex.sets,
            {
              set_number: nextNum,
              set_type: 'NORMAL',
              weight_kg: lastSet ? lastSet.weight_kg : 50,
              reps: lastSet ? lastSet.reps : 10,
              completed: false,
            },
          ],
        };
      })
    );
  };

  const removeSet = (exIndex: number, setIndex: number) => {
    setExercises((prev) =>
      prev.map((ex, i) => {
        if (i !== exIndex) return ex;
        const filtered = ex.sets.filter((_, idx) => idx !== setIndex);
        return {
          ...ex,
          sets: filtered.map((s, idx) => ({ ...s, set_number: idx + 1 })),
        };
      })
    );
  };

  const updateSet = <K extends keyof ActiveSet>(exIndex: number, setIndex: number, field: K, val: ActiveSet[K]) => {
    setExercises((prev) =>
      prev.map((ex, i) => {
        if (i !== exIndex) return ex;
        return {
          ...ex,
          sets: ex.sets.map((s, j) => (j === setIndex ? { ...s, [field]: val } : s)),
        };
      })
    );
  };

  const calculateTotalVolume = () => {
    let volume = 0;
    exercises.forEach((ex) => {
      ex.sets.forEach((s) => {
        if (s.completed && s.weight_kg && s.reps) {
          volume += s.weight_kg * s.reps;
        }
      });
    });
    return volume;
  };

  const progressionRecommendation = (ex: ActiveExercise) => {
    const match = ex.targetReps?.match(/(\d+)\s*[-–]\s*(\d+)/);
    const topReps = match ? Number(match[2]) : 0;
    const completed = ex.sets.filter((set) => set.completed);
    if (!completed.length || !topReps) return `Log all working sets. Target ${ex.targetReps || 'the prescribed rep range'} at RPE ${ex.targetRpe || '8'}.`;
    const sameLoad = completed.every((set) => set.weight_kg === completed[0].weight_kg);
    const atTop = completed.length === ex.sets.length && completed.every((set) => set.reps >= topReps && (!ex.targetRpe || !set.rpe || set.rpe <= ex.targetRpe + .5));
    if (atTop && sameLoad) return `Increase ${completed[0].weight_kg} kg by 1.25–2.5 kg next session: every set reached ${topReps} at the intended RPE.`;
    const next = completed.map((set) => Math.min(topReps, set.reps + 1)).join(' / ');
    return `Keep ${completed[0].weight_kg} kg. Next session aim for ${next}; increase load only after every prescribed set reaches ${topReps}.`;
  };

  const handleFinishWorkout = async () => {
    setSaving(true);
    try {
      const now = Date.now();
      const durationSeconds = Math.max(1, Math.floor((now - startTimeRef.current) / 1000));

      const payload = {
        title,
        started_at: new Date(startTimeRef.current).toISOString(),
        completed_at: new Date(now).toISOString(),
        duration_seconds: durationSeconds,
        overall_rpe: overallRpe,
        notes: workoutNotes,
        routine: activeRoutineId,
        assigned_workout: assignedId || null,
        exercises: exercises.map((ex, orderIdx) => ({
          exercise: ex.exerciseId,
          order: orderIdx + 1,
          rest_seconds: ex.restSeconds,
          notes: ex.notes,
          sets: ex.sets.map((s) => ({
            set_number: s.set_number,
            set_type: s.set_type,
            weight_kg: Number(s.weight_kg) || 0,
            reps: Number(s.reps) || 0,
            rpe: s.rpe ? Number(s.rpe) : null,
            completed: s.completed,
          })),
        })),
      };

      await api.createWorkoutSession(payload);
      setFinishModalOpen(false);
      router.push('/app/workouts');
    } catch (err) {
      console.error('Failed to save workout session:', err);
      alert('Failed to save workout session. Please verify inputs.');
    } finally {
      setSaving(false);
    }
  };

  const unaddedRoutineExercises = routineExercises.filter(
    (re) => !exercises.some((e) => e.exerciseId === re.exercise)
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Banner & Controls */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          padding: '1.25rem 1.5rem',
          background: 'var(--bg-glass)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{
              fontSize: '1.5rem',
              fontWeight: 800,
              fontFamily: 'Outfit, sans-serif',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              outline: 'none',
              width: '100%',
              maxWidth: '450px',
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              {exercises.length} {exercises.length === 1 ? 'Exercise' : 'Exercises'}
            </span>
            <span style={{ color: 'var(--text-muted)' }}>•</span>
            <span style={{ fontSize: '0.875rem', color: 'var(--color-cyan)', fontWeight: 600 }}>
              {calculateTotalVolume().toLocaleString()} kg lifted
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="secondary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} />
            <span>Add Movement</span>
          </Button>
          <Button variant="primary" onClick={() => setFinishModalOpen(true)} disabled={exercises.length === 0}>
            <Check size={16} strokeWidth={2.5} />
            <span>Finish Session</span>
          </Button>
        </div>
      </div>

      {/* Exercises Section */}
      {exercises.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Main Action Card */}
          <Card style={{ padding: '2.5rem 1.5rem', textAlign: 'center' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem auto',
                color: 'var(--color-primary)',
              }}
            >
              <Dumbbell size={28} strokeWidth={2.2} />
            </div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, fontFamily: 'Outfit, sans-serif', marginBottom: '0.5rem' }}>
              Add Exercises to Begin Session
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '540px', margin: '0 auto 1.5rem auto' }}>
              {routineExercises.length > 0
                ? 'Select exercises from today’s routine below, or search any movement from the exercise library to start logging.'
                : 'Select movements from the exercise library to begin tracking your workout sets, reps, and weights.'}
            </p>
            <Button variant="primary" onClick={() => setIsModalOpen(true)}>
              <Plus size={16} />
              <span>Browse Exercise Library</span>
            </Button>
          </Card>

          {/* Routine Prescribed Exercises Options */}
          {routineExercises.length > 0 && (
            <Card style={{ padding: '1.5rem' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.25rem',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={18} color="var(--color-primary)" />
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 800, fontFamily: 'Outfit, sans-serif' }}>
                      Prescribed for Today: {title}
                    </h4>
                  </div>
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Choose which movements you want to log in this session:
                  </p>
                </div>
                <Button size="sm" variant="secondary" onClick={addAllRoutineExercises}>
                  <Plus size={14} />
                  <span>Add All ({routineExercises.length})</span>
                </Button>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
                  gap: '1rem',
                }}
              >
                {routineExercises.map((re, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      padding: '1.1rem',
                      background: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      gap: '1rem',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.975rem', color: 'var(--text-primary)' }}>
                          {re.exercise_name}
                        </span>
                        <Badge variant="emerald">{re.primary_muscle}</Badge>
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                        Target: {re.target_sets || 3} sets × {re.target_reps || '8 reps'}
                        {re.suggested_weight_kg ? ` · ${re.suggested_weight_kg} kg` : ''}
                        {re.target_rpe ? ` @ RPE ${re.target_rpe}` : ''}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => addRoutineExercise(re)}
                      style={{ width: '100%', justifyContent: 'center' }}
                    >
                      <Plus size={14} />
                      <span>Add Exercise</span>
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Active Exercises List */}
          {exercises.map((ex, exIdx) => (
            <Card key={exIdx} style={{ position: 'relative' }}>
              {/* Exercise Header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '1rem',
                  borderBottom: '1px solid var(--border-subtle)',
                  paddingBottom: '0.75rem',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'Outfit, sans-serif' }}>
                      #{exIdx + 1} {ex.name}
                    </span>
                    <Badge variant="emerald">{ex.primaryMuscle}</Badge>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Target: {ex.sets.length} × {ex.targetReps || 'log reps'} @ RPE {ex.targetRpe || '8'} · Rest: {ex.restSeconds}s
                  </div>
                </div>

                <Button size="sm" variant="ghost" onClick={() => removeExercise(exIdx)} aria-label="Remove exercise">
                  <Trash2 size={16} color="var(--color-rose)" />
                </Button>
              </div>

              <div
                style={{
                  marginTop: '.75rem',
                  padding: '.65rem .75rem',
                  background: 'rgba(16, 185, 129, .08)',
                  borderLeft: '3px solid var(--color-primary)',
                  fontSize: '.8rem',
                  color: 'var(--text-secondary)',
                }}
              >
                <strong style={{ color: 'var(--color-primary)' }}>PROGRESSION RECOMMENDATION · </strong>
                {progressionRecommendation(ex)}
              </div>

              {/* Set Table */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                  <thead>
                    <tr
                      style={{
                        color: 'var(--text-muted)',
                        borderBottom: '1px solid var(--border-subtle)',
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      <th style={{ padding: '8px', width: '50px' }}>Set</th>
                      <th style={{ padding: '8px', width: '120px' }}>Type</th>
                      <th style={{ padding: '8px', width: '110px' }}>kg</th>
                      <th style={{ padding: '8px', width: '90px' }}>Reps</th>
                      <th style={{ padding: '8px', width: '70px' }}>Done</th>
                      <th style={{ padding: '8px', width: '40px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {ex.sets.map((set, sIdx) => (
                      <tr
                        key={sIdx}
                        style={{
                          borderBottom: '1px solid var(--border-subtle)',
                          background: set.completed ? 'rgba(16, 185, 129, 0.08)' : 'transparent',
                        }}
                      >
                        {/* Set # */}
                        <td style={{ padding: '8px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                          {set.set_number}
                        </td>

                        {/* Set Type */}
                        <td style={{ padding: '8px' }}>
                          <select
                            value={set.set_type}
                            onChange={(e) => updateSet(exIdx, sIdx, 'set_type', e.target.value as ActiveSet['set_type'])}
                            style={{
                              background: 'var(--bg-surface-elevated)',
                              border: '1px solid var(--border-subtle)',
                              color: 'var(--text-primary)',
                              padding: '4px 8px',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '0.8125rem',
                              outline: 'none',
                            }}
                          >
                            <option value="NORMAL">Normal</option>
                            <option value="WARMUP">Warmup</option>
                            <option value="DROP">Drop Set</option>
                            <option value="FAILURE">To Failure</option>
                          </select>
                        </td>

                        {/* Weight (kg) */}
                        <td style={{ padding: '8px' }}>
                          <input
                            type="number"
                            step="0.5"
                            value={set.weight_kg}
                            onChange={(e) => updateSet(exIdx, sIdx, 'weight_kg', parseFloat(e.target.value) || 0)}
                            style={{
                              width: '80px',
                              background: '#FFFFFF',
                              border: '1px solid var(--border-subtle)',
                              color: 'var(--text-primary)',
                              padding: '6px 8px',
                              borderRadius: 'var(--radius-sm)',
                              fontWeight: 700,
                              outline: 'none',
                            }}
                          />
                        </td>

                        {/* Reps */}
                        <td style={{ padding: '8px' }}>
                          <input
                            type="number"
                            value={set.reps}
                            onChange={(e) => updateSet(exIdx, sIdx, 'reps', parseInt(e.target.value, 10) || 0)}
                            style={{
                              width: '65px',
                              background: '#FFFFFF',
                              border: '1px solid var(--border-subtle)',
                              color: 'var(--text-primary)',
                              padding: '6px 8px',
                              borderRadius: 'var(--radius-sm)',
                              fontWeight: 700,
                              outline: 'none',
                            }}
                          />
                        </td>

                        {/* Completed Checkbox */}
                        <td style={{ padding: '8px' }}>
                          <button
                            type="button"
                            onClick={() => updateSet(exIdx, sIdx, 'completed', !set.completed)}
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '6px',
                              border: set.completed ? '1px solid var(--color-primary)' : '1px solid var(--border-bright)',
                              background: set.completed ? 'var(--color-primary)' : '#FFFFFF',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              transition: 'all var(--transition-fast)',
                            }}
                          >
                            {set.completed && <Check size={18} color="#FFFFFF" strokeWidth={3} />}
                          </button>
                        </td>

                        {/* Remove Set */}
                        <td style={{ padding: '8px' }}>
                          {ex.sets.length > 1 && (
                            <button
                              onClick={() => removeSet(exIdx, sIdx)}
                              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                            >
                              <X size={14} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Add Set Button */}
              <div style={{ marginTop: '12px' }}>
                <Button size="sm" variant="secondary" onClick={() => addSet(exIdx)}>
                  <Plus size={14} />
                  <span>Add Set</span>
                </Button>
              </div>
            </Card>
          ))}

          {/* Quick-add unadded routine exercises if any remain */}
          {unaddedRoutineExercises.length > 0 && (
            <Card style={{ padding: '1.25rem 1.5rem', background: 'var(--bg-glass)', border: '1px dashed var(--border-glow)' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  marginBottom: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={16} color="var(--color-primary)" />
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                    Add More from Today’s Routine ({title})
                  </span>
                </div>
                {unaddedRoutineExercises.length > 1 && (
                  <Button size="sm" variant="ghost" onClick={addAllRoutineExercises}>
                    <Plus size={14} />
                    <span>Add All Remaining ({unaddedRoutineExercises.length})</span>
                  </Button>
                )}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {unaddedRoutineExercises.map((re, idx) => (
                  <button
                    key={idx}
                    onClick={() => addRoutineExercise(re)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 14px',
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-primary)';
                      (e.currentTarget as HTMLElement).style.background = 'rgba(16, 185, 129, 0.08)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-subtle)';
                      (e.currentTarget as HTMLElement).style.background = 'var(--bg-surface-elevated)';
                    }}
                  >
                    <Plus size={14} color="var(--color-primary)" />
                    <span>{re.exercise_name}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({re.primary_muscle})</span>
                  </button>
                ))}
              </div>
            </Card>
          )}

          {/* Add Movement Button */}
          <div style={{ display: 'flex', justifyContent: 'center', padding: '0.5rem 0' }}>
            <Button variant="secondary" onClick={() => setIsModalOpen(true)}>
              <Plus size={16} />
              <span>Add Movement from Library</span>
            </Button>
          </div>
        </div>
      )}

      {/* Exercise Picker Modal */}
      <ExerciseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelectExercise={addExercise}
      />

      {/* Finish Session Summary Modal */}
      <Modal isOpen={finishModalOpen} onClose={() => setFinishModalOpen(false)} title="Complete Workout Session">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div
            style={{
              textAlign: 'center',
              padding: '1rem',
              background: 'rgba(16, 185, 129, 0.08)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-glow)',
            }}
          >
            <Trophy size={36} color="var(--color-primary)" style={{ margin: '0 auto 8px auto' }} />
            <h3 style={{ fontSize: '1.3rem' }}>Outstanding Work!</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              You moved <strong style={{ color: 'var(--color-primary-light)' }}>{calculateTotalVolume().toLocaleString()} kg</strong> of total volume.
            </p>
          </div>

          <div>
            <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Perceived Exertion (RPE 1-10)
            </label>
            <div style={{ display: 'flex', gap: '6px', marginTop: '6px', overflowX: 'auto' }}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setOverallRpe(num)}
                  style={{
                    flex: 1,
                    minWidth: '28px',
                    padding: '8px 0',
                    borderRadius: 'var(--radius-sm)',
                    border: overallRpe === num ? '1px solid var(--color-primary)' : '1px solid var(--border-subtle)',
                    background: overallRpe === num ? 'var(--color-primary)' : '#FFFFFF',
                    color: overallRpe === num ? '#FFFFFF' : 'var(--text-primary)',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Session Notes
            </label>
            <textarea
              rows={3}
              value={workoutNotes}
              onChange={(e) => setWorkoutNotes(e.target.value)}
              placeholder="How did the session feel? Energy levels, pumps, form cues..."
              style={{
                width: '100%',
                marginTop: '6px',
                padding: '10px',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                outline: 'none',
                resize: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1rem' }}>
            <Button variant="secondary" onClick={() => setFinishModalOpen(false)}>
              Keep Logging
            </Button>
            <Button variant="primary" onClick={handleFinishWorkout} disabled={saving}>
              {saving ? 'Saving...' : 'Save & Log Session'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function ActiveWorkoutLoggerPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading active session...</div>}>
      <ActiveWorkoutLoggerInner />
    </Suspense>
  );
}
