import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { apiClient } from '../services/api';
import {
  Header,
  HeaderButton,
  PageContainer,
  ContentContainer,
  StatCard,
  Card
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

export default function AdminDashboard() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [camps, setCamps] = useState<Camp[]>([]);
  const [loading, setLoading] = useState(true);

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
        {/* Main Dashboard Content */}
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>

          <Card
            style={{
              cursor: 'pointer',
              transition: 'all 0.2s',
              border: '1px solid #e2e8f0',
              padding: '0'
            }}
            onClick={() => navigate('/admin/camps')}
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>

              {/* Main Action Area */}
              <div style={{
                padding: '2rem',
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: '1.5rem',
                borderBottom: '1px solid #f1f5f9'
              }}>
                <div style={{
                  fontSize: '3.5rem',
                  background: '#f0f9ff',
                  width: '100px',
                  height: '100px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '20px'
                }}>
                  🏥
                </div>
                <div>
                  <h2 style={{ fontSize: '1.5rem', margin: '0 0 0.5rem 0', color: '#1e293b' }}>Manage Medical Camps</h2>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '1rem', lineHeight: '1.5' }}>
                    View, create, and manage all medical camps. Monitor status and details.
                  </p>
                </div>
                <div style={{ marginLeft: 'auto', fontSize: '2rem', color: '#cbd5e1' }}>
                  →
                </div>
              </div>

              {/* Stats Bar */}
              <div style={{
                background: '#f8fafc',
                padding: '1.5rem 2rem',
                display: 'flex',
                gap: '3rem',
                borderTop: '1px solid #e2e8f0'
              }}>
                <div>
                  <div style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: '#64748b', fontWeight: '600', letterSpacing: '0.05em' }}>
                    Total Camps
                  </div>
                  <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#0f172a', marginTop: '0.25rem' }}>
                    {camps.length}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: '#64748b', fontWeight: '600', letterSpacing: '0.05em' }}>
                    Active Now
                  </div>
                  <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#10b981', marginTop: '0.25rem' }}>
                    {camps.filter(c => new Date(c.endTime) > new Date()).length}
                  </div>
                </div>
              </div>

            </div>
          </Card>

        </div>

      </ContentContainer>
    </PageContainer>
  );
}
