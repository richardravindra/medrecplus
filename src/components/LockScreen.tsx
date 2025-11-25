import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  FormLabel,
  Input,
  Typography,
  Alert,
  CircularProgress,
  Modal,
  ModalDialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/joy';
import { useSecurity } from '../hooks/useSecurity';
import { storage } from '../services/UnifiedStorage';

export const LockScreen: React.FC = () => {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [_error, setError] = useState('');
  const [emergencyStep, setEmergencyStep] = useState(0); // 0: closed, 1: first warning, 2: type confirmation, 3: final confirmation
  const [typeConfirmInput, setTypeConfirmInput] = useState('');

  const { failedAttempts, remainingLockoutTime, unlockApp, recordActivity } = useSecurity();

  const handleUnlock = async () => {
    if (!password.trim()) {
      setError('Please enter your password');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Use SecurityContext's unlockApp function for both development and production
      const success = await unlockApp(password);

      if (!success) {
        if (remainingLockoutTime > 0) {
          const minutes = Math.ceil(remainingLockoutTime / (60 * 1000));
          setError(
            `Too many failed attempts. Please try again in ${minutes} minute${minutes > 1 ? 's' : ''}.`
          );
        } else {
          const remaining = 5 - failedAttempts;
          setError(`Invalid password. ${remaining} attempt${remaining > 1 ? 's' : ''} remaining.`);
        }
      } else {
        // Unlock successful - record activity and update state
        recordActivity();
      }
    } catch {
      setError('An error occurred while trying to unlock. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (milliseconds: number): string => {
    const minutes = Math.floor(milliseconds / (60 * 1000));
    const seconds = Math.floor((milliseconds % (60 * 1000)) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleUnlock();
    }
  };

  const handleEmergencyUnlock = () => {
    setEmergencyStep(1);
    setTypeConfirmInput('');
  };

  const confirmEmergencyUnlock = async () => {
    try {
      // Clear all security-related data
      await storage.clearPassword();
      await storage.clearEncryptionSetup();

      // Clear all application data from localStorage
      const keysToKeep = ['medrec_theme_preference']; // Keep minimal non-sensitive settings
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && !keysToKeep.includes(key)) {
          localStorage.removeItem(key);
        }
      }

      // Clear sessionStorage as well
      sessionStorage.clear();

      // Show success message and reload
      setEmergencyStep(4); // success state
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    } catch {
      setError('Emergency unlock failed. Please clear browser data manually.');
      setEmergencyStep(5); // error state
    }
  };

  const cancelEmergencyUnlock = () => {
    setEmergencyStep(0);
    setTypeConfirmInput('');
  };

  const handleFirstConfirm = () => {
    setEmergencyStep(2);
  };

  const handleTypeConfirm = () => {
    if (typeConfirmInput === 'DELETE ALL DATA') {
      setEmergencyStep(3);
    } else {
      // Show error and stay on type confirmation step
      setError('Emergency unlock cancelled. Confirmation text did not match exactly.');
      setTimeout(() => setError(''), 3000);
    }
  };

  // Record activity to prevent screen reader issues
  useEffect(() => {
    const interval = setInterval(recordActivity, 30 * 1000); // Every 30 seconds
    return () => clearInterval(interval);
  }, [recordActivity]);

  return (
    <>
      <Box
        sx={{
          width: '100vw',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0a0a0a',
          backgroundImage: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 9999
        }}
      >
        <Card
          sx={{
            width: '90%',
            maxWidth: 400,
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            backgroundColor: 'rgba(30, 30, 30, 0.95)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Typography
              level='h2'
              sx={{
                mb: 1,
                textAlign: 'center',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1
              }}
            >
              🔒 Application Locked
            </Typography>

            <Typography
              level='body-sm'
              sx={{
                mb: 3,
                textAlign: 'center',
                color: '#999'
              }}
            >
              Enter your password to unlock the application and access patient records.
            </Typography>

            {_error && (
              <Alert color='danger' sx={{ mb: 3 }}>
                {_error}
              </Alert>
            )}

            {remainingLockoutTime > 0 ? (
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <CircularProgress
                  size='lg'
                  determinate
                  value={(remainingLockoutTime / (30 * 60 * 1000)) * 100}
                  sx={{ mb: 2 }}
                >
                  {formatTime(remainingLockoutTime)}
                </CircularProgress>
                <Typography level='body-sm' sx={{ color: '#999' }}>
                  Please wait before trying again
                </Typography>
              </Box>
            ) : (
              <>
                <FormControl sx={{ mb: 3 }}>
                  <FormLabel sx={{ color: '#ffffff', mb: 1 }}>Password</FormLabel>
                  <Input
                    type='password'
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder='Enter your password'
                    autoFocus
                    sx={{
                      backgroundColor: '#2d2d2d',
                      color: '#ffffff',
                      '& input': { color: '#ffffff' },
                      '&::placeholder': { color: '#666' }
                    }}
                    disabled={isLoading}
                  />
                </FormControl>

                <Button
                  fullWidth
                  size='lg'
                  onClick={handleUnlock}
                  disabled={isLoading || !password.trim()}
                  sx={{
                    backgroundColor: '#1976d2',
                    '&:hover': { backgroundColor: '#1565c0' },
                    '&:disabled': { backgroundColor: '#444' }
                  }}
                >
                  {isLoading ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CircularProgress size='sm' />
                      Unlocking...
                    </Box>
                  ) : (
                    'Unlock Application'
                  )}
                </Button>
              </>
            )}

            {failedAttempts > 0 && remainingLockoutTime === 0 && (
              <Typography
                level='body-sm'
                sx={{
                  mt: 2,
                  color: '#ff6b6b',
                  textAlign: 'center',
                  fontSize: '12px'
                }}
              >
                Security: {failedAttempts}/5 failed attempts
              </Typography>
            )}

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography level='body-sm' sx={{ color: '#666', fontSize: '11px' }}>
                <strong>Security Notice:</strong>
                <br />
                This application automatically locks after 15 minutes of inactivity
                <br />
                to protect sensitive patient information.
              </Typography>

              {typeof window !== 'undefined' && !('__TAURI__' in window) && (
                <Box sx={{ mt: 2 }}>
                  <Button
                    variant='plain'
                    size='sm'
                    onClick={handleEmergencyUnlock}
                    sx={{
                      color: '#ff6b6b',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      textDecoration: 'underline',
                      '&:hover': {
                        color: '#ff5252',
                        backgroundColor: 'rgba(255, 107, 107, 0.1)'
                      }
                    }}
                  >
                    Emergency Unlock
                  </Button>
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Emergency Unlock Modals */}

      {/* Step 1: First Warning */}
      <Modal open={emergencyStep === 1} onClose={cancelEmergencyUnlock}>
        <ModalDialog sx={{ minWidth: 450 }}>
          <DialogTitle color="warning">⚠️ EMERGENCY UNLOCK WARNING</DialogTitle>
          <DialogContent>
            <Typography level="body-sm">
              This is a critical emergency operation that will permanently erase all application data including:
            </Typography>
            <Box sx={{ mt: 2, pl: 2 }}>
              <Typography level="body-sm">• All patient records</Typography>
              <Typography level="body-sm">• All appointments and invoices</Typography>
              <Typography level="body-sm">• Security settings and encryption</Typography>
              <Typography level="body-sm">• All user preferences and settings</Typography>
            </Box>
            <Typography level="body-sm" sx={{ mt: 2, fontWeight: 'bold', color: 'warning.600' }}>
              This action CANNOT be undone.
            </Typography>
            <Typography level="body-sm" sx={{ mt: 2 }}>
              Do you want to proceed with the Emergency Unlock?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button variant="plain" color="neutral" onClick={cancelEmergencyUnlock}>
              Cancel
            </Button>
            <Button color="warning" onClick={handleFirstConfirm}>
              Proceed to Emergency Unlock
            </Button>
          </DialogActions>
        </ModalDialog>
      </Modal>

      {/* Step 2: Type Confirmation */}
      <Modal open={emergencyStep === 2} onClose={cancelEmergencyUnlock}>
        <ModalDialog sx={{ minWidth: 450 }}>
          <DialogTitle color="danger">🚨 FINAL CONFIRMATION</DialogTitle>
          <DialogContent>
            <Typography level="body-sm">
              To confirm you understand the consequences, type "DELETE ALL DATA" exactly as shown:
            </Typography>
            <Input
              value={typeConfirmInput}
              onChange={(e) => setTypeConfirmInput(e.target.value)}
              placeholder="Type DELETE ALL DATA"
              sx={{ mt: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button variant="plain" color="neutral" onClick={cancelEmergencyUnlock}>
              Cancel
            </Button>
            <Button color="danger" onClick={handleTypeConfirm}>
              Confirm Deletion
            </Button>
          </DialogActions>
        </ModalDialog>
      </Modal>

      {/* Step 3: Final Warning */}
      <Modal open={emergencyStep === 3} onClose={cancelEmergencyUnlock}>
        <ModalDialog sx={{ minWidth: 450 }}>
          <DialogTitle color="danger">🔴 IRREVERSIBLE ACTION CONFIRMATION</DialogTitle>
          <DialogContent>
            <Typography level="body-sm">
              You are about to permanently delete ALL application data.
            </Typography>
            <Typography level="body-sm" sx={{ mt: 2, fontWeight: 'bold' }}>
              This will:
            </Typography>
            <Box sx={{ mt: 1, pl: 2 }}>
              <Typography level="body-sm">✓ Erase all patient information</Typography>
              <Typography level="body-sm">✓ Delete all appointments and invoices</Typography>
              <Typography level="body-sm">✓ Remove all encryption keys</Typography>
              <Typography level="body-sm">✓ Reset the entire application</Typography>
            </Box>
            <Typography level="body-sm" sx={{ mt: 2, fontWeight: 'bold', color: 'danger.600' }}>
              There is NO WAY to recover this data after deletion.
            </Typography>
            <Typography level="body-sm" sx={{ mt: 2 }}>
              Are you absolutely certain you want to continue?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button variant="plain" color="neutral" onClick={cancelEmergencyUnlock}>
              Cancel
            </Button>
            <Button color="danger" onClick={confirmEmergencyUnlock}>
              Permanently Delete All Data
            </Button>
          </DialogActions>
        </ModalDialog>
      </Modal>

      {/* Step 4: Success */}
      <Modal open={emergencyStep === 4}>
        <ModalDialog sx={{ minWidth: 400 }}>
          <DialogTitle color="success">✅ Emergency Unlock Completed</DialogTitle>
          <DialogContent>
            <Typography level="body-sm">
              All application data has been permanently erased.
            </Typography>
            <Typography level="body-sm" sx={{ mt: 2 }}>
              The application will now reload to the initial setup screen.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button color="success">
              Reloading...
            </Button>
          </DialogActions>
        </ModalDialog>
      </Modal>

      {/* Step 5: Error */}
      <Modal open={emergencyStep === 5} onClose={cancelEmergencyUnlock}>
        <ModalDialog sx={{ minWidth: 450 }}>
          <DialogTitle color="danger">❌ Emergency Unlock Failed</DialogTitle>
          <DialogContent>
            <Typography level="body-sm">
              The automatic data clearing failed.
            </Typography>
            <Typography level="body-sm" sx={{ mt: 2 }}>
              Please manually clear your browser data and storage to complete the emergency unlock process.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button color="neutral" onClick={cancelEmergencyUnlock}>
              Close
            </Button>
          </DialogActions>
        </ModalDialog>
      </Modal>
    </>
  );
};
