import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { apiClient } from '../services/api';
import { Header, HeaderButton, PageContainer, ContentContainer, CampForm } from '../components';
import { CampFormData } from '../types/camp';

export default function AdminCampCreate() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [result, setResult] = React.useState<any>(null);

  const handleSubmit = async (data: CampFormData) => {
    const formDataToSend = new FormData();

    // Append text fields
    formDataToSend.append('hospitalName', data.hospitalName);
    formDataToSend.append('hospitalAddress', data.hospitalAddress);
    formDataToSend.append('hospitalPhone', data.hospitalPhone);
    formDataToSend.append('hospitalEmail', data.hospitalEmail);
    formDataToSend.append('name', data.name);
    formDataToSend.append('venue', data.venue);
    formDataToSend.append('startTime', new Date(data.startTime).toISOString());
    formDataToSend.append('endTime', new Date(data.endTime).toISOString());

    // Append files if selected (File objects, not strings)
    if (data.logo instanceof File) {
      formDataToSend.append('logo', data.logo);
    }
    if (data.backgroundImage instanceof File) {
      formDataToSend.append('backgroundImage', data.backgroundImage);
    }

    // Append complex objects as JSON strings
    const campHeadData = {
      name: data.campHeadName,
      email: data.campHeadEmail,
      phone: data.campHeadPhone
    };
    formDataToSend.append('campHead', JSON.stringify(campHeadData));

    const doctorsData = data.doctors.map(d => ({
      name: d.name,
      email: d.email,
      specialty: d.specialty || 'General',
      phone: d.phone
    }));
    formDataToSend.append('doctors', JSON.stringify(doctorsData));

    const pwSettings: any = { mode: data.passwordSettings?.mode || 'auto' };
    if (data.passwordSettings?.mode === 'manual') {
      pwSettings.campHeadPassword = data.passwordSettings.campHeadPassword;
      pwSettings.doctorPasswords = data.passwordSettings.doctorPasswords;
    }
    formDataToSend.append('passwordSettings', JSON.stringify(pwSettings));

    const response = await apiClient.post('/admin/camps', formDataToSend);
    setResult(response.data);
  };

  const handleCancel = () => {
    navigate('/admin/camps');
  };

  if (result) {
    return (
      <PageContainer>
        <Header
          title="Camp Created Successfully"
          subtitle="Your medical camp has been created"
          icon="✓"
          theme="admin"
          actions={
            <HeaderButton variant="primary" theme="admin" onClick={() => navigate('/admin/camps')}>
              Back to Camps
            </HeaderButton>
          }
        />

        <ContentContainer>
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
                <a href={`/#/${result.camp.uniqueSlug}`} target="_blank" rel="noopener noreferrer" style={{ color: '#7c3aed' }}>
                  {window.location.origin}/#/{result.camp.uniqueSlug}
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
        </ContentContainer>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Header
        title="Create New Camp"
        subtitle="Set up a new medical camp"
        icon="+"
        theme="admin"
        actions={
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <HeaderButton variant="ghost" theme="admin" onClick={() => navigate('/admin/camps')}>
              ← Back to Camps
            </HeaderButton>
            <HeaderButton variant="primary" theme="admin" onClick={logout}>
              Logout
            </HeaderButton>
          </div>
        }
      />

      <ContentContainer>
        <CampForm
          mode="create"
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </ContentContainer>
    </PageContainer>
  );
}
