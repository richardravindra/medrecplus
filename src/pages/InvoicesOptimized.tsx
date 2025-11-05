/**
 * Optimized Invoices Page with Virtual Scrolling
 *
 * This page uses virtual scrolling and optimized search to handle
 * 400K+ invoice records efficiently.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/joy/Box';
import Typography from '@mui/joy/Typography';
import Button from '@mui/joy/Button';
import Stack from '@mui/joy/Stack';
import Receipt from '@mui/icons-material/Receipt';
import { Invoice } from '../types';
import { DataService } from '../services/DataService';
// import { useCurrency } from '../utils/currencyUtils';
import { VirtualizedTable, invoiceColumns } from '../components/tables/VirtualizedTable';
import { OptimizedSearch } from '../components/OptimizedSearch';
import { usePerformanceMonitor } from '../hooks/usePerformanceMonitor';

const InvoicesOptimized: React.FC = () => {
  const navigate = useNavigate();
  const { metrics } = usePerformanceMonitor('InvoicesPage');

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<keyof Invoice>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Load invoices
  useEffect(() => {
    loadInvoices();
  }, []);

  // Optimized search with performance monitoring
  const handleSearch = useMemo(() => {
    return (query: string) => {
      if (!query.trim()) {
        setFilteredInvoices(invoices);
        return;
      }

      const startTime = performance.now();

      // Use efficient filtering
      const lowerQuery = query.toLowerCase();
      const filtered = invoices.filter(invoice =>
        invoice.patientName.toLowerCase().includes(lowerQuery) ||
        invoice.operatorName.toLowerCase().includes(lowerQuery) ||
        invoice.invoiceNumber.toLowerCase().includes(lowerQuery) ||
        invoice.status.toLowerCase().includes(lowerQuery)
      );

      const endTime = performance.now();
      console.log(`🔍 Optimized invoice search: ${invoices.length} → ${filtered.length} in ${(endTime - startTime).toFixed(2)}ms`);

      setFilteredInvoices(filtered);
    };
  }, [invoices]);

  // Update search when query changes
  useEffect(() => {
    handleSearch(searchQuery);
  }, [searchQuery, handleSearch]);

  const loadInvoices = async () => {
    try {
      console.log('🧾 Loading invoices using DataService...');

      const invoicesData = await DataService.getInvoices();
      console.log(`📊 Loaded ${invoicesData.length} invoices from DataService`);

      setInvoices(invoicesData);
      setFilteredInvoices(invoicesData);

      if (invoicesData.length === 0) {
        console.log('🧾 No invoices found, adding default invoice...');
        // Add some default invoices
        const defaultInvoices: Invoice[] = [
          {
            id: 1,
            invoiceNumber: 'INV20250001',
            appointmentId: 1,
            patientName: 'John Doe',
            patientId: 1,
            operatorName: 'Dr. Default',
            operatorId: 1,
            date: new Date().toISOString(),
            appointmentDate: new Date().toISOString(),
            vitalSigns: {
              bloodPressure: '120/80',
              respirationRate: 16,
              heartRate: 72,
              borgScale: 3
            },
            treatments: [
              { id: 1, name: 'General Consultation', price: 150000 },
              { id: 2, name: 'Blood Test', price: 250000 }
            ],
            totalAmount: 400000,
            status: 'paid',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];
        await DataService.saveData('invoices', defaultInvoices);
        setInvoices(defaultInvoices);
        setFilteredInvoices(defaultInvoices);
      }
    } catch (error) {
      console.error('❌ Failed to load invoices:', error);
      setError('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleInvoiceClick = useCallback((invoice: Invoice) => {
    navigate(`/invoices/${invoice.id}`);
  }, [navigate]);

  const handlePatientClick = useCallback((invoice: Invoice) => {
    navigate(`/patients/${invoice.patientId}`);
  }, [navigate]);

  const handleSort = useCallback((key: keyof Invoice, direction: 'asc' | 'desc') => {
    setSortKey(key);
    setSortDirection(direction);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Enhanced columns with click handlers
  const enhancedColumns = useMemo(() => [
    {
      ...invoiceColumns[0], // Invoice Number column
      render: (value: string, item: Invoice) => (
        <Typography
          sx={{
            color: 'primary',
            textDecoration: 'underline',
            cursor: 'pointer',
            '&:hover': { color: 'primary.plainColor' }
          }}
          onClick={() => handleInvoiceClick(item)}
        >
          {value}
        </Typography>
      )
    },
    {
      ...invoiceColumns[1], // Patient column
      render: (value: string, item: Invoice) => (
        <Typography
          sx={{
            fontWeight: 'medium',
            color: 'primary',
            textDecoration: 'underline',
            cursor: 'pointer',
            '&:hover': { color: 'primary.plainColor' }
          }}
          onClick={() => handlePatientClick(item)}
        >
          {value}
        </Typography>
      )
    },
    {
      ...invoiceColumns[2], // Date column
      render: (value: string, item: Invoice) => (
        <Typography
          sx={{
            color: 'primary',
            textDecoration: 'underline',
            cursor: 'pointer',
            '&:hover': { color: 'primary.plainColor' }
          }}
          onClick={() => handleInvoiceClick(item)}
        >
          {value ? new Date(value).toLocaleString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }) : 'N/A'}
        </Typography>
      )
    },
    {
      ...invoiceColumns[4], // Total Amount column
      render: (value: number) => (
        <Typography fontWeight="medium" sx={{ color: 'success.main' }}>
          {formatCurrency(value || 0)}
        </Typography>
      )
    },
    ...invoiceColumns.slice(3, 4), // Operator column
    ...invoiceColumns.slice(5) // Status column and actions
  ], [handleInvoiceClick, handlePatientClick]);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <Stack alignItems="center" spacing={2}>
          <Typography level="h4">Loading Invoices...</Typography>
          <Typography level="body-sm" color="neutral">
            Processing large dataset with virtual scrolling
          </Typography>
        </Stack>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <Stack alignItems="center" spacing={2}>
          <Typography level="h4" color="danger">Error</Typography>
          <Typography level="body-sm">{error}</Typography>
          <Button onClick={loadInvoices}>Retry</Button>
        </Stack>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography level="h2">Invoices</Typography>
        <Button
          startDecorator={<Receipt />}
          onClick={() => navigate('/invoices/new')}
          sx={{ alignSelf: 'flex-start' }}
        >
          New Invoice
        </Button>
      </Stack>

      {/* Performance Metrics (Development Only) */}
      {import.meta.env.DEV && (
        <Box sx={{ mb: 2, p: 2, backgroundColor: 'neutral.level0', borderRadius: 'sm' }}>
          <Typography level="body-xs" color="neutral">
            Performance: Render {metrics[0]?.renderTime?.toFixed(2) || '0'}ms |
            Memory {metrics[0]?.memoryUsage?.toFixed(2) || '0'}MB |
            Items {filteredInvoices.length.toLocaleString()}
          </Typography>
        </Box>
      )}

      {/* Optimized Search */}
      <Box sx={{ mb: 3 }}>
        <OptimizedSearch
          onSearch={setSearchQuery}
          placeholder="Search invoices by number, patient name, operator, or status..."
          dataCount={invoices.length}
          showStats={true}
        />
      </Box>

      {/* Virtualized Table */}
      <VirtualizedTable
        data={filteredInvoices}
        columns={enhancedColumns}
        loading={loading}
        height={600}
        rowHeight={70}
        onItemClick={handleInvoiceClick}
        searchQuery={searchQuery}
        sortKey={sortKey}
        sortDirection={sortDirection}
        onSort={handleSort}
      />

      {/* Footer with Statistics */}
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography level="body-sm" color="neutral">
          Showing {filteredInvoices.length.toLocaleString()} of {invoices.length.toLocaleString()} invoices
        </Typography>
        <Typography level="body-sm" color="neutral">
          Using virtual scrolling for optimal performance
        </Typography>
      </Box>
    </Box>
  );
};

export default InvoicesOptimized;
