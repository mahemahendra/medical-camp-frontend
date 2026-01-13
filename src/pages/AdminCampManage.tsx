import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { apiClient } from '../services/api';
import { Header, HeaderButton, PageContainer, ContentContainer, Button, useToast, useAlert } from '../components';

interface CampDetails {
  id: string;
  uniqueSlug: string;
  name: string;
  venue: string;
  startTime: string;
  endTime: string;
  hospitalName: string;
  hospitalAddress?: string;
  hospitalPhone?: string;
  hospitalEmail?: string;
}

interface Doctor {
  id: string;
  name: string;
  email: string;
  specialty?: string;
  phone?: string;
  campId: string;
}

// Password Reset Modal Component (moved outside to prevent re-creation on renders)
interface PasswordResetModalProps {
  show: boolean;
  selectedDoctor: { id: string; name: string } | null;
  passwordSettings: { mode: 'auto' | 'manual'; manualPassword: string };
  credentialLoading: string | null;
  onClose: () => void;
  onSubmit: () => void;
  onPasswordSettingsChange: (settings: { mode: 'auto' | 'manual'; manualPassword: string }) => void;
}

function PasswordResetModal({
  show,
  selectedDoctor,
  passwordSettings,
  credentialLoading,
  onClose,
  onSubmit,
  onPasswordSettingsChange
}: PasswordResetModalProps) {
  if (!show || !selectedDoctor) return null;

  const generateRandomPassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleAutoGenerate = () => {
    onPasswordSettingsChange({
      mode: 'manual',
      manualPassword: generateRandomPassword()
    });
  };

  const isValidPassword = (password: string) => password.length >= 8;

  const canSubmit = () => {
    if (passwordSettings.mode === 'auto') return true;
    return isValidPassword(passwordSettings.manualPassword);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.75rem 1rem',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '0.9rem',
    outline: 'none',
    transition: 'border-color 0.2s'
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: '0.5rem',
    fontWeight: '500',
    color: '#334155',
    fontSize: '0.875rem'
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        maxWidth: '500px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
      }}>
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid #e2e8f0'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              🔐 Reset Password for Dr. {selectedDoctor.name}
            </h3>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                color: '#64748b',
                padding: '0.25rem'
              }}
            >
              ×
            </button>
          </div>
          <p style={{ margin: '0.5rem 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>
            Choose how to set the new password
          </p>
        </div>

        <div style={{ padding: '1.5rem' }}>
          {/* Password Mode Selection */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={labelStyle}>Password Mode</label>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="passwordMode"
                  checked={passwordSettings.mode === 'auto'}
                  onChange={() => onPasswordSettingsChange({ ...passwordSettings, mode: 'auto' })}
                  style={{ margin: 0 }}
                />
                <span style={{ fontSize: '0.9rem' }}>🎲 Auto-generate password</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="passwordMode"
                  checked={passwordSettings.mode === 'manual'}
                  onChange={() => onPasswordSettingsChange({ ...passwordSettings, mode: 'manual' })}
                  style={{ margin: 0 }}
                />
                <span style={{ fontSize: '0.9rem' }}>✏️ Set password manually</span>
              </label>
            </div>
          </div>

          {passwordSettings.mode === 'auto' ? (
            <div style={{
              background: '#f0f9ff',
              padding: '1rem',
              borderRadius: '8px',
              border: '1px solid #bae6fd'
            }}>
              <p style={{ margin: 0, color: '#0369a1', fontSize: '0.9rem' }}>
                ✨ A new password will be automatically generated (12 characters with letters, numbers, and symbols)
              </p>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.9rem', color: '#64748b' }}>Manual password entry (minimum 8 characters)</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleAutoGenerate}
                >
                  🎲 Generate
                </Button>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={labelStyle}>
                  New Password for Dr. {selectedDoctor.name}
                </label>
                <input
                  type="text"
                  value={passwordSettings.manualPassword}
                  onChange={(e) => onPasswordSettingsChange({
                    ...passwordSettings,
                    manualPassword: e.target.value
                  })}
                  placeholder="Enter password (min 8 characters)"
                  style={{
                    ...inputStyle,
                    borderColor: passwordSettings.manualPassword && !isValidPassword(passwordSettings.manualPassword) ? '#ef4444' : '#e2e8f0'
                  }}
                />
                {passwordSettings.manualPassword && !isValidPassword(passwordSettings.manualPassword) && (
                  <span style={{ fontSize: '0.8rem', color: '#ef4444' }}>
                    Password must be at least 8 characters
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        <div style={{
          padding: '1.5rem',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          gap: '1rem',
          justifyContent: 'flex-end'
        }}>
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={onSubmit}
            disabled={!canSubmit() || credentialLoading === selectedDoctor.id}
          >
            {credentialLoading === selectedDoctor.id ? '⏳ Resetting...' : '🔑 Reset Password'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AdminCampManage() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { campId } = useParams<{ campId: string }>();
  const { addToast } = useToast();
  const { showAlert, AlertComponent } = useAlert();
  const [camp, setCamp] = useState<CampDetails | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [credentialLoading, setCredentialLoading] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Password Reset Modal State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<{ id: string; name: string } | null>(null);
  const [passwordSettings, setPasswordSettings] = useState({
    mode: 'auto' as 'auto' | 'manual',
    manualPassword: ''
  });

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') {
      navigate('/admin/login');
      return;
    }
    fetchCampData();
  }, [user, navigate, campId]);

  const fetchCampData = async () => {
    try {
      const [campResponse, doctorsResponse] = await Promise.all([
        apiClient.get(`/admin/camps/${campId}`),
        apiClient.get(`/admin/camps/${campId}/doctors`)
      ]);
      
      setCamp(campResponse.data.camp);
      setDoctors(doctorsResponse.data.doctors || []);
    } catch (error) {
      console.error('Failed to fetch camp data:', error);
      navigate('/admin/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (doctorId: string, doctorName: string) => {
    setSelectedDoctor({ id: doctorId, name: doctorName });
    setPasswordSettings({ mode: 'auto', manualPassword: '' });
    setShowPasswordModal(true);
  };

  const handlePasswordModalSubmit = async () => {
    if (!selectedDoctor) return;

    // Validate manual password if mode is manual
    if (passwordSettings.mode === 'manual' && passwordSettings.manualPassword.length < 8) {
      addToast({
        type: 'warning',
        title: 'Invalid Password',
        message: 'Password must be at least 8 characters long'
      });
      return;
    }

    setCredentialLoading(selectedDoctor.id);
    setShowPasswordModal(false);
    
    try {
      const payload: any = {
        passwordMode: passwordSettings.mode
      };
      
      if (passwordSettings.mode === 'manual') {
        payload.manualPassword = passwordSettings.manualPassword;
      }

      const response = await apiClient.post(`/admin/doctors/${selectedDoctor.id}/reset-password`, payload);
      
      const modeText = passwordSettings.mode === 'manual' ? 'set manually' : 'auto-generated';
      setSuccessMessage(`Password ${modeText} for Dr. ${selectedDoctor.name}. New password: ${response.data.tempPassword}`);
      setTimeout(() => setSuccessMessage(''), 10000);
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Password Reset Failed',
        message: error.response?.data?.message || 'Failed to reset password'
      });
    } finally {
      setCredentialLoading(null);
      setSelectedDoctor(null);
    }
  };

  const getStatusBadge = (camp: CampDetails) => {
    const now = new Date();
    const startTime = new Date(camp.startTime);
    const endTime = new Date(camp.endTime);
    
    if (now > endTime) {
      return { text: 'Completed', color: '#64748b', bg: '#f1f5f9' };
    } else if (now >= startTime && now <= endTime) {
      return { text: 'Active', color: '#059669', bg: '#d1fae5' };
    } else {
      return { text: 'Upcoming', color: '#d97706', bg: '#fef3c7' };
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          <p style={{ color: '#64748b' }}>Loading camp details...</p>
        </div>
      </PageContainer>
    );
  }

  if (!camp) {
    return (
      <PageContainer>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
            <h3 style={{ color: '#dc2626', margin: '0 0 1rem 0' }}>Camp Not Found</h3>
            <Button onClick={() => navigate('/admin/dashboard')} variant="primary">
              Back to Dashboard
            </Button>
          </div>
        </div>
      </PageContainer>
    );
  }

  const status = getStatusBadge(camp);

  return (
    <PageContainer>
      <Header
        title="Camp Management"
        subtitle={`Managing ${camp.name}`}
        icon="⚙️"
        theme="admin"
        actions={
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <HeaderButton variant="ghost" theme="admin" onClick={() => navigate('/admin/dashboard')}>
              ← Back to Dashboard
            </HeaderButton>
            <HeaderButton variant="primary" theme="admin" onClick={logout}>
              Logout
            </HeaderButton>
          </div>
        }
      />

      <ContentContainer>
        {successMessage && (
          <div style={{ 
            background: '#d1fae5', 
            color: '#065f46', 
            padding: '1rem 1.5rem', 
            borderRadius: '12px', 
            marginBottom: '2rem',
            border: '1px solid #6ee7b7'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.25rem' }}>✓</span>
              {successMessage}
            </div>
          </div>
        )}

        {/* Camp Information */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', margin: 0, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              🏥 Camp Information
            </h2>
            <span style={{
              background: status.bg,
              color: status.color,
              padding: '0.5rem 1rem',
              borderRadius: '20px',
              fontSize: '0.9rem',
              fontWeight: '600'
            }}>
              {status.text}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', margin: '0 0 1rem 0', color: '#334155', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                Camp Details
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Name:</span>
                  <div style={{ fontWeight: '600', color: '#1e293b' }}>{camp.name}</div>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Venue:</span>
                  <div style={{ color: '#334155' }}>{camp.venue}</div>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.9rem' }}>URL:</span>
                  <div style={{ 
                    color: '#7c3aed',
                    fontFamily: 'monospace',
                    background: '#f3f4f6',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    display: 'inline-block'
                  }}>
                    <a href={`/#/${camp.uniqueSlug}`} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
                      /#/{camp.uniqueSlug} ↗
                    </a>
                  </div>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Schedule:</span>
                  <div style={{ color: '#334155' }}>
                    📅 {new Date(camp.startTime).toLocaleDateString()} - {new Date(camp.endTime).toLocaleDateString()}
                  </div>
                  <div style={{ color: '#64748b', fontSize: '0.85rem' }}>
                    🕐 {new Date(camp.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(camp.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 style={{ fontSize: '1.1rem', margin: '0 0 1rem 0', color: '#334155', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                Hospital Information
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Hospital:</span>
                  <div style={{ fontWeight: '600', color: '#1e293b' }}>{camp.hospitalName}</div>
                </div>
                {camp.hospitalAddress && (
                  <div>
                    <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Address:</span>
                    <div style={{ color: '#334155' }}>{camp.hospitalAddress}</div>
                  </div>
                )}
                {camp.hospitalPhone && (
                  <div>
                    <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Phone:</span>
                    <div style={{ color: '#334155' }}>{camp.hospitalPhone}</div>
                  </div>
                )}
                {camp.hospitalEmail && (
                  <div>
                    <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Email:</span>
                    <div style={{ color: '#334155' }}>{camp.hospitalEmail}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Doctors Management */}
        <DoctorsDataGrid 
          doctors={doctors} 
          onResetPassword={handleResetPassword}
          credentialLoading={credentialLoading}
        />
      </ContentContainer>
      
      <PasswordResetModal 
        show={showPasswordModal}
        selectedDoctor={selectedDoctor}
        passwordSettings={passwordSettings}
        credentialLoading={credentialLoading}
        onClose={() => setShowPasswordModal(false)}
        onSubmit={handlePasswordModalSubmit}
        onPasswordSettingsChange={setPasswordSettings}
      />
      
      {AlertComponent}
    </PageContainer>
  );
}

function DoctorsDataGrid({ 
  doctors, 
  onResetPassword, 
  credentialLoading 
}: { 
  doctors: Doctor[]; 
  onResetPassword: (doctorId: string, doctorName: string) => void;
  credentialLoading: string | null;
}) {
  const [sortField, setSortField] = useState<keyof Doctor>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState('');

  const handleSort = (field: keyof Doctor) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredAndSortedDoctors = doctors
    .filter(doctor => 
      doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doctor.specialty && doctor.specialty.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      let aValue = a[sortField] || '';
      let bValue = b[sortField] || '';
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = (bValue as string).toLowerCase();
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  const getSortIcon = (field: keyof Doctor) => {
    if (sortField !== field) return '↕️';
    return sortDirection === 'asc' ? '↗️' : '↘️';
  };

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
    }}>
      <div style={{ 
        padding: '1.5rem 1.5rem 0 1.5rem',
        borderBottom: '1px solid #f1f5f9'
      }}>
        <h2 style={{ fontSize: '1.5rem', margin: '0 0 1rem 0', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          👨‍⚕️ Doctors Management ({doctors.length})
        </h2>
        
        <div style={{ position: 'relative', marginBottom: '1rem' }}>
          <input
            type="text"
            placeholder="Search doctors by name, email, or specialty..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem 1rem 0.75rem 3rem',
              border: '2px solid #e2e8f0',
              borderRadius: '10px',
              fontSize: '0.9rem',
              outline: 'none',
              transition: 'all 0.2s',
              background: '#fafafa'
            }}
          />
          <span style={{
            position: 'absolute',
            left: '1rem',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '1.1rem',
            color: '#94a3b8'
          }}>
            🔍
          </span>
        </div>
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          paddingBottom: '1rem'
        }}>
          <span style={{ color: '#64748b', fontSize: '0.9rem' }}>
            {filteredAndSortedDoctors.length} of {doctors.length} doctors
          </span>
        </div>
      </div>

      {doctors.length === 0 ? (
        <div style={{
          padding: '3rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👨‍⚕️</div>
          <h3 style={{ color: '#64748b', margin: '0 0 0.5rem 0' }}>No Doctors Assigned</h3>
          <p style={{ color: '#94a3b8', margin: 0 }}>No doctors have been assigned to this camp yet.</p>
        </div>
      ) : (
        <div style={{ overflow: 'auto', maxHeight: '600px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, background: '#f8fafc', zIndex: 1 }}>
              <tr>
                <th style={{
                  textAlign: 'left',
                  padding: '1rem',
                  fontWeight: '600',
                  color: '#334155',
                  borderBottom: '2px solid #e2e8f0',
                  cursor: 'pointer',
                  userSelect: 'none',
                  minWidth: '200px'
                }} onClick={() => handleSort('name')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    Doctor Details {getSortIcon('name')}
                  </div>
                </th>
                <th style={{
                  textAlign: 'left',
                  padding: '1rem',
                  fontWeight: '600',
                  color: '#334155',
                  borderBottom: '2px solid #e2e8f0',
                  cursor: 'pointer',
                  userSelect: 'none',
                  minWidth: '180px'
                }} onClick={() => handleSort('email')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    Contact Info {getSortIcon('email')}
                  </div>
                </th>
                <th style={{
                  textAlign: 'left',
                  padding: '1rem',
                  fontWeight: '600',
                  color: '#334155',
                  borderBottom: '2px solid #e2e8f0',
                  cursor: 'pointer',
                  userSelect: 'none',
                  minWidth: '120px'
                }} onClick={() => handleSort('specialty')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    Specialty {getSortIcon('specialty')}
                  </div>
                </th>
                <th style={{
                  textAlign: 'center',
                  padding: '1rem',
                  fontWeight: '600',
                  color: '#334155',
                  borderBottom: '2px solid #e2e8f0',
                  minWidth: '140px'
                }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedDoctors.map((doctor, index) => (
                <tr
                  key={doctor.id}
                  style={{
                    borderBottom: '1px solid #f1f5f9',
                    background: index % 2 === 0 ? '#ffffff' : '#fafafa',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    (e.target as HTMLElement).closest('tr')!.style.background = '#f0f9ff';
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLElement).closest('tr')!.style.background = index % 2 === 0 ? '#ffffff' : '#fafafa';
                  }}
                >
                  <td style={{ padding: '1rem', verticalAlign: 'top' }}>
                    <div>
                      <div style={{ fontWeight: '600', color: '#1e293b', marginBottom: '0.25rem' }}>
                        Dr. {doctor.name}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#7c3aed' }}>
                        ID: {doctor.id}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1rem', verticalAlign: 'top' }}>
                    <div>
                      <div style={{ fontWeight: '500', color: '#334155', marginBottom: '0.25rem' }}>
                        📧 {doctor.email}
                      </div>
                      {doctor.phone && (
                        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                          📞 {doctor.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '1rem', verticalAlign: 'top' }}>
                    <div style={{
                      background: '#eff6ff',
                      color: '#1e40af',
                      padding: '0.375rem 0.75rem',
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      display: 'inline-block'
                    }}>
                      {doctor.specialty || 'General'}
                    </div>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center', verticalAlign: 'top' }}>
                    <button
                      onClick={() => onResetPassword(doctor.id, doctor.name)}
                      disabled={credentialLoading === doctor.id}
                      style={{
                        background: credentialLoading === doctor.id ? '#e2e8f0' : 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
                        color: 'white',
                        padding: '0.5rem 1rem',
                        borderRadius: '8px',
                        border: 'none',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        cursor: credentialLoading === doctor.id ? 'not-allowed' : 'pointer',
                        transition: 'transform 0.2s',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                      onMouseEnter={(e) => {
                        if (credentialLoading !== doctor.id) {
                          (e.target as HTMLElement).style.transform = 'scale(1.05)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        (e.target as HTMLElement).style.transform = 'scale(1)';
                      }}
                    >
                      {credentialLoading === doctor.id ? '⏳ Resetting...' : '🔑 Reset Password'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filteredAndSortedDoctors.length === 0 && searchTerm && (
        <div style={{ 
          padding: '2rem',
          textAlign: 'center',
          color: '#64748b'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔍</div>
          <p style={{ margin: 0 }}>No doctors found matching "{searchTerm}"</p>
        </div>
      )}
    </div>
  );
}