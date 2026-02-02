import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import api from '../services/api';
import { Analytics } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { 
  Header, 
  HeaderButton, 
  PageContainer, 
  ContentContainer,
  StatCard,
  InfoCard,
  SectionCard
} from '../components';

interface CampDetails {
  id: string;
  name: string;
  logoUrl?: string;
  backgroundImageUrl?: string;
  hospitalName: string;
}

/**
 * Camp Head dashboard for analytics and reports
 * Accessed via: domain.com/{campSlug}/camp-head
 */
export default function CampHeadDashboard() {
  const { campSlug } = useParams<{ campSlug: string }>();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [camp, setCamp] = useState<CampDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [analyticsResponse, campResponse] = await Promise.all([
        api.get(`/camp-head/${user?.campId}/analytics`),
        api.get(`/public/${campSlug}`)
      ]);
      setAnalytics(analyticsResponse.data.analytics);
      setCamp(campResponse.data.camp);
      
      // Debug: Log analytics data
      console.log('Analytics data:', analyticsResponse.data.analytics);
      console.log('Follow-up distribution:', analyticsResponse.data.analytics?.followUpDistribution);
    } catch (error) {
      // Error handled silently
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
      // Error handled silently
    }
  };

  const handleLogout = () => {
    logout();
    navigate(`/${campSlug}/login`);
  };

  if (loading) {
    return <div className="loading">Loading analytics...</div>;
  }

  const pageStyle: React.CSSProperties = camp?.backgroundImageUrl ? {
    backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.95)), url(${camp.backgroundImageUrl})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed',
    minHeight: '100vh'
  } : {};

  return (
    <PageContainer style={pageStyle}>
      <Header
        title="Camp Head Portal"
        subtitle={`Welcome, ${user?.name}`}
        icon={camp?.logoUrl || "🏥"}
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
          <SectionCard title="Follow-up Recommendations">
            {analytics?.followUpDistribution && analytics.followUpDistribution.length > 0 ? (
              <div style={{ width: '100%', height: '350px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.followUpDistribution.map((item) => ({
                        name: item.followUpAdvice,
                        value: parseInt(item.count.toString())
                      }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {analytics.followUpDistribution.map((entry, index) => {
                        const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#a4de6c'];
                        return <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />;
                      })}
                    </Pie>
                    <Tooltip />
                    <Legend 
                      verticalAlign="bottom" 
                      height={60}
                      wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p style={{ color: 'var(--color-text-secondary)' }}>No follow-up data available</p>
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
