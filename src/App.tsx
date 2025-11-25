import { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CssVarsProvider, extendTheme } from '@mui/joy/styles';
import CssBaseline from '@mui/joy/CssBaseline';
import { SidebarProvider } from './contexts/SidebarContext';
import { SecurityProvider } from './contexts/SecurityContext';
import { AppErrorBoundary } from './components/ErrorBoundary';
import MainLayout from './components/Layout/MainLayout';
import { LockScreen } from './components/LockScreen';
import PageTransition from './components/PageTransition';
import { ToastProvider } from './components/Toast';
import { CircularProgress, Box } from '@mui/material';
import './styles/animations.css';
import './styles/enhancedComponents.css';

// Lazy load heavy components for better bundle splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));
const OptimizedPatientList = lazy(() => import('./pages/OptimizedPatientList'));
const AddPatient = lazy(() => import('./pages/AddPatient'));
const PatientDetails = lazy(() => import('./pages/PatientDetails'));
const EditPatient = lazy(() => import('./pages/EditPatient'));
const Settings = lazy(() => import('./pages/Settings'));
const OptimizedAppointments = lazy(() => import('./pages/OptimizedAppointments'));
const NewAppointment = lazy(() => import('./pages/NewAppointment'));
const AppointmentDetails = lazy(() => import('./pages/AppointmentDetails'));
const OptimizedInvoices = lazy(() => import('./pages/OptimizedInvoices'));
const InvoiceDetails = lazy(() => import('./pages/InvoiceDetails'));
const Reports = lazy(() => import('./pages/Reports'));

// Lazy load settings components
const OperatorSettings = lazy(() => import('./pages/settings/OperatorSettings'));
const TreatmentSettings = lazy(() => import('./pages/settings/TreatmentSettings'));
const BackupRestoreSettings = lazy(() => import('./pages/settings/BackupRestoreSettings'));
const ActivityLogsSettings = lazy(() => import('./pages/settings/ActivityLogsSettings'));
const ReceiptSettings = lazy(() => import('./pages/settings/ReceiptSettings'));
const CustomExaminationsSettings = lazy(
  () => import('./pages/settings/CustomExaminationsSettings')
);
const CurrencySettings = lazy(() => import('./pages/settings/CurrencySettings'));
const PasswordAndSecuritySettings = lazy(
  () => import('./pages/settings/PasswordAndSecuritySettings')
);
const EncryptionSetup = lazy(() =>
  import('./pages/EncryptionSetup').then(module => ({ default: module.EncryptionSetup }))
);

// Loading fallback component
const LazyLoadingFallback = () => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      flexDirection: 'column',
      gap: 2
    }}
  >
    <CircularProgress size={40} />
    <Box>Loading...</Box>
  </Box>
);
import { createSampleLogs } from './utils/sampleLogs';
import { invoke } from '@tauri-apps/api/core';
import { useSecurity } from './hooks/useSecurity';
import { log } from './utils/logger';
import './utils/IndexedDBDataGenerator';
import './utils/PerformanceProfiler';
import { PerformanceProvider } from './hooks/usePerformanceMonitor';
import { SimplePerformanceOptimizer } from './components/SimplePerformanceOptimizer';
import { storage } from './services/UnifiedStorage';

const theme = extendTheme({
  colorSchemes: {
    light: {
      palette: {
        primary: {
          50: '#F8F9FB',
          100: '#F1F3F7',
          200: '#E9EDF3',
          300: '#E1E6EF',
          400: '#D9DFE7',
          500: '#1d293d',
          600: '#1A2332',
          700: '#ffffff',
          800: '#13171E',
          900: '#0F1114'
        },
        background: {
          body: '#020618',
          surface: '#0f172b'
        },
        text: {
          primary: '#ffffff',
          secondary: '#ffffff',
          tertiary: '#ffffff'
        },
        // Add divider color
        divider: 'rgba(255, 255, 255, 0.12)'
      }
    },
    dark: {
      palette: {
        primary: {
          50: '#F8F9FB',
          100: '#F1F3F7',
          200: '#E9EDF3',
          300: '#E1E6EF',
          400: '#D9DFE7',
          500: '#1d293d',
          600: '#1A2332',
          700: '#ffffff',
          800: '#13171E',
          900: '#0F1114'
        },
        background: {
          body: '#020618',
          surface: '#0f172b'
        },
        neutral: {
          50: '#1d293d',
          100: '#1A2332',
          200: '#ffffff',
          300: '#13171E',
          400: '#0F1114',
          500: '#0C0B0F',
          600: '#09080A',
          700: '#060506',
          800: '#020618',
          900: '#000000'
        },
        text: {
          primary: '#ffffff',
          secondary: '#ffffff',
          tertiary: '#ffffff'
        },
        // Add divider color
        divider: 'rgba(255, 255, 255, 0.12)'
      }
    }
  },
  components: {
    JoyButton: {
      styleOverrides: {
        root: ({ ownerState }) => ({
          ...(ownerState.variant === 'solid' &&
            ownerState.color === 'primary' && {
              backgroundColor: '#1d293d',
              color: '#ffffff',
              '&:hover': {
                backgroundColor: '#1A2332'
              }
            }),
          ...(ownerState.variant === 'solid' &&
            ownerState.color === 'neutral' && {
              backgroundColor: '#1d293d',
              color: '#ffffff',
              '&:hover': {
                backgroundColor: '#1A2332'
              }
            }),
          ...(ownerState.variant === 'outlined' &&
            ownerState.color === 'neutral' && {
              borderColor: '#1d293d',
              color: '#ffffff',
              '&:hover': {
                backgroundColor: '#1d293d',
                color: '#ffffff'
              }
            }),
          ...(ownerState.variant === 'soft' &&
            ownerState.color === 'primary' && {
              backgroundColor: 'rgba(29, 41, 61, 0.1)',
              color: '#ffffff',
              '&:hover': {
                backgroundColor: 'rgba(29, 41, 61, 0.2)'
              }
            })
        })
      }
    }
  },
  fontFamily: {
    body: 'Inter, system-ui, sans-serif'
  },
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    md: '1rem',
    lg: '1.125rem',
    xl: '1.25rem'
  },
  radius: {
    xs: '2px',
    sm: '4px',
    md: '6px',
    lg: '8px',
    xl: '12px'
  }
});

