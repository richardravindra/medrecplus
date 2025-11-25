import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/joy/Box';
import Card from '@mui/joy/Card';
import Typography from '@mui/joy/Typography';
import Input from '@mui/joy/Input';
import IconButton from '@mui/joy/IconButton';
import Checkbox from '@mui/joy/Checkbox';
import Menu from '@mui/joy/Menu';
import MenuItem from '@mui/joy/MenuItem';
import MenuButton from '@mui/joy/MenuButton';
import Dropdown from '@mui/joy/Dropdown';
import Search from '@mui/icons-material/Search';
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
  usePerformanceMonitor
} from '../hooks/usePerformanceOptimization';
import { Invoice } from '../types';
import { storage } from '../services/UnifiedStorage';
import { log } from '../utils/logger';
import { LazyInvoiceTable } from '../components/tables/LazyInvoiceTable';
import DateRangeDropdown from '../components/DateRangeDropdown';
import dayjs, { Dayjs } from 'dayjs';

const OptimizedInvoices: React.FC = () => {
  // Performance monitoring
  const perfMonitor = usePerformanceMonitor('OptimizedInvoices');

  const [invoices, setInvoices] = useState<Invoice[]>([]);
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
    invoiceNumber: true,
    patientName: true,
    operatorName: true,
    appointmentDate: true,
    totalAmount: true,
    status: true,
    date: false
  });
  const [sortField, setSortField] = useState<keyof Invoice | null>('date');
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
  const loadInvoices = useCallback(
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

        // Get all invoices from unified storage
        const allInvoices = await storage.getInvoices();

        // Apply date filtering if provided
        let filteredInvoices = [...allInvoices];
        if (startDate && endDate) {
          const start = new Date(startDate);
          const end = new Date(endDate);
          filteredInvoices = filteredInvoices.filter(invoice => {
            const invoiceDate = new Date(invoice.date);
            return invoiceDate >= start && invoiceDate <= end;
          });
        }

        // Apply search filtering if provided
        if (search) {
          const searchLower = search.toLowerCase();
          filteredInvoices = filteredInvoices.filter(
            invoice =>
              invoice.patientName.toLowerCase().includes(searchLower) ||
              invoice.operatorName.toLowerCase().includes(searchLower) ||
              (invoice.invoiceNumber &&
                invoice.invoiceNumber.toLowerCase().includes(searchLower)) ||
              invoice.id.toString().includes(searchLower)
          );
        }

        // Sort by date (newest first) by default
        filteredInvoices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // Apply pagination
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedInvoices = filteredInvoices.slice(startIndex, endIndex);

        if (reset || page === 1) {
          setInvoices(paginatedInvoices);
        } else {
          // Append for infinite scroll behavior
          setInvoices(prev => [...prev, ...paginatedInvoices]);
        }

        setTotalItems(filteredInvoices.length);
        setHasMore(endIndex < filteredInvoices.length);
      } catch (_error) {
        log.error(
          'Error loading invoices',
          { error: _error, page, search, startDate, endDate },
          'OptimizedInvoices'
        );
      } finally {
        setLoading(false);
        setInitialLoad(false);
        perfMonitor.end();
      }
    },
    [itemsPerPage, perfMonitor]
  );

  // Initial load
  useEffect(() => {
    const initialDateRange = initialDateRangeRef.current;
    if (initialDateRange) {
      loadInvoices(1, '', true, initialDateRange[0]?.toISOString(), initialDateRange[1]?.toISOString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Optimized search effect using debounced hook
  useEffect(() => {
    setCurrentPage(1);
    loadInvoices(1, debouncedSearchTerm, true, dateRange[0]?.toISOString(), dateRange[1]?.toISOString());
  }, [debouncedSearchTerm, dateRange]); // Depends on search term and date range

  
  // Memoized filtered and sorted invoices for client-side operations
  const processedInvoices = useMemo(() => {
    let processed = [...invoices];

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
  }, [invoices, sortField, sortDirection]);

  const handleSort = (field: keyof Invoice) => {
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
      message: 'Are you sure you want to delete this invoice? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await storage.deleteInvoice(id);
          log.info('Invoice deleted successfully', { id }, 'OptimizedInvoices');
          alertDialog.openDialog({
            title: 'Success',
            message: 'Invoice deleted successfully!',
            variant: 'success'
          });
          await loadInvoices(
            1,
            debouncedSearchTerm,
            true,
            dateRange[0]?.toISOString(),
            dateRange[1]?.toISOString()
          );
        } catch (_error) {
          log.error('Error deleting invoice', { error: _error, id }, 'OptimizedInvoices');
          alertDialog.openDialog({
            title: 'Error',
            message: 'Failed to delete invoice. Please try again.',
            variant: 'danger'
          });
        }
      }
    });
  };

  const handlePatientClick = useCallback(
    (patientId: number) => {
      navigate(`/patients/${patientId}`);
    },
    [navigate]
  );

  const handleAppointmentClick = useCallback(
    (appointmentId: number) => {
      navigate(`/appointments/${appointmentId}`);
    },
    [navigate]
  );

  const toggleColumnVisibility = useCallback((column: keyof typeof columnVisibility) => {
    setColumnVisibility(prev => ({
      ...prev,
      [column]: !prev[column]
    }));
  }, []);

  const totalPages = Math.ceil(totalItems / itemsPerPage);

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
          Loading invoice records...
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
            Invoices
          </Typography>
        </Box>
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
                    {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Typography>
                </MenuItem>
              ))}
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
          <LazyInvoiceTable
            invoices={processedInvoices}
            columnVisibility={columnVisibility}
            onView={invoice => navigate(`/invoices/${invoice.id}`)}
            onDelete={handleDelete}
            onPatientClick={handlePatientClick}
            onAppointmentClick={handleAppointmentClick}
            onSort={handleSort}
            sortField={sortField}
            sortDirection={sortDirection}
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
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
                onClick={() => {
                  setCurrentPage(1);
                  loadInvoices(
                    1,
                    debouncedSearchTerm,
                    true,
                    dateRange[0]?.toISOString(),
                    dateRange[1]?.toISOString()
                  );
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
                  loadInvoices(
                    prevPage,
                    debouncedSearchTerm,
                    true,
                    dateRange[0]?.toISOString(),
                    dateRange[1]?.toISOString()
                  );
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
                  loadInvoices(
                    nextPage,
                    debouncedSearchTerm,
                    true,
                    dateRange[0]?.toISOString(),
                    dateRange[1]?.toISOString()
                  );
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
                  loadInvoices(
                    totalPages,
                    debouncedSearchTerm,
                    true,
                    dateRange[0]?.toISOString(),
                    dateRange[1]?.toISOString()
                  );
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

            
            <Typography level='body-sm' sx={{ color: '#ffffff' }}>
              Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} -{' '}
              {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} invoices
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

export default OptimizedInvoices;
