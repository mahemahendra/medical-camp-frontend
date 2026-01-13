import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import api from '../services/api';
import { User } from '../types';
import { 
  Header, 
  PageContainer, 
  ContentContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
  StatusBadge,
  Pagination,
  Card,
  AvatarBadge
} from '../components';

const PAGE_SIZE = 12;

/**
 * Camp Head - Doctors List Page
 * Grid layout with pagination
 */
export default function CampHeadDoctors() {
  const { campSlug } = useParams<{ campSlug: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [doctors, setDoctors] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    loadDoctors();
  }, [currentPage]);

  const loadDoctors = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/camp-head/${user?.campId}/doctors`, {
        params: { page: currentPage, limit: PAGE_SIZE }
      });
      setDoctors(response.data.doctors || []);
      setTotalCount(response.data.total || 0);
    } catch (error) {
      console.error('Failed to load doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <PageContainer>
      <Header
        title="Doctors"
        subtitle={`${totalCount} doctor${totalCount !== 1 ? 's' : ''} in camp`}
        icon="👨‍⚕️"
        theme="camp-head"
        onBack={() => navigate(`/${campSlug}/camp-head`)}
      />

      <ContentContainer>
        {loading ? (
          <div className="loading">Loading doctors...</div>
        ) : doctors.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: 'var(--color-text-secondary)' }}>No doctors found in this camp.</p>
          </Card>
        ) : (
          <>
            {/* Doctors Table */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>#</TableHeaderCell>
                  <TableHeaderCell>Name</TableHeaderCell>
                  <TableHeaderCell>Specialty</TableHeaderCell>
                  <TableHeaderCell>Email</TableHeaderCell>
                  <TableHeaderCell>Phone</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {doctors.map((doctor, index) => (
                  <TableRow key={doctor.id}>
                    <TableCell style={{ color: 'var(--color-text-secondary)' }}>
                      {(currentPage - 1) * PAGE_SIZE + index + 1}
                    </TableCell>
                    <TableCell>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <AvatarBadge 
                          name={doctor.name || 'Doctor'} 
                          variant="primary"
                        />
                        <span style={{ fontWeight: '500' }}>Dr. {doctor.name}</span>
                      </div>
                    </TableCell>
                    <TableCell style={{ color: 'var(--color-text-secondary)' }}>
                      {doctor.specialty || 'General Physician'}
                    </TableCell>
                    <TableCell>{doctor.email}</TableCell>
                    <TableCell>{doctor.phone || '-'}</TableCell>
                    <TableCell>
                      <StatusBadge 
                        status={doctor.isActive ? 'ACTIVE' : 'INACTIVE'} 
                        statusMap={{
                          'ACTIVE': { text: 'Active', variant: 'success' },
                          'INACTIVE': { text: 'Inactive', variant: 'error' }
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </ContentContainer>
    </PageContainer>
  );
}
