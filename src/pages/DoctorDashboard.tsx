import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import api, { fixAttachmentUrl } from '../services/api';
import { Visit } from '../types';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import {
  Header,
  HeaderButton,
  PageContainer,
  ContentContainer,
  useToast,
  Card,
  StatCard,
  Input,
  Button,
  StatusBadge,
  EmptyCard
} from '../components';

/**
 * Doctor dashboard for managing consultations
 * Accessed via: domain.com/{campSlug}/doctor
 */
export default function DoctorDashboard() {
  const { campSlug } = useParams<{ campSlug: string }>();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { addToast } = useToast();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [showConsultation, setShowConsultation] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'REGISTERED' | 'COMPLETED'>('ALL');
  const [campLogo, setCampLogo] = useState<string>('');

  useEffect(() => {
    loadVisitors();
    if (campSlug) {
      api.get(`/public/${campSlug}`)
        .then(res => {
          if (res.data.camp?.logoUrl) {
            setCampLogo(res.data.camp.logoUrl);
          }
        })
        .catch(console.error);
    }
  }, [campSlug]);

  const loadVisitors = async () => {
    try {
      const response = await api.get(`/doctor/${user?.campId}/visitors`);
      setVisits(response.data.visits || []);
    } catch (error) {
      console.error('Failed to load visitors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadVisitors();
      return;
    }

    setLoading(true);
    try {
      const response = await api.get(`/doctor/${user?.campId}/visitors/search`, {
        params: { query: searchQuery }
      });
      const visitors = response.data.visitors || [];
      if (visitors.length > 0) {
        // For simplicity, get visits for the first matching visitor
        const visitorResponse = await api.get(`/doctor/${user?.campId}/visitors/${visitors[0].id}`);
        setVisits(visitorResponse.data.visits || []);
        if (visitorResponse.data.visits?.length > 0) {
          setSelectedVisit(visitorResponse.data.visits[0]);
        }
      } else {
        setVisits([]);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQRScan = async (patientIdOrUrl: string) => {
    setShowScanner(false);
    setLoading(true);
    
    try {
      let visitorId: string | null = null;
      
      // Check if it's a visitor URL (from QR code)
      // Format: http://domain.com/{campSlug}/doctor/visitor/{visitorId}
      const urlMatch = patientIdOrUrl.match(/\/doctor\/visitor\/([a-f0-9-]+)/);
      
      if (urlMatch) {
        // Direct visitor ID from URL
        visitorId = urlMatch[1];
        const visitorResponse = await api.get(`/doctor/${user?.campId}/visitor-by-qr/${visitorId}`);
        if (visitorResponse.data.visit) {
          setSelectedVisit(visitorResponse.data.visit);
          setShowConsultation(true);
          addToast({
            type: 'success',
            title: 'Patient Found',
            message: `Opening consultation for ${visitorResponse.data.visitor.name}`
          });
          return;
        }
      } else {
        // Search by patient ID
        const response = await api.get(`/doctor/${user?.campId}/visitors/search`, {
          params: { query: patientIdOrUrl }
        });
        const visitors = response.data.visitors || [];
        
        if (visitors.length > 0) {
          const visitorResponse = await api.get(`/doctor/${user?.campId}/visitors/${visitors[0].id}`);
          if (visitorResponse.data.visits?.length > 0) {
            setSelectedVisit(visitorResponse.data.visits[0]);
            setShowConsultation(true);
            addToast({
              type: 'success',
              title: 'Patient Found',
              message: `Opening consultation for ${visitors[0].name}`
            });
            return;
          }
        }
      }
      
      // If we reach here, patient was not found
      addToast({
        type: 'error',
        title: 'Patient Not Found',
        message: 'Could not find patient with this QR code or ID'
      });
    } catch (error: any) {
      console.error('Scan search failed:', error);
      addToast({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to search for patient'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConsultClick = (visit: Visit) => {
    setSelectedVisit(visit);
    setShowConsultation(true);
  };

  const handleConsultationSave = async (consultationData: any) => {
    try {
      await api.post(`/doctor/${user?.campId}/consultations`, {
        visitId: selectedVisit?.id,
        ...consultationData
      });
      setShowConsultation(false);
      setSelectedVisit(null);
      loadVisitors();
      addToast({
        type: 'success',
        title: 'Consultation Saved',
        message: 'Patient consultation has been successfully saved'
      });
    } catch (error) {
      console.error('Failed to save consultation:', error);
      addToast({
        type: 'error',
        title: 'Save Failed',
        message: 'Failed to save consultation. Please try again.'
      });
    }
  };

  const handleLogout = () => {
    logout();
    navigate(`/${campSlug}/login`);
  };

  const filteredVisits = visits.filter(visit => {
    if (filterStatus === 'ALL') return true;
    return visit.status === filterStatus;
  });

  const columns: GridColDef[] = [
    {
      field: 'patientId',
      headerName: 'Patient ID',
      width: 150,
      valueGetter: (value, row) => row?.visitor?.patientIdPerCamp,
      renderCell: (params) => (
        <span style={{ fontWeight: '600', color: '#2563eb' }}>{params.value}</span>
      )
    },
    {
      field: 'name',
      headerName: 'Name',
      width: 180,
      valueGetter: (value, row) => row?.visitor?.name
    },
    {
      field: 'ageGender',
      headerName: 'Age / Gender',
      width: 150,
      valueGetter: (value, row) => `${row?.visitor?.age || ''} / ${row?.visitor?.gender || ''}`
    },
    {
      field: 'isInsured',
      headerName: 'Insured',
      width: 100,
      valueGetter: (value, row) => row.consultation?.isInsured ? 'Yes' : 'No',
      renderCell: (params) => (
        <span style={{
          color: params.value === 'Yes' ? '#166534' : '#6b7280',
          fontWeight: params.value === 'Yes' ? '600' : '400',
          background: params.value === 'Yes' ? '#dcfce7' : 'transparent',
          padding: '2px 8px',
          borderRadius: '12px',
          fontSize: '0.85rem'
        }}>
          {params.value}
        </span>
      )
    },
    {
      field: 'phone',
      headerName: 'Phone',
      width: 130,
      valueGetter: (value, row) => row?.visitor?.phone
    },
    {
      field: 'symptoms',
      headerName: 'Symptoms',
      width: 200,
      valueGetter: (value, row) => row?.visitor?.symptoms || '-'
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      renderCell: (params) => (
        <StatusBadge status={params.row.status} />
      )
    },
    {
      field: 'actions',
      headerName: 'Action',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Button
          onClick={() => handleConsultClick(params.row)}
          variant="primary"
          size="sm"
          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
        >
          {params.row.status === 'COMPLETED' ? '📋 View' : '🩺 Consult'}
        </Button>
      )
    }
  ];

  if (loading && visits.length === 0) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <PageContainer>
      <Header
        title="Doctor Portal"
        subtitle={`Dr. ${user?.name}`}
        icon={campLogo}
        theme="doctor"
        actions={
          <>
            <HeaderButton
              variant="ghost"
              theme="doctor"
              onClick={() => navigate(`/${campSlug}/doctor/my-patients`)}
            >
              📋 My Patients
            </HeaderButton>
            <HeaderButton variant="primary" theme="doctor" onClick={handleLogout}>
              Logout
            </HeaderButton>
          </>
        }
      />

      <ContentContainer>
        {/* Search & Scan Section */}
        <Card style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Input
              type="text"
              placeholder="Enter Patient ID, Phone, or Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              style={{ flex: 1, minWidth: '200px' }}
            />
            <Button onClick={handleSearch} variant="primary">
              🔍 Search
            </Button>
            <Button onClick={() => setShowScanner(true)} style={{ background: '#10b981', color: 'white' }}>
              📷 Scan QR
            </Button>
          </div>
        </Card>

        {/* Stats Summary - Clickable for Filtering */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
          <div onClick={() => setFilterStatus('ALL')} style={{ cursor: 'pointer', opacity: filterStatus === 'ALL' ? 1 : 0.6, transition: 'opacity 0.2s' }}>
            <StatCard title="Total Visitors" value={visits.length} color="#2563eb" />
          </div>
          <div onClick={() => setFilterStatus('REGISTERED')} style={{ cursor: 'pointer', opacity: filterStatus === 'REGISTERED' ? 1 : 0.6, transition: 'opacity 0.2s' }}>
            <StatCard title="Pending" value={visits.filter(v => v.status === 'REGISTERED').length} color="#f59e0b" />
          </div>
          <div onClick={() => setFilterStatus('COMPLETED')} style={{ cursor: 'pointer', opacity: filterStatus === 'COMPLETED' ? 1 : 0.6, transition: 'opacity 0.2s' }}>
            <StatCard title="Completed" value={visits.filter(v => v.status === 'COMPLETED').length} color="#10b981" />
          </div>
        </div>

        {/* Visitors DataGrid */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ margin: 0 }}>Visitors List</h2>
            <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>
              Showing: <strong>{filterStatus}</strong> ({filteredVisits.length})
            </div>
          </div>

          <div style={{ height: 600, width: '100%' }}>
            {visits.length === 0 ? (
              <EmptyCard
                title="No visitors found"
                description="Use search or scan QR code to find patients"
                icon="🔍"
              />
            ) : (
              <DataGrid
                rows={filteredVisits}
                columns={columns}
                initialState={{
                  pagination: {
                    paginationModel: { page: 0, pageSize: 10 },
                  },
                }}
                pageSizeOptions={[5, 10, 25, 50]}
                disableRowSelectionOnClick
                sx={{
                  border: 'none',
                  '& .MuiDataGrid-cell': {
                    borderBottom: '1px solid #f3f4f6',
                  },
                  '& .MuiDataGrid-columnHeaders': {
                    backgroundColor: '#f9fafb',
                    borderBottom: '2px solid #e5e7eb',
                    fontWeight: 'bold',
                  },
                }}
              />
            )}
          </div>
        </Card>
      </ContentContainer>

      {/* QR Scanner Modal */}
      {showScanner && (
        <QRScannerModal
          onScan={handleQRScan}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Consultation Modal */}
      {showConsultation && selectedVisit && (
        <ConsultationModal
          visit={selectedVisit}
          onSave={handleConsultationSave}
          onClose={() => { setShowConsultation(false); setSelectedVisit(null); }}
        />
      )}
    </PageContainer>
  );
}

function QRScannerModal({ onScan, onClose }: { onScan: (code: string) => void; onClose: () => void }) {
  const [manualInput, setManualInput] = useState('');
  const [hasCamera, setHasCamera] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const scannerRef = useRef<any>(null);
  const scannerElementId = 'qr-scanner';

  useEffect(() => {
    let html5QrCode: any = null;

    const startScanner = async () => {
      try {
        // Dynamically import html5-qrcode
        const { Html5Qrcode } = await import('html5-qrcode');
        
        html5QrCode = new Html5Qrcode(scannerElementId);
        scannerRef.current = html5QrCode;

        // Start scanning
        await html5QrCode.start(
          { facingMode: 'environment' }, // Use back camera on mobile
          {
            fps: 10,
            qrbox: { width: 250, height: 250 }
          },
          (decodedText: string) => {
            // QR code detected!
            console.log('QR Code detected:', decodedText);
            
            // Always use the onScan callback to handle the scanned data
            // This will search for the patient and open consultation form
            onScan(decodedText);
            
            // Stop the scanner after successful scan
            if (scannerRef.current) {
              scannerRef.current.stop().catch(console.error);
            }
          },
          (errorMessage: string) => {
            // Scanning in progress, no QR code detected yet
          }
        );
        
        setScanning(true);
      } catch (err: any) {
        console.error('QR Scanner error:', err);
        setHasCamera(false);
        setError(err.message || 'Camera not available');
      }
    };

    startScanner();

    return () => {
      // Cleanup
      if (scannerRef.current) {
        scannerRef.current.stop().catch((err: any) => {
          console.error('Error stopping scanner:', err);
        });
      }
    };
  }, [onScan]);

  const handleManualSubmit = () => {
    if (manualInput.trim()) {
      onScan(manualInput.trim());
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '0.5rem',
        padding: '1.5rem',
        maxWidth: '400px',
        width: '100%'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0 }}>Scan Patient QR Code</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
        </div>

        {hasCamera ? (
          <div style={{ marginBottom: '1rem' }}>
            <div
              id={scannerElementId}
              style={{ width: '100%', borderRadius: '0.5rem', overflow: 'hidden' }}
            />
            {scanning && (
              <p style={{ textAlign: 'center', color: 'var(--color-success)', marginTop: '0.5rem', fontWeight: 600 }}>
                📷 Point camera at QR code
              </p>
            )}
          </div>
        ) : (
          <div style={{ marginBottom: '1rem', padding: '1rem', background: '#fef2f2', borderRadius: '0.5rem' }}>
            <p style={{ color: 'var(--color-error)', margin: 0 }}>
              ⚠️ Camera not available. {error}
            </p>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
              Please check camera permissions or enter Patient ID manually below.
            </p>
          </div>
        )}

        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
          <p style={{ marginBottom: '0.5rem', fontWeight: '500' }}>Or enter Patient ID manually:</p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              placeholder="Patient ID (e.g., ABC123-0001)"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleManualSubmit()}
              style={{ flex: 1 }}
            />
            <button onClick={handleManualSubmit} className="btn btn-primary">Go</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConsultationModal({ visit, onSave, onClose }: {
  visit: Visit;
  onSave: (data: any) => void;
  onClose: () => void
}) {
  const [formData, setFormData] = useState({
    chiefComplaints: visit.consultation?.chiefComplaints || visit.visitor?.symptoms || '',
    clinicalNotes: visit.consultation?.clinicalNotes || '',
    diagnosis: visit.consultation?.diagnosis || '',
    treatmentPlan: visit.consultation?.treatmentPlan || '',
    prescriptions: visit.consultation?.prescriptions || [{ name: '', dosage: '', frequency: '', duration: '' }],
    followUpAdvice: visit.consultation?.followUpAdvice || '',
    isInsured: visit.consultation?.isInsured || false
  });
  const [saving, setSaving] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([]);
  const [visitWithAttachments, setVisitWithAttachments] = useState<Visit>(visit);
  const isViewMode = visit.status === 'COMPLETED';

  // Fetch visit details with attachments when modal opens
  useEffect(() => {
    const fetchVisitDetails = async () => {
      try {
        const response = await api.get(`/doctor/${visit.visitor?.campId}/visits/${visit.id}`);
        setVisitWithAttachments(response.data.visit);

        // Sync formData with fetched visit details
        const consultation = response.data.visit?.consultation;

        if (consultation) {
          setFormData(prev => ({
            ...prev,
            chiefComplaints: consultation.chiefComplaints || prev.chiefComplaints,
            clinicalNotes: consultation.clinicalNotes || prev.clinicalNotes,
            diagnosis: consultation.diagnosis || prev.diagnosis,
            treatmentPlan: consultation.treatmentPlan || prev.treatmentPlan,
            prescriptions: consultation.prescriptions || prev.prescriptions,
            followUpAdvice: consultation.followUpAdvice || prev.followUpAdvice,
            isInsured: consultation.isInsured !== undefined ? consultation.isInsured : prev.isInsured
          }));
        }
      } catch (error) {
        console.error('Failed to fetch visit details:', error);
        // Fallback to original visit data
        setVisitWithAttachments(visit);
      }
    };

    fetchVisitDetails();
  }, [visit.id, visit.visitor?.campId]);

  const handlePrescriptionChange = (index: number, field: string, value: string) => {
    const updated = [...formData.prescriptions];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, prescriptions: updated });
  };

  const addPrescription = () => {
    setFormData({
      ...formData,
      prescriptions: [...formData.prescriptions, { name: '', dosage: '', frequency: '', duration: '' }]
    });
  };

  const removePrescription = (index: number) => {
    setFormData({
      ...formData,
      prescriptions: formData.prescriptions.filter((_, i) => i !== index)
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate file size (max 10MB per file)
    const maxSize = 10 * 1024 * 1024; // 10MB
    const oversizedFiles = files.filter(file => file.size > maxSize);
    if (oversizedFiles.length > 0) {
      alert(`Some files are too large. Maximum file size is 10MB. Please reduce file size and try again.`);
      return;
    }

    setUploadingFiles(files);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('visitId', visit.id);
      uploadFormData.append('type', 'DOCUMENT'); // Default type

      files.forEach(file => {
        uploadFormData.append('files', file);
      });

      const response = await api.post(`/doctor/${visitWithAttachments.visitor?.campId}/attachments`, uploadFormData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Fetch updated visit data to show new attachments
      await fetchVisitAttachments();

    } catch (error) {
      console.error('File upload failed:', error);
      alert('Failed to upload files. Please try again.');
    } finally {
      setUploadingFiles([]);
      e.target.value = ''; // Reset file input
    }
  };

  const fetchVisitAttachments = async () => {
    try {
      const response = await api.get(`/doctor/${visitWithAttachments.visitor?.campId}/visits/${visit.id}`);
      setVisitWithAttachments(response.data.visit);
    } catch (error) {
      console.error('Failed to fetch visit attachments:', error);
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!confirm('Are you sure you want to delete this attachment?')) {
      return;
    }

    try {
      await api.delete(`/doctor/${visitWithAttachments.visitor?.campId}/attachments/${attachmentId}`);
      // Refresh attachments list
      await fetchVisitAttachments();
    } catch (error) {
      console.error('Failed to delete attachment:', error);
      alert('Failed to delete attachment. Please try again.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewMode) return;

    setSaving(true);
    await onSave(formData);
    setSaving(false);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem',
      overflow: 'auto'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '0.5rem',
        width: '100%',
        maxWidth: '800px',
        margin: '2rem 0'
      }}>
        {/* Header */}
        <div style={{
          padding: '1rem 1.5rem',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#f9fafb',
          borderRadius: '0.5rem 0.5rem 0 0'
        }}>
          <div>
            <h2 style={{ margin: 0 }}>{isViewMode ? 'View Consultation' : 'Record Consultation'}</h2>
            <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
              Patient: {visit.visitor?.name} ({visit.visitor?.patientIdPerCamp})
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
        </div>

        {/* Patient Info */}
        <div style={{ padding: '1rem 1.5rem', background: '#eff6ff', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
            <div><strong>Age:</strong> {visit.visitor?.age} yrs</div>
            <div><strong>Gender:</strong> {visit.visitor?.gender}</div>
            <div><strong>Phone:</strong> {visit.visitor?.phone}</div>
            <div><strong>Address:</strong> {visit.visitor?.city || visit.visitor?.address || '-'}</div>
          </div>
          {visit.visitor?.existingConditions && (
            <div style={{ marginTop: '0.5rem' }}>
              <strong>Existing Conditions:</strong> {visit.visitor.existingConditions}
            </div>
          )}
          {visit.visitor?.allergies && (
            <div style={{ marginTop: '0.25rem', color: '#dc2626' }}>
              <strong>⚠️ Allergies:</strong> {visit.visitor.allergies}
            </div>
          )}
        </div>

        {/* Consultation Form */}
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {/* Extended Patient Info - Insurance */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem',
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '0.375rem'
            }}>
              <input
                type="checkbox"
                id="isInsured"
                checked={!!formData.isInsured}
                onChange={(e) => setFormData({ ...formData, isInsured: e.target.checked })}
                disabled={isViewMode}
                style={{ width: '18px', height: '18px', cursor: isViewMode ? 'default' : 'pointer', outline: 'none' }}
              />
              <label
                htmlFor="isInsured"
                style={{
                  fontWeight: '600',
                  color: '#166534',
                  cursor: isViewMode ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                Is Insured?
                <span style={{ fontWeight: '400', fontSize: '0.85rem', color: '#15803d' }}>
                  (Check if patient has health insurance coverage)
                </span>
              </label>
            </div>
            {/* Chief Complaints */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '600' }}>
                Chief Complaints <span style={{ color: 'red' }}>*</span>
              </label>
              <textarea
                value={formData.chiefComplaints}
                onChange={(e) => setFormData({ ...formData, chiefComplaints: e.target.value })}
                required
                disabled={isViewMode}
                rows={2}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid var(--color-border)' }}
              />
            </div>

            {/* Clinical Notes */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '600' }}>
                Clinical Notes / Examination Findings
              </label>
              <textarea
                value={formData.clinicalNotes}
                onChange={(e) => setFormData({ ...formData, clinicalNotes: e.target.value })}
                disabled={isViewMode}
                rows={3}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid var(--color-border)' }}
              />
            </div>

            {/* Diagnosis */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '600' }}>
                Diagnosis <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="text"
                value={formData.diagnosis}
                onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                required
                disabled={isViewMode}
                style={{ width: '100%' }}
              />
            </div>

            {/* Prescriptions */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label style={{ fontWeight: '600' }}>Prescriptions</label>
                {!isViewMode && (
                  <button type="button" onClick={addPrescription} style={{ fontSize: '0.875rem', color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer' }}>
                    + Add Medication
                  </button>
                )}
              </div>

              {formData.prescriptions.map((script: any, index: number) => (
                <div key={index} style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr 1fr auto',
                  gap: '0.5rem',
                  marginBottom: '0.5rem',
                  alignItems: 'end'
                }}>
                  <div>
                    <input
                      placeholder="Medicine Name"
                      value={script.name}
                      onChange={(e) => handlePrescriptionChange(index, 'name', e.target.value)}
                      disabled={isViewMode}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <input
                      placeholder="Dosage"
                      value={script.dosage}
                      onChange={(e) => handlePrescriptionChange(index, 'dosage', e.target.value)}
                      disabled={isViewMode}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <input
                      placeholder="Frequency"
                      value={script.frequency}
                      onChange={(e) => handlePrescriptionChange(index, 'frequency', e.target.value)}
                      disabled={isViewMode}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <input
                      placeholder="Duration"
                      value={script.duration}
                      onChange={(e) => handlePrescriptionChange(index, 'duration', e.target.value)}
                      disabled={isViewMode}
                      style={{ width: '100%' }}
                    />
                  </div>
                  {!isViewMode && (
                    <button
                      type="button"
                      onClick={() => removePrescription(index)}
                      style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }}
                    >
                      🗑️
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* File Attachments */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <label style={{ fontWeight: '600' }}>Medical Records & Documents</label>
                {!isViewMode && (
                  <label
                    htmlFor="file-upload"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      fontSize: '0.875rem',
                      background: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.25rem',
                      padding: '0.4rem 0.75rem',
                      cursor: 'pointer'
                    }}
                  >
                    📎 Upload Files
                  </label>
                )}
              </div>

              {!isViewMode && (
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.txt"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
              )}

              {/* Show existing attachments */}
              {visitWithAttachments.attachments && visitWithAttachments.attachments.length > 0 && (
                <div style={{
                  display: 'grid',
                  gap: '0.5rem',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.5rem',
                  padding: '1rem'
                }}>
                  <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#374151' }}>Existing Attachments:</h4>
                  {visitWithAttachments.attachments.map((attachment: any, index: number) => (
                    <div key={index} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '0.375rem',
                      padding: '0.75rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.2rem' }}>
                          {attachment.type === 'IMAGE' ? '🖼️' :
                            attachment.type === 'LAB_REPORT' ? '🔬' :
                              attachment.type === 'DOCUMENT' ? '📄' : '📎'}
                        </span>
                        <div>
                          <div style={{ fontWeight: '500', fontSize: '0.9rem' }}>{attachment.fileName}</div>
                          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                            {(attachment.fileSize / 1024).toFixed(1)} KB • {attachment.type}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          type="button"
                          onClick={() => window.open(fixAttachmentUrl(attachment.fileUrl), '_blank')}
                          style={{
                            background: '#f3f4f6',
                            color: '#374151',
                            border: '1px solid #d1d5db',
                            borderRadius: '0.25rem',
                            padding: '0.25rem 0.5rem',
                            cursor: 'pointer',
                            fontSize: '0.75rem'
                          }}
                        >
                          View
                        </button>
                        {!isViewMode && (
                          <button
                            type="button"
                            onClick={() => handleDeleteAttachment(attachment.id)}
                            style={{
                              background: '#fee2e2',
                              color: '#dc2626',
                              border: '1px solid #fca5a5',
                              borderRadius: '0.25rem',
                              padding: '0.25rem 0.5rem',
                              cursor: 'pointer',
                              fontSize: '0.75rem'
                            }}
                          >
                            🗑️ Remove
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Show uploading files */}
              {uploadingFiles.length > 0 && (
                <div style={{
                  background: '#fef3c7',
                  border: '1px solid #fbbf24',
                  borderRadius: '0.375rem',
                  padding: '0.75rem',
                  marginTop: '0.5rem'
                }}>
                  <div style={{ fontWeight: '500', marginBottom: '0.5rem' }}>Uploading files...</div>
                  {uploadingFiles.map((file, index) => (
                    <div key={index} style={{ fontSize: '0.875rem', color: '#92400e' }}>
                      📄 {file.name} ({(file.size / 1024).toFixed(1)} KB)
                    </div>
                  ))}
                </div>
              )}

              {(!visitWithAttachments.attachments || visitWithAttachments.attachments.length === 0) && uploadingFiles.length === 0 && (
                <div style={{
                  padding: '2rem',
                  textAlign: 'center',
                  color: '#94a3b8',
                  border: '2px dashed #e2e8f0',
                  borderRadius: '0.5rem',
                  background: '#f8fafc'
                }}>
                  <p style={{ margin: 0, fontStyle: 'italic' }}>
                    📎 No documents uploaded yet.
                  </p>
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
                    Upload lab reports, X-rays, prescriptions, or other medical documents.
                  </p>
                </div>
              )}
            </div>

            {/* Treatment Plan & Advice */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '600' }}>
                Treatment Plan
              </label>
              <textarea
                value={formData.treatmentPlan}
                onChange={(e) => setFormData({ ...formData, treatmentPlan: e.target.value })}
                disabled={isViewMode}
                rows={3}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid var(--color-border)' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '600' }}>
                Follow-up Advice
              </label>
              <textarea
                value={formData.followUpAdvice}
                onChange={(e) => setFormData({ ...formData, followUpAdvice: e.target.value })}
                disabled={isViewMode}
                rows={2}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid var(--color-border)' }}
              />
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button type="button" onClick={onClose} style={{ padding: '0.5rem 1rem', border: '1px solid var(--color-border)', borderRadius: '0.25rem', cursor: 'pointer' }}>
              Close
            </button>
            {!isViewMode && (
              <button
                type="submit"
                disabled={saving}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'var(--color-primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.25rem',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.7 : 1
                }}
              >
                {saving ? 'Saving...' : 'Save Consultation'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
