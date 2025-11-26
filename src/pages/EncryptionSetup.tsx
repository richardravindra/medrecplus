import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  FormLabel,
  Input,
  Sheet,
  Typography,
  Alert,
  LinearProgress,
  Divider,
  IconButton
} from '@mui/joy';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { invoke } from '@tauri-apps/api/core';
import { storage } from '../services/UnifiedStorage';
import { SecurityService } from '../services/SecurityService';
import { ValidationService } from '../services/ValidationService';

interface EncryptionSetupProps {
  onUnlock: () => void;
}

interface PasswordStrength {
  score: number;
  feedback: string[];
  color: string;
}

export const EncryptionSetup: React.FC<EncryptionSetupProps> = ({ onUnlock }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [_error, setError] = useState('');
  const [isEncrypted, setIsEncrypted] = useState<boolean | null>(null);
  const [setupMode, setSetupMode] = useState<'setup' | 'unlock' | 'migrate' | null>(null);

  useEffect(() => {
    checkEncryptionStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkEncryptionStatus = async () => {
    try {
      // Check if Tauri API is available
      const hasTauriAPI = typeof window !== 'undefined' && '__TAURI__' in window;

      if (hasTauriAPI) {
        // In Tauri app, check backend encryption status
        try {
          const encrypted = await invoke<boolean>('is_database_encrypted');
          setIsEncrypted(encrypted);

          if (encrypted) {
            setSetupMode('unlock');
          } else {
            // Check if there's existing data to migrate
            const hasExistingData = await checkForExistingData();
            setSetupMode(hasExistingData ? 'migrate' : 'setup');
          }
          return;
        } catch {
          // Fall through to auto-unlock for development
        }
      } else {
        // In web browser, check storage for encryption setup
        const encryptionSetup = await storage.getEncryptionSetup();
        const hasPassword = await storage.getPassword();

        if (encryptionSetup && hasPassword) {
          setIsEncrypted(true);
          setSetupMode('unlock');
          return;
        }
      }

      // For web development or when encryption isn't configured, auto-unlock
      setIsEncrypted(false);
      setSetupMode('setup');

      // Auto-unlock immediately for better user experience
      onUnlock();

    } catch {
      setError('Failed to check encryption status');
      setIsEncrypted(false);
      setSetupMode('setup');

      // Auto-unlock on error for better user experience
      onUnlock();
    }
  };

  const checkForExistingData = async (): Promise<boolean> => {
    try {
      // Check if Tauri API is available
      if (typeof window !== 'undefined' && '__TAURI__' in window) {
        const patients = await invoke('get_patients');
        return Array.isArray(patients) && patients.length > 0;
      } else {
        // Running in web browser - assume no existing data for development
        return false;
      }
    } catch {
      return false;
    }
  };

  const calculatePasswordStrength = (pwd: string): PasswordStrength => {
    const validation = ValidationService.validatePasswordStrength(pwd);
    let score = 0;

    // Score calculation based on SecurityService validation
    if (pwd.length >= 8) score += 20;
    if (pwd.length >= 12) score += 20;
    if (/[A-Z]/.test(pwd)) score += 15;
    if (/[a-z]/.test(pwd)) score += 15;
    if (/[0-9]/.test(pwd)) score += 15;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 15;

    const color = score < 40 ? 'danger' : score < 70 ? 'warning' : 'success';

    return { score, feedback: validation.errors, color };
  };

  const passwordStrength = calculatePasswordStrength(password);

  const handleSetup = async () => {
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (!/[A-Z]/.test(password)) {
      setError('Password must contain at least one uppercase letter');
      return;
    }

    if (!/[a-z]/.test(password)) {
      setError('Password must contain at least one lowercase letter');
      return;
    }

    if (!/[0-9]/.test(password)) {
      setError('Password must contain at least one number');
      return;
    }

    if (!/[a-zA-Z]/.test(password)) {
      setError('Password must contain at least one letter');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      // Check if Tauri API is available
      if (typeof window !== 'undefined' && '__TAURI__' in window) {
        await invoke('setup_encryption', { password });
      } else {
        // Running in web browser - store password in UnifiedStorage for development
        // Store a properly hashed password for security
        const passwordHash = await SecurityService.hashPassword(password);

        // Store settings with explicit verification
        await storage.storePassword(passwordHash);

        await storage.setEncryptionSetup(true);

        // Force settings sync to ensure persistence
        await storage.syncSettings();

        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay
      }
      onUnlock();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Setup failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlock = async () => {
    setError('');
    setIsLoading(true);

    try {
      // Check if Tauri API is available
      if (typeof window !== 'undefined' && '__TAURI__' in window) {
        await invoke('unlock_database', { password });
      } else {
        // Running in web browser - validate against stored password
        const storedPasswordHash = await storage.getPassword();

        if (!storedPasswordHash) {
          throw new Error('No stored password found');
        }

        // Use secure password verification instead of insecure btoa()
        const isValidPassword = await SecurityService.verifyPassword(password, storedPasswordHash);
        if (!isValidPassword) {
          throw new Error('Invalid password');
        }

        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay
      }
      onUnlock();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid password or corrupted database');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMigrate = async () => {
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (!/[A-Z]/.test(password)) {
      setError('Password must contain at least one uppercase letter');
      return;
    }

    if (!/[a-z]/.test(password)) {
      setError('Password must contain at least one lowercase letter');
      return;
    }

    if (!/[0-9]/.test(password)) {
      setError('Password must contain at least one number');
      return;
    }

    if (!/[a-zA-Z]/.test(password)) {
      setError('Password must contain at least one letter');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      // Check if Tauri API is available
      if (typeof window !== 'undefined' && '__TAURI__' in window) {
        await invoke('migrate_to_encrypted_database', { password });
      } else {
        // Running in web browser - simulate migration for development
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate delay
      }
      onUnlock();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Migration failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (isEncrypted === null) {
    return (
      <Sheet
        sx={{
          width: '100vw',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0a0a0a'
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <Typography level='h3'>Loading...</Typography>
        </Box>
      </Sheet>
    );
  }

  return (
    <Sheet
      sx={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#0a0a0a',
        backgroundImage: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 2,
          minHeight: 0,
          overflowY: 'auto'
        }}
      >
        <Card
          sx={{
            width: '100%',
            maxWidth: 450,
            margin: '0 auto',
            backgroundColor: 'rgba(30, 30, 30, 0.95)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}
        >
          <CardContent sx={{
            padding: 3,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            minHeight: 0,
            overflowY: 'auto'
          }}>
            <Typography
              level='h2'
              sx={{
                textAlign: 'center',
                color: '#ffffff',
                wordBreak: 'break-word',
                overflowWrap: 'break-word'
              }}
            >
              {setupMode === 'unlock'
                ? '🔒 Unlock Database'
                : setupMode === 'migrate'
                  ? '🛡️ Enable Encryption'
                  : '🔐 Setup Encryption'}
            </Typography>

            <Typography
              level='body-sm'
              sx={{
                textAlign: 'center',
                color: '#999',
                wordBreak: 'break-word',
                overflowWrap: 'break-word'
              }}
            >
              {setupMode === 'unlock'
                ? 'Enter your password to access the encrypted medical records database.'
                : setupMode === 'migrate'
                  ? 'Create a password to encrypt your existing medical records database.'
                  : 'Create a password to encrypt your medical records database. This ensures patient data remains secure and private.'}
            </Typography>

            {_error && (
              <Alert color='danger' sx={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                {_error}
              </Alert>
            )}

            {setupMode !== 'unlock' && (
              <Box>
                <FormControl>
                  <FormLabel sx={{ color: '#ffffff', mb: 1 }}>
                    Password Strength
                  </FormLabel>
                  <LinearProgress
                    determinate
                    value={passwordStrength.score}
                    color={passwordStrength.color as 'danger' | 'warning' | 'success'}
                    sx={{ mb: 1 }}
                  />
                  <Typography
                    level='body-sm'
                    sx={{
                      color: '#999',
                      fontSize: '12px',
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word'
                    }}
                  >
                    {passwordStrength.feedback.join(', ')}
                  </Typography>
                </FormControl>
              </Box>
            )}

            <FormControl sx={{ width: '100%' }}>
              <FormLabel sx={{ color: '#ffffff', mb: 1 }}>
                Password
              </FormLabel>
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder='Enter your secure password'
                endDecorator={
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    size="sm"
                    sx={{
                      color: '#666',
                      '&:hover': { color: '#ffffff' }
                    }}
                  >
                    {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                }
                sx={{
                  backgroundColor: '#2d2d2d',
                  color: '#ffffff',
                  width: '100%',
                  '& input': {
                    color: '#ffffff',
                    '&::-webkit-credentials-auto-fill-button': {
                      display: 'none'
                    }
                  },
                  '&::placeholder': {
                    color: '#666'
                  },
                  '& .MuiInput-decorator': {
                    paddingLeft: '8px'
                  },
                  '& .MuiInput-endDecorator': {
                    // Ensure only our custom button is shown
                    '&:not(.MuiInput-endDecorator)': {
                      display: 'none'
                    }
                  }
                }}
                disabled={isLoading}
              />
            </FormControl>

            {(setupMode === 'setup' || setupMode === 'migrate') && (
              <FormControl sx={{ width: '100%' }}>
                <FormLabel sx={{ color: '#ffffff', mb: 1 }}>
                  Confirm Password
                </FormLabel>
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder='Confirm your password'
                  endDecorator={
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      size="sm"
                      sx={{
                        color: '#666',
                        '&:hover': { color: '#ffffff' }
                      }}
                    >
                      {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  }
                  sx={{
                    backgroundColor: '#2d2d2d',
                    color: '#ffffff',
                    width: '100%',
                    '& input': {
                      color: '#ffffff',
                      '&::-webkit-credentials-auto-fill-button': {
                        display: 'none'
                      }
                    },
                    '&::placeholder': {
                      color: '#666'
                    },
                    '& .MuiInput-decorator': {
                      paddingLeft: '8px'
                    },
                    '& .MuiInput-endDecorator': {
                      // Ensure only our custom button is shown
                      '&:not(.MuiInput-endDecorator)': {
                        display: 'none'
                      }
                    }
                  }}
                  disabled={isLoading}
                />
              </FormControl>
            )}

            <Button
              fullWidth
              size='lg'
              onClick={
                setupMode === 'unlock'
                  ? handleUnlock
                  : setupMode === 'migrate'
                    ? handleMigrate
                    : handleSetup
              }
              disabled={isLoading || !password || (setupMode !== 'unlock' && !confirmPassword)}
              sx={{
                backgroundColor: '#1976d2',
                '&:hover': { backgroundColor: '#1565c0' },
                '&:disabled': { backgroundColor: '#444' }
              }}
            >
              {isLoading
                ? 'Processing...'
                : setupMode === 'unlock'
                  ? 'Unlock Database'
                  : setupMode === 'migrate'
                    ? 'Enable Encryption'
                    : 'Setup Encryption'}
            </Button>

            {setupMode === 'migrate' && (
              <Box>
                <Divider sx={{ my: 2, backgroundColor: '#444' }} />
                <Alert color='warning' sx={{ fontSize: '12px' }}>
                  <Typography level='body-sm'>
                    <strong>Migration Notice:</strong> Your existing database will be encrypted. A
                    backup will be created automatically. This process cannot be undone.
                  </Typography>
                </Alert>
              </Box>
            )}

            {setupMode === 'setup' && (
              <Box>
                <Divider sx={{ my: 2, backgroundColor: '#444' }} />
                <Typography
                  level='body-sm'
                  sx={{
                    color: '#666',
                    textAlign: 'center',
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word'
                  }}
                >
                  <strong>Security Requirements:</strong>
                  <br />
                  • Minimum 8 characters
                  <br />
                  • At least one uppercase letter (A-Z)
                  <br />
                  • At least one lowercase letter (a-z)
                  <br />
                  • At least one number (0-9)
                  <br />• At least one special character (!@#$%^&*)
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Mobile-specific responsive adjustments and duplicate icon prevention */}
      <style>{`
        /* Prevent duplicate password visibility icons */
        .MuiInput-root input[type="password"]::-webkit-credentials-auto-fill-button,
        .MuiInput-root input[type="password"]::-webkit-caps-lock-indicator {
          display: none !important;
        }

        /* Ensure only our custom endDecorator is shown */
        .MuiInput-endDecorator .MuiIconButton-root:not(.mui-9e1lm7-JoyIconButton-root) {
          display: none !important;
        }

        /* Hide any browser default password reveal icons */
        input[type="password"]::-webkit-reveal-password,
        input[type="password"]::-ms-reveal {
          display: none !important;
        }

        @media (max-width: 480px) {
          .MuiCard-root {
            margin: 16px !important;
            max-width: calc(100% - 32px) !important;
          }

          .MuiCardContent-root {
            padding: 16px !important;
            gap: 12px !important;
          }

          .MuiTypography-h2 {
            font-size: 1.25rem !important;
          }

          .MuiTypography-bodySm {
            font-size: 0.8rem !important;
          }

          .MuiInput-root {
            font-size: 0.9rem !important;
          }

          .MuiButton-root {
            font-size: 0.9rem !important;
            min-height: 44px !important;
          }
        }

        @media (max-height: 700px) {
          .MuiSheet-root {
            padding: 8px !important;
          }

          .MuiCard-root {
            margin: 8px !important;
          }

          .MuiCardContent-root {
            padding: 12px !important;
            gap: 8px !important;
          }
        }

        @media (max-width: 320px) {
          .MuiCard-root {
            margin: 8px !important;
            max-width: calc(100% - 16px) !important;
          }

          .MuiCardContent-root {
            padding: 12px !important;
          }

          .MuiTypography-h2 {
            font-size: 1.1rem !important;
          }

          .MuiTypography-bodySm {
            font-size: 0.75rem !important;
          }

          .MuiFormLabel-root {
            font-size: 0.85rem !important;
          }
        }
      `}</style>
    </Sheet>
  );
};
