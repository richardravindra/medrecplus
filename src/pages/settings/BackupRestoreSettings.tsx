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
import { isTauriEnvironment, importTauriDialog, importTauriFs } from '../../utils/tauriUtils';
import { Patient, Invoice } from '../../types';
import { EnhancedRestoreDialog } from '../../components/EnhancedRestoreDialog';

interface Treatment {
  id: number;
  name: string;
  price: number;
  notes?: string;
}

const BackupRestoreSettings: React.FC = () => {
  const navigate = useNavigate();
  const [showEnhancedRestore, setShowEnhancedRestore] = useState(false);

  const handleBackup = async () => {
    try {
      // Collect all data
      const backupData = {
        operators: JSON.parse(localStorage.getItem('operators') || '[]'),
        treatments: JSON.parse(localStorage.getItem('treatments') || '[]'),
        patients: JSON.parse(localStorage.getItem('patient_management_data') || '[]'),
        appointments: JSON.parse(localStorage.getItem('appointments') || '[]'),
        invoices: JSON.parse(localStorage.getItem('invoices') || '[]'),
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
          await (writeFile as (path: string, contents: string) => Promise<void>)(filePath, jsonString);
          alert('Backup created successfully!');
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

        alert('Backup created successfully!');
      }
    } catch (error) {
      console.error('Backup failed:', error);
      alert('Backup failed. Please try again.');
    }
  };

  const handleExportToExcel = async () => {
    try {
      // Load patients data
      const patientsRaw = localStorage.getItem('patient_management_data');
      const patients = JSON.parse(patientsRaw || '[]');

      if (patients.length === 0) {
        alert('No patient data available to export.');
        return;
      }

      // Prepare data for Excel export
      const excelData = patients.map((patient: Patient) => ({
        'Record Number': patient.record_number || '',
        'Name': patient.name || '',
        'Age': patient.age || '',
        'Address': patient.address || '',
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
        { wch: 8 },  // Age
        { wch: 40 }, // Address
        { wch: 15 }, // Phone Number
        { wch: 30 }, // Initial Diagnosis
        { wch: 20 }  // Created At
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
          await (writeFile as (path: string, contents: ArrayBuffer) => Promise<void>)(filePath, excelBuffer);
          alert('Patients data exported to Excel successfully!');
        }
      } else {
        // Web environment - use browser download
        XLSX.writeFile(wb, filename);
        alert('Patients data exported to Excel successfully!');
      }
    } catch (error) {
      console.error('Excel export failed:', error);
      alert('Excel export failed. Please try again.');
    }
  };

  const handleExportInvoicesToExcel = async () => {
    try {
      // Load invoices data
      const invoicesRaw = localStorage.getItem('invoices');
      const invoices = JSON.parse(invoicesRaw || '[]');

      if (invoices.length === 0) {
        alert('No invoice data available to export.');
        return;
      }

      // Prepare data for Excel export
      const excelData = invoices.map((invoice: Invoice) => ({
        'Invoice Number': invoice.invoiceNumber || '',
        'Patient Name': invoice.patientName || '',
        'Operator Name': invoice.operatorName || '',
        'Date & Time': invoice.date ? new Date(invoice.date).toLocaleString() : '',
        'Appointment Date': invoice.appointmentDate ? new Date(invoice.appointmentDate).toLocaleDateString() : '',
        'Total Amount': invoice.totalAmount || 0,
        'Status': invoice.status || '',
        'Vital Signs - BP': invoice.vitalSigns?.bloodPressure || '',
        'Vital Signs - RR': invoice.vitalSigns?.respirationRate || '',
        'Vital Signs - HR': invoice.vitalSigns?.heartRate || '',
        'Vital Signs - Borg': invoice.vitalSigns?.borgScale || '',
        'Treatments Count': invoice.treatments?.length || 0,
        'Treatments List': invoice.treatments?.map((t: Treatment) => `${t.name} (${formatCurrency(t.price)})`).join(', ') || '',
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
        { wch: 8 },  // Vital Signs - RR
        { wch: 8 },  // Vital Signs - HR
        { wch: 8 },  // Vital Signs - Borg
        { wch: 15 }, // Treatments Count
        { wch: 40 }, // Treatments List
        { wch: 20 }  // Created At
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
          await (writeFile as (path: string, contents: ArrayBuffer) => Promise<void>)(filePath, excelBuffer);
          alert('Invoices data exported to Excel successfully!');
        }
      } else {
        // Web environment - use browser download
        XLSX.writeFile(wb, filename);
        alert('Invoices data exported to Excel successfully!');
      }
    } catch (error) {
      console.error('Excel export failed:', error);
      alert('Excel export failed. Please try again.');
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

  const handleEraseAllData = async () => {
    try {
      // First confirmation with warning about data loss
      const confirm1 = confirm(
        '⚠️ WARNING: This will permanently delete ALL data from the application.\n\n' +
        'This includes:\n' +
        '• All patient records\n' +
        '• All appointments\n' +
        '• All invoices\n' +
        '• All treatments\n' +
        '• All operators\n\n' +
        'This action cannot be undone!\n\n' +
        'Click OK to continue, or Cancel to abort.'
      );

      if (!confirm1) return;

      // Second confirmation with password-like requirement
      const confirmText = prompt(
        'To confirm you want to erase all data, please type "DELETE ALL DATA" exactly as shown:'
      );

      if (confirmText !== 'DELETE ALL DATA') {
        alert('Confirmation text does not match. Data erasure cancelled.');
        return;
      }

      // Final confirmation
      const confirm2 = confirm(
        '🚨 FINAL WARNING: You are about to permanently delete ALL application data.\n\n' +
        'There is no way to recover this data after deletion.\n\n' +
        'Are you absolutely sure you want to proceed?'
      );

      if (!confirm2) return;

      // Clear all localStorage data
      const keysToRemove = [
        'operators',
        'treatments',
        'patient_management_data',
        'appointments',
        'invoices',
        'settings',
        'currentUser'
      ];

      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });

      // Clear any additional data that might exist
      const allKeys = Object.keys(localStorage);
      allKeys.forEach(key => {
        if (key.includes('patient_') ||
            key.includes('appointment_') ||
            key.includes('invoice_') ||
            key.includes('treatment_') ||
            key.includes('operator_') ||
            key.includes('temp_') ||
            key.includes('cache_')) {
          localStorage.removeItem(key);
        }
      });

      alert('✅ All data has been successfully erased. The page will now reload.');

      // Reload the page to clear any in-memory data
      window.location.reload();

    } catch (error) {
      console.error('Data erasure failed:', error);
      alert('❌ An error occurred while erasing data. Some data may remain. Please try again or contact support.');
    }
  };

  const handleRestore = async () => {
    try {
      // Check if running in Tauri environment
      if (isTauriEnvironment()) {
        // Tauri environment - use native file dialog
        const dialogModule = await importTauriDialog();
        const fsModule = await importTauriFs();
        const { open } = dialogModule;
        const { readFile } = fsModule;

        // Show open dialog
        const selectedPath = await (open as (options: unknown) => Promise<string | null>)({
          title: 'Select Backup File',
          multiple: false,
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

        if (selectedPath) {
          // Read the selected file using Tauri's API
          const content = await (readFile as (path: string) => Promise<string>)(selectedPath);
          const backupData = JSON.parse(content);

          // Validate backup structure
          if (!backupData.operators || !backupData.treatments || !backupData.patients ||
              !backupData.appointments || !backupData.invoices) {
            throw new Error('Invalid backup file structure');
          }

          // Confirm restore
          if (confirm('Are you sure you want to restore this backup? This will overwrite all existing data.')) {
            // Restore data to localStorage
            localStorage.setItem('operators', JSON.stringify(backupData.operators));
            localStorage.setItem('treatments', JSON.stringify(backupData.treatments));
            localStorage.setItem('patient_management_data', JSON.stringify(backupData.patients));
            localStorage.setItem('appointments', JSON.stringify(backupData.appointments));
            localStorage.setItem('invoices', JSON.stringify(backupData.invoices));

            alert('Backup restored successfully! The page will be refreshed.');
            window.location.reload();
          }
        }
      } else {
        // Web environment - use file input
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';

        input.onchange = (event) => {
          const file = (event.target as HTMLInputElement).files?.[0];
          if (!file) return;

          const reader = new FileReader();
          reader.onload = (e) => {
            try {
              const content = e.target?.result as string;
              const backupData = JSON.parse(content);

              // Validate backup structure
              if (!backupData.operators || !backupData.treatments || !backupData.patients ||
                  !backupData.appointments || !backupData.invoices) {
                throw new Error('Invalid backup file structure');
              }

              // Confirm restore
              if (confirm('Are you sure you want to restore this backup? This will overwrite all existing data.')) {
                // Restore data to localStorage
                localStorage.setItem('operators', JSON.stringify(backupData.operators));
                localStorage.setItem('treatments', JSON.stringify(backupData.treatments));
                localStorage.setItem('patient_management_data', JSON.stringify(backupData.patients));
                localStorage.setItem('appointments', JSON.stringify(backupData.appointments));
                localStorage.setItem('invoices', JSON.stringify(backupData.invoices));

                alert('Backup restored successfully! The page will be refreshed.');
                window.location.reload();
              }
            } catch (error) {
              console.error('Restore failed:', error);
              alert('Restore failed. Please ensure you selected a valid backup file.');
            }
          };

          reader.readAsText(file);
        };

        // Trigger file selection dialog
        input.click();
      }
    } catch (error) {
      console.error('Restore failed:', error);
      alert('Restore failed. Please ensure you selected a valid backup file.');
    }
  };

  return (
    <Box sx={{
      width: '100%',
      minHeight: '100%',
      p: { xs: 1, md: 2 },
      pt: { xs: 0, md: 2 },
      pr: { xs: 2, md: 2 },
      boxSizing: 'border-box',
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button
          variant="outlined"
          startDecorator={<ArrowBack />}
          onClick={() => navigate('/settings')}
          sx={{ borderRadius: 'sm' }}
        >
          Back to Settings
        </Button>
        <Typography level="h2">Backup & Restore</Typography>
      </Box>

      <Card>
        <Box sx={{ mb: 4 }}>
          <Typography level="h4" sx={{ mb: 1 }}>Data Management</Typography>
          <Typography level="body-sm" sx={{ color: '#ffffff' }}>
            Export and import all your application data including operators, treatments, patients, appointments, and invoices.
          </Typography>
        </Box>

        <Stack spacing={3}>
          {/* Backup Section */}
          <Box sx={{ p: 3, backgroundColor: 'background.level1', borderRadius: 'sm' }}>
            <Typography level="h4" sx={{ mb: 2, color: '#ffffff' }}>
              📤 Backup Data
            </Typography>
            <Typography level="body-sm" sx={{ color: '#ffffff', mb: 3 }}>
              Export all application data to a JSON file for safekeeping or migration.
            </Typography>
            <Button
              variant="solid"
              color="primary"
              startDecorator={<Download />}
              onClick={handleBackup}
              sx={{ borderRadius: 'sm' }}
            >
              Create Backup
            </Button>
          </Box>

          {/* Restore Section */}
          <Box sx={{ p: 3, backgroundColor: 'background.level1', borderRadius: 'sm' }}>
            <Typography level="h4" sx={{ mb: 2, color: '#ffffff' }}>
              📥 Restore Data
            </Typography>
            <Typography level="body-sm" sx={{ color: '#ffffff', mb: 2 }}>
              Import application data from a previously created JSON backup file.
            </Typography>

            <Stack spacing={2} sx={{ mb: 2 }}>
              <Button
                variant="solid"
                color="primary"
                startDecorator={<Upload sx={{ color: '#ffffff' }} />}
                onClick={() => setShowEnhancedRestore(true)}
                sx={{ borderRadius: 'sm' }}
              >
                🚀 Enhanced Restore (Large Files)
              </Button>

              <Button
                variant="outlined"
                color="neutral"
                startDecorator={<Upload sx={{ color: '#ffffff' }} />}
                onClick={handleRestore}
                sx={{ borderRadius: 'sm' }}
              >
                Standard Restore (Small Files)
              </Button>
            </Stack>

            <Typography level="body-xs" sx={{ color: '#ffffff', opacity: 0.8 }}>
              💡 Use Enhanced Restore for files with 1000+ records or files larger than 1MB
            </Typography>
          </Box>

          {/* Erase All Data Section */}
          <Box sx={{
            p: 3,
            backgroundColor: 'danger.softBg',
            borderRadius: 'sm',
            border: '1px solid',
            borderColor: 'danger.outlinedBorder'
          }}>
            <Typography level="h4" sx={{ mb: 2, color: 'danger.plainColor' }}>
              🗑️ Erase All Data
            </Typography>
            <Typography level="body-sm" sx={{ color: 'danger.plainColor', mb: 3 }}>
              Permanently delete all application data. This action cannot be undone and will remove all patients, appointments, invoices, treatments, and operators.
            </Typography>
            <Button
              variant="solid"
              color="danger"
              onClick={handleEraseAllData}
              sx={{
                borderRadius: 'sm',
                backgroundColor: '#dc2626',
                '&:hover': {
                  backgroundColor: '#b91c1c',
                }
              }}
            >
              Erase All Data
            </Button>
          </Box>

          {/* Excel Export Section */}
          <Box sx={{ p: 3, backgroundColor: 'background.level1', borderRadius: 'sm' }}>
            <Typography level="h4" sx={{ mb: 2, color: '#ffffff' }}>
              📊 Export to Excel
            </Typography>
            <Typography level="body-sm" sx={{ color: '#ffffff', mb: 3 }}>
              Export data to Excel format for analysis or reporting.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="solid"
                color="success"
                startDecorator={<Download />}
                onClick={handleExportToExcel}
                sx={{ borderRadius: 'sm' }}
              >
                Export Patients to Excel
              </Button>
              <Button
                variant="solid"
                color="primary"
                startDecorator={<Download />}
                onClick={handleExportInvoicesToExcel}
                sx={{ borderRadius: 'sm' }}
              >
                Export Invoices to Excel
              </Button>
            </Box>
          </Box>

          {/* Important Notice */}
          <Box sx={{ p: 3, backgroundColor: 'warning.softBg', borderRadius: 'sm', border: '1px solid', borderColor: 'warning.outlinedBorder' }}>
            <Typography level="body-sm" sx={{ color: 'warning.plainColor', fontWeight: 'bold', mb: 1 }}>
              ⚠️ Important Notice
            </Typography>
            <Typography level="body-xs" sx={{ color: 'warning.plainColor' }}>
              • Create regular backups to prevent data loss<br />
              • Restoring data will overwrite all existing data<br />
              • Test restore on a copy before replacing production data<br />
              • Keep backup files in a secure location<br />
              • Excel exports are read-only and cannot be imported back into the system<br />
              • Erase All Data will permanently delete everything and cannot be undone<br />
              • Always create a backup before using the Erase All Data feature
            </Typography>
          </Box>
        </Stack>
      </Card>

      <EnhancedRestoreDialog
        open={showEnhancedRestore}
        onClose={() => setShowEnhancedRestore(false)}
        onSuccess={() => {
          // Handle successful restore
          console.log('Enhanced restore completed successfully');
        }}
      />
    </Box>
  );
};

export default BackupRestoreSettings;