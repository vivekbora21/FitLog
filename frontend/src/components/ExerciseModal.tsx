'use client';

import React, { useState, useEffect } from 'react';
import { Search, Plus, Dumbbell, X } from 'lucide-react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Exercise } from '@/lib/types';
import { api } from '@/lib/api';

interface ExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectExercise: (exercise: Exercise) => void;
}

export const ExerciseModal: React.FC<ExerciseModalProps> = ({ isOpen, onClose, onSelectExercise }) => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [search, setSearch] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<string>('all');
  const [loading, setLoading] = useState(false);

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
    if (isOpen) {
      setLoading(true);
      api
        .getExercises()
        .then((data) => {
          setExercises(data.results || data);
        })
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  const filtered = exercises.filter((ex) => {
    const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase()) ||
      ex.primary_muscle_name.toLowerCase().includes(search.toLowerCase());
    const matchesMuscle = selectedMuscle === 'all' || ex.primary_muscle_name.toLowerCase().includes(selectedMuscle);
    return matchesSearch && matchesMuscle;
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Select Exercise">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Search Bar */}
        <div style={{ position: 'relative' }}>
          <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search exercise by name or muscle..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px 10px 38px',
              background: '#FFFFFF',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
              outline: 'none',
            }}
          />
        </div>

        {/* Muscle Category Filter Pills */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
          {muscles.map((m) => {
            const active = selectedMuscle === m.slug;
            return (
              <button
                key={m.slug}
                onClick={() => setSelectedMuscle(m.slug)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  border: active ? '1px solid var(--color-primary)' : '1px solid var(--border-subtle)',
                  background: active ? 'var(--color-primary)' : '#FFFFFF',
                  color: active ? '#FFFFFF' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {m.label}
              </button>
            );
          })}
        </div>

        {/* Exercise List */}
        <div style={{ maxHeight: '380px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>Loading catalog...</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>No matching exercises found.</div>
          ) : (
            filtered.map((ex) => (
              <div
                key={ex.id}
                onClick={() => {
                  onSelectExercise(ex);
                  onClose();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-glow)';
                  (e.currentTarget as HTMLElement).style.background = 'var(--bg-surface-hover)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-subtle)';
                  (e.currentTarget as HTMLElement).style.background = 'var(--bg-surface-elevated)';
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>{ex.name}</div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    <Badge variant="emerald">{ex.primary_muscle_name}</Badge>
                    <Badge variant="cyan">{ex.equipment_name}</Badge>
                    {ex.gym_name && <Badge variant="violet">{ex.gym_name}</Badge>}
                  </div>
                </div>
                <Button size="sm" variant="secondary" iconOnly>
                  <Plus size={16} />
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
};
