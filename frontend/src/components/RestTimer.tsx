'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, X, Bell } from 'lucide-react';
import { Button } from './ui/Button';

interface RestTimerContextType {
  startTimer: (seconds: number) => void;
  stopTimer: () => void;
  secondsRemaining: number;
  isActive: boolean;
}

const RestTimerContext = createContext<RestTimerContextType | undefined>(undefined);

export const RestTimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [totalSeconds, setTotalSeconds] = useState<number>(90);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch (e) {
      // Ignore audio error
    }
  };

  const startTimer = React.useCallback((seconds: number) => {
    setTotalSeconds(seconds);
    setSecondsRemaining(seconds);
    setIsActive(true);
    setIsPaused(false);
  }, []);

  const stopTimer = React.useCallback(() => {
    setIsActive(false);
    setSecondsRemaining(0);
  }, []);

  const addTime = (seconds: number) => {
    setSecondsRemaining((prev) => prev + seconds);
    setTotalSeconds((prev) => prev + seconds);
  };

  useEffect(() => {
    let interval: any = null;
    if (isActive && !isPaused && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((sec) => {
          if (sec <= 1) {
            playBeep();
            return 0;
          }
          return sec - 1;
        });
      }, 1000);
    } else if (secondsRemaining === 0 && isActive) {
      setIsActive(false);
    }
    return () => clearInterval(interval);
  }, [isActive, isPaused, secondsRemaining]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}:${remainder < 10 ? '0' : ''}${remainder}`;
  };

  const progress = totalSeconds > 0 ? ((totalSeconds - secondsRemaining) / totalSeconds) * 100 : 0;
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const contextValue = React.useMemo(
    () => ({ startTimer, stopTimer, secondsRemaining, isActive }),
    [startTimer, stopTimer, secondsRemaining, isActive]
  );

  return (
    <RestTimerContext.Provider value={contextValue}>
      {children}
      {isActive && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            background: 'rgba(255, 255, 255, 0.96)',
            backdropFilter: 'blur(16px)',
            border: '1px solid var(--border-glow)',
            boxShadow: '0 12px 36px rgba(15, 23, 42, 0.12), 0 0 20px rgba(16, 185, 129, 0.15)',
            borderRadius: '20px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            color: 'var(--text-primary)',
            animation: 'slideUp 300ms ease-out',
          }}
        >
          {/* Circular Countdown Progress */}
          <div style={{ position: 'relative', width: '64px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="64" height="64" style={{ transform: 'rotate(-90deg)' }}>
              <circle
                cx="32"
                cy="32"
                r={radius}
                stroke="rgba(0, 0, 0, 0.08)"
                strokeWidth="4"
                fill="none"
              />
              <circle
                cx="32"
                cy="32"
                r={radius}
                stroke="var(--color-primary)"
                strokeWidth="4"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
            <span style={{ position: 'absolute', fontWeight: 800, fontSize: '0.95rem', fontFamily: 'Outfit, sans-serif' }}>
              {formatTime(secondsRemaining)}
            </span>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
              Rest Period
            </div>
            <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
              <Button size="sm" variant="secondary" onClick={() => addTime(30)}>
                +30s
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setIsPaused(!isPaused)}>
                {isPaused ? <Play size={14} /> : <Pause size={14} />}
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setSecondsRemaining(totalSeconds)}>
                <RotateCcw size={14} />
              </Button>
              <Button size="sm" variant="ghost" onClick={stopTimer}>
                <X size={16} />
              </Button>
            </div>
          </div>
        </div>
      )}
    </RestTimerContext.Provider>
  );
};

export const useRestTimer = () => {
  const context = useContext(RestTimerContext);
  if (!context) {
    throw new Error('useRestTimer must be used within a RestTimerProvider');
  }
  return context;
};
