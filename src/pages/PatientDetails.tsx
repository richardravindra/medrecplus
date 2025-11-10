import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/joy/Box';
import Card from '@mui/joy/Card';
import Typography from '@mui/joy/Typography';
import Button from '@mui/joy/Button';
import Chip from '@mui/joy/Chip';
import Divider from '@mui/joy/Divider';
import Stack from '@mui/joy/Stack';
import Alert from '@mui/joy/Alert';
import CircularProgress from '@mui/joy/CircularProgress';
import IconButton from '@mui/joy/IconButton';
import ArrowBack from '@mui/icons-material/ArrowBack';
import Edit from '@mui/icons-material/Edit';
import Person from '@mui/icons-material/Person';
import Phone from '@mui/icons-material/Phone';
import Home from '@mui/icons-material/Home';
import MedicalInformation from '@mui/icons-material/MedicalInformation';
import Face from '@mui/icons-material/Face';
import Add from '@mui/icons-material/Add';
import Visibility from '@mui/icons-material/Visibility';
import ExpandMore from '@mui/icons-material/ExpandMore';
import ExpandLess from '@mui/icons-material/ExpandLess';
import Pagination from '@mui/material/Pagination';
import { Patient, Appointment } from '../types';
import SimpleDataService from '../services/SimpleDataService';
import { log } from '../utils/logger';
import { formatCurrencyWhole } from '../utils/currencyUtils';

const PatientDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAppointmentsCollapsed, setIsAppointmentsCollapsed] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [appointmentsPerPage] = useState(10);

  useEffect(() => {
    if (id) {
      loadPatient(parseInt(id));
      loadAppointments(parseInt(id));
    }
  }, [id]);

  const loadPatient = async (patientId: number) => {
    try {
      setLoading(true);
      const foundPatient = await SimpleDataService.getPatientById(patientId);

      if (foundPatient) {
        setPatient(foundPatient);
        log.debug('Patient loaded successfully', { id: patientId }, 'PatientDetails');
      } else {
        setError('Patient not found');
        log.warn('Patient not found', { id: patientId }, 'PatientDetails');
      }
    } catch (error) {
      setError('Failed to load patient details');
      log.error('Error loading patient', { error, patientId }, 'PatientDetails');
    } finally {
      setLoading(false);
    }
  };

  const loadAppointments = async (patientId: number) => {
    try {
      const appointmentsResult = await SimpleDataService.getAppointments({
        filters: { patientId }
      });
      const patientAppointments = appointmentsResult.data
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Sort from latest to oldest
      setAppointments(patientAppointments);
      setCurrentPage(1); // Reset to first page when loading new data
    } catch (error) {
      console.error('Error loading appointments:', error);
    }
  };

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value);
  };

  
  const formatAppointmentDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  const handleCreateAppointment = () => {
    if (patient) {
      // Store selected patient ID in localStorage for the new appointment page to use
      localStorage.setItem('selectedPatientForAppointment', JSON.stringify({
        id: patient.id,
        name: patient.name
      }));
      navigate('/appointments/new');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress />
          <Typography level="body-lg">Loading patient details...</Typography>
        </Stack>
      </Box>
    );
  }

  if (error || !patient) {
    return (
      <Box sx={{
        maxWidth: '100%',
        mx: 'auto',
        px: { xs: 2, sm: 0 }
      }}>
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            variant="outlined"
            startDecorator={<ArrowBack />}
            onClick={() => navigate('/patients')}
            sx={{ borderRadius: 'sm' }}
          >
            Back to Patients
          </Button>
          <Typography level="h3">Patient Details</Typography>
        </Box>
        <Alert color="danger">
          {error || 'Patient not found'}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{
      width: '100%',
      height: '100%',
      p: 1,
      boxSizing: 'border-box',
      minWidth: 0
    }}>
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button
          variant="outlined"
          startDecorator={<ArrowBack />}
          onClick={() => navigate('/patients')}
          sx={{ borderRadius: 'sm' }}
        >
          Back to Patients
        </Button>
        <Typography level="h3">Patient Details</Typography>
        <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startDecorator={<Edit />}
            onClick={() => navigate(`/patients/${patient.id}/edit`)}
            sx={{ borderRadius: 'sm' }}
          >
            Edit Patient
          </Button>
          <Button
            variant="solid"
            color="primary"
            startDecorator={<Add />}
            onClick={handleCreateAppointment}
            sx={{ borderRadius: 'sm' }}
          >
            Create Appointment
          </Button>
        </Box>
      </Box>

      <Card>
        <Stack spacing={2}>
          {/* Patient Header */}
          <Box>
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
              <Person sx={{ fontSize: 36, color: '#ffffff' }} />
              <Box>
                <Typography level="h2" sx={{ mb: 0.25 }}>
                  {patient.name}
                </Typography>
                <Chip color="primary" variant="soft" size="sm">
                  {patient.record_number}
                </Chip>
              </Box>
            </Stack>
          </Box>

          <Divider />

          {/* Basic Information */}
          <Box>
            <Typography level="h4" sx={{ mb: 0.5, color: 'primary' }}>
              Basic Information
            </Typography>
            <Stack spacing={2}>
              <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                gap: 3
              }}>
                <Box sx={{
                  flex: 1,
                  minWidth: { xs: '100%', md: 200 }
                }}>
                  <Typography level="body-sm" sx={{ mb: 0.5, color: 'text.secondary' }}>
                    Age
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Face sx={{ fontSize: 20, color: 'text.secondary' }} />
                    <Typography level="body-lg" sx={{ fontWeight: 500 }}>
                      {patient.age} years old
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{
                  flex: 1,
                  minWidth: { xs: '100%', md: 200 }
                }}>
                  <Typography level="body-sm" sx={{ mb: 0.5, color: 'text.secondary' }}>
                    Phone Number
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Phone sx={{ fontSize: 20, color: 'text.secondary' }} />
                    <Typography level="body-lg" sx={{ fontWeight: 500 }}>
                      {patient.phone_number}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {patient.address && (
                <Box>
                  <Typography level="body-sm" sx={{ mb: 0.5, color: 'text.secondary' }}>
                    Address
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <Home sx={{ fontSize: 20, color: 'text.secondary', mt: 0.5 }} />
                    <Typography level="body-lg" sx={{ fontWeight: 500 }}>
                      {patient.address}
                    </Typography>
                  </Box>
                </Box>
              )}

              {patient.initial_diagnosis && (
                <Box>
                  <Typography level="body-sm" sx={{ mb: 0.5, color: 'text.secondary' }}>
                    Initial Diagnosis
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <MedicalInformation sx={{ fontSize: 20, color: 'text.secondary', mt: 0.5 }} />
                    <Typography level="body-lg" sx={{ fontWeight: 500, whiteSpace: 'pre-line' }}>
                      {patient.initial_diagnosis}
                    </Typography>
                  </Box>
                </Box>
              )}
            </Stack>
          </Box>

          <Divider />

          {/* Appointment History */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography level="h4" sx={{ color: 'primary' }}>
                Appointment History ({appointments.length} total)
              </Typography>
              <IconButton
                variant="outlined"
                onClick={() => setIsAppointmentsCollapsed(!isAppointmentsCollapsed)}
                sx={{
                  color: '#ffffff',
                  backgroundColor: '#ffffff',
                  borderColor: '#ffffff',
                  ml: 1,
                  '&:hover': {
                    backgroundColor: '#f5f5f5',
                    borderColor: '#f5f5f5'
                  }
                }}
              >
                {isAppointmentsCollapsed ? <ExpandMore sx={{ color: '#000000' }} /> : <ExpandLess sx={{ color: '#000000' }} />}
              </IconButton>
            </Box>

            {!isAppointmentsCollapsed && (
              <Box sx={{ transition: 'all 0.3s ease-in-out' }}>
                {appointments.length > 0 ? (
                  <>
                    <Card sx={{ mb: 1 }}>
                      <Box sx={{ overflow: 'auto' }}>
                        <table style={{
                          width: '100%',
                          borderCollapse: 'collapse',
                          fontSize: '0.875rem'
                        }}>
                          <thead>
                            <tr style={{
                              borderBottom: '1px solid rgba(255,255,255,0.1)',
                              backgroundColor: 'rgba(255, 255, 255, 0.05)'
                            }}>
                              <th style={{
                                padding: '8px',
                                textAlign: 'left',
                                color: '#ffffff',
                                fontWeight: 'bold',
                                whiteSpace: 'nowrap'
                              }}>
                                Date
                              </th>
                              <th style={{
                                padding: '8px',
                                textAlign: 'left',
                                color: '#ffffff',
                                fontWeight: 'bold',
                                whiteSpace: 'nowrap'
                              }}>
                                Operator
                              </th>
                              <th style={{
                                padding: '8px',
                                textAlign: 'left',
                                color: '#ffffff',
                                fontWeight: 'bold',
                                whiteSpace: 'nowrap'
                              }}>
                                Vital Signs
                              </th>
                              <th style={{
                                padding: '8px',
                                textAlign: 'left',
                                color: '#ffffff',
                                fontWeight: 'bold',
                                whiteSpace: 'nowrap'
                              }}>
                                Treatments
                              </th>
                              <th style={{
                                padding: '8px',
                                textAlign: 'right',
                                color: '#ffffff',
                                fontWeight: 'bold',
                                whiteSpace: 'nowrap'
                              }}>
                                Total Price
                              </th>
                              <th style={{
                                padding: '8px',
                                textAlign: 'center',
                                color: '#ffffff',
                                fontWeight: 'bold',
                                whiteSpace: 'nowrap'
                              }}>
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {appointments
                              .slice(
                                (currentPage - 1) * appointmentsPerPage,
                                currentPage * appointmentsPerPage
                              )
                              .map((appointment) => (
                                <tr
                                  key={appointment.id}
                                  style={{
                                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                                    cursor: 'pointer'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                  }}
                                >
                                  <td style={{ padding: '8px' }}>
                                    <Typography level="body-sm">
                                      {formatAppointmentDate(appointment.date)}
                                    </Typography>
                                  </td>
                                  <td style={{ padding: '8px' }}>
                                    <Typography level="body-sm" sx={{ fontWeight: 500 }}>
                                      {appointment.operatorName}
                                    </Typography>
                                  </td>
                                  <td style={{ padding: '8px' }}>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                      <Typography level="body-xs">
                                        BP: {appointment.vitalSigns.bloodPressure}
                                      </Typography>
                                      <Typography level="body-xs">
                                        HR: {appointment.vitalSigns.heartRate} bpm
                                      </Typography>
                                      <Typography level="body-xs">
                                        RR: {appointment.vitalSigns.respirationRate} /min
                                      </Typography>
                                      <Typography level="body-xs">
                                        Borg: {appointment.vitalSigns.borgScale}/10
                                      </Typography>
                                    </Box>
                                  </td>
                                  <td style={{ padding: '8px' }}>
                                    <Typography level="body-sm">
                                      {appointment.treatments.length} treatment{appointment.treatments.length !== 1 ? 's' : ''}
                                    </Typography>
                                  </td>
                                  <td style={{ padding: '8px', textAlign: 'right' }}>
                                    <Chip color="success" variant="soft" size="sm">
                                      {formatCurrencyWhole(appointment.totalPrice)}
                                    </Chip>
                                  </td>
                                  <td style={{ padding: '8px', textAlign: 'center' }}>
                                    <IconButton
                                      size="sm"
                                      variant="outlined"
                                      color="primary"
                                      onClick={() => navigate(`/appointments/${appointment.id}`)}
                                    >
                                      <Visibility />
                                    </IconButton>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </Box>
                    </Card>

                    {appointments.length > appointmentsPerPage && (
                      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                        <Pagination
                          count={Math.ceil(appointments.length / appointmentsPerPage)}
                          page={currentPage}
                          onChange={handlePageChange}
                          color="primary"
                          sx={{
                            '& .MuiPaginationItem-root': {
                              color: '#ffffff',
                              '&.Mui-selected': {
                                backgroundColor: 'primary.main',
                                color: '#ffffff'
                              }
                            }
                          }}
                        />
                      </Box>
                    )}
                  </>
                ) : (
                  <Box sx={{
                    p: 3,
                    textAlign: 'center',
                    backgroundColor: 'background.level1',
                    borderRadius: 'sm',
                    border: '1px dashed',
                    borderColor: 'divider'
                  }}>
                    <Typography level="title-lg" sx={{ mb: 0.5, color: 'text.secondary' }}>
                      No appointments recorded
                    </Typography>
                    <Typography level="body-sm" sx={{ color: 'text.tertiary' }}>
                      This patient hasn't had any appointments yet
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </Box>

          {/* Created Date */}
          {patient.created_at && (
            <>
              <Divider />
              <Box>
                <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
                  Patient record created on {new Date(patient.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Typography>
              </Box>
            </>
          )}

          </Stack>
      </Card>
    </Box>
  );
};

export default PatientDetails;