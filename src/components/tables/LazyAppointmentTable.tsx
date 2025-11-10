import React, { Suspense } from 'react';
import {
  Table,
  Box,
  CircularProgress,
  Typography,
  IconButton
} from '@mui/joy';
import Visibility from '@mui/icons-material/Visibility';
import Delete from '@mui/icons-material/Delete';
import ArrowUpward from '@mui/icons-material/ArrowUpward';
import ArrowDownward from '@mui/icons-material/ArrowDownward';
import { Appointment } from '../../types';
import { formatCurrencyWhole } from '../../utils/currencyUtils';

interface LazyAppointmentTableProps {
  appointments: Appointment[];
  columnVisibility: {
    date: boolean;
    patientName: boolean;
    vitalSigns: boolean;
    treatments: boolean;
    totalPrice: boolean;
    operatorName: boolean;
  };
  onView: (appointment: Appointment) => void;
  onDelete: (id: number) => void;
  onPatientClick?: (patientId: number) => void;
  currentPage: number;
  itemsPerPage: number;
  loading?: boolean;
  sortField?: keyof Appointment | null;
  sortDirection?: 'asc' | 'desc';
  onSort?: (field: keyof Appointment) => void;
}

const TableComponent: React.FC<LazyAppointmentTableProps> = ({
  appointments,
  columnVisibility,
  onView,
  onDelete,
  onPatientClick,
  loading = false,
  sortField = null,
  sortDirection = 'desc',
  onSort
}) => {
  // Note: appointments array is already paginated from the server, so no need to slice again
  const paginatedAppointments = appointments;

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
          Loading appointments...
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <Table
        aria-label="Appointment records table"
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
          {columnVisibility.date && (
            <th
              style={{
                whiteSpace: 'nowrap',
                padding: '12px',
                cursor: 'pointer',
                userSelect: 'none'
              }}
              onClick={() => onSort && onSort('date')}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                Date
                {sortField === 'date' && (
                  sortDirection === 'asc' ?
                    <ArrowUpward sx={{ fontSize: 14, color: '#ffffff' }} /> :
                    <ArrowDownward sx={{ fontSize: 14, color: '#ffffff' }} />
                )}
              </Box>
            </th>
          )}
          {columnVisibility.patientName && (
            <th style={{ whiteSpace: 'nowrap', padding: '12px' }}>Patient Name</th>
          )}
          {columnVisibility.vitalSigns && (
            <th style={{ whiteSpace: 'nowrap', padding: '12px' }}>Vital Signs</th>
          )}
          {columnVisibility.treatments && (
            <th style={{ whiteSpace: 'nowrap', padding: '12px' }}>Treatments</th>
          )}
          {columnVisibility.totalPrice && (
            <th style={{ whiteSpace: 'nowrap', padding: '12px' }}>Total Price</th>
          )}
          {columnVisibility.operatorName && (
            <th style={{ whiteSpace: 'nowrap', padding: '12px' }}>Operator</th>
          )}
          <th style={{ whiteSpace: 'nowrap', padding: '12px' }}>Actions</th>
        </tr>
      </thead>
        <tbody>
          {paginatedAppointments.map((appointment) => {
            const formatDate = (dateString: string) => {
              try {
                const date = new Date(dateString);
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = date.getFullYear();
                const hours = String(date.getHours()).padStart(2, '0');
                const minutes = String(date.getMinutes()).padStart(2, '0');
                return `${day}/${month}/${year} ${hours}:${minutes}`;
              } catch {
                return dateString;
              }
            };

            const formatVitalSigns = (vitalSigns: {
  bloodPressure?: string;
  heartRate?: number | string;
  temperature?: string;
  weight?: string;
  height?: string;
  respirationRate?: number;
  borgScale?: number;
}) => {
              const signs = [];
              if (vitalSigns.bloodPressure && vitalSigns.bloodPressure !== 'Not recorded') {
                signs.push(`BP: ${vitalSigns.bloodPressure}`);
              }
              if (vitalSigns.heartRate && typeof vitalSigns.heartRate === 'number' && vitalSigns.heartRate > 0) {
                signs.push(`HR: ${vitalSigns.heartRate}`);
              }
              if (vitalSigns.respirationRate && vitalSigns.respirationRate > 0) {
                signs.push(`RR: ${vitalSigns.respirationRate}`);
              }
              if (vitalSigns.borgScale && vitalSigns.borgScale > 0) {
                signs.push(`Borg: ${vitalSigns.borgScale}/10`);
              }
              return signs.length > 0 ? signs.join(', ') : 'Not recorded';
            };

            return (
              <tr key={appointment.id}>
                {columnVisibility.date && (
                  <td style={{ padding: '12px' }}>
                    <Typography
                      level="body-sm"
                      onClick={() => onView(appointment)}
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
                      {formatDate(appointment.date)}
                    </Typography>
                  </td>
                )}
                {columnVisibility.patientName && (
                  <td style={{ padding: '12px' }}>
                    <Typography
                      level="body-sm"
                      onClick={() => onPatientClick && appointment.patientId && onPatientClick(appointment.patientId)}
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
                      {appointment.patientName}
                    </Typography>
                  </td>
                )}
                {columnVisibility.vitalSigns && (
                  <td style={{ padding: '12px', fontSize: '12px' }}>
                    {formatVitalSigns(appointment.vitalSigns)}
                  </td>
                )}
                {columnVisibility.treatments && (
                  <td style={{ padding: '12px' }}>
                    {appointment.treatments && appointment.treatments.length > 0
                      ? appointment.treatments.map(t => t.name).join(', ')
                      : 'No treatment'
                    }
                  </td>
                )}
                {columnVisibility.totalPrice && (
                  <td style={{ padding: '12px' }}>
                    {formatCurrencyWhole(appointment.totalPrice || 0)}
                  </td>
                )}
                {columnVisibility.operatorName && (
                  <td style={{ padding: '12px' }}>{appointment.operatorName}</td>
                )}
                <td style={{ padding: '12px' }}>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <IconButton
                      size="sm"
                      variant="outlined"
                      color="primary"
                      onClick={() => onView(appointment)}
                      title="View appointment details"
                    >
                      <Visibility />
                    </IconButton>
                    <IconButton
                      size="sm"
                      variant="outlined"
                      color="danger"
                      onClick={() => onDelete(appointment.id)}
                      title="Delete appointment"
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>
      {paginatedAppointments.length === 0 && !loading && (
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
            No appointments found
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

export const LazyAppointmentTable: React.FC<LazyAppointmentTableProps> = (props) => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <TableComponent {...props} />
    </Suspense>
  );
};

export default LazyAppointmentTable;