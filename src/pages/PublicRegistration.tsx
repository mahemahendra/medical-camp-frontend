import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { Camp } from '../types';
import { 
  PageContainer, 
  Button, 
  useToast,
  Card,
  CardHeader,
  CardContent,
  FormField,
  FormGroup,
  Input,
  Select,
  TextArea
} from '../components';

/**
 * Public registration page for visitors
 * Accessed via: domain.com/{campSlug}
 */
export default function PublicRegistration() {
  const { campSlug } = useParams<{ campSlug: string }>();
  const { addToast } = useToast();
  const [camp, setCamp] = useState<Camp | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [registeredVisitor, setRegisteredVisitor] = useState<{ id: string; patientId: string; name: string; qrCode?: string } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    age: '',
    gender: 'Male',
    address: '',
    city: '',
    district: '',
    symptoms: '',
    existingConditions: '',
    allergies: ''
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
        age: parseInt(formData.age)
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

  if (loading) {
    return (
      <PageContainer>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🏥</div>
            <p style={{ color: '#64748b' }}>Loading camp information...</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (!camp) {
    return (
      <PageContainer>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          <div style={{ 
            textAlign: 'center', 
            background: 'white', 
            padding: '3rem', 
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>😕</div>
            <h2 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>Camp Not Found</h2>
            <p style={{ color: '#64748b', margin: 0 }}>The medical camp you're looking for doesn't exist.</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (success && registeredVisitor) {
    return (
      <PageContainer>
        <div style={{ 
          minHeight: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          padding: '1.5rem'
        }}>
          <div style={{ 
            background: 'white', 
            borderRadius: '20px', 
            padding: '2.5rem',
            maxWidth: '450px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 4px 24px rgba(0,0,0,0.1)'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              fontSize: '2.5rem'
            }}>✓</div>
            
            <h1 style={{ fontSize: '1.75rem', margin: '0 0 0.5rem 0', color: '#1e293b' }}>
              Registration Successful!
            </h1>
            <p style={{ fontSize: '1.125rem', margin: '0 0 2rem 0', color: '#64748b' }}>
              Thank you, {registeredVisitor.name}!
            </p>
            
            <div style={{ 
              background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', 
              padding: '1.5rem', 
              borderRadius: '12px', 
              marginBottom: '1.5rem',
              border: '1px solid #bfdbfe'
            }}>
              <p style={{ margin: '0 0 0.5rem 0', color: '#64748b', fontSize: '0.875rem', fontWeight: '500' }}>
                YOUR PATIENT ID
              </p>
              <p style={{ 
                fontSize: '1.75rem', 
                fontWeight: 'bold', 
                color: '#1e40af',
                margin: 0,
                letterSpacing: '0.05em'
              }}>
                {registeredVisitor.patientId}
              </p>
            </div>
            
            {registeredVisitor.qrCode && (
              <div style={{ 
                background: 'white', 
                padding: '1rem', 
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                marginBottom: '1.5rem'
              }}>
                <img 
                  src={registeredVisitor.qrCode} 
                  alt="QR Code" 
                  style={{ maxWidth: '180px', width: '100%' }} 
                />
              </div>
            )}
            
            <p style={{ 
              color: '#64748b', 
              fontSize: '0.875rem',
              margin: 0,
              lineHeight: '1.6'
            }}>
              📱 Your details have been sent to your phone via WhatsApp.<br/>
              Please save your Patient ID and QR code.
            </p>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
        padding: '2rem 1.5rem',
        textAlign: 'center',
        color: 'white'
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          {camp.logoUrl && (
            <img 
              src={camp.logoUrl} 
              alt={camp.name} 
              style={{ 
                maxHeight: '60px', 
                marginBottom: '1rem',
                background: 'white',
                padding: '0.5rem',
                borderRadius: '8px'
              }} 
            />
          )}
          <div style={{
            width: '56px',
            height: '56px',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
            fontSize: '1.75rem'
          }}>🏥</div>
          <h1 style={{ fontSize: '1.5rem', margin: '0 0 0.5rem 0', fontWeight: '600' }}>{camp.name}</h1>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: '1.5rem', 
            flexWrap: 'wrap',
            fontSize: '0.9rem',
            opacity: 0.9
          }}>
            <span>📍 {camp.venue}</span>
            <span>📅 {new Date(camp.startTime).toLocaleDateString()}</span>
          </div>
          {camp.description && (
            <p style={{ marginTop: '1rem', opacity: 0.85, fontSize: '0.9rem' }}>{camp.description}</p>
          )}
        </div>
      </div>

      {/* Registration Form */}
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '1.5rem' }}>
        <Card style={{ marginTop: '-2rem', position: 'relative' }}>
          <CardHeader>
            <h2 style={{ 
              margin: '0', 
              fontSize: '1.25rem', 
              color: '#1e293b',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span style={{ fontSize: '1.5rem' }}>📋</span>
              Patient Registration
            </h2>
          </CardHeader>
          <CardContent>
          
          <form onSubmit={handleSubmit}>
            <FormGroup>
              {/* Full Name */}
              <FormField label="Full Name" required>
                <Input
                  type="text"
                  required
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </FormField>

              {/* Phone */}
              <FormField label="Phone Number" required>
                <Input
                  type="tel"
                  required
                  placeholder="Enter your phone number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </FormField>

              {/* Age & Gender Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <FormField label="Age" required>
                  <Input
                    type="number"
                    required
                    min="0"
                    max="150"
                    placeholder="Age"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  />
                </FormField>
                
                <FormField label="Gender" required>
                  <Select 
                    value={formData.gender} 
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </Select>
                </FormField>
              </div>

              {/* City */}
              <FormField label="City / Village">
                <Input
                  type="text"
                  placeholder="Enter your city or village"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </FormField>

              {/* Symptoms */}
              <FormField label="Symptoms / Reason for Visit">
                <TextArea
                  rows={3}
                  placeholder="Describe your symptoms or reason for visiting"
                  value={formData.symptoms}
                  onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                />
              </FormField>
            </FormGroup>

            <Button 
              type="submit" 
              variant="primary" 
              size="lg" 
              fullWidth 
              disabled={submitting}
            >
              {submitting ? '⏳ Registering...' : '✓ Complete Registration'}
            </Button>
          </form>
          </CardContent>
        </Card>
        
        {/* Footer note */}
        <p style={{ 
          textAlign: 'center', 
          color: '#64748b', 
          fontSize: '0.8rem',
          marginTop: '1.5rem'
        }}>
          By registering, you agree to share your information with the medical camp organizers.
        </p>
      </div>
    </PageContainer>
  );
}
