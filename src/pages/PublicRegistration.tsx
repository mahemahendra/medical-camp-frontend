import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { Camp } from '../types';
import { useToast } from '../components';

/**
 * Extended Camp interface to include doctors for the public view
 */
interface PublicCamp extends Camp {
  doctors?: Array<{ name: string; specialty?: string }>;
}

export default function PublicRegistration() {
  const { campSlug } = useParams<{ campSlug: string }>();
  const { addToast } = useToast();
  const [camp, setCamp] = useState<PublicCamp | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [registeredVisitor, setRegisteredVisitor] = useState<{ id: string; patientId: string; name: string; qrCode?: string } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    age: '',
    gender: 'Male',
    symptoms: ''
  });

  useEffect(() => {
    loadCampInfo();
  }, [campSlug]);

  const loadCampInfo = async () => {
    try {
      const response = await api.get(`/public/${campSlug}`);
      setCamp(response.data.camp);
    } catch (error) {
      console.error('Failed to load camp info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await api.post(`/public/${campSlug}/register`, {
        ...formData,
        age: parseInt(formData.age),
        // Send other required fields with defaults if not in UI
        address: '',
        city: '',
        district: '',
        existingConditions: '',
        allergies: ''
      });

      setRegisteredVisitor(response.data.visitor);
      setSuccess(true);
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Registration Failed',
        message: error.response?.data?.error || 'Registration failed'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // --- Styles ---
  const styles = {
    page: {
      minHeight: '100vh',
      background: '#e5e7eb', // Light gray background behind everything
      fontFamily: "'Inter', sans-serif",
      paddingBottom: '2rem',
    },
    // The top banner image (blurred background effect)
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
      background: 'rgba(0,0,0,0.3)', // Darken slightly
    },
    // The Main Floating Card
    mainCard: {
      position: 'relative' as 'relative',
      zIndex: 10,
      maxWidth: '600px',
      margin: '0 auto',
      marginTop: '60px', // Push down from top
      background: 'white',
      borderRadius: '24px',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      overflow: 'hidden',
    },
    headerSection: {
      padding: '2rem 2rem 1rem',
      borderBottom: '1px solid #f3f4f6',
    },
    hospitalBrand: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      marginBottom: '1.5rem',
      fontWeight: '600',
      color: '#374151',
      fontSize: '1.1rem',
    },
    logo: {
      height: '32px',
      width: 'auto',
    },
    campTitle: {
      fontSize: '1.75rem',
      fontWeight: '700',
      color: '#111827',
      marginBottom: '0.5rem',
      lineHeight: 1.2,
    },
    campConductedBy: {
      color: '#6b7280',
      fontSize: '0.95rem',
      marginBottom: '1rem',
    },
    locationPill: {
      display: 'inline-flex',
      alignItems: 'center',
      background: '#f3f4f6',
      padding: '0.25rem 0.75rem',
      borderRadius: '9999px',
      fontSize: '0.85rem',
      color: '#4b5563',
      gap: '0.5rem',
      float: 'right' as const, // Simple right align like screenshot
      marginTop: '-3rem', // Negative margin to align with title area roughly
    },
    doctorList: {
      marginTop: '1rem',
      color: '#374151',
      fontSize: '0.9rem',
      lineHeight: '1.5',
    },
    doctorItem: {
      fontWeight: '500',
    },
    confidentialityBanner: {
      background: '#ecfdf5', // Light green
      padding: '0.75rem 1.5rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      color: '#065f46',
      fontSize: '0.85rem',
      fontWeight: '500',
      marginTop: '1.5rem',
      borderRadius: '8px',
      margin: '1.5rem 2rem 1rem', // Match padding of sections
    },
    // Form Sections
    formSection: {
      margin: '1.5rem 2rem',
      background: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: '12px',
      padding: '1.5rem',
      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
    },
    sectionHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      fontSize: '1.1rem',
      fontWeight: '600',
      color: '#374151',
      marginBottom: '1.5rem',
      borderBottom: '1px solid #f3f4f6',
      paddingBottom: '0.75rem',
    },
    iconCircle: {
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      // Greenish teal icon background (approximate from screenshot)
      border: '1px solid #2F855A',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#2F855A',
    },
    // Inputs
    label: {
      display: 'block',
      fontSize: '0.875rem',
      fontWeight: '600',
      color: '#4b5563',
      marginBottom: '0.4rem',
    },
    input: {
      width: '100%',
      padding: '0.75rem',
      borderRadius: '8px',
      border: '1px solid #d1d5db',
      fontSize: '0.95rem',
      outline: 'none',
      transition: 'border-color 0.15s',
      color: '#1f2937',
    },
    row: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '1rem',
      marginBottom: '1rem',
    },
    // Footer
    footer: {
      padding: '0 2rem 2rem',
      textAlign: 'center' as 'center',
    },
    submitBtn: {
      width: '100%',
      background: '#2F855A', // The specific green from screenshot
      color: 'white',
      padding: '1rem',
      borderRadius: '8px',
      fontSize: '1.1rem',
      fontWeight: '600',
      border: 'none',
      cursor: submitting ? 'not-allowed' : 'pointer',
      boxShadow: '0 4px 6px -1px rgba(47, 133, 90, 0.4)',
      marginBottom: '0.75rem',
      opacity: submitting ? 0.8 : 1,
    },
    subtext: {
      fontSize: '0.85rem',
      color: '#6b7280',
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="animate-spin" style={{ width: '40px', height: '40px', border: '3px solid #f3f3f3', borderTop: '3px solid #2F855A', borderRadius: '50%' }}></div>
      </div>
    );
  }

  if (!camp) return <div style={{ padding: '2rem', textAlign: 'center' }}>Camp not found</div>;

  if (success && registeredVisitor) {
    return (
      <div style={styles.page}>
        <div style={styles.bannerBackground}>
          <div style={styles.bannerOverlay}></div>
        </div>

        <div style={{ ...styles.mainCard, marginTop: '100px', textAlign: 'center', padding: '3rem' }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%',
            background: '#ecfdf5', color: '#059669', fontSize: '2.5rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem'
          }}>✓</div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#064e3b', marginBottom: '0.5rem' }}>Registration Successful</h2>
          <p style={{ color: '#4b5563', marginBottom: '2rem' }}>You have booked your free consultation.</p>

          <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '2rem' }}>
            <p style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#64748b', fontWeight: '600' }}>Patient ID</p>
            <p style={{ fontSize: '2.5rem', fontWeight: '800', color: '#2F855A', fontFamily: 'monospace' }}>{registeredVisitor.patientId}</p>
          </div>

          {registeredVisitor.qrCode && (
            <img src={registeredVisitor.qrCode} alt="QR" style={{ width: '150px', margin: '0 auto' }} />
          )}
        </div>
      </div>
    )
  }

  // Helper for input focus
  const handleFocus = (e: any) => e.target.style.borderColor = '#2F855A';
  const handleBlur = (e: any) => e.target.style.borderColor = '#d1d5db';

  return (
    <div style={styles.page}>
      {/* Background Banner */}
      <div style={styles.bannerBackground}>
        <div style={styles.bannerOverlay}></div>
      </div>

      {/* Main Card */}
      <div style={styles.mainCard}>

        {/* Header Section */}
        <div style={styles.headerSection}>
          <div style={styles.hospitalBrand}>
            {/* If logo exists use it, else generic hospital icon */}
            {camp.logoUrl ? (
              <img src={camp.logoUrl} alt="Logo" style={styles.logo} />
            ) : (
              <span style={{ color: '#2F855A', fontSize: '1.5rem' }}>🏥</span>
            )}
            <span>{camp.hospitalName || 'Medical Camp'}</span>
          </div>

          <div style={{ position: 'relative' }}>
            <h1 style={styles.campTitle}>{camp.name}</h1>

            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(camp.venue)}`}
              target="_blank"
              rel="noopener"
              style={{ ...styles.locationPill, textDecoration: 'none', position: 'absolute', top: 0, right: 0 }}
            >
              <span style={{ color: '#dc2626' }}>📍</span>
              {camp.venue}
              <span style={{ color: '#d1d5db', margin: '0 0.25rem' }}>|</span>
              {new Date(camp.startTime).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
            </a>
          </div>

          <p style={styles.campConductedBy}>
            Conducted by <span style={{ fontWeight: '600', color: '#4b5563' }}>{camp.hospitalName}, {camp.hospitalAddress?.split(',')[0]}</span>
          </p>

          <div style={styles.doctorList}>
            {camp.doctors && camp.doctors.length > 0 ? (
              camp.doctors.map((doc, i) => (
                <div key={i} style={styles.doctorItem}>
                  DR. {doc.name.toUpperCase()} {doc.specialty ? `(${doc.specialty})` : ''}
                </div>
              ))
            ) : (
              <div>Doctors will be assigned soon.</div>
            )}
          </div>
        </div>

        {/* Confidential Banner */}
        <div style={styles.confidentialityBanner}>
          <span style={{ fontSize: '1.2rem' }}>🔒</span>
          Your details are confidential and used only for <span style={{ fontWeight: '700' }}>medical consultation</span>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Section 1: Basic Details */}
          <div style={styles.formSection}>
            <div style={styles.sectionHeader}>
              <div style={styles.iconCircle}>
                <span style={{ fontSize: '1.2rem', marginTop: '-2px' }}>👤</span>
              </div>
              Basic Details
            </div>

            <div style={styles.row}>
              <div>
                <label style={styles.label}>Full Name</label>
                <input
                  type="text" required
                  style={styles.input}
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  onFocus={handleFocus} onBlur={handleBlur}
                />
              </div>
              <div>
                <label style={styles.label}>Age</label>
                <input
                  type="number" required min="0" max="120"
                  style={styles.input}
                  value={formData.age}
                  onChange={e => setFormData({ ...formData, age: e.target.value })}
                  onFocus={handleFocus} onBlur={handleBlur}
                />
              </div>
            </div>

            <div style={styles.row}>
              <div>
                <label style={styles.label}>Mobile Number<span style={{ color: 'red' }}>*</span></label>
                <div style={{ position: 'relative', display: 'flex' }}>
                  <div style={{
                    padding: '0.75rem', background: '#f9fafb', border: '1px solid #d1d5db',
                    borderRight: 'none', borderRadius: '8px 0 0 8px', color: '#6b7280', fontSize: '0.95rem'
                  }}>
                    +91
                  </div>
                  <input
                    type="tel" required
                    style={{ ...styles.input, borderRadius: '0 8px 8px 0' }}
                    placeholder="Enter mobile"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    onFocus={handleFocus} onBlur={handleBlur}
                  />
                </div>
              </div>
              <div>
                <label style={styles.label}>Gender</label>
                <select
                  style={{ ...styles.input, background: 'white' }}
                  value={formData.gender}
                  onChange={e => setFormData({ ...formData, gender: e.target.value })}
                  onFocus={handleFocus} onBlur={handleBlur}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Problems */}
          <div style={styles.formSection}>
            <div style={styles.sectionHeader}>
              <div style={styles.iconCircle}>
                <span style={{ fontSize: '1.2rem' }}>📄</span>
              </div>
              What problem are you facing?
            </div>

            <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '1rem' }}>
              (You may write in your own words or leave it blank)
            </p>

            <textarea
              style={{ ...styles.input, minHeight: '100px', resize: 'vertical' }}
              placeholder="Describe your symptoms"
              value={formData.symptoms}
              onChange={e => setFormData({ ...formData, symptoms: e.target.value })}
              onFocus={handleFocus} onBlur={handleBlur}
            />
          </div>

          <div style={styles.footer}>
            <button type="submit" style={styles.submitBtn}>
              {submitting ? 'Please wait...' : 'Register for Free Consultation'}
            </button>
            <p style={styles.subtext}>Takes less than 30 seconds</p>
          </div>
        </form>

      </div>
    </div>
  );
}
