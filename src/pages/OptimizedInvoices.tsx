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
import ViewColumn from '@mui/icons-material/ViewColumn';
import FirstPage from '@mui/icons-material/FirstPage';
import LastPage from '@mui/icons-material/LastPage';
import ChevronLeft from '@mui/icons-material/ChevronLeft';
import ChevronRight from '@mui/icons-material/ChevronRight';
import CircularProgress from '@mui/joy/CircularProgress';
import { Invoice } from '../types';
import SimpleDataService from '../services/SimpleDataService';
import { log } from '../utils/logger';
import { LazyInvoiceTable } from '../components/tables/LazyInvoiceTable';
import DateRangeDropdown from '../components/DateRangeDropdown';
import dayjs, { Dayjs } from 'dayjs';

const OptimizedInvoices: React.FC = () => {
  console.log('🔍 OptimizedInvoices component rendering');

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const searchTimeoutRef = useRef<number | undefined>(undefined);
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([
    dayjs().startOf('day'),
    dayjs().endOf('day')
  ]);
  const [columnVisibility, setColumnVisibility] = useState({
    invoiceNumber: true,
    patientName: true,
    operatorName: true,
    appointmentDate: true,
    totalAmount: true,
    status: true,
    date: true,
  });
  const [sortField, setSortField] = useState<keyof Invoice | null>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const navigate = useNavigate();

  // Optimized data loading with pagination
  const loadInvoices = useCallback(async (page: number = 1, search: string = '', reset: boolean = false, startDate?: string, endDate?: string) => {
    console.log(`🔍 loadInvoices: Loading page ${page} with search "${search}" and date range ${startDate} to ${endDate}`);
    try {
      if (reset || page === 1) {
        setLoading(true);
      }

      const result = await SimpleDataService.getInvoices({
        page,
        limit: itemsPerPage,
        search: search || undefined,
        filters: startDate && endDate ? {
          startDate: startDate,
          endDate: endDate
        } : undefined
      });

      if (reset || page === 1) {
        setInvoices(result.data);
      } else {
        // Append for infinite scroll behavior
        setInvoices(prev => [...prev, ...result.data]);
      }

      setTotalItems(result.totalCount);
      setHasMore(result.hasNext);
      console.log(`🔍 loadInvoices: Loaded ${result.data.length} invoices (total: ${result.totalCount})`);
    } catch (error) {
      log.error('Error loading invoices', { error, page, search, startDate, endDate }, 'OptimizedInvoices');
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  }, [itemsPerPage]);

  // Initial load
  useEffect(() => {
    console.log('🔍 OptimizedInvoices useEffect - initial load');
    loadInvoices(1, '', true, dateRange[0]?.toISOString(), dateRange[1]?.toISOString());
  }, [loadInvoices, dateRange]);

  // SimpleDataService handles caching automatically

  // Debounced search effect
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
      loadInvoices(1, searchTerm, true, dateRange[0]?.toISOString(), dateRange[1]?.toISOString());
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, loadInvoices, dateRange]);

  // Date range change effect
  useEffect(() => {
    setCurrentPage(1);
    loadInvoices(1, debouncedSearchTerm, true, dateRange[0]?.toISOString(), dateRange[1]?.toISOString());
  }, [dateRange, loadInvoices, debouncedSearchTerm]);

  // Load more data for pagination
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      loadInvoices(nextPage, debouncedSearchTerm, false, dateRange[0]?.toISOString(), dateRange[1]?.toISOString());
    }
  }, [loading, hasMore, currentPage, debouncedSearchTerm, loadInvoices, dateRange]);

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
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        const result = await SimpleDataService.deleteInvoice(id);
        if (result) {
          log.info('Invoice deleted successfully', { id }, 'OptimizedInvoices');
          alert('Invoice deleted successfully!');
        } else {
          alert('Invoice not found or already deleted');
        }
        await loadInvoices(1, debouncedSearchTerm, true, dateRange[0]?.toISOString(), dateRange[1]?.toISOString());
      } catch (error) {
        log.error('Error deleting invoice', { error, id }, 'OptimizedInvoices');
        alert('Failed to delete invoice. Please try again.');
      }
    }
  };

  const handlePatientClick = useCallback((patientId: number) => {
    navigate(`/patients/${patientId}`);
  }, [navigate]);

  const toggleColumnVisibility = useCallback((column: keyof typeof columnVisibility) => {
    setColumnVisibility(prev => ({
      ...prev,
      [column]: !prev[column]
    }));
  }, []);

  
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
          Loading invoice records...
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
            Invoices
          </Typography>
        </Box>
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
            placeholder="Search invoices..."
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
                  onClick={() => toggleColumnVisibility(key as keyof typeof columnVisibility)}
                >
                  <Checkbox
                    checked={visible}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleColumnVisibility(key as keyof typeof columnVisibility);
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

          {/* Date Range Picker */}
          <DateRangeDropdown
            value={dateRange}
            onChange={setDateRange}
          />
        </Box>
      </Card>

      <Card>
        <Box sx={{ overflowX: 'auto' }}>
          <LazyInvoiceTable
            invoices={processedInvoices}
            columnVisibility={columnVisibility}
            onView={(invoice) => navigate(`/invoices/${invoice.id}`)}
            onDelete={handleDelete}
            onPatientClick={handlePatientClick}
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
                  loadInvoices(1, debouncedSearchTerm, true, dateRange[0]?.toISOString(), dateRange[1]?.toISOString());
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
                  loadInvoices(prevPage, debouncedSearchTerm, true, dateRange[0]?.toISOString(), dateRange[1]?.toISOString());
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
                  loadInvoices(nextPage, debouncedSearchTerm, true, dateRange[0]?.toISOString(), dateRange[1]?.toISOString());
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
                  loadInvoices(totalPages, debouncedSearchTerm, true, dateRange[0]?.toISOString(), dateRange[1]?.toISOString());
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
              {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} invoices
            </Typography>
          </Box>
        )}
      </Card>
    </Box>
  );
};

export default OptimizedInvoices;