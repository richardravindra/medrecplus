import React, { useState } from 'react';
import {
  Modal,
  ModalDialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  LinearProgress,
  Typography,
  Box,
  Alert,
  Stack
} from '@mui/joy';
import { ChunkedDataRestore } from '../utils/ChunkedDataRestore';
import { DataService } from '../services/DataService';
import { storage } from '../services/UnifiedStorage';

interface RestoreProgress {
  stage: string;
  progress: number;
  total: number;
  current: string;
}

interface EnhancedRestoreDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const EnhancedRestoreDialog: React.FC<EnhancedRestoreDialogProps> = ({
  open,
  onClose,
  onSuccess
}) => {
  const [isRestoring, setIsRestoring] = useState(false);
  const [progress, setProgress] = useState<RestoreProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleDebugData = async () => {
    console.log('🔍 Debug button clicked! Starting data debugging...');
    try {
      console.log('📍 Step 1: Debugging data sources...');
      await DataService.debugDataSources();

      console.log('📍 Step 2: Testing patient retrieval...');
      // Test retrieving patients
      const patients = await DataService.getPatients();
      console.log(`📊 Retrieved ${patients.length} patients`);

      if (patients.length > 0) {
        console.log('Sample patient:', patients[0]);
      }

      console.log('📍 Step 3: Testing other data types...');
      const operators = await DataService.getData('operators');
      const treatments = await DataService.getData('treatments');
      const appointments = await DataService.getData('appointments');
      const invoices = await DataService.getData('invoices');

      console.log(`👥 Operators: ${operators.length}`);
      console.log(`💊 Treatments: ${treatments.length}`);
      console.log(`📅 Appointments: ${appointments.length}`);
      console.log(`🧾 Invoices: ${invoices.length}`);

      if (appointments.length > 0) {
        console.log('Sample appointment:', appointments[0]);
      }
      if (invoices.length > 0) {
        console.log('Sample invoice:', invoices[0]);
      }

      console.log('✅ Debug completed successfully!');
    } catch (error) {
      console.error('❌ Debug error:', error);
    }
  };

  const handleClearStorage = async () => {
    if (window.confirm('Are you sure you want to clear all existing data? This will remove all patients, operators, appointments, and invoices. This action cannot be undone.')) {
      try {
        console.log('🧹 Clearing all storage...');

        // Clear UnifiedStorage (handles both IndexedDB and localStorage)
        await storage.clear();
        console.log('✅ UnifiedStorage cleared');

        console.log('🧹 All storage cleared successfully!');
        alert('All data has been cleared. You can now try restoring the backup file again.');

      } catch (error) {
        console.error('❌ Error clearing storage:', error);
        alert('Failed to clear storage. Please try refreshing the page.');
      }
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log(`📁 Selected file: ${file.name} (${Math.round(file.size / 1024 / 1024)}MB)`);

    // Get current storage info
    try {
      const storageInfo = await storage.getStorageInfo();
      console.log(`💾 Current storage: ${JSON.stringify(storageInfo)}`);

      // UnifiedStorage doesn't provide quota info, so we'll proceed optimistically
      console.log(`📊 Using UnifiedStorage with preferred storage: ${storageInfo.preferredStorage}`);
    } catch (error) {
      console.warn('Could not get storage info:', error);
    }

    // Check file size and quota
    const canHandle = await ChunkedDataRestore.canHandleFileSize(file.size);
    if (!canHandle.canHandle) {
      const errorMessage = `${canHandle.reason}${canHandle.recommendation ? '\n\n💡 ' + canHandle.recommendation : ''}\n\n🧹 Tip: Use the "Clear Storage" button to remove existing data and free up space.`;
      setError(errorMessage);
      console.error('❌ Quota check failed:', errorMessage);
      return;
    }

    setSelectedFile(file);
    setError(null);
    console.log('✅ File passed quota check, ready to restore');
  };

  const handleRestore = async () => {
    if (!selectedFile) return;

    setIsRestoring(true);
    setError(null);
    setProgress(null);

    try {
      console.log(`🚀 Starting restore of ${selectedFile.name}...`);
      await ChunkedDataRestore.restoreFromLargeFile(
        selectedFile,
        (progressUpdate) => {
          setProgress(progressUpdate);
          console.log(`📊 Progress: ${progressUpdate.stage} - ${progressUpdate.current}`);
        }
      );

      // Success
      console.log('✅ Restore completed successfully!');
      setProgress({
        stage: 'Complete',
        progress: 100,
        total: 100,
        current: 'Restore completed! Reloading application...'
      });

      setTimeout(() => {
        onSuccess();
        window.location.reload();
      }, 2000);

    } catch (err) {
      console.error('❌ Restore failed:', err);
      let errorMessage = err instanceof Error ? err.message : 'Restore failed';

      // Add helpful guidance for quota exceeded errors
      if (errorMessage.includes('quota') || errorMessage.includes('storage') || errorMessage.includes('space')) {
        errorMessage += '\n\n💡 To fix this:\n1. Click "🧹 Clear Storage" to remove existing data\n2. Try restoring again\n3. Or use a smaller backup file';
      }

      setError(errorMessage);
      setIsRestoring(false);
    }
  };

  const handleClose = () => {
    if (!isRestoring) {
      onClose();
      setProgress(null);
      setError(null);
      setSelectedFile(null);
    }
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <ModalDialog sx={{ minWidth: 500, maxWidth: 600 }}>
        <DialogTitle>Enhanced Data Restore</DialogTitle>

        <DialogContent>
          <Stack spacing={3}>
            <Typography level="body-sm">
              This enhanced restore system can handle large datasets (100,000+ records) by processing data in chunks.
            </Typography>

            {!isRestoring && !progress && (
              <Box>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                  id="enhanced-restore-file-input"
                />
                <label htmlFor="enhanced-restore-file-input">
                  <Button
                    component="span"
                    variant="outlined"
                    fullWidth
                  >
                    Select Backup File
                  </Button>
                </label>

                {selectedFile && (
                  <Box sx={{ mt: 2 }}>
                    <Typography level="body-sm">
                      <strong>Selected:</strong> {selectedFile.name}
                    </Typography>
                    <Typography level="body-sm">
                      <strong>Size:</strong> {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </Typography>
                  </Box>
                )}
              </Box>
            )}

            {error && (
              <Alert color="danger">
                {error}
              </Alert>
            )}

            {progress && (
              <Box>
                <Typography level="body-sm" fontWeight="bold">
                  {progress.stage}
                </Typography>
                <LinearProgress
                  determinate
                  value={progress.progress}
                  sx={{ my: 1 }}
                />
                <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
                  {progress.current}
                </Typography>
                <Typography level="body-xs" sx={{ color: 'text.secondary' }}>
                  {progress.progress}% complete
                </Typography>
              </Box>
            )}

            {!isRestoring && selectedFile && (
              <Alert color="warning">
                ⚠️ This will overwrite all existing data. This action cannot be undone.
              </Alert>
            )}
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button
            variant="plain"
            color="neutral"
            onClick={handleClose}
            disabled={isRestoring}
          >
            {isRestoring ? 'Restoring...' : 'Cancel'}
          </Button>

          <Button
            variant="outlined"
            color="warning"
            onClick={handleDebugData}
            disabled={isRestoring}
          >
            🔍 Debug Data
          </Button>

          <Button
            variant="outlined"
            color="danger"
            onClick={handleClearStorage}
            disabled={isRestoring}
          >
            🧹 Clear Storage
          </Button>

          {!isRestoring && selectedFile && (
            <Button
              color="primary"
              onClick={handleRestore}
            >
              Start Restore
            </Button>
          )}
        </DialogActions>
      </ModalDialog>
    </Modal>
  );
};