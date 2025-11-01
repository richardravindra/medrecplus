import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/joy/Box';
import Card from '@mui/joy/Card';
import Typography from '@mui/joy/Typography';
import FormLabel from '@mui/joy/FormLabel';
import FormControl from '@mui/joy/FormControl';
import Input from '@mui/joy/Input';
import Button from '@mui/joy/Button';
import Alert from '@mui/joy/Alert';
import Stack from '@mui/joy/Stack';
import Select from '@mui/joy/Select';
import Option from '@mui/joy/Option';
import ArrowBack from '@mui/icons-material/ArrowBack';
import Save from '@mui/icons-material/Save';
import Info from '@mui/icons-material/Info';
import Search from '@mui/icons-material/Search';
import Refresh from '@mui/icons-material/Refresh';
import { Patient } from '../types';
import logService from '../services/logService';

interface Treatment {
  id: number;
  name: string;
  price: number;
}

interface CustomExamination {
  id: number;
  name: string;
  unit: string;
}

interface Operator {
  id: number;
  name: string;
  role: string;
}

interface VitalSigns {
  bloodPressure: string;
  respirationRate: string;
  heartRate: string;
  borgScale: string;
  [key: string]: string | number; // Allow dynamic properties for custom examinations
}

interface AppointmentData {
  patientId: string;
  operatorId: string;
  vitalSigns: VitalSigns;
  selectedTreatment: number | null;
}

