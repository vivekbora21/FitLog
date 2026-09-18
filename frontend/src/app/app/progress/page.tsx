'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { TrendingUp, Plus, Scale, Trophy, Ruler, Calendar, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';
import { WeightEntry, BodyMeasurement, PersonalRecord } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { MetricChart } from '@/components/MetricChart';

export default function ProgressPage() {
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [prs, setPrs] = useState<PersonalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [logWeightModal, setLogWeightModal] = useState(false);

  // Form
  const [newWeight, setNewWeight] = useState<number>(80.0);
  const [newBf, setNewBf] = useState<number>(14.0);
  const [newNotes, setNewNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const loadProgress = async () => {
    try {
      const [wData, mData, prData] = await Promise.all([
        api.getWeights(),
        api.getMeasurements(),
        api.getPersonalRecords(),
      ]);
      setWeights(wData.results || wData);
      setMeasurements(mData.results || mData);
      setPrs(prData.results || prData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProgress();
  }, []);

  const handleLogWeight = async () => {
    if (!newWeight) return;
    setSaving(true);
    try {
      await api.logWeight(newWeight, newBf, newNotes);
      setLogWeightModal(false);
      setNewNotes('');
      loadProgress();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Prepare chart data (reverse so oldest is left, newest is right)
  const chartData = [...weights]
    .reverse()
    .map((w) => ({
      label: new Date(w.date).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }),
      value: w.weight_kg,
    }));

  const currentWeight = weights.length > 0 ? weights[0].weight_kg : 0;
  const startWeight = weights.length > 0 ? weights[weights.length - 1].weight_kg : 0;
  const delta = currentWeight && startWeight ? (currentWeight - startWeight).toFixed(1) : '0';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem' }}>Progress & Analytics</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '4px' }}>
            Quantitative body composition changes, weight trends, and 1RM strength progression.
          </p>
        </div>

        <Button variant="primary" onClick={() => setLogWeightModal(true)}>
          <Plus size={16} />
          <span>Log Weight</span>
        </Button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        <Card hoverable style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Scale size={26} color="var(--color-primary)" />
          </div>
          <div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Current Weight</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'Outfit, sans-serif' }}>
              {currentWeight} <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>kg</span>
            </div>
          </div>
        </Card>

        <Card hoverable style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp size={26} color="var(--color-cyan)" />
          </div>
          <div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>14-Day Change</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: Number(delta) <= 0 ? 'var(--color-primary-light)' : 'var(--color-amber)', fontFamily: 'Outfit, sans-serif' }}>
              {Number(delta) > 0 ? `+${delta}` : delta} <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>kg</span>
            </div>
          </div>
        </Card>

        <Card hoverable style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Trophy size={26} color="#FBBF24" />
          </div>
          <div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Personal Records</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'Outfit, sans-serif' }}>
              {prs.length} <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>All-Time</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Weight Trend Chart */}
      <Card elevated>
        <MetricChart
          data={chartData}
          title="Body Weight Progression (kg)"
          unit="kg"
          type="line"
          color="#10B981"
          height={240}
        />
      </Card>

      {/* Personal Records 1RM Hall of Fame */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
          <Trophy size={20} color="var(--color-primary)" />
          <h2 style={{ fontSize: '1.35rem' }}>Personal Records & Estimated 1RMs</h2>
        </div>

        <Card>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th style={{ padding: '10px' }}>Exercise</th>
                  <th style={{ padding: '10px' }}>Muscle Group</th>
                  <th style={{ padding: '10px' }}>Best Lift</th>
                  <th style={{ padding: '10px' }}>Estimated 1RM</th>
                  <th style={{ padding: '10px' }}>Date Achieved</th>
                </tr>
              </thead>
              <tbody>
                {prs.map((pr) => (
                  <tr key={pr.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '12px 10px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {pr.exercise_name}
                    </td>
                    <td style={{ padding: '12px 10px' }}>
                      <Badge variant="emerald">{pr.primary_muscle}</Badge>
                    </td>
                    <td style={{ padding: '12px 10px', fontWeight: 700 }}>
                      <span style={{ color: 'var(--color-cyan)' }}>{pr.max_weight_kg} kg</span> × {pr.reps} reps
                    </td>
                    <td style={{ padding: '12px 10px', fontWeight: 800, color: 'var(--color-primary)', fontSize: '1rem' }}>
                      {pr.estimated_one_rep_max} kg
                    </td>
                    <td style={{ padding: '12px 10px', color: 'var(--text-muted)' }}>
                      {pr.achieved_at}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Body Measurements */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Ruler size={20} color="var(--color-cyan)" />
            <h2 style={{ fontSize: '1.35rem' }}>Body Circumference Measurements</h2>
          </div>
          <Link
            href="/app/measurements"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: 'var(--color-primary)',
              textDecoration: 'none',
              padding: '6px 12px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              transition: 'all 0.2s ease',
            }}
          >
            <span>Full Measurements &amp; Analytics</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <Card>
          {measurements.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No circumference logs recorded.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
              {measurements.map((m) => (
                <div key={m.id} style={{ padding: '12px 14px', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{m.date}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px', fontSize: '0.85rem' }}>
                    {m.chest_cm && <div>Chest: <strong>{m.chest_cm} cm</strong></div>}
                    {m.waist_cm && <div>Waist: <strong>{m.waist_cm} cm</strong></div>}
                    {m.shoulders_cm && <div>Shoulders: <strong>{m.shoulders_cm} cm</strong></div>}
                    {m.arms_cm && <div>Arms: <strong>{m.arms_cm} cm</strong></div>}
                    {m.thighs_cm && <div>Thighs: <strong>{m.thighs_cm} cm</strong></div>}
                    {m.calves_cm && <div>Calves: <strong>{m.calves_cm} cm</strong></div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* 60-Day Target & Milestone Checkpoints */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
          <Calendar size={20} color="var(--color-primary)" />
          <h2 style={{ fontSize: '1.35rem' }}>60-Day Target &amp; Milestone Checkpoints</h2>
        </div>
        <Card>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Starting Weight</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '.25rem' }}>77.76 kg</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>60-Day Target Range</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '.25rem', color: 'var(--color-primary)' }}>73.5 &ndash; 74.5 kg</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Expected Loss</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '.25rem' }}>-3.5 to -4.5 kg</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Starting Waist</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '.25rem' }}>93 cm</div>
            </div>
          </div>
          <div style={{ display: 'grid', gap: 0, borderTop: '1px solid var(--border-subtle)' }}>
            {[
              ['Day 15', 'Quarter milestone check-in', 'Evaluate water flush and midsection tightness.'],
              ['Day 30', 'Halfway milestone', 'Halfway evaluation: abdominal fat reduction vs strength preservation.'],
              ['Day 45', 'Three-quarter transformation check', '3/4 mark: shoulder/chest definition, vascularity, waist taper.'],
              ['Day 60', 'Final transformation reveal', 'Final check: compare side-by-side with the Day 1 baseline.'],
            ].map(([day, title, note]) => (
              <div key={day} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 2fr', gap: '1rem', padding: '.7rem 0', borderBottom: '1px solid var(--border-subtle)', fontSize: '.85rem' }}>
                <strong style={{ color: 'var(--color-primary)' }}>{day}</strong>
                <strong>{title}</strong>
                <span style={{ color: 'var(--text-secondary)' }}>{note}</span>
              </div>
            ))}
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '.78rem', marginTop: '.85rem' }}>
            Take front, side and back photos on Days 1, 15, 30, 45 and 60 under consistent lighting and a relaxed posture.
          </p>
        </Card>
      </div>

      {/* Log Weight Modal */}
      <Modal isOpen={logWeightModal} onClose={() => setLogWeightModal(false)} title="Log Daily Weight">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Weight (kg)
            </label>
            <input
              type="number"
              step="0.1"
              value={newWeight}
              onChange={(e) => setNewWeight(parseFloat(e.target.value) || 0)}
              style={{
                width: '100%',
                marginTop: '4px',
                padding: '8px 12px',
                background: '#FFFFFF',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                fontSize: '1.1rem',
                fontWeight: 700,
                outline: 'none',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Body Fat % (Optional)
            </label>
            <input
              type="number"
              step="0.1"
              value={newBf}
              onChange={(e) => setNewBf(parseFloat(e.target.value) || 0)}
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
              Notes
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Morning weighed fasted after workout day..."
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
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

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1rem' }}>
            <Button variant="secondary" onClick={() => setLogWeightModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleLogWeight} disabled={saving}>
              {saving ? 'Logging...' : 'Save Entry'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
