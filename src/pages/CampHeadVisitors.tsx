import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import api from '../services/api';
import { Visitor } from '../types';
import { 
  Header, 
  HeaderSearch, 
  PageContainer, 
  ContentContainer, 
  HeaderTheme,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
  StatusBadge,
  Pagination,
  Card
} from '../components';

const PAGE_SIZE = 12;

/**
 * Visitors List Page - Used by both Camp Head and Doctor
 * For Doctor: Shows only patients they have treated (my-patients)
 * For Camp Head: Shows all visitors in the camp
 */
export default function CampHeadVisitors() {
  const { campSlug } = useParams<{ campSlug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  // Determine if this is doctor view based on URL path
  const isDoctor = location.pathname.includes('/doctor/');
  const backPath = isDoctor ? `/${campSlug}/doctor` : `/${campSlug}/camp-head`;
  const pageTitle = isDoctor ? 'My Patients' : 'Visitors';
  const subtitleText = isDoctor 
    ? `${totalCount} patient${totalCount !== 1 ? 's' : ''} treated`
    : `${totalCount} visitor${totalCount !== 1 ? 's' : ''} registered`;

  useEffect(() => {
    loadVisitors();
  }, [currentPage]);

  const loadVisitors = async (search?: string) => {
    setLoading(true);
    try {
      // Use different endpoint based on role
      const endpoint = isDoctor 
        ? `/doctor/${user?.campId}/my-patients`
        : `/camp-head/${user?.campId}/visitors`;
      
      const response = await api.get(endpoint, {
        params: { 
          page: currentPage, 
          limit: PAGE_SIZE,
          search: search || searchQuery || undefined
        }
      });
      setVisitors(response.data.visitors || []);
      setTotalCount(response.data.total || 0);
    } catch (error) {
      console.error('Failed to load visitors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadVisitors(searchQuery);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setCurrentPage(1);
    loadVisitors('');
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const headerIcon = isDoctor ? '👥' : '📋';
  const theme: HeaderTheme = isDoctor ? 'doctor' : 'camp-head';

  return (
    <PageContainer>
      <Header
        title={pageTitle}
        subtitle={subtitleText}
        icon={headerIcon}
        theme={theme}
        onBack={() => navigate(backPath)}
        actions={
          <HeaderSearch
            value={searchQuery}
            onChange={setSearchQuery}
            onSearch={handleSearch}
            onClear={clearSearch}
            placeholder="Search by name, phone, patient ID..."
            theme={theme}
          />
        }
      />

      <ContentContainer>
        {loading ? (
          <div className="loading">Loading visitors...</div>
        ) : visitors.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: 'var(--color-text-secondary)' }}>
              {searchQuery ? 'No visitors match your search.' : (isDoctor ? 'No patients treated yet.' : 'No visitors registered yet.')}
            </p>
          </Card>
        ) : (
          <>
            {/* Visitors Table */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>#</TableHeaderCell>
                  <TableHeaderCell>Patient ID</TableHeaderCell>
                  <TableHeaderCell>Name</TableHeaderCell>
                  <TableHeaderCell>Age/Gender</TableHeaderCell>
                  <TableHeaderCell>Phone</TableHeaderCell>
                  <TableHeaderCell>Location</TableHeaderCell>
                  <TableHeaderCell>Symptoms</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell>Registered</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visitors.map((visitor, index) => (
                  <TableRow key={visitor.id}>
                    <TableCell style={{ color: 'var(--color-text-secondary)' }}>
                      {(currentPage - 1) * PAGE_SIZE + index + 1}
                    </TableCell>
                    <TableCell style={{ fontWeight: '600', color: 'var(--color-primary)' }}>
                      {visitor.patientIdPerCamp}
                    </TableCell>
                    <TableCell style={{ fontWeight: '500' }}>{visitor.name}</TableCell>
                    <TableCell>{visitor.age} / {visitor.gender}</TableCell>
                    <TableCell>{visitor.phone}</TableCell>
                    <TableCell style={{ color: 'var(--color-text-secondary)' }}>
                      {visitor.city || visitor.district || '-'}
                    </TableCell>
                    <TableCell style={{ maxWidth: '200px' }} truncate>
                      {visitor.symptoms || '-'}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={(visitor as any).latestStatus || 'REGISTERED'} />
                    </TableCell>
                    <TableCell style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                      {new Date(visitor.createdAt).toLocaleDateString()}
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
              showInfo
              totalItems={totalCount}
              itemsPerPage={PAGE_SIZE}
            />
          </>
        )}
      </ContentContainer>
    </PageContainer>
  );
}
