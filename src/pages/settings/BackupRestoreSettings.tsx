import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/joy/Box';
import Card from '@mui/joy/Card';
import Typography from '@mui/joy/Typography';
import Button from '@mui/joy/Button';
import Stack from '@mui/joy/Stack';
import Download from '@mui/icons-material/Download';
import Upload from '@mui/icons-material/Upload';
import ArrowBack from '@mui/icons-material/ArrowBack';
import * as XLSX from 'xlsx';
import { ConfirmDialog, AlertDialog, PromptDialog } from '../../components/ConfirmDialog';
import { useConfirmDialog, useAlertDialog, usePromptDialog } from '../../hooks/useDialog';
import { isTauriEnvironment, importTauriDialog, importTauriFs } from '../../utils/tauriUtils';
import { Patient, Invoice } from '../../types';
import { EnhancedRestoreDialog } from '../../components/EnhancedRestoreDialog';
import { storage } from '../../services/UnifiedStorage';
import { memoryManager } from '../../utils/SimpleMemoryManager';
import SimpleDataService from '../../services/SimpleDataService';

interface Treatment {
  id: number;
  name: string;
  price: number;
  notes?: string;
}

const BackupRestoreSettings: React.FC = () => {
  const navigate = useNavigate();
  const [showEnhancedRestore, setShowEnhancedRestore] = useState(false);

  // Dialog hooks
  const confirmDialog = useConfirmDialog();
  const alertDialog = useAlertDialog();
  const promptDialog = usePromptDialog();

  const handleBackup = async () => {
    try {
      // Collect all data using UnifiedStorage for consistency where available
      const backupData = {
        operators: await storage.getOperators(),
        treatments: await storage.getTreatments(),
        patients: await storage.getPatients(),
        appointments: await storage.getAppointments(),
        invoices: await storage.getInvoices(),
        backupDate: new Date().toISOString(),
        version: '1.0'
      };

      // Check if running in Tauri environment
      if (isTauriEnvironment()) {
        // Tauri environment - use native file dialog
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const defaultFilename = `patient-management-backup-${timestamp}.json`;

        // Import Tauri APIs using utility functions
        const dialogModule = await importTauriDialog();
        const fsModule = await importTauriFs();
        const { save } = dialogModule;
        const { writeFile } = fsModule;

        // Show save dialog
        const filePath = await (save as (options: unknown) => Promise<string | null>)({
          title: 'Save Backup File',
          defaultPath: defaultFilename,
          filters: [
            {
              name: 'JSON Files',
              extensions: ['json']
            },
            {
              name: 'All Files',
              extensions: ['*']
            }
          ]
        });

        if (filePath) {
          // Convert data to JSON string
          const jsonString = JSON.stringify(backupData, null, 2);
          await (writeFile as (path: string, contents: string) => Promise<void>)(
            filePath,
            jsonString
          );
          alertDialog.openDialog({
            title: 'Success',
            message: 'Backup created successfully!',
            buttonText: 'OK',
            variant: 'success'
          });
        }
      } else {
        // Web environment - use browser download
        const blob = new Blob([JSON.stringify(backupData, null, 2)], {
          type: 'application/json'
        });

        const url = URL.createObjectURL(blob);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const filename = `patient-management-backup-${timestamp}.json`;

        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        alertDialog.openDialog({
          title: 'Success',
          message: 'Backup created successfully!',
          buttonText: 'OK',
          variant: 'success'
        });
      }
    } catch {
      alertDialog.openDialog({
        title: 'Error',
        message: 'Backup failed. Please try again.',
        buttonText: 'OK',
        variant: 'danger'
      });
    }
  };

  const handleExportToExcel = async () => {
    try {
      // Load patients data using UnifiedStorage for consistency
      const patients = await storage.getPatients();

      if (patients.length === 0) {
        alertDialog.openDialog({
          title: 'No Data',
          message: 'No patient data available to export.',
          buttonText: 'OK',
          variant: 'info'
        });
        return;
      }

      // Prepare data for Excel export
      const excelData = patients.map((patient: Patient) => ({
        'Record Number': patient.record_number || '',
        Name: patient.name || '',
        Age: patient.age || '',
        Address: patient.address || '',
        'Phone Number': patient.phone_number || '',
        'Initial Diagnosis': patient.initial_diagnosis || '',
        'Created At': patient.created_at ? new Date(patient.created_at).toLocaleString() : ''
      }));

      // Create workbook and worksheet
      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Patients');

      // Set column widths
      const colWidths = [
        { wch: 15 }, // Record Number
        { wch: 30 }, // Name
        { wch: 8 }, // Age
        { wch: 40 }, // Address
        { wch: 15 }, // Phone Number
        { wch: 30 }, // Initial Diagnosis
        { wch: 20 } // Created At
      ];
      ws['!cols'] = colWidths;

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filename = `patients-export-${timestamp}.xlsx`;

      // Check if running in Tauri environment
      if (isTauriEnvironment()) {
        // Tauri environment - use native file dialog
        const dialogModule = await importTauriDialog();
        const fsModule = await importTauriFs();
        const { save } = dialogModule;
        const { writeFile } = fsModule;

        // Show save dialog
        const filePath = await (save as (options: unknown) => Promise<string | null>)({
          title: 'Export Patients to Excel',
          defaultPath: filename,
          filters: [
            {
              name: 'Excel Files',
              extensions: ['xlsx']
            },
            {
              name: 'All Files',
              extensions: ['*']
            }
          ]
        });

        if (filePath) {
          // Convert workbook to Excel file
          const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
          await (writeFile as (path: string, contents: ArrayBuffer) => Promise<void>)(
            filePath,
            excelBuffer
          );
          alertDialog.openDialog({
            title: 'Success',
            message: 'Patients data exported to Excel successfully!',
            buttonText: 'OK',
            variant: 'success'
          });
        }
      } else {
        // Web environment - use browser download
        XLSX.writeFile(wb, filename);
        alertDialog.openDialog({
          title: 'Success',
          message: 'Patients data exported to Excel successfully!',
          buttonText: 'OK',
          variant: 'success'
        });
      }
    } catch {
      alertDialog.openDialog({
        title: 'Error',
        message: 'Excel export failed. Please try again.',
        buttonText: 'OK',
        variant: 'danger'
      });
    }
  };

  const handleExportInvoicesToExcel = async () => {
    try {
      // Load invoices data using UnifiedStorage for consistency
      const invoices = await storage.getInvoices();

      if (invoices.length === 0) {
        alertDialog.openDialog({
          title: 'No Data',
          message: 'No invoice data available to export.',
          buttonText: 'OK',
          variant: 'info'
        });
        return;
      }

      // Prepare data for Excel export
      const excelData = invoices.map((invoice: Invoice) => ({
        'Invoice Number': invoice.invoiceNumber || '',
        'Patient Name': invoice.patientName || '',
        'Operator Name': invoice.operatorName || '',
        'Date & Time': invoice.date ? new Date(invoice.date).toLocaleString() : '',
        'Appointment Date': invoice.appointmentDate
          ? new Date(invoice.appointmentDate).toLocaleDateString()
          : '',
        'Total Amount': invoice.totalAmount || 0,
        Status: invoice.status || '',
        'Vital Signs - BP': invoice.vitalSigns?.bloodPressure || '',
        'Vital Signs - RR': invoice.vitalSigns?.respirationRate || '',
        'Vital Signs - HR': invoice.vitalSigns?.heartRate || '',
        'Vital Signs - Borg': invoice.vitalSigns?.borgScale || '',
        'Treatments Count': invoice.treatments?.length || 0,
        'Treatments List':
          invoice.treatments
            ?.map((t: Treatment) => `${t.name} (${formatCurrency(t.price)})`)
            .join(', ') || '',
        'Created At': invoice.created_at ? new Date(invoice.created_at).toLocaleString() : ''
      }));

      // Create workbook and worksheet
      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Invoices');

      // Set column widths
      const colWidths = [
        { wch: 15 }, // Invoice Number
        { wch: 25 }, // Patient Name
        { wch: 20 }, // Operator Name
        { wch: 20 }, // Date & Time
        { wch: 15 }, // Appointment Date
        { wch: 15 }, // Total Amount
        { wch: 10 }, // Status
        { wch: 12 }, // Vital Signs - BP
        { wch: 8 }, // Vital Signs - RR
        { wch: 8 }, // Vital Signs - HR
        { wch: 8 }, // Vital Signs - Borg
        { wch: 15 }, // Treatments Count
        { wch: 40 }, // Treatments List
        { wch: 20 } // Created At
      ];
      ws['!cols'] = colWidths;

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filename = `invoices-export-${timestamp}.xlsx`;

      // Check if running in Tauri environment
      if (isTauriEnvironment()) {
        // Tauri environment - use native file dialog
        const dialogModule = await importTauriDialog();
        const fsModule = await importTauriFs();
        const { save } = dialogModule;
        const { writeFile } = fsModule;

        // Show save dialog
        const filePath = await (save as (options: unknown) => Promise<string | null>)({
          title: 'Export Invoices to Excel',
          defaultPath: filename,
          filters: [
            {
              name: 'Excel Files',
              extensions: ['xlsx']
            },
            {
              name: 'All Files',
              extensions: ['*']
            }
          ]
        });

        if (filePath) {
          // Convert workbook to Excel file
          const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
          await (writeFile as (path: string, contents: ArrayBuffer) => Promise<void>)(
            filePath,
            excelBuffer
          );
          alertDialog.openDialog({
            title: 'Success',
            message: 'Invoices data exported to Excel successfully!',
            buttonText: 'OK',
            variant: 'success'
          });
        }
      } else {
        // Web environment - use browser download
        XLSX.writeFile(wb, filename);
        alertDialog.openDialog({
          title: 'Success',
          message: 'Invoices data exported to Excel successfully!',
          buttonText: 'OK',
          variant: 'success'
        });
      }
    } catch {
      alertDialog.openDialog({
        title: 'Error',
        message: 'Excel export failed. Please try again.',
        buttonText: 'OK',
        variant: 'danger'
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  
  const performDataDeletion = async () => {
    try {
      // 1. Clear UnifiedStorage (IndexedDB + localStorage)
      await storage.clear();

      // 2. Clear all memory caches
      memoryManager.clearAll();

      // 3. Clear SimpleDataService caches
      const serviceModule = SimpleDataService as { clearAllCaches?: () => void };
      if (serviceModule.clearAllCaches && typeof serviceModule.clearAllCaches === 'function') {
        serviceModule.clearAllCaches();
      }

      // 4. Clear all remaining localStorage data as fallback
      const allKeys = Object.keys(localStorage);
      let localStorageCleared = 0;

      allKeys.forEach(key => {
        // Keep only essential system keys
        if (!['currentUser', 'settings', 'medrec_dev_encryption_setup'].includes(key)) {
          localStorage.removeItem(key);
          localStorageCleared++;
        }
      });

      // 5. Clear session storage
      sessionStorage.clear();

      alertDialog.openDialog({
        title: '✅ Data Erased Successfully',
        message: 'All data has been successfully erased from ALL storage systems:\n\n' +
                   '• IndexedDB cleared\n' +
                   '• Memory cache cleared\n' +
                   `• localStorage cleared (${localStorageCleared} keys)\n` +
                   '• Session storage cleared\n' +
                   '• Service caches cleared\n\n' +
                   'The page will now reload to a fresh state.',
        variant: 'success'
      });

      // Give user time to see the success message before reloading
      setTimeout(() => {
        window.location.reload();
      }, 3000);

    } catch {
      alertDialog.openDialog({
        title: 'Failed',
        message: 'Failed to erase some data. Please try again or clear browser data manually.',
        variant: 'danger'
      });
    }
  };

  const handleEraseAllData = async () => {
    // Use the UI-based confirmation flow that's already implemented
    confirmDialog.openDialog({
      title: '⚠️ WARNING: Data Erasure',
      message: 'This will permanently delete ALL data from the application.\n\n' +
               'This includes:\n' +
               '• All patient records\n' +
               '• All appointments\n' +
               '• All invoices\n' +
               '• All treatments\n' +
               '• All operators\n' +
               '• All IndexedDB data\n' +
               '• All memory cache\n' +
               '• All localStorage data\n\n' +
               'This action cannot be undone!',
      variant: 'warning',
      confirmText: 'I Understand',
      onConfirm: () => {
        // Second confirmation with password-like requirement
        promptDialog.openDialog({
          title: 'Confirmation Required',
          message: 'To confirm you want to erase all data, please type "DELETE ALL DATA" exactly as shown:',
          defaultValue: '',
          placeholder: 'DELETE ALL DATA',
          confirmText: 'Confirm',
          cancelText: 'Cancel',
          onConfirm: (confirmText: string) => {
            if (confirmText !== 'DELETE ALL DATA') {
              alertDialog.openDialog({
                title: 'Cancelled',
                message: 'Confirmation text does not match. Data erasure cancelled.',
                buttonText: 'OK',
                variant: 'warning'
              });
              return;
            }

            // Final confirmation
            confirmDialog.openDialog({
              title: '🚨 FINAL WARNING: Permanent Data Deletion',
              message: 'You are about to permanently delete ALL application data from ALL storage systems.\n\n' +
                       'This includes:\n' +
                       '• IndexedDB (primary storage)\n' +
                       '• Memory cache\n' +
                       '• localStorage (fallback storage)\n' +
                       '• Any temporary data\n\n' +
                       'There is no way to recover this data after deletion.\n\n' +
                       'Are you absolutely sure you want to proceed?',
              confirmText: 'Delete Everything',
              cancelText: 'Cancel',
              variant: 'danger',
              onConfirm: async () => {
                await performDataDeletion();
              }
            });
          }
        });
      }
    });
  };

  return (
    <Box
      sx={{
        width: '100%',
        minHeight: '100%',
        p: { xs: 1, md: 2 },
        pt: { xs: 0, md: 2 },
        pr: { xs: 2, md: 2 },
        boxSizing: 'border-box',
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button
          variant='outlined'
          startDecorator={<ArrowBack />}
          onClick={() => navigate('/settings')}
          sx={{ borderRadius: 'sm' }}
        >
          Back to Settings
        </Button>
        <Typography level='h2'>Backup & Restore</Typography>
      </Box>

      <Card>
        <Box sx={{ mb: 4 }}>
          <Typography level='h4' sx={{ mb: 1 }}>
            Data Management
          </Typography>
          <Typography level='body-sm' sx={{ color: '#ffffff' }}>
            Export and import all your application data including operators, treatments, patients,
            appointments, and invoices.
          </Typography>
        </Box>

        <Stack spacing={3}>
          {/* Backup Section */}
          <Box sx={{ p: 3, backgroundColor: 'background.level1', borderRadius: 'sm' }}>
            <Typography level='h4' sx={{ mb: 2, color: '#ffffff' }}>
              📤 Backup Data
            </Typography>
            <Typography level='body-sm' sx={{ color: '#ffffff', mb: 3 }}>
              Export all application data to a JSON file for safekeeping or migration.
            </Typography>
            <Button
              variant='solid'
              color='primary'
              startDecorator={<Download />}
              onClick={handleBackup}
              sx={{ borderRadius: 'sm' }}
            >
              Create Backup
            </Button>
          </Box>

          {/* Restore Section */}
          <Box sx={{ p: 3, backgroundColor: 'background.level1', borderRadius: 'sm' }}>
            <Typography level='h4' sx={{ mb: 2, color: '#ffffff' }}>
              📥 Restore Data
            </Typography>
            <Typography level='body-sm' sx={{ color: '#ffffff', mb: 3 }}>
              Import application data from a previously created JSON backup file. The enhanced
              restore system handles files of any size and provides better performance and
              reliability.
            </Typography>

            <Button
              variant='solid'
              color='primary'
              startDecorator={<Upload sx={{ color: '#ffffff' }} />}
              onClick={() => setShowEnhancedRestore(true)}
              sx={{ borderRadius: 'sm' }}
            >
              Restore from JSON Backup
            </Button>

            <Typography level='body-xs' sx={{ color: '#ffffff', opacity: 0.8, mt: 2 }}>
              💡 Optimized for all file sizes with chunked processing and memory management
            </Typography>
          </Box>

          {/* Erase All Data Section */}
          <Box
            sx={{
              p: 3,
              backgroundColor: 'danger.softBg',
              borderRadius: 'sm',
              border: '1px solid',
              borderColor: 'danger.outlinedBorder'
            }}
          >
            <Typography level='h4' sx={{ mb: 2, color: 'danger.plainColor' }}>
              🗑️ Erase All Data
            </Typography>
            <Typography level='body-sm' sx={{ color: 'danger.plainColor', mb: 3 }}>
              Permanently delete ALL application data from ALL storage systems. This action cannot
              be undone and will remove all patients, appointments, invoices, treatments, operators,
              IndexedDB data, memory caches, and localStorage data.
            </Typography>
            <Button
              variant='solid'
              color='danger'
              onClick={handleEraseAllData}
              sx={{
                borderRadius: 'sm',
                backgroundColor: '#dc2626',
                '&:hover': {
                  backgroundColor: '#b91c1c'
                }
              }}
            >
              Erase All Data
            </Button>
          </Box>

          {/* Excel Export Section */}
          <Box sx={{ p: 3, backgroundColor: 'background.level1', borderRadius: 'sm' }}>
            <Typography level='h4' sx={{ mb: 2, color: '#ffffff' }}>
              📊 Export to Excel
            </Typography>
            <Typography level='body-sm' sx={{ color: '#ffffff', mb: 3 }}>
              Export data to Excel format for analysis or reporting.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant='solid'
                color='success'
                startDecorator={<Download />}
                onClick={handleExportToExcel}
                sx={{ borderRadius: 'sm' }}
              >
                Export Patients to Excel
              </Button>
              <Button
                variant='solid'
                color='primary'
                startDecorator={<Download />}
                onClick={handleExportInvoicesToExcel}
                sx={{ borderRadius: 'sm' }}
              >
                Export Invoices to Excel
              </Button>
            </Box>
          </Box>

          {/* Important Notice */}
          <Box
            sx={{
              p: 3,
              backgroundColor: 'warning.softBg',
              borderRadius: 'sm',
              border: '1px solid',
              borderColor: 'warning.outlinedBorder'
            }}
          >
            <Typography
              level='body-sm'
              sx={{ color: 'warning.plainColor', fontWeight: 'bold', mb: 1 }}
            >
              ⚠️ Important Notice
            </Typography>
            <Typography level='body-xs' sx={{ color: 'warning.plainColor' }}>
              • Create regular backups to prevent data loss
              <br />
              • Restoring data will overwrite all existing data
              <br />
              • Test restore on a copy before replacing production data
              <br />
              • Keep backup files in a secure location
              <br />
              • Excel exports are read-only and cannot be imported back into the system
              <br />•{' '}
              <strong>
                Erase All Data will permanently delete ALL data from ALL storage systems (IndexedDB,
                memory cache, localStorage, session storage)
              </strong>
              <br />•{' '}
              <strong>
                Erase All Data cannot be undone and will wipe every storage mechanism used by the
                application
              </strong>
              <br />• Always create a backup before using the Erase All Data feature
            </Typography>
          </Box>
        </Stack>
      </Card>

      <EnhancedRestoreDialog
        open={showEnhancedRestore}
        onClose={() => setShowEnhancedRestore(false)}
        onSuccess={() => {
          // Handle successful restore
        }}
      />

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={confirmDialog.isOpen}
        onClose={confirmDialog.closeDialog}
        onConfirm={confirmDialog.handleConfirm}
        title={confirmDialog.config.title}
        message={confirmDialog.config.message}
        confirmText={confirmDialog.config.confirmText}
        cancelText={confirmDialog.config.cancelText}
        variant={confirmDialog.config.variant}
      />

      {/* Alert Dialog */}
      <AlertDialog
        open={alertDialog.isOpen}
        onClose={alertDialog.closeDialog}
        title={alertDialog.config.title}
        message={alertDialog.config.message}
        buttonText={alertDialog.config.buttonText}
        variant={alertDialog.config.variant}
      />

      {/* Prompt Dialog */}
      <PromptDialog
        open={promptDialog.isOpen}
        onClose={promptDialog.closeDialog}
        title={promptDialog.config.title}
        message={promptDialog.config.message}
        defaultValue={promptDialog.config.defaultValue}
        placeholder={promptDialog.config.placeholder}
        confirmText={promptDialog.config.confirmText}
        cancelText={promptDialog.config.cancelText}
        onConfirm={promptDialog.handleConfirm}
      />
    </Box>
  );
};

export default BackupRestoreSettings;
