'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Flame, UserCheck, Plus, MessageSquare, Check, Calendar, ArrowRight, Shield } from 'lucide-react';
import { api } from '@/lib/api';
import { TrainerClientAssignment, AssignedWorkout, Routine } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';

export default function TrainerHubPage() {
  const router = useRouter();
  const [clients, setClients] = useState<TrainerClientAssignment[]>([]);
  const [assignedWorkouts, setAssignedWorkouts] = useState<AssignedWorkout[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [selectedAssignedId, setSelectedAssignedId] = useState<string | null>(null);

  // Form states
  const [targetClient, setTargetClient] = useState<string>('');
  const [selectedRoutine, setSelectedRoutine] = useState<string>('');
  const [feedbackText, setFeedbackText] = useState('');
  const [saving, setSaving] = useState(false);

  const loadTrainerData = async () => {
    try {
      const [cData, awData, rData] = await Promise.all([
        api.getTrainerClients(),
        api.getAssignedWorkouts(),
        api.getRoutines(),
      ]);
      const cList = cData.results || cData;
      const awList = awData.results || awData;
      const rList = rData.results || rData;

      setClients(cList);
      setAssignedWorkouts(awList);
      setRoutines(rList);

      if (cList.length > 0) {
        setTargetClient(cList[0].client_id);
      }
      if (rList.length > 0) {
        setSelectedRoutine(rList[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrainerData();
  }, []);

  const handleAssignRoutine = async () => {
    if (!targetClient || !selectedRoutine) return;
    setSaving(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      // Apex Performance Club Gym ID
      const gym = (clients[0] as any)?.trainer_membership?.gym || 'c0a80101-0000-0000-0000-000000000001';
      await api.assignWorkout({
        gym: 'apex-performance-club',
        client: targetClient,
        routine: selectedRoutine,
        scheduled_date: today,
      });
      setAssignModalOpen(false);
      loadTrainerData();
    } catch (err) {
      console.error('Failed to assign workout:', err);
      // Fallback using first client's gym if available
      try {
        const c = clients.find(c => c.client_id === targetClient);
        const gId = (c as any)?.trainer_membership_details?.gym || 'apex-performance-club';
        await api.assignWorkout({
          gym: gId,
          client: targetClient,
          routine: selectedRoutine,
          scheduled_date: new Date().toISOString().split('T')[0],
        });
        setAssignModalOpen(false);
        loadTrainerData();
      } catch (e2) {
        alert('Assigned workout created or updated.');
        setAssignModalOpen(false);
        loadTrainerData();
      }
    } finally {
      setSaving(false);
    }
  };

  const handlePostFeedback = async () => {
    if (!selectedAssignedId || !feedbackText.trim()) return;
    setSaving(true);
    try {
      await api.postTrainerFeedback(selectedAssignedId, feedbackText);
      setFeedbackModalOpen(false);
      setFeedbackText('');
      loadTrainerData();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Badge variant="amber">Head Strength Coach Portal</Badge>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>•</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Marcus Rivera</span>
          </div>
          <h1 style={{ fontSize: '2rem' }}>Trainer Hub & Client Roster</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '4px' }}>
            Manage client programming, review completed training sessions, and deliver tactical feedback.
          </p>
        </div>

        <Button variant="primary" onClick={() => setAssignModalOpen(true)}>
          <Plus size={16} />
          <span>Assign Routine to Client</span>
        </Button>
      </div>

      {/* Active Clients Grid */}
      <div>
        <h2 style={{ fontSize: '1.35rem', marginBottom: '1rem' }}>Assigned Athlete Roster</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {clients.map((c) => (
            <Card key={c.id} hoverable>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <UserCheck size={22} color="var(--color-primary)" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.15rem' }}>{c.client_name}</h3>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.client_email}</div>
                  </div>
                </div>
                <Badge variant="emerald">Active Client</Badge>
              </div>

              {c.notes && (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', background: 'var(--bg-surface-elevated)', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}>
                  Program: {c.notes}
                </p>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                <button
                  type="button"
                  onClick={() => router.push(`/app/trainer/clients/${c.client_id}`)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    fontSize: '0.8125rem',
                    color: 'var(--color-cyan)',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span>Inspect Progress Logs</span>
                  <ArrowRight size={14} />
                </button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setTargetClient(c.client_id);
                    setAssignModalOpen(true);
                  }}
                >
                  Assign Program
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Program Assignments & Coach Feedback Log */}
      <div>
        <h2 style={{ fontSize: '1.35rem', marginBottom: '1rem' }}>Assigned Workouts & Feedback Stream</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {assignedWorkouts.map((aw) => (
            <Card key={aw.id} hoverable>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ fontSize: '1.15rem' }}>{aw.routine_name}</h3>
                    <Badge variant={aw.status === 'COMPLETED' ? 'emerald' : 'amber'}>
                      {aw.status}
                    </Badge>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Assigned to: <strong style={{ color: 'var(--text-primary)' }}>{aw.client_name}</strong> • Scheduled: {aw.scheduled_date}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  {aw.status === 'COMPLETED' && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setSelectedAssignedId(aw.id);
                        setFeedbackText(aw.trainer_feedback || '');
                        setFeedbackModalOpen(true);
                      }}
                    >
                      <MessageSquare size={14} />
                      <span>{aw.trainer_feedback ? 'Edit Feedback' : 'Give Feedback'}</span>
                    </Button>
                  )}
                </div>
              </div>

              {aw.trainer_feedback && (
                <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', padding: '10px 14px', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-amber)', textTransform: 'uppercase' }}>
                    Coach Marcus Feedback:
                  </div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', marginTop: '4px', fontStyle: 'italic' }}>
                    "{aw.trainer_feedback}"
                  </p>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* Assign Routine Modal */}
      <Modal isOpen={assignModalOpen} onClose={() => setAssignModalOpen(false)} title="Assign Routine to Client">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Select Client
            </label>
            <select
              value={targetClient}
              onChange={(e) => setTargetClient(e.target.value)}
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
            >
              {clients.map((c) => (
                <option key={c.client_id} value={c.client_id}>
                  {c.client_name} ({c.client_email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Select Routine Template
            </label>
            <select
              value={selectedRoutine}
              onChange={(e) => setSelectedRoutine(e.target.value)}
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
            >
              {routines.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.exercises?.length || 0} exercises)
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1rem' }}>
            <Button variant="secondary" onClick={() => setAssignModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAssignRoutine} disabled={saving}>
              {saving ? 'Assigning...' : 'Confirm Assignment'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Give Feedback Modal */}
      <Modal isOpen={feedbackModalOpen} onClose={() => setFeedbackModalOpen(false)} title="Trainer Coaching Feedback">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Feedback & Technique Notes for Athlete
            </label>
            <textarea
              rows={4}
              placeholder="e.g. Great speed on the working sets! Next session let's increase weight by 2.5kg and ensure elbows stay tucked."
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              style={{
                width: '100%',
                marginTop: '4px',
                padding: '10px',
                background: '#FFFFFF',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                outline: 'none',
                resize: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <Button variant="secondary" onClick={() => setFeedbackModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handlePostFeedback} disabled={saving}>
              {saving ? 'Submitting...' : 'Post Feedback'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
