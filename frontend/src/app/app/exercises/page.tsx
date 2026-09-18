'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Dumbbell, Trophy, Info, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';
import { Exercise, PersonalRecord } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

export default function ExerciseLibraryPage() {
  const router = useRouter();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [prs, setPrs] = useState<Record<string, PersonalRecord>>({});
  const [search, setSearch] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState('all');
  const [activeExercise, setActiveExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);

  const muscles = [
    { label: 'All', slug: 'all' },
    { label: 'Chest', slug: 'chest' },
    { label: 'Back', slug: 'back' },
    { label: 'Legs', slug: 'quadriceps' },
    { label: 'Shoulders', slug: 'shoulders' },
    { label: 'Biceps', slug: 'biceps' },
    { label: 'Triceps', slug: 'triceps' },
    { label: 'Core', slug: 'core' },
    { label: 'Cardio', slug: 'cardio' },
  ];

  useEffect(() => {
    async function loadData() {
      try {
        const [exData, prData] = await Promise.all([
          api.getExercises(),
          api.getPersonalRecords(),
        ]);
        const exList = exData.results || exData;
        const prList = prData.results || prData;

        const prMap: Record<string, PersonalRecord> = {};
        prList.forEach((pr: PersonalRecord) => {
          prMap[pr.exercise] = pr;
        });

        setExercises(exList);
        setPrs(prMap);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filtered = exercises.filter((ex) => {
    const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase()) ||
      ex.primary_muscle_name.toLowerCase().includes(search.toLowerCase());
    const matchesMuscle = selectedMuscle === 'all' || ex.primary_muscle_name.toLowerCase().includes(selectedMuscle);
    return matchesSearch && matchesMuscle;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '2rem' }}>Exercise Library</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '4px' }}>
          Explore 50+ biomechanically vetted movements, proper execution cues, and personal records.
        </p>
      </div>

      {/* Search & Filters */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ position: 'relative', maxWidth: '500px' }}>
          <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search exercises by name, muscle, or equipment..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 14px 12px 42px',
              background: '#FFFFFF',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontSize: '0.95rem',
              boxShadow: 'var(--shadow-sm)',
              outline: 'none',
            }}
          />
        </div>

        {/* Muscle group filter pills */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          {muscles.map((m) => {
            const active = selectedMuscle === m.slug;
            return (
              <button
                key={m.slug}
                onClick={() => setSelectedMuscle(m.slug)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  border: active ? '1px solid var(--color-primary)' : '1px solid var(--border-subtle)',
                  background: active ? 'var(--color-primary)' : '#FFFFFF',
                  color: active ? '#FFFFFF' : 'var(--text-secondary)',
                  boxShadow: 'var(--shadow-sm)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Exercise Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading exercise catalog...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {filtered.map((ex) => {
            const userPr = prs[ex.id];
            return (
              <Card
                key={ex.id}
                hoverable
                onClick={() => setActiveExercise(ex)}
                style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <h3 style={{ fontSize: '1.15rem' }}>{ex.name}</h3>
                    {userPr && (
                      <Badge variant="amber">
                        <Trophy size={12} /> PR {userPr.max_weight_kg}kg
                      </Badge>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '0.75rem' }}>
                    <Badge variant="emerald">{ex.primary_muscle_name}</Badge>
                    <Badge variant="cyan">{ex.equipment_name}</Badge>
                    {ex.gym_name && <Badge variant="violet">{ex.gym_name}</Badge>}
                  </div>

                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {ex.instructions || 'Standard exercise cues and biomechanical execution.'}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)', color: 'var(--color-primary-light)', fontSize: '0.8125rem', fontWeight: 600 }}>
                  <Info size={14} />
                  <span>View Details & Cues</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {activeExercise && (
        <Modal isOpen={!!activeExercise} onClose={() => setActiveExercise(null)} title={activeExercise.name}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Badge variant="emerald">{activeExercise.primary_muscle_name}</Badge>
              <Badge variant="cyan">{activeExercise.equipment_name}</Badge>
              {activeExercise.gym_name && <Badge variant="violet">{activeExercise.gym_name}</Badge>}
            </div>

            <div>
              <h4 style={{ fontSize: '0.95rem', marginBottom: '6px', color: 'var(--text-primary)' }}>Execution & Form Cues</h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, background: 'var(--bg-surface-elevated)', padding: '12px 14px', borderRadius: 'var(--radius-md)' }}>
                {activeExercise.instructions}
              </p>
            </div>

            {prs[activeExercise.id] && (
              <div style={{ background: 'linear-gradient(90deg, rgba(245, 158, 11, 0.12) 0%, rgba(16, 185, 129, 0.08) 100%)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: 'var(--radius-md)', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#B45309', fontWeight: 700, textTransform: 'uppercase' }}>All-Time Personal Best</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                    {prs[activeExercise.id].max_weight_kg}kg × {prs[activeExercise.id].reps} reps
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Estimated 1RM</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                    {prs[activeExercise.id].estimated_one_rep_max} kg
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <Button variant="primary" onClick={() => router.push('/app/workouts/active')}>
                Log Workout with this Movement
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
