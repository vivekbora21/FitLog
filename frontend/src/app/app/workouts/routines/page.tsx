'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Play, Dumbbell, Shield, UserCheck, Flame, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { Routine, Exercise } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { ExerciseModal } from '@/components/ExerciseModal';

export default function RoutinesPage() {
  const router = useRouter();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [exercisePickerOpen, setExercisePickerOpen] = useState(false);

  // New Routine Form State
  const [newRoutineName, setNewRoutineName] = useState('');
  const [newRoutineDesc, setNewRoutineDesc] = useState('');
  const [selectedExercises, setSelectedExercises] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  const loadRoutines = async () => {
    try {
      const data = await api.getRoutines();
      setRoutines(data.results || data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoutines();
  }, []);

  const handleAddExerciseToRoutine = (ex: Exercise) => {
    setSelectedExercises((prev) => [
      ...prev,
      {
        exercise: ex.id,
        exercise_name: ex.name,
        primary_muscle: ex.primary_muscle_name,
        order: prev.length + 1,
        target_sets: 3,
        target_reps: '8-12',
        rest_seconds: 90,
      },
    ]);
  };

  const handleSaveRoutine = async () => {
    if (!newRoutineName.trim()) {
      alert('Please enter a routine name');
      return;
    }
    setSaving(true);
    try {
      await api.createRoutine({
        name: newRoutineName,
        description: newRoutineDesc,
        exercises: selectedExercises.map((e, idx) => ({
          exercise: e.exercise,
          order: idx + 1,
          target_sets: Number(e.target_sets) || 3,
          target_reps: e.target_reps || '8-12',
          rest_seconds: Number(e.rest_seconds) || 90,
        })),
      });
      setCreateModalOpen(false);
      setNewRoutineName('');
      setNewRoutineDesc('');
      setSelectedExercises([]);
      loadRoutines();
    } catch (err) {
      console.error('Failed to create routine:', err);
    } finally {
      setSaving(false);
    }
  };

  const gymTemplates = routines.filter((r) => r.is_gym_template);
  const personalRoutines = routines.filter((r) => !r.is_gym_template);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem' }}>Workout Routines & Templates</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '4px' }}>
            Structured workout splits designed for progressive overload and muscle development.
          </p>
        </div>

        <Button variant="primary" onClick={() => setCreateModalOpen(true)}>
          <Plus size={16} />
          <span>Create New Routine</span>
        </Button>
      </div>

      {/* Gym Templates Section */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
          <Shield size={20} color="var(--color-primary)" />
          <h2 style={{ fontSize: '1.35rem' }}>Apex Gym Templates</h2>
          <Badge variant="emerald">Coach Verified</Badge>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
          {gymTemplates.map((routine) => (
            <Card key={routine.id} hoverable style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '1.2rem' }}>{routine.name}</h3>
                  <Badge variant="amber">Template</Badge>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                  {routine.description || 'Custom workout template.'}
                </p>

                {/* Exercises list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '1.25rem' }}>
                  {routine.exercises.map((re, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.8125rem',
                        padding: '6px 10px',
                        background: 'var(--bg-surface-elevated)',
                        borderRadius: 'var(--radius-sm)',
                      }}
                    >
                      <span style={{ fontWeight: 600 }}>
                        #{re.order} {re.exercise_name}
                      </span>
                      <span style={{ color: 'var(--text-muted)' }}>
                        {re.target_sets} sets × {re.target_reps}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  By {routine.created_by_name || 'Coach'}
                </span>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => router.push(`/app/workouts/active?routine=${routine.id}`)}
                >
                  <Play size={14} fill="#080B11" />
                  <span>Start Workout</span>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Personal Member Routines Section */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
          <UserCheck size={20} color="var(--color-cyan)" />
          <h2 style={{ fontSize: '1.35rem' }}>Personal Routines</h2>
          <Badge variant="cyan">Member Owned</Badge>
        </div>

        {personalRoutines.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              You haven't built any personal routines yet. Create one tailored to your personal split!
            </p>
            <Button size="sm" variant="outline" onClick={() => setCreateModalOpen(true)}>
              <Plus size={14} /> Create Personal Routine
            </Button>
          </Card>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
            {personalRoutines.map((routine) => (
              <Card key={routine.id} hoverable style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <h3 style={{ fontSize: '1.2rem' }}>{routine.name}</h3>
                    <Badge variant="cyan">Personal</Badge>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                    {routine.description || 'Personal routine.'}
                  </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => router.push(`/app/workouts/active?routine=${routine.id}`)}
                  >
                    <Play size={14} fill="#080B11" />
                    <span>Start Workout</span>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Routine Modal */}
      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Create New Routine">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Routine Title
            </label>
            <input
              type="text"
              placeholder="e.g. Upper Body Hypertrophy"
              value={newRoutineName}
              onChange={(e) => setNewRoutineName(e.target.value)}
              style={{
                width: '100%',
                marginTop: '4px',
                padding: '8px 12px',
                background: '#FFFFFF',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                outline: 'none',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Description
            </label>
            <textarea
              rows={2}
              placeholder="Focus areas, tempo cues, recommended split day..."
              value={newRoutineDesc}
              onChange={(e) => setNewRoutineDesc(e.target.value)}
              style={{
                width: '100%',
                marginTop: '4px',
                padding: '8px 12px',
                background: '#FFFFFF',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                outline: 'none',
                resize: 'none',
              }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                Routine Exercises ({selectedExercises.length})
              </label>
              <Button size="sm" variant="secondary" onClick={() => setExercisePickerOpen(true)}>
                <Plus size={14} /> Add Movement
              </Button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
              {selectedExercises.map((e, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: 'var(--bg-surface-elevated)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                    #{idx + 1} {e.exercise_name}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="number"
                      value={e.target_sets}
                      onChange={(ev) => {
                        const copy = [...selectedExercises];
                        copy[idx].target_sets = parseInt(ev.target.value, 10) || 3;
                        setSelectedExercises(copy);
                      }}
                      style={{ width: '45px', padding: '4px', background: '#FFFFFF', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', borderRadius: '4px', textAlign: 'center' }}
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>sets</span>
                    <button
                      onClick={() => setSelectedExercises((prev) => prev.filter((_, i) => i !== idx))}
                      style={{ background: 'transparent', border: 'none', color: 'var(--color-rose)', cursor: 'pointer' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1rem' }}>
            <Button variant="secondary" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveRoutine} disabled={saving}>
              {saving ? 'Creating...' : 'Save Routine'}
            </Button>
          </div>
        </div>
      </Modal>

      <ExerciseModal
        isOpen={exercisePickerOpen}
        onClose={() => setExercisePickerOpen(false)}
        onSelectExercise={handleAddExerciseToRoutine}
      />
    </div>
  );
}
