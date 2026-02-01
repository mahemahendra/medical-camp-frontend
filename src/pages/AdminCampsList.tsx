import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { apiClient } from '../services/api';
import { useAuthStore } from '../store/auth';
import {
  Header,
  HeaderButton,
  PageContainer,
  ContentContainer,
  Button
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

export default function AdminCampsList() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [camps, setCamps] = useState<Camp[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/admin/camps');
      setCamps(response.data.camps);
    } catch (error) {
      console.error('Failed to fetch camps:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCamp = async (id: string) => {
    const camp = camps.find(c => c.id === id);
    const campName = camp?.name || 'this camp';
    
    if (!confirm(`⚠️ WARNING: This will permanently delete "${campName}" and ALL related data:\n\n• All doctors and camp head users\n• All registered visitors\n• All consultations and medical records\n• All attachments and files\n\nThis action CANNOT be undone!\n\nAre you sure you want to proceed?`)) {
      return;
    }

    try {
      await apiClient.delete(`/admin/camps/${id}`);\n      alert('✅ Camp deleted successfully!');\n      fetchData();\n    } catch (error: any) {\n      console.error('Failed to delete camp:', error);\n      const message = error.response?.data?.message || 'Failed to delete camp. Please try again.';\n      alert(`❌ Error: ${message}`);\n    }\n  };

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
        title="Medical Camps"
        subtitle="Manage all medical camps"
        icon="🏥"
        theme="admin"
        actions={
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <HeaderButton variant="ghost" theme="admin" onClick={() => navigate('/admin/dashboard')}>
              ← Back to Dashboard
            </HeaderButton>
            <HeaderButton variant="primary" theme="admin" onClick={handleLogout}>
              Logout
            </HeaderButton>
          </div>
        }
      />

      <ContentContainer>
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', margin: 0, color: '#1e293b' }}>All Camps ({camps.length})</h2>
            <Button
              onClick={() => navigate('/admin/camps/create')}
              variant="primary"
              icon="+"
            >
              Create New Camp
            </Button>
          </div>

          <CampsDataGrid camps={camps} navigate={navigate} onDelete={handleDeleteCamp} />
        </section>
      </ContentContainer>
    </PageContainer>
  );
}

function CampsDataGrid({ camps, navigate, onDelete }: { camps: Camp[]; navigate: (path: string) => void; onDelete: (id: string) => void }) {

  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Camp Name',
      flex: 1.5,
      minWidth: 200,
      renderCell: (params) => (
        <div
          style={{ cursor: 'pointer', color: '#2563eb', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}
          onClick={() => navigate(`/admin/camps/${params.row.id}/manage`)}
        >
          {params.value}
        </div>
      )
    },
    {
      field: 'hospitalName',
      headerName: 'Hospital',
      flex: 1,
      minWidth: 150
    },
    {
      field: 'venue',
      headerName: 'Venue',
      flex: 1,
      minWidth: 150
    },
    {
      field: 'startTime',
      headerName: 'Start Time',
      flex: 1,
      minWidth: 180,
      valueFormatter: (value) => new Date(value).toLocaleString()
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 100,
      getActions: (params) => [
        <GridActionsCellItem
          key="edit"
          icon={<EditIcon />}
          label="Edit"
          onClick={() => navigate(`/admin/camps/${params.row.id}/edit`)}
          showInMenu={false}
        />,
        <GridActionsCellItem
          key="delete"
          icon={<DeleteIcon />}
          label="Delete"
          onClick={() => onDelete(params.row.id)}
          showInMenu={false}
        />
      ]
    }
  ];

  return (
    <div style={{ width: '100%' }}>
      <DataGrid
        rows={camps}
        columns={columns}
        initialState={{
          pagination: {
            paginationModel: { pageSize: 10 }
          }
        }}
        pageSizeOptions={[10, 25, 50]}
        disableRowSelectionOnClick
        autoHeight
        sx={{
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          '& .MuiDataGrid-cell': {
            padding: '12px'
          },
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: '#f8fafc',
            borderBottom: '2px solid #e2e8f0'
          }
        }}
      />
    </div>
  );
}
