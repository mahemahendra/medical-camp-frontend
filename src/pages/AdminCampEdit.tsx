import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { apiClient } from '../services/api';
import { Header, HeaderButton, PageContainer, ContentContainer, CampForm } from '../components';
import { CampFormData } from '../types/camp';

export default function AdminCampEdit() {
  const { campId } = useParams<{ campId: string }>();
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  const [initialData, setInitialData] = useState<Partial<CampFormData> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchCampDetails();
  }, [campId]);

  const fetchCampDetails = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/admin/camps/${campId}`);
      const camp = response.data.camp;

      setInitialData({
        hospitalName: camp.hospitalName || '',
        hospitalAddress: camp.hospitalAddress || '',
        hospitalPhone: camp.hospitalPhone || '',
        hospitalEmail: camp.hospitalEmail || '',
        name: camp.name || '',
        description: camp.description || '',
        venue: camp.venue || '',
        startTime: camp.startTime ? new Date(camp.startTime).toISOString().slice(0, 16) : '',
        endTime: camp.endTime ? new Date(camp.endTime).toISOString().slice(0, 16) : '',
        contactInfo: camp.contactInfo || '',
        campHeadName: '', // Not editable in edit mode
        campHeadEmail: '',
        campHeadPhone: '',
        logoUrl: camp.logoUrl || '',
        backgroundImageUrl: camp.backgroundImageUrl || '',
        doctors: [] // Doctors are managed separately in AdminCampManage
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load camp details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: CampFormData) => {
    try {
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

      if (data.description) {
        formDataToSend.append('description', data.description);
      }
      if (data.contactInfo) {
        formDataToSend.append('contactInfo', data.contactInfo);
      }

      // Append files if new ones are selected
      if (data.logo) {
        formDataToSend.append('logo', data.logo);
      }
      if (data.backgroundImage) {
        formDataToSend.append('backgroundImage', data.backgroundImage);
      }

      await apiClient.put(`/admin/camps/${campId}`, formDataToSend);
      setSuccess(true);

      // Redirect after a brief delay to show success message
      setTimeout(() => {
        navigate(`/admin/camps/${campId}/manage`);
      }, 1500);
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to update camp');
    }
  };

  const handleCancel = () => {
    navigate(`/admin/camps/${campId}/manage`);
  };

  if (loading) {
    return (
      <PageContainer>
        <Header
          title="Edit Camp"
          subtitle="Update camp details"
          icon="✏️"
          theme="admin"
        />
        <ContentContainer>
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
            <p>Loading camp details...</p>
          </div>
        </ContentContainer>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <Header
          title="Edit Camp"
          subtitle="Update camp details"
          icon="✏️"
          theme="admin"
          actions={
            <HeaderButton variant="ghost" theme="admin" onClick={() => navigate('/admin/camps')}>
              ← Back to Camps
            </HeaderButton>
          }
        />
        <ContentContainer>
          <div style={{
            background: '#fee2e2',
            color: '#991b1b',
            padding: '1rem',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        </ContentContainer>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Header
        title="Edit Camp"
        subtitle={initialData?.name || 'Update camp details'}
        icon="✏️"
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
        {success && (
          <div style={{
            background: '#d1fae5',
            color: '#065f46',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1rem',
            textAlign: 'center'
          }}>
            ✓ Camp updated successfully! Redirecting...
          </div>
        )}

        {initialData && (
          <CampForm
            mode="edit"
            initialValues={initialData}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        )}
      </ContentContainer>
    </PageContainer>
  );
}
