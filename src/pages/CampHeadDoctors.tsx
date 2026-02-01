import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import api from '../services/api';
import { User } from '../types';
import { 
  Header, 
  PageContainer, 
  ContentContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
  StatusBadge,
  Pagination,
  Card,
  AvatarBadge,
  Button,
  Modal,
  ModalHeader,
  ModalContent,
  ModalFooter,
  Input,
  FormField
} from '../components';

const PAGE_SIZE = 12;

/**
 * Camp Head - Doctors List Page
 * Grid layout with pagination
 */
export default function CampHeadDoctors() {
  const { campSlug } = useParams<{ campSlug: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [doctors, setDoctors] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<User | null>(null);
  const [passwordMode, setPasswordMode] = useState<'auto' | 'manual'>('auto');
  const [manualPassword, setManualPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetResult, setResetResult] = useState<any>(null);

  useEffect(() => {
    loadDoctors();
  }, [currentPage]);

  const loadDoctors = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/camp-head/${user?.campId}/doctors`, {
        params: { page: currentPage, limit: PAGE_SIZE }
      });
      setDoctors(response.data.doctors || []);
      setTotalCount(response.data.total || 0);
    } catch (error) {
      console.error('Failed to load doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = (doctor: User) => {
    setSelectedDoctor(doctor);
    setPasswordMode('auto');
    setManualPassword('');
    setResetResult(null);
    setShowResetModal(true);
  };

  const handleConfirmReset = async () => {
    if (!selectedDoctor) return;

    setResetLoading(true);
    try {
      const response = await api.post(
        `/camp-head/${user?.campId}/doctors/${selectedDoctor.id}/reset-password`,
        {
          passwordMode,
          manualPassword: passwordMode === 'manual' ? manualPassword : undefined
        }
      );
      setResetResult(response.data);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setResetLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowResetModal(false);
    setSelectedDoctor(null);
    setResetResult(null);
    setManualPassword('');
  };

  const generateRandomPassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setManualPassword(password);
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <PageContainer>
      <Header
        title="Doctors"
        subtitle={`${totalCount} doctor${totalCount !== 1 ? 's' : ''} in camp`}
        icon="👨‍⚕️"
        theme="camp-head"
        onBack={() => navigate(`/${campSlug}/camp-head`)}
      />

      <ContentContainer>
        {loading ? (
          <div className="loading">Loading doctors...</div>
        ) : doctors.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: 'var(--color-text-secondary)' }}>No doctors found in this camp.</p>
          </Card>
        ) : (
          <>
            {/* Doctors Table */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>#</TableHeaderCell>
                  <TableHeaderCell>Name</TableHeaderCell>
                  <TableHeaderCell>Specialty</TableHeaderCell>
                  <TableHeaderCell>Email</TableHeaderCell>
                  <TableHeaderCell>Phone</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell>Actions</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {doctors.map((doctor, index) => (
                  <TableRow key={doctor.id}>
                    <TableCell style={{ color: 'var(--color-text-secondary)' }}>
                      {(currentPage - 1) * PAGE_SIZE + index + 1}
                    </TableCell>
                    <TableCell>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <AvatarBadge 
                          name={doctor.name || 'Doctor'} 
                          variant="primary"
                        />
                        <span style={{ fontWeight: '500' }}>Dr. {doctor.name}</span>
                      </div>
                    </TableCell>
                    <TableCell style={{ color: 'var(--color-text-secondary)' }}>
                      {doctor.specialty || 'General Physician'}
                    </TableCell>
                    <TableCell>{doctor.email}</TableCell>
                    <TableCell>{doctor.phone || '-'}</TableCell>
                    <TableCell>
                      <StatusBadge 
                        status={doctor.isActive ? 'ACTIVE' : 'INACTIVE'} 
                        statusMap={{
                          'ACTIVE': { text: 'Active', variant: 'success' },
                          'INACTIVE': { text: 'Inactive', variant: 'error' }
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleResetPassword(doctor)}
                      >
                        🔑 Reset Password
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </ContentContainer>

      {/* Reset Password Modal */}
      <Modal
        isOpen={showResetModal}
        onClose={handleCloseModal}
        size="md"
      >
        <ModalHeader
          title="Reset Doctor Password"
          subtitle={selectedDoctor ? `Dr. ${selectedDoctor.name}` : ''}
          icon="🔑"
          onClose={handleCloseModal}
        />
        <ModalContent>
          {resetResult ? (
            // Success result
            <div style={{
              background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
              padding: '1.5rem',
              borderRadius: '12px',
              border: '1px solid #6ee7b7'
            }}>
              <h3 style={{ color: '#065f46', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.5rem' }}>✓</span> Password Reset Successfully!
              </h3>
              <div style={{ background: 'white', padding: '1rem', borderRadius: '8px' }}>
                <p style={{ margin: '0.5rem 0' }}>
                  <strong>Doctor:</strong> {resetResult.doctorName}
                </p>
                <p style={{ margin: '0.5rem 0' }}>
                  <strong>Email:</strong> {resetResult.doctorEmail}
                </p>
                <p style={{ margin: '0.5rem 0' }}>
                  <strong>New Password:</strong>{' '}
                  <code style={{
                    background: '#f1f5f9',
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    color: '#7c3aed',
                    display: 'inline-block',
                    marginTop: '0.5rem'
                  }}>
                    {resetResult.tempPassword}
                  </code>
                </p>
              </div>
              <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#065f46' }}>
                ℹ️ Please share this password with the doctor securely. They can change it after logging in.
              </p>
            </div>
          ) : (
            // Password reset form
            <>
              <FormField label="Password Generation Mode">
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="passwordMode"
                      checked={passwordMode === 'auto'}
                      onChange={() => setPasswordMode('auto')}
                      style={{ margin: 0 }}
                    />
                    <span style={{ fontSize: '0.9rem' }}>🎲 Auto-generate (12 characters)</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="passwordMode"
                      checked={passwordMode === 'manual'}
                      onChange={() => setPasswordMode('manual')}
                      style={{ margin: 0 }}
                    />
                    <span style={{ fontSize: '0.9rem' }}>✏️ Set manually</span>
                  </label>
                </div>
              </FormField>

              {passwordMode === 'auto' ? (
                <div style={{
                  background: '#f0f9ff',
                  padding: '1rem',
                  borderRadius: '8px',
                  border: '1px solid #bae6fd'
                }}>
                  <p style={{ margin: 0, color: '#0369a1', fontSize: '0.9rem' }}>
                    ✨ A secure random password will be generated automatically
                  </p>
                </div>
              ) : (
                <FormField
                  label="New Password"
                  error={manualPassword && manualPassword.length < 8 ? 'Password must be at least 8 characters' : ''}
                >
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Input
                      type="text"
                      value={manualPassword}
                      onChange={(e) => setManualPassword(e.target.value)}
                      placeholder="Enter password (min 8 characters)"
                      style={{ flex: 1 }}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={generateRandomPassword}
                    >
                      🎲 Generate
                    </Button>
                  </div>
                  {manualPassword && (
                    <div style={{
                      marginTop: '0.5rem',
                      fontSize: '0.85rem',
                      color: manualPassword.length >= 8 ? '#16a34a' : '#dc2626'
                    }}>
                      {manualPassword.length >= 8 ? '✓' : '×'} {manualPassword.length} / 8 characters minimum
                    </div>
                  )}
                </FormField>
              )}
            </>
          )}
        </ModalContent>
        <ModalFooter>
          {resetResult ? (
            <Button
              type="button"
              variant="primary"
              onClick={handleCloseModal}
            >
              Close
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="secondary"
                onClick={handleCloseModal}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleConfirmReset}
                disabled={resetLoading || (passwordMode === 'manual' && manualPassword.length < 8)}
              >
                {resetLoading ? '⏳ Resetting...' : '🔑 Reset Password'}
              </Button>
            </>
          )}
        </ModalFooter>
      </Modal>
    </PageContainer>
  );
}
