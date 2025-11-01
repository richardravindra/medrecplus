import React, { useState, useEffect, useMemo } from 'react';
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
import Add from '@mui/icons-material/Add';
import Visibility from '@mui/icons-material/Visibility';
import ExpandMore from '@mui/icons-material/ExpandMore';
import ExpandLess from '@mui/icons-material/ExpandLess';
import { Patient } from '../types';
import { databaseService } from '../services/database';

interface Appointment {
  id: number;
  patientName: string;
  patientId: number;
  date: string;
  vitalSigns: {
    bloodPressure: string;
    respirationRate: number;
    heartRate: number;
    borgScale: number;
  };
  treatments: Array<{
    id: number;
    name: string;
    price: number;
  }>;
  totalPrice: number;
  created_at: string;
}

const PatientDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAppointmentsCollapsed, setIsAppointmentsCollapsed] = useState(false);

  useEffect(() => {
    if (id) {
      loadPatient(parseInt(id));
      loadAppointments(parseInt(id));
    }
  }, [id]);

  const loadPatient = async (patientId: number) => {
    try {
      setLoading(true);
      const patients = await databaseService.getPatients();
      const foundPatient = patients.find(p => p.id === patientId);

      if (foundPatient) {
        setPatient(foundPatient);
      } else {
        setError('Patient not found');
      }
    } catch (error) {
      setError('Failed to load patient details');
      console.error('Error loading patient:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAppointments = (patientId: number) => {
    try {
      const storedAppointments = localStorage.getItem('appointments');
      if (storedAppointments) {
        const allAppointments = JSON.parse(storedAppointments);
        const patientAppointments = allAppointments.filter((apt: Appointment) => apt.patientId === patientId);
        setAppointments(patientAppointments);
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
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
      p: 2,
      boxSizing: 'border-box',
      minWidth: 0
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
        <Stack spacing={4}>
          {/* Patient Header */}
          <Box>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
              <Person sx={{ fontSize: 40, color: 'primary' }} />
              <Box>
                <Typography level="h2" sx={{ mb: 0.5 }}>
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
            <Typography level="h4" sx={{ mb: 2, color: 'primary' }}>
              Basic Information
            </Typography>
            <Stack spacing={3}>
              <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                gap: 4
              }}>
                <Box sx={{
                  flex: 1,
                  minWidth: { xs: '100%', md: 200 }
                }}>
                  <Typography level="body-sm" sx={{ mb: 1, color: 'text.secondary' }}>
                    Age
                  </Typography>
                  <Typography level="body-lg" sx={{ fontWeight: 500 }}>
                    {patient.age} years old
                  </Typography>
                </Box>
                <Box sx={{
                  flex: 1,
                  minWidth: { xs: '100%', md: 200 }
                }}>
                  <Typography level="body-sm" sx={{ mb: 1, color: 'text.secondary' }}>
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
                  <Typography level="body-sm" sx={{ mb: 1, color: 'text.secondary' }}>
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
                  <Typography level="body-sm" sx={{ mb: 1, color: 'text.secondary' }}>
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
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography level="h4" sx={{ color: 'primary' }}>
                Appointment History ({appointments.length})
              </Typography>
              <IconButton
                variant="outlined"
                onClick={() => setIsAppointmentsCollapsed(!isAppointmentsCollapsed)}
                sx={{ color: '#ffffff' }}
              >
                {isAppointmentsCollapsed ? <ExpandMore /> : <ExpandLess />}
              </IconButton>
            </Box>

            {!isAppointmentsCollapsed && (
              <Box sx={{ transition: 'all 0.3s ease-in-out' }}>
                {appointments.length > 0 ? (
                  <Card>
                    <Box sx={{ overflow: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                            <th style={{ padding: '12px', textAlign: 'left', color: '#ffffff', fontWeight: 'bold' }}>
                              Date
                            </th>
                            <th style={{ padding: '12px', textAlign: 'left', color: '#ffffff', fontWeight: 'bold' }}>
                              Vital Signs
                            </th>
                            <th style={{ padding: '12px', textAlign: 'left', color: '#ffffff', fontWeight: 'bold' }}>
                              Treatments
                            </th>
                            <th style={{ padding: '12px', textAlign: 'right', color: '#ffffff', fontWeight: 'bold' }}>
                              Total Price
                            </th>
                            <th style={{ padding: '12px', textAlign: 'center', color: '#ffffff', fontWeight: 'bold' }}>
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {appointments
                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                            .map((appointment) => (
                              <tr
                                key={appointment.id}
                                style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)' } }}
                              >
                                <td style={{ padding: '12px' }}>
                                  <Typography level="body-sm" sx={{ color: '#ffffff' }}>
                                    {formatAppointmentDate(appointment.date)}
                                  </Typography>
                                </td>
                                <td style={{ padding: '12px' }}>
                                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                    <Typography level="body-xs" sx={{ color: '#ffffff' }}>
                                      BP: {appointment.vitalSigns.bloodPressure}
                                    </Typography>
                                    <Typography level="body-xs" sx={{ color: '#ffffff' }}>
                                      HR: {appointment.vitalSigns.heartRate} bpm
                                    </Typography>
                                    <Typography level="body-xs" sx={{ color: '#ffffff' }}>
                                      RR: {appointment.vitalSigns.respirationRate} /min
                                    </Typography>
                                    <Typography level="body-xs" sx={{ color: '#ffffff' }}>
                                      Borg: {appointment.vitalSigns.borgScale}/10
                                    </Typography>
                                  </Box>
                                </td>
                                <td style={{ padding: '12px' }}>
                                  <Typography level="body-sm" sx={{ color: '#ffffff' }}>
                                    {appointment.treatments.length} treatment{appointment.treatments.length !== 1 ? 's' : ''}
                                  </Typography>
                                </td>
                                <td style={{ padding: '12px', textAlign: 'right' }}>
                                  <Chip color="success" variant="soft" size="sm">
                                    {formatCurrency(appointment.totalPrice)}
                                  </Chip>
                                </td>
                                <td style={{ padding: '12px', textAlign: 'center' }}>
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
                ) : (
                  <Box sx={{
                    p: 4,
                    textAlign: 'center',
                    backgroundColor: 'background.level1',
                    borderRadius: 'sm',
                    border: '1px dashed',
                    borderColor: 'divider'
                  }}>
                    <Typography level="h6" sx={{ mb: 1, color: 'text.secondary' }}>
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