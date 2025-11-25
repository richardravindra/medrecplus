import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Box from '@mui/joy/Box';
import Card from '@mui/joy/Card';
import Typography from '@mui/joy/Typography';
import Button from '@mui/joy/Button';
import Select from '@mui/joy/Select';
import Option from '@mui/joy/Option';
import Stack from '@mui/joy/Stack';
import CircularProgress from '@mui/joy/CircularProgress';
import Chip from '@mui/joy/Chip';
import Assessment from '@mui/icons-material/Assessment';
import Person from '@mui/icons-material/Person';
import CalendarToday from '@mui/icons-material/CalendarToday';
import AttachMoney from '@mui/icons-material/AttachMoney';
import Receipt from '@mui/icons-material/Receipt';
import Download from '@mui/icons-material/Download';
import Refresh from '@mui/icons-material/Refresh';
import Modal from '@mui/joy/Modal';
import ModalDialog from '@mui/joy/ModalDialog';
import ModalClose from '@mui/joy/ModalClose';
import { AlertDialog } from '../components/ConfirmDialog';
import { useAlertDialog } from '../hooks/useDialog';
import Divider from '@mui/joy/Divider';
import Table from '@mui/joy/Table';
import Input from '@mui/joy/Input';
import Search from '@mui/icons-material/Search';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import * as XLSX from 'xlsx';
import { storage } from '../services/UnifiedStorage';
import { Patient, Appointment, Invoice, Operator } from '../types';
import { log } from '../utils/logger';
import { formatCurrencyWhole } from '../utils/currencyUtils';

// Debounce hook for search optimization
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
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

interface FilterOptions {
  year: string;
  month: string;
  operators: number[];
  limit?: number;
  offset?: number;
}

