import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import api from '../services/api';

/**
 * Login page for Staff (Camp Head and Doctors)
 * Redesigned to match the Public Registration page style ("Green Theme" + Banner)
 */
export default function DoctorLogin() {
  const { campSlug } = useParams<{ campSlug: string }>();
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const [camp, setCamp] = useState<any>(null); // Store full camp info for styling
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (campSlug) {
      api.get(`/public/${campSlug}`)
        .then(res => setCamp(res.data.camp))
        .catch(console.error);
    }
  }, [campSlug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', {
        ...formData,
        campSlug
      });

      const { token, user } = response.data;
      login(user, token, campSlug!);

      // Redirect based on role
      if (user.role === 'DOCTOR') {
        navigate(`/${campSlug}/doctor`);
      } else if (user.role === 'CAMP_HEAD') {
        navigate(`/${campSlug}/camp-head`);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // --- Styles (Matched with PublicRegistration.tsx) ---
  const styles = {
    page: {
      minHeight: '100vh',
      background: '#e5e7eb',
      fontFamily: "'Inter', sans-serif",
      paddingBottom: '2rem',
    },
    // Banner
    bannerBackground: {
      height: '350px',
      width: '100%',
      position: 'absolute' as 'absolute',
      top: 0,
      left: 0,
      zIndex: 0,
      backgroundImage: camp?.backgroundImageUrl
        ? `url(${camp.backgroundImageUrl})`
        : 'linear-gradient(135deg, #0f766e 0%, #115e59 100%)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    },
    bannerOverlay: {
      position: 'absolute' as 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.4)',
    },
    // Main Card
    mainCard: {
      position: 'relative' as 'relative',
      zIndex: 10,
      maxWidth: '450px', // Narrower for login
      margin: '0 auto',
      marginTop: '100px',
      background: 'white',
      borderRadius: '24px',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      overflow: 'hidden',
      padding: '2.5rem',
    },
    // Hospital Brand
    hospitalBrand: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center', // Centered for login
      gap: '0.75rem',
      marginBottom: '2rem',
      fontWeight: '600',
      color: '#374151',
      fontSize: '1.1rem',
    },
    logo: {
      height: '40px',
      width: 'auto',
    },
    // Form
    title: {
      fontSize: '1.75rem',
      fontWeight: '700',
      color: '#111827',
      textAlign: 'center' as 'center',
      marginBottom: '0.5rem',
    },
    subtitle: {
      textAlign: 'center' as 'center',
      color: '#6b7280',
      marginBottom: '2rem',
    },
    inputGroup: {
      marginBottom: '1.5rem',
    },
    label: {
      display: 'block',
      fontSize: '0.875rem',
      fontWeight: '600',
      color: '#4b5563',
      marginBottom: '0.5rem',
    },
    input: {
      width: '100%',
      padding: '0.875rem',
      borderRadius: '8px',
      border: '1px solid #d1d5db',
      fontSize: '1rem',
      outline: 'none',
      transition: 'all 0.15s',
      color: '#1f2937',
    },
    submitBtn: {
      width: '100%',
      background: '#2F855A',
      color: 'white',
      padding: '1rem',
      borderRadius: '8px',
      fontSize: '1.1rem',
      fontWeight: '600',
      border: 'none',
      cursor: loading ? 'not-allowed' : 'pointer',
      opacity: loading ? 0.8 : 1,
      boxShadow: '0 4px 6px -1px rgba(47, 133, 90, 0.4)',
      transition: 'transform 0.1s',
    },
    errorBox: {
      background: '#fee2e2',
      border: '1px solid #fecaca',
      color: '#ef4444',
      padding: '0.75rem',
      borderRadius: '8px',
      marginBottom: '1.5rem',
      fontSize: '0.9rem',
      textAlign: 'center' as 'center',
    }
  };

  const handleFocus = (e: any) => {
    e.target.style.borderColor = '#2F855A';
    e.target.style.boxShadow = '0 0 0 3px rgba(47, 133, 90, 0.1)';
  };
  const handleBlur = (e: any) => {
    e.target.style.borderColor = '#d1d5db';
    e.target.style.boxShadow = 'none';
  };

  return (
    <div style={styles.page}>
      {/* Background Banner */}
      <div style={styles.bannerBackground}>
        <div style={styles.bannerOverlay}></div>
      </div>

      {/* Login Card */}
      <div style={styles.mainCard}>

        {/* Hospital/Camp Brand */}
        <div style={styles.hospitalBrand}>
          {camp?.logoUrl ? (
            <img src={camp.logoUrl} alt="Logo" style={styles.logo} />
          ) : (
            <span style={{ color: '#2F855A', fontSize: '1.8rem' }}>🏥</span>
          )}
          <span>{camp?.hospitalName || 'Medical Camp'}</span>
        </div>

        <h1 style={styles.title}>Staff Login</h1>
        <p style={styles.subtitle}>
          {camp?.name ? `for ${camp.name}` : `Camp ID: ${campSlug}`}
        </p>

        {error && (
          <div style={styles.errorBox}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email Address</label>
            <input
              type="email"
              required
              placeholder="doctor@hospital.com"
              style={styles.input}
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              onFocus={handleFocus} onBlur={handleBlur}
            />
          </div>

          <div style={styles.inputGroup}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <label style={{ ...styles.label, marginBottom: 0 }}>Password</label>
            </div>
            <input
              type="password"
              required
              placeholder="••••••••"
              style={styles.input}
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
              onFocus={handleFocus} onBlur={handleBlur}
            />
          </div>

          <button
            type="submit"
            style={styles.submitBtn}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            {loading ? 'Verifying...' : 'Login to Dashboard'}
          </button>
        </form>

        <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.85rem', color: '#9ca3af' }}>
          Only for authorized Camp Heads and Doctors.<br />
          Restricted Access.
        </div>

      </div>
    </div>
  );
}
