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

  const handleSearch = async (customQuery?: string) => {
    const queryToUse = customQuery || searchQuery || '';
    if (!queryToUse.toString().trim()) {
      loadVisitors();
      return;
    }

    setLoading(true);
    try {
      const response = await api.get(`/doctor/${user?.campId}/visitors/search`, {
        params: { query: queryToUse.toString().trim() }
      });
      // Search endpoint should return same structure as /visitors: { visits: [...] }
      setVisits(response.data.visits || []);
    } catch (error) {
      console.error('Search failed:', error);
      setVisits([]);
    } finally {
      setLoading(false);
    }
  };

  const handleConsultClick = (visit: Visit) => {
    // Pass only visit.id to modal - it will fetch all data itself
    setSelectedVisit({ id: visit.id } as Visit);
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
            <Button onClick={() => handleSearch(searchQuery)} variant="primary">
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
          onScan={(data) => {
            setShowScanner(false);
            // QR code now contains only the patient ID
            const patientId = String(data || '').trim();
            setSearchQuery(patientId);
            // Automatically trigger search with the scanned patientId
            handleSearch(patientId);
          }}
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

function ConsultationModal({ visit, onSave, onClose }: {
  visit: Visit;
  onSave: (data: any) => void;
  onClose: () => void
}) {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [visitData, setVisitData] = useState<Visit | null>(null);
  const [formData, setFormData] = useState({
    chiefComplaints: '',
    clinicalNotes: '',
    diagnosis: '',
    treatmentPlan: '',
    prescriptions: [{ name: '', dosage: '', frequency: '', duration: '' }],
    followUpAdvice: '',
    isInsured: false
  });
  const [saving, setSaving] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([]);
  const isViewMode = visitData?.status === 'COMPLETED';

  // Fetch visit details with all relations when modal opens
  useEffect(() => {
    const fetchVisitDetails = async () => {
      if (!visit?.id || !user?.campId) {
        console.error('Missing visit.id or user.campId:', { visitId: visit?.id, campId: user?.campId });
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('Fetching visit details for:', visit.id);
        const response = await api.get(`/doctor/${user.campId}/visits/${visit.id}`);
        console.log('Visit details response:', response.data);
        const fetchedVisit = response.data.visit;
        setVisitData(fetchedVisit);

        // Populate form with existing data
        setFormData({
          chiefComplaints: fetchedVisit.consultation?.chiefComplaints || fetchedVisit.visitor?.symptoms || '',
          clinicalNotes: fetchedVisit.consultation?.clinicalNotes || '',
          diagnosis: fetchedVisit.consultation?.diagnosis || '',
          treatmentPlan: fetchedVisit.consultation?.treatmentPlan || '',
          prescriptions: fetchedVisit.consultation?.prescriptions || [{ name: '', dosage: '', frequency: '', duration: '' }],
          followUpAdvice: fetchedVisit.consultation?.followUpAdvice || '',
          isInsured: fetchedVisit.consultation?.isInsured || false
        });
      } catch (error) {
        console.error('Failed to fetch visit details:', error);
        alert('Failed to load consultation data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchVisitDetails();
  }, [visit?.id, user?.campId]);

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

      await api.post(`/doctor/${user?.campId}/attachments`, uploadFormData, {
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
      const response = await api.get(`/doctor/${user?.campId}/visits/${visit.id}`);
      setVisitData(response.data.visit);
    } catch (error) {
      console.error('Failed to fetch visit attachments:', error);
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!confirm('Are you sure you want to delete this attachment?')) {
      return;
    }

    try {
      await api.delete(`/doctor/${user?.campId}/attachments/${attachmentId}`);
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

    try {
      setSaving(true);
      await onSave(formData);
      setSaving(false);
    } catch (error) {
      console.error('Error saving consultation:', error);
      setSaving(false);
    }
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
              {loading ? 'Loading...' : `Patient: ${visitData?.visitor?.name || 'N/A'} (${visitData?.visitor?.patientIdPerCamp || 'N/A'})`}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
        </div>

        {/* Loading State */}
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <div className="loading" style={{ margin: '0 auto' }}>Loading consultation data...</div>
          </div>
        ) : (
          <>
            {/* Patient Info */}
            {visitData && (
              <div style={{ padding: '1rem 1.5rem', background: '#eff6ff', borderBottom: '1px solid var(--color-border)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                  <div><strong>Age:</strong> {visitData.visitor?.age} yrs</div>
                  <div><strong>Gender:</strong> {visitData.visitor?.gender}</div>
                  <div><strong>Phone:</strong> {visitData.visitor?.phone}</div>
                  <div><strong>Address:</strong> {visitData.visitor?.city || visitData.visitor?.address || '-'}</div>
                </div>
                {visitData.visitor?.existingConditions && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <strong>Existing Conditions:</strong> {visitData.visitor.existingConditions}
                  </div>
                )}
                {visitData.visitor?.allergies && (
                  <div style={{ marginTop: '0.25rem', color: '#dc2626' }}>
                    <strong>⚠️ Allergies:</strong> {visitData.visitor.allergies}
                  </div>
                )}
              </div>
            )}

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
              {visitData && visitData.attachments && visitData.attachments.length > 0 && (
                <div style={{
                  display: 'grid',
                  gap: '0.5rem',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.5rem',
                  padding: '1rem'
                }}>
                  <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#374151' }}>Existing Attachments:</h4>
                  {visitData.attachments.map((attachment: any, index: number) => (
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

              {(!visitData || !visitData.attachments || visitData.attachments.length === 0) && uploadingFiles.length === 0 && (
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
                Follow-up Advice <span style={{ color: 'red' }}>*</span>
              </label>
              <select
                value={formData.followUpAdvice}
                onChange={(e) => setFormData({ ...formData, followUpAdvice: e.target.value })}
                disabled={isViewMode}
                required
                style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid var(--color-border)' }}
              >
                <option value="">Select follow-up recommendation</option>
                <option value="No Follow-up Required">No Follow-up Required</option>
                <option value="Consult Specialist">Consult Specialist</option>
                <option value="Surgery Required">Surgery Required</option>
                <option value="Further Investigation Needed">Further Investigation Needed</option>
                <option value="Follow-up in 1 Week">Follow-up in 1 Week</option>
                <option value="Follow-up in 2 Weeks">Follow-up in 2 Weeks</option>
                <option value="Follow-up in 1 Month">Follow-up in 1 Month</option>
                <option value="Admitted to Hospital">Admitted to Hospital</option>
                <option value="Referred to Higher Center">Referred to Higher Center</option>
              </select>
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
        </>
        )}
      </div>
    </div>
  );
}

import jsQR from 'jsqr';

// Simple QR Scanner Modal Component
function QRScannerModal({ onScan, onClose }: { onScan: (data: string) => void; onClose: () => void }) {
  const [manualInput, setManualInput] = useState('');
  const [scannerActive, setScannerActive] = useState(false);
  const [error, setError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number>(0);

  // Start camera and scan for QR codes
  const startScanner = async () => {
    setError('');
    setScannerActive(true);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().then(() => {
            scanQRCode();
          }).catch(console.error);
        };
      }
    } catch (err: any) {
      setError('Camera access denied. Please allow camera permission or enter Patient ID manually.');
      setScannerActive(false);
      console.error('Camera error:', err);
    }
  };

  // Scan QR code from video stream
  const scanQRCode = async () => {
    if (!videoRef.current || !canvasRef.current || !streamRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Wait for video to be ready
    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationRef.current = requestAnimationFrame(scanQRCode);
      return;
    }

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    try {
      // Use BarcodeDetector API if available (faster, native)
      if ('BarcodeDetector' in window) {
        const barcodeDetector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
        const barcodes = await barcodeDetector.detect(imageData);
        if (barcodes.length > 0) {
          stopScanner();
          onScan(barcodes[0].rawValue);
          return;
        }
      }

      // Fallback to jsQR if BarcodeDetector is not supported or fails
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code) {
        stopScanner();
        onScan(code.data);
        return;
      }
    } catch (err) {
      // Errors can happen if the image is not ready, just continue scanning
    }

    // Continue scanning
    animationRef.current = requestAnimationFrame(scanQRCode);
  };

  // Stop camera stream
  const stopScanner = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setScannerActive(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  const handleManualSubmit = () => {
    if (manualInput.trim()) {
      stopScanner();
      onScan(manualInput.trim());
    }
  };

  const handleClose = () => {
    stopScanner();
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.85)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '0.75rem',
        padding: '1.5rem',
        maxWidth: '420px',
        width: '100%',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem' }}>📷 Scan Patient QR</h2>
          <button 
            onClick={handleClose} 
            style={{ 
              background: '#f3f4f6', 
              border: 'none', 
              fontSize: '1.25rem', 
              cursor: 'pointer',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ✕
          </button>
        </div>

        {/* Scanner Area */}
        {!scannerActive ? (
          <div style={{ marginBottom: '1rem' }}>
            <button
              onClick={startScanner}
              style={{
                width: '100%',
                padding: '1rem',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              📷 Start Camera Scanner
            </button>
            {error && (
              <p style={{ 
                color: '#dc2626', 
                fontSize: '0.875rem', 
                marginTop: '0.75rem',
                padding: '0.75rem',
                background: '#fef2f2',
                borderRadius: '0.375rem',
                margin: '0.75rem 0 0 0'
              }}>
                ⚠️ {error}
              </p>
            )}
          </div>
        ) : (
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ 
              position: 'relative', 
              width: '100%',
              aspectRatio: '4/3',
              background: '#000',
              borderRadius: '0.5rem',
              overflow: 'hidden'
            }}>
              <video
                ref={videoRef}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
                playsInline
                muted
                autoPlay
              />
              {/* Scanning overlay */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '180px',
                height: '180px',
                border: '3px solid #10b981',
                borderRadius: '1rem',
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.4)'
              }} />
            </div>
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            <p style={{ 
              textAlign: 'center', 
              color: '#10b981', 
              marginTop: '0.75rem',
              fontWeight: '600',
              marginBottom: '0.5rem'
            }}>
              📷 Point camera at QR code...
            </p>
            <button
              onClick={stopScanner}
              style={{
                width: '100%',
                padding: '0.5rem',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: 'pointer'
              }}
            >
              Stop Camera
            </button>
          </div>
        )}

        {/* Manual Entry */}
        <div style={{ 
          borderTop: '1px solid #e5e7eb', 
          paddingTop: '1rem',
          marginTop: '0.5rem'
        }}>
          <p style={{ marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
            Or enter Patient ID manually:
          </p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              placeholder="e.g., ABC123-0001"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleManualSubmit()}
              style={{ 
                flex: 1, 
                padding: '0.75rem',
                borderRadius: '0.375rem',
                border: '1px solid #d1d5db',
                fontSize: '1rem'
              }}
            />
            <button 
              onClick={handleManualSubmit}
              style={{ 
                padding: '0.75rem 1.25rem',
                background: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Go
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
