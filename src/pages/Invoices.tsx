import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/joy/Box';
import Card from '@mui/joy/Card';
import Typography from '@mui/joy/Typography';
import Button from '@mui/joy/Button';
import Table from '@mui/joy/Table';
import Input from '@mui/joy/Input';
import Select from '@mui/joy/Select';
import Option from '@mui/joy/Option';
import Chip from '@mui/joy/Chip';
import Stack from '@mui/joy/Stack';
import CircularProgress from '@mui/joy/CircularProgress';
import IconButton from '@mui/joy/IconButton';
import Sheet from '@mui/joy/Sheet';
import Visibility from '@mui/icons-material/Visibility';
import Search from '@mui/icons-material/Search';
import Receipt from '@mui/icons-material/Receipt';
import Delete from '@mui/icons-material/Delete';
import Clear from '@mui/icons-material/Clear';
import ArrowUpward from '@mui/icons-material/ArrowUpward';
import ArrowDownward from '@mui/icons-material/ArrowDownward';
import FirstPage from '@mui/icons-material/FirstPage';
import LastPage from '@mui/icons-material/LastPage';
import ChevronLeft from '@mui/icons-material/ChevronLeft';
import ChevronRight from '@mui/icons-material/ChevronRight';
import ViewColumn from '@mui/icons-material/ViewColumn';
import Dropdown from '@mui/joy/Dropdown';
import Menu from '@mui/joy/Menu';
import MenuButton from '@mui/joy/MenuButton';
import MenuItem from '@mui/joy/MenuItem';
import Checkbox from '@mui/joy/Checkbox';
import { Invoice } from '../types';
import logService from '../services/logService';

