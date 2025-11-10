import React, { Suspense } from 'react';
import {
  Table,
  Box,
  CircularProgress,
  Typography,
  Chip,
  IconButton,
  Link
} from '@mui/joy';
import Visibility from '@mui/icons-material/Visibility';
import Edit from '@mui/icons-material/Edit';
import Delete from '@mui/icons-material/Delete';
import ArrowUpward from '@mui/icons-material/ArrowUpward';
import ArrowDownward from '@mui/icons-material/ArrowDownward';
import { Patient } from '../../types';

interface LazyPatientTableProps {
  patients: Patient[];
  columnVisibility: {
    record_number: boolean;
    name: boolean;
    age: boolean;
    address: boolean;
    phone_number: boolean;
    initial_diagnosis: boolean;
    date_added: boolean;
  };
  onView: (patient: Patient) => void;
  onEdit: (patient: Patient) => void;
  onDelete: (id: number) => void;
  onAddPatient?: () => void;
  onSort?: (field: keyof Patient) => void;
  sortField?: keyof Patient | null;
  sortDirection?: 'asc' | 'desc';
  currentPage: number;
  itemsPerPage: number;
}

const TableComponent: React.FC<LazyPatientTableProps> = ({
  patients,
  columnVisibility,
  onView,
  onEdit,
  onDelete,
  onAddPatient,
  onSort,
  sortField,
  sortDirection
}) => {
  // Note: patients array is already paginated from the server, so no need to slice again
  const paginatedPatients = patients;

  // Handle empty state
  if (paginatedPatients.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 400,
          flexDirection: 'column',
          gap: 2
        }}
      >
        <Typography level="body-lg" sx={{ color: '#ffffff' }}>
          No patient entries,{' '}
          <Link
            onClick={onAddPatient}
            sx={{
              cursor: 'pointer',
              color: '#1976d2',
              textDecoration: 'none',
              '&:hover': {
                color: '#1565c0',
                textDecoration: 'underline'
              }
            }}
          >
            make one
          </Link>
        </Typography>
      </Box>
    );
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  // Sortable header component
  const SortableHeader: React.FC<{
    children: React.ReactNode;
    field: keyof Patient;
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

  return (
    <Table
      aria-label="Patient records table"
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
          {columnVisibility.record_number && (
            <th style={{ whiteSpace: 'nowrap', padding: '12px' }}>Record Number</th>
          )}
          {columnVisibility.name && (
            <th style={{ whiteSpace: 'nowrap', padding: '12px' }}>Patient Name</th>
          )}
          {columnVisibility.age && (
            <th style={{ whiteSpace: 'nowrap', padding: '12px' }}>Age</th>
          )}
          {columnVisibility.address && (
            <th style={{ padding: '12px' }}>Address</th>
          )}
          {columnVisibility.phone_number && (
            <th style={{ whiteSpace: 'nowrap', padding: '12px' }}>Phone Number</th>
          )}
          {columnVisibility.initial_diagnosis && (
            <th style={{ padding: '12px' }}>Initial Diagnosis</th>
          )}
          {columnVisibility.date_added && (
            <SortableHeader
              field="created_at"
              onClick={() => onSort && onSort('created_at')}
            >
              Date Added
            </SortableHeader>
          )}
          <th style={{ whiteSpace: 'nowrap', padding: '12px' }}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {paginatedPatients.map((patient) => (
          <tr key={patient.id}>
            {columnVisibility.record_number && (
              <td style={{ padding: '12px' }}>
                <Chip
                  variant="soft"
                  size="sm"
                  sx={{
                    backgroundColor: '#1976d2',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: '500'
                  }}
                >
                  {patient.record_number}
                </Chip>
              </td>
            )}
            {columnVisibility.name && (
              <td style={{ padding: '12px' }}>
                <Typography
                  level="body-sm"
                  fontWeight="500"
                  onClick={() => onView(patient)}
                  sx={{
                    cursor: 'pointer',
                    color: '#ffffff',
                    textDecoration: 'none',
                    '&:hover': {
                      color: '#ffffff',
                      textDecoration: 'none',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)'
                    }
                  }}
                >
                  {patient.name}
                </Typography>
              </td>
            )}
            {columnVisibility.age && (
              <td style={{ padding: '12px' }}>{patient.age}</td>
            )}
            {columnVisibility.address && (
              <td style={{ padding: '12px' }}>
                <Typography level="body-sm" sx={{ fontSize: '13px' }}>
                  {patient.address}
                </Typography>
              </td>
            )}
            {columnVisibility.phone_number && (
              <td style={{ padding: '12px' }}>
                <Typography level="body-sm" sx={{ fontSize: '13px' }}>
                  {patient.phone_number}
                </Typography>
              </td>
            )}
            {columnVisibility.initial_diagnosis && (
              <td style={{ padding: '12px' }}>
                <Typography level="body-sm" sx={{ fontSize: '13px' }}>
                  {patient.initial_diagnosis}
                </Typography>
              </td>
            )}
            {columnVisibility.date_added && (
              <td style={{ padding: '12px' }}>
                <Typography level="body-sm" sx={{ fontSize: '13px' }}>
                  {formatDate(patient.created_at || '')}
                </Typography>
              </td>
            )}
            <td style={{ padding: '12px' }}>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <IconButton
                  size="sm"
                  variant="outlined"
                  color="primary"
                  onClick={() => onView(patient)}
                  title="View patient details"
                >
                  <Visibility />
                </IconButton>
                <IconButton
                  size="sm"
                  variant="outlined"
                  color="success"
                  onClick={() => onEdit(patient)}
                  title="Edit patient"
                >
                  <Edit />
                </IconButton>
                <IconButton
                  size="sm"
                  variant="outlined"
                  color="danger"
                  onClick={() => {
                    console.log('🗑️ Delete button clicked for patient:', patient.name, 'ID:', patient.id);
                    onDelete(patient.id!);
                  }}
                  title="Delete patient"
                >
                  <Delete />
                </IconButton>
              </Box>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};

const LoadingFallback: React.FC = () => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '400px',
      color: '#666'
    }}
  >
    <CircularProgress size="lg" />
    <Typography level="body-sm" sx={{ mt: 1 }}>
      Loading patient data...
    </Typography>
  </Box>
);

export const LazyPatientTable: React.FC<LazyPatientTableProps> = (props) => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <TableComponent {...props} />
    </Suspense>
  );
};

export default LazyPatientTable;