function AppContent() {
  const { isLocked } = useSecurity();
  const [isUnlocked, setIsUnlocked] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkEncryptionStatus();
  }, []);

  const checkEncryptionStatus = async () => {
    try {
      // Check if Tauri API is available (not running in web browser)
      if (typeof window !== 'undefined' && '__TAURI__' in window) {
        const encrypted = await invoke<boolean>('is_database_encrypted');
        setIsUnlocked(!encrypted); // If not encrypted, we're "unlocked" by default
      } else {
        // Running in web browser - check UnifiedStorage for encryption setup
        // Force settings sync first
        await storage.syncSettings();

        const isSetupComplete = await storage.getEncryptionSetup();
        const hasPassword = await storage.getPassword();

        // If encryption is set up, require password. If not set up, allow access.
        const shouldRequirePassword = Boolean(isSetupComplete && hasPassword);
        setIsUnlocked(!shouldRequirePassword); // Unlock if encryption is not set up, lock if it is set up
      }
    } catch {
      setIsUnlocked(false); // Show encryption setup on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlock = () => {
    setIsUnlocked(true);
    // Initialize sample logs after successful unlock
    createSampleLogs();
  };

  if (isLoading) {
    return (
      <div
        style={{
          width: '100vw',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0a0a0a'
        }}
      >
        <h2>Loading...</h2>
      </div>
    );
  }

  if (!isUnlocked) {
    return <EncryptionSetup onUnlock={handleUnlock} />;
  }

  return (
    <SimplePerformanceOptimizer
      config={{
        enableCaching: true,
        enableCleanup: true,
        cleanupIntervalMs: 5 * 60 * 1000 // 5 minutes
      }}
      onOptimizationComplete={status => {
        log.debug('Simple performance optimization completed', { status }, 'App');
      }}
    >
      <Router>
        {isLocked && <LockScreen />}
        <PageTransition>
          <Suspense fallback={<LazyLoadingFallback />}>
            <Routes>
              <Route path='/' element={<MainLayout />}>
                <Route index element={<Dashboard />} />
                <Route path='patients' element={<OptimizedPatientList />} />
                <Route path='patients/add' element={<AddPatient />} />
                <Route path='patients/:id' element={<PatientDetails />} />
                <Route path='patients/:id/edit' element={<EditPatient />} />
                <Route path='appointments' element={<OptimizedAppointments />} />
                <Route path='appointments/new' element={<NewAppointment />} />
                <Route path='appointments/:id' element={<AppointmentDetails />} />
                <Route path='invoices' element={<OptimizedInvoices />} />
                <Route path='invoices/:id' element={<InvoiceDetails />} />
                <Route path='reports' element={<Reports />} />
                <Route path='settings' element={<Settings />} />
                <Route path='settings/operators' element={<OperatorSettings />} />
                <Route path='settings/treatments' element={<TreatmentSettings />} />
                <Route path='settings/backup' element={<BackupRestoreSettings />} />
                <Route path='settings/logs' element={<ActivityLogsSettings />} />
                <Route path='settings/receipt' element={<ReceiptSettings />} />
                <Route
                  path='settings/custom-examinations'
                  element={<CustomExaminationsSettings />}
                />
                <Route path='settings/security' element={<PasswordAndSecuritySettings />} />
                <Route path='settings/currency' element={<CurrencySettings />} />
              </Route>
            </Routes>
          </Suspense>
        </PageTransition>
      </Router>
    </SimplePerformanceOptimizer>
  );
}

function App() {
  return (
    <AppErrorBoundary>
      <PerformanceProvider>
        <CssVarsProvider
          theme={theme}
          defaultMode='dark'
          modeStorageKey='patient-management-theme'
          disableTransitionOnChange
        >
          <CssBaseline />
          <SecurityProvider>
            <SidebarProvider>
              <ToastProvider>
                <AppContent />
              </ToastProvider>
            </SidebarProvider>
          </SecurityProvider>
        </CssVarsProvider>
      </PerformanceProvider>
    </AppErrorBoundary>
  );
}

export default App;
