'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Ruler,
  Plus,
  TrendingDown,
  TrendingUp,
  Sparkles,
  ArrowRight,
  ArrowLeftRight,
  Calendar,
  Layers,
  Activity,
  Edit2,
  Trash2,
  CheckCircle2,
  HelpCircle,
  Percent,
} from 'lucide-react';
import { api } from '@/lib/api';
import { BodyMeasurement } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { MetricChart } from '@/components/MetricChart';

type UnitMode = 'cm' | 'in';

interface MetricMeta {
  key: keyof BodyMeasurement;
  label: string;
  category: 'torso' | 'arms' | 'legs';
  targetType: 'hypertrophy' | 'reduction' | 'neutral'; // determines whether growth is green
  description: string;
}

const METRIC_DEFINITIONS: MetricMeta[] = [
  { key: 'shoulders_cm', label: 'Shoulders', category: 'torso', targetType: 'hypertrophy', description: 'Circumference across deltoids for V-taper frame' },
  { key: 'chest_cm', label: 'Chest', category: 'torso', targetType: 'hypertrophy', description: 'Measured across nipple line at normal exhale' },
  { key: 'waist_cm', label: 'Waist', category: 'torso', targetType: 'reduction', description: 'Narrowest point / navel level at morning fasting' },
  { key: 'hips_cm', label: 'Hips', category: 'torso', targetType: 'reduction', description: 'Widest point around glutes and pelvic crest' },
  { key: 'arms_cm', label: 'Arms / Biceps', category: 'arms', targetType: 'hypertrophy', description: 'Peak flexed bicep circumference' },
  { key: 'forearms_cm', label: 'Forearms', category: 'arms', targetType: 'hypertrophy', description: 'Widest flexed point below elbow' },
  { key: 'thighs_cm', label: 'Thighs', category: 'legs', targetType: 'hypertrophy', description: 'Midpoint between hip crease and top of knee' },
  { key: 'calves_cm', label: 'Calves', category: 'legs', targetType: 'hypertrophy', description: 'Widest point of the gastrocnemius' },
  { key: 'neck_cm', label: 'Neck', category: 'torso', targetType: 'neutral', description: 'Just below the larynx / Adam’s apple' },
];

