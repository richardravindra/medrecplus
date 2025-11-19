import React, { Suspense, useCallback } from 'react';
import {
  Table,
  Box,
  CircularProgress,
  Typography,
  Chip,
  IconButton
} from '@mui/joy';
import Visibility from '@mui/icons-material/Visibility';
import Delete from '@mui/icons-material/Delete';
import ArrowUpward from '@mui/icons-material/ArrowUpward';
import ArrowDownward from '@mui/icons-material/ArrowDownward';
import { Invoice } from '../../types';
import { formatCurrencyWhole } from '../../utils/currencyUtils';

interface LazyInvoiceTableProps {
  invoices: Invoice[];
  columnVisibility: {
    invoiceNumber: boolean;
    patientName: boolean;
    operatorName: boolean;
    appointmentDate: boolean;
    totalAmount: boolean;
    status: boolean;
    date: boolean;
  };
  onView: (invoice: Invoice) => void;
  onDelete: (id: number) => void;
  onPatientClick?: (patientId: number) => void;
  onAppointmentClick?: (appointmentId: number) => void;
  onSort?: (field: keyof Invoice) => void;
  sortField?: keyof Invoice | null;
  sortDirection?: 'asc' | 'desc';
  currentPage: number;
  itemsPerPage: number;
  loading?: boolean;
}

