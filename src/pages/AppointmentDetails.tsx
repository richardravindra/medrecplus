import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/joy/Box';
import Card from '@mui/joy/Card';
import Typography from '@mui/joy/Typography';
import Button from '@mui/joy/Button';
import Chip from '@mui/joy/Chip';
import Stack from '@mui/joy/Stack';
import CircularProgress from '@mui/joy/CircularProgress';
import ArrowBack from '@mui/icons-material/ArrowBack';
import People from '@mui/icons-material/People';
import MedicalServices from '@mui/icons-material/MedicalServices';
import MonitorHeart from '@mui/icons-material/MonitorHeart';
import Receipt from '@mui/icons-material/Receipt';
import Person from '@mui/icons-material/Person';
import EditNote from '@mui/icons-material/EditNote';
import Close from '@mui/icons-material/Close';
import Save from '@mui/icons-material/Save';
import Delete from '@mui/icons-material/Delete';
import Warning from '@mui/icons-material/Warning';
import Science from '@mui/icons-material/Science';
import Modal from '@mui/joy/Modal';
import ModalDialog from '@mui/joy/ModalDialog';
import Textarea from '@mui/joy/Textarea';
import FormLabel from '@mui/joy/FormLabel';
import DialogContent from '@mui/joy/DialogContent';
import FormControl from '@mui/joy/FormControl';
import { Appointment, Treatment } from '../types';
import { dataService } from '../services/SimpleMedRecDataService';
import { storage } from '../services/UnifiedStorage';
import { log } from '../utils/logger';
import { formatCurrencyWhole } from '../utils/currencyUtils';

interface AppointmentTreatment {
  id: number;
  name: string;
  price: number;
  notes?: string;
}

const AppointmentDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [_error, setError] = useState<string | null>(null);
  const [hasInvoice, setHasInvoice] = useState(false);
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [selectedTreatmentId, setSelectedTreatmentId] = useState<number | null>(null);
  const [treatmentNotes, setTreatmentNotes] = useState('');
  const [editedTreatments, setEditedTreatments] = useState<AppointmentTreatment[]>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const checkIfInvoiceExists = useCallback(async (appointmentId: number) => {
    try {
      const invoices = await storage.getInvoices();
      const existingInvoice = invoices.find(inv => inv.appointmentId === appointmentId);
      setHasInvoice(!!existingInvoice);
      return existingInvoice;
    } catch (_error) {
      log.error('Error checking invoice existence', { _error, appointmentId }, 'AppointmentDetails');
      setHasInvoice(false);
      return null;
    }
  }, []);

  const loadAppointment = useCallback(async (appointmentId: number) => {
    try {
      const foundAppointment = await dataService.getAppointmentById(appointmentId);

      if (foundAppointment) {
        // Ensure the appointment has a created_at field
        const appointmentWithDate = {
          ...foundAppointment,
          created_at:
            foundAppointment.created_at || foundAppointment.date || new Date().toISOString()
        };
        setAppointment(appointmentWithDate);
        setEditedTreatments(appointmentWithDate.treatments);
        await checkIfInvoiceExists(appointmentWithDate.id);
      } else {
        setError('Appointment not found');
        log.warn('Appointment not found', { id: appointmentId }, 'AppointmentDetails');
      }
    } catch {
      setError('Failed to load appointment');
      log.error('Error loading appointment', { _error, appointmentId }, 'AppointmentDetails');
    } finally {
      setLoading(false);
    }
  }, [checkIfInvoiceExists, _error]);

  useEffect(() => {
    if (id) {
      const appointmentId = parseInt(id, 10);

      if (!isNaN(appointmentId)) {
        loadAppointment(appointmentId);
      } else {
        setError('Invalid appointment ID. The ID must be a number.');
        setLoading(false);
      }
    } else {
      setError('No appointment ID provided');
      setLoading(false);
    }
  }, [id, loadAppointment]);

  const formatDate = (dateString: string) => {
    if (!dateString) {
      return 'Date not available';
    }

    try {
      const date = new Date(dateString);
      // Check if the date is invalid
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }

      // Format: "Friday, 7 November 2025 23:21"
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      };

      return date.toLocaleDateString('en-GB', options);
    } catch {
      return 'Invalid date';
    }
  };

  // Extract custom examinations from vital signs
  const getCustomExaminations = () => {
    if (!appointment?.vitalSigns) return [];

    const customExams: Array<{ name: string; value: string; unit: string }> = [];
    Object.entries(appointment.vitalSigns).forEach(([key, value]) => {
      if (key.startsWith('custom_') && value) {
        const examData = value as { name: string; value: string; unit?: string };
        if (typeof examData === 'object' && examData.name && examData.value) {
          customExams.push({
            name: examData.name,
            value: examData.value,
            unit: examData.unit || ''
          });
        }
      }
    });

    return customExams;
  };

  const getBorgScaleColor = (scale: number) => {
    if (scale === 0) return 'neutral'; // Not recorded
    if (scale <= 3) return 'success';
    if (scale <= 6) return 'warning';
    return 'danger';
  };

  const getBorgScaleText = (scale: number) => {
    if (scale === 0) return 'Not recorded';
    if (scale <= 3) return 'Light exertion';
    if (scale <= 6) return 'Moderate exertion';
    return 'High exertion';
  };

  const generateInvoiceNumber = async () => {
    try {
      const invoices = await storage.getInvoices();
      const invoiceCount = invoices.length + 1;
      const date = new Date();
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      return `INV-${year}${month}-${invoiceCount.toString().padStart(4, '0')}`;
    } catch (_error) {
      log.error('Error generating invoice number', { error: _error }, 'AppointmentDetails');
      // Fallback to simple timestamp if error occurs
      const date = new Date();
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      return `INV-${year}${month}-${Date.now().toString().slice(-4)}`;
    }
  };

  const generateInvoice = async () => {
    if (!appointment) return;

    const existingInvoice = await checkIfInvoiceExists(appointment.id);
    if (existingInvoice) {
      navigate(`/invoices/${existingInvoice.id}`);
      return;
    }

    const newInvoice = {
      invoiceNumber: await generateInvoiceNumber(),
      appointmentId: appointment.id,
      patientName: appointment.patientName,
      patientId: appointment.patientId,
      operatorName: appointment.operatorName,
      operatorId: appointment.operatorId,
      date: new Date().toISOString(),
      appointmentDate: appointment.date,
      vitalSigns: appointment.vitalSigns,
      treatments: editedTreatments as Treatment[],
      totalAmount: appointment.totalPrice,
      status: 'unpaid' as const,
      created_at: new Date().toISOString()
    };

    try {
      // Save invoice using unified storage
      const invoices = await storage.getInvoices();
      const maxInvoiceId = invoices.length > 0 ? Math.max(...invoices.map(i => i.id || 0)) : 0;
      const savedInvoice = {
        ...newInvoice,
        id: maxInvoiceId + 1
      };
      invoices.push(savedInvoice);
      await storage.storeInvoices(invoices);
      log.info(
        'Invoice created successfully',
        {
          id: savedInvoice.id,
          appointmentId: appointment.id,
          patientId: appointment.patientId,
          patientName: appointment.patientName,
          operatorName: appointment.operatorName
        },
        'AppointmentDetails'
      );

      setHasInvoice(true);
      navigate(`/invoices/${savedInvoice.id}`);
    } catch {
      log.error(
        'Error generating invoice',
        { _error, appointmentId: appointment.id },
        'AppointmentDetails'
      );
      setError('Failed to generate invoice. Please try again.');
      return;
    }
  };

  const viewPatient = () => {
    if (!appointment) return;
    navigate(`/patients/${appointment.patientId}`);
  };

  const openNotesModal = (treatmentId: number, currentNotes?: string) => {
    setSelectedTreatmentId(treatmentId);
    setTreatmentNotes(currentNotes || '');
    setNotesModalOpen(true);
  };

  const closeNotesModal = () => {
    setNotesModalOpen(false);
    setSelectedTreatmentId(null);
    setTreatmentNotes('');
  };

  const openDeleteModal = () => {
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
  };

  const deleteAppointment = async () => {
    if (!appointment) return;

    setDeleting(true);
    try {
      // Log the deletion before removing
      log.info(
        'Appointment deleted',
        {
          id: appointment.id,
          patientId: appointment.patientId,
          patientName: appointment.patientName
        },
        'AppointmentDetails'
      );

      // Remove appointment using unified storage
      const appointments = await storage.getAppointments();
      const updatedAppointments = appointments.filter(apt => apt.id !== appointment.id);
      await storage.storeAppointments(updatedAppointments);
      const success = true;

      if (success) {
        // Remove associated invoice if it exists
        const invoices = await storage.getInvoices();
        const associatedInvoices = invoices.filter(inv => inv.appointmentId === appointment.id);

        for (const invoice of associatedInvoices) {
          await storage.deleteInvoice(invoice.id);
        }

        navigate('/appointments');
      } else {
        setError('Appointment not found or already deleted.');
      }
    } catch {
      log.error(
        'Error deleting appointment',
        { _error, appointmentId: appointment.id },
        'AppointmentDetails'
      );
      setError('Failed to delete appointment. Please try again.');
    } finally {
      setDeleting(false);
      closeDeleteModal();
    }
  };

  const saveTreatmentNotes = async () => {
    if (!appointment || selectedTreatmentId === null) return;

    const updatedTreatments = editedTreatments.map(treatment =>
      treatment.id === selectedTreatmentId ? { ...treatment, notes: treatmentNotes } : treatment
    );

    setEditedTreatments(updatedTreatments);

    // Update appointment using unified storage
    try {
      const appointments = await storage.getAppointments();
      const appointmentIndex = appointments.findIndex(apt => apt.id === appointment.id);
      if (appointmentIndex === -1) {
        throw new Error('Appointment not found');
      }

      const updatedAppointment = {
        ...appointments[appointmentIndex],
        treatments: updatedTreatments as Treatment[]
      };

      appointments[appointmentIndex] = updatedAppointment;
      await storage.storeAppointments(appointments);

      if (updatedAppointment) {
        // Update local appointment state
        setAppointment(updatedAppointment);
        setEditedTreatments(updatedAppointment.treatments);

        log.info(
          'Appointment updated (treatment notes)',
          {
            id: appointment.id,
            patientId: appointment.patientId,
            patientName: appointment.patientName
          },
          'AppointmentDetails'
        );
      }
    } catch {
      log.error(
        'Error saving treatment notes',
        { _error, appointmentId: appointment.id },
        'AppointmentDetails'
      );
    }

    closeNotesModal();
  };

  if (loading) {
    return (
      <Box
        sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}
      >
        <Stack alignItems='center' spacing={2}>
          <CircularProgress />
          <Typography level='body-lg' sx={{ color: '#ffffff' }}>
            Loading appointment details...
          </Typography>
        </Stack>
      </Box>
    );
  }

  if (_error || !appointment) {
    return (
      <Box sx={{ p: 2 }}>
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            variant='outlined'
            startDecorator={<ArrowBack />}
            onClick={() => navigate('/appointments')}
            sx={{ borderRadius: 'sm' }}
          >
            Back to Appointments
          </Button>
        </Box>
        <Card>
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography level='h4' color='danger' sx={{ mb: 2 }}>
              {_error || 'Appointment not found'}
            </Typography>
            <Typography level='body-sm' sx={{ mb: 3, color: '#ffffff' }}>
              The appointment you're looking for doesn't exist or has been removed.
            </Typography>
            <Button variant='solid' onClick={() => navigate('/appointments')}>
              Back to Appointments
            </Button>
          </Box>
        </Card>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        p: 2,
        boxSizing: 'border-box',
        minWidth: 0
      }}
    >
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button
          variant='outlined'
          startDecorator={<ArrowBack />}
          onClick={() => navigate('/appointments')}
          sx={{ borderRadius: 'sm' }}
        >
          Back to Appointments
        </Button>
        <Typography level='h2'>Appointment Details</Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Button
          variant='solid'
          color='primary'
          startDecorator={<Receipt />}
          onClick={generateInvoice}
          sx={{ borderRadius: 'sm' }}
        >
          {hasInvoice ? 'View Invoice' : 'Generate Invoice'}
        </Button>
      </Box>

      <Stack spacing={3} alignItems='flex-start'>
        {/* Patient & Operator Info */}
        <Card sx={{ maxWidth: '800px', width: '100%' }}>
          <Box
            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}
          >
            <Typography
              level='h4'
              sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 1 }}
            >
              <People sx={{ color: '#ffffff' }} />
              Basic Information
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant='solid'
                color='neutral'
                startDecorator={<Person />}
                onClick={viewPatient}
                sx={{ borderRadius: 'sm' }}
              >
                View Patient
              </Button>
              <Button
                variant='solid'
                color='danger'
                startDecorator={<Delete />}
                onClick={openDeleteModal}
                sx={{ borderRadius: 'sm' }}
              >
                Delete Appointment
              </Button>
            </Box>
          </Box>
          <Stack spacing={2}>
            <Box
              sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: 2 }}
            >
              <Typography level='body-sm' sx={{ color: '#ffffff' }}>
                Patient:
              </Typography>
              <Typography level='body-sm' fontWeight='bold'>
                {appointment.patientName}
              </Typography>
            </Box>
            <Box
              sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: 2 }}
            >
              <Typography level='body-sm' sx={{ color: '#ffffff' }}>
                Operator:
              </Typography>
              <Typography level='body-sm' fontWeight='bold'>
                {appointment.operatorName}
              </Typography>
            </Box>
            <Box
              sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: 2 }}
            >
              <Typography level='body-sm' sx={{ color: '#ffffff' }}>
                Appointment date:
              </Typography>
              <Typography level='body-sm' fontWeight='bold'>
                {formatDate(appointment.date)}
              </Typography>
            </Box>
          </Stack>
        </Card>

        {/* Vital Signs */}
        <Card sx={{ maxWidth: '800px', width: '100%' }}>
          <Typography
            level='h4'
            sx={{
              mb: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              gap: 1
            }}
          >
            <MonitorHeart sx={{ color: '#ffffff' }} />
            Vital Signs
          </Typography>
          <Stack spacing={2}>
            <Box
              sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: 2 }}
            >
              <Typography level='body-sm' sx={{ color: '#ffffff' }}>
                Blood Pressure:
              </Typography>
              <Typography level='body-sm' fontWeight='bold'>
                {appointment.vitalSigns.bloodPressure === 'Not recorded'
                  ? 'Not recorded'
                  : appointment.vitalSigns.bloodPressure}
              </Typography>
            </Box>
            <Box
              sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: 2 }}
            >
              <Typography level='body-sm' sx={{ color: '#ffffff' }}>
                Respiration Rate:
              </Typography>
              <Typography level='body-sm' fontWeight='bold'>
                {appointment.vitalSigns.respirationRate > 0
                  ? `${appointment.vitalSigns.respirationRate} breaths/min`
                  : 'Not recorded'}
              </Typography>
            </Box>
            <Box
              sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: 2 }}
            >
              <Typography level='body-sm' sx={{ color: '#ffffff' }}>
                Heart Rate:
              </Typography>
              <Typography level='body-sm' fontWeight='bold'>
                {appointment.vitalSigns.heartRate > 0
                  ? `${appointment.vitalSigns.heartRate} bpm`
                  : 'Not recorded'}
              </Typography>
            </Box>
            <Box
              sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: 2 }}
            >
              <Typography level='body-sm' sx={{ color: '#ffffff' }}>
                Borg Scale:
              </Typography>
              <Chip
                size='sm'
                color={getBorgScaleColor(appointment.vitalSigns.borgScale)}
                variant='soft'
              >
                {appointment.vitalSigns.borgScale > 0
                  ? `${appointment.vitalSigns.borgScale}/10 - ${getBorgScaleText(appointment.vitalSigns.borgScale)}`
                  : 'Not recorded'}
              </Chip>
            </Box>
          </Stack>
        </Card>

        {/* Additional Examinations */}
        {getCustomExaminations().length > 0 && (
          <Card sx={{ maxWidth: '800px', width: '100%' }}>
            <Typography
              level='h4'
              sx={{
                mb: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: 1
              }}
            >
              <Science sx={{ color: '#ffffff' }} />
              Additional Examinations
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: 2
              }}
            >
              {getCustomExaminations().map((exam, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: 2,
                    backgroundColor: 'background.level1',
                    borderRadius: 'sm',
                    border: '1px solid',
                    borderColor: 'divider'
                  }}
                >
                  <Box>
                    <Typography level='body-sm' fontWeight='bold' sx={{ color: '#ffffff' }}>
                      {exam.name}
                    </Typography>
                    <Typography level='body-xs' sx={{ color: '#ffffff', opacity: 0.7 }}>
                      Value: {exam.value}
                    </Typography>
                  </Box>
                  <Typography level='body-sm' sx={{ color: '#ffffff', opacity: 0.8 }}>
                    {exam.unit}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Card>
        )}

        {/* Treatments */}
        <Card sx={{ maxWidth: '800px', width: '100%' }}>
          <Typography
            level='h4'
            sx={{
              mb: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              gap: 1
            }}
          >
            <MedicalServices sx={{ color: '#ffffff' }} />
            Treatments
          </Typography>
          {appointment.treatments.length === 0 ? (
            <Typography level='body-sm' color='neutral' sx={{ textAlign: 'left', py: 2 }}>
              No treatments recorded
            </Typography>
          ) : (
            <Stack spacing={2}>
              {editedTreatments.map((treatment, index) => (
                <Box
                  key={treatment.id}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 2,
                    pb: index < editedTreatments.length - 1 ? 2 : 0,
                    borderBottom: index < editedTreatments.length - 1 ? '1px solid' : 'none',
                    borderColor: 'divider'
                  }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Typography level='body-sm'>{treatment.name}</Typography>
                    {treatment.notes && (
                      <Typography level='body-xs' sx={{ color: '#ffffff', opacity: 0.8, mt: 0.5 }}>
                        Notes: {treatment.notes}
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography level='body-sm' color='success' fontWeight='bold'>
                      {formatCurrencyWhole(treatment.price)}
                    </Typography>
                    <Button
                      variant='outlined'
                      size='sm'
                      startDecorator={<EditNote />}
                      onClick={() => openNotesModal(treatment.id, treatment.notes)}
                      sx={{ borderRadius: 'sm' }}
                    >
                      Notes
                    </Button>
                  </Box>
                </Box>
              ))}
            </Stack>
          )}
        </Card>

        {/* Total Price */}
        <Card sx={{ backgroundColor: 'background.level1', maxWidth: '800px', width: '100%' }}>
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}
          >
            <Typography level='h4'>Total Price:</Typography>
            <Typography level='h3' color='success' fontWeight='bold'>
              {formatCurrencyWhole(appointment.totalPrice)}
            </Typography>
          </Box>
        </Card>

        {/* Appointment Info */}
        <Card sx={{ maxWidth: '800px', width: '100%' }}>
          <Typography level='body-xs' sx={{ textAlign: 'left', color: '#ffffff' }}>
            Created on {formatDate(appointment.created_at || appointment.date)}
          </Typography>
        </Card>
      </Stack>

      {/* Delete Confirmation Modal */}
      <Modal open={deleteModalOpen} onClose={closeDeleteModal}>
        <ModalDialog
          aria-labelledby='delete-modal-title'
          sx={{
            maxWidth: 400,
            borderRadius: 'sm',
            p: 0,
            overflow: 'hidden'
          }}
        >
          <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', p: 3, pb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Warning sx={{ color: 'danger' }} />
              <Typography id='delete-modal-title' level='h4'>
                Delete Appointment
              </Typography>
            </Box>
          </Box>
          <Box sx={{ p: 3 }}>
            <DialogContent>
              <Typography level='body-sm' sx={{ mb: 2 }}>
                Are you sure you want to delete this appointment? This action cannot be undone.
              </Typography>
              <Typography level='body-sm' sx={{ color: '#ffffff', opacity: 0.8 }}>
                <strong>Patient:</strong> {appointment?.patientName}
                <br />
                <strong>Date:</strong> {appointment ? formatDate(appointment.date) : ''}
                <br />
                <strong>Total:</strong>{' '}
                {appointment ? formatCurrencyWhole(appointment.totalPrice) : ''}
              </Typography>
              {hasInvoice && (
                <Typography level='body-xs' color='danger' sx={{ mt: 1 }}>
                  Note: The associated invoice will also be deleted.
                </Typography>
              )}
            </DialogContent>
          </Box>
          <Box sx={{ borderTop: '1px solid', borderColor: 'divider', p: 3, pt: 2 }}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant='outlined'
                color='neutral'
                onClick={closeDeleteModal}
                disabled={deleting}
                sx={{ borderRadius: 'sm' }}
              >
                Cancel
              </Button>
              <Button
                variant='solid'
                color='danger'
                onClick={deleteAppointment}
                loading={deleting}
                startDecorator={<Delete />}
                sx={{ borderRadius: 'sm' }}
              >
                Delete
              </Button>
            </Box>
          </Box>
        </ModalDialog>
      </Modal>

      {/* Treatment Notes Modal */}
      <Modal open={notesModalOpen} onClose={closeNotesModal}>
        <ModalDialog
          aria-labelledby='treatment-notes-modal-title'
          sx={{
            maxWidth: 500,
            borderRadius: 'sm',
            p: 0,
            overflow: 'hidden'
          }}
        >
          <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', p: 3, pb: 2 }}>
            <Typography id='treatment-notes-modal-title' level='h4'>
              Add Treatment Notes
            </Typography>
          </Box>
          <Box sx={{ p: 3 }}>
            <FormControl>
              <FormLabel>Treatment Notes</FormLabel>
              <Textarea
                placeholder='Enter treatment notes...'
                value={treatmentNotes}
                onChange={e => setTreatmentNotes(e.target.value)}
                minRows={4}
                maxRows={8}
                sx={{
                  '& textarea': {
                    color: '#ffffff !important'
                  },
                  '&::placeholder': {
                    color: '#ffffff !important',
                    opacity: 0.7
                  }
                }}
              />
            </FormControl>
          </Box>
          <Box sx={{ borderTop: '1px solid', borderColor: 'divider', p: 3, pt: 2 }}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant='outlined'
                color='neutral'
                onClick={closeNotesModal}
                startDecorator={<Close />}
              >
                Cancel
              </Button>
              <Button
                variant='solid'
                color='primary'
                onClick={saveTreatmentNotes}
                startDecorator={<Save />}
              >
                Save
              </Button>
            </Box>
          </Box>
        </ModalDialog>
      </Modal>
    </Box>
  );
};

export default AppointmentDetails;
