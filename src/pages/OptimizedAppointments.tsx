import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
import { Appointment } from '../types';
import SimpleDataService from '../services/SimpleDataService';
import { log } from '../utils/logger';
import { LazyAppointmentTable } from '../components/tables/LazyAppointmentTable';
import DateRangeDropdown from '../components/DateRangeDropdown';
import dayjs, { Dayjs } from 'dayjs';

const OptimizedAppointments: React.FC = () => {
  // Performance monitoring
  const perfMonitor = usePerformanceMonitor('OptimizedAppointments');

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([
    dayjs().startOf('day'),
    dayjs().endOf('day')
  ]);

  // Store initial dateRange for mount effect - only set on initial render
  const initialDateRangeRef = useRef<[Dayjs | null, Dayjs | null] | null>(null);
  if (initialDateRangeRef.current === null) {
    initialDateRangeRef.current = dateRange;
  }
  const [columnVisibility, setColumnVisibility] = useState({
    date: true, // Date - shown by default (*)
    patientName: true, // Patient Name - shown by default (*)
    vitalSigns: false, // Vital Signs - hidden by default
    treatments: false, // Treatments - hidden by default
    totalPrice: true, // Total Price - shown by default (*)
    operatorName: true // Operator - shown by default (*)
  });
  const [sortField, setSortField] = useState<keyof Appointment | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
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
  const loadAppointments = useCallback(
    async (
      page: number = 1,
      search: string = '',
      reset: boolean = false,
      startDate?: string,
      endDate?: string
    ) => {
      perfMonitor.start();
      try {
        if (reset || page === 1) {
          setLoading(true);
        }

        const result = await SimpleDataService.getAppointments({
          page,
          limit: itemsPerPage,
          search: search || undefined,
          filters:
            startDate && endDate
              ? {
                  startDate: startDate,
                  endDate: endDate
                }
              : undefined
        });

        if (reset || page === 1) {
          setAppointments(result.data);
        } else {
          // Append for infinite scroll behavior
          setAppointments(prev => [...prev, ...result.data]);
        }

        setTotalItems(result.totalCount);
        setHasMore(result.hasNext);
      } catch (_error) {
        log.error(
          'Error loading appointments',
          { error: _error, page, search, startDate, endDate },
          'OptimizedAppointments'
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
    const initialDateRange = initialDateRangeRef.current;
    if (initialDateRange) {
      loadAppointments(1, '', true, initialDateRange[0]?.toISOString(), initialDateRange[1]?.toISOString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Optimized search effect using debounced hook - reduced dependencies to prevent infinite loops
  useEffect(() => {
    setCurrentPage(1);
    loadAppointments(1, debouncedSearchTerm, true, dateRange[0]?.toISOString(), dateRange[1]?.toISOString());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchTerm, dateRange]); // Remove loadAppointments to prevent infinite loop

  // Calculate totalPages for pagination
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Memoized pagination handlers to prevent inline function recreation
  const handleFirstPage = useMemoizedCallback(() => {
    setCurrentPage(1);
    loadAppointments(1, debouncedSearchTerm, true, dateRange[0]?.toISOString(), dateRange[1]?.toISOString());
  }, [debouncedSearchTerm, dateRange]);

  const handlePrevPage = useMemoizedCallback(() => {
    const prevPage = Math.max(1, currentPage - 1);
    setCurrentPage(prevPage);
    loadAppointments(prevPage, debouncedSearchTerm, true, dateRange[0]?.toISOString(), dateRange[1]?.toISOString());
  }, [currentPage, debouncedSearchTerm, dateRange]);

  const handleNextPage = useMemoizedCallback(() => {
    const nextPage = Math.min(totalPages, currentPage + 1);
    setCurrentPage(nextPage);
    loadAppointments(nextPage, debouncedSearchTerm, true, dateRange[0]?.toISOString(), dateRange[1]?.toISOString());
  }, [currentPage, totalPages, debouncedSearchTerm, dateRange]);

  const handleLastPage = useMemoizedCallback(() => {
    setCurrentPage(totalPages);
    loadAppointments(totalPages, debouncedSearchTerm, true, dateRange[0]?.toISOString(), dateRange[1]?.toISOString());
  }, [totalPages, debouncedSearchTerm, dateRange]);

  // Memoized filtered and sorted appointments for client-side operations
  const processedAppointments = useMemo(() => {
    let processed = [...appointments];

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
  }, [appointments, sortField, sortDirection]);

  const handleSort = (field: keyof Appointment) => {
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
      message: 'Are you sure you want to delete this appointment? This action cannot be undone.',
      onConfirm: async () => {
        try {
          const result = await SimpleDataService.deleteAppointment(id);
          if (result) {
            log.info('Appointment deleted successfully', { id }, 'OptimizedAppointments');
            alertDialog.openDialog({
              title: 'Success',
              message: 'Appointment deleted successfully!',
              variant: 'success'
            });
          } else {
            alertDialog.openDialog({
              title: 'Warning',
              message: 'Appointment not found or already deleted',
              variant: 'warning'
            });
          }
          await loadAppointments(
            1,
            debouncedSearchTerm,
            true,
            dateRange[0]?.toISOString(),
            dateRange[1]?.toISOString()
          );
        } catch (_error) {
          log.error('Error deleting appointment', { error: _error, id }, 'OptimizedAppointments');
          alertDialog.openDialog({
            title: 'Error',
            message: 'Failed to delete appointment. Please try again.',
            variant: 'danger'
          });
        }
      }
    });
  };

  const toggleColumnVisibility = (column: keyof typeof columnVisibility) => {
    setColumnVisibility(prev => ({
      ...prev,
      [column]: !prev[column]
    }));
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
          Loading appointment records...
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
            Appointments
          </Typography>
        </Box>

        <Button
          startDecorator={<Add />}
          onClick={() => navigate('/appointments/new')}
          sx={{
            backgroundColor: '#1976d2',
            '&:hover': { backgroundColor: '#1565c0' }
          }}
        >
          New Appointment
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
              {Object.entries(columnVisibility).map(([key, visible]) => {
                const labelMap: Record<string, string> = {
                  date: 'Date',
                  patientName: 'Patient Name',
                  vitalSigns: 'Vital Signs',
                  treatments: 'Treatments',
                  totalPrice: 'Total Price',
                  operatorName: 'Operator'
                };

                return (
                  <MenuItem
                    key={key}
                    sx={{ backgroundColor: '#1a1a1a' }}
                    onClick={() => toggleColumnVisibility(key as keyof typeof columnVisibility)}
                  >
                    <Checkbox
                      checked={visible}
                      onChange={e => {
                        e.stopPropagation();
                        toggleColumnVisibility(key as keyof typeof columnVisibility);
                      }}
                      onClick={e => e.stopPropagation()}
                      sx={{ mr: 1 }}
                    />
                    <Typography level='body-sm' sx={{ color: '#ffffff' }}>
                      {labelMap[key] ||
                        key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Typography>
                  </MenuItem>
                );
              })}
            </Menu>
          </Dropdown>

          <Box sx={{ flexShrink: 0 }}>
            <DateRangeDropdown
              value={dateRange}
              onChange={setDateRange}
            />
          </Box>
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
          <LazyAppointmentTable
            appointments={processedAppointments}
            columnVisibility={columnVisibility}
            onView={appointment => navigate(`/appointments/${appointment.id}`)}
            onDelete={handleDelete}
            onPatientClick={patientId => navigate(`/patients/${patientId}`)}
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
              {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} appointments
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

export default OptimizedAppointments;