const TableComponent: React.FC<LazyInvoiceTableProps> = ({
  invoices,
  columnVisibility,
  onView,
  onDelete,
  onPatientClick,
  onAppointmentClick,
  onSort,
  sortField,
  sortDirection,
  loading = false
}) => {
  const memoizedOnView = useCallback((invoice: Invoice) => {
    onView?.(invoice);
  }, [onView]);

  const memoizedOnDelete = useCallback((id: number) => {
    onDelete?.(id);
  }, [onDelete]);

  const memoizedOnPatientClick = useCallback((patientId: number) => {
    onPatientClick?.(patientId);
  }, [onPatientClick]);

  const memoizedOnAppointmentClick = useCallback((appointmentId: number) => {
    onAppointmentClick?.(appointmentId);
  }, [onAppointmentClick]);
  // Note: invoices array is already paginated from the server, so no need to slice again
  const paginatedInvoices = invoices;

  // Date formatting function for dd/mm/yyyy hh:mm24 format
  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'success';
      case 'unpaid':
        return 'warning';
      case 'void':
        return 'danger';
      default:
        return 'neutral';
    }
  };

  // Sortable header component
  const SortableHeader: React.FC<{
    children: React.ReactNode;
    field: keyof Invoice;
    onClick?: () => void;
  }> = ({ children, field, onClick }) => {
    const isSorted = sortField === field;

    return (
      <th
        style={{
          whiteSpace: 'nowrap',
          padding: '12px',
          cursor: onClick ? 'pointer' : 'default',
          userSelect: 'none'
        }}
        onClick={onClick}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {children}
          {isSorted && (
            sortDirection === 'asc' ? <ArrowUpward sx={{ fontSize: 14, color: '#ffffff' }} /> : <ArrowDownward sx={{ fontSize: 14, color: '#ffffff' }} />
          )}
        </Box>
      </th>
    );
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 200,
          flexDirection: 'column',
          gap: 2
        }}
      >
        <CircularProgress size="lg" />
        <Typography level="body-sm" color="neutral">
          Loading invoices...
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <Table
        aria-label="Invoice records table"
        stripe="odd"
        hoverRow
        sx={{
          '& tbody tr:hover': {
            backgroundColor: 'rgba(25, 118, 210, 0.08)',
          },
          '& th': {
            backgroundColor: '#1d293d',
            color: '#ffffff',
            fontWeight: '600',
          },
          '& td': {
            color: '#ffffff',
          },
          '& tr:nth-of-type(odd) td': {
            backgroundColor: 'rgba(45, 45, 45, 0.5)',
          },
        }}
      >
      <thead>
        <tr>
          {columnVisibility.invoiceNumber && (
            <th style={{ whiteSpace: 'nowrap', padding: '12px' }}>Invoice #</th>
          )}
          {columnVisibility.patientName && (
            <th style={{ whiteSpace: 'nowrap', padding: '12px' }}>Patient</th>
          )}
          {columnVisibility.operatorName && (
            <th style={{ whiteSpace: 'nowrap', padding: '12px' }}>Operator</th>
          )}
          {columnVisibility.appointmentDate && (
            <SortableHeader
              field="appointmentDate"
              onClick={() => onSort && onSort('appointmentDate')}
            >
              Appt. Date
            </SortableHeader>
          )}
          {columnVisibility.totalAmount && (
            <th style={{ whiteSpace: 'nowrap', padding: '12px' }}>Amount</th>
          )}
          {columnVisibility.status && (
            <th style={{ whiteSpace: 'nowrap', padding: '12px' }}>Status</th>
          )}
          {columnVisibility.date && (
            <SortableHeader
              field="date"
              onClick={() => onSort && onSort('date')}
            >
              Invoice Date
            </SortableHeader>
          )}
          <th style={{ whiteSpace: 'nowrap', padding: '12px' }}>Actions</th>
        </tr>
      </thead>
        <tbody>
          {paginatedInvoices.map((invoice) => (
            <tr key={invoice.id}>
              {columnVisibility.invoiceNumber && (
                <td style={{ padding: '12px' }}>
                  <Typography
                    sx={{
                      color: '#ffffff',
                      cursor: 'pointer',
                      textDecoration: 'none',
                      '&:hover': {
                        textDecoration: 'none',
                        color: '#ffffff'
                      }
                    }}
                    onClick={() => memoizedOnView(invoice)}
                  >
                    {invoice.invoiceNumber}
                  </Typography>
                </td>
              )}
              {columnVisibility.patientName && (
                <td style={{ padding: '12px' }}>
                  {invoice.patientId ? (
                    <Typography
                      sx={{
                        color: '#ffffff',
                        cursor: 'pointer',
                        textDecoration: 'none',
                        '&:hover': {
                          textDecoration: 'none',
                          color: '#ffffff'
                        }
                      }}
                      onClick={() => invoice.patientId && memoizedOnPatientClick(invoice.patientId)}
                    >
                      {invoice.patientName}
                    </Typography>
                  ) : (
                    <Typography>{invoice.patientName}</Typography>
                  )}
                </td>
              )}
              {columnVisibility.operatorName && (
                <td style={{ padding: '12px' }}>{invoice.operatorName || 'N/A'}</td>
              )}
              {columnVisibility.appointmentDate && (
                <td style={{ padding: '12px' }}>
                  {invoice.appointmentId ? (
                    <Typography
                      sx={{
                        color: '#ffffff',
                        cursor: 'pointer',
                        textDecoration: 'none',
                        '&:hover': {
                          textDecoration: 'none',
                          color: '#1976d2'
                        }
                      }}
                      onClick={() => memoizedOnAppointmentClick(invoice.appointmentId)}
                    >
                      {formatDateTime(invoice.appointmentDate)}
                    </Typography>
                  ) : (
                    <Typography>{formatDateTime(invoice.appointmentDate)}</Typography>
                  )}
                </td>
              )}
              {columnVisibility.totalAmount && (
                <td style={{ padding: '12px' }}>
                  {formatCurrencyWhole(invoice.totalAmount || 0)}
                </td>
              )}
              {columnVisibility.status && (
                <td style={{ padding: '12px' }}>
                  <Chip
                    size="sm"
                    color={getStatusColor(invoice.status)}
                    variant="soft"
                  >
                    {invoice.status || 'Pending'}
                  </Chip>
                </td>
              )}
              {columnVisibility.date && (
                <td style={{ padding: '12px' }}>
                  {formatDateTime(invoice.date)}
                </td>
              )}
              <td style={{ padding: '12px' }}>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <IconButton
                    size="sm"
                    variant="outlined"
                    color="primary"
                    onClick={() => memoizedOnView(invoice)}
                    title="View invoice details"
                  >
                    <Visibility />
                  </IconButton>
                  <IconButton
                    size="sm"
                    variant="outlined"
                    color="danger"
                    onClick={() => memoizedOnDelete(invoice.id)}
                    title="Delete invoice"
                  >
                    <Delete />
                  </IconButton>
                </Box>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      {paginatedInvoices.length === 0 && !loading && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 200,
            flexDirection: 'column',
            gap: 2
          }}
        >
          <Typography level="body-lg" sx={{ color: '#ffffff' }}>
            No invoices found
          </Typography>
        </Box>
      )}
    </>
  );
};

const LoadingFallback: React.FC = () => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 200,
      flexDirection: 'column',
      gap: 2
    }}
  >
    <CircularProgress size="lg" />
    <Typography level="body-sm" color="neutral">
      Loading table...
    </Typography>
  </Box>
);

export const LazyInvoiceTable: React.FC<LazyInvoiceTableProps> = (props) => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <TableComponent {...props} />
    </Suspense>
  );
};

export default LazyInvoiceTable;