import { useState } from 'react';
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
} from '@mui/joy';
import { useSecurity } from '../hooks/useSecurity';
import { storage } from '../services/UnifiedStorage';

export const LockScreen: React.FC = () => {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const {
    failedAttempts,
    remainingLockoutTime,
    unlockApp,
    recordActivity
  } = useSecurity();

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
          setError(`Too many failed attempts. Please try again in ${minutes} minute${minutes > 1 ? 's' : ''}.`);
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

  const handleEmergencyUnlock = async () => {
    if (confirm('⚠️ Emergency unlock will clear all security settings and reset encryption. Are you sure?')) {
      try {
        // Clear all security-related data
        await storage.clearPassword();
        await storage.clearEncryptionSetup();

        // Clear lock state from localStorage
        localStorage.removeItem('medrec_app_locked');
        localStorage.removeItem('medrec_lock_time');

        // Reload the page to show encryption setup
        window.location.reload();
      } catch (error) {
        console.error('Emergency unlock failed:', error);
        setError('Emergency unlock failed. Please clear browser data manually.');
      }
    }
  };

  // Record activity to prevent screen reader issues
  useState(() => {
    const interval = setInterval(recordActivity, 30 * 1000); // Every 30 seconds
    return () => clearInterval(interval);
  });

  return (
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
        zIndex: 9999,
      }}
    >
      <Card
        sx={{
          width: '90%',
          maxWidth: 400,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          backgroundColor: 'rgba(30, 30, 30, 0.95)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Typography
            level="h2"
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
            level="body-sm"
            sx={{
              mb: 3,
              textAlign: 'center',
              color: '#999'
            }}
          >
            Enter your password to unlock the application and access patient records.
          </Typography>

          {error && (
            <Alert color="danger" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {remainingLockoutTime > 0 ? (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <CircularProgress
                size="lg"
                determinate
                value={(remainingLockoutTime / (30 * 60 * 1000)) * 100}
                sx={{ mb: 2 }}
              >
                {formatTime(remainingLockoutTime)}
              </CircularProgress>
              <Typography level="body-sm" sx={{ color: '#999' }}>
                Please wait before trying again
              </Typography>
            </Box>
          ) : (
            <>
              <FormControl sx={{ mb: 3 }}>
                <FormLabel sx={{ color: '#ffffff', mb: 1 }}>Password</FormLabel>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter your password"
                  autoFocus
                  sx={{
                    backgroundColor: '#2d2d2d',
                    color: '#ffffff',
                    '& input': { color: '#ffffff' },
                    '&::placeholder': { color: '#666' },
                  }}
                  disabled={isLoading}
                />
              </FormControl>

              <Button
                fullWidth
                size="lg"
                onClick={handleUnlock}
                disabled={isLoading || !password.trim()}
                sx={{
                  backgroundColor: '#1976d2',
                  '&:hover': { backgroundColor: '#1565c0' },
                  '&:disabled': { backgroundColor: '#444' },
                }}
              >
                {isLoading ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size="sm" />
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
              level="body-sm"
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
            <Typography level="body-sm" sx={{ color: '#666', fontSize: '11px' }}>
              <strong>Security Notice:</strong><br/>
              This application automatically locks after 15 minutes of inactivity<br/>
              to protect sensitive patient information.
            </Typography>

            {typeof window !== 'undefined' && !('__TAURI__' in window) && (
              <Box sx={{ mt: 2 }}>
                <Button
                  variant="plain"
                  size="sm"
                  onClick={handleEmergencyUnlock}
                  sx={{
                    color: '#666',
                    fontSize: '10px',
                    textDecoration: 'underline',
                    '&:hover': { color: '#999' }
                  }}
                >
                  Emergency Unlock (Development Only)
                </Button>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};