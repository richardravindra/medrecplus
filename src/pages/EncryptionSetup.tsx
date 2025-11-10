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
  Divider
} from '@mui/joy';
import { invoke } from '@tauri-apps/api/core';
import { storage } from '../services/UnifiedStorage';

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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isEncrypted, setIsEncrypted] = useState<boolean | null>(null);
  const [setupMode, setSetupMode] = useState<'setup' | 'unlock' | 'migrate' | null>(null);

  useEffect(() => {
    checkEncryptionStatus();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkEncryptionStatus = async () => {
    try {
      // Check if Tauri API is available (not running in web browser)
      if (typeof window !== 'undefined' && '__TAURI__' in window) {
        const encrypted = await invoke<boolean>('is_database_encrypted');
        setIsEncrypted(encrypted);

        if (encrypted) {
          setSetupMode('unlock');
        } else {
          // Check if there's existing data to migrate
          const hasExistingData = await checkForExistingData();
          setSetupMode(hasExistingData ? 'migrate' : 'setup');
        }
      } else {
        // Running in web browser - check UnifiedStorage for setup state
        console.log('Running in web browser - checking UnifiedStorage for setup state');
        const isSetupComplete = await storage.getEncryptionSetup();
        const hasStoredPassword = await storage.getPassword();

        if (isSetupComplete && hasStoredPassword) {
          setIsEncrypted(true);
          setSetupMode('unlock');
        } else {
          setIsEncrypted(false);
          setSetupMode('setup'); // Show setup mode for first-time setup
        }
      }
    } catch (err) {
      console.error('Failed to check encryption status:', err);
      setError('Failed to check encryption status');
      setIsEncrypted(false);
      setSetupMode('setup');
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
    const feedback: string[] = [];
    let score = 0;

    if (pwd.length >= 8) score += 20;
    else feedback.push('At least 8 characters');

    if (pwd.length >= 12) score += 20;
    else feedback.push('12+ characters for stronger security');

    if (/[A-Z]/.test(pwd)) score += 15;
    else feedback.push('One uppercase letter');

    if (/[a-z]/.test(pwd)) score += 15;
    else feedback.push('One lowercase letter');

    if (/[0-9]/.test(pwd)) score += 15;
    else feedback.push('One number');

    if (/[^A-Za-z0-9]/.test(pwd)) score += 15;
    else feedback.push('One special character');

    const color = score < 40 ? 'danger' : score < 70 ? 'warning' : 'success';

    return { score, feedback, color };
  };

  const passwordStrength = calculatePasswordStrength(password);

  const handleSetup = async () => {
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
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
        console.log('Running in web browser - storing password in UnifiedStorage');
        // Store a simple hash of the password (not secure for production, but OK for dev testing)
        const passwordHash = btoa(password); // Simple encoding for dev testing

        // Store settings with explicit verification
        await storage.storePassword(passwordHash);
        console.log('✅ Password stored');

        await storage.setEncryptionSetup(true);
        console.log('✅ Encryption setup flag stored');

        // Force settings sync to ensure persistence
        await storage.syncSettings();
        console.log('✅ Settings sync completed');

        // Verify the settings were stored correctly
        const verifyPassword = await storage.getPassword();
        const verifySetup = await storage.getEncryptionSetup();
        console.log('🔍 Verification after storage:', {
          hasPassword: !!verifyPassword,
          isSetupComplete: verifySetup
        });

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
        console.log('Running in web browser - validating password against UnifiedStorage');
        const storedPasswordHash = await storage.getPassword();

        if (!storedPasswordHash) {
          throw new Error('No stored password found');
        }

        const enteredPasswordHash = btoa(password);

        if (enteredPasswordHash !== storedPasswordHash) {
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
        console.log('Running in web browser - simulating database migration');
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
          <Typography level="h3">Loading...</Typography>
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
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0a0a0a',
        backgroundImage: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)'
      }}
    >
      <Card
        sx={{
          width: '90%',
          maxWidth: 450,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          backgroundColor: 'rgba(30, 30, 30, 0.95)',
          backdropFilter: 'blur(10px)'
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Typography level="h2" sx={{ mb: 1, textAlign: 'center', color: '#ffffff' }}>
            {setupMode === 'unlock' ? '🔒 Unlock Database' :
             setupMode === 'migrate' ? '🛡️ Enable Encryption' :
             '🔐 Setup Encryption'}
          </Typography>

          <Typography level="body-sm" sx={{ mb: 3, textAlign: 'center', color: '#999' }}>
            {setupMode === 'unlock' ?
              'Enter your password to access the encrypted medical records database.' :
              setupMode === 'migrate' ?
              'Create a password to encrypt your existing medical records database.' :
              'Create a password to encrypt your medical records database. This ensures patient data remains secure and private.'
            }
          </Typography>

          {error && (
            <Alert color="danger" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {setupMode !== 'unlock' && (
            <Box sx={{ mb: 3 }}>
              <FormControl>
                <FormLabel sx={{ color: '#ffffff', mb: 1 }}>Password Strength</FormLabel>
                <LinearProgress
                  determinate
                  value={passwordStrength.score}
                  color={passwordStrength.color as 'danger' | 'warning' | 'success'}
                  sx={{ mb: 1 }}
                />
                <Typography level="body-sm" sx={{ color: '#999', fontSize: '12px' }}>
                  {passwordStrength.feedback.join(', ')}
                </Typography>
              </FormControl>
            </Box>
          )}

          <FormControl sx={{ mb: 3 }}>
            <FormLabel sx={{ color: '#ffffff', mb: 1 }}>Password</FormLabel>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your secure password"
              sx={{
                backgroundColor: '#2d2d2d',
                color: '#ffffff',
                '& input': { color: '#ffffff' },
                '&::placeholder': { color: '#666' }
              }}
              disabled={isLoading}
            />
          </FormControl>

          {(setupMode === 'setup' || setupMode === 'migrate') && (
            <FormControl sx={{ mb: 3 }}>
              <FormLabel sx={{ color: '#ffffff', mb: 1 }}>Confirm Password</FormLabel>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                sx={{
                  backgroundColor: '#2d2d2d',
                  color: '#ffffff',
                  '& input': { color: '#ffffff' },
                  '&::placeholder': { color: '#666' }
                }}
                disabled={isLoading}
              />
            </FormControl>
          )}

          <Button
            fullWidth
            size="lg"
            onClick={setupMode === 'unlock' ? handleUnlock :
                    setupMode === 'migrate' ? handleMigrate : handleSetup}
            disabled={isLoading || !password || (setupMode !== 'unlock' && !confirmPassword)}
            sx={{
              backgroundColor: '#1976d2',
              '&:hover': { backgroundColor: '#1565c0' },
              '&:disabled': { backgroundColor: '#444' }
            }}
          >
            {isLoading ? (
              'Processing...'
            ) : (
              setupMode === 'unlock' ? 'Unlock Database' :
              setupMode === 'migrate' ? 'Enable Encryption' :
              'Setup Encryption'
            )}
          </Button>

          {setupMode === 'migrate' && (
            <Box sx={{ mt: 2 }}>
              <Divider sx={{ my: 2, backgroundColor: '#444' }} />
              <Alert color="warning" sx={{ fontSize: '12px' }}>
                <Typography level="body-sm">
                  <strong>Migration Notice:</strong> Your existing database will be encrypted.
                  A backup will be created automatically. This process cannot be undone.
                </Typography>
              </Alert>
            </Box>
          )}

          {setupMode === 'setup' && (
            <Box sx={{ mt: 3 }}>
              <Divider sx={{ my: 2, backgroundColor: '#444' }} />
              <Typography level="body-sm" sx={{ color: '#666', textAlign: 'center' }}>
                <strong>Security Requirements:</strong><br/>
                • Minimum 8 characters<br/>
                • At least one number<br/>
                • At least one letter<br/>
                • Special characters recommended
              </Typography>

              {/* Development reset button */}
              {typeof window !== 'undefined' && !('__TAURI__' in window) && (
                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="outlined"
                    size="sm"
                    onClick={async () => {
                      await storage.clearPassword();
                      await storage.clearEncryptionSetup();
                      window.location.reload();
                    }}
                    sx={{
                      width: '100%',
                      borderColor: '#666',
                      color: '#666',
                      '&:hover': {
                        borderColor: '#888',
                        color: '#888',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)'
                      }
                    }}
                  >
                    🔄 Reset Encryption (Dev Mode)
                  </Button>
                  <Typography level="body-xs" sx={{ color: '#444', textAlign: 'center', mt: 1 }}>
                    Clear stored encryption and start over
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </CardContent>
      </Card>
    </Sheet>
  );
};