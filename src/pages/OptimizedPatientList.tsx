import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/joy/Box';
import Card from '@mui/joy/Card';
import Typography from '@mui/joy/Typography';
import Input from '@mui/joy/Input';
import Button from '@mui/joy/Button';
import IconButton from '@mui/joy/IconButton';
import Checkbox from '@mui/joy/Checkbox';
import Menu from '@mui/joy/Menu';
import MenuItem from '@mui/joy/MenuItem';
import MenuButton from '@mui/joy/MenuButton';
import Dropdown from '@mui/joy/Dropdown';
import Search from '@mui/icons-material/Search';
import Add from '@mui/icons-material/Add';
import ViewColumn from '@mui/icons-material/ViewColumn';
import FirstPage from '@mui/icons-material/FirstPage';
import LastPage from '@mui/icons-material/LastPage';
import ChevronLeft from '@mui/icons-material/ChevronLeft';
import ChevronRight from '@mui/icons-material/ChevronRight';
import CircularProgress from '@mui/joy/CircularProgress';
import { Patient, ColumnVisibility } from '../types';
import SimpleDataService from '../services/SimpleDataService';
import { log } from '../utils/logger';
import { LazyPatientTable } from '../components/tables/LazyPatientTable';

const OptimizedPatientList: React.FC = () => {
  console.log('🔍 OptimizedPatientList component rendering');

  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const searchTimeoutRef = useRef<number | undefined>(undefined);
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>({
    record_number: false,        // Hidden by default
    name: true,                  // Patient Name - shown by default (*)
    age: true,                   // Age - shown by default (*)
    address: true,               // Address - shown by default (*)
    phone_number: true,          // Phone number - shown by default (*)
    initial_diagnosis: false,    // Initial Diagnosis - hidden by default
    date_added: true,            // Date Added - shown by default (*)
  });
  const [sortField, setSortField] = useState<keyof Patient | null>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const navigate = useNavigate();

  // Handle sort
  const handleSort = (field: keyof Patient) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Optimized data loading with pagination
  const loadPatients = useCallback(async (page: number = 1, search: string = '', reset: boolean = false) => {
    console.log(`🔍 loadPatients: Loading page ${page} with search "${search}"`);
    try {
      if (reset || page === 1) {
        setLoading(true);
      }

      const result = await SimpleDataService.getPatients({
        page,
        limit: itemsPerPage,
        search: search || undefined,
        sortBy: (sortField as string) || undefined,
        sortOrder: sortDirection
      });

      if (reset || page === 1) {
        setPatients(result.data);
      } else {
        // Append for infinite scroll behavior
        setPatients(prev => [...prev, ...result.data]);
      }

      setTotalItems(result.totalCount);
      setHasMore(result.hasNext);
      console.log(`🔍 loadPatients: Loaded ${result.data.length} patients (total: ${result.totalCount})`);
    } catch (error) {
      log.error('Error loading patients', { error, page, search }, 'OptimizedPatientList');
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  }, [itemsPerPage, sortField, sortDirection]);

  // Initial load
  useEffect(() => {
    console.log('🔍 OptimizedPatientList useEffect - initial load');
    loadPatients(1, '', true);
  }, [loadPatients]);

  // SimpleDataService handles caching automatically

  // Debounced search effect
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
      loadPatients(1, searchTerm, true);
    }, 500); // Increased debounce for better performance

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, loadPatients]);

  // Sort change effect
  useEffect(() => {
    setCurrentPage(1);
    loadPatients(1, debouncedSearchTerm, true);
  }, [sortField, sortDirection, loadPatients, debouncedSearchTerm]);

  // Load more data for pagination
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      loadPatients(nextPage, debouncedSearchTerm, false);
    }
  }, [loading, hasMore, currentPage, debouncedSearchTerm, loadPatients]);

  
  
  const handleDelete = async (id: number) => {
    console.log('🗑️ Attempting to delete patient with ID:', id);

    if (window.confirm('Are you sure you want to delete this patient? This action cannot be undone.')) {
      try {
        console.log('🔄 Calling deletePatient service...');
        const result = await SimpleDataService.deletePatient(id);
        console.log('✅ Delete result:', result);

        console.log('🔄 Reloading patient data...');
        await loadPatients(1, debouncedSearchTerm, true);

        if (result) {
          alert('Patient deleted successfully!');
          log.info('Patient deleted successfully', { id }, 'OptimizedPatientList');
        } else {
          alert('Patient not found or already deleted');
        }
      } catch (error) {
        console.error('❌ Error deleting patient:', error);
        log.error('Error deleting patient', { error, id }, 'OptimizedPatientList');
        alert(`Failed to delete patient: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else {
      console.log('❌ Delete cancelled by user');
    }
  };

  const toggleColumnVisibility = (column: keyof ColumnVisibility) => {
    setColumnVisibility(prev => ({
      ...prev,
      [column]: !prev[column]
    }));
  };

  
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (initialLoad) {
    return (
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '50vh',
        flexDirection: 'column',
        gap: 2
      }}>
        <CircularProgress size="lg" />
        <Typography level="body-sm" color="neutral">
          Loading patient records...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 3,
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Box>
          <Typography level="h2" sx={{ mb: 1 }}>
            Patient Records
          </Typography>
        </Box>

        <Button
          startDecorator={<Add />}
          onClick={() => navigate('/patients/add')}
          sx={{
            backgroundColor: '#1976d2',
            '&:hover': { backgroundColor: '#1565c0' },
          }}
        >
          Add Patient
        </Button>
      </Box>

      <Card sx={{
        mb: '8px',
        p: '8px !important',
        '& .MuiCard-root': {
          padding: '8px !important'
        }
      }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <Input
            startDecorator={<Search sx={{ color: '#ffffff' }} />}
            placeholder="Search patients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{
              minWidth: 300,
              backgroundColor: '#2d2d2d',
              '& input': { color: '#ffffff' },
              '&::placeholder': { color: '#666' },
            }}
          />

          <Dropdown>
            <MenuButton
              startDecorator={<ViewColumn />}
              variant="outlined"
              sx={{
                borderColor: '#ffffff',
                color: '#ffffff',
                '&:hover': { borderColor: '#ffffff' },
                '& svg': { color: '#ffffff' },
              }}
            >
              Columns
            </MenuButton>
            <Menu sx={{ backgroundColor: '#1a1a1a' }}>
              {Object.entries(columnVisibility).map(([key, visible]) => (
                <MenuItem
                  key={key}
                  sx={{ backgroundColor: '#1a1a1a' }}
                  onClick={() => toggleColumnVisibility(key as keyof ColumnVisibility)}
                >
                  <Checkbox
                    checked={visible}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleColumnVisibility(key as keyof ColumnVisibility);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    sx={{ mr: 1 }}
                  />
                  <Typography level="body-sm" sx={{ color: '#ffffff' }}>
                    {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Typography>
                </MenuItem>
              ))}
            </Menu>
          </Dropdown>
        </Box>
      </Card>

      <Card>
        <Box sx={{ overflowX: 'auto' }}>
          <LazyPatientTable
            patients={patients}
            columnVisibility={columnVisibility}
            onView={(patient) => navigate(`/patients/${patient.id}`)}
            onEdit={(patient) => navigate(`/patients/${patient.id}/edit`)}
            onDelete={handleDelete}
            onAddPatient={() => navigate('/patients/add')}
            onSort={handleSort}
            sortField={sortField}
            sortDirection={sortDirection}
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
          />
        </Box>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            p: 2,
            borderTop: '1px solid #333'
          }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton
                onClick={() => {
                  setCurrentPage(1);
                  loadPatients(1, debouncedSearchTerm, true);
                }}
                disabled={currentPage === 1}
                sx={{
                  color: '#ffffff',
                  '& svg': { color: '#ffffff' },
                  '&.Mui-disabled': {
                    color: 'rgba(255, 255, 255, 0.3)',
                    '& svg': { color: 'rgba(255, 255, 255, 0.3)' }
                  }
                }}
              >
                <FirstPage />
              </IconButton>
              <IconButton
                onClick={() => {
                  const prevPage = Math.max(1, currentPage - 1);
                  setCurrentPage(prevPage);
                  loadPatients(prevPage, debouncedSearchTerm, true);
                }}
                disabled={currentPage === 1}
                sx={{
                  color: '#ffffff',
                  '& svg': { color: '#ffffff' },
                  '&.Mui-disabled': {
                    color: 'rgba(255, 255, 255, 0.3)',
                    '& svg': { color: 'rgba(255, 255, 255, 0.3)' }
                  }
                }}
              >
                <ChevronLeft />
              </IconButton>
              <IconButton
                onClick={() => {
                  const nextPage = Math.min(totalPages, currentPage + 1);
                  setCurrentPage(nextPage);
                  loadPatients(nextPage, debouncedSearchTerm, true);
                }}
                disabled={currentPage === totalPages}
                sx={{
                  color: '#ffffff',
                  '& svg': { color: '#ffffff' },
                  '&.Mui-disabled': {
                    color: 'rgba(255, 255, 255, 0.3)',
                    '& svg': { color: 'rgba(255, 255, 255, 0.3)' }
                  }
                }}
              >
                <ChevronRight />
              </IconButton>
              <IconButton
                onClick={() => {
                  setCurrentPage(totalPages);
                  loadPatients(totalPages, debouncedSearchTerm, true);
                }}
                disabled={currentPage === totalPages}
                sx={{
                  color: '#ffffff',
                  '& svg': { color: '#ffffff' },
                  '&.Mui-disabled': {
                    color: 'rgba(255, 255, 255, 0.3)',
                    '& svg': { color: 'rgba(255, 255, 255, 0.3)' }
                  }
                }}
              >
                <LastPage />
              </IconButton>
            </Box>

            {hasMore && (
              <Button
                variant="outlined"
                onClick={loadMore}
                disabled={loading}
                sx={{
                  borderColor: '#444',
                  color: '#ffffff',
                  '&:hover': { borderColor: '#666' },
                }}
              >
                {loading ? 'Loading...' : 'Load More'}
              </Button>
            )}

            <Typography level="body-sm" sx={{ color: '#ffffff' }}>
              Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} -{' '}
              {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} patients
            </Typography>
          </Box>
        )}
      </Card>
    </Box>
  );
};

export default OptimizedPatientList;