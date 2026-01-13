import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import api, { fixAttachmentUrl } from '../services/api';
import { Visit } from '../types';
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
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
  StatusBadge,
  Modal,
  ModalHeader,
  ModalContent,
  ModalFooter,
  FormField,
  FormGroup,
  TextArea,
  EmptyCard
} from '../components';

/**
 * Doctor dashboard for managing consultations
 * Accessed via: domain.com/{campSlug}/doctor
 */
export default function DoctorDashboard() {
  console.log('DoctorDashboard: Component rendering');
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

  console.log('DoctorDashboard: State initialized', { campSlug, user: user?.email });

  useEffect(() => {
    console.log('DoctorDashboard: useEffect triggered');
    loadVisitors();
  }, []);

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
      // Search returns visitors, need to get their visits
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

  const handleQRScan = async (patientId: string) => {
    setShowScanner(false);
    setSearchQuery(patientId);
    setLoading(true);
    try {
      const response = await api.get(`/doctor/${user?.campId}/visitors/search`, {
        params: { query: patientId, searchBy: 'patientId' }
      });
      const visitors = response.data.visitors || [];
      if (visitors.length > 0) {
        const visitorResponse = await api.get(`/doctor/${user?.campId}/visitors/${visitors[0].id}`);
        if (visitorResponse.data.visits?.length > 0) {
          setSelectedVisit(visitorResponse.data.visits[0]);
          setShowConsultation(true);
        }
      }
    } catch (error) {
      console.error('Scan search failed:', error);
      addToast({
        type: 'error',
        title: 'Patient Not Found',
        message: 'Could not find patient with this QR code or ID'
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

  if (loading && visits.length === 0) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <PageContainer>
      <Header
        title="Doctor Portal"
        subtitle={`Dr. ${user?.name}`}
        icon="🩺"
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

        {/* Stats Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
          <StatCard title="Total Visitors" value={visits.length} color="#2563eb" />
          <StatCard title="Pending" value={visits.filter(v => v.status === 'REGISTERED').length} color="#f59e0b" />
          <StatCard title="Completed" value={visits.filter(v => v.status === 'COMPLETED').length} color="#10b981" />
        </div>

        {/* Visitors Table */}
        <Card>
          <h2 style={{ marginBottom: '1rem' }}>Visitors ({visits.length})</h2>
          {visits.length === 0 ? (
            <EmptyCard 
              title="No visitors found" 
              description="Use search or scan QR code to find patients"
              icon="🔍"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>Patient ID</TableHeaderCell>
                  <TableHeaderCell>Name</TableHeaderCell>
                  <TableHeaderCell>Age/Gender</TableHeaderCell>
                  <TableHeaderCell>Phone</TableHeaderCell>
                  <TableHeaderCell>Symptoms</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell>Action</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visits.map((visit) => (
                  <TableRow key={visit.id}>
                    <TableCell style={{ fontWeight: '600', color: 'var(--color-primary)' }}>
                      {visit.visitor?.patientIdPerCamp}
                    </TableCell>
                    <TableCell>{visit.visitor?.name}</TableCell>
                    <TableCell>{visit.visitor?.age} / {visit.visitor?.gender}</TableCell>
                    <TableCell>{visit.visitor?.phone}</TableCell>
                    <TableCell truncate>{visit.visitor?.symptoms || '-'}</TableCell>
                    <TableCell>
                      <StatusBadge status={visit.status} />
                    </TableCell>
                    <TableCell>
                      <Button 
                        onClick={() => handleConsultClick(visit)}
                        variant="primary"
                        size="sm"
                      >
                        {visit.status === 'COMPLETED' ? '📋 View' : '🩺 Consult'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCamera, setHasCamera] = useState(true);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    
    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setScanning(true);
        }
      } catch (err) {
        console.error('Camera access denied:', err);
        setHasCamera(false);
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

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
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              style={{ width: '100%', borderRadius: '0.5rem', background: '#000' }}
            />
            {scanning && (
              <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
                Point camera at patient's QR code
              </p>
            )}
          </div>
        ) : (
          <p style={{ color: 'var(--color-error)', marginBottom: '1rem' }}>
            Camera not available. Please enter Patient ID manually.
          </p>
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
    followUpAdvice: visit.consultation?.followUpAdvice || ''
    // TODO: Re-enable medical records after backend fix
    // medicalRecords: visit.consultation?.medicalRecords || [{ 
    //   category: '', 
    //   title: '', 
    //   value: '', 
    //   unit: '', 
    //   normalRange: '', 
    //   notes: '',
    //   recordDate: new Date().toISOString().split('T')[0]
    // }]
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

  // TODO: Re-enable medical records after backend fix
  // const handleMedicalRecordChange = (index: number, field: string, value: string) => {
  //   const updated = [...formData.medicalRecords];
  //   updated[index] = { ...updated[index], [field]: value };
  //   setFormData({ ...formData, medicalRecords: updated });
  // };

  // const addMedicalRecord = () => {
  //   setFormData({
  //     ...formData,
  //     medicalRecords: [...formData.medicalRecords, { 
  //       category: '', 
  //       title: '', 
  //       value: '', 
  //       unit: '', 
  //       normalRange: '', 
  //       notes: '',
  //       recordDate: new Date().toISOString().split('T')[0]
  //     }]
  //   });
  // };

  // const removeMedicalRecord = (index: number) => {
  //   setFormData({
  //     ...formData,
  //     medicalRecords: formData.medicalRecords.filter((_, i) => i !== index)
  //   });
  // };

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

            {/* TODO: Medical Records section temporarily disabled */}
            {/* Medical Records will be re-enabled after proper database migration */}

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

            {/* Treatment Plan */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '600' }}>
                Treatment Plan <span style={{ color: 'red' }}>*</span>
              </label>
              <textarea
                value={formData.treatmentPlan}
                onChange={(e) => setFormData({ ...formData, treatmentPlan: e.target.value })}
                required
                disabled={isViewMode}
                rows={2}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid var(--color-border)' }}
              />
            </div>

            {/* Prescriptions */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <label style={{ fontWeight: '600' }}>Prescriptions</label>
                {!isViewMode && (
                  <button 
                    type="button" 
                    onClick={addPrescription} 
                    style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      fontSize: '0.875rem',
                      background: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.25rem',
                      padding: '0.4rem 0.75rem',
                      cursor: 'pointer'
                    }}
                  >
                    ➕ Add Medicine
                  </button>
                )}
              </div>
              
              {/* Prescription Header */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '2fr 1fr 1fr 1fr auto', 
                gap: '0.5rem', 
                marginBottom: '0.5rem',
                padding: '0.5rem',
                background: '#f1f5f9',
                borderRadius: '0.25rem',
                fontWeight: '600',
                fontSize: '0.75rem',
                color: '#64748b'
              }}>
                <div>Medicine Name</div>
                <div>Dosage</div>
                <div>Frequency</div>
                <div>Duration</div>
                <div style={{ width: '40px' }}></div>
              </div>

              {/* Prescription Rows */}
              {formData.prescriptions.map((rx, index) => (
                <div key={index} style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '2fr 1fr 1fr 1fr auto', 
                  gap: '0.5rem', 
                  marginBottom: '0.5rem',
                  alignItems: 'center',
                  padding: '0.5rem',
                  background: index % 2 === 0 ? '#fafafa' : 'white',
                  borderRadius: '0.25rem',
                  border: '1px solid #e2e8f0'
                }}>
                  <input
                    type="text"
                    placeholder="e.g., Paracetamol 500mg"
                    value={rx.name}
                    onChange={(e) => handlePrescriptionChange(index, 'name', e.target.value)}
                    disabled={isViewMode}
                    style={{ padding: '0.5rem', fontSize: '0.9rem' }}
                  />
                  <input
                    type="text"
                    placeholder="e.g., 1 tablet"
                    value={rx.dosage}
                    onChange={(e) => handlePrescriptionChange(index, 'dosage', e.target.value)}
                    disabled={isViewMode}
                    style={{ padding: '0.5rem', fontSize: '0.9rem' }}
                  />
                  <input
                    type="text"
                    placeholder="e.g., 3x daily"
                    value={rx.frequency}
                    onChange={(e) => handlePrescriptionChange(index, 'frequency', e.target.value)}
                    disabled={isViewMode}
                    style={{ padding: '0.5rem', fontSize: '0.9rem' }}
                  />
                  <input
                    type="text"
                    placeholder="e.g., 5 days"
                    value={rx.duration}
                    onChange={(e) => handlePrescriptionChange(index, 'duration', e.target.value)}
                    disabled={isViewMode}
                    style={{ padding: '0.5rem', fontSize: '0.9rem' }}
                  />
                  {!isViewMode && (
                    <button 
                      type="button" 
                      onClick={() => removePrescription(index)}
                      style={{ 
                        background: formData.prescriptions.length > 1 ? '#fee2e2' : '#f1f5f9', 
                        color: formData.prescriptions.length > 1 ? '#991b1b' : '#94a3b8', 
                        border: 'none', 
                        borderRadius: '0.25rem', 
                        padding: '0.5rem', 
                        cursor: formData.prescriptions.length > 1 ? 'pointer' : 'not-allowed',
                        width: '40px',
                        fontSize: '1rem'
                      }}
                      disabled={formData.prescriptions.length <= 1}
                      title={formData.prescriptions.length <= 1 ? 'At least one prescription row required' : 'Remove this medicine'}
                    >
                      🗑️
                    </button>
                  )}
                  {isViewMode && <div style={{ width: '40px' }}></div>}
                </div>
              ))}
              
              {formData.prescriptions.length === 0 && (
                <p style={{ color: '#94a3b8', fontStyle: 'italic', padding: '1rem', textAlign: 'center' }}>
                  No prescriptions added. Click "Add Medicine" to add one.
                </p>
              )}
            </div>

            {/* Follow-up Advice */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '600' }}>
                Follow-up Advice
              </label>
              <textarea
                value={formData.followUpAdvice}
                onChange={(e) => setFormData({ ...formData, followUpAdvice: e.target.value })}
                disabled={isViewMode}
                rows={2}
                placeholder="E.g., Return after 1 week, lab tests recommended, etc."
                style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid var(--color-border)' }}
              />
            </div>
          </div>

          {/* Actions */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            gap: '1rem', 
            marginTop: '1.5rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--color-border)'
          }}>
            <button type="button" onClick={onClose} style={{ padding: '0.75rem 1.5rem' }}>
              {isViewMode ? 'Close' : 'Cancel'}
            </button>
            {!isViewMode && (
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={saving}
                style={{ padding: '0.75rem 1.5rem' }}
              >
                {saving ? 'Saving...' : '💾 Save Consultation'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
