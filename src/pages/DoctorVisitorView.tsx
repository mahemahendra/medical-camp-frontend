import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import api from '../services/api';
import { Button, Card, useToast } from '../components';

interface Visitor {
  id: string;
  name: string;
  phone: string;
  patientIdPerCamp: string;
  age: number;
  gender: string;
  address?: string;
  city?: string;
  district?: string;
  symptoms?: string;
  existingConditions?: string;
  allergies?: string;
}

interface Visit {
  id: string;
  status: string;
  consultation?: {
    diagnosis?: string;
    treatment?: string;
    prescriptions?: any;
  };
}

interface Camp {
  name: string;
  venue: string;
  hospitalName?: string;
}

/**
 * Doctor Visitor View - Accessed via QR code scan
 * URL: /{campSlug}/doctor/visitor/{visitorId}
 */
export default function DoctorVisitorView() {
  const { campSlug, visitorId } = useParams<{ campSlug: string; visitorId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [visitor, setVisitor] = useState<Visitor | null>(null);
  const [visit, setVisit] = useState<Visit | null>(null);
  const [camp, setCamp] = useState<Camp | null>(null);

  useEffect(() => {
    loadVisitorData();
  }, [visitorId, user?.campId]);

  const loadVisitorData = async () => {
    if (!user?.campId || !visitorId) return;

    try {
      setLoading(true);
      const response = await api.get(`/doctor/${user.campId}/visitor-by-qr/${visitorId}`);
      setVisitor(response.data.visitor);
      setVisit(response.data.visit);
      setCamp(response.data.camp);
    } catch (error: any) {
      console.error('Failed to load visitor:', error);
      const message = error.response?.data?.error || 'Failed to load visitor information';
      addToast({ type: 'error', title: message });
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate(`/${campSlug}/doctor`);
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleStartConsultation = () => {
    // Navigate to main dashboard with this visitor selected
    navigate(`/${campSlug}/doctor`, { 
      state: { 
        selectedVisitorId: visitor?.id,
        openConsultation: true 
      } 
    });
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
          <p>Loading visitor information...</p>
        </div>
      </div>
    );
  }

  if (!visitor || !visit || !camp) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '20px' 
      }}>
        <Card style={{ maxWidth: '500px', width: '100%', textAlign: 'center' }}>
          <h2 style={{ color: 'var(--color-error)', marginBottom: '16px' }}>
            ⚠️ Visitor Not Found
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
            The scanned QR code is invalid or the visitor is not registered for your camp.
          </p>
          <Button onClick={() => navigate(`/${campSlug}/doctor`)}>
            Back to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  const visitStatus = visit.status;
  const hasConsultation = !!visit.consultation;

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'var(--color-background)',
      padding: '20px' 
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '24px' 
        }}>
          <h1 style={{ fontSize: '24px', margin: 0 }}>Patient Information</h1>
          <Button 
            variant="secondary" 
            onClick={() => navigate(`/${campSlug}/doctor`)}
          >
            ← Back
          </Button>
        </div>

        {/* Camp Info */}
        <Card style={{ marginBottom: '16px', background: 'var(--color-primary)', color: 'white' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>{camp.name}</h3>
          <p style={{ margin: 0, opacity: 0.9 }}>
            {camp.hospitalName && `${camp.hospitalName} • `}
            {camp.venue}
          </p>
        </Card>

        {/* Patient Details */}
        <Card style={{ marginBottom: '16px' }}>
          <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '18px' }}>
            Patient Details
          </h3>
          
          <div style={{ display: 'grid', gap: '12px' }}>
            <InfoRow label="Patient ID" value={visitor.patientIdPerCamp} highlight />
            <InfoRow label="Name" value={visitor.name} />
            <InfoRow label="Phone" value={visitor.phone} />
            <InfoRow label="Age" value={`${visitor.age} years`} />
            <InfoRow label="Gender" value={visitor.gender} />
            
            {visitor.city && <InfoRow label="City" value={visitor.city} />}
            {visitor.district && <InfoRow label="District" value={visitor.district} />}
            {visitor.address && <InfoRow label="Address" value={visitor.address} />}
          </div>
        </Card>

        {/* Medical Information */}
        <Card style={{ marginBottom: '16px' }}>
          <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '18px' }}>
            Medical Information
          </h3>
          
          <div style={{ display: 'grid', gap: '12px' }}>
            <InfoRow 
              label="Symptoms" 
              value={visitor.symptoms || 'None reported'} 
              multiline 
            />
            <InfoRow 
              label="Existing Conditions" 
              value={visitor.existingConditions || 'None reported'} 
              multiline 
            />
            <InfoRow 
              label="Allergies" 
              value={visitor.allergies || 'None reported'} 
              multiline 
            />
          </div>
        </Card>

        {/* Visit Status */}
        <Card style={{ marginBottom: '16px' }}>
          <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '18px' }}>
            Visit Status
          </h3>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <span style={{ fontWeight: 600 }}>Status:</span>
            <span style={{
              padding: '4px 12px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: 500,
              background: visitStatus === 'COMPLETED' ? 'var(--color-success-light)' : 
                         visitStatus === 'IN_PROGRESS' ? 'var(--color-warning-light)' : 
                         'var(--color-info-light)',
              color: visitStatus === 'COMPLETED' ? 'var(--color-success)' : 
                    visitStatus === 'IN_PROGRESS' ? 'var(--color-warning)' : 
                    'var(--color-info)'
            }}>
              {visitStatus === 'REGISTERED' ? '🔵 Registered' :
               visitStatus === 'IN_PROGRESS' ? '🟡 In Progress' :
               visitStatus === 'COMPLETED' ? '✅ Completed' : visitStatus}
            </span>
          </div>

          {hasConsultation && visit.consultation && (
            <>
              <InfoRow 
                label="Diagnosis" 
                value={visit.consultation.diagnosis || 'N/A'} 
                multiline 
              />
              <InfoRow 
                label="Treatment" 
                value={visit.consultation.treatment || 'N/A'} 
                multiline 
              />
            </>
          )}
        </Card>

        {/* Action Button */}
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          {visitStatus === 'COMPLETED' ? (
            <Button onClick={() => navigate(`/${campSlug}/doctor`)} size="lg">
              Back to Dashboard
            </Button>
          ) : (
            <Button onClick={handleStartConsultation} size="lg">
              {visitStatus === 'IN_PROGRESS' ? 'Continue Consultation' : 'Start Consultation'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper component for displaying information rows
function InfoRow({ 
  label, 
  value, 
  highlight = false, 
  multiline = false 
}: { 
  label: string; 
  value: string; 
  highlight?: boolean; 
  multiline?: boolean;
}) {
  return (
    <div style={{ 
      display: multiline ? 'block' : 'flex', 
      gap: '8px',
      padding: '8px 0',
      borderBottom: '1px solid var(--color-border)'
    }}>
      <span style={{ 
        fontWeight: 600, 
        color: 'var(--color-text-secondary)',
        minWidth: '150px',
        display: multiline ? 'block' : 'inline-block',
        marginBottom: multiline ? '4px' : 0
      }}>
        {label}:
      </span>
      <span style={{ 
        color: highlight ? 'var(--color-primary)' : 'var(--color-text)',
        fontWeight: highlight ? 600 : 400,
        flex: 1,
        fontFamily: highlight ? 'monospace' : 'inherit',
        fontSize: highlight ? '16px' : 'inherit'
      }}>
        {value}
      </span>
    </div>
  );
}
