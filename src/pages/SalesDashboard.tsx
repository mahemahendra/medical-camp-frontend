import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import api from '../services/api';
import { VisitorWithFollowUp, FollowUpStatus, FollowUpStats } from '../types';
import { Header, HeaderButton, PageContainer, ContentContainer } from '../components';

const FOLLOW_UP_STATUS_OPTIONS: { value: FollowUpStatus; label: string; color: string; bg: string }[] = [
  { value: FollowUpStatus.INTERESTED, label: 'Interested', color: '#059669', bg: '#d1fae5' },
  { value: FollowUpStatus.NOT_INTERESTED, label: 'Not Interested', color: '#dc2626', bg: '#fee2e2' },
  { value: FollowUpStatus.FOLLOW_UP_REQUIRED, label: 'Follow Up Required', color: '#d97706', bg: '#fef3c7' },
  { value: FollowUpStatus.FOLLOW_UP_NOT_REQUIRED, label: 'Follow Up Not Required', color: '#64748b', bg: '#f1f5f9' },
  { value: FollowUpStatus.COMPLETED, label: 'Completed', color: '#2563eb', bg: '#dbeafe' },
  { value: FollowUpStatus.NO_RESPONSE, label: 'No Response', color: '#9333ea', bg: '#f3e8ff' },
];

function getStatusBadge(status: string | null | undefined) {
  if (!status) return { label: 'Pending', color: '#94a3b8', bg: '#f1f5f9' };
  const found = FOLLOW_UP_STATUS_OPTIONS.find(o => o.value === status);
  return found || { label: status, color: '#64748b', bg: '#f1f5f9' };
}