const Invoices: React.FC = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // Show 10 items per page
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [selectedDateRange, setSelectedDateRange] = useState<string>('today');
  const [showCustomDateRange, setShowCustomDateRange] = useState(false);
  const [sortField, setSortField] = useState<keyof Invoice | null>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [columnVisibility, setColumnVisibility] = useState({
    invoiceNumber: true,
    patient: true,
    date: true,
    operator: true,
    totalAmount: true,
    status: true,
    actions: true
  });

  useEffect(() => {
    loadInvoices();
    // Initialize date range to today
    const today = new Date().toISOString().split('T')[0];
    setDateRange({ start: today, end: today });
  }, []);

  const loadInvoices = () => {
    try {
      const storedInvoices = localStorage.getItem('invoices');
      if (storedInvoices) {
        setInvoices(JSON.parse(storedInvoices));
      } else {
        setInvoices([]);
      }
    } catch {
      setError('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  const filteredInvoices = useMemo(() => {
    let filtered = invoices.filter(invoice => {
      const matchesSearch = invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           invoice.patientName.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      // Apply date range filter if dates are set
      if (dateRange.start || dateRange.end) {
        const invoiceDate = new Date(invoice.date);

        // Use date strings for direct comparison to avoid timezone issues
        const invoiceDateString = invoiceDate.toISOString().split('T')[0];

        if (dateRange.start && invoiceDateString < dateRange.start) return false;
        if (dateRange.end && invoiceDateString > dateRange.end) return false;
      }

      return true;
    });

    // Apply sorting
    if (sortField) {
      filtered = [...filtered].sort((a, b) => {
        let aValue = a[sortField];
        let bValue = b[sortField];

        // Handle null/undefined values
        if (aValue == null) aValue = '';
        if (bValue == null) bValue = '';

        // Special handling for dates
        if (sortField === 'date' || sortField === 'created_at') {
          aValue = aValue ? new Date(aValue as string).getTime() : 0;
          bValue = bValue ? new Date(bValue as string).getTime() : 0;
        }

        if (aValue < bValue) {
          return sortDirection === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortDirection === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [invoices, searchTerm, dateRange, sortField, sortDirection]);

  // Reset to page 1 when search term or date range changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, dateRange, sortField, sortDirection]);

  const clearDateRange = () => {
    setDateRange({ start: '', end: '' });
    setSelectedDateRange('all');
    setShowCustomDateRange(false);
  };

  const handleDateRangeChange = (range: string) => {
    setSelectedDateRange(range);
    const now = new Date();

    if (range === 'all') {
      setDateRange({ start: '', end: '' });
      setShowCustomDateRange(false);
    } else if (range === 'today') {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      setDateRange({
        start: today.toISOString().split('T')[0],
        end: today.toISOString().split('T')[0]
      });
      setShowCustomDateRange(false);
    } else if (range === 'this_week') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      setDateRange({
        start: startOfWeek.toISOString().split('T')[0],
        end: endOfWeek.toISOString().split('T')[0]
      });
      setShowCustomDateRange(false);
    } else if (range === 'last_week') {
      const startOfLastWeek = new Date(now);
      const daysSinceMonday = now.getDay() === 0 ? 6 : now.getDay() - 1;
      startOfLastWeek.setDate(now.getDate() - daysSinceMonday - 7);
      startOfLastWeek.setHours(0, 0, 0, 0);
      const endOfLastWeek = new Date(startOfLastWeek);
      endOfLastWeek.setDate(startOfLastWeek.getDate() + 6);
      endOfLastWeek.setHours(23, 59, 59, 999);
      setDateRange({
        start: startOfLastWeek.toISOString().split('T')[0],
        end: endOfLastWeek.toISOString().split('T')[0]
      });
      setShowCustomDateRange(false);
    } else if (range === 'this_month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setDateRange({
        start: startOfMonth.toISOString().split('T')[0],
        end: endOfMonth.toISOString().split('T')[0]
      });
      setShowCustomDateRange(false);
    } else if (range === 'last_month') {
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      setDateRange({
        start: startOfLastMonth.toISOString().split('T')[0],
        end: endOfLastMonth.toISOString().split('T')[0]
      });
      setShowCustomDateRange(false);
    } else if (range === 'last_30_days') {
      const startDate = new Date(now);
      startDate.setDate(now.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
      setDateRange({
        start: startDate.toISOString().split('T')[0],
        end: now.toISOString().split('T')[0]
      });
      setShowCustomDateRange(false);
    } else if (range === 'this_year') {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const endOfYear = new Date(now.getFullYear(), 11, 31);
      setDateRange({
        start: startOfYear.toISOString().split('T')[0],
        end: endOfYear.toISOString().split('T')[0]
      });
      setShowCustomDateRange(false);
    } else if (range === 'custom') {
      setShowCustomDateRange(true);
    }
  };

  const handleSort = (field: keyof Invoice) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, set to descending by default for dates, ascending for others
      setSortField(field);
      setSortDirection(field === 'date' ? 'desc' : 'asc');
    }
  };

  // Calculate pagination
  const totalItems = filteredInvoices.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentInvoices = filteredInvoices.slice(startIndex, endIndex);

  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'success';
      case 'unpaid': return 'warning';
      case 'void': return 'danger';
      default: return 'neutral';
    }
  };

  const handleDeleteInvoice = (invoiceId: number) => {
    if (window.confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
      try {
        const storedInvoices = localStorage.getItem('invoices');
        if (storedInvoices) {
          const invoices: Invoice[] = JSON.parse(storedInvoices);
          const invoiceToDelete = invoices.find(inv => inv.id === invoiceId);

          // Log invoice deletion before removing
          if (invoiceToDelete) {
            logService.logInvoiceDeleted(invoiceId, invoiceToDelete.patientId, invoiceToDelete.patientName, invoiceToDelete.operatorName);
          }

          const updatedInvoices = invoices.filter(inv => inv.id !== invoiceId);
          localStorage.setItem('invoices', JSON.stringify(updatedInvoices));
          setInvoices(updatedInvoices);

          // Reset to page 1 if current page would be empty
          const newTotalItems = updatedInvoices.length;
          const newTotalPages = Math.ceil(newTotalItems / itemsPerPage);
          if (currentPage > newTotalPages && newTotalPages > 0) {
            setCurrentPage(newTotalPages);
          }
        }
      } catch (error) {
        console.error('Error deleting invoice:', error);
        alert('Failed to delete invoice. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress />
          <Typography level="body-lg" sx={{ color: '#ffffff' }}>Loading invoices...</Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <Box sx={{
      width: '100%',
      minHeight: '100%',
      p: { xs: 1, md: 2 },
      pt: { xs: 0, md: 2 },
      pr: { xs: 2, md: 2 },
      boxSizing: 'border-box',
      minWidth: 0
    }}>
      <Box sx={{ mb: 1.5 }}>
        <Typography level="h2" sx={{ color: '#ffffff' }}>Invoices</Typography>
      </Box>

      {error && (
        <Box sx={{ mb: 3 }}>
          <Typography color="danger">{error}</Typography>
        </Box>
      )}

      {/* Search and Filter Bar */}
      <Box sx={{ mb: 1, display: 'flex', gap: 2, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flex: 1, minWidth: 300 }}>
          <Input
            startDecorator={<Search sx={{ color: '#ffffff' }} />}
            placeholder="Search invoices by number or patient name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{
              maxWidth: 400,
              flex: 1,
              color: '#ffffff',
              '&::placeholder': {
                color: '#ffffff !important',
                opacity: 0.7
              },
              '& input': {
                color: '#ffffff !important'
              }
            }}
          />
          <Dropdown>
            <MenuButton
              variant="outlined"
              startDecorator={<ViewColumn sx={{ color: '#ffffff' }} />}
              sx={{
                maxWidth: 160,
                minWidth: 0,
                flexShrink: 1,
                width: 'auto',
                borderRadius: 'sm',
                color: '#ffffff',
                height: 40,
                minHeight: 40,
                fontSize: 16,
                whiteSpace: 'nowrap',
              }}
            >
              Columns
            </MenuButton>
            <Menu placement="bottom-end">
              <MenuItem onClick={() => setColumnVisibility(prev => ({ ...prev, invoiceNumber: !prev.invoiceNumber }))}>
                <Checkbox
                  checked={columnVisibility.invoiceNumber}
                  sx={{ mr: 1 }}
                />
                <Typography sx={{ color: '#ffffff' }}>Invoice #</Typography>
              </MenuItem>
              <MenuItem onClick={() => setColumnVisibility(prev => ({ ...prev, patient: !prev.patient }))}>
                <Checkbox
                  checked={columnVisibility.patient}
                  sx={{ mr: 1 }}
                />
                <Typography sx={{ color: '#ffffff' }}>Patient Name</Typography>
              </MenuItem>
              <MenuItem onClick={() => setColumnVisibility(prev => ({ ...prev, date: !prev.date }))}>
                <Checkbox
                  checked={columnVisibility.date}
                  sx={{ mr: 1 }}
                />
                <Typography sx={{ color: '#ffffff' }}>Date & Time</Typography>
              </MenuItem>
              <MenuItem onClick={() => setColumnVisibility(prev => ({ ...prev, operator: !prev.operator }))}>
                <Checkbox
                  checked={columnVisibility.operator}
                  sx={{ mr: 1 }}
                />
                <Typography sx={{ color: '#ffffff' }}>Operator</Typography>
              </MenuItem>
              <MenuItem onClick={() => setColumnVisibility(prev => ({ ...prev, totalAmount: !prev.totalAmount }))}>
                <Checkbox
                  checked={columnVisibility.totalAmount}
                  sx={{ mr: 1 }}
                />
                <Typography sx={{ color: '#ffffff' }}>Total Amount</Typography>
              </MenuItem>
              <MenuItem onClick={() => setColumnVisibility(prev => ({ ...prev, status: !prev.status }))}>
                <Checkbox
                  checked={columnVisibility.status}
                  sx={{ mr: 1 }}
                />
                <Typography sx={{ color: '#ffffff' }}>Status</Typography>
              </MenuItem>
              <MenuItem onClick={() => setColumnVisibility(prev => ({ ...prev, actions: !prev.actions }))}>
                <Checkbox
                  checked={columnVisibility.actions}
                  sx={{ mr: 1 }}
                />
                <Typography sx={{ color: '#ffffff' }}>Actions</Typography>
              </MenuItem>
            </Menu>
          </Dropdown>
        </Box>

        {/* Date Range Filter */}
        <Box sx={{ 
          display: 'flex', 
          gap: 1, 
          alignItems: 'center',
          flexDirection: { xs: 'column', sm: 'row' },
          width: { xs: '100%', sm: 'auto' },
          flexWrap: 'wrap'
        }}>
          <Select
            value={selectedDateRange}
            onChange={(_, value) => handleDateRangeChange(value as string)}
            placeholder="Select Date Range"
            sx={{
              minWidth: { xs: '100%', sm: 180 },
              color: '#ffffff',
              '& .MuiSelect-select': {
                color: '#ffffff !important'
              }
            }}
          >
            <Option value="all" sx={{ color: '#ffffff' }}>All Time</Option>
            <Option value="today" sx={{ color: '#ffffff' }}>Today</Option>
            <Option value="this_week" sx={{ color: '#ffffff' }}>This Week</Option>
            <Option value="last_week" sx={{ color: '#ffffff' }}>Last Week</Option>
            <Option value="this_month" sx={{ color: '#ffffff' }}>This Month</Option>
            <Option value="last_month" sx={{ color: '#ffffff' }}>Last Month</Option>
            <Option value="last_30_days" sx={{ color: '#ffffff' }}>Last 30 Days</Option>
            <Option value="this_year" sx={{ color: '#ffffff' }}>This Year</Option>
            <Option value="custom" sx={{ color: '#ffffff' }}>Custom Range</Option>
          </Select>

          {showCustomDateRange && (
            <Box sx={{ 
              display: 'flex', 
              gap: 1, 
              alignItems: 'center',
              width: { xs: '100%', sm: 'auto' },
              flexWrap: 'wrap'
            }}>
              <Input
                type="date"
                placeholder="Start Date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                slotProps={{
                  input: {
                    type: 'date',
                    min: '2000-01-01',
                    max: '2100-12-31'
                  }
                }}
                sx={{
                  width: { xs: '100%', sm: 150 },
                  flex: { xs: 1, sm: 0 },
                  color: '#ffffff',
                  '& input': {
                    color: '#ffffff !important',
                    '&::-webkit-calendar-picker-indicator': {
                      filter: 'invert(1)',
                      cursor: 'pointer'
                    },
                    '&::-moz-calendar-picker-indicator': {
                      filter: 'invert(1)',
                      cursor: 'pointer'
                    }
                  },
                  '&::placeholder': {
                    color: '#ffffff !important',
                    opacity: 0.7
                  }
                }}
              />
              <Typography level="body-sm" sx={{ color: '#ffffff' }}>to</Typography>
              <Input
                type="date"
                placeholder="End Date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                slotProps={{
                  input: {
                    type: 'date',
                    min: dateRange.start || '2000-01-01',
                    max: '2100-12-31'
                  }
                }}
                sx={{
                  width: { xs: '100%', sm: 150 },
                  flex: { xs: 1, sm: 0 },
                  color: '#ffffff',
                  '& input': {
                    color: '#ffffff !important',
                    '&::-webkit-calendar-picker-indicator': {
                      filter: 'invert(1)',
                      cursor: 'pointer'
                    },
                    '&::-moz-calendar-picker-indicator': {
                      filter: 'invert(1)',
                      cursor: 'pointer'
                    }
                  },
                  '&::placeholder': {
                    color: '#ffffff !important',
                    opacity: 0.7
                  }
                }}
              />
            </Box>
          )}

          {(dateRange.start || dateRange.end) && !showCustomDateRange && (
            <IconButton
              size="sm"
              variant="outlined"
              color="neutral"
              onClick={clearDateRange}
              sx={{ color: '#ffffff' }}
              title="Clear date filter"
            >
              <Clear />
            </IconButton>
          )}
        </Box>
      </Box>

      {/* Pagination Info */}
      {totalItems > 0 && (
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, pr: { xs: 0, md: 0 } }}>
          <Typography level="body-sm" sx={{ color: '#ffffff' }}>
            {/* REMOVE THIS: Showing ... */}
          </Typography>
          {/* REMOVE THIS: Page ... */}
        </Box>
      )}

      {/* Invoices Table */}
      <Card>
        {currentInvoices.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography level="h4" sx={{ mb: 2, color: '#ffffff' }}>
              {searchTerm ? 'No invoices found' : 'No invoices available'}
            </Typography>
            <Typography level="body-sm" sx={{ mb: 3, color: '#ffffff' }}>
              {searchTerm
                ? 'Try adjusting your search terms'
                : 'Generate invoices from appointment details to see them here'
              }
            </Typography>
            {!searchTerm && (
              <Button
                variant="solid"
                color="primary"
                startDecorator={<Receipt />}
                onClick={() => navigate('/appointments')}
              >
                View Appointments
              </Button>
            )}
          </Box>
        ) : (
          <Sheet sx={{ 
            overflow: 'auto', 
            borderRadius: 'sm', 
            overflowX: 'auto',
            width: '100%',
            maxWidth: '100%'
          }}>
            <Box sx={{ overflowX: 'auto', width: '100%' }}>
              <Table
                aria-labelledby="tableTitle"
                hoverRow
                sx={{
                  width: 'auto',
                  minWidth: '100%',
                  tableLayout: 'auto',
                  '& tbody tr:hover': {
                    backgroundColor: 'background.level2',
                  },
                  '& thead th': {
                    backgroundColor: 'background.level1',
                    fontWeight: 'bold',
                    color: 'text.primary',
                    whiteSpace: 'nowrap',
                    padding: { xs: '8px 12px', md: '12px' },
                    width: 'auto',
                    minWidth: 'fit-content',
                  },
                  '& tbody td': {
                    whiteSpace: 'nowrap',
                    padding: { xs: '8px 12px', md: '12px' },
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    width: 'auto',
                    minWidth: 'fit-content',
                  },
                }}
              >
            <thead>
              <tr>
                {columnVisibility.invoiceNumber && <th style={{ padding: '12px', color: '#ffffff' }}>Invoice #</th>}
                {columnVisibility.patient && <th style={{ padding: '12px', color: '#ffffff' }}>Patient</th>}
                {columnVisibility.date && (
                  <th
                    style={{ padding: '12px', color: '#ffffff', cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => handleSort('date')}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {sortField === 'date' && (
                        sortDirection === 'asc' ? <ArrowUpward sx={{ fontSize: 14, color: '#ffffff' }} /> : <ArrowDownward sx={{ fontSize: 14, color: '#ffffff' }} />
                      )}
                      Date & Time
                    </Box>
                  </th>
                )}
                {columnVisibility.operator && <th style={{ padding: '12px', color: '#ffffff' }}>Operator</th>}
                {columnVisibility.totalAmount && <th style={{ padding: '12px', color: '#ffffff' }}>Total Amount</th>}
                {columnVisibility.status && <th style={{ padding: '12px', color: '#ffffff' }}>Status</th>}
                {columnVisibility.actions && <th style={{ padding: '12px', color: '#ffffff' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {currentInvoices.map((invoice) => (
                <tr key={invoice.id}>
                  {columnVisibility.invoiceNumber && (
                    <td style={{ padding: '12px' }}>
                      <Typography
                        component="a"
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          navigate(`/invoices/${invoice.id}`);
                        }}
                        sx={{
                          color: '#ffffff',
                          textDecoration: 'underline',
                          cursor: 'pointer',
                          '&:hover': {
                            color: '#ffffff',
                            textDecoration: 'none',
                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                            textShadow: '0 0 8px rgba(255, 255, 255, 0.5)'
                          }
                        }}
                      >
                        {invoice.invoiceNumber}
                      </Typography>
                    </td>
                  )}
                  {columnVisibility.patient && (
                    <td style={{ padding: '12px', fontWeight: 500, color: '#ffffff' }}>
                      <Typography
                        level="body-sm"
                        fontWeight="bold"
                        component="a"
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          navigate(`/patients/${invoice.patientId}`);
                        }}
                        sx={{
                          color: '#ffffff',
                          textDecoration: 'underline',
                          cursor: 'pointer',
                          '&:hover': {
                            color: '#ffffff',
                            textDecoration: 'none',
                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                            textShadow: '0 0 8px rgba(255, 255, 255, 0.5)'
                          }
                        }}
                      >
                        {invoice.patientName}
                      </Typography>
                    </td>
                  )}
                  {columnVisibility.date && (
                    <td style={{ padding: '12px', color: '#ffffff' }}>
                      <Typography
                        level="body-sm"
                        component="a"
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          navigate(`/appointments/${invoice.appointmentId}`);
                        }}
                        sx={{
                          color: '#ffffff',
                          textDecoration: 'underline',
                          cursor: 'pointer',
                          '&:hover': {
                            color: '#ffffff',
                            textDecoration: 'none',
                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                            textShadow: '0 0 8px rgba(255, 255, 255, 0.5)'
                          }
                        }}
                      >
                        {formatDate(invoice.date)}
                      </Typography>
                    </td>
                  )}
                  {columnVisibility.operator && (
                    <td style={{ padding: '12px', color: '#ffffff' }}>
                      <Typography level="body-sm">
                        {invoice.operatorName}
                      </Typography>
                    </td>
                  )}
                  {columnVisibility.totalAmount && (
                    <td style={{ padding: '12px' }}>
                      <Chip color="success" variant="soft">
                        {formatCurrency(invoice.totalAmount)}
                      </Chip>
                    </td>
                  )}
                  {columnVisibility.status && (
                    <td style={{ padding: '12px' }}>
                      <Chip
                        color={getStatusColor(invoice.status)}
                        variant="soft"
                        size="sm"
                      >
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </Chip>
                    </td>
                  )}
                  {columnVisibility.actions && (
                    <td style={{ padding: '12px' }}>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          size="sm"
                          variant="outlined"
                          color="primary"
                          onClick={() => navigate(`/invoices/${invoice.id}`)}
                        >
                          <Visibility />
                        </IconButton>
                        <IconButton
                          size="sm"
                          variant="outlined"
                          color="danger"
                          onClick={() => handleDeleteInvoice(invoice.id)}
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </Table>
            </Box>
          </Sheet>
        )}
      </Card>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap', pr: { xs: 0, md: 0 } }}>
          <Button
            variant="outlined"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            sx={{ color: '#ffffff', borderColor: '#ffffff' }}
            startDecorator={<FirstPage />}
          >
          </Button>
          <Button
            variant="outlined"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            sx={{ color: '#ffffff', borderColor: '#ffffff' }}
            startDecorator={<ChevronLeft />}
          >
          </Button>

          <Typography sx={{
            display: 'flex',
            alignItems: 'center',
            color: '#ffffff',
            mx: 2
          }}>
            Page {currentPage} of {totalPages}
          </Typography>

          <Button
            variant="outlined"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            sx={{ color: '#ffffff', borderColor: '#ffffff' }}
            startDecorator={<ChevronRight />}
          >
          </Button>
          <Button
            variant="outlined"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            sx={{ color: '#ffffff', borderColor: '#ffffff' }}
            startDecorator={<LastPage />}
          >
          </Button>
        </Box>
      )}
      {/* Add summary info here always, after pagination, even for single page */}
      {totalItems > 0 && (
        <Typography sx={{ color: '#ffffff', fontSize: '12px', mt: 1, textAlign: 'center', width: '100%' }}>
          Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems} invoices
          {(searchTerm || dateRange.start || dateRange.end) && ` (filtered from ${invoices.length} total)`}
        </Typography>
      )}
    </Box>
  );
};

export default Invoices;