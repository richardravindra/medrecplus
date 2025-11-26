import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/joy/Box';
import Card from '@mui/joy/Card';
import Typography from '@mui/joy/Typography';
import Button from '@mui/joy/Button';
import Stack from '@mui/joy/Stack';
import Add from '@mui/icons-material/Add';
import MonetizationOn from '@mui/icons-material/MonetizationOn';
import { LazyLineChart } from '../components/charts/LazyLineChart';
import SimpleDataService from '../services/SimpleDataService';
import { log } from '../utils/logger';
import { Invoice } from '../types';
import { useCurrency, formatCurrency } from '../utils/currencyUtils';

interface PatientStats {
  totalPatients: number;
  newThisMonth: number;
  monthlyData: { month: string; count: number }[];
}

interface AppointmentStats {
  totalAppointments: number;
  thisMonth: number;
  monthlyData: { month: string; count: number }[];
}

interface RevenueStats {
  totalRevenue: number;
  thisMonth: number;
  monthlyData: { month: string; revenue: number }[];
}

interface VitalSigns {
  bloodPressure: string;
  respirationRate: number;
  heartRate: number;
  borgScale: number;
}

interface AppointmentTreatment {
  id: number;
  name: string;
  price: number;
  notes?: string;
}

interface Appointment {
  id: number;
  patientName: string;
  patientId: number;
  date: string;
  vitalSigns: VitalSigns;
  treatments: AppointmentTreatment[];
  totalPrice: number;
  operatorName?: string;
  created_at: string;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [currency] = useCurrency();
  const [_stats, setStats] = useState<PatientStats>({
    totalPatients: 0,
    newThisMonth: 0,
    monthlyData: []
  });
  const [appointmentStats, setAppointmentStats] = useState<AppointmentStats>({
    totalAppointments: 0,
    thisMonth: 0,
    monthlyData: []
  });
  const [revenueStats, setRevenueStats] = useState<RevenueStats>({
    totalRevenue: 0,
    thisMonth: 0,
    monthlyData: []
  });