export default function BodyMeasurementsPage() {
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [unit, setUnit] = useState<UnitMode>('cm');
  const [selectedMetricKey, setSelectedMetricKey] = useState<keyof BodyMeasurement>('waist_cm');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Comparison State
  const [compareDateA, setCompareDateA] = useState<string>('');
  const [compareDateB, setCompareDateB] = useState<string>('');

  // Form State
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formNotes, setFormNotes] = useState<string>('');
  const [formValues, setFormValues] = useState<Record<string, string>>({
    neck_cm: '',
    shoulders_cm: '',
    chest_cm: '',
    waist_cm: '',
    hips_cm: '',
    arms_cm: '',
    biceps_left_cm: '',
    biceps_right_cm: '',
    forearms_cm: '',
    thighs_cm: '',
    thigh_left_cm: '',
    thigh_right_cm: '',
    calves_cm: '',
    calf_left_cm: '',
    calf_right_cm: '',
  });

  const loadData = async () => {
    try {
      const data = await api.getMeasurements();
      const list: BodyMeasurement[] = Array.isArray(data) ? data : data.results || [];
      // Sort oldest to newest for chronological calculations, but state will keep original order
      setMeasurements(list);
      if (list.length >= 2) {
        setCompareDateA(list[list.length - 1].date); // baseline (oldest)
        setCompareDateB(list[0].date); // latest
      } else if (list.length === 1) {
        setCompareDateA(list[0].date);
        setCompareDateB(list[0].date);
      }
    } catch (err) {
      console.error('Failed to load measurements', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Conversion Helpers
  const toDisplayValue = (valInCm?: number | null): string => {
    if (valInCm === undefined || valInCm === null || isNaN(valInCm)) return '—';
    if (unit === 'cm') return `${valInCm.toFixed(1)}`;
    const inches = valInCm / 2.54;
    return `${inches.toFixed(1)}`;
  };

  const toDisplayNumber = (valInCm?: number | null): number | null => {
    if (valInCm === undefined || valInCm === null || isNaN(valInCm)) return null;
    if (unit === 'cm') return Number(valInCm.toFixed(1));
    return Number((valInCm / 2.54).toFixed(1));
  };

  // Convert input value to CM for saving
  const inputToCm = (valStr: string): number | null => {
    const parsed = parseFloat(valStr);
    if (isNaN(parsed)) return null;
    if (unit === 'cm') return parsed;
    return parseFloat((parsed * 2.54).toFixed(2));
  };

  // Chronological list (oldest to newest)
  const chronological = useMemo(() => {
    return [...measurements].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [measurements]);

  const latest = chronological.length > 0 ? chronological[chronological.length - 1] : null;
  const baseline = chronological.length > 0 ? chronological[0] : null;

  // Key Ratios
  const vTaperRatio = useMemo(() => {
    if (!latest?.shoulders_cm || !latest?.waist_cm) return null;
    return Number((latest.shoulders_cm / latest.waist_cm).toFixed(2));
  }, [latest]);

  const chestToWaistRatio = useMemo(() => {
    if (!latest?.chest_cm || !latest?.waist_cm) return null;
    return Number((latest.chest_cm / latest.waist_cm).toFixed(2));
  }, [latest]);

  const waistToHipRatio = useMemo(() => {
    if (!latest?.waist_cm || !latest?.hips_cm) return null;
    return Number((latest.waist_cm / latest.hips_cm).toFixed(2));
  }, [latest]);

  // Chart Data for Selected Metric
  const selectedMetricMeta = METRIC_DEFINITIONS.find((m) => m.key === selectedMetricKey) || METRIC_DEFINITIONS[0];
  const chartData = useMemo(() => {
    return chronological
      .filter((m) => m[selectedMetricKey] !== undefined && m[selectedMetricKey] !== null)
      .map((m) => {
        const val = toDisplayNumber(m[selectedMetricKey] as number);
        return {
          label: new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          value: val || 0,
        };
      });
  }, [chronological, selectedMetricKey, unit]);

  // Bilateral Symmetry Data
  const symmetryData = useMemo(() => {
    if (!latest) return null;
    const compute = (left?: number | null, right?: number | null, label = '') => {
      if (!left || !right) return null;
      const diff = Math.abs(left - right);
      const avg = (left + right) / 2;
      const diffPct = ((diff / avg) * 100).toFixed(1);
      const isBalanced = diff <= 0.4;
      return {
        label,
        left: toDisplayValue(left),
        right: toDisplayValue(right),
        diff: toDisplayValue(diff),
        diffPct,
        isBalanced,
      };
    };
    return {
      arms: compute(latest.biceps_left_cm, latest.biceps_right_cm, 'Biceps / Arms'),
      thighs: compute(latest.thigh_left_cm, latest.thigh_right_cm, 'Thighs / Quads'),
      calves: compute(latest.calf_left_cm, latest.calf_right_cm, 'Calves'),
    };
  }, [latest, unit]);

  // Comparison calculation
  const measurementA = chronological.find((m) => m.date === compareDateA);
  const measurementB = chronological.find((m) => m.date === compareDateB);

  // Form Handlers
  const handleOpenNewModal = () => {
    setEditingId(null);
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormNotes('');
    setFormValues({
      neck_cm: '',
      shoulders_cm: '',
      chest_cm: '',
      waist_cm: '',
      hips_cm: '',
      arms_cm: '',
      biceps_left_cm: '',
      biceps_right_cm: '',
      forearms_cm: '',
      thighs_cm: '',
      thigh_left_cm: '',
      thigh_right_cm: '',
      calves_cm: '',
      calf_left_cm: '',
      calf_right_cm: '',
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (item: BodyMeasurement) => {
    setEditingId(item.id);
    setFormDate(item.date);
    setFormNotes(item.notes || '');
    const newVals: Record<string, string> = {};
    const keys: (keyof BodyMeasurement)[] = [
      'neck_cm',
      'shoulders_cm',
      'chest_cm',
      'waist_cm',
      'hips_cm',
      'arms_cm',
      'biceps_left_cm',
      'biceps_right_cm',
      'forearms_cm',
      'thighs_cm',
      'thigh_left_cm',
      'thigh_right_cm',
      'calves_cm',
      'calf_left_cm',
      'calf_right_cm',
    ];
    keys.forEach((k) => {
      const val = item[k];
      if (typeof val === 'number') {
        newVals[k] = unit === 'cm' ? val.toString() : (val / 2.54).toFixed(1);
      } else {
        newVals[k] = '';
      }
    });
    setFormValues(newVals);
    setModalOpen(true);
  };

  const handleSaveMeasurement = async () => {
    setSubmitting(true);
    try {
      const payload: Record<string, any> = {
        date: formDate,
        notes: formNotes,
      };

      Object.entries(formValues).forEach(([key, strVal]) => {
        if (strVal.trim() !== '') {
          const valInCm = inputToCm(strVal);
          if (valInCm !== null) {
            payload[key] = valInCm;
          }
        } else {
          payload[key] = null;
        }
      });

      if (editingId) {
        await api.updateMeasurement(editingId, payload);
      } else {
        await api.logMeasurement(payload);
      }
      setModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Failed to save body measurement', err);
      alert('Failed to save body measurement. Please check your inputs and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteMeasurement(id);
      setDeleteConfirmId(null);
      loadData();
    } catch (err) {
      console.error('Failed to delete measurement', err);
      alert('Failed to delete measurement.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Top Header & Action Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'rgba(6, 182, 212, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ruler size={22} color="var(--color-cyan)" />
            </div>
            <h1 style={{ fontSize: '2rem', margin: 0 }}>Body Measurements</h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '6px' }}>
            Circumference metrics, V-taper symmetry ratios, and structural muscle hypertrophy progression.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          {/* Unit Toggle Switch */}
          <div
            style={{
              display: 'inline-flex',
              padding: '3px',
              background: 'var(--bg-surface-elevated)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <button
              onClick={() => setUnit('cm')}
              style={{
                padding: '6px 14px',
                borderRadius: 'calc(var(--radius-md) - 2px)',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.825rem',
                fontWeight: 700,
                transition: 'all 0.2s ease',
                background: unit === 'cm' ? 'var(--color-primary)' : 'transparent',
                color: unit === 'cm' ? '#ffffff' : 'var(--text-muted)',
              }}
            >
              CM
            </button>
            <button
              onClick={() => setUnit('in')}
              style={{
                padding: '6px 14px',
                borderRadius: 'calc(var(--radius-md) - 2px)',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.825rem',
                fontWeight: 700,
                transition: 'all 0.2s ease',
                background: unit === 'in' ? 'var(--color-primary)' : 'transparent',
                color: unit === 'in' ? '#ffffff' : 'var(--text-muted)',
              }}
            >
              INCHES
            </button>
          </div>

          <Button variant="primary" onClick={handleOpenNewModal}>
            <Plus size={16} />
            <span>Log Check-in</span>
          </Button>
        </div>
      </div>

      {/* KPI Aesthetic & Composition Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
        {/* V-Taper Card */}
        <Card hoverable style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>
              V-Taper (Adonis Ratio)
            </span>
            <Badge variant="cyan">Shoulder / Waist</Badge>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
            <span style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>
              {vTaperRatio !== null ? vTaperRatio : '—'}
            </span>
            <span style={{ fontSize: '0.875rem', color: 'var(--color-primary)', fontWeight: 600 }}>Target: 1.618</span>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
            {vTaperRatio && vTaperRatio >= 1.5
              ? 'Excellent athletic V-taper taper aesthetic.'
              : 'Keep increasing shoulder width while tightening the midsection.'}
          </p>
        </Card>

        {/* Chest-to-Waist Ratio Card */}
        <Card hoverable style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>
              Chest-to-Waist Ratio
            </span>
            <Badge variant="emerald">Torso Taper</Badge>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
            <span style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>
              {chestToWaistRatio !== null ? chestToWaistRatio : '—'}
            </span>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Target: &gt; 1.25</span>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
            Pectoral & lat mass expansion relative to abdominal circumference.
          </p>
        </Card>

        {/* Waist-to-Hip Ratio (WHR) */}
        <Card hoverable style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>
              Waist-to-Hip Ratio
            </span>
            <Badge variant="violet">Health &amp; Leanness</Badge>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
            <span style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>
              {waistToHipRatio !== null ? waistToHipRatio : '—'}
            </span>
            <span style={{ fontSize: '0.875rem', color: 'var(--color-primary)', fontWeight: 600 }}>Healthy: &lt; 0.90</span>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
            Visceral abdominal fat distribution benchmark.
          </p>
        </Card>

        {/* Waist Tightening Delta */}
        <Card hoverable style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>
              Total Waist Delta
            </span>
            <Badge variant="amber">Since Day 1</Badge>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
            {latest?.waist_cm && baseline?.waist_cm ? (
              (() => {
                const diffCm = latest.waist_cm - baseline.waist_cm;
                const diffDisp = unit === 'cm' ? diffCm.toFixed(1) : (diffCm / 2.54).toFixed(1);
                const isLoss = diffCm < 0;
                return (
                  <>
                    <span
                      style={{
                        fontSize: '2rem',
                        fontWeight: 800,
                        fontFamily: 'Outfit, sans-serif',
                        color: isLoss ? 'var(--color-primary)' : 'var(--color-amber)',
                      }}
                    >
                      {diffCm > 0 ? `+${diffDisp}` : diffDisp} {unit}
                    </span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      ({((diffCm / baseline.waist_cm) * 100).toFixed(1)}%)
                    </span>
                  </>
                );
              })()
            ) : (
              <span style={{ fontSize: '2rem', fontWeight: 800 }}>—</span>
            )}
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
            Tightening midsection indicates core fat shedding while retaining muscle.
          </p>
        </Card>
      </div>

      {/* Main Grid: Body Part Anatomical Cards + Interactive Progression Chart */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
        {/* Anatomical Metric Selector Cards */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Tracked Anatomical Sites</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Click any body part to visualize historical trends on the timeline chart below.
              </p>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Showing {METRIC_DEFINITIONS.length} key points
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
            }}
          >
            {METRIC_DEFINITIONS.map((def) => {
              const isSelected = selectedMetricKey === def.key;
              const currentValCm = latest?.[def.key] as number | undefined | null;
              const baselineValCm = baseline?.[def.key] as number | undefined | null;

              let deltaStr = '—';
              let deltaColor = 'var(--text-muted)';
              if (currentValCm && baselineValCm && currentValCm !== baselineValCm) {
                const diffCm = currentValCm - baselineValCm;
                const diffDisp = unit === 'cm' ? diffCm.toFixed(1) : (diffCm / 2.54).toFixed(1);
                const isPositive = diffCm > 0;
                deltaStr = isPositive ? `+${diffDisp} ${unit}` : `${diffDisp} ${unit}`;

                if (def.targetType === 'hypertrophy') {
                  deltaColor = isPositive ? 'var(--color-primary)' : 'var(--color-amber)';
                } else if (def.targetType === 'reduction') {
                  deltaColor = !isPositive ? 'var(--color-primary)' : 'var(--color-amber)';
                } else {
                  deltaColor = 'var(--color-cyan)';
                }
              }

              return (
                <div
                  key={def.key}
                  onClick={() => setSelectedMetricKey(def.key)}
                  style={{
                    cursor: 'pointer',
                    padding: '16px',
                    borderRadius: 'var(--radius-lg)',
                    background: isSelected ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-surface)',
                    border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--border-subtle)',
                    boxShadow: isSelected ? '0 0 15px rgba(16, 185, 129, 0.2)' : 'none',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 700, color: isSelected ? 'var(--color-primary)' : 'var(--text-primary)' }}>
                        {def.label}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                        {def.category}
                      </div>
                    </div>
                    {isSelected && (
                      <Badge variant="emerald" style={{ fontSize: '0.65rem' }}>
                        Active Chart
                      </Badge>
                    )}
                  </div>

                  <div>
                    <div style={{ fontSize: '1.65rem', fontWeight: 800, fontFamily: 'Outfit, sans-serif' }}>
                      {toDisplayValue(currentValCm)}{' '}
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        {unit}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', fontSize: '0.75rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>
                        Base: {toDisplayValue(baselineValCm)} {unit}
                      </span>
                      <span style={{ fontWeight: 700, color: deltaColor }}>{deltaStr}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Interactive Progression Chart */}
        <Card elevated>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={18} color="var(--color-primary)" />
                <h3 style={{ fontSize: '1.15rem', margin: 0 }}>
                  {selectedMetricMeta.label} Progression Over Time
                </h3>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {selectedMetricMeta.description}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Data Points:
              </span>
              <Badge variant="cyan">{chartData.length} Logs</Badge>
            </div>
          </div>

          <MetricChart
            data={chartData}
            title={`${selectedMetricMeta.label} (${unit.toUpperCase()})`}
            unit={unit}
            type="line"
            color={selectedMetricMeta.targetType === 'reduction' ? '#06B6D4' : '#10B981'}
            height={260}
            emptyMessage={`No measurements recorded yet for ${selectedMetricMeta.label}. Click "Log Check-in" above!`}
          />
        </Card>
      </div>

      {/* Bilateral Symmetry & Balance Analysis */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
          <ArrowLeftRight size={20} color="var(--color-primary)" />
          <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Bilateral Symmetry &amp; Muscular Balance</h2>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px', marginBottom: '1rem' }}>
          Comparing left vs. right limb development to catch imbalances before they cause injury or postural distortion.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
          {[
            { title: 'Arms / Biceps', data: symmetryData?.arms },
            { title: 'Thighs / Quads', data: symmetryData?.thighs },
            { title: 'Calves', data: symmetryData?.calves },
          ].map((item) => (
            <Card key={item.title} hoverable>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{item.title}</span>
                {item.data ? (
                  item.data.isBalanced ? (
                    <Badge variant="emerald">Balanced</Badge>
                  ) : (
                    <Badge variant="amber">Slight Asymmetry</Badge>
                  )
                ) : (
                  <Badge variant="cyan">Unlogged</Badge>
                )}
              </div>

              {item.data ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div style={{ background: 'var(--bg-surface-elevated)', padding: '10px 12px', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>LEFT</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '2px' }}>
                        {item.data.left} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{unit}</span>
                      </div>
                    </div>
                    <div style={{ background: 'var(--bg-surface-elevated)', padding: '10px 12px', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>RIGHT</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '2px' }}>
                        {item.data.right} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{unit}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <span>Delta: {item.data.diff} {unit}</span>
                    <span>Variance: {item.data.diffPct}%</span>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '1.25rem 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  Log both left &amp; right measurements during check-in to enable bilateral analysis.
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* Side-by-Side Date Comparison Tool */}
      {measurements.length >= 2 && (
        <Card elevated>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={18} color="var(--color-primary)" />
                <h3 style={{ fontSize: '1.15rem', margin: 0 }}>Side-by-Side Milestone Comparison</h3>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Compare body metrics across any two checkpoint dates to evaluate phase transformations.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Baseline A:</span>
                <select
                  value={compareDateA}
                  onChange={(e) => setCompareDateA(e.target.value)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-surface-elevated)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.825rem',
                  }}
                >
                  {chronological.map((m) => (
                    <option key={m.id} value={m.date}>
                      {m.date}
                    </option>
                  ))}
                </select>
              </div>

              <span style={{ color: 'var(--text-muted)' }}>vs</span>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Checkpoint B:</span>
                <select
                  value={compareDateB}
                  onChange={(e) => setCompareDateB(e.target.value)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-surface-elevated)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.825rem',
                  }}
                >
                  {chronological.map((m) => (
                    <option key={m.id} value={m.date}>
                      {m.date}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '10px' }}>Body Site</th>
                  <th style={{ padding: '10px' }}>{compareDateA}</th>
                  <th style={{ padding: '10px' }}>{compareDateB}</th>
                  <th style={{ padding: '10px' }}>Net Delta</th>
                  <th style={{ padding: '10px' }}>% Change</th>
                </tr>
              </thead>
              <tbody>
                {METRIC_DEFINITIONS.map((def) => {
                  const valA = measurementA?.[def.key] as number | undefined | null;
                  const valB = measurementB?.[def.key] as number | undefined | null;

                  let delta = '—';
                  let pct = '—';
                  let deltaColor = 'var(--text-muted)';

                  if (valA && valB) {
                    const diffCm = valB - valA;
                    const diffDisp = unit === 'cm' ? diffCm.toFixed(1) : (diffCm / 2.54).toFixed(1);
                    delta = diffCm > 0 ? `+${diffDisp} ${unit}` : `${diffDisp} ${unit}`;
                    const pctVal = ((diffCm / valA) * 100).toFixed(1);
                    pct = `${diffCm > 0 ? `+${pctVal}` : pctVal}%`;

                    if (def.targetType === 'hypertrophy') {
                      deltaColor = diffCm > 0 ? 'var(--color-primary)' : diffCm < 0 ? 'var(--color-amber)' : 'var(--text-muted)';
                    } else if (def.targetType === 'reduction') {
                      deltaColor = diffCm < 0 ? 'var(--color-primary)' : diffCm > 0 ? 'var(--color-amber)' : 'var(--text-muted)';
                    } else {
                      deltaColor = 'var(--color-cyan)';
                    }
                  }

                  return (
                    <tr key={def.key} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '12px 10px', fontWeight: 600 }}>{def.label}</td>
                      <td style={{ padding: '12px 10px', color: 'var(--text-secondary)' }}>
                        {toDisplayValue(valA)} {unit}
                      </td>
                      <td style={{ padding: '12px 10px', fontWeight: 700 }}>
                        {toDisplayValue(valB)} {unit}
                      </td>
                      <td style={{ padding: '12px 10px', fontWeight: 700, color: deltaColor }}>
                        {delta}
                      </td>
                      <td style={{ padding: '12px 10px', fontWeight: 600, color: deltaColor }}>
                        {pct}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* History Log Table */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Check-in History Log</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Full chronological log of recorded body dimensions.
            </p>
          </div>
          <Button variant="outline" onClick={handleOpenNewModal}>
            <Plus size={14} />
            <span>Add Log</span>
          </Button>
        </div>

        <Card>
          {measurements.length === 0 ? (
            <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Ruler size={36} color="var(--border-subtle)" style={{ margin: '0 auto 1rem' }} />
              <p style={{ fontWeight: 600, fontSize: '1rem' }}>No measurement logs recorded yet</p>
              <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>
                Log your first check-in to start mapping your muscular and body composition trajectory.
              </p>
              <Button variant="primary" onClick={handleOpenNewModal} style={{ marginTop: '1rem' }}>
                <Plus size={16} />
                <span>Log Your Baseline Measurements</span>
              </Button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <th style={{ padding: '12px 10px' }}>Date</th>
                    <th style={{ padding: '12px 10px' }}>Shoulders</th>
                    <th style={{ padding: '12px 10px' }}>Chest</th>
                    <th style={{ padding: '12px 10px' }}>Waist</th>
                    <th style={{ padding: '12px 10px' }}>Hips</th>
                    <th style={{ padding: '12px 10px' }}>Arms</th>
                    <th style={{ padding: '12px 10px' }}>Thighs</th>
                    <th style={{ padding: '12px 10px' }}>Calves</th>
                    <th style={{ padding: '12px 10px' }}>Notes</th>
                    <th style={{ padding: '12px 10px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {measurements.map((m) => (
                    <tr key={m.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '12px 10px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {m.date}
                      </td>
                      <td style={{ padding: '12px 10px' }}>{toDisplayValue(m.shoulders_cm)}</td>
                      <td style={{ padding: '12px 10px' }}>{toDisplayValue(m.chest_cm)}</td>
                      <td style={{ padding: '12px 10px', fontWeight: 600, color: 'var(--color-primary)' }}>
                        {toDisplayValue(m.waist_cm)}
                      </td>
                      <td style={{ padding: '12px 10px' }}>{toDisplayValue(m.hips_cm)}</td>
                      <td style={{ padding: '12px 10px' }}>{toDisplayValue(m.arms_cm)}</td>
                      <td style={{ padding: '12px 10px' }}>{toDisplayValue(m.thighs_cm)}</td>
                      <td style={{ padding: '12px 10px' }}>{toDisplayValue(m.calves_cm)}</td>
                      <td style={{ padding: '12px 10px', color: 'var(--text-muted)', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {m.notes || '—'}
                      </td>
                      <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            onClick={() => handleOpenEditModal(m)}
                            title="Edit log"
                            style={{
                              padding: '6px',
                              background: 'transparent',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              color: 'var(--text-secondary)',
                            }}
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(m.id)}
                            title="Delete log"
                            style={{
                              padding: '6px',
                              background: 'transparent',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              color: '#EF4444',
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Log / Edit Measurement Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit Body Check-in' : 'Log New Body Measurements'}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxHeight: '72vh', overflowY: 'auto', paddingRight: '4px' }}>
          {/* Top Row: Date & Active Unit */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Check-in Date
              </label>
              <input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Unit Mode
              </label>
              <div style={{ display: 'flex', alignItems: 'center', height: '38px', gap: '8px' }}>
                <Badge variant={unit === 'cm' ? 'emerald' : 'cyan'}>
                  Entering in {unit.toUpperCase()}
                </Badge>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  (Toggle on main page to switch)
                </span>
              </div>
            </div>
          </div>

          {/* Torso & Core Section */}
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-primary)', marginBottom: '8px' }}>
              Torso &amp; Core
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
                  Waist ({unit})
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 82.5"
                  value={formValues.waist_cm}
                  onChange={(e) => setFormValues({ ...formValues, waist_cm: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
                  Chest ({unit})
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 104.0"
                  value={formValues.chest_cm}
                  onChange={(e) => setFormValues({ ...formValues, chest_cm: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
                  Shoulders ({unit})
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 120.0"
                  value={formValues.shoulders_cm}
                  onChange={(e) => setFormValues({ ...formValues, shoulders_cm: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
                  Hips ({unit})
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 98.0"
                  value={formValues.hips_cm}
                  onChange={(e) => setFormValues({ ...formValues, hips_cm: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
                  Neck ({unit})
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 38.5"
                  value={formValues.neck_cm}
                  onChange={(e) => setFormValues({ ...formValues, neck_cm: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Arms & Forearms Section */}
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-cyan)', marginBottom: '8px' }}>
              Arms &amp; Forearms
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
                  Arms / Biceps ({unit})
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 38.0"
                  value={formValues.arms_cm}
                  onChange={(e) => setFormValues({ ...formValues, arms_cm: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
                  Left Bicep ({unit})
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 37.8"
                  value={formValues.biceps_left_cm}
                  onChange={(e) => setFormValues({ ...formValues, biceps_left_cm: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
                  Right Bicep ({unit})
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 38.0"
                  value={formValues.biceps_right_cm}
                  onChange={(e) => setFormValues({ ...formValues, biceps_right_cm: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
                  Forearms ({unit})
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 31.5"
                  value={formValues.forearms_cm}
                  onChange={(e) => setFormValues({ ...formValues, forearms_cm: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Lower Body & Calves Section */}
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-violet)', marginBottom: '8px' }}>
              Lower Body &amp; Calves
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
                  Thighs ({unit})
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 58.5"
                  value={formValues.thighs_cm}
                  onChange={(e) => setFormValues({ ...formValues, thighs_cm: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
                  Left Thigh ({unit})
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 58.5"
                  value={formValues.thigh_left_cm}
                  onChange={(e) => setFormValues({ ...formValues, thigh_left_cm: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
                  Right Thigh ({unit})
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 58.7"
                  value={formValues.thigh_right_cm}
                  onChange={(e) => setFormValues({ ...formValues, thigh_right_cm: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
                  Calves ({unit})
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 37.5"
                  value={formValues.calves_cm}
                  onChange={(e) => setFormValues({ ...formValues, calves_cm: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
                  Left Calf ({unit})
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 37.5"
                  value={formValues.calf_left_cm}
                  onChange={(e) => setFormValues({ ...formValues, calf_left_cm: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
                  Right Calf ({unit})
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 37.5"
                  value={formValues.calf_right_cm}
                  onChange={(e) => setFormValues({ ...formValues, calf_right_cm: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Notes Section */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Check-in Notes &amp; Observations
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Fasted morning check-in. Vascularity noticeable on shoulders."
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
                resize: 'none',
              }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveMeasurement} disabled={submitting}>
              {submitting ? 'Saving...' : editingId ? 'Update Check-in' : 'Save Check-in'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        title="Delete Measurement Entry"
      >
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Are you sure you want to permanently delete this measurement check-in? This action cannot be undone.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
          <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
