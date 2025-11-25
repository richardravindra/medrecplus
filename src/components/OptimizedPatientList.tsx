import React, { useState, useMemo } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  Typography,
  Chip,
  Card,
  CardContent,
  CardActions,
  Button,
  CircularProgress
} from '@mui/material';
import { Search as SearchIcon, Person as PersonIcon } from '@mui/icons-material';
import { VirtualizedTable } from './VirtualizedTable';
import { useDebounce, usePagination } from '../hooks/usePerformanceOptimization';
import { Patient } from '../types';

export interface OptimizedPatientListProps {
  patients: readonly Patient[];
  onPatientSelect: (patient: Patient) => void;
  onPatientEdit: (patient: Patient) => void;
  loading?: boolean;
  _error?: string | null;
}

export function OptimizedPatientList({
  patients,
  onPatientSelect,
  onPatientEdit,
  loading = false,
  _error = null
}: OptimizedPatientListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Memoized search function
  const filteredPatients = useMemo(() => {
    if (!debouncedSearchQuery.trim()) return patients;
    const searchTerm = debouncedSearchQuery.toLowerCase();
    return patients.filter(patient => {
      const name = String(patient.name || '').toLowerCase();
      const phone = String(patient.phone_number || '').toLowerCase();
      const email = String((patient as Record<string, unknown>).email || '').toLowerCase();
      const recordNumber = String(patient.record_number || '').toLowerCase();

      return (
        name.includes(searchTerm) ||
        phone.includes(searchTerm) ||
        email.includes(searchTerm) ||
        recordNumber.includes(searchTerm)
      );
    });
  }, [patients, debouncedSearchQuery]);

  // Pagination for table view
  const { paginatedItems, currentPage, totalPages, nextPage, prevPage, resetPagination } =
    usePagination(filteredPatients, 25);

  // Table columns configuration
  const tableColumns = useMemo(
    () => [
      {
        id: 'name' as keyof Patient,
        label: 'Name',
        minWidth: 150,
        format: (value: unknown) => (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonIcon fontSize='small' color='action' />
            <Typography variant='body2' fontWeight='medium'>
              {String(value)}
            </Typography>
          </Box>
        )
      },
      {
        id: 'age' as keyof Patient,
        label: 'Age',
        align: 'center' as const,
        width: 80,
        format: (value: unknown) => (
          <Chip label={`${(value as number)} years`} size='small' variant='outlined' color='primary' />
        )
      },
      {
        id: 'phone_number' as keyof Patient,
        label: 'Phone',
        minWidth: 120,
        format: (value: unknown) => (
          <Typography variant='body2' color='text.secondary'>
            {(value as string)}
          </Typography>
        )
      },
      {
        id: 'email' as keyof Patient,
        label: 'Email',
        minWidth: 200,
        format: (value: unknown) =>
          value ? (
            <Typography variant='body2' color='text.secondary'>
              {String(value)}
            </Typography>
          ) : (
            <Typography variant='body2' color='text.secondary'>
              -
            </Typography>
          )
      },
      {
        id: 'record_number' as keyof Patient,
        label: 'Record #',
        align: 'center' as const,
        width: 120,
        format: (value: unknown) => (
          <Chip label={String(value || '-')} size='small' variant='filled' color='secondary' />
        )
      }
    ],
    []
  );

  // Reset pagination when search changes
  React.useEffect(() => {
    resetPagination();
  }, [debouncedSearchQuery, resetPagination]);

  const handlePatientClick = (patient: Patient) => {
    onPatientSelect(patient);
  };

  const handleEditClick = (event: React.MouseEvent, patient: Patient) => {
    event.stopPropagation();
    onPatientEdit(patient);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
        <Typography variant='h6' sx={{ ml: 2 }}>
          Loading patients...
        </Typography>
      </Box>
    );
  }

  if (_error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Typography variant='h6' color='error'>
          {_error}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* Search and Controls */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField
          fullWidth
          variant='outlined'
          placeholder='Search patients by name, phone, email, or record number...'
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position='start'>
                <SearchIcon />
              </InputAdornment>
            )
          }}
          sx={{ flex: 1, minWidth: 300 }}
        />

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant={viewMode === 'table' ? 'contained' : 'outlined'}
            onClick={() => setViewMode('table')}
            size='small'
          >
            Table View
          </Button>
          <Button
            variant={viewMode === 'cards' ? 'contained' : 'outlined'}
            onClick={() => setViewMode('cards')}
            size='small'
          >
            Card View
          </Button>
        </Box>
      </Box>

      {/* Results Summary */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant='body2' color='text.secondary'>
          Showing {viewMode === 'table' ? paginatedItems.length : filteredPatients.length} of{' '}
          {filteredPatients.length} patients
          {debouncedSearchQuery && ` for "${debouncedSearchQuery}"`}
        </Typography>

        {viewMode === 'table' && totalPages > 1 && (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Typography variant='body2' color='text.secondary'>
              Page {currentPage} of {totalPages}
            </Typography>
            <Button size='small' onClick={prevPage} disabled={currentPage === 1}>
              Previous
            </Button>
            <Button size='small' onClick={nextPage} disabled={currentPage === totalPages}>
              Next
            </Button>
          </Box>
        )}
      </Box>

      {/* Table View */}
      {viewMode === 'table' && (
        <VirtualizedTable
          data={paginatedItems}
          columns={tableColumns}
          itemHeight={70}
          containerHeight={500}
          onRowClick={handlePatientClick}
          emptyMessage='No patients found'
        />
      )}

      {/* Card View */}
      {viewMode === 'cards' && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(auto-fill, minmax(350px, 1fr))'
            },
            gap: 2,
            maxHeight: 500,
            overflowY: 'auto',
            p: 1
          }}
        >
          {filteredPatients.map(patient => (
            <Card
              key={patient.id}
              sx={{
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  boxShadow: 4,
                  transform: 'translateY(-2px)'
                }
              }}
              onClick={() => handlePatientClick(patient)}
            >
              <CardContent sx={{ pb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <PersonIcon color='action' />
                  <Box>
                    <Typography variant='h6' component='div'>
                      {patient.name || 'Unknown Patient'}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      Age: {patient.age || 0} years
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography variant='body2' color='text.secondary'>
                    <strong>Phone:</strong> {patient.phone_number || 'Not provided'}
                  </Typography>
                  {(patient as { email?: string }).email && (
                    <Typography variant='body2' color='text.secondary'>
                      <strong>Email:</strong> {(patient as { email?: string }).email}
                    </Typography>
                  )}
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Chip
                      label={patient.record_number || 'No record number'}
                      size='small'
                      variant='filled'
                      color='secondary'
                    />
                  </Box>
                </Box>
              </CardContent>
              <CardActions sx={{ pt: 0 }}>
                <Button
                  size='small'
                  onClick={e => handleEditClick(e, patient)}
                  startIcon={<PersonIcon />}
                >
                  View Details
                </Button>
              </CardActions>
            </Card>
          ))}
        </Box>
      )}

      {/* Empty state */}
      {filteredPatients.length === 0 && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 300,
            color: 'text.secondary'
          }}
        >
          <SearchIcon sx={{ fontSize: 48, mb: 2 }} />
          <Typography variant='h6' gutterBottom>
            No patients found
          </Typography>
          <Typography variant='body2'>
            {debouncedSearchQuery
              ? `No patients match "${debouncedSearchQuery}"`
              : 'No patients registered yet'}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
