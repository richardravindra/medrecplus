import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import { ConfirmDialog, AlertDialog } from '../components/ConfirmDialog';
import { useConfirmDialog, useAlertDialog } from '../hooks/useDialog';
import CircularProgress from '@mui/joy/CircularProgress';
import {
  useDebounce,
  useMemoizedCallback,
  usePerformanceMonitor
} from '../hooks/usePerformanceOptimization';
import { Patient } from '../types';
import SimpleDataService from '../services/SimpleDataService';
import { log } from '../utils/logger';
import { LazyPatientTable } from '../components/tables/LazyPatientTable';

type ColumnVisibility = {
  record_number: boolean;
  address: boolean;
  phone_number: boolean;
  initial_diagnosis: boolean;
  created_at: boolean;
};

const OptimizedPatientList: React.FC = () => {
  // Performance monitoring
  const perfMonitor = usePerformanceMonitor('OptimizedPatientList');

  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>({
    record_number: false, // Record Number - hidden by default
    address: true, // Address - shown by default
    phone_number: false, // Phone Number - hidden by default
    initial_diagnosis: false, // Initial Diagnosis - hidden by default
    created_at: true // Date Added - shown by default
  });
  const [sortField, setSortField] = useState<keyof Patient | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [_loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Dialog hooks
  const confirmDialog = useConfirmDialog();
  const alertDialog = useAlertDialog();
  const [itemsPerPage] = useState(10); // Load 10 entries per page
  const [totalItems, setTotalItems] = useState(0);
  const [_hasMore, setHasMore] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const navigate = useNavigate();

  // Optimized data loading with pagination
  const loadPatients = useCallback(
    async (
      page: number = 1,
      search: string = '',
      reset: boolean = false
    ) => {
      perfMonitor.start();
      try {
        if (reset || page === 1) {
          setLoading(true);
        }

        const result = await SimpleDataService.getPatients({
          page,
          limit: itemsPerPage,
          search: search || undefined
        });

        if (reset || page === 1) {
          setPatients(result.data);
        } else {
          // Append for infinite scroll behavior
          setPatients(prev => [...prev, ...result.data]);
        }

        setTotalItems(result.totalCount);
        setHasMore(result.hasNext);
      } catch (_error) {
        log.error(
          'Error loading patients',
          { error: _error, page, search },
          'OptimizedPatientList'
        );
      } finally {
        setLoading(false);
        setInitialLoad(false);
        perfMonitor.end();
      }
    },
    [itemsPerPage, perfMonitor] // Include perfMonitor dependency
  );

  // Initial load
  useEffect(() => {
    loadPatients(1, '', true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Optimized search effect using debounced hook - reduced dependencies to prevent infinite loops
  useEffect(() => {
    setCurrentPage(1);
    loadPatients(1, debouncedSearchTerm, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchTerm]); // Remove loadPatients to prevent infinite loop

  // Calculate totalPages for pagination
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Memoized pagination handlers to prevent inline function recreation
  const handleFirstPage = useMemoizedCallback(() => {
    setCurrentPage(1);
    loadPatients(1, debouncedSearchTerm, true);
  }, [debouncedSearchTerm]);

  const handlePrevPage = useMemoizedCallback(() => {
    const prevPage = Math.max(1, currentPage - 1);
    setCurrentPage(prevPage);
    loadPatients(prevPage, debouncedSearchTerm, true);
  }, [currentPage, debouncedSearchTerm]);

  const handleNextPage = useMemoizedCallback(() => {
    const nextPage = Math.min(totalPages, currentPage + 1);
    setCurrentPage(nextPage);
    loadPatients(nextPage, debouncedSearchTerm, true);
  }, [currentPage, totalPages, debouncedSearchTerm]);

  const handleLastPage = useMemoizedCallback(() => {
    setCurrentPage(totalPages);
    loadPatients(totalPages, debouncedSearchTerm, true);
  }, [totalPages, debouncedSearchTerm]);

  // Memoized filtered and sorted patients for client-side operations
  const processedPatients = useMemo(() => {
    let processed = [...patients];

    // Apply sorting if needed
    if (sortField) {
      processed = processed.sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];

        // Handle null/undefined values
        if (aValue === null || aValue === undefined) return sortDirection === 'asc' ? 1 : -1;
        if (bValue === null || bValue === undefined) return sortDirection === 'asc' ? -1 : 1;

        // Convert to string for comparison
        const aStrValue = String(aValue);
        const bStrValue = String(bValue);

        let comparison = 0;
        if (aStrValue < bStrValue) comparison = -1;
        if (aStrValue > bStrValue) comparison = 1;

        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return processed;
  }, [patients, sortField, sortDirection]);

  const handleSort = (field: keyof Patient) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleDelete = async (id: number) => {
    confirmDialog.openDialog({
      title: 'Confirm Deletion',
      message: 'Are you sure you want to delete this patient? This action cannot be undone.',
      onConfirm: async () => {
        try {
          const result = await SimpleDataService.deletePatient(id);
          if (result) {
            log.info('Patient deleted successfully', { id }, 'OptimizedPatientList');
            alertDialog.openDialog({
              title: 'Success',
              message: 'Patient deleted successfully!',
              variant: 'success'
            });
          } else {
            alertDialog.openDialog({
              title: 'Warning',
              message: 'Patient not found or already deleted',
              variant: 'warning'
            });
          }
          await loadPatients(1, debouncedSearchTerm, true);
        } catch (_error) {
          log.error('Error deleting patient', { error: _error, id }, 'OptimizedPatientList');
          alertDialog.openDialog({
            title: 'Error',
            message: 'Failed to delete patient. Please try again.',
            variant: 'danger'
          });
        }
      }
    });
  };

  const toggleColumnVisibility = (column: keyof ColumnVisibility) => {
    setColumnVisibility(prev => ({
      ...prev,
      [column]: !prev[column]
    }));
  };

  // Display name mapping for column picker
  const columnDisplayNames: Record<keyof ColumnVisibility, string> = {
    record_number: 'Record Number',
    address: 'Address',
    phone_number: 'Phone Number',
    initial_diagnosis: 'Initial Diagnosis',
    created_at: 'Date Added'
  };

  if (initialLoad) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '50vh',
          flexDirection: 'column',
          gap: 2
        }}
      >
        <CircularProgress size='lg' />
        <Typography level='body-sm' color='neutral'>
          Loading patient records...
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        p: 3,
        height: '100vh', // Full viewport height
        display: 'flex',
        flexDirection: 'column',
        gap: 1
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0, // Don't shrink
          mb: 0.5 // Reduced bottom margin
        }}
      >
        <Box>
          <Typography level='h2' sx={{ mb: 0.5 }}>
            Patients
          </Typography>
        </Box>

        <Button
          startDecorator={<Add />}
          onClick={() => navigate('/patients/new')}
          sx={{
            backgroundColor: '#1976d2',
            '&:hover': { backgroundColor: '#1565c0' }
          }}
        >
          New Patient
        </Button>
      </Box>

      <Box
        sx={{
          mb: 1,
          p: 1,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 1,
          alignItems: 'center',
          border: '1px solid #333',
          borderRadius: '8px',
          backgroundColor: '#1a1a1a'
        }}
      >
            <Input
            startDecorator={<Search sx={{ color: '#ffffff', fontSize: '16px' }} />}
            placeholder='Search...'
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            sx={{
              width: { xs: '100%', sm: '350px' },
              height: '36px',
              minHeight: '36px',
              backgroundColor: '#2d2d2d',
              display: 'flex',
              alignItems: 'center',
              flexShrink: 0,
              '& input': {
                color: '#ffffff',
                fontSize: '14px',
                py: 0,
                lineHeight: '36px',
                height: '36px'
              },
              '&::placeholder': { color: '#666' },
              '& .MuiInput-startDecorator': {
                pl: 1.5,
                height: '36px'
              }
            }}
          />

          <Dropdown>
            <MenuButton
              sx={{
                borderColor: '#ffffff',
                color: '#ffffff',
                width: '36px',
                height: '36px',
                minWidth: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                flexShrink: 0,
                '&:hover': { borderColor: '#ffffff' },
                '& svg': {
                  color: '#ffffff',
                  fontSize: '18px'
                }
              }}
            >
              <ViewColumn />
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
                    onChange={e => {
                      e.stopPropagation();
                      toggleColumnVisibility(key as keyof ColumnVisibility);
                    }}
                    onClick={e => e.stopPropagation()}
                    sx={{ mr: 1 }}
                  />
                  <Typography level='body-sm' sx={{ color: '#ffffff' }}>
                    {columnDisplayNames[key as keyof ColumnVisibility]}
                  </Typography>
                </MenuItem>
              ))}
            </Menu>
          </Dropdown>
    </Box>

      <Card
        sx={{
          flex: 1, // Take remaining space
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0 // Allow flex shrinking
        }}
      >
        <Box
          sx={{
            overflowY: 'auto',
            overflowX: 'auto',
            flex: 1, // Take remaining space
            minHeight: 0, // Allow shrinking
            position: 'relative'
          }}
        >
          <LazyPatientTable
            patients={processedPatients}
            columnVisibility={columnVisibility}
            onView={patient => navigate(`/patients/${patient.id}`)}
            onEdit={patient => navigate(`/patients/${patient.id}/edit`)}
            onDelete={handleDelete}
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
          />
        </Box>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              px: 2, // Only horizontal padding
              py: 1, // Reduced vertical padding
              borderTop: '1px solid #333'
            }}
          >
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton
                onClick={handleFirstPage}
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
                onClick={handlePrevPage}
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
                onClick={handleNextPage}
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
                onClick={handleLastPage}
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

            <Typography level='body-sm' sx={{ color: '#ffffff' }}>
              Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} -{' '}
              {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} patients
            </Typography>
          </Box>
        )}
      </Card>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={confirmDialog.isOpen}
        onClose={confirmDialog.closeDialog}
        onConfirm={confirmDialog.handleConfirm}
        title={confirmDialog.config.title}
        message={confirmDialog.config.message}
        confirmText={confirmDialog.config.confirmText}
        cancelText={confirmDialog.config.cancelText}
        variant={confirmDialog.config.variant}
      />

      {/* Alert Dialog */}
      <AlertDialog
        open={alertDialog.isOpen}
        onClose={alertDialog.closeDialog}
        title={alertDialog.config.title}
        message={alertDialog.config.message}
        buttonText={alertDialog.config.buttonText}
        variant={alertDialog.config.variant}
      />
    </Box>
  );
};

export default OptimizedPatientList;