export default function SalesDashboard() {
  const { campSlug } = useParams<{ campSlug: string }>();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const [visitors, setVisitors] = useState<VisitorWithFollowUp[]>([]);
  const [stats, setStats] = useState<FollowUpStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Modal state
  const [selectedVisitor, setSelectedVisitor] = useState<VisitorWithFollowUp | null>(null);
  const [modalStatus, setModalStatus] = useState<FollowUpStatus>(FollowUpStatus.INTERESTED);
  const [modalComment, setModalComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');

  const [campLogo, setCampLogo] = useState<string>('');

  const campId = user?.campId;

  useEffect(() => {
    if (campSlug) {
      api.get(`/public/${campSlug}`)
        .then(res => {
          if (res.data.camp?.logoUrl) {
            setCampLogo(res.data.camp.logoUrl);
          }
        })
        .catch(console.error);
    }
  }, [campSlug]);

  const fetchVisitors = useCallback(async () => {
    if (!campId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '20');
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);

      const response = await api.get(`/sales/${campId}/visitors?${params.toString()}`);
      setVisitors(response.data.data);
      setTotalPages(response.data.pagination.totalPages);
      setTotal(response.data.pagination.total);
    } catch (error) {
      console.error('Failed to load visitors:', error);
    } finally {
      setLoading(false);
    }
  }, [campId, page, search, statusFilter]);

  const fetchStats = useCallback(async () => {
    if (!campId) return;
    try {
      const response = await api.get(`/sales/${campId}/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }, [campId]);

  useEffect(() => {
    fetchVisitors();
  }, [fetchVisitors]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const openFollowUpModal = (item: VisitorWithFollowUp) => {
    setSelectedVisitor(item);
    setModalStatus(item.followUp?.status as FollowUpStatus || FollowUpStatus.INTERESTED);
    setModalComment(item.followUp?.comment || '');
    setSaveSuccess('');
  };

  const closeModal = () => {
    setSelectedVisitor(null);
    setModalComment('');
    setSaveSuccess('');
  };

  const handleSaveFollowUp = async () => {
    if (!selectedVisitor || !campId) return;
    setSaving(true);
    setSaveSuccess('');
    try {
      await api.put(`/sales/${campId}/follow-up/${selectedVisitor.visitor.id}`, {
        status: modalStatus,
        comment: modalComment
      });
      setSaveSuccess('Follow-up saved successfully!');
      // Refresh data
      await fetchVisitors();
      await fetchStats();
      // Update modal with saved data
      setTimeout(() => closeModal(), 1200);
    } catch (error: any) {
      setSaveSuccess('');
      alert(error.response?.data?.error || 'Failed to save follow-up');
    } finally {
      setSaving(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const handleLogout = () => {
    logout();
    navigate(`/${campSlug}/login`);
  };

  // Styles
  const s = {
    statsRow: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
      gap: '1rem',
      marginBottom: '1.5rem',
    },
    statCard: (bg: string, color: string) => ({
      background: 'white',
      borderRadius: '12px',
      padding: '1.25rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      borderLeft: `4px solid ${color}`,
    }),
    statValue: {
      fontSize: '2rem',
      fontWeight: '700' as const,
      color: '#1e293b',
      margin: 0,
    },
    statLabel: {
      fontSize: '0.85rem',
      color: '#64748b',
      margin: '0.25rem 0 0 0',
    },
    filterBar: {
      display: 'flex',
      gap: '1rem',
      marginBottom: '1.5rem',
      flexWrap: 'wrap' as const,
      alignItems: 'center',
    },
    searchInput: {
      flex: '1',
      minWidth: '250px',
      padding: '0.75rem 1rem',
      border: '2px solid #e2e8f0',
      borderRadius: '10px',
      fontSize: '0.9rem',
      outline: 'none',
    },
    selectFilter: {
      padding: '0.75rem 1rem',
      border: '2px solid #e2e8f0',
      borderRadius: '10px',
      fontSize: '0.9rem',
      outline: 'none',
      background: 'white',
      minWidth: '180px',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse' as const,
    },
    th: {
      textAlign: 'left' as const,
      padding: '1rem',
      fontWeight: '600' as const,
      color: '#334155',
      borderBottom: '2px solid #e2e8f0',
      background: '#f8fafc',
      fontSize: '0.85rem',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.05em',
    },
    td: {
      padding: '1rem',
      borderBottom: '1px solid #f1f5f9',
      verticalAlign: 'top' as const,
    },
    rowHover: {
      cursor: 'pointer',
      transition: 'background 0.15s',
    },
    badge: (bg: string, color: string) => ({
      display: 'inline-block',
      padding: '0.25rem 0.75rem',
      borderRadius: '20px',
      fontSize: '0.8rem',
      fontWeight: '600' as const,
      background: bg,
      color: color,
    }),
  };

  return (
    <PageContainer>
      <Header
        title="Sales Dashboard"
        subtitle={`Follow-up management | ${user?.name}`}
        icon={campLogo || '📞'}
        theme="doctor"
        actions={
          <HeaderButton variant="primary" theme="doctor" onClick={handleLogout}>
            Logout
          </HeaderButton>
        }
      />

      <ContentContainer>
        {/* Stats */}
        {stats && (
          <div style={s.statsRow}>
            <div style={s.statCard('#fff', '#3b82f6')}>
              <div style={s.statValue}>{stats.totalCompleted}</div>
              <div style={s.statLabel}>Total Patients</div>
            </div>
            <div style={s.statCard('#fff', '#059669')}>
              <div style={s.statValue}>{stats.totalFollowedUp}</div>
              <div style={s.statLabel}>Followed Up</div>
            </div>
            <div style={s.statCard('#fff', '#d97706')}>
              <div style={s.statValue}>{stats.totalPending}</div>
              <div style={s.statLabel}>Pending</div>
            </div>
            {stats.statusBreakdown.map((sb) => {
              const badge = getStatusBadge(sb.status);
              return (
                <div key={sb.status} style={s.statCard('#fff', badge.color)}>
                  <div style={s.statValue}>{sb.count}</div>
                  <div style={s.statLabel}>{badge.label}</div>
                </div>
              );
            })}
          </div>
        )}

        {/* Filters */}
        <form onSubmit={handleSearch} style={s.filterBar}>
          <input
            type="text"
            placeholder="Search by name, phone, or patient ID..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={s.searchInput}
          />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            style={s.selectFilter}
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending (No follow-up)</option>
            {FOLLOW_UP_STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </form>

        {/* Table */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
              Loading visitors...
            </div>
          ) : visitors.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
              <h3 style={{ color: '#64748b', margin: '0 0 0.5rem 0' }}>No Visitors Found</h3>
              <p style={{ color: '#94a3b8', margin: 0 }}>
                {search || statusFilter
                  ? 'No visitors match your search criteria.'
                  : 'No visitors with completed consultations yet.'}
              </p>
            </div>
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table style={s.table}>
                  <thead>
                    <tr>
                      <th style={s.th}>Patient ID</th>
                      <th style={s.th}>Name</th>
                      <th style={s.th}>Phone</th>
                      <th style={s.th}>Doctor</th>
                      <th style={s.th}>Diagnosis</th>
                      <th style={s.th}>Follow-Up Status</th>
                      <th style={s.th}>Last Called</th>
                      <th style={s.th}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visitors.map((item) => {
                      const badge = getStatusBadge(item.followUp?.status);
                      return (
                        <tr
                          key={item.visitor.id}
                          style={s.rowHover}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.background = '#f8fafc';
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.background = 'white';
                          }}
                        >
                          <td style={s.td}>
                            <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#7c3aed' }}>
                              {item.visitor.patientIdPerCamp}
                            </span>
                          </td>
                          <td style={s.td}>
                            <div style={{ fontWeight: 600, color: '#1e293b' }}>{item.visitor.name}</div>
                            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                              {item.visitor.age}y / {item.visitor.gender}
                            </div>
                          </td>
                          <td style={s.td}>
                            <a href={`tel:${item.visitor.phone}`} style={{ color: '#2563eb', textDecoration: 'none' }}>
                              {item.visitor.phone}
                            </a>
                          </td>
                          <td style={s.td}>
                            <span style={{ color: '#334155' }}>{item.visit.doctorName}</span>
                          </td>
                          <td style={s.td}>
                            <div style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#475569', fontSize: '0.9rem' }}>
                              {item.consultation?.diagnosis || '-'}
                            </div>
                          </td>
                          <td style={s.td}>
                            <span style={s.badge(badge.bg, badge.color)}>{badge.label}</span>
                          </td>
                          <td style={s.td}>
                            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                              {item.followUp?.calledAt
                                ? new Date(item.followUp.calledAt).toLocaleDateString() + ' ' + new Date(item.followUp.calledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                : '-'}
                            </span>
                          </td>
                          <td style={s.td}>
                            <button
                              onClick={() => openFollowUpModal(item)}
                              style={{
                                background: item.followUp ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
                                color: 'white',
                                border: 'none',
                                padding: '0.5rem 1rem',
                                borderRadius: '8px',
                                fontSize: '0.8rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {item.followUp ? '✏️ Update' : '📞 Follow Up'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '1rem',
                  borderTop: '1px solid #e2e8f0'
                }}>
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    style={{
                      padding: '0.5rem 1rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      background: page === 1 ? '#f1f5f9' : 'white',
                      cursor: page === 1 ? 'not-allowed' : 'pointer',
                      color: page === 1 ? '#94a3b8' : '#334155',
                    }}
                  >
                    ← Previous
                  </button>
                  <span style={{ color: '#64748b', fontSize: '0.9rem' }}>
                    Page {page} of {totalPages} ({total} total)
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    style={{
                      padding: '0.5rem 1rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      background: page === totalPages ? '#f1f5f9' : 'white',
                      cursor: page === totalPages ? 'not-allowed' : 'pointer',
                      color: page === totalPages ? '#94a3b8' : '#334155',
                    }}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </ContentContainer>

      {/* Follow-Up Modal */}
      {selectedVisitor && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem',
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#1e293b' }}>
                  📞 Follow-Up: {selectedVisitor.visitor.name}
                </h3>
                <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>
                  Patient ID: {selectedVisitor.visitor.patientIdPerCamp}
                </p>
              </div>
              <button
                onClick={closeModal}
                style={{
                  background: 'none', border: 'none', fontSize: '1.5rem',
                  cursor: 'pointer', color: '#64748b', padding: '0.25rem'
                }}
              >
                ×
              </button>
            </div>

            {/* Visitor Info */}
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '1rem',
              }}>
                <div>
                  <span style={{ color: '#94a3b8', fontSize: '0.8rem', display: 'block' }}>Phone</span>
                  <a href={`tel:${selectedVisitor.visitor.phone}`} style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none', fontSize: '1.05rem' }}>
                    📱 {selectedVisitor.visitor.phone}
                  </a>
                </div>
                <div>
                  <span style={{ color: '#94a3b8', fontSize: '0.8rem', display: 'block' }}>Age / Gender</span>
                  <span style={{ color: '#1e293b', fontWeight: 500 }}>{selectedVisitor.visitor.age}y / {selectedVisitor.visitor.gender}</span>
                </div>
                <div>
                  <span style={{ color: '#94a3b8', fontSize: '0.8rem', display: 'block' }}>Doctor</span>
                  <span style={{ color: '#1e293b', fontWeight: 500 }}>{selectedVisitor.visit.doctorName}</span>
                </div>
                {selectedVisitor.visitor.address && (
                  <div>
                    <span style={{ color: '#94a3b8', fontSize: '0.8rem', display: 'block' }}>Address</span>
                    <span style={{ color: '#1e293b' }}>{selectedVisitor.visitor.address}{selectedVisitor.visitor.city ? `, ${selectedVisitor.visitor.city}` : ''}</span>
                  </div>
                )}
              </div>

              {/* Consultation Details */}
              {selectedVisitor.consultation && (
                <div style={{ marginTop: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: '#334155', fontSize: '0.9rem' }}>Consultation Summary</h4>
                  <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.9rem' }}>
                    <div>
                      <span style={{ color: '#64748b' }}>Diagnosis: </span>
                      <span style={{ color: '#1e293b' }}>{selectedVisitor.consultation.diagnosis}</span>
                    </div>
                    <div>
                      <span style={{ color: '#64748b' }}>Treatment: </span>
                      <span style={{ color: '#1e293b' }}>{selectedVisitor.consultation.treatmentPlan}</span>
                    </div>
                    {selectedVisitor.consultation.followUpAdvice && (
                      <div>
                        <span style={{ color: '#64748b' }}>Follow-Up Advice: </span>
                        <span style={{ color: '#1e293b', fontWeight: 600 }}>{selectedVisitor.consultation.followUpAdvice}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Existing follow-up info */}
              {selectedVisitor.followUp && (
                <div style={{ marginTop: '0.75rem', background: '#fffbeb', padding: '0.75rem', borderRadius: '8px', border: '1px solid #fde68a' }}>
                  <span style={{ fontSize: '0.85rem', color: '#92400e' }}>
                    Last followed up on {new Date(selectedVisitor.followUp.calledAt!).toLocaleString()}
                    {selectedVisitor.followUp.salesUserName && ` by ${selectedVisitor.followUp.salesUserName}`}
                  </span>
                </div>
              )}
            </div>

            {/* Follow-Up Form */}
            <div style={{ padding: '1.5rem' }}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#334155', fontSize: '0.9rem' }}>
                  Follow-Up Status *
                </label>
                <select
                  value={modalStatus}
                  onChange={(e) => setModalStatus(e.target.value as FollowUpStatus)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '0.95rem',
                    outline: 'none',
                    background: 'white',
                  }}
                >
                  {FOLLOW_UP_STATUS_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#334155', fontSize: '0.9rem' }}>
                  Call Summary / Comments
                </label>
                <textarea
                  value={modalComment}
                  onChange={(e) => setModalComment(e.target.value)}
                  placeholder="Enter a summary of the follow-up call..."
                  rows={4}
                  maxLength={2000}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '0.95rem',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                  }}
                />
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  {modalComment.length}/2000 characters
                </span>
              </div>

              {saveSuccess && (
                <div style={{
                  background: '#d1fae5',
                  color: '#065f46',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  marginBottom: '1rem',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}>
                  ✓ {saveSuccess}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '1.5rem',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              gap: '1rem',
              justifyContent: 'flex-end',
            }}>
              <button
                onClick={closeModal}
                style={{
                  padding: '0.75rem 1.5rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  background: 'white',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  color: '#334155',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveFollowUp}
                disabled={saving}
                style={{
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  borderRadius: '8px',
                  background: saving ? '#94a3b8' : 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
                  color: 'white',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                }}
              >
                {saving ? '⏳ Saving...' : '💾 Save Follow-Up'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
