'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Dumbbell, Plus, Calendar, Clock, ChevronDown, ChevronUp, Flame, Play } from 'lucide-react';
import { api } from '@/lib/api';
import { WorkoutSession } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export default function WorkoutHistoryPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getWorkouts()
      .then((data) => {
        setSessions(data.results || data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedSessionId(expandedSessionId === id ? null : id);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem' }}>Workout History</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '4px' }}>
            Comprehensive log of all completed training sessions and progressive overload.
          </p>
        </div>

        <Button variant="primary" onClick={() => router.push('/app/workouts/active')}>
          <Play size={16} fill="#080B11" />
          <span>Start Empty Workout</span>
        </Button>
      </div>

      {/* Sessions List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading workout history...</div>
      ) : sessions.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <Dumbbell size={40} color="var(--text-muted)" style={{ margin: '0 auto 1rem auto' }} />
          <h3>No workouts recorded yet</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', marginBottom: '1.5rem' }}>
            Start logging your workouts to build your lifetime training history.
          </p>
          <Button variant="primary" onClick={() => router.push('/app/workouts/active')}>
            Start Workout Now
          </Button>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {sessions.map((session) => {
            const isExpanded = expandedSessionId === session.id;
            return (
              <Card key={session.id} hoverable>
                {/* Header Row */}
                <div
                  onClick={() => toggleExpand(session.id)}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', cursor: 'pointer', flexWrap: 'wrap', gap: '1rem' }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h3 style={{ fontSize: '1.2rem' }}>{session.title}</h3>
                      {session.assigned_workout && <Badge variant="amber">Assigned Workout</Badge>}
                      {session.gym_name && <Badge variant="cyan">{session.gym_name}</Badge>}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={14} />
                        {new Date(session.started_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span>•</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={14} />
                        {Math.round(session.duration_seconds / 60)} mins
                      </span>
                      {session.overall_rpe && (
                        <>
                          <span>•</span>
                          <span>RPE {session.overall_rpe}/10</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-primary-light)', fontFamily: 'Outfit, sans-serif' }}>
                        {session.total_volume_kg.toLocaleString()} kg
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Volume</div>
                    </div>

                    <button
                      type="button"
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                    >
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                  </div>
                </div>

                {/* Session Notes if any */}
                {session.notes && (
                  <p style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: 'var(--text-secondary)', fontStyle: 'italic', background: 'var(--bg-surface-elevated)', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}>
                    "{session.notes}"
                  </p>
                )}

                {/* Expanded Details: Exercises and Sets */}
                {isExpanded && session.exercises && session.exercises.length > 0 && (
                  <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {session.exercises.map((we, idx) => (
                      <div key={idx} style={{ background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)', padding: '12px 16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                            #{we.order} {we.exercise_name}
                          </span>
                          <Badge variant="emerald">{we.primary_muscle}</Badge>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {we.sets.map((s, sIdx) => (
                            <div
                              key={sIdx}
                              style={{
                                background: '#FFFFFF',
                                border: '1px solid var(--border-subtle)',
                                borderRadius: 'var(--radius-sm)',
                                padding: '4px 10px',
                                fontSize: '0.8125rem',
                              }}
                            >
                              <span style={{ color: 'var(--text-muted)', marginRight: '6px' }}>#{s.set_number}</span>
                              <strong style={{ color: 'var(--text-primary)' }}>{s.weight_kg}kg</strong> × {s.reps}
                              {s.set_type !== 'NORMAL' && (
                                <span style={{ marginLeft: '4px', fontSize: '0.6875rem', color: 'var(--color-cyan)' }}>({s.set_type})</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
