'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dumbbell, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import styles from '@/components/ui/ui.module.css';

function extractErrorMessage(err: any): string {
  const response = err?.response;
  if (!response) return 'Something went wrong. Please try again.';
  if (response.detail) return response.detail;
  const firstField = Object.values(response)[0];
  if (Array.isArray(firstField)) return String(firstField[0]);
  return 'Something went wrong. Please try again.';
}

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      router.push('/app');
    } catch (err: any) {
      setError(extractErrorMessage(err) || 'Invalid email or password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at top, #111B2C 0%, #080B11 70%)',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}
    >
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div
          onClick={() => router.push('/')}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '1.4rem', fontWeight: 800, marginBottom: '2rem', cursor: 'pointer' }}
        >
          <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Dumbbell size={22} color="#080B11" strokeWidth={2.5} />
          </div>
          <span>FIT<span style={{ color: 'var(--color-primary)' }}>LOG</span></span>
        </div>

        <Card elevated style={{ padding: '2rem' }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Welcome back</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Log in to continue your fitness journey.
          </p>

          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem 1rem',
                marginBottom: '1.25rem',
                fontSize: '0.85rem',
                color: '#FCA5A5',
              }}
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className={styles.inputGroup}>
              <label className={styles.label} htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                className={styles.input}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label} htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className={styles.input}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <Button type="submit" variant="primary" disabled={submitting} style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}>
              <span>{submitting ? 'Logging in...' : 'Log In'}</span>
              {!submitting && <ArrowRight size={16} />}
            </Button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '1.5rem' }}>
            Don&apos;t have an account?{' '}
            <button
              type="button"
              onClick={() => router.push('/signup')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--color-primary-light)', fontWeight: 600 }}
            >
              Sign up
            </button>
          </p>
        </Card>
      </div>
    </div>
  );
}
