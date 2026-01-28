import React, { useState, useRef, useEffect } from 'react';
import {
  Button,
  FormField,
  FormGroup,
  Input,
  Modal,
  ModalHeader,
  ModalContent,
  ModalFooter,
  SectionCard
} from './index';
import { CampFormProps, CampFormData, Doctor } from '../types/camp';

export function CampForm({ mode, initialValues, onSubmit, onCancel, loading: externalLoading }: CampFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<CampFormData>({
    hospitalName: initialValues?.hospitalName || '',
    hospitalAddress: initialValues?.hospitalAddress || '',
    hospitalPhone: initialValues?.hospitalPhone || '',
    hospitalEmail: initialValues?.hospitalEmail || '',
    name: initialValues?.name || '',
    description: initialValues?.description || '',
    venue: initialValues?.venue || '',
    startTime: initialValues?.startTime || '',
    endTime: initialValues?.endTime || '',
    contactInfo: initialValues?.contactInfo || '',
    campHeadName: initialValues?.campHeadName || '',
    campHeadEmail: initialValues?.campHeadEmail || '',
    campHeadPhone: initialValues?.campHeadPhone || '',
    logoUrl: initialValues?.logoUrl || '',
    backgroundImageUrl: initialValues?.backgroundImageUrl || '',
    doctors: initialValues?.doctors || []
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>(initialValues?.doctors || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [csvError, setCsvError] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordSettings, setPasswordSettings] = useState({
    mode: 'auto' as 'auto' | 'manual',
    campHeadPassword: '',
    doctorPasswords: {} as Record<string, string>
  });

  // Update formData when initialValues change (for edit mode)
  useEffect(() => {
    if (initialValues) {
      setFormData({
        hospitalName: initialValues.hospitalName || '',
        hospitalAddress: initialValues.hospitalAddress || '',
        hospitalPhone: initialValues.hospitalPhone || '',
        hospitalEmail: initialValues.hospitalEmail || '',
        name: initialValues.name || '',
        description: initialValues.description || '',
        venue: initialValues.venue || '',
        startTime: initialValues.startTime || '',
        endTime: initialValues.endTime || '',
        contactInfo: initialValues.contactInfo || '',
        campHeadName: initialValues.campHeadName || '',
        campHeadEmail: initialValues.campHeadEmail || '',
        campHeadPhone: initialValues.campHeadPhone || '',
        logoUrl: initialValues.logoUrl || '',
        backgroundImageUrl: initialValues.backgroundImageUrl || '',
        doctors: initialValues.doctors || []
      });
      setDoctors(initialValues.doctors || []);
    }
  }, [initialValues]);

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvError('');
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\\n').filter(line => line.trim());

        if (lines.length < 2) {
          setCsvError('CSV file must have a header row and at least one doctor');
          return;
        }

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

    if (doctors.length === 0 && mode === 'create') {
      setError('Please add at least one doctor');
      return;
    }

    const invalidDoctors = doctors.filter(d => !d.name || !d.email);
    if (invalidDoctors.length > 0) {
      setError('All doctors must have name and email');
      return;
    }

    // For create mode, show password modal
    if (mode === 'create') {
      setShowPasswordModal(true);
    } else {
      // For edit mode, submit directly
      await handleFormSubmit();
    }
  };

  const handleFormSubmit = async () => {
    setLoading(true);
    setError('');
    setShowPasswordModal(false);

    try {
      const submitData: CampFormData = {
        ...formData,
        logo: logoFile,
        backgroundImage: backgroundFile,
        doctors: doctors,
      };

      if (mode === 'create') {
        submitData.passwordSettings = passwordSettings;
      }

      await onSubmit(submitData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save camp');
    } finally {
      setLoading(false);
    }
  };

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
            onClick={handleFormSubmit}
            disabled={loading || !canSubmit()}
          >
            {loading ? '⏳ Creating Camp...' : '✓ Create Camp'}
          </Button>
        </ModalFooter>
      </Modal>
    );
  };

  return (
    <>
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
            <FormField label="Camp Logo">
              {formData.logoUrl && mode === 'edit' && (
                <div style={{ marginBottom: '0.5rem' }}>
                  <img src={formData.logoUrl} alt="Current logo" style={{ maxWidth: '100px', maxHeight: '100px', borderRadius: '4px' }} />
                  <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.25rem 0 0 0' }}>Current logo (upload new to replace)</p>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                style={{
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  width: '100%'
                }}
              />
              {logoFile && (
                <p style={{ fontSize: '0.8rem', color: '#059669', margin: '0.25rem 0 0 0' }}>
                  ✓ Selected: {logoFile.name} ({(logoFile.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </FormField>
            <FormField label="Background Image">
              {formData.backgroundImageUrl && mode === 'edit' && (
                <div style={{ marginBottom: '0.5rem' }}>
                  <img src={formData.backgroundImageUrl} alt="Current background" style={{ maxWidth: '100px', maxHeight: '100px', borderRadius: '4px' }} />
                  <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.25rem 0 0 0' }}>Current background (upload new to replace)</p>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setBackgroundFile(e.target.files?.[0] || null)}
                style={{
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  width: '100%'
                }}
              />
              {backgroundFile && (
                <p style={{ fontSize: '0.8rem', color: '#059669', margin: '0.25rem 0 0 0' }}>
                  ✓ Selected: {backgroundFile.name} ({(backgroundFile.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </FormField>
          </FormGroup>
        </SectionCard>

        {mode === 'create' && (
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
        )}

        {mode === 'create' && (
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
                            value={doctor.phone}
                            onChange={(e) => updateDoctor(index, 'phone', e.target.value)}
                            placeholder="Phone"
                            style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px', width: '100%' }}
                          />
                        </td>
                        <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => removeDoctor(index)}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '1.2rem',
                              color: '#dc2626',
                              padding: '0.25rem'
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
        )}

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          {onCancel && (
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            variant="primary"
            disabled={loading || externalLoading}
          >
            {loading || externalLoading ? '⏳ Saving...' : mode === 'create' ? '✓ Create Camp' : '✓ Update Camp'}
          </Button>
        </div>
      </form>

      {mode === 'create' && <PasswordModal />}
    </>
  );
}
