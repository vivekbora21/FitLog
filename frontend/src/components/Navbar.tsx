'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Plus, ChevronDown, Building2, LogOut, Menu, Dumbbell, PanelLeft, PanelLeftOpen } from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';

interface NavbarProps {
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, isSidebarCollapsed }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const getSectionInfo = () => {
    if (pathname === '/app' || pathname === '/app/') return { title: 'Dashboard', badge: 'Overview' };
    if (pathname.startsWith('/app/workouts/active')) return { title: "Today's Training", badge: 'Live' };
    if (pathname.startsWith('/app/workouts/plan')) return { title: '60-Day Workout Plan', badge: 'Program' };
    if (pathname.startsWith('/app/workouts/routines')) return { title: 'Workout Routines', badge: 'Splits' };
    if (pathname.startsWith('/app/workouts')) return { title: 'Workout History', badge: 'Sessions' };
    if (pathname.startsWith('/app/daily')) return { title: 'Daily Log', badge: 'Check-in' };
    if (pathname.startsWith('/app/progress')) return { title: 'Progress Tracking', badge: 'Biometrics' };
    if (pathname.startsWith('/app/nutrition')) return { title: 'Nutrition & Macros', badge: 'Fuel' };
    if (pathname.startsWith('/app/review')) return { title: 'Weekly Review', badge: 'Protocol' };
    if (pathname.startsWith('/app/guidelines')) return { title: 'Program Guidelines', badge: 'Guide' };
    if (pathname.startsWith('/app/expectations')) return { title: 'Day 60 Expectations', badge: 'Transformation' };
    if (pathname.startsWith('/app/trainer')) return { title: 'Trainer Hub', badge: 'Coach Portal' };
    if (pathname.startsWith('/app/gym')) return { title: 'Gym Admin', badge: 'Facility' };
    return { title: 'FitLog Pro', badge: 'App' };
  };

  const section = getSectionInfo();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const userInitial = (user?.full_name || user?.email || 'U')[0].toUpperCase();

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 500,
        background: 'rgba(255, 255, 255, 0.94)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-subtle)',
        width: '100%',
        height: 'var(--header-height, 64px)',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 'var(--content-max-width, 1600px)',
          margin: '0 auto',
          padding: '0 1.5rem 0 1.75rem',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          boxSizing: 'border-box',
        }}
      >
        {/* Left: Sidebar Toggle Button + Page Breadcrumb / Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          {/* Mobile Drawer Toggle Button (desktop uses the border seam toggle button) */}
          <button
            onClick={onToggleSidebar}
            className="sidebar-toggle-btn"
            style={{
              background: isSidebarCollapsed ? 'var(--color-primary-glow)' : 'var(--bg-surface-elevated)',
              border: isSidebarCollapsed ? '1px solid var(--border-glow)' : '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '7px',
              color: isSidebarCollapsed ? 'var(--color-primary)' : 'var(--text-primary)',
              cursor: 'pointer',
            }}
            title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isSidebarCollapsed ? <PanelLeftOpen size={19} /> : <PanelLeft size={19} />}
          </button>

          {/* Current Section Title & Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1
              style={{
                fontSize: '1.15rem',
                fontWeight: 750,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
                margin: 0,
              }}
            >
              {section.title}
            </h1>
            <Badge variant="emerald" style={{ fontSize: '0.625rem', padding: '2px 7px' }}>
              {section.badge}
            </Badge>
          </div>
        </div>

        {/* Right: Active Gym Indicator + Quick Action + User Menu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          {/* Active Gym Scope Tag - Desktop only */}
          <div
            className="gym-tag-desktop"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 10px',
              background: 'var(--bg-surface-elevated)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
            }}
          >
            <Building2 size={13} color="var(--color-cyan)" />
            <span style={{ fontWeight: 600 }}>Apex Performance</span>
          </div>

          <Button size="sm" variant="primary" onClick={() => router.push('/app/workouts/active')}>
            <Plus size={15} strokeWidth={2.5} />
            <span style={{ fontWeight: 700 }}>Log Workout</span>
          </Button>

          {/* User Menu Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 10px 4px 4px',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-full)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: '0.8125rem',
                fontWeight: 600,
              }}
              aria-expanded={dropdownOpen}
              aria-label="User profile menu"
            >
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-cyan) 100%)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                }}
              >
                {userInitial}
              </div>
              <span
                style={{
                  maxWidth: '120px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {user?.full_name?.split(' ')[0] || user?.email?.split('@')[0]}
              </span>
              <ChevronDown size={14} color="var(--text-muted)" />
            </button>

            {dropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '120%',
                  right: 0,
                  width: '220px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-bright)',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: '0 12px 30px rgba(0, 0, 0, 0.12)',
                  padding: '8px',
                  zIndex: 600,
                }}
              >
                <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '6px' }}>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {user?.full_name || 'FitLog Member'}
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user?.email}
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    color: '#EF4444',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                  }}
                >
                  <LogOut size={14} />
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
