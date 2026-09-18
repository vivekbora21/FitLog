'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, UserCheck, Dumbbell, Trophy, Scale, Calendar } from 'lucide-react';
import { api } from '@/lib/api';
import { WorkoutSession, WeightEntry, PersonalRecord } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { MetricChart } from '@/components/MetricChart';

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;

  const [workouts, setWorkouts] = useState<WorkoutSession[]>([]);
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [prs, setPrs] = useState<PersonalRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadClientData() {
      try {
        const [wData, wtData, prData] = await Promise.all([
          api.getWorkouts(clientId),
          api.getWeights(clientId),
          api.getPersonalRecords(clientId),
        ]);
        setWorkouts(wData.results || wData);
        setWeights(wtData.results || wtData);
        setPrs(prData.results || prData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (clientId) {
      loadClientData();
    }
  }, [clientId]);

  const chartData = [...weights]
    .reverse()
    .map((w) => ({
      label: new Date(w.date).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }),
      value: w.weight_kg,
    }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <button
        onClick={() => router.back()}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: 'transparent',
          border: 'none',
          color: 'var(--color-primary-light)',
          cursor: 'pointer',
          fontSize: '0.875rem',
          fontWeight: 600,
          width: 'fit-content',
        }}
      >
        <ArrowLeft size={16} />
        <span>Back to Client Roster</span>
      </button>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UserCheck size={28} color="var(--color-primary)" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '1.75rem' }}>Client Fitness Profile</h1>
              <Badge variant="emerald">Shared Workouts Active</Badge>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '2px' }}>
              Inspecting verified training volume, progressive overload, and weight trend.
            </p>
          </div>
        </div>
      </div>

      {/* Weight Trend */}
      <Card elevated>
        <MetricChart
          data={chartData}
          title="Client Body Weight Trend (kg)"
          unit="kg"
          type="line"
          color="#10B981"
          height={220}
        />
      </Card>

      {/* Personal Records */}
      <div>
        <h2 style={{ fontSize: '1.35rem', marginBottom: '1rem' }}>Client Personal Records</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          {prs.map((pr) => (
            <Card key={pr.id}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{pr.exercise_name}</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
                {pr.max_weight_kg}kg × {pr.reps}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-cyan)', marginTop: '2px' }}>
                Est 1RM: {pr.estimated_one_rep_max} kg
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Completed Workout Logs */}
      <div>
        <h2 style={{ fontSize: '1.35rem', marginBottom: '1rem' }}>Completed Workouts Log</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {workouts.map((w) => (
            <Card key={w.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem' }}>{w.title}</h3>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    {new Date(w.started_at).toLocaleDateString()} • {Math.round(w.duration_seconds / 60)} mins
                    {w.overall_rpe && ` • RPE ${w.overall_rpe}/10`}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary-light)' }}>
                    {w.total_volume_kg.toLocaleString()} kg
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Volume</div>
                </div>
              </div>

              {w.notes && (
                <p style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic', background: 'var(--bg-surface-elevated)', padding: '6px 10px', borderRadius: 'var(--radius-sm)' }}>
                  Athlete note: "{w.notes}"
                </p>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
