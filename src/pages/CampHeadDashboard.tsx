import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import api from '../services/api';
import { Analytics } from '../types';
import { 
  Header, 
  HeaderButton, 
  PageContainer, 
  ContentContainer,
  StatCard,
  InfoCard,
  SectionCard
} from '../components';

/**
 * Camp Head dashboard for analytics and reports
 * Accessed via: domain.com/{campSlug}/camp-head
 */
export default function CampHeadDashboard() {
  console.log('CampHeadDashboard: Component rendering');
  const { campSlug } = useParams<{ campSlug: string }>();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const response = await api.get(`/camp-head/${user?.campId}/analytics`);
      setAnalytics(response.data.analytics);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = async () => {
    try {
      const response = await api.get(`/camp-head/${user?.campId}/export/csv`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `camp-export-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate(`/${campSlug}/login`);
  };

  if (loading) {
    return <div className="loading">Loading analytics...</div>;
  }

  return (
    <PageContainer>
      <Header
        title="Camp Head Portal"
        subtitle={`Welcome, ${user?.name}`}
        icon="🏥"
        theme="camp-head"
        actions={
          <HeaderButton variant="primary" theme="camp-head" onClick={handleLogout}>
            Logout
          </HeaderButton>
        }
      />

      <ContentContainer>
        {/* Quick Navigation Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <InfoCard
            icon="👨‍⚕️"
            title="Doctors"
            subtitle="View all doctors →"
            onClick={() => navigate(`/${campSlug}/camp-head/doctors`)}
            variant="info"
          />

          <InfoCard
            icon="👥"
            title="Visitors"
            subtitle={`${analytics?.totalVisitors || 0} registered →`}
            onClick={() => navigate(`/${campSlug}/camp-head/visitors`)}
            variant="success"
          />

          <InfoCard
            icon="📊"
            title="Export CSV"
            subtitle="Download report →"
            onClick={downloadCSV}
            variant="warning"
          />
        </div>

        {/* Key Metrics */}
        <h2 style={{ marginBottom: '1rem' }}>Analytics Overview</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <StatCard
            label="Total Visitors"
            value={analytics?.totalVisitors || 0}
            variant="primary"
          />
          <StatCard
            label="Completed Consultations"
            value={analytics?.completedVisits || 0}
            variant="success"
          />
          <StatCard
            label="Pending"
            value={analytics?.pendingVisits || 0}
            variant="warning"
          />
        </div>

        {/* Demographics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <SectionCard title="Gender Distribution">
            {analytics?.genderDistribution && analytics.genderDistribution.length > 0 ? (
              analytics.genderDistribution.map((item) => (
                <div key={item.gender} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--color-border)' }}>
                  <span>{item.gender}</span>
                  <strong>{item.count}</strong>
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--color-text-secondary)' }}>No data available</p>
            )}
          </SectionCard>

          <SectionCard title="Doctor Statistics">
            {analytics?.doctorStats && analytics.doctorStats.length > 0 ? (
              analytics.doctorStats.map((item, index) => (
                <div key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--color-border)' }}>
                  <span>Dr. {item.doctorName}</span>
                  <strong>{item.visitCount} consultations</strong>
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--color-text-secondary)' }}>No consultations yet</p>
            )}
          </SectionCard>
        </div>
      </ContentContainer>
    </PageContainer>
  );
}
