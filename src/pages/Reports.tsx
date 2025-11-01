import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/joy/Box';
import Card from '@mui/joy/Card';
import Typography from '@mui/joy/Typography';
import Button from '@mui/joy/Button';
import Select from '@mui/joy/Select';
import Option from '@mui/joy/Option';
import Stack from '@mui/joy/Stack';
import CircularProgress from '@mui/joy/CircularProgress';
import Chip from '@mui/joy/Chip';
import ArrowBack from '@mui/icons-material/ArrowBack';
import Assessment from '@mui/icons-material/Assessment';
import Person from '@mui/icons-material/Person';
import CalendarToday from '@mui/icons-material/CalendarToday';
import AttachMoney from '@mui/icons-material/AttachMoney';
import Receipt from '@mui/icons-material/Receipt';
import TrendingUp from '@mui/icons-material/TrendingUp';
import Download from '@mui/icons-material/Download';
import Modal from '@mui/joy/Modal';
import ModalDialog from '@mui/joy/ModalDialog';
import ModalClose from '@mui/joy/ModalClose';
import Divider from '@mui/joy/Divider';
import Table from '@mui/joy/Table';
import Input from '@mui/joy/Input';
import Search from '@mui/icons-material/Search';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import * as XLSX from 'xlsx';

interface Appointment {
  id: number;
  patientName: string;
  patientId: number;
  operatorName: string;
  operatorId: number;
  date: string;
  vitalSigns: {
    bloodPressure: string;
    respirationRate: number;
    heartRate: number;
    borgScale: number;
  };
  totalPrice: number;
  created_at: string;
}

interface Invoice {
  id: number;
  invoiceNumber: string;
  appointmentId: number;
  patientName: string;
  patientId: number;
  operatorName: string;
  operatorId: number;
  date: string;
  totalAmount: number;
  status: 'paid' | 'unpaid' | 'void';
  created_at: string;
}

interface Operator {
  id: number;
  name: string;
  role: string;
}

interface Patient {
  id: number;
  name: string;
  record_number: string;
}

interface VitalSignsData {
  date: string;
  bloodPressure: string;
  heartRate: number;
  respirationRate: number;
  borgScale: number;
}

interface ReportData {
  operatorId: number;
  operatorName: string;
  appointmentCount: number;
  invoiceCount: number;
  revenue: number;
}

