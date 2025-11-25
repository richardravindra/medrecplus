import { lazy } from 'react';

// Lazy load heavy components to reduce initial bundle size
export const OptimizedPatientList = lazy(() => import('../pages/OptimizedPatientList'));
export const OptimizedInvoices = lazy(() => import('../pages/OptimizedInvoices'));
export const OptimizedAppointments = lazy(() => import('../pages/OptimizedAppointments'));
export const Reports = lazy(() => import('../pages/Reports'));

// Lazy load heavy table components
export const LazyPatientTable = lazy(() => import('../components/tables/LazyPatientTable'));
export const LazyInvoiceTable = lazy(() => import('../components/tables/LazyInvoiceTable'));
export const LazyAppointmentTable = lazy(() => import('../components/tables/LazyAppointmentTable'));

// Lazy load charts and analytics components
export const Dashboard = lazy(() => import('../pages/Dashboard'));

// Lazy load settings components
export const BackupRestoreSettings = lazy(() => import('../pages/settings/BackupRestoreSettings'));
export const PasswordAndSecuritySettings = lazy(
  () => import('../pages/settings/PasswordAndSecuritySettings')
);
export const ActivityLogsSettings = lazy(() => import('../pages/settings/ActivityLogsSettings'));
export const ReceiptSettings = lazy(() => import('../pages/settings/ReceiptSettings'));
export const TreatmentSettings = lazy(() => import('../pages/settings/TreatmentSettings'));
export const CustomExaminationsSettings = lazy(
  () => import('../pages/settings/CustomExaminationsSettings')
);
export const CurrencySettings = lazy(() => import('../pages/settings/CurrencySettings'));
export const OperatorSettings = lazy(() => import('../pages/settings/OperatorSettings'));

// Preloading utilities for critical components
export const preloadComponent = (importFunc: () => Promise<{ default: React.ComponentType }>) => {
  importFunc();
};

// Preload critical components
export const preloadCriticalComponents = () => {
  // Preload components that are likely to be accessed soon
  preloadComponent(() => import('../pages/OptimizedPatientList'));
  preloadComponent(() => import('../pages/Dashboard'));
  preloadComponent(() => import('../pages/NewAppointment'));
};
