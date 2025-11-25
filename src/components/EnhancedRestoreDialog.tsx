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
  const [_error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleDebugData = async () => {

    try {

      await DataService.debugDataSources();


      // Test retrieving patients
      await DataService.getPatients();


    } catch { // Error handled silently
    }
  };

  const handleClearStorage = async () => {
    setShowClearConfirm(true);
  };

  const confirmClearStorage = async () => {
    setShowClearConfirm(false);
    try {
      // Clear UnifiedStorage (handles both IndexedDB and localStorage)
      await storage.clear();

      // Show success message
      setError(null);
      setProgress({
        stage: 'Storage Cleared',
        progress: 100,
        total: 100,
        current: 'All data has been cleared. You can now try restoring the backup file again.'
      });

      setTimeout(() => {
        setProgress(null);
      }, 3000);
    } catch {
      // Show error message
      setError('Failed to clear storage. Please try refreshing the page.');
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

  
    // Check file size and quota
    const canHandle = await ChunkedDataRestore.canHandleFileSize(file.size);
    if (!canHandle.canHandle) {
      const errorMessage = `${canHandle.reason}${canHandle.recommendation ? '\n\n💡 ' + canHandle.recommendation : ''}\n\n🧹 Tip: Use the "Clear Storage" button to remove existing data and free up space.`;
      setError(errorMessage);

      return;
    }

    setSelectedFile(file);
    setError(null);

  };

  const handleRestore = async () => {
    if (!selectedFile) return;

    setIsRestoring(true);
    setError(null);
    setProgress(null);

    try {

      await ChunkedDataRestore.restoreFromLargeFile(selectedFile, progressUpdate => {
        setProgress(progressUpdate);

      });

      // Success

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

      let errorMessage = err instanceof Error ? err.message : 'Restore failed';

      // Add helpful guidance for quota exceeded errors
      if (
        errorMessage.includes('quota') ||
        errorMessage.includes('storage') ||
        errorMessage.includes('space')
      ) {
        errorMessage +=
          '\n\n💡 To fix this:\n1. Click "🧹 Clear Storage" to remove existing data\n2. Try restoring again\n3. Or use a smaller backup file';
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
    <>
      <Modal open={open} onClose={handleClose}>
        <ModalDialog sx={{ minWidth: 500, maxWidth: 600 }}>
          <DialogTitle>Enhanced Data Restore</DialogTitle>

          <DialogContent>
            <Stack spacing={3}>
              <Typography level='body-sm'>
                This enhanced restore system can handle large datasets (100,000+ records) by
                processing data in chunks.
              </Typography>

              {!isRestoring && !progress && (
                <Box>
                  <input
                    type='file'
                    accept='.json'
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                    id='enhanced-restore-file-input'
                  />
                  <label htmlFor='enhanced-restore-file-input'>
                    <Button component='span' variant='outlined' fullWidth>
                      Select Backup File
                    </Button>
                  </label>

                  {selectedFile && (
                    <Box sx={{ mt: 2 }}>
                      <Typography level='body-sm'>
                        <strong>Selected:</strong> {selectedFile.name}
                      </Typography>
                      <Typography level='body-sm'>
                        <strong>Size:</strong> {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}

              {_error && <Alert color='danger'>{_error}</Alert>}

              {progress && (
                <Box>
                  <Typography level='body-sm' fontWeight='bold'>
                    {progress.stage}
                  </Typography>
                  <LinearProgress determinate value={progress.progress} sx={{ my: 1 }} />
                  <Typography level='body-sm' sx={{ color: 'text.secondary' }}>
                    {progress.current}
                  </Typography>
                  <Typography level='body-xs' sx={{ color: 'text.secondary' }}>
                    {progress.progress}% complete
                  </Typography>
                </Box>
              )}

              {!isRestoring && selectedFile && (
                <Alert color='warning'>
                  ⚠️ This will overwrite all existing data. This action cannot be undone.
                </Alert>
              )}
            </Stack>
          </DialogContent>

          <DialogActions>
            <Button variant='plain' color='neutral' onClick={handleClose} disabled={isRestoring}>
              {isRestoring ? 'Restoring...' : 'Cancel'}
            </Button>

            <Button
              variant='outlined'
              color='warning'
              onClick={handleDebugData}
              disabled={isRestoring}
            >
              🔍 Debug Data
            </Button>

            <Button
              variant='outlined'
              color='danger'
              onClick={handleClearStorage}
              disabled={isRestoring}
            >
              🧹 Clear Storage
            </Button>

            {!isRestoring && selectedFile && (
              <Button color='primary' onClick={handleRestore}>
                Start Restore
              </Button>
            )}
          </DialogActions>
        </ModalDialog>
      </Modal>

      {/* Confirmation Dialog for Clear Storage */}
      <Modal open={showClearConfirm} onClose={() => setShowClearConfirm(false)}>
        <ModalDialog sx={{ minWidth: 400 }}>
          <DialogTitle color="danger">Clear All Data?</DialogTitle>
          <DialogContent>
            <Typography level="body-sm">
              Are you sure you want to clear all existing data? This will remove all patients, operators, appointments, and invoices. This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button variant="plain" color="neutral" onClick={() => setShowClearConfirm(false)}>
              Cancel
            </Button>
            <Button color="danger" onClick={confirmClearStorage}>
              Clear All Data
            </Button>
          </DialogActions>
        </ModalDialog>
      </Modal>
    </>
  );
};
