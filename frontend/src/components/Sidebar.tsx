'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  PlayCircle,
  CalendarDays,
  ClipboardList,
  TrendingUp,
  Ruler,
  Utensils,
  Award,
  BookOpen,
  Target,
  History,
  Users,
  Building2,
  Dumbbell,
  Plus,
  LogOut,
  Settings,
  X,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { api } from '@/lib/api';
import { JourneyPacingData } from '@/lib/types';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  badgeVariant?: 'amber' | 'violet' | 'emerald' | 'cyan' | 'rose';
}

interface SidebarProps {
  isOpen: boolean;
  isCollapsed?: boolean;
  onClose: () => void;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, isCollapsed = false, onClose, onToggleCollapse }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const isTrainer = user?.memberships?.some((m) => m.role === 'TRAINER');
  const isOwner = user?.memberships?.some((m) => m.role === 'OWNER');

  const [journey, setJourney] = useState<JourneyPacingData | null>(null);

  useEffect(() => {
    api.getJourneyPacingStatus().then(setJourney).catch(() => setJourney(null));
  }, []);

  const planBadge = journey?.has_program ? `Day ${journey.current_day}/${journey.duration_days}` : undefined;
  const planBadgeVariant: NavItem['badgeVariant'] = journey?.is_calibrating
    ? 'cyan'
    : journey?.pacing_status === 'PACING_ALERT'
      ? 'amber'
      : journey?.pacing_status === 'OFF_TRACK'
        ? 'rose'
        : 'emerald';

  const mainNavItems: NavItem[] = [
    { label: 'Dashboard', href: '/app', icon: LayoutDashboard },
    { label: 'Today', href: '/app/workouts/active', icon: PlayCircle },
    { label: 'Plan', href: '/app/workouts/plan', icon: CalendarDays, badge: planBadge, badgeVariant: planBadgeVariant },
    { label: 'Plan History', href: '/app/workouts/plan/history', icon: History },
    { label: 'Daily Log', href: '/app/daily', icon: ClipboardList },
    { label: 'Progress', href: '/app/progress', icon: TrendingUp },
    { label: 'Measurements', href: '/app/measurements', icon: Ruler },
    { label: 'Nutrition', href: '/app/nutrition', icon: Utensils },
    { label: 'Review', href: '/app/review', icon: Award },
    { label: 'Guidelines', href: '/app/guidelines', icon: BookOpen },
    { label: 'Milestones', href: '/app/expectations', icon: Target },
    { label: 'Settings', href: '/app/settings', icon: Settings },
  ];

  const managementNavItems: NavItem[] = [
    ...(isTrainer ? [{ label: 'Trainer Hub', href: '/app/trainer', icon: Users, badge: 'Coach', badgeVariant: 'amber' as const }] : []),
    ...(isOwner ? [{ label: 'Gym Admin', href: '/app/gym', icon: Building2, badge: 'Owner', badgeVariant: 'violet' as const }] : []),
  ];

  const isItemActive = (href: string) => {
    if (href === '/app') {
      return pathname === '/app' || pathname === '/app/';
    }
    if (href === '/app/workouts/plan') {
      return (
        pathname === '/app/workouts/plan' ||
        (pathname.startsWith('/app/workouts/plan/') && !pathname.startsWith('/app/workouts/plan/history')) ||
        pathname.startsWith('/app/workouts/routines')
      );
    }
    if (href === '/app/workouts/active') {
      return (
        pathname === '/app/workouts/active' ||
        pathname.startsWith('/app/workouts/active/') ||
        pathname === '/app/workouts'
      );
    }
    return pathname === href || pathname.startsWith(href + '/') || pathname.startsWith(href + '?');
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const userInitials = (user?.full_name || user?.email || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      <div
        className={`app-sidebar-backdrop ${isOpen ? 'open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Main Sidebar */}
      <aside
        className={`app-sidebar ${isOpen ? 'open' : ''} ${isCollapsed ? 'collapsed' : ''}`}
        aria-label="Sidebar Navigation"
      >
        {/* Header: Brand + Edge Collapse Toggle */}
        <div
          style={{
            height: 'var(--header-height, 64px)',
            boxSizing: 'border-box',
            padding: isCollapsed ? '0 0.5rem' : '0 1rem 0 1.25rem',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'space-between',
            position: 'relative',
          }}
        >
          {isCollapsed ? (
            <div
              onClick={onToggleCollapse}
              title="FITLOG PRO (Click to expand)"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 10px rgba(16, 185, 129, 0.3)',
                cursor: 'pointer',
                transition: 'transform var(--transition-fast)',
              }}
            >
              <Dumbbell size={18} color="#FFFFFF" strokeWidth={2.5} />
            </div>
          ) : (
            <>
              <Link
                href="/app"
                onClick={onClose}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.625rem',
                  fontWeight: 800,
                  fontSize: '1.2rem',
                  letterSpacing: '-0.03em',
                  textDecoration: 'none',
                  color: 'var(--text-primary)',
                }}
              >
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 10px rgba(16, 185, 129, 0.3)',
                  }}
                >
                  <Dumbbell size={18} color="#FFFFFF" strokeWidth={2.5} />
                </div>
                <span>
                  FIT<span style={{ color: 'var(--color-primary)' }}>LOG</span>
                </span>
                <Badge variant="emerald" style={{ fontSize: '0.6rem', padding: '2px 5px', fontWeight: 800 }}>
                  PRO
                </Badge>
              </Link>

              {/* Mobile close button (visible only in mobile drawer) */}
              <button
                onClick={onClose}
                className="mobile-sidebar-close-btn"
                title="Close sidebar"
                aria-label="Close sidebar"
              >
                <X size={18} />
              </button>
            </>
          )}

          {/* Edge Collapse Button: centered on the border seam where both lines meet */}
          <button
            onClick={onToggleCollapse}
            className="sidebar-edge-toggle-btn"
            title={isCollapsed ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar (Ctrl+B)'}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight size={14} strokeWidth={2.5} />
            ) : (
              <ChevronLeft size={14} strokeWidth={2.5} />
            )}
          </button>
        </div>

        {/* Navigation Item List */}
        <nav
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: isCollapsed ? '0.75rem 0.4rem' : '0.75rem 0.875rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem',
          }}
        >
          {/* {isCollapsed ? (
            <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '4px 8px 8px 8px' }} />
          ) : (
            <div
              style={{
                fontSize: '0.68rem',
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                padding: '0.5rem 0.5rem 0.35rem 0.5rem',
              }}
            >
              Main Menu
            </div>
          )} */}

          {mainNavItems.map((item) => {
            const active = isItemActive(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                title={item.label}
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: isCollapsed ? 'center' : 'flex-start',
                  gap: isCollapsed ? 0 : '10px',
                  padding: isCollapsed ? '0.625rem 0' : '0.625rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.875rem',
                  fontWeight: active ? 700 : 500,
                  color: active ? 'var(--color-primary)' : 'var(--text-secondary)',
                  background: active ? 'var(--color-primary-glow)' : 'transparent',
                  border: active ? '1px solid var(--border-glow)' : '1px solid transparent',
                  boxShadow: active ? '0 2px 8px rgba(16, 185, 129, 0.12)' : 'none',
                  textDecoration: 'none',
                  transition: 'all var(--transition-fast)',
                }}
              >
                {/* Active Indicator Bar */}
                {active && (
                  <span
                    style={{
                      position: 'absolute',
                      left: '2px',
                      top: '20%',
                      bottom: '20%',
                      width: '3.5px',
                      borderRadius: '2px',
                      background: 'var(--color-primary)',
                    }}
                  />
                )}

                <Icon
                  size={isCollapsed ? 20 : 18}
                  color={active ? 'var(--color-primary)' : 'var(--text-muted)'}
                  strokeWidth={active ? 2.5 : 2}
                  style={{ flexShrink: 0, marginLeft: !isCollapsed && active ? '4px' : '0' }}
                />

                {!isCollapsed && (
                  <>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.label}
                    </span>

                    {item.badge && (
                      <Badge variant={item.badgeVariant || 'emerald'} style={{ fontSize: '0.625rem', padding: '1px 6px' }}>
                        {item.badge}
                      </Badge>
                    )}
                  </>
                )}
              </Link>
            );
          })}

          {managementNavItems.length > 0 && (
            <>
              {isCollapsed ? (
                <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '8px 8px 4px 8px' }} />
              ) : (
                <div
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                    padding: '1rem 0.5rem 0.35rem 0.5rem',
                  }}
                >
                  Management
                </div>
              )}

              {managementNavItems.map((item) => {
                const active = isItemActive(item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    title={item.label}
                    style={{
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: isCollapsed ? 'center' : 'flex-start',
                      gap: isCollapsed ? 0 : '10px',
                      padding: isCollapsed ? '0.625rem 0' : '0.625rem 0.75rem',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.875rem',
                      fontWeight: active ? 700 : 500,
                      color: active ? 'var(--color-primary)' : 'var(--text-secondary)',
                      background: active ? 'var(--color-primary-glow)' : 'transparent',
                      border: active ? '1px solid var(--border-glow)' : '1px solid transparent',
                      boxShadow: active ? '0 2px 8px rgba(16, 185, 129, 0.12)' : 'none',
                      textDecoration: 'none',
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    {active && (
                      <span
                        style={{
                          position: 'absolute',
                          left: '2px',
                          top: '20%',
                          bottom: '20%',
                          width: '3.5px',
                          borderRadius: '2px',
                          background: 'var(--color-primary)',
                        }}
                      />
                    )}

                    <Icon
                      size={isCollapsed ? 20 : 18}
                      color={active ? 'var(--color-primary)' : 'var(--text-muted)'}
                      strokeWidth={active ? 2.5 : 2}
                      style={{ flexShrink: 0, marginLeft: !isCollapsed && active ? '4px' : '0' }}
                    />

                    {!isCollapsed && (
                      <>
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.label}
                        </span>

                        {item.badge && (
                          <Badge variant={item.badgeVariant || 'emerald'} style={{ fontSize: '0.625rem', padding: '1px 6px' }}>
                            {item.badge}
                          </Badge>
                        )}
                      </>
                    )}
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        {/* Quick Action */}
        <div
          style={{
            padding: isCollapsed ? '0.65rem 0.4rem' : '0.75rem 1rem',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          {isCollapsed ? (
            <button
              onClick={() => {
                onClose();
                router.push('/app/workouts/active');
              }}
              title="Log Workout"
              style={{
                width: '38px',
                height: '38px',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: '#FFFFFF',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
              }}
              aria-label="Log Workout"
            >
              <Plus size={18} strokeWidth={2.5} />
            </button>
          ) : (
            <Button
              size="sm"
              variant="primary"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => {
                onClose();
                router.push('/app/workouts/active');
              }}
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>Log Workout</span>
            </Button>
          )}
        </div>

        {/* User Profile Footer */}
        <div
          style={{
            padding: isCollapsed ? '0.75rem 0.4rem' : '0.875rem 1rem',
            borderTop: '1px solid var(--border-subtle)',
            background: 'var(--bg-surface-elevated)',
            display: 'flex',
            flexDirection: isCollapsed ? 'column' : 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: isCollapsed ? '8px' : '8px',
          }}
        >
          {isCollapsed ? (
            <>
              <div
                title={`${user?.full_name || 'FitLog User'} (${user?.email})`}
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-cyan) 100%)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  cursor: 'default',
                  flexShrink: 0,
                }}
              >
                {userInitials}
              </div>

              <button
                onClick={handleLogout}
                title="Log Out"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'color var(--transition-fast)',
                }}
                aria-label="Log Out"
              >
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-cyan) 100%)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    flexShrink: 0,
                  }}
                >
                  {userInitials}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      fontSize: '0.8125rem',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {user?.full_name || 'FitLog User'}
                  </div>
                  <div
                    style={{
                      fontSize: '0.6875rem',
                      color: 'var(--text-muted)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {user?.email}
                  </div>
                </div>
              </div>

              <button
                onClick={handleLogout}
                title="Log out"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'color var(--transition-fast)',
                }}
                aria-label="Log Out"
              >
                <LogOut size={16} />
              </button>
            </>
          )}
        </div>
      </aside>
    </>
  );
};
