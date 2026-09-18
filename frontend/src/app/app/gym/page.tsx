'use client';

import React, { useState, useEffect } from 'react';
import { Building2, Shield, Plus, Mail, CheckCircle2, UserCheck, Flame, History, Clock } from 'lucide-react';
import { api } from '@/lib/api';
import { Gym, GymMembership, GymInvitation, AuditLog } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';

export default function GymAdminPage() {
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [memberships, setMemberships] = useState<GymMembership[]>([]);
  const [invitations, setInvitations] = useState<GymInvitation[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Invite Modal State
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'MEMBER' | 'TRAINER'>('MEMBER');
  const [inviting, setInviting] = useState(false);

  const loadGymData = async () => {
    try {
      const gData = await api.getGyms();
      const gymList: Gym[] = gData.results || gData;
      setGyms(gymList);

      if (gymList.length > 0) {
        const gymId = gymList[0].id;
        const [mList, invList, aList] = await Promise.all([
          api.getMembers(gymId),
          api.getInvitations(gymId),
          api.getAuditLogs(gymId),
        ]);
        setMemberships(mList.results || mList);
        setInvitations(invList.results || invList);
        setAuditLogs(aList.results || aList);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGymData();
  }, []);

  const handleSendInvite = async () => {
    if (!inviteEmail.trim() || gyms.length === 0) return;
    setInviting(true);
    try {
      await api.createInvitation(gyms[0].id, inviteEmail, inviteRole);
      setInviteModalOpen(false);
      setInviteEmail('');
      loadGymData();
    } catch (err) {
      console.error(err);
    } finally {
      setInviting(false);
    }
  };

  const currentGym = gyms[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Badge variant="violet">Gym Founder & Owner View</Badge>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>•</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>David Vance</span>
          </div>
          <h1 style={{ fontSize: '2rem' }}>{currentGym?.name || 'Gym Admin Console'}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '4px' }}>
            Tenant management, staff & member rosters, onboarding invitations, and compliance audit trail.
          </p>
        </div>

        <Button variant="primary" onClick={() => setInviteModalOpen(true)}>
          <Plus size={16} />
          <span>Invite Member / Coach</span>
        </Button>
      </div>

      {/* Facility & Branch Info */}
      {currentGym && (
        <Card elevated>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building2 size={24} color="var(--color-primary)" />
                <h2 style={{ fontSize: '1.4rem' }}>{currentGym.name}</h2>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '6px', maxWidth: '600px' }}>
                {currentGym.description}
              </p>
              <div style={{ marginTop: '10px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                📍 {currentGym.address}, {currentGym.city} • 📞 {currentGym.phone}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-primary-light)', fontFamily: 'Outfit, sans-serif' }}>
                  {memberships.length}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Active Members</div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-cyan)', fontFamily: 'Outfit, sans-serif' }}>
                  {currentGym.branches?.length || 2}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Branches</div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Roster: Members & Trainers */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.35rem' }}>Active Membership Roster</h2>
          <Badge variant="emerald">{memberships.length} Total Enrolled</Badge>
        </div>

        <Card>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th style={{ padding: '10px' }}>Member / Staff</th>
                  <th style={{ padding: '10px' }}>Role</th>
                  <th style={{ padding: '10px' }}>Status</th>
                  <th style={{ padding: '10px' }}>Privacy & Data Sharing</th>
                  <th style={{ padding: '10px' }}>Enrolled Date</th>
                </tr>
              </thead>
              <tbody>
                {memberships.map((m) => (
                  <tr key={m.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '12px 10px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{m.user?.full_name || 'Athlete'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.user?.email || ''}</div>
                    </td>
                    <td style={{ padding: '12px 10px' }}>
                      <Badge
                        variant={
                          m.role === 'OWNER' ? 'violet' : m.role === 'TRAINER' ? 'amber' : 'emerald'
                        }
                      >
                        {m.role}
                      </Badge>
                    </td>
                    <td style={{ padding: '12px 10px' }}>
                      <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                        ● {m.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 10px', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      {m.share_workouts_with_trainers ? '✓ Workouts Shared' : 'Private'}
                    </td>
                    <td style={{ padding: '12px 10px', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                      {m.created_at ? new Date(m.created_at).toLocaleDateString() : 'Active'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Invitations Management */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.35rem' }}>Onboarding Invitations</h2>
          <Badge variant="amber">{invitations.length} Issued</Badge>
        </div>

        <Card>
          {invitations.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No pending invitations.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    <th style={{ padding: '10px' }}>Recipient Email</th>
                    <th style={{ padding: '10px' }}>Target Role</th>
                    <th style={{ padding: '10px' }}>Invited By</th>
                    <th style={{ padding: '10px' }}>Status</th>
                    <th style={{ padding: '10px' }}>Expires</th>
                  </tr>
                </thead>
                <tbody>
                  {invitations.map((inv) => (
                    <tr key={inv.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '12px 10px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {inv.email}
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                        <Badge variant={inv.role === 'TRAINER' ? 'amber' : 'emerald'}>
                          {inv.role}
                        </Badge>
                      </td>
                      <td style={{ padding: '12px 10px', color: 'var(--text-secondary)' }}>
                        {inv.invited_by_name}
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                        <span style={{ color: inv.status === 'PENDING' ? '#FBBF24' : 'var(--color-primary)' }}>
                          {inv.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 10px', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                        {new Date(inv.expires_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Tenant Compliance Audit Log */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
          <History size={20} color="var(--color-violet)" />
          <h2 style={{ fontSize: '1.35rem' }}>Tenant Security & Audit Trail</h2>
          <Badge variant="violet">Compliance</Badge>
        </div>

        <Card>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {auditLogs.map((log) => (
              <div
                key={log.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  background: 'var(--bg-surface-elevated)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.85rem',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{log.action}</span>
                    <Badge variant="emerald">{log.resource_type}</Badge>
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '2px' }}>
                    By {log.actor_name}
                  </div>
                </div>

                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                  {new Date(log.created_at).toLocaleTimeString()} • {new Date(log.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Send Invitation Modal */}
      <Modal isOpen={inviteModalOpen} onClose={() => setInviteModalOpen(false)} title="Issue Gym Invitation">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Candidate Email
            </label>
            <input
              type="email"
              placeholder="e.g. new.athlete@example.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
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
              Assigned Role
            </label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as any)}
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
              <option value="MEMBER">Gym Member</option>
              <option value="TRAINER">Trainer / Coach</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1rem' }}>
            <Button variant="secondary" onClick={() => setInviteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSendInvite} disabled={inviting}>
              {inviting ? 'Issuing...' : 'Send Invitation'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
