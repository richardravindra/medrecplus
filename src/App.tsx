import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import {
  CssVarsProvider,
  extendTheme,
} from '@mui/joy/styles';
import CssBaseline from '@mui/joy/CssBaseline';
import { SidebarProvider } from './contexts/SidebarContext';
import { SecurityProvider } from './contexts/SecurityContext';
import MainLayout from './components/Layout/MainLayout';
import { LockScreen } from './components/LockScreen';
import PageTransition from './components/PageTransition';
import './styles/animations.css';
import './styles/enhancedComponents.css';
import Dashboard from './pages/Dashboard';
import PatientList from './pages/PatientList';
import OptimizedPatientList from './pages/OptimizedPatientList';
import AddPatient from './pages/AddPatient';
import PatientDetails from './pages/PatientDetails';
import EditPatient from './pages/EditPatient';
import Settings from './pages/Settings';
import Appointments from './pages/Appointments';
import OptimizedAppointments from './pages/OptimizedAppointments';
import NewAppointment from './pages/NewAppointment';
import AppointmentDetails from './pages/AppointmentDetails';
import Invoices from './pages/Invoices';
import OptimizedInvoices from './pages/InvoicesOptimized';
import InvoiceDetails from './pages/InvoiceDetails';
import Reports from './pages/Reports';
import OperatorSettings from './pages/settings/OperatorSettings';
import TreatmentSettings from './pages/settings/TreatmentSettings';
import BackupRestoreSettings from './pages/settings/BackupRestoreSettings';
import ActivityLogsSettings from './pages/settings/ActivityLogsSettings';
import ReceiptSettings from './pages/settings/ReceiptSettings';
import CustomExaminationsSettings from './pages/settings/CustomExaminationsSettings';
import CurrencySettings from './pages/settings/CurrencySettings';
import PasswordAndSecuritySettings from './pages/settings/PasswordAndSecuritySettings';
import { EncryptionSetup } from './pages/EncryptionSetup';
import { createSampleLogs } from './utils/sampleLogs';
import { invoke } from '@tauri-apps/api/core';
import { useSecurity } from './hooks/useSecurity';
import './utils/IndexedDBDataGenerator';
import './utils/PerformanceProfiler';
import { PerformanceProvider } from './hooks/usePerformanceMonitor';
import { PerformanceOptimizer } from './components/PerformanceOptimizer';

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
          900: '#0F1114',
        },
        background: {
          body: '#020618',
          surface: '#0f172b',
        },
        text: {
          primary: '#ffffff',
          secondary: '#ffffff',
          tertiary: '#ffffff',
        },
      },
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
          900: '#0F1114',
        },
        background: {
          body: '#020618',
          surface: '#0f172b',
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
          900: '#000000',
        },
        text: {
          primary: '#ffffff',
          secondary: '#ffffff',
          tertiary: '#ffffff',
        },
      },
    },
  },
  components: {
    JoyButton: {
      styleOverrides: {
        root: ({ ownerState }) => ({
          ...(ownerState.variant === 'solid' && ownerState.color === 'primary' && {
            backgroundColor: '#1d293d',
            color: '#ffffff',
            '&:hover': {
              backgroundColor: '#1A2332',
            },
          }),
          ...(ownerState.variant === 'solid' && ownerState.color === 'neutral' && {
            backgroundColor: '#1d293d',
            color: '#ffffff',
            '&:hover': {
              backgroundColor: '#1A2332',
            },
          }),
          ...(ownerState.variant === 'outlined' && ownerState.color === 'neutral' && {
            borderColor: '#1d293d',
            color: '#ffffff',
            '&:hover': {
              backgroundColor: '#1d293d',
              color: '#ffffff',
            },
          }),
          ...(ownerState.variant === 'soft' && ownerState.color === 'primary' && {
            backgroundColor: 'rgba(29, 41, 61, 0.1)',
            color: '#ffffff',
            '&:hover': {
              backgroundColor: 'rgba(29, 41, 61, 0.2)',
            },
          }),
        }),
      },
    },
  },
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
        // Running in web browser - check localStorage for encryption setup
        console.log('Running in web browser - checking localStorage for encryption status');
        const isSetupComplete = localStorage.getItem('medrec_dev_encryption_setup') === 'true';
        setIsUnlocked(isSetupComplete); // Only unlock if setup was completed
      }
    } catch (err) {
      console.error('Failed to check encryption status:', err);
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
      <div style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0a0a0a'
      }}>
        <h2>Loading...</h2>
      </div>
    );
  }

  if (!isUnlocked) {
    return <EncryptionSetup onUnlock={handleUnlock} />;
  }

  return (
    <PerformanceOptimizer
      config={{
        enableMemoryMonitoring: true,
        enableDatabaseOptimization: true,
        enableLazyLoading: true,
        memoryLimitMB: 100,
        cleanupIntervalMs: 60000
      }}
      onOptimizationComplete={(status) => {
        console.log('Performance optimization completed:', status);
      }}
    >
      <Router>
        {isLocked && <LockScreen />}
        <PageTransition>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="patients" element={<OptimizedPatientList />} />
              <Route path="patients/add" element={<AddPatient />} />
              <Route path="patients/:id" element={<PatientDetails />} />
              <Route path="patients/:id/edit" element={<EditPatient />} />
              <Route path="appointments" element={<OptimizedAppointments />} />
              <Route path="appointments/new" element={<NewAppointment />} />
              <Route path="appointments/:id" element={<AppointmentDetails />} />
              <Route path="invoices" element={<OptimizedInvoices />} />
              <Route path="invoices/:id" element={<InvoiceDetails />} />
              <Route path="reports" element={<Reports />} />
              <Route path="settings" element={<Settings />} />
              <Route path="settings/operators" element={<OperatorSettings />} />
              <Route path="settings/treatments" element={<TreatmentSettings />} />
              <Route path="settings/backup" element={<BackupRestoreSettings />} />
              <Route path="settings/logs" element={<ActivityLogsSettings />} />
              <Route path="settings/receipt" element={<ReceiptSettings />} />
              <Route path="settings/custom-examinations" element={<CustomExaminationsSettings />} />
              <Route path="settings/security" element={<PasswordAndSecuritySettings />} />
              <Route path="settings/currency" element={<CurrencySettings />} />
            </Route>
          </Routes>
        </PageTransition>
      </Router>
    </PerformanceOptimizer>
  );
}

function App() {
  return (
    <PerformanceProvider>
      <CssVarsProvider
        theme={theme}
        defaultMode="dark"
        modeStorageKey="patient-management-theme"
        disableTransitionOnChange
      >
        <CssBaseline />
        <SecurityProvider>
          <SidebarProvider>
            <AppContent />
          </SidebarProvider>
        </SecurityProvider>
      </CssVarsProvider>
    </PerformanceProvider>
  );
}

export default App;