const ReportsOptimized: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [_error, setError] = useState<string | null>(null);

  // Dialog hooks
  const alertDialog = useAlertDialog();
  const [operators, setOperators] = useState<Operator[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientIndex, setPatientIndex] = useState<Map<string, Patient[]>>(new Map());

  // Filter states
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedOperators, setSelectedOperators] = useState<number[]>([]);
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [filteredDataStats, setFilteredDataStats] = useState({
    totalAppointments: 0,
    totalInvoices: 0,
    paidInvoices: 0,
    filteredAppointments: 0,
    filteredInvoices: 0
  });

  // Patient analysis states
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientSearchTerm, setPatientSearchTerm] = useState<string>('');
  const debouncedSearchTerm = useDebounce(patientSearchTerm, 300);
  const [vitalSignsData, setVitalSignsData] = useState<VitalSignsData[]>([]);
  const [patientAppointments, setPatientAppointments] = useState<Appointment[]>([]);

  // Modal states
  const [showInvoicesModal, setShowInvoicesModal] = useState(false);
  const [selectedOperator, setSelectedOperator] = useState<ReportData | null>(null);
  const [operatorInvoices, setOperatorInvoices] = useState<Invoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);

  // Cache for filtered data
  interface CachedData {
    appointments: Appointment[];
    invoices: Invoice[];
    totalAppointments: number;
    totalInvoices: number;
  }

  const dataCache = useRef<Map<string, CachedData>>(new Map());

  // Create cache key for filters
  const getCacheKey = (filters: FilterOptions) => {
    return JSON.stringify(filters);
  };

  // Load initial metadata (operators and patients)
  const loadMetadata = useCallback(async () => {
    try {

      // Load operators and patients in parallel
      const [operatorsData, patientsData] = await Promise.all([
        storage.getOperators(),
        storage.getPatients()
      ]);

      setOperators(operatorsData);

      setPatients(patientsData);

      // Create search index for patients
      const index = new Map<string, Patient[]>();
      patientsData.forEach(patient => {
        // Index by first letter of name for faster search
        const firstLetter = patient.name.charAt(0).toLowerCase();
        if (!index.has(firstLetter)) {
          index.set(firstLetter, []);
        }
        const nameArray = index.get(firstLetter);
        if (nameArray) {
          nameArray.push(patient);
        }

        // Also index by record number prefix
        const recordPrefix = patient.record_number.substring(0, 8);
        if (!index.has(recordPrefix)) {
          index.set(recordPrefix, []);
        }
        const recordArray = index.get(recordPrefix);
        if (recordArray) {
          recordArray.push(patient);
        }
      });
      setPatientIndex(index);
    } catch {
      setError('Failed to load metadata');
      log.error('Failed to load reports metadata', { _error: 'Failed to load metadata' }, 'ReportsOptimized');
    }
  }, []);

  // Load filtered data on demand
  const loadFilteredData = useCallback(async (filters: FilterOptions) => {
    const cacheKey = getCacheKey(filters);

    // Check cache first
    const cachedResult = dataCache.current.get(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    // Load data with filters
    const [appointments, invoices] = await Promise.all([
      storage.getAppointments(),
      storage.getInvoices()
    ]);


    // Apply filters in memory (could be moved to backend for better performance)
    const filteredAppointments = appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.date);
      const appointmentMonth = (appointmentDate.getMonth() + 1).toString().padStart(2, '0');
      const appointmentYear = appointmentDate.getFullYear().toString();

      const yearMatch = !filters.year || appointmentYear === filters.year;
      const monthMatch = !filters.month || appointmentMonth === filters.month;
      const operatorMatch =
        filters.operators.length === 0 || filters.operators.includes(appointment.operatorId);

      return yearMatch && monthMatch && operatorMatch;
    });

    const filteredInvoices = invoices.filter(invoice => {
      if (invoice.status !== 'paid') return false;

      const dateToCheck = invoice.appointmentDate || invoice.date || invoice.created_at;
      const invoiceDate = new Date(dateToCheck);

      if (isNaN(invoiceDate.getTime())) return false;

      const invoiceMonth = (invoiceDate.getMonth() + 1).toString().padStart(2, '0');
      const invoiceYear = invoiceDate.getFullYear().toString();

      const yearMatch = !filters.year || invoiceYear === filters.year;
      const monthMatch = !filters.month || invoiceMonth === filters.month;
      const operatorMatch =
        filters.operators.length === 0 || filters.operators.includes(invoice.operatorId);

      return yearMatch && monthMatch && operatorMatch;
    });

    const result: CachedData = {
      appointments: filteredAppointments,
      invoices: filteredInvoices,
      totalAppointments: appointments.length,
      totalInvoices: invoices.length
    };

    // Cache the result
    dataCache.current.set(cacheKey, result);

    return result;
  }, []);

  // Generate report data from filtered data
  const generateReportData = useCallback(
    (appointments: Appointment[], invoices: Invoice[]) => {
      // Group data by operator
      const operatorMap = new Map<
        number,
        { name: string; appointmentCount: number; invoiceCount: number; revenue: number }
      >();

      // Initialize with all operators (or filtered ones)
      const relevantOperators =
        selectedOperators.length > 0
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
      appointments.forEach(appointment => {
        const current = operatorMap.get(appointment.operatorId);
        if (current) {
          current.appointmentCount++;
        }
      });

      // Count paid invoices and sum revenue
      invoices.forEach(invoice => {
        const current = operatorMap.get(invoice.operatorId);
        if (current) {
          current.invoiceCount++;
          current.revenue += invoice.totalAmount;
        }
      });

      // Convert to array and sort by revenue
      const data: ReportData[] = Array.from(operatorMap.entries())
        .map(([operatorId, data]) => ({
          operatorId,
          operatorName: data.name,
          appointmentCount: data.appointmentCount,
          invoiceCount: data.invoiceCount,
          revenue: data.revenue
        }))
        .sort((a, b) => b.revenue - a.revenue);

      return data;
    },
    [selectedOperators, operators]
  );

  // Main data loading effect
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await loadMetadata();
      } catch {
        setError('Failed to load initial data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [loadMetadata]);

  // Effect to load and filter data when filters change
  useEffect(() => {
    if (!selectedYear) {
      setReportData([]);
      setFilteredDataStats({
        totalAppointments: 0,
        totalInvoices: 0,
        paidInvoices: 0,
        filteredAppointments: 0,
        filteredInvoices: 0
      });
      return;
    }

    const loadAndFilterData = async () => {
      try {
        setLoading(true);

        const filters: FilterOptions = {
          year: selectedYear,
          month: selectedMonth,
          operators: selectedOperators,
          limit: 10000,
          offset: 0
        };

        const result = await loadFilteredData(filters);
        const reportData = generateReportData(result.appointments, result.invoices);

        setReportData(reportData);
        setFilteredDataStats({
          totalAppointments: result.totalAppointments,
          totalInvoices: result.totalInvoices,
          paidInvoices: result.invoices.filter(inv => inv.status === 'paid').length,
          filteredAppointments: result.appointments.length,
          filteredInvoices: result.invoices.length
        });
      } catch {
        setError('Failed to generate report');
      } finally {
        setLoading(false);
      }
    };

    loadAndFilterData();
  }, [selectedYear, selectedMonth, selectedOperators, loadFilteredData, generateReportData]);

  // Optimized patient search
  const filteredPatients = useMemo(() => {
    if (!debouncedSearchTerm.trim()) {
      return [];
    }

    const searchTerm = debouncedSearchTerm.toLowerCase();
    const results: Patient[] = [];

    // Use indexed search for better performance
    const firstLetter = searchTerm.charAt(0);

    if (patientIndex.has(firstLetter)) {
      const candidates = patientIndex.get(firstLetter);
      if (candidates) {
        candidates.forEach(patient => {
          if (
            patient.name.toLowerCase().includes(searchTerm) ||
            patient.record_number.toLowerCase().includes(searchTerm)
          ) {
            results.push(patient);
          }
        });
      }
    }

    // Fallback to full search if no results from index
    if (results.length === 0) {
      patients.forEach(patient => {
        if (
          patient.name.toLowerCase().includes(searchTerm) ||
          patient.record_number.toLowerCase().includes(searchTerm)
        ) {
          results.push(patient);
        }
      });
    }

    // Sort and limit results
    results.sort((a, b) => {
      const aNameExact = a.name.toLowerCase() === searchTerm;
      const bNameExact = b.name.toLowerCase() === searchTerm;
      const aRecordExact = a.record_number.toLowerCase() === searchTerm;
      const bRecordExact = b.record_number.toLowerCase() === searchTerm;

      if (aNameExact && !bNameExact) return -1;
      if (!aNameExact && bNameExact) return 1;
      if (aRecordExact && !bRecordExact) return -1;
      if (!aRecordExact && bRecordExact) return 1;

      return a.name.localeCompare(b.name);
    });

    return results.slice(0, 50); // Limit to 50 for better performance
  }, [debouncedSearchTerm, patients, patientIndex]);

  // Load patient data on demand
  const handlePatientSelect = useCallback(
    async (patientId: number) => {
      const patient = patients.find(p => p.id === patientId);
      if (!patient) return;

      setSelectedPatient(patient);
      setPatientSearchTerm('');

      try {
        // Load patient appointments with filters
        const filters: FilterOptions = {
          year: selectedYear,
          month: selectedMonth,
          operators: [],
          limit: 1000,
          offset: 0
        };

        const result = await loadFilteredData(filters);
        const patientApts = result.appointments.filter(apt => apt.patientId === patientId);

        setPatientAppointments(patientApts);

        // Generate vital signs data
        const vitalData: VitalSignsData[] = patientApts
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .map(apt => ({
            date: formatDate(apt.date),
            bloodPressure: apt.vitalSigns?.bloodPressure || '',
            heartRate: apt.vitalSigns?.heartRate || 0,
            respirationRate: apt.vitalSigns?.respirationRate || 0,
            borgScale: apt.vitalSigns?.borgScale || 0
          }));

        setVitalSignsData(vitalData);
      } catch {
        setError('Failed to load patient data');
      }
    },
    [patients, selectedYear, selectedMonth, loadFilteredData]
  );

  // Load operator invoices on demand
  const handleViewInvoices = useCallback(
    async (operator: ReportData) => {
      setSelectedOperator(operator);
      setShowInvoicesModal(true);
      setLoadingInvoices(true);

      try {
        const filters: FilterOptions = {
          year: selectedYear,
          month: selectedMonth,
          operators: [operator.operatorId],
          limit: 5000,
          offset: 0
        };

        const result = await loadFilteredData(filters);
        const invoices = result.invoices
          .filter(inv => inv.operatorId === operator.operatorId)
          .sort(
            (a, b) =>
              new Date(b.appointmentDate || b.date || b.created_at).getTime() -
              new Date(a.appointmentDate || a.date || a.created_at).getTime()
          );

        setOperatorInvoices(invoices);
      } catch {
        setError('Failed to load operator invoices');
      } finally {
        setLoadingInvoices(false);
      }
    },
    [selectedYear, selectedMonth, loadFilteredData]
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const getMonthOptions = () => {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December'
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

  const getPatientAppointmentCount = () => {
    if (!selectedPatient) return 0;
    return patientAppointments.length;
  };

  const handleExportToXLS = async (operator: ReportData) => {
    try {

      // Load invoices for this operator on-demand
      const filters: FilterOptions = {
        year: selectedYear,
        month: selectedMonth,
        operators: [operator.operatorId],
        limit: 10000,
        offset: 0
      };

      const result = await loadFilteredData(filters);
      const invoices = result.invoices
        .filter(inv => inv.operatorId === operator.operatorId)
        .sort(
          (a, b) =>
            new Date(b.appointmentDate || b.date || b.created_at).getTime() -
            new Date(a.appointmentDate || a.date || a.created_at).getTime()
        );

      if (invoices.length === 0) {
        alertDialog.openDialog({
          title: 'No Data Available',
          message: `No invoices found for ${operator.operatorName} in the selected period.`,
          variant: 'warning'
        });
        return;
      }

      // Prepare data for export
      const exportData = invoices.map((invoice, index) => ({
        No: index + 1,
        'Invoice Number': invoice.invoiceNumber,
        Date: formatDate(invoice.date),
        'Patient Name': invoice.patientName,
        Operator: invoice.operatorName,
        Amount: invoice.totalAmount,
        Status: invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)
      }));

      // Create workbook
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Invoices');

      // Set column widths
      const colWidths = [
        { wch: 5 }, // No
        { wch: 15 }, // Invoice Number
        { wch: 12 }, // Date
        { wch: 25 }, // Patient Name
        { wch: 20 }, // Operator
        { wch: 15 }, // Amount
        { wch: 10 } // Status
      ];
      ws['!cols'] = colWidths;

      // Generate filename
      const period = selectedMonth
        ? `${getMonthOptions().find(m => m.value === selectedMonth)?.label}_${selectedYear}`
        : selectedYear;
      const filename = `Invoices_${operator.operatorName.replace(/\s+/g, '_')}_${period}.xlsx`;

      // Download file
      XLSX.writeFile(wb, filename);
    } catch {
      alertDialog.openDialog({
        title: 'Export Failed',
        message: 'Failed to export data. Please try again.',
        variant: 'danger'
      });
    }
  };

  const handleCloseInvoicesModal = () => {
    setShowInvoicesModal(false);
    setSelectedOperator(null);
    setOperatorInvoices([]);
  };

  const clearCache = () => {
    dataCache.current.clear();
  };

  if (loading && operators.length === 0) {
    return (
      <Box
        sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}
      >
        <Stack alignItems='center' spacing={2}>
          <CircularProgress />
          <Typography level='body-lg' sx={{ color: '#ffffff' }}>
            Loading reports...
          </Typography>
        </Stack>
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
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography
          level='h3'
          sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: '1.5rem' }}
        >
          <Assessment sx={{ color: '#ffffff' }} />
          Reports (Optimized)
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant='outlined'
            startDecorator={<Refresh />}
            onClick={() => {
              clearCache();
              window.location.reload();
            }}
            sx={{
              borderColor: '#ffffff',
              color: '#ffffff',
              '&:hover': {
                borderColor: '#ffffff',
                backgroundColor: 'rgba(255, 255, 255, 0.1)'
              }
            }}
          >
            Refresh Data
          </Button>
          <Button
            variant='soft'
            onClick={clearCache}
            sx={{
              color: '#ffffff',
              '&:hover': {
                backgroundColor: 'background.level2'
              }
            }}
          >
            Clear Cache
          </Button>
        </Box>
      </Box>

      {_error && (
        <Box sx={{ mb: 3 }}>
          <Typography color='danger'>{_error}</Typography>
        </Box>
      )}

      {/* Performance Stats */}
      {selectedYear && (
        <Card sx={{ mb: 3 }}>
          <Box sx={{ p: 2 }}>
            <Typography level='body-sm' sx={{ mb: 1, color: '#ffffff', fontWeight: 'bold' }}>
              Performance Stats
            </Typography>
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              <Typography level='body-xs' sx={{ color: '#ffffff', opacity: 0.8 }}>
                Total Appointments: {filteredDataStats.totalAppointments.toLocaleString()}
              </Typography>
              <Typography level='body-xs' sx={{ color: '#ffffff', opacity: 0.8 }}>
                Total Invoices: {filteredDataStats.totalInvoices.toLocaleString()}
              </Typography>
              <Typography level='body-xs' sx={{ color: '#ffffff', opacity: 0.8 }}>
                Paid Invoices: {filteredDataStats.paidInvoices.toLocaleString()}
              </Typography>
              <Typography level='body-xs' sx={{ color: '#ffffff', opacity: 0.8 }}>
                Filtered Appointments: {filteredDataStats.filteredAppointments.toLocaleString()}
              </Typography>
              <Typography level='body-xs' sx={{ color: '#ffffff', opacity: 0.8 }}>
                Filtered Invoices: {filteredDataStats.filteredInvoices.toLocaleString()}
              </Typography>
            </Box>
          </Box>
        </Card>
      )}

      {/* Filter Controls */}
      <Card sx={{ mb: 3 }}>
        <Box sx={{ p: 2 }}>
          <Typography level='h4' sx={{ mb: 2, fontSize: '1.25rem' }}>
            Select Report Period
          </Typography>
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <Box sx={{ minWidth: 200, flex: 1 }}>
                <Typography level='body-sm' sx={{ mb: 1, color: '#ffffff' }}>
                  Month
                </Typography>
                <Select
                  value={selectedMonth}
                  onChange={(_, value) => setSelectedMonth(value || '')}
                  placeholder='Select Month'
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
                <Typography level='body-sm' sx={{ mb: 1, color: '#ffffff' }}>
                  Year
                </Typography>
                <Select
                  value={selectedYear}
                  onChange={(_, value) => setSelectedYear(value || '')}
                  placeholder='Select Year'
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
              <Typography level='body-sm' sx={{ mb: 1, color: '#ffffff' }}>
                Filter by Operators (optional)
              </Typography>
              <Select
                multiple
                value={selectedOperators}
                onChange={(_, value) => setSelectedOperators(value as number[])}
                placeholder='Select Operators (leave empty for all)'
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
              <Typography level='h4' sx={{ color: '#ffffff', fontSize: '1.25rem' }}>
                {selectedMonth
                  ? `${getMonthOptions().find(m => m.value === selectedMonth)?.label} ${selectedYear}`
                  : selectedYear}
              </Typography>
              <Typography level='body-xs' sx={{ color: '#ffffff', opacity: 0.8 }}>
                Report Period
              </Typography>
            </Box>
          </Card>

          <Card sx={{ flex: 1, minWidth: 200 }}>
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Person sx={{ fontSize: 28, color: '#ffffff', mb: 1 }} />
              <Typography level='h4' sx={{ color: '#ffffff', fontSize: '1.25rem' }}>
                {getTotalAppointments().toLocaleString()}
              </Typography>
              <Typography level='body-xs' sx={{ color: '#ffffff', opacity: 0.8 }}>
                Total Appointments
              </Typography>
            </Box>
          </Card>

          <Card sx={{ flex: 1, minWidth: 200 }}>
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <AttachMoney sx={{ fontSize: 28, color: '#ffffff', mb: 1 }} />
              <Typography level='h4' sx={{ color: '#ffffff', fontSize: '1.25rem' }}>
                {formatCurrencyWhole(getTotalRevenue())}
              </Typography>
              <Typography level='body-xs' sx={{ color: '#ffffff', opacity: 0.8 }}>
                Total Revenue (Paid Invoices)
              </Typography>
            </Box>
          </Card>
        </Box>
      )}

      {/* Report Results with loading state */}
      {selectedYear && (
        <Card>
          <Box sx={{ p: 2 }}>
            <Typography level='h4' sx={{ mb: 2, fontSize: '1.25rem' }}>
              Operator Performance Report
              {loading && <CircularProgress size='sm' sx={{ ml: 2 }} />}
            </Typography>

            {reportData.length === 0 && !loading ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography level='h4' sx={{ mb: 2, color: '#ffffff', fontSize: '1.1rem' }}>
                  No data available
                </Typography>
                <Typography level='body-sm' sx={{ color: '#ffffff', opacity: 0.8 }}>
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
                        <Typography
                          level='body-sm'
                          fontWeight='bold'
                          sx={{ color: '#ffffff', fontSize: '0.875rem' }}
                        >
                          {item.operatorName}
                        </Typography>
                        <Typography level='body-xs' sx={{ color: '#ffffff', opacity: 0.8 }}>
                          ID: {item.operatorId}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography level='body-sm' sx={{ color: '#ffffff', fontSize: '0.875rem' }}>
                          {item.appointmentCount.toLocaleString()}
                        </Typography>
                        <Typography level='body-xs' sx={{ color: '#ffffff', opacity: 0.8 }}>
                          Appointments
                        </Typography>
                      </Box>

                      <Box sx={{ textAlign: 'center' }}>
                        <Typography level='body-sm' sx={{ color: '#ffffff', fontSize: '0.875rem' }}>
                          {item.invoiceCount.toLocaleString()}
                        </Typography>
                        <Typography level='body-xs' sx={{ color: '#ffffff', opacity: 0.8 }}>
                          Paid Invoices
                        </Typography>
                      </Box>

                      <Box sx={{ textAlign: 'center' }}>
                        <Chip color='success' variant='soft' size='sm'>
                          {formatCurrencyWhole(item.revenue)}
                        </Chip>
                        <Typography
                          level='body-xs'
                          sx={{ color: '#ffffff', opacity: 0.8, mt: 0.25 }}
                        >
                          Revenue
                        </Typography>
                      </Box>

                      <Button
                        size='sm'
                        variant='outlined'
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
                        size='sm'
                        variant='soft'
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

      {/* Patient Analysis Card - Optimized */}
      <Card sx={{ mt: 3, mb: 2 }}>
        <Box sx={{ p: 2 }}>
          <Typography level='h4' sx={{ mb: 2, fontSize: '1.25rem' }}>
            Patient Analysis
          </Typography>

          {/* Patient Search - Optimized */}
          <Box sx={{ mb: 3 }}>
            <Typography level='body-sm' sx={{ mb: 1, color: '#ffffff' }}>
              Search and Select Patient
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Input
                startDecorator={<Search sx={{ color: '#ffffff' }} />}
                placeholder='Type patient name or record number...'
                value={patientSearchTerm}
                onChange={e => setPatientSearchTerm(e.target.value)}
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

            {/* Patient Search Results - Limited and optimized */}
            {debouncedSearchTerm.trim() && (
              <Box sx={{ mt: 2, maxHeight: 250, overflowY: 'auto' }}>
                {filteredPatients.length > 0 ? (
                  <>
                    <Box
                      sx={{ mb: 1, p: 1, backgroundColor: 'background.level1', borderRadius: 'sm' }}
                    >
                      <Typography level='body-xs' sx={{ color: '#ffffff', opacity: 0.8 }}>
                        Showing {filteredPatients.length} patients (search optimized)
                      </Typography>
                    </Box>
                    <Stack spacing={1}>
                      {filteredPatients.map(patient => (
                        <Box
                          key={patient.id || patient.record_number}
                          onClick={() => {
                            if (patient.id) {
                              handlePatientSelect(patient.id);
                              setPatientSearchTerm('');
                            }
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
                            <Typography level='body-sm' fontWeight='bold' sx={{ color: '#ffffff' }}>
                              {patient.name}
                            </Typography>
                            <Typography level='body-xs' sx={{ color: '#ffffff', opacity: 0.8 }}>
                              {patient.record_number}
                            </Typography>
                          </Box>
                          <Chip size='sm' variant='soft' color='primary'>
                            Select
                          </Chip>
                        </Box>
                      ))}
                    </Stack>
                  </>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 3 }}>
                    <Typography level='body-sm' sx={{ color: '#ffffff', opacity: 0.8 }}>
                      No patients found matching "{debouncedSearchTerm}"
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </Box>

          {/* Selected Patient Details - Optimized */}
          {selectedPatient && (
            <Box
              sx={{
                p: 2,
                backgroundColor: 'background.level1',
                borderRadius: 'sm',
                border: '1px solid',
                borderColor: 'divider'
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  mb: 2
                }}
              >
                <Box>
                  <Typography level='title-lg' sx={{ mb: 1, color: '#ffffff' }}>
                    {selectedPatient.name}
                  </Typography>
                  <Typography level='body-sm' sx={{ color: '#ffffff', opacity: 0.8 }}>
                    Record Number: {selectedPatient.record_number}
                  </Typography>
                  <Typography level='body-sm' sx={{ color: '#ffffff', opacity: 0.8 }}>
                    Total Appointments: <strong>{getPatientAppointmentCount()}</strong>
                  </Typography>
                </Box>
                <Button
                  size='sm'
                  variant='outlined'
                  onClick={() => {
                    setSelectedPatient(null);
                    setVitalSignsData([]);
                    setPatientAppointments([]);
                  }}
                  sx={{ borderColor: 'neutral.500', color: '#ffffff' }}
                >
                  Clear
                </Button>
              </Box>

              {/* Vital Signs Trend Charts - Only render if data exists */}
              {vitalSignsData.length > 0 && (
                <Box>
                  <Typography level='body-sm' sx={{ mb: 2, color: '#ffffff', fontWeight: 'bold' }}>
                    Vital Signs Trends ({vitalSignsData.length} data points)
                  </Typography>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* Blood Pressure Chart */}
                    <Box
                      sx={{
                        backgroundColor: 'background.surface',
                        borderRadius: 'sm',
                        p: 1.5,
                        border: '1px solid',
                        borderColor: 'divider'
                      }}
                    >
                      <Typography
                        level='body-xs'
                        sx={{ mb: 1, color: '#ffffff', fontWeight: 'bold', textAlign: 'center' }}
                      >
                        Blood Pressure
                      </Typography>
                      <Box sx={{ width: '100%', height: 180 }}>
                        <ResponsiveContainer
                          width='100%'
                          height={160}
                          minWidth={200}
                          minHeight={150}
                        >
                          <LineChart
                            data={vitalSignsData.map(data => ({
                              ...data,
                              systolic: parseInt(data.bloodPressure.split('/')[0]) || 0,
                              diastolic: parseInt(data.bloodPressure.split('/')[1]) || 0
                            }))}
                            margin={{ top: 10, right: 15, left: 10, bottom: 10 }}
                          >
                            <CartesianGrid
                              strokeDasharray='3 3'
                              stroke='var(--joy-palette-neutral-outlinedBorder)'
                              strokeOpacity={0.3}
                            />
                            <XAxis
                              dataKey='date'
                              stroke='var(--joy-palette-text-secondary)'
                              tick={{ fill: 'var(--joy-palette-text-secondary)', fontSize: 10 }}
                              angle={-45}
                              textAnchor='end'
                              height={50}
                            />
                            <YAxis
                              stroke='var(--joy-palette-text-secondary)'
                              tick={{ fill: 'var(--joy-palette-text-secondary)', fontSize: 10 }}
                            />
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
                              type='monotone'
                              dataKey='systolic'
                              stroke='var(--joy-palette-primary-500)'
                              strokeWidth={2}
                              dot={{ fill: 'var(--joy-palette-primary-500)', strokeWidth: 1, r: 3 }}
                              name='Systolic'
                            />
                            <Line
                              type='monotone'
                              dataKey='diastolic'
                              stroke='var(--joy-palette-danger-500)'
                              strokeWidth={2}
                              dot={{ fill: 'var(--joy-palette-danger-500)', strokeWidth: 1, r: 3 }}
                              name='Diastolic'
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </Box>
                    </Box>

                    {/* Heart Rate Chart */}
                    <Box
                      sx={{
                        backgroundColor: 'background.surface',
                        borderRadius: 'sm',
                        p: 1.5,
                        border: '1px solid',
                        borderColor: 'divider'
                      }}
                    >
                      <Typography
                        level='body-xs'
                        sx={{ mb: 1, color: '#ffffff', fontWeight: 'bold', textAlign: 'center' }}
                      >
                        Heart Rate
                      </Typography>
                      <Box sx={{ width: '100%', height: 180 }}>
                        <ResponsiveContainer
                          width='100%'
                          height={160}
                          minWidth={200}
                          minHeight={150}
                        >
                          <LineChart
                            data={vitalSignsData}
                            margin={{ top: 10, right: 15, left: 10, bottom: 10 }}
                          >
                            <CartesianGrid
                              strokeDasharray='3 3'
                              stroke='var(--joy-palette-neutral-outlinedBorder)'
                              strokeOpacity={0.3}
                            />
                            <XAxis
                              dataKey='date'
                              stroke='var(--joy-palette-text-secondary)'
                              tick={{ fill: 'var(--joy-palette-text-secondary)', fontSize: 10 }}
                              angle={-45}
                              textAnchor='end'
                              height={50}
                            />
                            <YAxis
                              stroke='var(--joy-palette-text-secondary)'
                              tick={{ fill: 'var(--joy-palette-text-secondary)', fontSize: 10 }}
                            />
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
                              type='monotone'
                              dataKey='heartRate'
                              stroke='var(--joy-palette-warning-500)'
                              strokeWidth={2}
                              dot={{ fill: 'var(--joy-palette-warning-500)', strokeWidth: 1, r: 3 }}
                              name='Heart Rate (bpm)'
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </Box>
                    </Box>

                    {/* Respiration Rate Chart */}
                    <Box
                      sx={{
                        backgroundColor: 'background.surface',
                        borderRadius: 'sm',
                        p: 1.5,
                        border: '1px solid',
                        borderColor: 'divider'
                      }}
                    >
                      <Typography
                        level='body-xs'
                        sx={{ mb: 1, color: '#ffffff', fontWeight: 'bold', textAlign: 'center' }}
                      >
                        Respiration Rate
                      </Typography>
                      <Box sx={{ width: '100%', height: 180 }}>
                        <ResponsiveContainer
                          width='100%'
                          height={160}
                          minWidth={200}
                          minHeight={150}
                        >
                          <LineChart
                            data={vitalSignsData}
                            margin={{ top: 10, right: 15, left: 10, bottom: 10 }}
                          >
                            <CartesianGrid
                              strokeDasharray='3 3'
                              stroke='var(--joy-palette-neutral-outlinedBorder)'
                              strokeOpacity={0.3}
                            />
                            <XAxis
                              dataKey='date'
                              stroke='var(--joy-palette-text-secondary)'
                              tick={{ fill: 'var(--joy-palette-text-secondary)', fontSize: 10 }}
                              angle={-45}
                              textAnchor='end'
                              height={50}
                            />
                            <YAxis
                              stroke='var(--joy-palette-text-secondary)'
                              tick={{ fill: 'var(--joy-palette-text-secondary)', fontSize: 10 }}
                            />
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
                              type='monotone'
                              dataKey='respirationRate'
                              stroke='var(--joy-palette-success-500)'
                              strokeWidth={2}
                              dot={{ fill: 'var(--joy-palette-success-500)', strokeWidth: 1, r: 3 }}
                              name='Respiration Rate (breaths/min)'
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </Box>
                    </Box>

                    {/* Borg Scale Chart */}
                    <Box
                      sx={{
                        backgroundColor: 'background.surface',
                        borderRadius: 'sm',
                        p: 1.5,
                        border: '1px solid',
                        borderColor: 'divider'
                      }}
                    >
                      <Typography
                        level='body-xs'
                        sx={{ mb: 1, color: '#ffffff', fontWeight: 'bold', textAlign: 'center' }}
                      >
                        Borg Scale (Exertion)
                      </Typography>
                      <Box sx={{ width: '100%', height: 180 }}>
                        <ResponsiveContainer
                          width='100%'
                          height={160}
                          minWidth={200}
                          minHeight={150}
                        >
                          <LineChart
                            data={vitalSignsData}
                            margin={{ top: 10, right: 15, left: 10, bottom: 10 }}
                          >
                            <CartesianGrid
                              strokeDasharray='3 3'
                              stroke='var(--joy-palette-neutral-outlinedBorder)'
                              strokeOpacity={0.3}
                            />
                            <XAxis
                              dataKey='date'
                              stroke='var(--joy-palette-text-secondary)'
                              tick={{ fill: 'var(--joy-palette-text-secondary)', fontSize: 10 }}
                              angle={-45}
                              textAnchor='end'
                              height={50}
                            />
                            <YAxis
                              stroke='var(--joy-palette-text-secondary)'
                              tick={{ fill: 'var(--joy-palette-text-secondary)', fontSize: 10 }}
                            />
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
                              type='monotone'
                              dataKey='borgScale'
                              stroke='var(--joy-palette-info-500)'
                              strokeWidth={2}
                              dot={{ fill: 'var(--joy-palette-info-500)', strokeWidth: 1, r: 3 }}
                              name='Borg Scale (1-10)'
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              )}
            </Box>
          )}

          {/* Initial State */}
          {!selectedPatient && debouncedSearchTerm.trim() === '' && (
            <Box
              sx={{
                p: 4,
                textAlign: 'center',
                backgroundColor: 'background.level1',
                borderRadius: 'sm',
                border: '1px dashed',
                borderColor: 'divider'
              }}
            >
              <Person sx={{ fontSize: 48, color: '#ffffff', opacity: 0.3, mb: 2 }} />
              <Typography level='title-lg' sx={{ mb: 1, color: '#ffffff', opacity: 0.8 }}>
                Patient Search (Optimized)
              </Typography>
              <Typography level='body-sm' sx={{ color: '#ffffff', opacity: 0.6 }}>
                Start typing a patient name or record number above to analyze their vital signs
                trends
              </Typography>
              <Typography level='body-xs' sx={{ color: '#ffffff', opacity: 0.4, mt: 1 }}>
                Search is now optimized for {patients.length} patients
              </Typography>
            </Box>
          )}
        </Box>
      </Card>

      {/* Optimized Invoices Modal */}
      <Modal open={showInvoicesModal} onClose={handleCloseInvoicesModal}>
        <ModalDialog
          variant='outlined'
          sx={{
            maxWidth: '800px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}
        >
          <ModalClose />
          <Typography level='h4' sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Receipt />
            Invoices for {selectedOperator?.operatorName}
          </Typography>

          <Typography level='body-sm' sx={{ mb: 2, color: 'text.secondary' }}>
            {selectedMonth
              ? `${getMonthOptions().find(m => m.value === selectedMonth)?.label} ${selectedYear}`
              : selectedYear}
          </Typography>

          <Divider sx={{ mb: 2 }} />

          {selectedOperator && (
            <Box>
              {loadingInvoices ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <CircularProgress />
                  <Typography level='body-sm' sx={{ mt: 2 }}>
                    Loading invoices...
                  </Typography>
                </Box>
              ) : operatorInvoices.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography level='h4' sx={{ mb: 2 }}>
                    No invoices found
                  </Typography>
                  <Typography level='body-sm' sx={{ color: 'text.secondary' }}>
                    No invoices were generated by {selectedOperator.operatorName} during the
                    selected period.
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
                      {operatorInvoices.map(invoice => (
                        <tr key={invoice.id}>
                          <td style={{ padding: '8px' }}>
                            <Typography level='body-sm' fontWeight='bold'>
                              {invoice.invoiceNumber}
                            </Typography>
                          </td>
                          <td style={{ padding: '8px' }}>
                            <Typography level='body-sm'>{formatDate(invoice.date)}</Typography>
                          </td>
                          <td style={{ padding: '8px' }}>
                            <Typography level='body-sm'>{invoice.patientName}</Typography>
                          </td>
                          <td style={{ padding: '8px', textAlign: 'right' }}>
                            <Typography level='body-sm' fontWeight='bold'>
                              {formatCurrencyWhole(invoice.totalAmount)}
                            </Typography>
                          </td>
                          <td style={{ padding: '8px', textAlign: 'center' }}>
                            <Chip
                              variant='soft'
                              size='sm'
                              color={
                                invoice.status === 'paid'
                                  ? 'success'
                                  : invoice.status === 'unpaid'
                                    ? 'warning'
                                    : 'danger'
                              }
                            >
                              {invoice.status}
                            </Chip>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>

                  <Box
                    sx={{ mt: 3, p: 2, backgroundColor: 'background.level1', borderRadius: 'sm' }}
                  >
                    <Typography level='body-sm' sx={{ color: 'text.secondary' }}>
                      Total Invoices: {operatorInvoices.length.toLocaleString()}
                    </Typography>
                    <Typography level='body-sm' sx={{ color: 'text.secondary', mt: 0.5 }}>
                      Total Amount:{' '}
                      {formatCurrencyWhole(
                        operatorInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0)
                      )}
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </ModalDialog>
      </Modal>

      {/* Alert Dialog */}
      <AlertDialog
        open={alertDialog.isOpen}
        onClose={alertDialog.closeDialog}
        title={alertDialog.config.title}
        message={alertDialog.config.message}
        buttonText={alertDialog.config.buttonText}
        variant={alertDialog.config.variant}
      />
    </Box>
  );
};

export default ReportsOptimized;