  // Helper function to get total count efficiently without loading all data
  const getTotalCount = useCallback(async (dataType: 'patients' | 'appointments' | 'invoices'): Promise<number> => {
    try {
      // Request just 1 item to get the totalCount without loading large dataset
      const result = await SimpleDataService[dataType === 'patients' ? 'getPatients' :
                                           dataType === 'appointments' ? 'getAppointments' :
                                           'getInvoices']({ limit: 1 });
      return result.totalCount || 0;
    } catch (err) {
      log.error(`Error getting total count for ${dataType}`, { error: err }, 'Dashboard');
      return 0;
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      // Get total counts efficiently
      const [totalPatients, totalAppointments, _totalInvoices] = await Promise.all([
        getTotalCount('patients'),
        getTotalCount('appointments'),
        getTotalCount('invoices')
      ]);

      // Load data for charts with reasonable limit to prevent browser freezing
      // Use a higher limit for better chart accuracy but still maintain performance
      const [patientsResult, appointmentsResult, invoicesResult] = await Promise.all([
        SimpleDataService.getPatients({ limit: 5000 }),
        SimpleDataService.getAppointments({ limit: 5000 }),
        SimpleDataService.getInvoices({ limit: 5000 })
      ]);

      const patients = patientsResult.data;
      const appointments = appointmentsResult.data;
      const invoices = invoicesResult.data;

      // Calculate patients added this month
      const newThisMonth = patients.filter(patient => {
        if (!patient.created_at) return false;
        const createdDate = new Date(patient.created_at);
        return createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear;
      }).length;

      // Generate monthly data for patients
      const patientMonthlyData = [];
      for (let i = 5; i >= 0; i--) {
        const month = new Date(currentYear, currentMonth - i, 1);
        const monthName = month.toLocaleDateString('en-US', { month: 'short' });
        const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
        const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);

        const count = patients.filter(patient => {
          if (!patient.created_at) return false;
          const createdDate = new Date(patient.created_at);
          return createdDate >= monthStart && createdDate <= monthEnd;
        }).length;

        patientMonthlyData.push({ month: monthName, count });
      }

      setStats({
        totalPatients,
        newThisMonth,
        monthlyData: patientMonthlyData
      });

      // Calculate appointments this month
      const appointmentsThisMonth = appointments.filter((appointment: Appointment) => {
        const appointmentDate = new Date(appointment.date);
        return (
          appointmentDate.getMonth() === currentMonth &&
          appointmentDate.getFullYear() === currentYear
        );
      }).length;

      // Generate monthly data for appointments
      const appointmentMonthlyData = [];
      for (let i = 5; i >= 0; i--) {
        const month = new Date(currentYear, currentMonth - i, 1);
        const monthName = month.toLocaleDateString('en-US', { month: 'short' });
        const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
        const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);

        const count = appointments.filter((appointment: Appointment) => {
          const appointmentDate = new Date(appointment.date);
          return appointmentDate >= monthStart && appointmentDate <= monthEnd;
        }).length;

        appointmentMonthlyData.push({ month: monthName, count });
      }

      setAppointmentStats({
        totalAppointments,
        thisMonth: appointmentsThisMonth,
        monthlyData: appointmentMonthlyData
      });

      const paidInvoices = invoices.filter((invoice: Invoice) => invoice.status === 'paid');

      // Calculate revenue this month
      const revenueThisMonth = paidInvoices
        .filter((invoice: Invoice) => {
          const invoiceDate = new Date(invoice.date);
          return (
            invoiceDate.getMonth() === currentMonth && invoiceDate.getFullYear() === currentYear
          );
        })
        .reduce((total: number, invoice: Invoice) => total + (invoice.totalAmount || 0), 0);

      // Generate monthly data for revenue
      const revenueMonthlyData = [];
      for (let i = 5; i >= 0; i--) {
        const month = new Date(currentYear, currentMonth - i, 1);
        const monthName = month.toLocaleDateString('en-US', { month: 'short' });
        const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
        const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);

        const monthlyRevenue = paidInvoices
          .filter((invoice: Invoice) => {
            const invoiceDate = new Date(invoice.date);
            return invoiceDate >= monthStart && invoiceDate <= monthEnd;
          })
          .reduce((total: number, invoice: Invoice) => total + (invoice.totalAmount || 0), 0);

        revenueMonthlyData.push({ month: monthName, revenue: monthlyRevenue });
      }

      const totalRevenue = paidInvoices.reduce(
        (total: number, invoice: Invoice) => total + (invoice.totalAmount || 0),
        0
      );

