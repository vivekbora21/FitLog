'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Dumbbell, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export default function LandingPage() {
  const router = useRouter();
  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at top, #EDF2F7 0%, #F8FAFC 70%)', color: 'var(--text-primary)' }}>
      {/* Top Bar */}
      <header style={{ maxWidth: '1280px', margin: '0 auto', padding: '1.75rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.4rem', fontWeight: 800 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(5, 150, 105, 0.3)' }}>
            <Dumbbell size={22} color="#FFFFFF" strokeWidth={2.5} />
          </div>
          <span>FIT<span style={{ color: 'var(--color-primary)' }}>LOG</span></span>
          <Badge variant="emerald">PostgreSQL Engine</Badge>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Button variant="secondary" onClick={() => router.push('/login')}>Log In</Button>
          <Button variant="primary" onClick={() => router.push('/signup')}>
            <span>Sign Up</span>
            <ArrowRight size={16} />
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ maxWidth: '1080px', margin: '0 auto', padding: '4rem 2rem 3rem 2rem', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '9999px', background: '#ECFDF5', border: '1px solid #A7F3D0', marginBottom: '1.5rem' }}>
          <Sparkles size={16} color="var(--color-primary)" />
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-primary)' }}>
            Domain-Driven Architecture • Lifetime Personal Data Ownership
          </span>
        </div>

        <h1 style={{ fontSize: 'clamp(2.5rem, 5.5vw, 4.25rem)', lineHeight: 1.1, marginBottom: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          The High-Performance <br />
          <span style={{ background: 'linear-gradient(135deg, #059669 0%, #0284C7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Gym & Fitness Platform
          </span>
        </h1>

        <p style={{ fontSize: '1.15rem', color: 'var(--text-secondary)', maxWidth: '680px', margin: '0 auto 2.5rem auto', lineHeight: 1.6 }}>
          Relational multi-tenant workout tracking, rest timers, live set logging, nutrition macro rings, and seamless trainer-client assignments powered by Django & PostgreSQL.
        </p>

        {/* CTA */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button variant="primary" size="lg" onClick={() => router.push('/signup')}>
            <span>Get Started Free</span>
            <ArrowRight size={16} />
          </Button>
          <Button variant="secondary" size="lg" onClick={() => router.push('/login')}>
            <span>Log In</span>
          </Button>
        </div>
      </section>

      {/* Highlights Bar */}
      <section style={{ borderTop: '1px solid var(--border-subtle)', background: '#FFFFFF', padding: '3.5rem 2rem', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '2rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem', color: 'var(--color-primary)' }}>
              <CheckCircle2 size={20} />
              <h4 style={{ color: 'var(--text-primary)' }}>Lifetime History</h4>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Member workouts, weight, and nutrition remain personal and permanent, independent of gym tenure.
            </p>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem', color: 'var(--color-cyan)' }}>
              <CheckCircle2 size={20} />
              <h4 style={{ color: 'var(--text-primary)' }}>Workout Hierarchy</h4>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Session → WorkoutExercise → WorkoutSet structure supporting exact set types, RPE, and target reps.
            </p>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem', color: 'var(--color-violet)' }}>
              <CheckCircle2 size={20} />
              <h4 style={{ color: 'var(--text-primary)' }}>PostgreSQL Constraints</h4>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Database-enforced unique active owner, non-duplicating trainer assignments, and pending invitation integrity.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