const NewAppointment: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [customExaminations, setCustomExaminations] = useState<CustomExamination[]>([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [totalPrice, setTotalPrice] = useState(0);
  const [preSelectedPatientId, setPreSelectedPatientId] = useState<number | null>(null);

  const [formData, setFormData] = useState<AppointmentData>({
    patientId: '',
    operatorId: '',
    vitalSigns: {
      bloodPressure: '',
      respirationRate: '',
      heartRate: '',
      borgScale: ''
    },
    selectedTreatment: null
  });

  const calculateTotalPrice = useCallback(() => {
    if (formData.selectedTreatment === null) {
      setTotalPrice(0);
      return;
    }

    const treatment = treatments.find(t => t.id === formData.selectedTreatment);
    const total = treatment?.price || 0;
    setTotalPrice(total);
  }, [formData.selectedTreatment, treatments]);

  // Initialize custom examinations in vital signs when they are loaded
  useEffect(() => {
    if (customExaminations.length > 0) {
      setFormData(prev => {
        const updatedVitalSigns = { ...prev.vitalSigns };
        customExaminations.forEach(exam => {
          if (!(exam.id in updatedVitalSigns)) {
            updatedVitalSigns[`custom_${exam.id}`] = '';
          }
        });
        return {
          ...prev,
          vitalSigns: updatedVitalSigns
        };
      });
    }
  }, [customExaminations]);

  useEffect(() => {
    loadData();
    checkForPreSelectedPatient();
  }, []);

  useEffect(() => {
    calculateTotalPrice();
  }, [calculateTotalPrice]);

  const loadData = async () => {
    try {
      // Debug localStorage contents
      console.log('=== LOCAL STORAGE DEBUG ===');
      console.log('localStorage keys:', Object.keys(localStorage));

      // Check patients specifically - patients are stored under 'patient_management_data'
      const patientsRaw = localStorage.getItem('patient_management_data');
      console.log('Raw patients data from localStorage (key: patient_management_data):', patientsRaw);

      const storedPatients: Patient[] = JSON.parse(patientsRaw || '[]');
      console.log('Parsed patients:', storedPatients);
      console.log('Number of patients loaded:', storedPatients.length);
      setPatients(storedPatients);

      // Load operators
      const operatorsRaw = localStorage.getItem('operators');
      console.log('Raw operators data:', operatorsRaw);
      const storedOperators: Operator[] = JSON.parse(operatorsRaw || '[]');
      console.log('Loaded operators:', storedOperators);
      setOperators(storedOperators);

      // Load treatments
      const treatmentsRaw = localStorage.getItem('treatments');
      console.log('Raw treatments data:', treatmentsRaw);
      const storedTreatments: Treatment[] = JSON.parse(treatmentsRaw || '[]');
      console.log('Loaded treatments:', storedTreatments);
      setTreatments(storedTreatments);

      // Load custom examinations
      const customExaminationsRaw = localStorage.getItem('custom_examinations');
      console.log('Raw custom examinations data:', customExaminationsRaw);
      const storedCustomExaminations: CustomExamination[] = JSON.parse(customExaminationsRaw || '[]');
      console.log('Loaded custom examinations:', storedCustomExaminations);
      setCustomExaminations(storedCustomExaminations);

      console.log('=== END LOCAL STORAGE DEBUG ===');
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  // Add manual reload function
  const reloadData = () => {
    console.log('Manual reload triggered');
    loadData();
  };

  const checkForPreSelectedPatient = () => {
    try {
      const preSelectedPatient = localStorage.getItem('selectedPatientForAppointment');
      if (preSelectedPatient) {
        const patientData = JSON.parse(preSelectedPatient);
        console.log('Found pre-selected patient:', patientData);
        setPreSelectedPatientId(patientData.id);

        // Clear the stored selection
        localStorage.removeItem('selectedPatientForAppointment');
      }
    } catch (error) {
      console.error('Error checking for pre-selected patient:', error);
    }
  };

  // Effect to handle pre-selected patient after patients are loaded
  useEffect(() => {
    if (patients.length > 0 && preSelectedPatientId !== null) {
      console.log('Patients loaded, looking for pre-selected patient ID:', preSelectedPatientId);

      const patient = patients.find(p => p.id === preSelectedPatientId);
      if (patient) {
        console.log('Found and auto-selecting patient:', patient.name);
        handlePatientSelect(patient);
        setPreSelectedPatientId(null); // Clear the pre-selected ID after using it
      } else {
        console.log('Pre-selected patient not found in loaded patients');
        setPreSelectedPatientId(null); // Clear even if not found
      }
    }
  }, [patients, preSelectedPatientId]); // Trigger when patients or preSelectedId changes

  const handleInputChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    console.log('Input changed:', { name, value, field });

    if (name.startsWith('vitalSigns.')) {
      const vitalField = name.split('.')[1];
      console.log('Updating vital sign:', vitalField, 'to:', value);
      setFormData(prev => ({
        ...prev,
        vitalSigns: {
          ...prev.vitalSigns,
          [vitalField]: value
        }
      }));
    } else if (name.startsWith('custom_')) {
      // Handle custom examination inputs
      console.log('Updating custom examination:', name, 'to:', value);
      setFormData(prev => ({
        ...prev,
        vitalSigns: {
          ...prev.vitalSigns,
          [name]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handlePatientSearch = (value: string) => {
    console.log('Patient search:', value);
    console.log('Available patients:', patients);
    setPatientSearch(value);
  };

  const handleInputFocus = () => {
    console.log('Input focused');
    setShowPatientDropdown(true);
  };

  const handleInputBlur = () => {
    // Delay hiding dropdown to allow click on patient items
    setTimeout(() => {
      setShowPatientDropdown(false);
    }, 200);
  };

  const handlePatientSelect = (patient: Patient) => {
    console.log('Patient selected:', patient.name, 'ID:', patient.id);
    if (!patient.id) {
      console.error('Patient has no ID:', patient);
      return;
    }
    setSelectedPatient(patient);
    setFormData(prev => ({ ...prev, patientId: patient.id!.toString() }));
    setPatientSearch(patient.name);
        setShowPatientDropdown(false);
  };

  const handleOperatorChange = (value: string | null) => {
    setFormData(prev => ({ ...prev, operatorId: value || '' }));
  };

  const handleTreatmentChange = (value: string | null) => {
    setFormData(prev => ({
      ...prev,
      selectedTreatment: value ? parseInt(value) : null
    }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const filteredPatients = patients.filter(patient => {
    if (!patient.id) return false; // Filter out patients without an ID
    const patientName = patient.name.toLowerCase();
    const searchTerm = patientSearch.toLowerCase();
    const matches = patientName.includes(searchTerm);
    console.log('Filtering patient:', patient.name, 'ID:', patient.id, 'searching for:', patientSearch, 'matches:', matches);
    console.log(' - Patient name (lower):', patientName);
    console.log(' - Search term (lower):', searchTerm);
    return matches;
  });
  console.log('Filtered patients count:', filteredPatients.length);
  console.log('All patients:', patients.map(p => ({ name: p.name, id: p.id })));

  const validateForm = () => {
    if (!selectedPatient) {
      setError('Please select a patient');
      return false;
    }

    if (!formData.operatorId) {
      setError('Please select an operator');
      return false;
    }

    // Validate vital signs if provided (now optional)
    if (formData.vitalSigns.bloodPressure.trim()) {
      // Blood pressure is valid if it's not empty
    }

    if (formData.vitalSigns.respirationRate) {
      const rr = parseInt(formData.vitalSigns.respirationRate);
      if (isNaN(rr) || rr <= 0) {
        setError('Please enter a valid respiration rate');
        return false;
      }
    }

    if (formData.vitalSigns.heartRate) {
      const hr = parseInt(formData.vitalSigns.heartRate);
      if (isNaN(hr) || hr <= 0) {
        setError('Please enter a valid heart rate');
        return false;
      }
    }

    if (formData.vitalSigns.borgScale) {
      const borgScale = parseInt(formData.vitalSigns.borgScale);
      if (isNaN(borgScale) || borgScale < 1 || borgScale > 10) {
        setError('Borg scale must be between 1 and 10');
        return false;
      }
    }

    if (!formData.selectedTreatment) {
      setError('Please select a treatment');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const existingAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');

      const selectedTreatmentData = treatments.find(t => t.id === formData.selectedTreatment);
      const selectedOperator = operators.find(op => op.id === parseInt(formData.operatorId));

      const newAppointmentId = Date.now();
      const newAppointment = {
        id: newAppointmentId,
        patientName: selectedPatient?.name || '',
        patientId: selectedPatient?.id || 0,
        operatorName: selectedOperator?.name || '',
        operatorId: selectedOperator?.id || 0,
        date: new Date().toISOString().split('T')[0], // Use current date
        vitalSigns: {
          bloodPressure: formData.vitalSigns.bloodPressure.trim() || 'Not recorded',
          respirationRate: formData.vitalSigns.respirationRate ? parseInt(formData.vitalSigns.respirationRate) : 0,
          heartRate: formData.vitalSigns.heartRate ? parseInt(formData.vitalSigns.heartRate) : 0,
          borgScale: formData.vitalSigns.borgScale ? parseInt(formData.vitalSigns.borgScale) : 0,
          // Include custom examinations
          ...Object.fromEntries(
            customExaminations.map(exam => [
              `custom_${exam.id}`,
              {
                name: exam.name,
                unit: exam.unit,
                value: (formData.vitalSigns[`custom_${exam.id}`] as string)?.trim() || 'Not recorded'
              }
            ])
          )
        },
        treatments: selectedTreatmentData ? [selectedTreatmentData] : [],
        totalPrice: totalPrice,
        created_at: new Date().toISOString()
      };

      const updatedAppointments = [...existingAppointments, newAppointment];
      localStorage.setItem('appointments', JSON.stringify(updatedAppointments));

      // Log appointment creation
      logService.logAppointmentCreated(newAppointmentId, newAppointment.patientId, newAppointment.patientName);

      navigate(`/appointments/${newAppointmentId}`);
    } catch (error) {
      setError('Failed to create appointment. Please try again.');
      console.error('Error creating appointment:', error);
    } finally {
      setLoading(false);
    }
  };

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
          onClick={() => navigate('/appointments')}
          sx={{ borderRadius: 'sm' }}
        >
          Back to Appointments
        </Button>
        <Typography level="h3">New Appointment</Typography>
      </Box>

      {error && (
        <Alert color="danger" sx={{ mb: 3 }} startDecorator={<Info />}>
          {error}
        </Alert>
      )}

      <Card>
        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            {/* Patient Selection */}
            <FormControl>
              <FormLabel>Patient *</FormLabel>
              <Box sx={{ position: 'relative', width: '100%' }}>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1, mb: 1 }}>
                  <Input
                    value={patientSearch}
                    onChange={(e) => handlePatientSearch(e.target.value)}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    placeholder="Search and select a patient..."
                    startDecorator={<Search sx={{ color: '#ffffff' }} />}
                    required
                    sx={{
                      width: { xs: '100%', md: '800px' },
                      maxWidth: '100%',
                      color: '#ffffff',
                      '& input::placeholder': {
                        color: '#ffffff !important',
                        opacity: 0.7
                      },
                      '& input': {
                        color: '#ffffff !important'
                      }
                    }}
                  />
                  <Button
                    variant="outlined"
                    size="sm"
                    startDecorator={<Refresh />}
                    onClick={reloadData}
                    title="Reload patient data"
                    sx={{ width: { xs: '100%', sm: 'auto' } }}
                  >
                    Reload
                  </Button>
                </Box>
                {showPatientDropdown && (
                  <Box sx={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    backgroundColor: '#020618',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 'sm',
                    maxHeight: 200,
                    overflow: 'auto',
                    zIndex: 1000,
                    mt: 0.5
                  }}>
                    {filteredPatients.length === 0 ? (
                      <Box sx={{ p: 2, textAlign: 'center' }}>
                        <Typography level="body-sm" sx={{ color: '#ffffff' }}>
                          No patients found
                        </Typography>
                      </Box>
                    ) : (
                      filteredPatients.map((patient) => (
                        <Box
                          key={patient.id}
                          sx={{
                            p: 2,
                            cursor: 'pointer',
                            '&:hover': { backgroundColor: 'background.level1' },
                            borderBottom: '1px solid',
                            borderColor: 'divider'
                          }}
                          onClick={() => handlePatientSelect(patient)}
                        >
                          <Typography level="body-sm" sx={{ color: '#ffffff' }}>{patient.name}</Typography>
                        </Box>
                      ))
                    )}
                  </Box>
                )}
              </Box>
              {selectedPatient && (
                <Typography level="body-xs" color="success" sx={{ mt: 1 }}>
                  Selected: {selectedPatient.name}
                </Typography>
              )}
            </FormControl>

            {/* Operator Selection */}
            <FormControl>
              <FormLabel>Operator *</FormLabel>
              <Select
                value={formData.operatorId}
                onChange={(_event, value) => handleOperatorChange(value)}
                placeholder="Select an operator"
                required
                sx={{
                  width: { xs: '100%', md: '800px' },
                  maxWidth: '100%',
                  color: '#ffffff',
                  '&::placeholder': {
                    color: '#ffffff !important',
                    opacity: 0.7
                  },
                  '& .MuiSelect-select': {
                    color: '#ffffff !important'
                  }
                }}
              >
                {operators.map((operator) => (
                  <Option key={operator.id} value={operator.id.toString()} sx={{ color: '#ffffff' }}>
                    {operator.name} - {operator.role}
                  </Option>
                ))}
              </Select>
              {operators.length === 0 && (
                <Typography level="body-xs" color="danger" sx={{ mt: 1 }}>
                  No operators available. Please add operators in Settings first.
                </Typography>
              )}
            </FormControl>

            {/* Vital Signs */}
            <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 'sm', px: 3, py: 1 }}>
              <Typography level="h4" sx={{ mb: 2, mt: 0 }}>Vital Signs</Typography>
              <Stack spacing={2}>
                {/* Responsive layout: horizontal for 16:9, vertical for 9:16 */}
                <Box sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', md: 'row' },
                  gap: 3,
                  alignItems: { xs: 'stretch', md: 'flex-start' }
                }}>
                  {/* Left container: Blood Pressure and Respiration Rate */}
                  <Box sx={{
                    width: { xs: '100%', md: '410px' },
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2
                  }}>
                    <FormControl>
                      <FormLabel>Blood Pressure</FormLabel>
                      <Input
                        name="vitalSigns.bloodPressure"
                        value={formData.vitalSigns.bloodPressure}
                        onChange={handleInputChange('bloodPressure')}
                        placeholder="e.g., 120/80 (optional)"
                        sx={{
                          width: '100%',
                          '& input': {
                            color: '#ffffff !important'
                          },
                          '&::placeholder': {
                            color: '#ffffff !important',
                            opacity: 0.7
                          }
                        }}
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel>Respiration Rate (breaths/min)</FormLabel>
                      <Input
                        type="number"
                        name="vitalSigns.respirationRate"
                        value={formData.vitalSigns.respirationRate}
                        onChange={handleInputChange('respirationRate')}
                        placeholder="e.g., 16 (optional)"
                        slotProps={{ input: { min: 0, max: 60 } }}
                        sx={{
                          width: '100%',
                          '& input': {
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

                  {/* Right container: Heart Rate and Borg Scale */}
                  <Box sx={{
                    width: { xs: '100%', md: '410px' },
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2
                  }}>
                    <FormControl>
                      <FormLabel>Heart Rate (bpm)</FormLabel>
                      <Input
                        type="number"
                        name="vitalSigns.heartRate"
                        value={formData.vitalSigns.heartRate}
                        onChange={handleInputChange('heartRate')}
                        placeholder="e.g., 72 (optional)"
                        slotProps={{ input: { min: 0, max: 200 } }}
                        sx={{
                          width: '100%',
                          '& input': {
                            color: '#ffffff !important'
                          },
                          '&::placeholder': {
                            color: '#ffffff !important',
                            opacity: 0.7
                          }
                        }}
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel>Borg Scale (1-10)</FormLabel>
                      <Input
                        type="number"
                        name="vitalSigns.borgScale"
                        value={formData.vitalSigns.borgScale}
                        onChange={handleInputChange('borgScale')}
                        placeholder="Rate perceived exertion (optional)"
                        slotProps={{ input: { min: 1, max: 10 } }}
                        sx={{
                          width: '100%',
                          '& input': {
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
                </Box>

                {/* Borg Scale description */}
                <Typography level="body-xs" sx={{ color: '#ffffff' }}>
                  1: Very light | 4: Somewhat hard | 7: Very hard | 10: Maximal exertion
                </Typography>
              </Stack>
            </Box>

            {/* Custom Examinations Section */}
            {customExaminations.length > 0 && (
              <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 'sm', px: 3, py: 1, my: 0.5 }}>
                <Typography level="h4" sx={{ mb: 2, mt: 0 }}>Examinations & Measurements</Typography>
                <Stack spacing={2}>
                  {customExaminations.map((examination) => (
                    <FormControl key={examination.id}>
                      <FormLabel>{examination.name} ({examination.unit})</FormLabel>
                      <Input
                        name={`custom_${examination.id}`}
                        value={(formData.vitalSigns[`custom_${examination.id}`] as string) || ''}
                        onChange={handleInputChange(`custom_${examination.id}`)}
                        placeholder={`Enter ${examination.name.toLowerCase()} value (optional)`}
                        sx={{
                          width: { xs: '100%', md: '800px' },
                          maxWidth: '100%',
                          '& input': {
                            color: '#ffffff !important'
                          },
                          '&::placeholder': {
                            color: '#ffffff !important',
                            opacity: 0.7
                          }
                        }}
                      />
                    </FormControl>
                  ))}
                </Stack>
              </Box>
            )}

            {/* Treatment Selection */}
            <FormControl>
              <FormLabel>Treatment *</FormLabel>
              <Select
                value={formData.selectedTreatment?.toString() || ''}
                onChange={(_event, value) => handleTreatmentChange(value)}
                placeholder="Select a treatment"
                required
                sx={{
                  width: { xs: '100%', md: '800px' },
                  maxWidth: '100%',
                  color: '#ffffff',
                  '&::placeholder': {
                    color: '#ffffff !important',
                    opacity: 0.7
                  },
                  '& .MuiSelect-select': {
                    color: '#ffffff !important'
                  }
                }}
              >
                {treatments.map((treatment) => (
                  <Option key={treatment.id} value={treatment.id.toString()} sx={{ color: '#ffffff' }}>
                    {treatment.name} - {formatCurrency(treatment.price)}
                  </Option>
                ))}
              </Select>
              {treatments.length === 0 && (
                <Typography level="body-xs" color="danger" sx={{ mt: 1 }}>
                  You don't have any Treatments yet. To add Treatments, go to Settings &gt; Treatments &gt; Add Treatment
                </Typography>
              )}
            </FormControl>

            {/* Total Price */}
            <Box sx={{
              p: 3,
              backgroundColor: 'background.level1',
              borderRadius: 'sm',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Typography level="h4">Total Price:</Typography>
              <Typography level="h3" color="success" fontWeight="bold">
                {formatCurrency(totalPrice)}
              </Typography>
            </Box>

            {/* Action Buttons */}
            <Box sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2,
              justifyContent: 'flex-end',
              pt: 2
            }}>
              <Button
                variant="outlined"
                color="neutral"
                onClick={() => navigate('/appointments')}
                disabled={loading}
                sx={{ width: { xs: '100%', sm: 'auto' } }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={loading}
                startDecorator={<Save />}
                disabled={loading}
                sx={{ width: { xs: '100%', sm: 'auto' } }}
              >
                Create Appointment
              </Button>
            </Box>
          </Stack>
        </form>
      </Card>
    </Box>
  );
};

export default NewAppointment;