      setRevenueStats({
        totalRevenue,
        thisMonth: revenueThisMonth,
        monthlyData: revenueMonthlyData
      });
    } catch (err) {
      log.error('Error loading dashboard stats', { error: err }, 'Dashboard');
    }
  }, [getTotalCount]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Helper function to format numbers with shortened units
  const formatNumber = (value: number): string => {
    if (value >= 1000000000) {
      return (value / 1000000000).toFixed(1) + 'B';
    } else if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M';
    } else if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'K';
    } else {
      return value.toString();
    }
  };

  // Helper function to format currency with shortened units
  const formatCurrencyShort = (value: number): string => {
    if (value >= 1000000000) {
      return currency.symbol + (value / 1000000000).toFixed(1) + 'B';
    } else if (value >= 1000000) {
      return currency.symbol + (value / 1000000).toFixed(1) + 'M';
    } else if (value >= 1000) {
      return currency.symbol + (value / 1000).toFixed(1) + 'K';
    } else {
      return formatCurrency(value, currency);
    }
  };

  // Currency formatting now handled by the imported utility functions

  return (
    <Box
      sx={{
        width: '100%',
        minHeight: '100%',
        maxHeight: '100vh',
        p: { xs: 1, md: 1.5 },
        pt: { xs: 0, md: 1.5 },
        pr: { xs: 2, md: 1.5 },
        pb: { xs: 1, md: 1.5 }, // Add bottom padding to ensure content doesn't overlap with button
        boxSizing: 'border-box',
        minWidth: 0,
        overflowY: 'auto', // Enable scrolling within the container
        overflowX: 'hidden', // Prevent horizontal scrolling
        position: 'relative', // Ensure positioning context for the button
        // Ensure proper scrolling on mobile devices
        WebkitOverflowScrolling: 'touch',
        // Handle safe areas on mobile
        paddingBottom: { xs: 'max(16px, env(safe-area-inset-bottom))', md: '1.5rem' }
      }}
    >
      <Box sx={{ mb: 1 }}>
        <Typography level='h2' sx={{ mb: 1 }}>
          Welcome!
        </Typography>
      </Box>

      <Stack spacing={1.5}>
        <Box
          sx={{
            display: 'flex',
            gap: 1.5,
            flexDirection: { xs: 'column', lg: 'row' },
            flexWrap: 'wrap'
          }}
        >
          {/* New Patients This Month Card */}
          <Card
            variant='outlined'
            sx={{
              p: 1.5,
              position: 'relative',
              overflow: 'visible',
              flex: 1,
              minWidth: { xs: '100%', lg: '300px' }
            }}
          >
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                mb: 1
              }}
            >
              <Box>
                <Typography level='h4' sx={{ mb: 0.5 }}>
                  New Patients This Month
                </Typography>
                <Typography level='h2' color='primary' sx={{ mb: 0.5 }}>
                  {_stats.newThisMonth}
                </Typography>
                <Typography level='body-sm' sx={{ color: '#ffffff' }}>
                  Total patients: {_stats.totalPatients}
                </Typography>
              </Box>

              <Button
                variant='solid'
                color='neutral'
                size='sm'
                startDecorator={<Add />}
                onClick={() => navigate('/patients/add')}
                sx={{
                  borderRadius: 'sm',
                  whiteSpace: 'nowrap'
                }}
              >
                Add a New Patient
              </Button>
            </Box>

            {/* Recharts Line Chart */}
            <Box sx={{ mt: 0.5 }}>
              <Box
                sx={{
                  width: '100%',
                  height: 240,
                  backgroundColor: 'background.level1',
                  borderRadius: 'sm',
                  p: 1,
                  border: '1px solid',
                  borderColor: 'divider'
                }}
              >
                <LazyLineChart
                  data={_stats.monthlyData}
                  dataKey='count'
                  stroke='var(--joy-palette-primary-500)'
                  height={220}
                  title='Patient Registration Trend'
                  formatYAxis={formatNumber}
                  formatTooltip={formatNumber}
                />
              </Box>
            </Box>
          </Card>

          {/* Appointments This Month Card */}
          <Card
            variant='outlined'
            sx={{
              p: 1.5,
              position: 'relative',
              overflow: 'visible',
              flex: 1,
              minWidth: { xs: '100%', md: '0' }
            }}
          >
            <Box sx={{ mb: 1 }}>
              <Typography level='h4' sx={{ mb: 0.5 }}>
                Appointments This Month
              </Typography>
              <Typography level='h2' color='success' sx={{ mb: 0.5 }}>
                {appointmentStats.thisMonth}
              </Typography>
              <Typography level='body-sm' sx={{ color: '#ffffff' }}>
                Total appointments: {appointmentStats.totalAppointments}
              </Typography>
            </Box>

            {/* Recharts Line Chart for Appointments */}
            <Box sx={{ mt: 0.5 }}>
              <Box
                sx={{
                  width: '100%',
                  height: 240,
                  backgroundColor: 'background.level1',
                  borderRadius: 'sm',
                  p: 1,
                  border: '1px solid',
                  borderColor: 'divider'
                }}
              >
                <LazyLineChart
                  data={appointmentStats.monthlyData}
                  dataKey='count'
                  stroke='var(--joy-palette-success-500)'
                  height={220}
                  title='Appointments Trend'
                  formatYAxis={formatNumber}
                  formatTooltip={formatNumber}
                />
              </Box>
            </Box>
          </Card>
        </Box>

        {/* Second Row - Revenue Card */}
        <Box
          sx={{
            display: 'flex',
            gap: 1.5,
            flexDirection: { xs: 'column', lg: 'row' },
            flexWrap: 'wrap'
          }}
        >
          {/* Revenue This Month Card */}
          <Card
            variant='outlined'
            sx={{
              p: 1.5,
              position: 'relative',
              overflow: 'visible',
              flex: 1,
              minWidth: { xs: '100%', lg: '300px' }
            }}
          >
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                mb: 1
              }}
            >
              <Box>
                <Typography level='h4' sx={{ mb: 0.5 }}>
                  Revenue This Month
                </Typography>
                <Typography level='h2' color='success' sx={{ mb: 0.5 }}>
                  {formatCurrency(revenueStats.thisMonth, currency)}
                </Typography>
                <Typography level='body-sm' sx={{ color: '#ffffff' }}>
                  Total revenue: {formatCurrency(revenueStats.totalRevenue, currency)}
                </Typography>
              </Box>

              <Button
                variant='solid'
                color='neutral'
                size='sm'
                startDecorator={<MonetizationOn />}
                onClick={() => navigate('/invoices')}
                sx={{
                  borderRadius: 'sm',
                  whiteSpace: 'nowrap'
                }}
              >
                View Invoices
              </Button>
            </Box>

            {/* Recharts Revenue Chart */}
            <Box sx={{ mt: 0.5 }}>
              <Box
                sx={{
                  width: '100%',
                  height: 240,
                  backgroundColor: 'background.level1',
                  borderRadius: 'sm',
                  p: 1,
                  border: '1px solid',
                  borderColor: 'divider'
                }}
              >
                <LazyLineChart
                  data={revenueStats.monthlyData}
                  dataKey='revenue'
                  stroke='var(--joy-palette-primary-500)'
                  height={220}
                  title='Revenue Trend'
                  formatYAxis={formatCurrencyShort}
                  formatTooltip={formatCurrencyShort}
                />
              </Box>
            </Box>
          </Card>
        </Box>
      </Stack>

      {/* Floating New Appointment Button */}
      <Button
        color='primary'
        variant='solid'
        onClick={() => navigate('/appointments/new')}
        startDecorator={<Add />}
        sx={{
          position: 'fixed !important',
          bottom: { xs: '80px', md: '24px' }, // Positioned above mobile navbar (60px + safe area)
          right: { xs: '16px', md: '24px' }, // Aligned to right edge
          zIndex: 1000,
          borderRadius: 28,
          fontSize: '14px',
          fontWeight: 'bold',
          padding: { xs: '10px 16px', md: '12px 20px' },
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          transition: 'all 0.3s ease',
          maxWidth: '90vw', // Ensure button doesn't overflow on small screens
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          // Ensure button stays within safe areas on mobile devices
          '@media screen and (max-aspect-ratio: 9/16)': {
            bottom: '80px',
            right: '16px'
          },
          // Handle notched screens and safe areas
          '@supports (padding: max(0px))': {
            paddingBottom: 'max(10px, env(safe-area-inset-bottom))',
            marginRight: 'max(16px, env(safe-area-inset-right))'
          },
          '&:hover': {
            transform: 'scale(1.05)',
            boxShadow: '0 6px 20px rgba(0, 0, 0, 0.4)'
          },
          '&:active': {
            transform: 'scale(0.98)'
          }
        }}
      >
        New Appointment
      </Button>
    </Box>
  );
};

export default Dashboard;