const Reports: React.FC = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedOperators, setSelectedOperators] = useState<number[]>([]);
  const [reportData, setReportData] = useState<ReportData[]>([]);

  // Patient analysis states
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientSearchTerm, setPatientSearchTerm] = useState<string>('');
  const [vitalSignsData, setVitalSignsData] = useState<VitalSignsData[]>([]);
  const [patientsLoading, setPatientsLoading] = useState(false);

  // Modal states
  const [showInvoicesModal, setShowInvoicesModal] = useState(false);
  const [selectedOperator, setSelectedOperator] = useState<ReportData | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    generateReport();
  }, [selectedMonth, selectedYear, selectedOperators, appointments, invoices]);

  const loadData = () => {
    try {
      // Load appointments
      const storedAppointments = localStorage.getItem('appointments');
      if (storedAppointments) {
        setAppointments(JSON.parse(storedAppointments));
      }

      // Load invoices
      const storedInvoices = localStorage.getItem('invoices');
      if (storedInvoices) {
        setInvoices(JSON.parse(storedInvoices));
      }

      // Load operators
      const storedOperators = localStorage.getItem('operators');
      if (storedOperators) {
        setOperators(JSON.parse(storedOperators));
      }

      // Load patients asynchronously (deferred)
      loadPatientsAsync();
    } catch (error) {
      setError('Failed to load data');
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPatientsAsync = () => {
    // Use setTimeout to defer patient loading and prevent blocking
    setTimeout(() => {
      try {
        const storedPatients = localStorage.getItem('patient_management_data');
        if (storedPatients) {
          const patientData = JSON.parse(storedPatients);
          setPatients(patientData);
        }
      } catch (error) {
        console.error('Error loading patients:', error);
      }
    }, 100);
  };

  const generateReport = () => {
    if (!selectedYear) {
      setReportData([]);
      return;
    }

    // Filter appointments by selected year and month (if selected)
    const filteredAppointments = appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.date);
      const appointmentMonth = (appointmentDate.getMonth() + 1).toString().padStart(2, '0');
      const appointmentYear = appointmentDate.getFullYear().toString();

      const yearMatch = appointmentYear === selectedYear;
      const monthMatch = !selectedMonth || appointmentMonth === selectedMonth;
      const operatorMatch = selectedOperators.length === 0 || selectedOperators.includes(appointment.operatorId);

      return yearMatch && monthMatch && operatorMatch;
    });

    // Filter paid invoices by selected year and month (if selected)
    const filteredInvoices = invoices.filter(invoice => {
      if (invoice.status !== 'paid') return false;

      const invoiceDate = new Date(invoice.date);
      const invoiceMonth = (invoiceDate.getMonth() + 1).toString().padStart(2, '0');
      const invoiceYear = invoiceDate.getFullYear().toString();

      const yearMatch = invoiceYear === selectedYear;
      const monthMatch = !selectedMonth || invoiceMonth === selectedMonth;
      const operatorMatch = selectedOperators.length === 0 || selectedOperators.includes(invoice.operatorId);

      return yearMatch && monthMatch && operatorMatch;
    });

    // Group data by operator
    const operatorMap = new Map<number, { name: string; appointmentCount: number; invoiceCount: number; revenue: number }>();

    // Initialize with all operators (or filtered ones)
    const relevantOperators = selectedOperators.length > 0
      ? operators.filter(op => selectedOperators.includes(op.id))
      : operators;

    relevantOperators.forEach(operator => {
      operatorMap.set(operator.id, {
        name: operator.name,
        appointmentCount: 0,
        invoiceCount: 0,
        revenue: 0
      });
    });

    // Count appointments
    filteredAppointments.forEach(appointment => {
      const current = operatorMap.get(appointment.operatorId);
      if (current) {
        current.appointmentCount++;
      }
    });

    // Count paid invoices and sum revenue
    filteredInvoices.forEach(invoice => {
      const current = operatorMap.get(invoice.operatorId);
      if (current) {
        current.invoiceCount++;
        current.revenue += invoice.totalAmount;
      }
    });

    // Convert to array
    const data: ReportData[] = Array.from(operatorMap.entries()).map(([operatorId, data]) => ({
      operatorId,
      operatorName: data.name,
      appointmentCount: data.appointmentCount,
      invoiceCount: data.invoiceCount,
      revenue: data.revenue
    }));

    // Sort by revenue (highest first)
    data.sort((a, b) => b.revenue - a.revenue);

    setReportData(data);
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
    return `${day}/${month}/${year}`;
  };

  const getOperatorInvoices = (operator: ReportData) => {
    // Filter invoices by selected year and month (if selected) and specific operator
    const operatorInvoices = invoices.filter(invoice => {
      const invoiceDate = new Date(invoice.date);
      const invoiceMonth = (invoiceDate.getMonth() + 1).toString().padStart(2, '0');
      const invoiceYear = invoiceDate.getFullYear().toString();

      const yearMatch = invoiceYear === selectedYear;
      const monthMatch = !selectedMonth || invoiceMonth === selectedMonth;
      const operatorMatch = invoice.operatorId === operator.operatorId;

      return yearMatch && monthMatch && operatorMatch;
    });

    return operatorInvoices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const handleViewInvoices = (operator: ReportData) => {
    setSelectedOperator(operator);
    setShowInvoicesModal(true);
  };

  const handleExportToXLS = (operator: ReportData) => {
    try {
      // Get invoices for this operator
      const operatorInvoices = getOperatorInvoices(operator);

      // Prepare data for export
      const exportData = operatorInvoices.map((invoice, index) => ({
        'No': index + 1,
        'Invoice Number': invoice.invoiceNumber,
        'Date': formatDate(invoice.date),
        'Patient Name': invoice.patientName,
        'Operator': invoice.operatorName,
        'Amount': invoice.totalAmount,
        'Status': invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)
      }));

      // Create workbook
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Invoices');

      // Set column widths
      const colWidths = [
        { wch: 5 },   // No
        { wch: 15 },  // Invoice Number
        { wch: 12 },  // Date
        { wch: 25 },  // Patient Name
        { wch: 20 },  // Operator
        { wch: 15 },  // Amount
        { wch: 10 }   // Status
      ];
      ws['!cols'] = colWidths;

      // Generate filename
      const period = selectedMonth ? `${getMonthOptions().find(m => m.value === selectedMonth)?.label}_${selectedYear}` : selectedYear;
      const filename = `Invoices_${operator.operatorName.replace(/\s+/g, '_')}_${period}.xlsx`;

      // Download file
      XLSX.writeFile(wb, filename);
    } catch (error) {
      console.error('Error exporting to XLS:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  const handleCloseInvoicesModal = () => {
    setShowInvoicesModal(false);
    setSelectedOperator(null);
  };

  const getMonthOptions = () => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    return months.map((month, index) => ({
      value: (index + 1).toString().padStart(2, '0'),
      label: month
    }));
  };

  const getYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];

    for (let year = currentYear; year >= currentYear - 5; year--) {
      years.push({
        value: year.toString(),
        label: year.toString()
      });
    }

    return years;
  };

  const getTotalAppointments = () => {
    return reportData.reduce((sum, item) => sum + item.appointmentCount, 0);
  };

  const getTotalRevenue = () => {
    return reportData.reduce((sum, item) => sum + item.revenue, 0);
  };

  const handlePatientSelect = (patientId: number) => {
    const patient = patients.find(p => p.id === patientId);
    if (patient) {
      setSelectedPatient(patient);
      // Get vital signs data for this patient
      const patientAppointments = appointments.filter(apt => apt.patientId === patientId);

      const vitalData: VitalSignsData[] = patientAppointments
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map(apt => ({
          date: formatDate(apt.date),
          bloodPressure: apt.vitalSigns?.bloodPressure || '',
          heartRate: apt.vitalSigns?.heartRate || 0,
          respirationRate: apt.vitalSigns?.respirationRate || 0,
          borgScale: apt.vitalSigns?.borgScale || 0
        }));

      setVitalSignsData(vitalData);
    }
  };

  const getPatientAppointmentCount = () => {
    if (!selectedPatient) return 0;
    return appointments.filter(apt => apt.patientId === selectedPatient.id).length;
  };

  const filteredPatients = useMemo(() => {
    if (!patientSearchTerm.trim()) {
      // Return empty array if no search term to avoid rendering 1600 items
      return [];
    }

    const filtered = patients.filter(patient =>
      patient.name.toLowerCase().includes(patientSearchTerm.toLowerCase()) ||
      patient.record_number.toLowerCase().includes(patientSearchTerm.toLowerCase())
    );

    // Limit results to prevent UI freezing
    return filtered.slice(0, 50);
  }, [patients, patientSearchTerm]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress />
          <Typography level="body-lg" sx={{ color: '#ffffff' }}>Loading reports...</Typography>
        </Stack>
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
      <Box sx={{ mb: 3 }}>
        <Typography level="h3" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: '1.5rem' }}>
          <Assessment sx={{ color: '#ffffff' }} />
          Reports
        </Typography>
      </Box>

      {error && (
        <Box sx={{ mb: 3 }}>
          <Typography color="danger">{error}</Typography>
        </Box>
      )}

      {/* Filter Controls */}
      <Card sx={{ mb: 3 }}>
        <Box sx={{ p: 2 }}>
          <Typography level="h5" sx={{ mb: 2, fontSize: '1.25rem' }}>Select Report Period</Typography>
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <Box sx={{ minWidth: 200, flex: 1 }}>
                <Typography level="body-sm" sx={{ mb: 1, color: '#ffffff' }}>Month</Typography>
                <Select
                  value={selectedMonth}
                  onChange={(_, value) => setSelectedMonth(value || '')}
                  placeholder="Select Month"
                  sx={{
                    color: '#ffffff',
                    '& .MuiSelect-select': {
                      color: '#ffffff !important'
                    }
                  }}
                >
                  {getMonthOptions().map(month => (
                    <Option key={month.value} value={month.value} sx={{ color: '#ffffff' }}>
                      {month.label}
                    </Option>
                  ))}
                </Select>
              </Box>

              <Box sx={{ minWidth: 150, flex: 1 }}>
                <Typography level="body-sm" sx={{ mb: 1, color: '#ffffff' }}>Year</Typography>
                <Select
                  value={selectedYear}
                  onChange={(_, value) => setSelectedYear(value || '')}
                  placeholder="Select Year"
                  sx={{
                    color: '#ffffff',
                    '& .MuiSelect-select': {
                      color: '#ffffff !important'
                    }
                  }}
                >
                  {getYearOptions().map(year => (
                    <Option key={year.value} value={year.value} sx={{ color: '#ffffff' }}>
                      {year.label}
                    </Option>
                  ))}
                </Select>
              </Box>
            </Box>

            <Box>
              <Typography level="body-sm" sx={{ mb: 1, color: '#ffffff' }}>Filter by Operators (optional)</Typography>
              <Select
                multiple
                value={selectedOperators}
                onChange={(_, value) => setSelectedOperators(value as number[])}
                placeholder="Select Operators (leave empty for all)"
                sx={{
                  minWidth: 300,
                  color: '#ffffff',
                  '& .MuiSelect-select': {
                    color: '#ffffff !important'
                  }
                }}
              >
                {operators.map(operator => (
                  <Option key={operator.id} value={operator.id} sx={{ color: '#ffffff' }}>
                    {operator.name} - {operator.role}
                  </Option>
                ))}
              </Select>
            </Box>
          </Stack>
        </Box>
      </Card>

      {/* Summary Cards */}
      {selectedYear && (
        <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Card sx={{ flex: 1, minWidth: 200 }}>
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <CalendarToday sx={{ fontSize: 28, color: '#ffffff', mb: 1 }} />
              <Typography level="h4" sx={{ color: '#ffffff', fontSize: '1.25rem' }}>
                {selectedMonth ? `${getMonthOptions().find(m => m.value === selectedMonth)?.label} ${selectedYear}` : selectedYear}
              </Typography>
              <Typography level="body-xs" sx={{ color: '#ffffff', opacity: 0.8 }}>
                Report Period
              </Typography>
            </Box>
          </Card>

          <Card sx={{ flex: 1, minWidth: 200 }}>
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Person sx={{ fontSize: 28, color: '#ffffff', mb: 1 }} />
              <Typography level="h4" sx={{ color: '#ffffff', fontSize: '1.25rem' }}>
                {getTotalAppointments()}
              </Typography>
              <Typography level="body-xs" sx={{ color: '#ffffff', opacity: 0.8 }}>
                Total Appointments
              </Typography>
            </Box>
          </Card>

          <Card sx={{ flex: 1, minWidth: 200 }}>
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <AttachMoney sx={{ fontSize: 28, color: '#ffffff', mb: 1 }} />
              <Typography level="h4" sx={{ color: '#ffffff', fontSize: '1.25rem' }}>
                {formatCurrency(getTotalRevenue())}
              </Typography>
              <Typography level="body-xs" sx={{ color: '#ffffff', opacity: 0.8 }}>
                Total Revenue (Paid Invoices)
              </Typography>
            </Box>
          </Card>
        </Box>
      )}

      {/* Report Results */}
      {selectedYear && (
        <Card>
          <Box sx={{ p: 2 }}>
            <Typography level="h5" sx={{ mb: 2, fontSize: '1.25rem' }}>
              Operator Performance Report
            </Typography>

            {reportData.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography level="h5" sx={{ mb: 2, color: '#ffffff', fontSize: '1.1rem' }}>
                  No data available
                </Typography>
                <Typography level="body-sm" sx={{ color: '#ffffff', opacity: 0.8 }}>
                  No appointments or paid invoices found for the selected period and operators.
                </Typography>
              </Box>
            ) : (
              <Stack spacing={1.5}>
                {reportData.map((item, index) => (
                  <Box
                    key={item.operatorId}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      p: 1.5,
                      borderRadius: 'sm',
                      backgroundColor: index % 2 === 0 ? 'background.level1' : 'background.surface',
                      border: '1px solid',
                      borderColor: 'divider'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Person sx={{ color: '#ffffff', fontSize: 20 }} />
                      <Box>
                        <Typography level="body-sm" fontWeight="bold" sx={{ color: '#ffffff', fontSize: '0.875rem' }}>
                          {item.operatorName}
                        </Typography>
                        <Typography level="body-xs" sx={{ color: '#ffffff', opacity: 0.8 }}>
                          ID: {item.operatorId}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography level="body-sm" sx={{ color: '#ffffff', fontSize: '0.875rem' }}>
                          {item.appointmentCount}
                        </Typography>
                        <Typography level="body-xs" sx={{ color: '#ffffff', opacity: 0.8 }}>
                          Appointments
                        </Typography>
                      </Box>

                      <Box sx={{ textAlign: 'center' }}>
                        <Typography level="body-sm" sx={{ color: '#ffffff', fontSize: '0.875rem' }}>
                          {item.invoiceCount}
                        </Typography>
                        <Typography level="body-xs" sx={{ color: '#ffffff', opacity: 0.8 }}>
                          Paid Invoices
                        </Typography>
                      </Box>

                      <Box sx={{ textAlign: 'center' }}>
                        <Chip color="success" variant="soft" size="sm">
                          {formatCurrency(item.revenue)}
                        </Chip>
                        <Typography level="body-xs" sx={{ color: '#ffffff', opacity: 0.8, mt: 0.25 }}>
                          Revenue
                        </Typography>
                      </Box>

                      <Button
                        size="sm"
                        variant="outlined"
                        startDecorator={<Receipt />}
                        onClick={() => handleViewInvoices(item)}
                        sx={{
                          borderRadius: 'sm',
                          borderColor: 'neutral.500',
                          color: '#ffffff',
                          '&:hover': {
                            backgroundColor: 'background.level1',
                            borderColor: 'neutral.300'
                          }
                        }}
                      >
                        View Invoices
                      </Button>
                      <Button
                        size="sm"
                        variant="soft"
                        startDecorator={<Download />}
                        onClick={() => handleExportToXLS(item)}
                        sx={{
                          borderRadius: 'sm',
                          color: '#ffffff',
                          '&:hover': {
                            backgroundColor: 'background.level2'
                          }
                        }}
                      >
                        Export XLS
                      </Button>
                    </Box>
                  </Box>
                ))}
              </Stack>
            )}
          </Box>
        </Card>
      )}

      {/* Patient Analysis Card */}
      <Card sx={{ mt: 3, mb: 2 }}>
          <Box sx={{ p: 2 }}>
            <Typography level="h5" sx={{ mb: 2, fontSize: '1.25rem' }}>
              Patient Analysis
            </Typography>

            {/* Patient Search */}
            <Box sx={{ mb: 3 }}>
              <Typography level="body-sm" sx={{ mb: 1, color: '#ffffff' }}>
                Search and Select Patient
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Input
                  startDecorator={<Search sx={{ color: '#ffffff' }} />}
                  placeholder="Type patient name or record number..."
                  value={patientSearchTerm}
                  onChange={(e) => setPatientSearchTerm(e.target.value)}
                  sx={{
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
              </Box>

              {/* Patient Search Results */}
              {patientSearchTerm.trim() && (
                <Box sx={{ mt: 2, maxHeight: 200, overflowY: 'auto' }}>
                  {filteredPatients.length > 0 ? (
                    <Stack spacing={1}>
                      {filteredPatients.map((patient) => (
                        <Box
                          key={patient.id}
                          onClick={() => {
                            handlePatientSelect(patient.id);
                            setPatientSearchTerm('');
                          }}
                          sx={{
                            p: 1.5,
                            borderRadius: 'sm',
                            backgroundColor: 'background.level1',
                            border: '1px solid',
                            borderColor: 'divider',
                            cursor: 'pointer',
                            '&:hover': {
                              backgroundColor: 'background.level2',
                              borderColor: 'primary.outlinedBorder'
                            },
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <Box>
                            <Typography level="body-sm" fontWeight="bold" sx={{ color: '#ffffff' }}>
                              {patient.name}
                            </Typography>
                            <Typography level="body-xs" sx={{ color: '#ffffff', opacity: 0.8 }}>
                              {patient.record_number}
                            </Typography>
                          </Box>
                          <Chip size="sm" variant="soft" color="primary">
                            Select
                          </Chip>
                        </Box>
                      ))}
                    </Stack>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                      <Typography level="body-sm" sx={{ color: '#ffffff', opacity: 0.8 }}>
                        No patients found matching "{patientSearchTerm}"
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}
            </Box>

            {/* Selected Patient Details */}
            {selectedPatient && (
              <Box sx={{ p: 2, backgroundColor: 'background.level1', borderRadius: 'sm', border: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography level="h6" sx={{ mb: 1, color: '#ffffff' }}>
                      {selectedPatient.name}
                    </Typography>
                    <Typography level="body-sm" sx={{ color: '#ffffff', opacity: 0.8 }}>
                      Record Number: {selectedPatient.record_number}
                    </Typography>
                    <Typography level="body-sm" sx={{ color: '#ffffff', opacity: 0.8 }}>
                      Total Appointments: <strong>{getPatientAppointmentCount()}</strong>
                    </Typography>
                  </Box>
                  <Button
                    size="sm"
                    variant="outlined"
                    onClick={() => {
                      setSelectedPatient(null);
                      setVitalSignsData([]);
                    }}
                    sx={{ borderColor: 'neutral.500', color: '#ffffff' }}
                  >
                    Clear
                  </Button>
                </Box>

                {/* Vital Signs Trend Charts */}
                {vitalSignsData.length > 0 ? (
                  <Box>
                    <Typography level="body-sm" sx={{ mb: 2, color: '#ffffff', fontWeight: 'bold' }}>
                      Vital Signs Trends
                    </Typography>

                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>

                      {/* Blood Pressure Chart */}
                      <Box sx={{
                        backgroundColor: 'background.surface',
                        borderRadius: 'sm',
                        p: 1.5,
                        border: '1px solid',
                        borderColor: 'divider'
                      }}>
                        <Typography level="body-xs" sx={{ mb: 1, color: '#ffffff', fontWeight: 'bold', textAlign: 'center' }}>
                          Blood Pressure
                        </Typography>
                        <Box sx={{ width: '100%', height: 180 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                              data={vitalSignsData.map(data => ({
                                ...data,
                                systolic: parseInt(data.bloodPressure.split('/')[0]) || 0,
                                diastolic: parseInt(data.bloodPressure.split('/')[1]) || 0,
                              }))}
                              margin={{ top: 10, right: 15, left: 10, bottom: 10 }}
                            >
                              <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="var(--joy-palette-neutral-outlinedBorder)"
                                strokeOpacity={0.3}
                              />
                              <XAxis
                                dataKey="date"
                                stroke="var(--joy-palette-text-secondary)"
                                tick={{ fill: 'var(--joy-palette-text-secondary)', fontSize: 10 }}
                                angle={-45}
                                textAnchor="end"
                                height={50}
                              />
                              <YAxis stroke="var(--joy-palette-text-secondary)" tick={{ fill: 'var(--joy-palette-text-secondary)', fontSize: 10 }} />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: 'var(--joy-palette-background-level1)',
                                  border: '1px solid var(--joy-palette-neutral-outlinedBorder)',
                                  borderRadius: '6px',
                                  color: 'var(--joy-palette-text-primary)',
                                  fontSize: '12px'
                                }}
                              />
                              <Line
                                type="monotone"
                                dataKey="systolic"
                                stroke="var(--joy-palette-primary-500)"
                                strokeWidth={2}
                                dot={{ fill: 'var(--joy-palette-primary-500)', strokeWidth: 1, r: 3 }}
                                name="Systolic"
                              />
                              <Line
                                type="monotone"
                                dataKey="diastolic"
                                stroke="var(--joy-palette-danger-500)"
                                strokeWidth={2}
                                dot={{ fill: 'var(--joy-palette-danger-500)', strokeWidth: 1, r: 3 }}
                                name="Diastolic"
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </Box>
                      </Box>

                      {/* Heart Rate Chart */}
                      <Box sx={{
                        backgroundColor: 'background.surface',
                        borderRadius: 'sm',
                        p: 1.5,
                        border: '1px solid',
                        borderColor: 'divider'
                      }}>
                        <Typography level="body-xs" sx={{ mb: 1, color: '#ffffff', fontWeight: 'bold', textAlign: 'center' }}>
                          Heart Rate
                        </Typography>
                        <Box sx={{ width: '100%', height: 180 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                              data={vitalSignsData}
                              margin={{ top: 10, right: 15, left: 10, bottom: 10 }}
                            >
                              <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="var(--joy-palette-neutral-outlinedBorder)"
                                strokeOpacity={0.3}
                              />
                              <XAxis
                                dataKey="date"
                                stroke="var(--joy-palette-text-secondary)"
                                tick={{ fill: 'var(--joy-palette-text-secondary)', fontSize: 10 }}
                                angle={-45}
                                textAnchor="end"
                                height={50}
                              />
                              <YAxis stroke="var(--joy-palette-text-secondary)" tick={{ fill: 'var(--joy-palette-text-secondary)', fontSize: 10 }} />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: 'var(--joy-palette-background-level1)',
                                  border: '1px solid var(--joy-palette-neutral-outlinedBorder)',
                                  borderRadius: '6px',
                                  color: 'var(--joy-palette-text-primary)',
                                  fontSize: '12px'
                                }}
                              />
                              <Line
                                type="monotone"
                                dataKey="heartRate"
                                stroke="var(--joy-palette-success-500)"
                                strokeWidth={2}
                                dot={{ fill: 'var(--joy-palette-success-500)', strokeWidth: 1, r: 3 }}
                                name="Heart Rate (bpm)"
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </Box>
                      </Box>

                      {/* Respiration Rate Chart */}
                      <Box sx={{
                        backgroundColor: 'background.surface',
                        borderRadius: 'sm',
                        p: 1.5,
                        border: '1px solid',
                        borderColor: 'divider'
                      }}>
                        <Typography level="body-xs" sx={{ mb: 1, color: '#ffffff', fontWeight: 'bold', textAlign: 'center' }}>
                          Respiration Rate
                        </Typography>
                        <Box sx={{ width: '100%', height: 180 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                              data={vitalSignsData}
                              margin={{ top: 10, right: 15, left: 10, bottom: 10 }}
                            >
                              <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="var(--joy-palette-neutral-outlinedBorder)"
                                strokeOpacity={0.3}
                              />
                              <XAxis
                                dataKey="date"
                                stroke="var(--joy-palette-text-secondary)"
                                tick={{ fill: 'var(--joy-palette-text-secondary)', fontSize: 10 }}
                                angle={-45}
                                textAnchor="end"
                                height={50}
                              />
                              <YAxis stroke="var(--joy-palette-text-secondary)" tick={{ fill: 'var(--joy-palette-text-secondary)', fontSize: 10 }} />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: 'var(--joy-palette-background-level1)',
                                  border: '1px solid var(--joy-palette-neutral-outlinedBorder)',
                                  borderRadius: '6px',
                                  color: 'var(--joy-palette-text-primary)',
                                  fontSize: '12px'
                                }}
                              />
                              <Line
                                type="monotone"
                                dataKey="respirationRate"
                                stroke="var(--joy-palette-warning-500)"
                                strokeWidth={2}
                                dot={{ fill: 'var(--joy-palette-warning-500)', strokeWidth: 1, r: 3 }}
                                name="Respiration Rate (breaths/min)"
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </Box>
                      </Box>

                      {/* Borg Scale Chart */}
                      <Box sx={{
                        backgroundColor: 'background.surface',
                        borderRadius: 'sm',
                        p: 1.5,
                        border: '1px solid',
                        borderColor: 'divider'
                      }}>
                        <Typography level="body-xs" sx={{ mb: 1, color: '#ffffff', fontWeight: 'bold', textAlign: 'center' }}>
                          Borg Scale
                        </Typography>
                        <Box sx={{ width: '100%', height: 180 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                              data={vitalSignsData}
                              margin={{ top: 10, right: 15, left: 10, bottom: 10 }}
                            >
                              <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="var(--joy-palette-neutral-outlinedBorder)"
                                strokeOpacity={0.3}
                              />
                              <XAxis
                                dataKey="date"
                                stroke="var(--joy-palette-text-secondary)"
                                tick={{ fill: 'var(--joy-palette-text-secondary)', fontSize: 10 }}
                                angle={-45}
                                textAnchor="end"
                                height={50}
                              />
                              <YAxis stroke="var(--joy-palette-text-secondary)" tick={{ fill: 'var(--joy-palette-text-secondary)', fontSize: 10 }} />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: 'var(--joy-palette-background-level1)',
                                  border: '1px solid var(--joy-palette-neutral-outlinedBorder)',
                                  borderRadius: '6px',
                                  color: 'var(--joy-palette-text-primary)',
                                  fontSize: '12px'
                                }}
                              />
                              <Line
                                type="monotone"
                                dataKey="borgScale"
                                stroke="var(--joy-palette-neutral-500)"
                                strokeWidth={2}
                                dot={{ fill: 'var(--joy-palette-neutral-500)', strokeWidth: 1, r: 3 }}
                                name="Borg Scale (1-10)"
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </Box>
                      </Box>

                    </Box>
                  </Box>
                ) : (
                  <Box sx={{
                    p: 4,
                    textAlign: 'center',
                    backgroundColor: 'background.surface',
                    borderRadius: 'sm',
                    border: '1px dashed',
                    borderColor: 'divider'
                  }}>
                    <Typography level="body-sm" sx={{ color: '#ffffff', opacity: 0.8 }}>
                      No vital signs data available for this patient in the selected period
                    </Typography>
                  </Box>
                )}
              </Box>
            )}

            {/* Initial State */}
            {!selectedPatient && patientSearchTerm.trim() === '' && (
              <Box sx={{
                p: 4,
                textAlign: 'center',
                backgroundColor: 'background.level1',
                borderRadius: 'sm',
                border: '1px dashed',
                borderColor: 'divider'
              }}>
                <Person sx={{ fontSize: 48, color: '#ffffff', opacity: 0.3, mb: 2 }} />
                <Typography level="h6" sx={{ mb: 1, color: '#ffffff', opacity: 0.8 }}>
                  Patient Search
                </Typography>
                <Typography level="body-sm" sx={{ color: '#ffffff', opacity: 0.6 }}>
                  Start typing a patient name or record number above to analyze their vital signs trends
                </Typography>
              </Box>
            )}
          </Box>
        </Card>

      {/* Invoices Modal */}
      <Modal open={showInvoicesModal} onClose={handleCloseInvoicesModal}>
        <ModalDialog
          variant="outlined"
          sx={{
            maxWidth: '800px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}
        >
          <ModalClose />
          <Typography level="h4" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Receipt />
            Invoices for {selectedOperator?.operatorName}
          </Typography>

          <Typography level="body-sm" sx={{ mb: 2, color: 'text.secondary' }}>
            {selectedMonth ? `${getMonthOptions().find(m => m.value === selectedMonth)?.label} ${selectedYear}` : selectedYear}
          </Typography>

          <Divider sx={{ mb: 2 }} />

          {selectedOperator && (
            <Box>
              {getOperatorInvoices(selectedOperator).length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography level="h5" sx={{ mb: 2 }}>
                    No invoices found
                  </Typography>
                  <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
                    No invoices were generated by {selectedOperator.operatorName} during the selected period.
                  </Typography>
                </Box>
              ) : (
                <Box>
                  <Table>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left', padding: '8px' }}>Invoice #</th>
                        <th style={{ textAlign: 'left', padding: '8px' }}>Date</th>
                        <th style={{ textAlign: 'left', padding: '8px' }}>Patient</th>
                        <th style={{ textAlign: 'right', padding: '8px' }}>Amount</th>
                        <th style={{ textAlign: 'center', padding: '8px' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getOperatorInvoices(selectedOperator).map((invoice) => (
                        <tr key={invoice.id}>
                          <td style={{ padding: '8px' }}>
                            <Typography level="body-sm" fontWeight="bold">
                              {invoice.invoiceNumber}
                            </Typography>
                          </td>
                          <td style={{ padding: '8px' }}>
                            <Typography level="body-sm">
                              {formatDate(invoice.date)}
                            </Typography>
                          </td>
                          <td style={{ padding: '8px' }}>
                            <Typography level="body-sm">
                              {invoice.patientName}
                            </Typography>
                          </td>
                          <td style={{ padding: '8px', textAlign: 'right' }}>
                            <Typography level="body-sm" fontWeight="bold">
                              {formatCurrency(invoice.totalAmount)}
                            </Typography>
                          </td>
                          <td style={{ padding: '8px', textAlign: 'center' }}>
                            <Chip
                              variant="soft"
                              size="sm"
                              color={
                                invoice.status === 'paid' ? 'success' :
                                invoice.status === 'unpaid' ? 'warning' : 'danger'
                              }
                            >
                              {invoice.status}
                            </Chip>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>

                  <Box sx={{ mt: 3, p: 2, backgroundColor: 'background.level1', borderRadius: 'sm' }}>
                    <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
                      Total Invoices: {getOperatorInvoices(selectedOperator).length}
                    </Typography>
                    <Typography level="body-sm" sx={{ color: 'text.secondary', mt: 0.5 }}>
                      Total Amount: {formatCurrency(
                        getOperatorInvoices(selectedOperator).reduce((sum, invoice) => sum + invoice.totalAmount, 0)
                      )}
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </ModalDialog>
      </Modal>
    </Box>
  );
};

export default Reports;