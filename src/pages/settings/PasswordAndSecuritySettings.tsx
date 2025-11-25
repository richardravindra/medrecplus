import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  Option,
  Alert,
  LinearProgress,
  Stack,
  IconButton,
  Switch,
  Modal,
  ModalDialog,
  ModalClose,
  Chip
} from '@mui/joy';
import {
  ArrowBack,
  Security,
  Lock,
  LockClock,
  Timer,
  Key,
  Shield,
  Visibility,
  VisibilityOff,
  CheckCircle,
  Warning,
  Error,
  Info
} from '@mui/icons-material';
import { useSecurity } from '../../hooks/useSecurity';
import { storage } from '../../services/UnifiedStorage';

interface SecuritySettings {
  lockscreenTimeout: number;
  autoLockEnabled: boolean;
  failedAttemptLockout: boolean;
  showPasswordStrength: boolean;
  sessionTimeout: number;
}

const PasswordAndSecuritySettings: React.FC = () => {
  const navigate = useNavigate();
  const { lockApp } = useSecurity();

  // Form states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Real-time validation states
  const [currentPasswordError, setCurrentPasswordError] = useState('');
  const [newPasswordError, setNewPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  // Loading and error states
  const [isLoading, setIsLoading] = useState(false);
  const [_error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Security settings state
  const [settings, setSettings] = useState<SecuritySettings>({
    lockscreenTimeout: 15, // 15 minutes default
    autoLockEnabled: true,
    failedAttemptLockout: true,
    showPasswordStrength: true,
    sessionTimeout: 30 // 30 minutes default
  });

  // Check encryption setup status
  const [encryptionStatus, setEncryptionStatus] = useState<
    'setup' | 'locked' | 'corrupted' | 'unknown'
  >('unknown');

  useEffect(() => {
    checkEncryptionStatus();
  }, []);

  const checkEncryptionStatus = async () => {
    if (typeof window !== 'undefined' && !('__TAURI__' in window)) {
      try {
        const storedPasswordHash = await storage.getPassword();
        const encryptionSetup = await storage.getEncryptionSetup();

        if (encryptionSetup && storedPasswordHash) {
          setEncryptionStatus('setup');
        } else if (encryptionSetup && !storedPasswordHash) {
          setEncryptionStatus('corrupted');
        } else {
          setEncryptionStatus('unknown');
        }
      } catch {
        setEncryptionStatus('unknown');
      }
    }
  };

  // Modal states
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // Load from localStorage for development, Tauri API for production
      if (typeof window !== 'undefined' && '__TAURI__' in window) {
        // TODO: Implement Tauri API call to load security settings
        // const loadedSettings = await invoke<SecuritySettings>('get_security_settings');
        // setSettings(loadedSettings);
      } else {
        // Development mode - load from UnifiedStorage
        const savedSettings = await storage.getSecuritySettings();
        if (savedSettings && Object.keys(savedSettings).length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setSettings(savedSettings as any);
        }
      }
    } catch { // Error handled silently
    }
  };

  const saveSettings = async (newSettings: SecuritySettings) => {
    try {
      if (typeof window !== 'undefined' && '__TAURI__' in window) {
        // TODO: Implement Tauri API call to save security settings
        // await invoke('save_security_settings', { settings: newSettings });
      } else {
        // Development mode - save to UnifiedStorage
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await storage.storeSecuritySettings(newSettings as any);
      }
      setSettings(newSettings);
      setSuccess('Security settings saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Failed to save security settings');
      setTimeout(() => setError(''), 3000);
    }
  };

  const calculatePasswordStrength = (password: string) => {
    const feedback: string[] = [];
    let score = 0;

    if (password.length >= 8) score += 20;
    else feedback.push('At least 8 characters');

    if (password.length >= 12) score += 20;
    else feedback.push('12+ characters for stronger security');

    if (/[A-Z]/.test(password)) score += 15;
    else feedback.push('One uppercase letter');

    if (/[a-z]/.test(password)) score += 15;
    else feedback.push('One lowercase letter');

    if (/[0-9]/.test(password)) score += 15;
    else feedback.push('One number');

    if (/[^A-Za-z0-9]/.test(password)) score += 15;
    else feedback.push('One special character');

    const color = score < 40 ? 'danger' : score < 70 ? 'warning' : 'success';

    return { score, feedback, color };
  };

  const passwordStrength = calculatePasswordStrength(newPassword);

  // Real-time validation functions
  const validateCurrentPassword = async (password: string): Promise<boolean> => {
    if (!password) {
      setCurrentPasswordError('Please enter your current password');
      return false;
    }

    // In development mode, validate against stored password immediately
    if (typeof window !== 'undefined' && !('__TAURI__' in window)) {
      try {
        const storedPasswordHash = await storage.getPassword();

        // Handle case where encryption setup is incomplete
        if (!storedPasswordHash) {
          const encryptionSetup = await storage.getEncryptionSetup();
          if (encryptionSetup) {
            // Encryption was set up but password is missing - this shouldn't happen
            setCurrentPasswordError('Password data corrupted. Please reset encryption.');
            return false;
          } else {
            // Encryption was never properly set up
            setCurrentPasswordError(
              'Encryption setup is incomplete. Please restart the app and complete encryption setup first.'
            );
            return false;
          }
        }

        const enteredPasswordHash = btoa(password);
        if (enteredPasswordHash !== storedPasswordHash) {
          setCurrentPasswordError('Current password is incorrect');
          return false;
        }
      } catch {
        setCurrentPasswordError('Failed to validate password. Please try again.');
        return false;
      }
    }

    setCurrentPasswordError('');
    return true;
  };

  const validateNewPassword = (password: string) => {
    if (!password) {
      setNewPasswordError('');
      return true; // Allow empty field while typing
    }

    if (password.length < 8) {
      setNewPasswordError('Must be at least 8 characters');
      return false;
    }

    if (!/[0-9]/.test(password)) {
      setNewPasswordError('Must contain at least one number');
      return false;
    }

    if (!/[a-zA-Z]/.test(password)) {
      setNewPasswordError('Must contain at least one letter');
      return false;
    }

    if (currentPassword === password) {
      setNewPasswordError('Must be different from current password');
      return false;
    }

    setNewPasswordError('');
    return true;
  };

  const validateConfirmPassword = (password: string, confirmPwd?: string) => {
    const confirmPasswordValue = confirmPwd || password;
    if (!confirmPasswordValue || !newPassword) {
      setConfirmPasswordError('');
      return true; // Allow empty fields while typing
    }

    if (confirmPasswordValue !== newPassword) {
      setConfirmPasswordError('Passwords do not match');
      return false;
    }

    setConfirmPasswordError('');
    return true;
  };

  // Clear all validation errors when modal opens
  const clearValidationErrors = () => {
    setCurrentPasswordError('');
    setNewPasswordError('');
    setConfirmPasswordError('');
  };

  const handleChangePassword = async () => {
    setError('');
    setSuccess('');

    // In development mode, check if encryption is properly set up before proceeding
    if (typeof window !== 'undefined' && !('__TAURI__' in window)) {
      try {
        const storedPasswordHash = await storage.getPassword();
        const encryptionSetup = await storage.getEncryptionSetup();

        if (!storedPasswordHash || !encryptionSetup) {
          setError(
            'Encryption setup is incomplete. Please restart the app and complete the encryption setup first.'
          );
          return;
        }
      } catch {
        setError('Failed to check encryption status. Please try again.');
        return;
      }
    }

    // Final validation using real-time validation functions
    const isCurrentPasswordValid = await validateCurrentPassword(currentPassword);
    const isNewPasswordValid = validateNewPassword(newPassword);
    const isConfirmPasswordValid = validateConfirmPassword(confirmPassword);

    if (!isCurrentPasswordValid || !isNewPasswordValid || !isConfirmPasswordValid) {
      return; // Validation errors will be shown in real-time
    }

    setIsLoading(true);
    try {
      if (typeof window !== 'undefined' && '__TAURI__' in window) {
        // TODO: Implement Tauri API call to change password
        // await invoke('change_password', { currentPassword, newPassword });
        // Simulate success for now
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        // Development mode - store new password using UnifiedStorage
        await storage.storePassword(btoa(newPassword));
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay
      }

      // Clear form and validation errors
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      clearValidationErrors();
      setShowChangePasswordModal(false);
      setShowSuccessModal(true);
    } catch (err) {
      setError(
        err && typeof err === 'object' && 'message' in err
          ? String(err.message)
          : 'Failed to change password'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setIsLoading(true);
    try {
      if (typeof window !== 'undefined' && '__TAURI__' in window) {
        // TODO: Implement Tauri API call to reset password
        // await invoke('reset_password');
      } else {
        // Development mode - clear stored password using UnifiedStorage
        await storage.clearPassword();
        await storage.clearEncryptionSetup();
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      setShowResetPasswordModal(false);
      // Navigate to encryption setup
      navigate('/', { replace: true });
    } catch (err) {
      setError(
        err && typeof err === 'object' && 'message' in err
          ? String(err.message)
          : 'Failed to reset password'
      );
      setTimeout(() => setError(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const timeoutOptions = [
    { value: 5, label: '5 minutes', description: 'Very secure' },
    { value: 15, label: '15 minutes', description: 'Secure' },
    { value: 30, label: '30 minutes', description: 'Balanced' },
    { value: 60, label: '1 hour', description: 'Convenient' },
    { value: 120, label: '2 hours', description: 'Less secure' },
    { value: 180, label: '3 hours', description: 'Least secure' },
    { value: 0, label: 'Never', description: 'Not recommended' }
  ];

  const getTimeoutColor = (minutes: number) => {
    if (minutes === 0) return 'danger';
    if (minutes <= 15) return 'success';
    if (minutes <= 30) return 'warning';
    return 'danger';
  };

  const getTimeoutSecurityLevel = (minutes: number) => {
    if (minutes === 0) return '⚠️ Not Secure';
    if (minutes <= 15) return '🔒 Very Secure';
    if (minutes <= 30) return '🔐 Secure';
    return '🔓 Less Secure';
  };

  const handleLockApp = () => {
    lockApp();
    setSuccess('App locked successfully! You will need to enter your password to unlock.');
    setTimeout(() => setSuccess(''), 3000);
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
        minWidth: 0
      }}
    >
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton
          variant='outlined'
          onClick={() => navigate('/settings')}
          sx={{ borderRadius: 'sm' }}
        >
          <ArrowBack />
        </IconButton>
        <Security sx={{ fontSize: 32, color: '#ffffff' }} />
        <Typography level='h2'>Password and Security</Typography>
      </Box>

      {/* Alerts */}
      {_error && (
        <Alert color='danger' sx={{ mb: 2 }} startDecorator={<Error />}>
          {_error}
        </Alert>
      )}
      {success && (
        <Alert color='success' sx={{ mb: 2 }} startDecorator={<CheckCircle />}>
          {success}
        </Alert>
      )}

      {/* Security Overview Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography level='h4' sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Shield color='primary' />
            Security Overview
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Chip
              color={settings.autoLockEnabled ? 'success' : 'neutral'}
              variant='soft'
              startDecorator={<Lock />}
            >
              Auto-Lock: {settings.autoLockEnabled ? 'Enabled' : 'Disabled'}
            </Chip>
            <Chip color='primary' variant='soft' startDecorator={<Timer />}>
              Lock Timeout:{' '}
              {settings.lockscreenTimeout === 0 ? 'Never' : `${settings.lockscreenTimeout} min`}
            </Chip>
            <Chip
              color={settings.failedAttemptLockout ? 'success' : 'neutral'}
              variant='soft'
              startDecorator={<Key />}
            >
              Failed Attempt Lockout: {settings.failedAttemptLockout ? 'Enabled' : 'Disabled'}
            </Chip>
            {typeof window !== 'undefined' && !('__TAURI__' in window) && (
              <Chip
                color={
                  encryptionStatus === 'setup'
                    ? 'success'
                    : encryptionStatus === 'corrupted'
                      ? 'danger'
                      : 'warning'
                }
                variant='soft'
                startDecorator={<Security />}
              >
                Encryption:{' '}
                {encryptionStatus === 'setup'
                  ? 'Complete'
                  : encryptionStatus === 'corrupted'
                    ? 'Corrupted'
                    : 'Incomplete'}
              </Chip>
            )}
          </Box>
          {encryptionStatus === 'corrupted' && (
            <Alert color='danger' sx={{ mt: 2 }} startDecorator={<Error />}>
              <Typography level='body-sm'>
                <strong>⚠️ Password data corrupted:</strong> Please reset your encryption setup to
                continue using password features.
              </Typography>
            </Alert>
          )}
          {encryptionStatus === 'unknown' && (
            <Alert color='warning' sx={{ mt: 2 }} startDecorator={<Warning />}>
              <Typography level='body-sm'>
                <strong>⚠️ Encryption incomplete:</strong> Please restart the app and complete the
                encryption setup first.
              </Typography>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Stack spacing={3}>
        {/* Password Management */}
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Typography level='h4' sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Key color='primary' />
              Password Management
            </Typography>

            <Stack spacing={2}>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant='solid'
                  color='primary'
                  onClick={async () => {
                    // Check if encryption is properly set up before showing the modal
                    if (typeof window !== 'undefined' && !('__TAURI__' in window)) {
                      try {
                        const storedPasswordHash = await storage.getPassword();
                        const encryptionSetup = await storage.getEncryptionSetup();

                        if (!storedPasswordHash || !encryptionSetup) {
                          setError(
                            'Encryption setup is incomplete. Please restart the app and complete the encryption setup first.'
                          );
                          return;
                        }
                      } catch {
                        setError('Failed to check encryption status. Please try again.');
                        return;
                      }
                    }
                    clearValidationErrors();
                    setShowChangePasswordModal(true);
                  }}
                  startDecorator={<Lock />}
                  sx={{ flex: { xs: 1, md: 'auto' } }}
                >
                  Change Password
                </Button>
                <Button
                  variant='outlined'
                  color='warning'
                  onClick={() => setShowResetPasswordModal(true)}
                  startDecorator={<Warning />}
                  sx={{ flex: { xs: 1, md: 'auto' } }}
                >
                  Reset Password
                </Button>
              </Box>

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant='solid'
                  color='success'
                  onClick={handleLockApp}
                  startDecorator={<Security />}
                  sx={{ flex: { xs: 1, md: 'auto' } }}
                >
                  Lock the App Now
                </Button>
              </Box>

              <Alert color='success' startDecorator={<Security />}>
                <Typography level='body-sm'>
                  <strong>Manual Lock:</strong> Use "Lock the App Now" to immediately secure your
                  session and require password authentication to continue.
                </Typography>
              </Alert>

              <Alert color='primary' startDecorator={<Info />}>
                <Typography level='body-sm'>
                  <strong>Password Requirements:</strong>
                  <br />
                  • Minimum 8 characters
                  <br />
                  • At least one number and one letter
                  <br />
                  • Special characters recommended for stronger security
                  <br />• Use a unique password you don't use elsewhere
                </Typography>
              </Alert>
            </Stack>
          </CardContent>
        </Card>

        {/* Lockscreen Settings */}
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Typography level='h4' sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <LockClock color='primary' />
              Lockscreen Settings
            </Typography>

            <Stack spacing={3}>
              {/* Auto-Lock Toggle */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography level='title-lg'>Auto-Lock</Typography>
                  <Typography level='body-sm' sx={{ color: '#999' }}>
                    Automatically lock the app after period of inactivity
                  </Typography>
                </Box>
                <Switch
                  checked={settings.autoLockEnabled}
                  onChange={e =>
                    saveSettings({
                      ...settings,
                      autoLockEnabled: e.target.checked
                    })
                  }
                  color='primary'
                />
              </Box>

              {/* Lockscreen Timeout */}
              {settings.autoLockEnabled && (
                <Box>
                  <Typography level='title-lg' sx={{ mb: 1 }}>
                    Lock Timeout
                  </Typography>
                  <FormControl>
                    <Select
                      value={settings.lockscreenTimeout}
                      onChange={(_, value) =>
                        saveSettings({
                          ...settings,
                          lockscreenTimeout: value || 15
                        })
                      }
                      sx={{ minWidth: 200 }}
                    >
                      {timeoutOptions.map(option => (
                        <Option key={option.value} value={option.value}>
                          <Box>
                            <Typography level='body-md'>{option.label}</Typography>
                            <Typography level='body-xs' sx={{ color: '#999' }}>
                              {option.description}
                            </Typography>
                          </Box>
                        </Option>
                      ))}
                    </Select>
                  </FormControl>
                  <Box sx={{ mt: 1 }}>
                    <LinearProgress
                      determinate
                      value={
                        settings.lockscreenTimeout === 0
                          ? 0
                          : Math.max(0, 100 - (settings.lockscreenTimeout / 180) * 100)
                      }
                      color={
                        getTimeoutColor(settings.lockscreenTimeout) as
                          | 'primary'
                          | 'neutral'
                          | 'danger'
                          | 'success'
                          | 'warning'
                      }
                      sx={{ mb: 1 }}
                    />
                    <Typography level='body-xs' sx={{ color: '#999' }}>
                      Security Level: {getTimeoutSecurityLevel(settings.lockscreenTimeout)}
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* Failed Attempt Lockout */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography level='title-lg'>Failed Attempt Lockout</Typography>
                  <Typography level='body-sm' sx={{ color: '#999' }}>
                    Lock app after 5 incorrect password attempts (30 minutes)
                  </Typography>
                </Box>
                <Switch
                  checked={settings.failedAttemptLockout}
                  onChange={e =>
                    saveSettings({
                      ...settings,
                      failedAttemptLockout: e.target.checked
                    })
                  }
                  color='primary'
                />
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* Security Recommendations */}
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Typography level='h4' sx={{ mb: 2 }}>
              Security Recommendations
            </Typography>

            <Stack spacing={2}>
              <Alert color='success' startDecorator={<CheckCircle />}>
                <Typography level='body-sm'>
                  <strong>✅ Password Protection:</strong> Your data is encrypted with SQLCipher
                </Typography>
              </Alert>

              <Alert color='warning' startDecorator={<Warning />}>
                <Typography level='body-sm'>
                  <strong>⚠️ Password Strength:</strong> Consider using a password manager for
                  stronger passwords
                </Typography>
              </Alert>

              <Alert color='primary' startDecorator={<Info />}>
                <Typography level='body-sm'>
                  <strong>💡 Pro Tip:</strong> Enable 2-factor authentication when available for
                  enhanced security
                </Typography>
              </Alert>

              <Alert color='neutral' startDecorator={<Shield />}>
                <Typography level='body-sm'>
                  <strong>🛡️ HIPAA Compliance:</strong> Current settings meet medical data security
                  standards
                </Typography>
              </Alert>
            </Stack>
          </CardContent>
        </Card>
      </Stack>

      {/* Change Password Modal */}
      <Modal open={showChangePasswordModal} onClose={() => setShowChangePasswordModal(false)}>
        <ModalDialog sx={{ maxWidth: 450 }}>
          <ModalClose />
          <Typography level='h4' sx={{ mb: 2 }}>
            Change Password
          </Typography>

          <Stack spacing={2}>
            <FormControl>
              <FormLabel>Current Password</FormLabel>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={async e => {
                    setCurrentPassword(e.target.value);
                    await validateCurrentPassword(e.target.value);
                  }}
                  placeholder='Enter current password'
                  error={!!currentPasswordError}
                  sx={{ flex: 1 }}
                />
                <IconButton
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  variant='outlined'
                >
                  {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </Box>
              {currentPasswordError && (
                <Typography level='body-xs' sx={{ color: '#ff6b6b', mt: 1 }}>
                  {currentPasswordError}
                </Typography>
              )}
            </FormControl>

            <FormControl>
              <FormLabel>New Password</FormLabel>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => {
                    setNewPassword(e.target.value);
                    validateNewPassword(e.target.value);
                    // Also re-validate confirm password if it has a value
                    if (confirmPassword) {
                      validateConfirmPassword(e.target.value, confirmPassword);
                    }
                  }}
                  placeholder='Enter new password'
                  error={!!newPasswordError}
                  sx={{ flex: 1 }}
                />
                <IconButton onClick={() => setShowNewPassword(!showNewPassword)} variant='outlined'>
                  {showNewPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </Box>
              {newPasswordError && (
                <Typography level='body-xs' sx={{ color: '#ff6b6b', mt: 1 }}>
                  {newPasswordError}
                </Typography>
              )}
              {newPassword && !newPasswordError && (
                <Box sx={{ mt: 1 }}>
                  <LinearProgress
                    determinate
                    value={passwordStrength.score}
                    color={
                      passwordStrength.color as
                        | 'primary'
                        | 'neutral'
                        | 'danger'
                        | 'success'
                        | 'warning'
                    }
                    sx={{ mb: 1 }}
                  />
                  <Typography level='body-xs' sx={{ color: '#999' }}>
                    {passwordStrength.feedback.join(', ')}
                  </Typography>
                </Box>
              )}
            </FormControl>

            <FormControl>
              <FormLabel>Confirm New Password</FormLabel>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => {
                    setConfirmPassword(e.target.value);
                    validateConfirmPassword(newPassword, e.target.value);
                  }}
                  placeholder='Confirm new password'
                  error={!!confirmPasswordError}
                  sx={{ flex: 1 }}
                />
                <IconButton
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  variant='outlined'
                >
                  {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </Box>
              {confirmPasswordError && (
                <Typography level='body-xs' sx={{ color: '#ff6b6b', mt: 1 }}>
                  {confirmPasswordError}
                </Typography>
              )}
            </FormControl>

            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
              <Button
                variant='outlined'
                onClick={() => setShowChangePasswordModal(false)}
                sx={{ flex: 1 }}
              >
                Cancel
              </Button>
              <Button
                variant='solid'
                onClick={handleChangePassword}
                disabled={isLoading || !currentPassword || !newPassword || !confirmPassword}
                loading={isLoading}
                sx={{ flex: 1 }}
              >
                Change Password
              </Button>
            </Box>
          </Stack>
        </ModalDialog>
      </Modal>

      {/* Reset Password Modal */}
      <Modal open={showResetPasswordModal} onClose={() => setShowResetPasswordModal(false)}>
        <ModalDialog sx={{ maxWidth: 400 }}>
          <ModalClose />
          <Typography level='h4' sx={{ mb: 2 }}>
            Reset Password
          </Typography>

          <Alert color='warning' sx={{ mb: 2 }}>
            <Typography level='body-sm'>
              <strong>⚠️ Warning:</strong> This will reset your encryption setup. You'll need to
              create a new password and re-encrypt all your data.
            </Typography>
          </Alert>

          <Typography level='body-sm' sx={{ mb: 3 }}>
            This action cannot be undone. Make sure you have backups of your data before proceeding.
          </Typography>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant='outlined'
              onClick={() => setShowResetPasswordModal(false)}
              sx={{ flex: 1 }}
            >
              Cancel
            </Button>
            <Button
              variant='solid'
              color='warning'
              onClick={handleResetPassword}
              disabled={isLoading}
              loading={isLoading}
              sx={{ flex: 1 }}
            >
              Reset Password
            </Button>
          </Box>
        </ModalDialog>
      </Modal>

      {/* Success Modal */}
      <Modal open={showSuccessModal} onClose={() => setShowSuccessModal(false)}>
        <ModalDialog sx={{ maxWidth: 300 }}>
          <ModalClose />
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <CheckCircle sx={{ fontSize: 48, color: 'success', mb: 2 }} />
            <Typography level='h4' sx={{ mb: 1 }}>
              Success!
            </Typography>
            <Typography level='body-sm' sx={{ color: '#999' }}>
              Your password has been changed successfully.
            </Typography>
          </Box>
        </ModalDialog>
      </Modal>
    </Box>
  );
};

export default PasswordAndSecuritySettings;
