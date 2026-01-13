import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { apiClient } from '../services/api';
import { 
  Header, 
  HeaderButton, 
  PageContainer, 
  ContentContainer, 
  Button,
  StatCard,
  Card,
  FormField,
  FormGroup,
  Input,
  Label,
  Select,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
  Modal,
  ModalHeader,
  ModalContent,
  ModalFooter,
  SectionCard
} from '../components';

interface Camp {
  id: string;
  uniqueSlug: string;
  name: string;
  venue: string;
  startTime: string;
  endTime: string;
  hospitalName: string;
}

interface Doctor {
  name: string;
  email: string;
  specialty: string;
  phone?: string;
}

export default function AdminDashboard() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [camps, setCamps] = useState<Camp[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateCamp, setShowCreateCamp] = useState(false);

  useEffect(() => {
    // Auth check is already handled by App.tsx route protection
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await apiClient.get('/admin/camps');
      setCamps(response.data.camps || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  if (loading) {
    return (
      <PageContainer>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          <p style={{ color: '#64748b' }}>Loading...</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Header
        title="Admin Dashboard"
        subtitle={`Welcome, ${user?.name}`}
        icon="⚙️"
        theme="admin"
        actions={
          <HeaderButton variant="primary" theme="admin" onClick={handleLogout}>
            Logout
          </HeaderButton>
        }
      />

      <ContentContainer>
        {/* Statistics */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <StatCard title="Total Camps" value={camps.length} icon="🏥" color="#7c3aed" />
          <StatCard title="Active Camps" value={camps.filter(c => new Date(c.endTime) > new Date()).length} icon="✓" color="#10b981" />
        </div>

        {/* Camps Section */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', margin: 0, color: '#1e293b' }}>Medical Camps</h2>
            <Button 
              onClick={() => setShowCreateCamp(!showCreateCamp)} 
              variant="primary"
              icon={showCreateCamp ? "✕" : "+"}
            >
              {showCreateCamp ? 'Cancel' : 'Create Camp'}
            </Button>
          </div>

          {showCreateCamp && (
            <CreateCampForm onSuccess={() => { setShowCreateCamp(false); fetchData(); }} />
          )}

          <CampsDataGrid camps={camps} navigate={navigate} />
        </section>
      </ContentContainer>
    </PageContainer>
  );
}



function CreateCampForm({ onSuccess }: { onSuccess: () => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    hospitalName: '',
    hospitalAddress: '',
    hospitalPhone: '',
    hospitalEmail: '',
    name: '',
    venue: '',
    startTime: '',
    endTime: '',
    campHeadName: '',
    campHeadEmail: '',
    campHeadPhone: ''
  });
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);
  const [csvError, setCsvError] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordSettings, setPasswordSettings] = useState({
    mode: 'auto' as 'auto' | 'manual',
    campHeadPassword: '',
    doctorPasswords: {} as Record<string, string>
  });

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvError('');
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          setCsvError('CSV file must have a header row and at least one doctor');
          return;
        }

        // Parse header to find column indices
        const header = lines[0].toLowerCase().split(',').map(h => h.trim());
        const nameIdx = header.findIndex(h => h.includes('name'));
        const emailIdx = header.findIndex(h => h.includes('email'));
        const specialtyIdx = header.findIndex(h => h.includes('special'));
        const phoneIdx = header.findIndex(h => h.includes('phone'));

        if (nameIdx === -1 || emailIdx === -1) {
          setCsvError('CSV must have "name" and "email" columns');
          return;
        }

        const parsedDoctors: Doctor[] = [];
        for (let i = 1; i < lines.length; i++) {
          const values = parseCSVLine(lines[i]);
          if (values.length > Math.max(nameIdx, emailIdx)) {
            const name = values[nameIdx]?.trim();
            const email = values[emailIdx]?.trim();
            
            if (name && email) {
              parsedDoctors.push({
                name,
                email,
                specialty: specialtyIdx !== -1 ? values[specialtyIdx]?.trim() || 'General' : 'General',
                phone: phoneIdx !== -1 ? values[phoneIdx]?.trim() : ''
              });
            }
          }
        }

        if (parsedDoctors.length === 0) {
          setCsvError('No valid doctors found in CSV');
          return;
        }

        setDoctors(parsedDoctors);
      } catch (err) {
        setCsvError('Failed to parse CSV file');
      }
    };

    reader.readAsText(file);
  };

  // Helper to parse CSV line handling quoted values
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  };

  const addDoctor = () => {
    setDoctors([...doctors, { name: '', email: '', specialty: '', phone: '' }]);
  };

  const updateDoctor = (index: number, field: keyof Doctor, value: string) => {
    const updated = [...doctors];
    updated[index] = { ...updated[index], [field]: value };
    setDoctors(updated);
  };

  const removeDoctor = (index: number) => {
    setDoctors(doctors.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (doctors.length === 0) {
      setError('Please add at least one doctor');
      return;
    }

    // Validate doctors
    const invalidDoctors = doctors.filter(d => !d.name || !d.email);
    if (invalidDoctors.length > 0) {
      setError('All doctors must have name and email');
      return;
    }

    // Show password modal instead of submitting directly
    setShowPasswordModal(true);
  };

  const handlePasswordModalSubmit = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    setShowPasswordModal(false);

    try {
      const payload: any = {
        hospitalName: formData.hospitalName,
        hospitalAddress: formData.hospitalAddress,
        hospitalPhone: formData.hospitalPhone,
        hospitalEmail: formData.hospitalEmail,
        name: formData.name,
        venue: formData.venue,
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString(),
        campHead: {
          name: formData.campHeadName,
          email: formData.campHeadEmail,
          phone: formData.campHeadPhone
        },
        doctors: doctors.map(d => ({
          name: d.name,
          email: d.email,
          specialty: d.specialty || 'General',
          phone: d.phone
        })),
        passwordSettings: {
          mode: passwordSettings.mode
        }
      };

      // Add manual passwords if mode is manual
      if (passwordSettings.mode === 'manual') {
        payload.passwordSettings.campHeadPassword = passwordSettings.campHeadPassword;
        payload.passwordSettings.doctorPasswords = passwordSettings.doctorPasswords;
      }

      const response = await apiClient.post('/admin/camps', payload);
      setResult(response.data);
      setTimeout(() => onSuccess(), 5000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create camp');
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div style={{ 
        background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)', 
        padding: '1.5rem', 
        borderRadius: '12px', 
        marginBottom: '1.5rem',
        border: '1px solid #6ee7b7'
      }}>
        <h3 style={{ color: '#065f46', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.5rem' }}>✓</span> Camp Created Successfully!
        </h3>
        <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
          <p style={{ margin: '0.5rem 0' }}>
            <strong>Camp URL:</strong>{' '}
            <a href={`/${result.camp.uniqueSlug}`} target="_blank" rel="noopener noreferrer" style={{ color: '#7c3aed' }}>
              {window.location.origin}/{result.camp.uniqueSlug}
            </a>
          </p>
          <p style={{ margin: '0.5rem 0' }}>
            <strong>Camp Head:</strong> {result.campHeadCredentials.email} / Password: <code style={{ background: '#f1f5f9', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>{result.campHeadCredentials.tempPassword}</code>
          </p>
        </div>
        <div style={{ background: 'white', padding: '1rem', borderRadius: '8px' }}>
          <strong>Doctor Credentials:</strong>
          <div style={{ maxHeight: '200px', overflowY: 'auto', marginTop: '0.5rem' }}>
            {result.doctorCredentials.map((doc: any, idx: number) => (
              <p key={idx} style={{ margin: '0.25rem 0', fontSize: '0.9rem' }}>
                {doc.name}: {doc.email} / <code style={{ background: '#f1f5f9', padding: '0.125rem 0.25rem', borderRadius: '4px' }}>{doc.tempPassword}</code>
              </p>
            ))}
          </div>
        </div>
      </div>
    );
  }



  // Password Modal Component
  const PasswordModal = () => {
    if (!showPasswordModal) return null;

    const generateRandomPassword = () => {
      const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
      let password = '';
      for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return password;
    };

    const handleAutoGenerate = () => {
      if (passwordSettings.mode === 'manual') {
        const newCampHeadPassword = generateRandomPassword();
        const newDoctorPasswords: Record<string, string> = {};
        
        doctors.forEach(doctor => {
          newDoctorPasswords[doctor.email] = generateRandomPassword();
        });

        setPasswordSettings({
          ...passwordSettings,
          campHeadPassword: newCampHeadPassword,
          doctorPasswords: newDoctorPasswords
        });
      }
    };

    const isValidPassword = (password: string) => password.length >= 8;

    const canSubmit = () => {
      if (passwordSettings.mode === 'auto') return true;
      
      if (!isValidPassword(passwordSettings.campHeadPassword)) return false;
      
      for (const doctor of doctors) {
        if (!isValidPassword(passwordSettings.doctorPasswords[doctor.email] || '')) return false;
      }
      return true;
    };

    return (
      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        size="lg"
      >
        <ModalHeader
          title="Password Settings"
          subtitle="Choose how to set passwords for camp head and doctors"
          icon="🔐"
          onClose={() => setShowPasswordModal(false)}
        />
        <ModalContent>
            {/* Password Mode Selection */}
            <FormField label="Password Mode">
              <div style={{ display: 'flex', gap: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="passwordMode"
                    checked={passwordSettings.mode === 'auto'}
                    onChange={() => setPasswordSettings({ ...passwordSettings, mode: 'auto' })}
                    style={{ margin: 0 }}
                  />
                  <span style={{ fontSize: '0.9rem' }}>🎲 Auto-generate passwords</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="passwordMode"
                    checked={passwordSettings.mode === 'manual'}
                    onChange={() => setPasswordSettings({ ...passwordSettings, mode: 'manual' })}
                    style={{ margin: 0 }}
                  />
                  <span style={{ fontSize: '0.9rem' }}>✏️ Set passwords manually</span>
                </label>
              </div>
            </FormField>

            {passwordSettings.mode === 'auto' ? (
              <div style={{
                background: '#f0f9ff',
                padding: '1rem',
                borderRadius: '8px',
                border: '1px solid #bae6fd'
              }}>
                <p style={{ margin: 0, color: '#0369a1', fontSize: '0.9rem' }}>
                  ✨ Passwords will be automatically generated (12 characters with letters, numbers, and symbols)
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
                    🎲 Generate All
                  </Button>
                </div>

                {/* Camp Head Password */}
                <FormField 
                  label={`Camp Head Password (${formData.campHeadName || 'Camp Head'})`}
                  error={passwordSettings.campHeadPassword && !isValidPassword(passwordSettings.campHeadPassword) ? 'Password must be at least 8 characters' : ''}
                >
                  <Input
                    type="text"
                    value={passwordSettings.campHeadPassword}
                    onChange={(e) => setPasswordSettings({
                      ...passwordSettings,
                      campHeadPassword: e.target.value
                    })}
                    placeholder="Enter password (min 8 characters)"
                  />
                </FormField>

                {/* Doctor Passwords */}
                <FormField label="Doctor Passwords">
                  <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'grid', gap: '0.75rem' }}>
                    {doctors.map((doctor, index) => (
                      <FormField 
                        key={index}
                        label={`${doctor.name} (${doctor.email})`}
                        error={passwordSettings.doctorPasswords[doctor.email] && !isValidPassword(passwordSettings.doctorPasswords[doctor.email]) ? 'Password must be at least 8 characters' : ''}
                      >
                        <Input
                          type="text"
                          size="sm"
                          value={passwordSettings.doctorPasswords[doctor.email] || ''}
                          onChange={(e) => setPasswordSettings({
                            ...passwordSettings,
                            doctorPasswords: {
                              ...passwordSettings.doctorPasswords,
                              [doctor.email]: e.target.value
                            }
                          })}
                          placeholder="Enter password (min 8 characters)"
                        />
                      </FormField>
                    ))}
                  </div>
                </FormField>
              </div>
            )}
        </ModalContent>
        <ModalFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setShowPasswordModal(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handlePasswordModalSubmit}
            disabled={loading || !canSubmit()}
          >
            {loading ? '⏳ Creating Camp...' : '✓ Create Camp'}
          </Button>
        </ModalFooter>
      </Modal>
    );
  };

  return (
    <Card style={{ marginBottom: '1.5rem' }}>
      {error && (
        <div style={{ 
          background: '#fee2e2', 
          color: '#991b1b', 
          padding: '0.75rem 1rem', 
          borderRadius: '8px', 
          marginBottom: '1rem',
          fontSize: '0.9rem'
        }}>
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
      
      {/* Hospital Details */}
      <SectionCard title="Hospital Details" icon="🏥">
        <FormGroup columns={2}>
          <FormField label="Hospital Name" required>
            <Input
              type="text"
              placeholder="Enter hospital name"
              value={formData.hospitalName}
              onChange={(e) => setFormData({ ...formData, hospitalName: e.target.value })}
              required
            />
          </FormField>
          <FormField label="Address">
            <Input
              type="text"
              placeholder="Hospital address"
              value={formData.hospitalAddress}
              onChange={(e) => setFormData({ ...formData, hospitalAddress: e.target.value })}
            />
          </FormField>
          <FormField label="Phone">
            <Input
              type="tel"
              placeholder="Hospital phone"
              value={formData.hospitalPhone}
              onChange={(e) => setFormData({ ...formData, hospitalPhone: e.target.value })}
            />
          </FormField>
          <FormField label="Email">
            <Input
              type="email"
              placeholder="Hospital email"
              value={formData.hospitalEmail}
              onChange={(e) => setFormData({ ...formData, hospitalEmail: e.target.value })}
            />
          </FormField>
        </FormGroup>
      </SectionCard>

      {/* Camp Details */}
      <SectionCard title="Camp Details" icon="📋">
        <FormGroup columns={2}>
          <FormField label="Camp Name" required>
            <Input
              type="text"
              placeholder="Enter camp name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </FormField>
          <FormField label="Venue" required>
            <Input
              type="text"
              placeholder="Camp venue"
              value={formData.venue}
              onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
              required
            />
          </FormField>
          <FormField label="Start Time" required>
            <Input
              type="datetime-local"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              required
            />
          </FormField>
          <FormField label="End Time" required>
            <Input
              type="datetime-local"
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              required
            />
          </FormField>
        </FormGroup>
      </SectionCard>

      {/* Camp Head */}
      <SectionCard title="Camp Head" icon="👤">
        <FormGroup columns={3}>
          <FormField label="Name" required>
            <Input
              type="text"
              placeholder="Camp head name"
              value={formData.campHeadName}
              onChange={(e) => setFormData({ ...formData, campHeadName: e.target.value })}
              required
            />
          </FormField>
          <FormField label="Email" required>
            <Input
              type="email"
              placeholder="Camp head email"
              value={formData.campHeadEmail}
              onChange={(e) => setFormData({ ...formData, campHeadEmail: e.target.value })}
              required
            />
          </FormField>
          <FormField label="Phone" required>
            <Input
              type="tel"
              placeholder="Camp head phone"
              value={formData.campHeadPhone}
              onChange={(e) => setFormData({ ...formData, campHeadPhone: e.target.value })}
              required
            />
          </FormField>
        </FormGroup>
      </SectionCard>

      {/* Doctors Section */}
      <div style={{ 
        background: '#f8fafc', 
        padding: '1rem', 
        borderRadius: '8px', 
        marginBottom: '1.5rem' 
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>👨‍⚕️</span> Doctors ({doctors.length})
          </h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="file"
              accept=".csv"
              ref={fileInputRef}
              onChange={handleCSVUpload}
              style={{ display: 'none' }}
            />
            <Button 
              type="button" 
              variant="secondary" 
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              📄 Upload CSV
            </Button>
            <Button 
              type="button" 
              variant="ghost" 
              size="sm"
              onClick={addDoctor}
            >
              + Add Doctor
            </Button>
          </div>
        </div>

        {csvError && (
          <div style={{ 
            background: '#fef3c7', 
            color: '#92400e', 
            padding: '0.5rem 0.75rem', 
            borderRadius: '6px', 
            marginBottom: '1rem',
            fontSize: '0.85rem'
          }}>
            ⚠️ {csvError}
          </div>
        )}

        {/* CSV Format Hint */}
        <div style={{ 
          background: '#eff6ff', 
          padding: '0.75rem', 
          borderRadius: '6px', 
          marginBottom: '1rem',
          fontSize: '0.8rem',
          color: '#1e40af'
        }}>
          💡 <strong>CSV Format:</strong> Headers should include: name, email, specialty (optional), phone (optional)
        </div>

        {doctors.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
            <p>No doctors added yet. Upload a CSV file or add manually.</p>
          </div>
        ) : (
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'white' }}>
                  <th style={{ textAlign: 'left', padding: '0.5rem', fontSize: '0.8rem', color: '#64748b' }}>#</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem', fontSize: '0.8rem', color: '#64748b' }}>Name *</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem', fontSize: '0.8rem', color: '#64748b' }}>Email *</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem', fontSize: '0.8rem', color: '#64748b' }}>Specialty</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem', fontSize: '0.8rem', color: '#64748b' }}>Phone</th>
                  <th style={{ width: '40px' }}></th>
                </tr>
              </thead>
              <tbody>
                {doctors.map((doctor, index) => (
                  <tr key={index} style={{ background: 'white' }}>
                    <td style={{ padding: '0.5rem', color: '#64748b', fontSize: '0.85rem' }}>{index + 1}</td>
                    <td style={{ padding: '0.5rem' }}>
                      <input
                        type="text"
                        value={doctor.name}
                        onChange={(e) => updateDoctor(index, 'name', e.target.value)}
                        placeholder="Doctor name"
                        style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px', width: '100%' }}
                      />
                    </td>
                    <td style={{ padding: '0.5rem' }}>
                      <input
                        type="email"
                        value={doctor.email}
                        onChange={(e) => updateDoctor(index, 'email', e.target.value)}
                        placeholder="Email"
                        style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px', width: '100%' }}
                      />
                    </td>
                    <td style={{ padding: '0.5rem' }}>
                      <input
                        type="text"
                        value={doctor.specialty}
                        onChange={(e) => updateDoctor(index, 'specialty', e.target.value)}
                        placeholder="Specialty"
                        style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px', width: '100%' }}
                      />
                    </td>
                    <td style={{ padding: '0.5rem' }}>
                      <input
                        type="tel"
                        value={doctor.phone || ''}
                        onChange={(e) => updateDoctor(index, 'phone', e.target.value)}
                        placeholder="Phone"
                        style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px', width: '100%' }}
                      />
                    </td>
                    <td style={{ padding: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => removeDoctor(index)}
                        style={{
                          background: '#fee2e2',
                          color: '#dc2626',
                          border: 'none',
                          borderRadius: '6px',
                          width: '32px',
                          height: '32px',
                          cursor: 'pointer',
                          fontSize: '1rem'
                        }}
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      <Button type="submit" variant="primary" size="lg" disabled={loading} fullWidth>
        {loading ? '⏳ Creating Camp...' : '🔐 Set Passwords & Create'}
      </Button>
      
      <PasswordModal />
      </form>
    </Card>
  );
}

function CampsDataGrid({ camps, navigate }: { camps: Camp[]; navigate: (path: string) => void }) {
  const [sortField, setSortField] = useState<keyof Camp>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState('');

  const handleSort = (field: keyof Camp) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredAndSortedCamps = camps
    .filter(camp => 
      camp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      camp.hospitalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      camp.venue.toLowerCase().includes(searchTerm.toLowerCase()) ||
      camp.uniqueSlug.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      // Handle date sorting
      if (sortField === 'startTime' || sortField === 'endTime') {
        const aTime = new Date(aValue as string).getTime();
        const bTime = new Date(bValue as string).getTime();
        if (aTime < bTime) return sortDirection === 'asc' ? -1 : 1;
        if (aTime > bTime) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      }
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = (bValue as string).toLowerCase();
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  const getSortIcon = (field: keyof Camp) => {
    if (sortField !== field) return '↕️';
    return sortDirection === 'asc' ? '↗️' : '↘️';
  };

  const getStatusBadge = (camp: Camp) => {
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

  if (camps.length === 0) {
    return (
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '3rem',
        textAlign: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏥</div>
        <h3 style={{ color: '#64748b', margin: '0 0 0.5rem 0' }}>No Camps Yet</h3>
        <p style={{ color: '#94a3b8', margin: 0 }}>Create your first medical camp to get started.</p>
      </div>
    );
  }

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
    }}>
      {/* Search Bar */}
      <div style={{ 
        padding: '1.5rem 1.5rem 0 1.5rem',
        borderBottom: '1px solid #f1f5f9'
      }}>
        <div style={{ position: 'relative', marginBottom: '1rem' }}>
          <input
            type="text"
            placeholder="Search camps, hospitals, venues..."
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
            {filteredAndSortedCamps.length} of {camps.length} camps
          </span>
        </div>
      </div>

      {/* Data Grid */}
      <div style={{ overflow: 'auto', maxHeight: '500px' }}>
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
                  Camp Details {getSortIcon('name')}
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
              }} onClick={() => handleSort('hospitalName')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  Hospital {getSortIcon('hospitalName')}
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
              }} onClick={() => handleSort('startTime')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  Schedule {getSortIcon('startTime')}
                </div>
              </th>
              <th style={{
                textAlign: 'center',
                padding: '1rem',
                fontWeight: '600',
                color: '#334155',
                borderBottom: '2px solid #e2e8f0',
                minWidth: '100px'
              }}>
                Status
              </th>
              <th style={{
                textAlign: 'center',
                padding: '1rem',
                fontWeight: '600',
                color: '#334155',
                borderBottom: '2px solid #e2e8f0',
                minWidth: '180px'
              }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedCamps.map((camp, index) => {
              const status = getStatusBadge(camp);
              return (
                <tr
                  key={camp.id}
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
                        {camp.name}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.25rem' }}>
                        📍 {camp.venue}
                      </div>
                      <div style={{ 
                        fontSize: '0.8rem', 
                        color: '#7c3aed',
                        fontFamily: 'monospace',
                        background: '#f3f4f6',
                        padding: '0.125rem 0.5rem',
                        borderRadius: '4px',
                        display: 'inline-block'
                      }}>
                        /{camp.uniqueSlug}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1rem', verticalAlign: 'top' }}>
                    <div>
                      <div style={{ fontWeight: '500', color: '#334155', marginBottom: '0.25rem' }}>
                        {camp.hospitalName}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1rem', verticalAlign: 'top' }}>
                    <div>
                      <div style={{ fontSize: '0.9rem', color: '#059669', fontWeight: '500', marginBottom: '0.125rem' }}>
                        📅 {new Date(camp.startTime).toLocaleDateString()}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        🕐 {new Date(camp.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(camp.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center', verticalAlign: 'top' }}>
                    <span style={{
                      background: status.bg,
                      color: status.color,
                      padding: '0.375rem 0.75rem',
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      fontWeight: '600'
                    }}>
                      {status.text}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center', verticalAlign: 'top' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', alignItems: 'center' }}>
                      <button
                        onClick={() => navigate(`/admin/camps/${camp.id}/manage`)}
                        style={{
                          background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                          color: 'white',
                          padding: '0.5rem 0.75rem',
                          borderRadius: '6px',
                          border: 'none',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'transform 0.2s',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}
                        onMouseEnter={(e) => {
                          (e.target as HTMLElement).style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                          (e.target as HTMLElement).style.transform = 'scale(1)';
                        }}
                      >
                        ⚙️ Manage
                      </button>
                      <a
                        href={`/${camp.uniqueSlug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
                          color: 'white',
                          padding: '0.5rem 0.75rem',
                          borderRadius: '6px',
                          textDecoration: 'none',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          transition: 'transform 0.2s',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => {
                          (e.target as HTMLElement).style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                          (e.target as HTMLElement).style.transform = 'scale(1)';
                        }}
                      >
                        🚀 Visit
                      </a>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filteredAndSortedCamps.length === 0 && searchTerm && (
        <div style={{ 
          padding: '2rem',
          textAlign: 'center',
          color: '#64748b'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔍</div>
          <p style={{ margin: 0 }}>No camps found matching "{searchTerm}"</p>
        </div>
      )}
    </div>
  );
}
